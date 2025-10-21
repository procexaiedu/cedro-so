# Resumo da Integração N8N - Sistema Cedro

## ✅ Implementações Concluídas

### 1. Modificação da API de Processamento
- **Arquivo:** `src/app/api/audio/process/route.ts`
- **Mudanças:**
  - Removido processamento local de áudio (FFmpeg, Whisper, OpenAI)
  - Implementado disparo de webhook para n8n
  - Geração de URL presigned para download do áudio
  - Atualização de status para 'processing_n8n'

### 2. API de Callback do N8N
- **Arquivo:** `src/app/api/n8n/callback/route.ts`
- **Funcionalidades:**
  - Recebe resultados do processamento n8n
  - Atualiza tabela `recording_jobs`
  - Cria registro na tabela `medical_records`
  - Tratamento de erros e validações

### 3. API de Monitoramento
- **Arquivo:** `src/app/api/recording-jobs/[id]/route.ts`
- **Funcionalidades:**
  - Consulta status de jobs (GET)
  - Atualização de jobs (PATCH)
  - Cálculo de duração de processamento
  - Informações sobre prontuário médico criado

### 4. Documentação Completa
- **Arquivos:**
  - `docs/n8n-workflow-adaptation.md` - Guia de adaptação do workflow
  - `docs/n8n-minio-integration.md` - Integração específica com MinIO
  - `docs/integration-summary.md` - Este resumo

### 5. Script de Teste
- **Arquivo:** `scripts/test-n8n-integration.js`
- **Funcionalidades:**
  - Teste completo do fluxo
  - Teste isolado do callback
  - Monitoramento de status
  - Simulação de dados

## 🔄 Fluxo de Dados Implementado

```
1. Upload de Áudio
   Cliente → /api/audio/upload → MinIO + Supabase

2. Disparo do Processamento
   Cliente → /api/audio/process → Webhook N8N

3. Processamento N8N
   N8N → Download (MinIO) → FFmpeg → Whisper → OpenAI

4. Callback
   N8N → /api/n8n/callback → Supabase (jobs + records)

5. Monitoramento
   Cliente → /api/recording-jobs/[id] → Status
```

## 📋 Estrutura de Dados

### Webhook Payload (Cedro → N8N)
```json
{
  "recording_job_id": "uuid",
  "patient_id": "uuid",
  "therapist_id": "uuid", 
  "appointment_id": "uuid",
  "note_type": "anamnesis|consultation|evolution",
  "audio_presigned_url": "https://minio.../file.mp3?...",
  "audio_storage_url": "path/to/file.mp3",
  "audio_original_filename": "recording.mp3"
}
```

### Callback Payload (N8N → Cedro)
```json
{
  "recording_job_id": "uuid",
  "patient_id": "uuid",
  "therapist_id": "uuid",
  "texto_transcricao_bruta": "Transcrição completa...",
  "texto_rascunho": "Prontuário estruturado...",
  "structured_record": {
    "tipo": "soap",
    "titulo": "Teleconsulta - Data",
    "conteudo": "Conteúdo estruturado...",
    "resumo_executivo": "Resumo...",
    "palavras_chave": ["keyword1", "keyword2"]
  }
}
```

## ⚙️ Configuração Necessária

### Variáveis de Ambiente
```env
# N8N Integration
N8N_WEBHOOK_URL=https://seu-n8n.com/webhook/cedro-audio-processing

# MinIO (já existente)
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=audio-recordings
MINIO_USE_SSL=false
```

### Adaptações no Workflow N8N

#### 1. Webhook Input
- URL: `https://seu-n8n.com/webhook/cedro-audio-processing`
- Método: POST
- Recebe dados do sistema Cedro

#### 2. Download de Áudio
```
URL: {{ $('Webhook').item.json.body.audio_presigned_url }}
```

#### 3. Salvamento
```
fileName: /prontuarios/audio.{{ $node["Webhook"].json.body.audio_original_filename.split('.').pop() }}
```

#### 4. Callback Final
```
URL: https://seu-dominio.com/api/n8n/callback
Payload: Dados processados + recording_job_id
```

## 🧪 Como Testar

### 1. Teste Completo
```bash
cd scripts
node test-n8n-integration.js full
```

### 2. Teste Apenas Callback
```bash
node test-n8n-integration.js callback
```

### 3. Teste Manual
1. Upload de áudio via `/api/audio/upload`
2. Disparo via `/api/audio/process`
3. Monitoramento via `/api/recording-jobs/[id]`

## 🔍 Monitoramento

### Pontos de Verificação:
1. **Status do Job:** `recording_jobs.status`
   - `pending` → `processing_n8n` → `completed`
2. **Logs de Webhook:** Console da API process
3. **Logs de Callback:** Console da API callback
4. **Logs N8N:** Interface do n8n

### Métricas Importantes:
- Tempo de processamento total
- Taxa de sucesso dos webhooks
- Taxa de sucesso dos callbacks
- Tamanho médio dos arquivos processados

## 🚨 Troubleshooting

### Problemas Comuns:

1. **Webhook não disparado**
   - Verificar `N8N_WEBHOOK_URL`
   - Verificar conectividade de rede
   - Verificar logs da API process

2. **Download falha no N8N**
   - Verificar URL presigned válida
   - Verificar conectividade com MinIO
   - Verificar expiração da URL

3. **Callback não recebido**
   - Verificar URL do callback no n8n
   - Verificar logs da API callback
   - Verificar formato do payload

4. **Prontuário não criado**
   - Verificar dados do callback
   - Verificar estrutura do `structured_record`
   - Verificar logs do Supabase

## 🎯 Próximos Passos

1. **Configurar N8N em produção**
2. **Adaptar workflow existente**
3. **Configurar monitoramento avançado**
4. **Implementar retry logic**
5. **Configurar alertas de falha**

## 📊 Benefícios da Integração

- ✅ **Separação de responsabilidades**
- ✅ **Escalabilidade independente**
- ✅ **Facilidade de manutenção**
- ✅ **Reutilização do workflow existente**
- ✅ **Monitoramento centralizado**
- ✅ **Tratamento robusto de erros**