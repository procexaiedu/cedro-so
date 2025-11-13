# Google Calendar Sync - Guia de Validação

Este documento fornece instruções e queries SQL para validar a integração bidirecional entre Cedro e Google Calendar.

## 📋 Pré-requisitos

- [ ] SQL migrations aplicadas (`db/schema/add_google_calendar_sync.sql`)
- [ ] Variáveis de ambiente configuradas:
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `GOOGLE_REFRESH_TOKEN` (conta mestre)
  - `APP_URL` (ex: https://cedro.example.com)
  - `CRON_SECRET` (para endpoints protegidos)
- [ ] Aplicação em produção (webhooks requerem HTTPS)

---

## 🧪 Cenários de Validação

### Cenário 1: Cedro → Google Calendar (CREATE)

**Fluxo:**
1. Criar novo agendamento no Cedro (com terapeuta que tem `google_calendar_id`)
2. Verificar que job foi enfileirado na `gcal_sync_queue`
3. Executar worker: `POST /api/cron/process-gcal-sync` com `Authorization: Bearer {CRON_SECRET}`
4. Validar que evento foi criado no Google Calendar

**SQL de validação:**

```sql
-- 1. Verificar que agendamento foi criado com origin='system'
SELECT id, therapist_id, summary, start_at, origin, external_event_id, html_link
FROM cedro.appointments
WHERE created_at > now() - interval '1 minute'
  AND origin = 'system'
ORDER BY created_at DESC
LIMIT 1;

-- Esperado: id não nulo, origin='system', external_event_id ainda NULL

-- 2. Verificar que job foi enfileirado
SELECT id, appointment_id, action, status, created_at
FROM cedro.gcal_sync_queue
WHERE appointment_id = '{APPOINTMENT_ID}'  -- substituir pelo ID acima
ORDER BY created_at DESC
LIMIT 1;

-- Esperado: status='pending', action='create'

-- 3. Depois de executar o worker, verificar sucesso
SELECT id, appointment_id, action, status, processed_at, last_error
FROM cedro.gcal_sync_queue
WHERE appointment_id = '{APPOINTMENT_ID}'
ORDER BY created_at DESC
LIMIT 1;

-- Esperado: status='completed', processed_at NOT NULL, last_error IS NULL

-- 4. Verificar que external_event_id foi populado
SELECT id, external_event_id, external_calendar_id, html_link, gcal_etag
FROM cedro.appointments
WHERE id = '{APPOINTMENT_ID}';

-- Esperado: external_event_id NOT NULL, html_link contém URL do Google
```

**Validação manual:**
- Clique no `html_link` retornado
- Confirme que o evento aparece no Google Calendar do terapeuta
- Verifique título, horário, descrição

---

### Cenário 2: Google Calendar → Cedro (WEBHOOK)

**Fluxo:**
1. Criar evento manualmente no Google Calendar do terapeuta
2. Configurar webhook: `POST /api/gcal/setup-watch` com `therapist_id`
3. Modificar ou criar novo evento no Google Calendar
4. Webhook dispara automaticamente → `POST /api/gcal/webhook`
5. Validar que evento foi criado/atualizado no Cedro

**Primeira vez (setup webhook):**

```bash
# Executar endpoint setup-watch
curl -X POST http://localhost:3000/api/gcal/setup-watch \
  -H "Content-Type: application/json" \
  -d '{"therapist_id": "THERAPIST_UUID"}'

# Resposta esperada:
{
  "success": true,
  "message": "Watch configured for calendar xyz@gmail.com",
  "channel": {
    "id": "channel-uuid",
    "resource_id": "google-resource-id",
    "expiration": "2024-11-13T23:24:00Z"
  }
}
```

**Depois que webhook chegar:**

```sql
-- 1. Verificar que evento foi importado com origin='google'
SELECT id, therapist_id, summary, start_at, origin, external_event_id, patient_id
FROM cedro.appointments
WHERE origin = 'google'
  AND source_updated_at > now() - interval '1 minute'
ORDER BY source_updated_at DESC
LIMIT 1;

-- Esperado: origin='google', external_event_id NOT NULL

-- 2. Verificar sync_token foi atualizado
SELECT calendar_id, sync_token, last_sync_at
FROM cedro.google_calendar_sync_state
WHERE last_sync_at > now() - interval '1 minute';

-- Esperado: sync_token NOT NULL, last_sync_at recente

-- 3. Verificar canal está ativo
SELECT id, calendar_id, is_active, expiration
FROM cedro.google_calendar_channels
WHERE is_active = true
  AND expiration > now();

-- Esperado: is_active=true, expiration no futuro

-- 4. Verificar log de sync
SELECT event_id, direction, status, created_at
FROM cedro.calendar_sync_log
WHERE direction = 'google_to_cedro'
  AND created_at > now() - interval '1 minute'
ORDER BY created_at DESC;

-- Esperado: status='success'
```

---

### Cenário 3: Sem LOOP (Prevent Loop)

**Objetivo:** Confirmar que eventos do Google não disparam reescrita para o Google

**Fluxo:**
1. Criar evento no Google Calendar
2. Webhook importa para Cedro com `origin='google'`
3. Validar que NÃO foi enfileirado job de sincronização

**SQL de validação:**

```sql
-- Buscar evento importado do Google
SELECT id, external_event_id, origin
FROM cedro.appointments
WHERE origin = 'google'
  AND created_at > now() - interval '10 minutes'
ORDER BY created_at DESC
LIMIT 1;

-- Guardar o ID deste agendamento para verificação

-- Verificar que NÃO há job de sincronização para este agendamento
SELECT appointment_id, action, status
FROM cedro.gcal_sync_queue
WHERE appointment_id = '{APPOINTMENT_ID}';

-- Esperado: (vazio - sem resultados)
-- Nenhum job deve ser criado automaticamente para origin='google'
```

---

### Cenário 4: Série Recorrente + Vinculação de Paciente

**Fluxo:**
1. Criar série recorrente no Google Calendar (ex: 5 ocorrências)
2. Webhook importa todas as ocorrências com `recurring_event_id`
3. Vincular um paciente a UMA ocorrência
4. Validar que paciente foi propagado para futuras ocorrências (mesma série)

**SQL de validação:**

```sql
-- 1. Verificar série recorrente foi importada
SELECT id, recurring_event_id, patient_id, start_at
FROM cedro.appointments
WHERE recurring_event_id = '{RECURRING_EVENT_ID}'
  AND origin = 'google'
ORDER BY start_at;

-- Esperado: múltiplas linhas com mesmo recurring_event_id, todos patient_id IS NULL

-- 2. Simular vinculação de paciente (você faria isso via UI)
UPDATE cedro.appointments
SET patient_id = '{PATIENT_ID}'
WHERE id = '{FIRST_OCCURRENCE_ID}';

-- 3. Verificar propagação automática
SELECT id, patient_id, start_at, status
FROM cedro.appointments
WHERE recurring_event_id = '{RECURRING_EVENT_ID}'
  AND origin = 'google'
ORDER BY start_at;

-- Esperado: todas as futuras ocorrências (start_at >= agora) com patient_id preenchido
-- Ocorrências passadas devem manter patient_id IS NULL
```

---

### Cenário 5: Transparência (Ignore Transparent)

**Fluxo:**
1. Criar evento TRANSPARENT (não bloqueia) no Google Calendar
2. Webhook processa
3. Validar que evento NÃO foi criado no Cedro (ignorado)

**SQL de validação:**

```sql
-- Criar evento transparent manualmente no Google Calendar
-- (ou modificar um existente no Google para transparency='transparent')

-- Depois que webhook chegar, validar que não aparece em cedro.appointments
SELECT COUNT(*) as transparent_events_in_cedro
FROM cedro.appointments
WHERE external_event_id = '{GOOGLE_TRANSPARENT_EVENT_ID}';

-- Esperado: 0 (zero eventos)

-- Verificar log indicando skip
SELECT event_id, status
FROM cedro.calendar_sync_log
WHERE event_id = '{GOOGLE_TRANSPARENT_EVENT_ID}'
  AND direction = 'google_to_cedro';

-- Esperado: status='skipped' (quando implementar logging de skips)
```

---

### Cenário 6: Conflito de Horário (Cedro → Google falha)

**Fluxo:**
1. Simular erro ao tentar criar no Google (ex: calendário cheio, erro de permissão)
2. Validar que job é reprocessado com backoff exponencial
3. Validar que após max_retries, job fica em 'failed'

**SQL de validação (simulado):**

```sql
-- Monitorar fila durante erro
SELECT id, appointment_id, action, status, retry_count, last_error, created_at, processed_at
FROM cedro.gcal_sync_queue
WHERE appointment_id = '{APPOINTMENT_ID}'
ORDER BY created_at DESC;

-- Fase 1 - Primeiro erro:
-- Esperado: status='pending', retry_count=1, last_error NOT NULL

-- Fase 2 - Segundo retry:
-- Esperado: status='pending', retry_count=2, processado 4s depois

-- Fase 3 - Último retry (max_retries=3):
-- Esperado: status='failed', retry_count=3, processado 16s depois
```

---

### Cenário 7: Resync Manual (410 - Sync Token Expired)

**Fluxo:**
1. Aguardar que sync_token expire (Google geralmente expira em ~7 dias)
2. Ou testar manualmente chamando resync endpoint
3. Validar que full sync é executado

**SQL/API de validação:**

```bash
# Chamar resync manual
curl -X GET "http://localhost:3000/api/gcal/resync/THERAPIST_UUID" \
  -H "Authorization: Bearer CRON_SECRET"

# Resposta esperada:
{
  "success": true,
  "message": "Resync completed",
  "processed": 15,
  "ignored": 2
}
```

**SQL após resync:**

```sql
-- Verificar que sync_token foi atualizado
SELECT calendar_id, sync_token, last_sync_at
FROM cedro.google_calendar_sync_state
WHERE last_sync_at > now() - interval '1 minute';

-- Esperado: sync_token NOT NULL, recent timestamp
```

---

## 🔍 Monitoramento em Produção

### Tabelas para monitorar

**1. Fila de sincronização (Cedro → Google)**
```sql
SELECT
  status,
  COUNT(*) as count,
  MAX(processed_at) as last_processed
FROM cedro.gcal_sync_queue
GROUP BY status;
```

**2. Canais de webhook ativos**
```sql
SELECT
  therapist_id,
  calendar_id,
  is_active,
  expiration,
  CASE
    WHEN expiration < now() + interval '24 hours' THEN 'EXPIRING_SOON'
    ELSE 'OK'
  END as status
FROM cedro.google_calendar_channels
ORDER BY expiration;
```

**3. Erros de sincronização**
```sql
SELECT
  direction,
  status,
  COUNT(*) as count
FROM cedro.calendar_sync_log
WHERE created_at > now() - interval '7 days'
GROUP BY direction, status
ORDER BY count DESC;
```

**4. Eventos com problemas**
```sql
-- Eventos sem paciente vinculado (requerem ação manual)
SELECT
  id,
  summary,
  start_at,
  therapist_id,
  origin
FROM cedro.appointments
WHERE origin = 'google'
  AND patient_id IS NULL
  AND start_at > now()
  AND status <> 'cancelled'
ORDER BY start_at;
```

---

## 📅 Cron Jobs Necessários

Configure seus cron jobs (Vercel, AWS Lambda, GitHub Actions, etc):

### 1. Processar fila (a cada 1-2 minutos)
```
POST /api/cron/process-gcal-sync
Authorization: Bearer {CRON_SECRET}
```

### 2. Renovar webhooks (a cada 6 horas)
```
POST /api/cron/renew-gcal-channels
Authorization: Bearer {CRON_SECRET}
```

### 3. Limpeza de logs (opcional, a cada semana)
```sql
DELETE FROM cedro.calendar_sync_log
WHERE created_at < now() - interval '30 days';
```

---

## 🚨 Troubleshooting

### "Therapist has no Google Calendar configured"
- Verifique que `users.google_calendar_id` está preenchido
- Formato esperado: `email@gmail.com` ou ID do grupo

### "Watch configuration failed"
- Confirme que `GOOGLE_REFRESH_TOKEN` é válido
- Confirme que conta mestre tem permissão de edição em todas as agendas

### "Event not appearing in Cedro after creation in Google"
- Verifique que webhook foi configurado: `GET /api/gcal/setup-watch?therapist_id={id}`
- Confirme que channel está `is_active=true` e não expirou
- Verifique logs: `SELECT * FROM cedro.calendar_sync_log WHERE direction='google_to_cedro' ORDER BY created_at DESC LIMIT 10;`

### "Sync loop detected" (evento sendo reprocessado constantemente)
- Verificar que `origin='google'` no banco (previne reescrita)
- Se triggers falharem, verificar: `SELECT * FROM information_schema.triggers WHERE trigger_schema='cedro' AND trigger_name='sync_to_gcal_after_change';`

---

## ✅ Checklist de Implementação Completa

- [ ] SQL migrations aplicadas e validadas
- [ ] Variáveis de ambiente em `.env.local` ou production secrets
- [ ] Worker `/api/cron/process-gcal-sync` executado com sucesso
- [ ] Webhook `/api/gcal/webhook` recebeu pelo menos 1 evento
- [ ] Resync `/api/gcal/resync/:therapist_id` funcionando
- [ ] Channel renewal `/api/cron/renew-gcal-channels` agendado
- [ ] Todos 7 cenários de validação passaram
- [ ] UI exibindo badges de origem e links do Google
- [ ] Logs monitorados em produção
- [ ] Documentação compartilhada com time

---

## 📞 Contato & Suporte

Para problemas ou dúvidas:
1. Verificar logs: `calendar_sync_log`
2. Verificar status da fila: `gcal_sync_queue`
3. Verificar canais: `google_calendar_channels`
4. Consultar documentação de sync: [README.md](./README.md)
