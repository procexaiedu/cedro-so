# 🧠 Sistema de Prompts Dinâmicos - N8N Integration

## 📋 **Visão Geral**

Este documento explica como configurar o n8n para usar prompts dinâmicos da tabela `cedro.cerebro`, permitindo que o terapeuta escolha entre diferentes tipos de consulta (anamnese ou evolução).

## 🗄️ **Estrutura da Tabela `cedro.cerebro`**

```sql
CREATE TABLE cedro.cerebro (
    id SERIAL PRIMARY KEY,
    modulo VARCHAR(50) NOT NULL UNIQUE, -- 'anamnese', 'evolucao'
    nome_display VARCHAR(100) NOT NULL,
    system_prompt TEXT NOT NULL,
    descricao TEXT,
    versao VARCHAR(10) DEFAULT '1.0',
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 📨 **Payload do Webhook Atualizado**

O webhook agora inclui o campo `tipo_consulta`:

```json
{
  "recording_job_id": "123",
  "patient_id": "456",
  "therapist_id": "789",
  "appointment_id": "101112",
  "tipo_consulta": "anamnese", // ou "evolucao"
  "audio_url_assinada": "https://...",
  "audio_original_filename": "audio.webm",
  "storage_path_do_audio": "path/to/audio"
}
```

## 🔧 **Configuração do N8N Workflow**

### **1. Adicionar Nó Postgres - Buscar Prompt**

**Posição:** Entre o webhook e o gerador de prontuário

**Configuração:**
- **Node Type:** Postgres
- **Operation:** Execute Query
- **Query:**
```sql
SELECT system_prompt 
FROM cedro.cerebro 
WHERE modulo = $1 AND ativo = true
LIMIT 1
```

**Parameters:**
```json
[
  "{{ $('Webhook').item.json.body.tipo_consulta }}"
]
```

### **2. Modificar Nó "gerador-prontuario"**

**System Message:** Use o prompt dinâmico
```
{{ $('Postgres').item.json.system_prompt }}
```

**User Message:**
```
Analise a seguinte transcrição de teleconsulta e gere um prontuário clínico estruturado:

{{ $('Set Message from Audio').item.json.message }}

Retorne APENAS o JSON estruturado conforme o formato especificado.
```

### **3. Configuração de Conexão Postgres**

**Credenciais necessárias:**
- **Host:** Seu host do Supabase
- **Database:** postgres
- **Username:** Seu usuário
- **Password:** Sua senha
- **Port:** 5432
- **SSL:** true

## 🔄 **Fluxo Completo Atualizado**

```
1. Webhook (recebe payload com tipo_consulta)
   ↓
2. Download Audio (usando audio_url_assinada)
   ↓
3. Save Audio File
   ↓
4. FFmpeg Processing
   ↓
5. Whisper Transcription
   ↓
6. Set Message from Audio
   ↓
7. **NOVO:** Postgres - Buscar Prompt (usando tipo_consulta)
   ↓
8. Gerador Prontuário (usando prompt dinâmico)
   ↓
9. HTTP Request - Callback
```

## 📝 **Exemplo de Configuração do Nó Postgres**

### **Node Settings:**
```json
{
  "parameters": {
    "operation": "executeQuery",
    "query": "SELECT system_prompt FROM cedro.cerebro WHERE modulo = $1 AND ativo = true LIMIT 1",
    "additionalFields": {
      "queryParameters": "={{ [$('Webhook').item.json.body.tipo_consulta] }}"
    }
  }
}
```

### **Error Handling:**
Adicione um nó de fallback caso o prompt não seja encontrado:

```sql
SELECT 
  COALESCE(
    (SELECT system_prompt FROM cedro.cerebro WHERE modulo = $1 AND ativo = true LIMIT 1),
    (SELECT system_prompt FROM cedro.cerebro WHERE modulo = 'evolucao' AND ativo = true LIMIT 1)
  ) as system_prompt
```

## 🧪 **Testando o Sistema**

### **1. Teste com Anamnese:**
```json
{
  "tipo_consulta": "anamnese"
}
```
**Resultado esperado:** Prompt estruturado para primeira consulta

### **2. Teste com Evolução:**
```json
{
  "tipo_consulta": "evolucao"
}
```
**Resultado esperado:** Prompt estruturado para consulta regular

## 🔍 **Queries Úteis para Debug**

### **Verificar prompts disponíveis:**
```sql
SELECT modulo, nome_display, ativo, created_at 
FROM cedro.cerebro 
ORDER BY modulo;
```

### **Testar busca de prompt:**
```sql
SELECT system_prompt 
FROM cedro.cerebro 
WHERE modulo = 'anamnese' AND ativo = true;
```

## ⚠️ **Considerações Importantes**

1. **Fallback:** Sempre configure um fallback para 'evolucao' caso o tipo não seja encontrado
2. **Performance:** A query é simples e rápida, mas considere cache se necessário
3. **Versionamento:** Use o campo `versao` para controlar mudanças nos prompts
4. **Ativação:** Use o campo `ativo` para desabilitar prompts sem deletá-los

## 🚀 **Próximos Passos**

1. Execute os SQLs para criar a tabela e inserir os prompts
2. Adicione o nó Postgres no seu workflow n8n
3. Configure as credenciais de conexão
4. Teste com diferentes tipos de consulta
5. Monitore os logs para garantir funcionamento correto

## 📊 **Monitoramento**

Para monitorar o uso dos prompts:

```sql
-- Adicionar log de uso (opcional)
CREATE TABLE cedro.cerebro_usage_log (
    id SERIAL PRIMARY KEY,
    modulo VARCHAR(50),
    recording_job_id VARCHAR(100),
    used_at TIMESTAMP DEFAULT NOW()
);
```