-- Migração para corrigir a view vw_patient_overview
-- Corrige o problema de relacionamento e nomes de colunas

-- Remover view existente
DROP VIEW IF EXISTS cedro.vw_patient_overview;

-- Recriar view com as colunas corretas
CREATE OR REPLACE VIEW cedro.vw_patient_overview AS
SELECT
  p.id as patient_id,
  p.full_name,
  p.email,
  p.phone,
  p.birth_date,
  p.gender,
  p.cpf,
  p.is_christian,
  p.origin,
  p.marital_status,
  p.occupation,
  p.notes,
  p.address_json,
  p.tags_text,
  p.is_on_hold,
  p.created_at,
  p.updated_at,
  
  -- Terapeuta atual
  l.therapist_id as current_therapist_id,
  u.name as current_therapist_name,
  
  -- Estatísticas de agendamentos
  COALESCE(stats.total_appointments, 0) as total_appointments,
  stats.last_appointment,
  stats.next_appointment,
  
  -- Planos ativos
  COALESCE(plans.active_plans, 0) as active_plans,
  
  -- Próximos agendamentos
  COALESCE(upcoming.upcoming_appointments, 0) as upcoming_appointments

FROM cedro.patients p

-- Terapeuta atual (ativo)
LEFT JOIN cedro.patient_therapist_links l 
  ON l.patient_id = p.id AND l.status = 'active'
LEFT JOIN cedro.users u 
  ON u.id = l.therapist_id

-- Estatísticas de agendamentos
LEFT JOIN (
  SELECT 
    patient_id,
    COUNT(*) as total_appointments,
    MAX(CASE WHEN status = 'completed' THEN scheduled_at END) as last_appointment,
    MIN(CASE WHEN status IN ('scheduled', 'confirmed') AND scheduled_at > NOW() THEN scheduled_at END) as next_appointment
  FROM cedro.appointments
  GROUP BY patient_id
) stats ON stats.patient_id = p.id

-- Planos ativos
LEFT JOIN (
  SELECT 
    patient_id,
    COUNT(*) as active_plans
  FROM cedro.care_plans
  WHERE status = 'active'
  GROUP BY patient_id
) plans ON plans.patient_id = p.id

-- Agendamentos futuros
LEFT JOIN (
  SELECT 
    patient_id,
    COUNT(*) as upcoming_appointments
  FROM cedro.appointments
  WHERE status IN ('scheduled', 'confirmed') 
    AND scheduled_at > NOW()
  GROUP BY patient_id
) upcoming ON upcoming.patient_id = p.id;

-- Comentários para documentação
COMMENT ON VIEW cedro.vw_patient_overview IS 'View completa de pacientes com todas as informações necessárias para a interface Patient';
COMMENT ON COLUMN cedro.vw_patient_overview.patient_id IS 'ID único do paciente';
COMMENT ON COLUMN cedro.vw_patient_overview.current_therapist_id IS 'ID do terapeuta atualmente responsável';
COMMENT ON COLUMN cedro.vw_patient_overview.total_appointments IS 'Total de agendamentos do paciente';
COMMENT ON COLUMN cedro.vw_patient_overview.last_appointment IS 'Data do último agendamento concluído';
COMMENT ON COLUMN cedro.vw_patient_overview.next_appointment IS 'Data do próximo agendamento agendado';