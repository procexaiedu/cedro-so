-- Otimizações de performance para o sistema Cedro

-- Índices para tabela appointments
CREATE INDEX IF NOT EXISTS idx_appointments_start_at ON cedro.appointments(start_at);
CREATE INDEX IF NOT EXISTS idx_appointments_therapist_id ON cedro.appointments(therapist_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON cedro.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON cedro.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_date_range ON cedro.appointments(start_at, end_at);

-- Índice composto para queries mais comuns
CREATE INDEX IF NOT EXISTS idx_appointments_therapist_date ON cedro.appointments(therapist_id, start_at);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_date ON cedro.appointments(patient_id, start_at);

-- Índices para tabela patients
CREATE INDEX IF NOT EXISTS idx_patients_full_name ON cedro.patients(full_name);
CREATE INDEX IF NOT EXISTS idx_patients_email ON cedro.patients(email);
CREATE INDEX IF NOT EXISTS idx_patients_status ON cedro.patients(status);
CREATE INDEX IF NOT EXISTS idx_patients_created_at ON cedro.patients(created_at);

-- Índices para tabela users (therapists)
CREATE INDEX IF NOT EXISTS idx_users_name ON cedro.users(name);
CREATE INDEX IF NOT EXISTS idx_users_email ON cedro.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON cedro.users(role);

-- Índices para tabela patient_therapist_links
CREATE INDEX IF NOT EXISTS idx_patient_therapist_patient_id ON cedro.patient_therapist_links(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_therapist_therapist_id ON cedro.patient_therapist_links(therapist_id);
CREATE INDEX IF NOT EXISTS idx_patient_therapist_active ON cedro.patient_therapist_links(is_active);

-- View otimizada para agendamentos com dados relacionados
CREATE OR REPLACE VIEW cedro.appointments_with_details AS
SELECT 
    a.id,
    a.patient_id,
    a.therapist_id,
    a.service_id,
    a.care_plan_id,
    a.status,
    a.start_at,
    a.end_at,
    a.notes,
    a.created_at,
    a.updated_at,
    p.full_name as patient_name,
    p.email as patient_email,
    p.phone as patient_phone,
    u.name as therapist_name,
    u.email as therapist_email,
    s.name as service_name,
    s.duration as service_duration,
    s.price as service_price
FROM cedro.appointments a
LEFT JOIN cedro.patients p ON a.patient_id = p.id
LEFT JOIN cedro.users u ON a.therapist_id = u.id
LEFT JOIN cedro.services s ON a.service_id = s.id;

-- View otimizada para pacientes com dados do terapeuta
CREATE OR REPLACE VIEW cedro.patients_with_therapist AS
SELECT 
    p.id,
    p.full_name,
    p.email,
    p.phone,
    p.birth_date,
    p.gender,
    p.status,
    p.created_at,
    p.updated_at,
    u.name as therapist_name,
    u.id as therapist_id,
    ptl.created_at as link_created_at,
    ptl.is_active as link_active,
    -- Estatísticas de agendamentos
    (SELECT COUNT(*) FROM cedro.appointments WHERE patient_id = p.id) as total_appointments,
    (SELECT COUNT(*) FROM cedro.appointments WHERE patient_id = p.id AND status = 'completed') as completed_appointments,
    (SELECT MAX(start_at) FROM cedro.appointments WHERE patient_id = p.id AND status = 'completed') as last_appointment
FROM cedro.patients p
LEFT JOIN cedro.patient_therapist_links ptl ON p.id = ptl.patient_id AND ptl.is_active = true
LEFT JOIN cedro.users u ON ptl.therapist_id = u.id;

-- Função para buscar agendamentos otimizada
CREATE OR REPLACE FUNCTION cedro.get_appointments_optimized(
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    therapist_id_param uuid DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    patient_id uuid,
    therapist_id uuid,
    service_id uuid,
    care_plan_id uuid,
    status text,
    start_at timestamp with time zone,
    end_at timestamp with time zone,
    notes text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    patient_name text,
    patient_email text,
    therapist_name text,
    service_name text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        awd.id,
        awd.patient_id,
        awd.therapist_id,
        awd.service_id,
        awd.care_plan_id,
        awd.status,
        awd.start_at,
        awd.end_at,
        awd.notes,
        awd.created_at,
        awd.updated_at,
        awd.patient_name,
        awd.patient_email,
        awd.therapist_name,
        awd.service_name
    FROM cedro.appointments_with_details awd
    WHERE awd.start_at >= start_date
      AND awd.start_at <= end_date
      AND (therapist_id_param IS NULL OR awd.therapist_id = therapist_id_param)
    ORDER BY awd.start_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Função para buscar pacientes com paginação otimizada
CREATE OR REPLACE FUNCTION cedro.get_patients_paginated(
    page_size integer DEFAULT 20,
    page_offset integer DEFAULT 0,
    search_term text DEFAULT NULL,
    therapist_filter uuid DEFAULT NULL,
    status_filter text DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    full_name text,
    email text,
    phone text,
    birth_date date,
    gender text,
    status text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    therapist_name text,
    therapist_id uuid,
    total_appointments bigint,
    completed_appointments bigint,
    last_appointment timestamp with time zone,
    total_count bigint
) AS $$
DECLARE
    total_records bigint;
BEGIN
    -- Primeiro, contar o total de registros
    SELECT COUNT(*) INTO total_records
    FROM cedro.patients_with_therapist pwt
    WHERE (search_term IS NULL OR 
           pwt.full_name ILIKE '%' || search_term || '%' OR 
           pwt.email ILIKE '%' || search_term || '%')
      AND (therapist_filter IS NULL OR pwt.therapist_id = therapist_filter)
      AND (status_filter IS NULL OR pwt.status = status_filter);

    -- Retornar os dados paginados
    RETURN QUERY
    SELECT 
        pwt.id,
        pwt.full_name,
        pwt.email,
        pwt.phone,
        pwt.birth_date,
        pwt.gender,
        pwt.status,
        pwt.created_at,
        pwt.updated_at,
        pwt.therapist_name,
        pwt.therapist_id,
        pwt.total_appointments,
        pwt.completed_appointments,
        pwt.last_appointment,
        total_records as total_count
    FROM cedro.patients_with_therapist pwt
    WHERE (search_term IS NULL OR 
           pwt.full_name ILIKE '%' || search_term || '%' OR 
           pwt.email ILIKE '%' || search_term || '%')
      AND (therapist_filter IS NULL OR pwt.therapist_id = therapist_filter)
      AND (status_filter IS NULL OR pwt.status = status_filter)
    ORDER BY pwt.full_name ASC
    LIMIT page_size
    OFFSET page_offset;
END;
$$ LANGUAGE plpgsql;

-- Comentários sobre as otimizações
COMMENT ON INDEX cedro.idx_appointments_start_at IS 'Índice para consultas por data de agendamento';
COMMENT ON INDEX cedro.idx_appointments_therapist_date IS 'Índice composto para consultas por terapeuta e data';
COMMENT ON VIEW cedro.appointments_with_details IS 'View otimizada com dados relacionados de agendamentos';
COMMENT ON FUNCTION cedro.get_appointments_optimized IS 'Função otimizada para buscar agendamentos com filtros';
COMMENT ON FUNCTION cedro.get_patients_paginated IS 'Função otimizada para buscar pacientes com paginação';