-- Adicionar coluna score à tabela crm_leads
-- Esta coluna armazena a pontuação do lead (0-100)

ALTER TABLE cedro.crm_leads 
ADD COLUMN IF NOT EXISTS score integer DEFAULT 50 CHECK (score >= 0 AND score <= 100);

-- Comentário explicativo
COMMENT ON COLUMN cedro.crm_leads.score IS 'Pontuação do lead de 0 a 100, usado para qualificação e priorização';

-- Atualizar leads existentes com score padrão baseado na fonte
UPDATE cedro.crm_leads 
SET score = CASE 
    WHEN source = 'google' THEN 70
    WHEN source = 'instagram' THEN 60
    WHEN source = 'indicacao' THEN 80
    WHEN source = 'whatsapp' THEN 65
    ELSE 50
END
WHERE score IS NULL;