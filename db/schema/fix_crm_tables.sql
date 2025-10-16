-- Migração para corrigir problemas do CRM
-- Adiciona tabela lead_activities e colunas faltantes em crm_leads

-- ============================================================
-- 1. ADICIONAR COLUNAS FALTANTES NA TABELA crm_leads
-- ============================================================

-- Coluna para atribuir leads a terapeutas
ALTER TABLE cedro.crm_leads 
ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES cedro.users(id) ON DELETE SET NULL;

-- Colunas para gestão de follow-up
ALTER TABLE cedro.crm_leads 
ADD COLUMN IF NOT EXISTS next_action text;

ALTER TABLE cedro.crm_leads 
ADD COLUMN IF NOT EXISTS next_action_date timestamptz;

-- Coluna para rastrear último contato
ALTER TABLE cedro.crm_leads 
ADD COLUMN IF NOT EXISTS last_contact timestamptz;

-- Colunas para conversão de leads
ALTER TABLE cedro.crm_leads 
ADD COLUMN IF NOT EXISTS converted_at timestamptz;

ALTER TABLE cedro.crm_leads 
ADD COLUMN IF NOT EXISTS converted_to_patient_id uuid REFERENCES cedro.patients(id) ON DELETE SET NULL;

-- ============================================================
-- 2. CRIAR TABELA lead_activities
-- ============================================================

CREATE TABLE IF NOT EXISTS cedro.lead_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES cedro.crm_leads(id) ON DELETE CASCADE,
  type text CHECK (type IN ('call', 'email', 'meeting', 'note', 'stage_change', 'score_change', 'converted', 'created', 'contact')) NOT NULL,
  description text NOT NULL,
  created_by uuid REFERENCES cedro.users(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON cedro.lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_created_at ON cedro.lead_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_activities_type ON cedro.lead_activities(type);

-- ============================================================
-- 3. COMENTÁRIOS EXPLICATIVOS
-- ============================================================

COMMENT ON COLUMN cedro.crm_leads.assigned_to IS 'Terapeuta responsável pelo lead';
COMMENT ON COLUMN cedro.crm_leads.next_action IS 'Próxima ação a ser tomada com o lead';
COMMENT ON COLUMN cedro.crm_leads.next_action_date IS 'Data/hora para executar a próxima ação';
COMMENT ON COLUMN cedro.crm_leads.last_contact IS 'Data/hora do último contato com o lead';
COMMENT ON COLUMN cedro.crm_leads.converted_at IS 'Data/hora quando o lead foi convertido em paciente';
COMMENT ON COLUMN cedro.crm_leads.converted_to_patient_id IS 'ID do paciente criado a partir deste lead';

COMMENT ON TABLE cedro.lead_activities IS 'Histórico de atividades e interações com leads';
COMMENT ON COLUMN cedro.lead_activities.type IS 'Tipo de atividade: call, email, meeting, note, stage_change, score_change, converted, created, contact';
COMMENT ON COLUMN cedro.lead_activities.metadata IS 'Dados adicionais da atividade em formato JSON';

-- ============================================================
-- 4. ATUALIZAR LEADS EXISTENTES (OPCIONAL)
-- ============================================================

-- Definir score padrão para leads que não têm (caso a coluna score já exista)
UPDATE cedro.crm_leads 
SET score = CASE 
    WHEN source = 'google' THEN 70
    WHEN source = 'instagram' THEN 60
    WHEN source = 'indicacao' THEN 80
    WHEN source = 'whatsapp' THEN 65
    ELSE 50
END
WHERE score IS NULL;

-- Criar atividade inicial para leads existentes que não têm atividades
INSERT INTO cedro.lead_activities (lead_id, type, description, created_by, created_at)
SELECT 
    id,
    'created',
    'Lead importado do sistema anterior',
    NULL,
    created_at
FROM cedro.crm_leads
WHERE id NOT IN (SELECT DISTINCT lead_id FROM cedro.lead_activities WHERE lead_id IS NOT NULL);