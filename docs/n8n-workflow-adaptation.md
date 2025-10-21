# Adaptação do Workflow N8N para o Sistema Cedro

## Visão Geral
Este documento descreve como adaptar o workflow n8n existente para funcionar com o sistema Cedro.

## Mudanças Necessárias no Workflow N8N

### 1. Webhook (Nó de Entrada)
**Mudanças necessárias:**
- O webhook agora receberá dados do sistema Cedro em vez do sistema anterior
- Estrutura de dados esperada:

```json
{
  "recording_job_id": "uuid",
  "patient_id": "uuid", 
  "therapist_id": "uuid",
  "appointment_id": "uuid",
  "note_type": "anamnesis|consultation|evolution",
  "audio_presigned_url": "https://...",
  "audio_storage_url": "path/to/audio.mp3",
  "audio_original_filename": "filename.mp3"
}
```

### 2. Download de Áudio
**Nó atual:** `baixar_audio_prontuario`
**Mudanças:**
- Usar `audio_presigned_url` em vez de `audio_url_assinada`
- O campo agora vem do sistema Cedro/MinIO

**Configuração atualizada:**
```
URL: {{ $('Webhook').item.json.body.audio_presigned_url }}
```

### 3. Salvamento do Arquivo
**Nó atual:** `Save Audio File`
**Mudanças:**
- Usar `audio_original_filename` do webhook
- Manter a lógica de detecção de formato (webm/mp3)

**Configuração atualizada:**
```
fileName: /prontuarios/audio.{{ $node["Webhook"].json.body.audio_original_filename.split('.').pop() }}
```

### 4. Processamento FFmpeg
**Nó atual:** `Split Audio`
**Mudanças:** Nenhuma mudança necessária
- O comando FFmpeg permanece o mesmo
- Continua dividindo em chunks de 600 segundos (10 minutos)

### 5. Transcrição Whisper
**Nó atual:** `Whisper2`
**Mudanças:** Nenhuma mudança necessária
- Continua usando Groq API com whisper-large-v3
- Mantém configurações de temperatura, formato e idioma

### 6. Geração do Prontuário
**Nó atual:** `gerador-prontuario`
**Mudanças:** Nenhuma mudança necessária
- Continua usando OpenAI Chat Model
- Mantém o prompt system existente

### 7. Callback Final
**Nó atual:** `HTTP Request`
**Mudanças principais:**

**Nova URL:**
```
https://seu-dominio.com/api/n8n/callback
```

**Novo payload JSON:**
```json
{
  "recording_job_id": "{{ $node['Webhook'].json.body.recording_job_id }}",
  "patient_id": "{{ $node['Webhook'].json.body.patient_id }}",
  "therapist_id": "{{ $node['Webhook'].json.body.therapist_id }}",
  "texto_transcricao_bruta": "{{ $node['Set Message from Audio'].json.message }}",
  "texto_rascunho": "{{ $node['gerador-prontuario'].json.output }}",
  "structured_record": "{{ $node['gerador-prontuario'].json.output }}"
}
```

## Configuração do Webhook URL

No sistema Cedro, configure a variável de ambiente:
```
N8N_WEBHOOK_URL=https://seu-n8n.com/webhook/cedro-audio-processing
```

## Fluxo de Dados Completo

1. **Cedro API** → Dispara webhook n8n com dados do job
2. **N8N** → Baixa áudio do MinIO usando URL presigned
3. **N8N** → Processa áudio (split, transcrição, geração de prontuário)
4. **N8N** → Envia resultado de volta para Cedro via callback
5. **Cedro API** → Atualiza tabelas `recording_jobs` e `medical_records`

## Variáveis de Ambiente Necessárias

### No Sistema Cedro:
```
N8N_WEBHOOK_URL=https://seu-n8n.com/webhook/cedro-audio-processing
```

### No N8N:
- Credenciais Groq API (para Whisper)
- Credenciais OpenAI API (para geração de prontuário)
- URL do callback do Cedro

## Teste do Fluxo

Para testar o fluxo completo:

1. Faça upload de um áudio via API do Cedro
2. Chame a API `/api/audio/process` com o `recording_job_id`
3. Verifique se o webhook n8n foi disparado
4. Acompanhe o processamento no n8n
5. Verifique se o callback foi recebido e os dados foram salvos

## Monitoramento

- Logs do n8n para acompanhar processamento
- Logs da API Cedro para webhook e callback
- Status na tabela `recording_jobs` para acompanhar progresso