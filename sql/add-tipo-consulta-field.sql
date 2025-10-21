-- Adicionar campo tipo_consulta na tabela recording_jobs
-- Execute este SQL no seu banco de dados

ALTER TABLE cedro.recording_jobs 
ADD COLUMN IF NOT EXISTS tipo_consulta VARCHAR(20) DEFAULT 'evolucao' CHECK (tipo_consulta IN ('anamnese', 'evolucao'));

-- Adicionar comentário na coluna
COMMENT ON COLUMN cedro.recording_jobs.tipo_consulta IS 'Tipo de consulta: anamnese (primeira consulta) ou evolucao (consulta regular)';

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_recording_jobs_tipo_consulta ON cedro.recording_jobs(tipo_consulta);

-- Verificar se a coluna foi adicionada
SELECT column_name, data_type, column_default, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'cedro' 
  AND table_name = 'recording_jobs' 
  AND column_name = 'tipo_consulta';