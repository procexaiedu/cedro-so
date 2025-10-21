# Integração N8N com MinIO - Sistema Cedro

## Visão Geral
Este documento detalha como configurar o n8n para trabalhar com MinIO em vez do Supabase Storage.

## Mudanças no Workflow N8N

### 1. Nó de Download de Áudio

**Antes (Supabase):**
```json
{
  "url": "{{ $('Webhook').item.json.body.audio_url_assinada }}"
}
```

**Depois (MinIO via Cedro):**
```json
{
  "url": "{{ $('Webhook').item.json.body.audio_presigned_url }}"
}
```

### 2. Estrutura de Dados do Webhook

O webhook agora receberá dados do sistema Cedro com a seguinte estrutura:

```json
{
  "recording_job_id": "b8663d64-ae50-4acc-816d-84f71da9cea5",
  "patient_id": "patient-uuid",
  "therapist_id": "93853d82-49d1-4b93-9b5a-295db89f82d9",
  "appointment_id": "appointment-uuid",
  "note_type": "anamnesis",
  "audio_presigned_url": "https://minio.cedro.com/audio-bucket/path/to/file.mp3?X-Amz-Algorithm=...",
  "audio_storage_url": "path/to/file.mp3",
  "audio_original_filename": "gravacao_telemedicina_2025-01-15T17-41-41-733Z.mp3"
}
```

### 3. Configuração do Nó HTTP Request para Download

**Configuração atualizada:**
- **Method:** GET
- **URL:** `{{ $('Webhook').item.json.body.audio_presigned_url }}`
- **Response Format:** file
- **Options:** 
  - Response → Response Format: file

### 4. Salvamento do Arquivo de Áudio

**Nó:** Save Audio File
**Configuração:**
```
fileName: /prontuarios/audio.{{ $node["Webhook"].json.body.audio_original_filename.split('.').pop() }}
```

### 5. Comando FFmpeg Atualizado

O comando FFmpeg permanece o mesmo, mas agora usa o arquivo baixado do MinIO:

```bash
/usr/bin/ffmpeg -i /prontuarios/audio.{{ $node["Webhook"].json.body.audio_original_filename.split('.').pop() }} -f segment -segment_time 600 -vn -ar 16000 -ac 1 -b:a 64k /prontuarios/chunk_%03d.mp3
```

## Configuração do Sistema Cedro

### Variáveis de Ambiente

Adicione ao arquivo `.env`:

```env
# N8N Integration
N8N_WEBHOOK_URL=https://seu-n8n.com/webhook/cedro-audio-processing
N8N_CALLBACK_SECRET=seu-secret-aqui

# MinIO Configuration (já existente)
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=audio-recordings
MINIO_USE_SSL=false
```

### Geração de URL Presigned

O sistema Cedro já gera URLs presigned através da função `getPresignedUrl` em `src/lib/minio.ts`. Esta URL é incluída no payload do webhook.

## Fluxo de Dados Detalhado

### 1. Upload de Áudio
```
Cliente → API Upload → MinIO → Supabase (recording_jobs)
```

### 2. Processamento
```
API Process → Gera URL Presigned → Dispara Webhook N8N
```

### 3. N8N Workflow
```
Webhook → Download (MinIO) → FFmpeg Split → Whisper → OpenAI → Callback
```

### 4. Callback
```
N8N → API Callback → Supabase (recording_jobs + medical_records)
```

## Exemplo de Payload do Webhook N8N

### Dados Recebidos (Webhook Input):
```json
{
  "recording_job_id": "uuid",
  "patient_id": "uuid",
  "therapist_id": "uuid", 
  "appointment_id": "uuid",
  "note_type": "anamnesis",
  "audio_presigned_url": "https://minio.cedro.com/...",
  "audio_storage_url": "path/to/file.mp3",
  "audio_original_filename": "recording.mp3"
}
```

### Dados Enviados (Callback Output):
```json
{
  "recording_job_id": "uuid",
  "patient_id": "uuid",
  "therapist_id": "uuid",
  "texto_transcricao_bruta": "Transcrição completa...",
  "texto_rascunho": "Prontuário estruturado...",
  "structured_record": {
    "tipo": "soap",
    "titulo": "Teleconsulta - 15/01/2025",
    "conteudo": "...",
    "resumo_executivo": "...",
    "palavras_chave": ["keyword1", "keyword2"]
  }
}
```

## Configuração de Segurança

### 1. URLs Presigned
- Tempo de expiração: 1 hora (configurável)
- Acesso somente leitura
- Geradas dinamicamente para cada processamento

### 2. Webhook Security
- Use HTTPS para o webhook
- Considere adicionar autenticação via header
- Valide o payload no callback

### 3. Cleanup
- Arquivos temporários são limpos automaticamente pelo n8n
- URLs presigned expiram automaticamente

## Monitoramento e Logs

### Pontos de Monitoramento:
1. **Geração de URL Presigned** - API Process
2. **Download do Áudio** - N8N HTTP Request
3. **Processamento FFmpeg** - N8N Execute Command
4. **Transcrição Whisper** - N8N HTTP Request (Groq)
5. **Geração de Prontuário** - N8N OpenAI
6. **Callback** - API Callback

### Logs Importantes:
- Tempo de download do áudio
- Tamanho dos chunks gerados
- Tempo de transcrição
- Tempo total de processamento
- Erros de conectividade com MinIO

## Troubleshooting

### Problemas Comuns:

1. **URL Presigned Expirada**
   - Verificar tempo de expiração
   - Regenerar URL se necessário

2. **Erro de Download**
   - Verificar conectividade com MinIO
   - Validar permissões de acesso

3. **Arquivo Corrompido**
   - Verificar integridade do upload original
   - Validar formato de áudio suportado

4. **Timeout no Processamento**
   - Ajustar timeout do webhook
   - Considerar arquivos muito grandes