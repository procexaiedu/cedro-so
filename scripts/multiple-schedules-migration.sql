-- Migration: Allow Multiple Schedule Slots Per Day
-- This migration enables therapists to have multiple time slots on the same day

-- Step 1: Add a unique constraint name to prevent conflicts
-- (The current table structure already allows multiple schedules per day/therapist)
-- We just need to ensure there are no overlapping time slots

-- Step 2: Create a function to check for overlapping schedules
CREATE OR REPLACE FUNCTION cedro.check_schedule_overlap()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if there's an overlapping schedule for the same therapist and weekday
    IF EXISTS (
        SELECT 1 
        FROM cedro.therapist_schedules 
        WHERE therapist_id = NEW.therapist_id 
        AND weekday = NEW.weekday
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        AND (
            -- New schedule starts during existing schedule
            (NEW.start_time >= start_time AND NEW.start_time < end_time)
            OR
            -- New schedule ends during existing schedule  
            (NEW.end_time > start_time AND NEW.end_time <= end_time)
            OR
            -- New schedule completely contains existing schedule
            (NEW.start_time <= start_time AND NEW.end_time >= end_time)
        )
    ) THEN
        RAISE EXCEPTION 'Horário conflita com um horário existente para este terapeuta no mesmo dia da semana';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create trigger to prevent overlapping schedules
DROP TRIGGER IF EXISTS prevent_schedule_overlap ON cedro.therapist_schedules;
CREATE TRIGGER prevent_schedule_overlap
    BEFORE INSERT OR UPDATE ON cedro.therapist_schedules
    FOR EACH ROW
    EXECUTE FUNCTION cedro.check_schedule_overlap();

-- Step 4: Add index for better performance on schedule queries
CREATE INDEX IF NOT EXISTS idx_therapist_schedules_therapist_weekday 
ON cedro.therapist_schedules(therapist_id, weekday, start_time);

-- Step 5: Add comments for documentation
COMMENT ON TABLE cedro.therapist_schedules IS 'Horários regulares dos terapeutas. Permite múltiplos horários por dia da semana, mas não permite sobreposição.';
COMMENT ON FUNCTION cedro.check_schedule_overlap() IS 'Função que verifica se há sobreposição de horários para o mesmo terapeuta no mesmo dia da semana.';

-- Step 6: Create a view for easier querying of therapist availability
CREATE OR REPLACE VIEW cedro.vw_therapist_availability AS
SELECT 
    ts.id,
    ts.therapist_id,
    u.name as therapist_name,
    ts.weekday,
    CASE ts.weekday
        WHEN 0 THEN 'Domingo'
        WHEN 1 THEN 'Segunda-feira'
        WHEN 2 THEN 'Terça-feira'
        WHEN 3 THEN 'Quarta-feira'
        WHEN 4 THEN 'Quinta-feira'
        WHEN 5 THEN 'Sexta-feira'
        WHEN 6 THEN 'Sábado'
    END as weekday_name,
    ts.start_time,
    ts.end_time,
    ts.note,
    ts.created_at,
    ts.updated_at
FROM cedro.therapist_schedules ts
JOIN cedro.users u ON ts.therapist_id = u.id
ORDER BY ts.therapist_id, ts.weekday, ts.start_time;

COMMENT ON VIEW cedro.vw_therapist_availability IS 'Visão consolidada da disponibilidade dos terapeutas com nomes legíveis dos dias da semana.';