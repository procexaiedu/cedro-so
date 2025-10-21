-- Tabela para armazenar system prompts do sistema Cedro
-- Schema: cedro.cerebro

CREATE TABLE IF NOT EXISTS cedro.cerebro (
    id SERIAL PRIMARY KEY,
    modulo VARCHAR(50) NOT NULL UNIQUE, -- 'anamnese', 'evolucao', etc.
    nome_display VARCHAR(100) NOT NULL, -- Nome amigável para exibição
    system_prompt TEXT NOT NULL, -- O prompt completo
    descricao TEXT, -- Descrição do que o prompt faz
    versao VARCHAR(10) DEFAULT '1.0', -- Controle de versão
    ativo BOOLEAN DEFAULT true, -- Se o prompt está ativo
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(100), -- Quem criou/editou
    
    -- Índices para performance
    CONSTRAINT unique_modulo_ativo UNIQUE (modulo, ativo) DEFERRABLE INITIALLY DEFERRED
);

-- Índices para otimização
CREATE INDEX idx_cerebro_modulo ON cedro.cerebro(modulo);
CREATE INDEX idx_cerebro_ativo ON cedro.cerebro(ativo);
CREATE INDEX idx_cerebro_modulo_ativo ON cedro.cerebro(modulo, ativo);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_cerebro_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_cerebro_updated_at
    BEFORE UPDATE ON cedro.cerebro
    FOR EACH ROW
    EXECUTE FUNCTION update_cerebro_updated_at();

-- Comentários na tabela
COMMENT ON TABLE cedro.cerebro IS 'Tabela para armazenar system prompts do sistema Cedro';
COMMENT ON COLUMN cedro.cerebro.modulo IS 'Identificador único do módulo (anamnese, evolucao, etc.)';
COMMENT ON COLUMN cedro.cerebro.nome_display IS 'Nome amigável para exibição na interface';
COMMENT ON COLUMN cedro.cerebro.system_prompt IS 'Prompt completo para o modelo de IA';
COMMENT ON COLUMN cedro.cerebro.descricao IS 'Descrição detalhada do que o prompt faz';
COMMENT ON COLUMN cedro.cerebro.versao IS 'Versão do prompt para controle de mudanças';
COMMENT ON COLUMN cedro.cerebro.ativo IS 'Indica se o prompt está ativo e pode ser usado';