CREATE OR REPLACE FUNCTION cedro.sync_user_id(email_input text, auth_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = cedro, public
AS $$
DECLARE
    old_user_record RECORD;
BEGIN
    -- Busca usuário pelo email
    SELECT * INTO old_user_record FROM cedro.users WHERE email = email_input;

    IF old_user_record IS NULL THEN
        RETURN json_build_object('status', 'not_found');
    END IF;

    -- Se IDs já são iguais, retorna sucesso
    IF old_user_record.id = auth_id THEN
        RETURN json_build_object('status', 'synced', 'id', old_user_record.id);
    END IF;

    -- Se IDs são diferentes, inicia migração
    
    -- 1. Update email do user antigo para algo temporário para liberar a constraint UNIQUE
    UPDATE cedro.users SET email = 'temp_' || old_user_record.id || '_' || email_input WHERE id = old_user_record.id;
    
    -- 2. Insert user novo com ID correto e dados copiados
    INSERT INTO cedro.users (
        id, name, email, phone, role, gender, approaches, 
        is_active, created_at, updated_at, google_calendar_id
    )
    VALUES (
        auth_id, old_user_record.name, email_input, old_user_record.phone, 
        old_user_record.role, old_user_record.gender, old_user_record.approaches, 
        old_user_record.is_active, old_user_record.created_at, now(), 
        old_user_record.google_calendar_id
    );
    
    -- 3. Atualizar tabelas filhas para apontar para o novo ID
    UPDATE cedro.invoices SET therapist_id = auth_id WHERE therapist_id = old_user_record.id;
    UPDATE cedro.appointments SET therapist_id = auth_id WHERE therapist_id = old_user_record.id;
    UPDATE cedro.care_plans SET therapist_id = auth_id WHERE therapist_id = old_user_record.id;
    UPDATE cedro.recording_jobs SET therapist_id = auth_id WHERE therapist_id = old_user_record.id;
    UPDATE cedro.patients SET therapist_id = auth_id WHERE therapist_id = old_user_record.id;
    UPDATE cedro.contracts SET therapist_id = auth_id WHERE therapist_id = old_user_record.id;
    UPDATE cedro.medical_records SET signed_by = auth_id WHERE signed_by = old_user_record.id;
    UPDATE cedro.therapist_schedule_exceptions SET therapist_id = auth_id WHERE therapist_id = old_user_record.id;
    UPDATE cedro.google_calendar_channels SET therapist_id = auth_id WHERE therapist_id = old_user_record.id;
    UPDATE cedro.therapist_schedules SET therapist_id = auth_id WHERE therapist_id = old_user_record.id;
    UPDATE cedro.patient_therapist_links SET therapist_id = auth_id WHERE therapist_id = old_user_record.id;

    -- 4. Delete antigo user temporário
    DELETE FROM cedro.users WHERE id = old_user_record.id;

    RETURN json_build_object('status', 'migrated', 'old_id', old_user_record.id, 'new_id', auth_id);
END;
$$;

GRANT EXECUTE ON FUNCTION cedro.sync_user_id TO authenticated, service_role;
