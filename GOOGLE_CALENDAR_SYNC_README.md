# Google Calendar Synchronization - Implementação Completa

## 📌 Overview

Integração bidirecional **robusta e idempotente** entre o Sistema Cedro e Google Calendar, com suporte a:

✅ **Cedro → Google**: Criar, editar, deletar agendamentos no Cedro espelha automaticamente no Google Calendar
✅ **Google → Cedro**: Mudanças no Google Calendar são sincronizadas em tempo real via webhook
✅ **Prevenção de Loop**: Eventos importados do Google não disparam reescrita
✅ **Retentativas com Backoff**: Falhas são reprocessadas com delays exponenciais
✅ **Sincronização Incremental**: Usa `syncToken` do Google para eficiência
✅ **Séries Recorrentes**: Vinculação de paciente propaga automaticamente para futuras ocorrências
✅ **Logging Completo**: Auditoria em `calendar_sync_log`

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                     CEDRO (Frontend)                        │
│  - Create/Edit/Delete Appointments                          │
│  - Display: origin, html_link, patient linking button       │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
   ┌─────────────┐              ┌──────────────┐
   │   CEDRO DB  │              │ Google Cloud │
   │  ┌────────┐ │              │   (Webhooks) │
   │  │ appts  │ │              └──────────────┘
   │  │ + sync │ │                      △
   │  └────────┘ │                      │ 410 Expired
   └──────┬──────┘                      │ Token
          │                             │
    CREATE/UPDATE/DELETE        POST /api/gcal/webhook
    triggers enqueue             (in real-time)
    sync_queue                         │
          │                             │
          ▼                             │
   ┌──────────────────────────┐        │
   │ POST /api/cron/          │        │
   │ process-gcal-sync        │◄───────┘
   │ (Worker - 1-2 min)       │        GET /api/gcal/
   │                          │        resync/[id]
   │ - Fetch pending jobs     │        (Manual resync)
   │ - Create/update/delete   │
   │ - Retry w/ backoff       │
   │ - Mark completed/failed  │
   └──────────────────────────┘
                │
                └──► OAuth2 (refresh token da conta mestre)
                     ↓
                 Google Calendar API v3
```

---

## 🗄️ Tabelas do Banco

### `cedro.appointments` (estendida)

```sql
-- Novas colunas para sync
origin                  text          -- 'system' | 'google'
summary                 text          -- Título no Google
external_event_id       text          -- ID do evento no Google
external_calendar_id    text          -- ID da agenda (email)
source_updated_at       timestamptz   -- Timestamp da última mudança na fonte
recurring_event_id      text          -- ID da série (para rastrear ocorrências)
ical_uid                text          -- UID iCalendar
html_link               text          -- Link para abrir no Google
gcal_etag               text          -- ETag para If-Match (conflitos)

-- Índice de unicidade
UNIQUE (external_calendar_id, external_event_id) WHERE origin='google'
```

### `cedro.google_calendar_sync_state`

Armazena **um `syncToken` por calendário** para sincronização incremental:

```sql
calendar_id   text PRIMARY KEY    -- Email/ID da agenda (ex: user@gmail.com)
sync_token    text                -- Token para próxima listagem incremental
last_sync_at  timestamptz         -- Quando sincronizou última vez
updated_at    timestamptz         -- Timestamp da última atualização
```

**Importante:** Um único `syncToken` por calendário, reaproveitado ao renovar webhook.

### `cedro.google_calendar_channels`

Registra **webhooks ativos** para notificações em tempo real:

```sql
id                  uuid PRIMARY KEY
therapist_id        uuid            -- Quem monitora
calendar_id         text            -- Qual calendário
channel_id          text UNIQUE     -- ID do canal (UUID local)
resource_id         text            -- ID no Google
channel_token       text            -- Token para validar webhooks
expiration          timestamptz     -- Quando expira (~24h)
is_active           boolean         -- Se está monitorando
created_at          timestamptz
updated_at          timestamptz

-- Constraint: 1 canal ativo por (therapist_id, calendar_id)
UNIQUE (therapist_id, calendar_id)
```

### `cedro.gcal_sync_queue`

**Fila de trabalho** para garantir entrega confiável (Cedro → Google):

```sql
id                  uuid PRIMARY KEY
appointment_id      uuid            -- Qual agendamento sincronizar
action              text            -- 'create' | 'update' | 'delete'
status              text            -- 'pending'|'processing'|'completed'|'failed'
retry_count         int             -- Tentativas feitas
max_retries         int             -- Máximo de tentativas (padrão 3)
last_error          text            -- Erro da última tentativa
created_at          timestamptz
processed_at        timestamptz

-- Índices
INDEX (status, created_at)  -- Para buscar jobs pendentes rapidamente
```

### `cedro.calendar_sync_log`

**Auditoria completa** de todas as operações:

```sql
id                  uuid PRIMARY KEY
event_id            text            -- ID do evento
calendar_id         text            -- ID do calendário
action              text            -- Operação (create/update/delete/sync)
direction           text            -- cedro_to_google | google_to_cedro
status              text            -- success | error | skipped
error_message       text            -- Se houve erro
payload             jsonb           -- Request/response sanitizado
created_at          timestamptz
```

---

## 🔧 Triggers PL/pgSQL

### `trg_enqueue_gcal_sync` (INSERT/UPDATE)

```
Quando: Novo agendamento criado OU agendamento atualizado
Condição: origin='system' (NÃO reprocessar eventos do Google)
Ação: Inserir job em gcal_sync_queue com status='pending'
```

### `trg_enqueue_gcal_sync_delete` (DELETE)

```
Quando: Agendamento deletado
Condição: external_event_id NOT NULL (foi sincronizado)
Ação: Inserir DELETE job em gcal_sync_queue
```

### `trg_propagate_patient_for_series` (UPDATE patient_id)

```
Quando: patient_id atualizado de NULL → valor
Condição: origin='google' AND recurring_event_id NOT NULL
Ação: Propagar patient_id para futuras ocorrências (start_at >= agora)
       da mesma série (therapist + calendar + recurring_event_id)
```

---

## 📡 API Endpoints

### 1. **Webhook** (recebe eventos do Google)

```
POST /api/gcal/webhook
Headers:
  x-goog-channel-id: <id>
  x-goog-resource-id: <id>
  x-goog-resource-state: 'sync' | 'exists'
  x-goog-channel-token: <uuid>

Retorna:
{
  "success": true,
  "processed": 15,
  "ignored": 2,
  "errors": 0
}
```

### 2. **Setup Watch** (ativa monitoramento)

```
POST /api/gcal/setup-watch
Body:
{
  "therapist_id": "uuid"
}

Retorna:
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

### 3. **Manual Resync** (full sync janela móvel)

```
GET /api/gcal/resync/[therapist_id]
Query params:
  days_back: 30 (padrão)
  days_forward: 365 (padrão)

Retorna:
{
  "success": true,
  "message": "Resync completed",
  "processed": 42,
  "ignored": 3
}
```

### 4. **Process Sync Queue** (worker cron)

```
POST /api/cron/process-gcal-sync
Headers:
  Authorization: Bearer {CRON_SECRET}

Retorna:
{
  "success": true,
  "processed": 10,
  "succeeded": 9,
  "failed": 1,
  "retried": 1,
  "errors": [...]
}
```

### 5. **Renew Channels** (renovar webhooks expirados)

```
POST /api/cron/renew-gcal-channels
Headers:
  Authorization: Bearer {CRON_SECRET}

Retorna:
{
  "success": true,
  "renewed": 3,
  "failed": 0,
  "errors": []
}
```

---

## 🔐 Configuração de Ambiente

### Variáveis Obrigatórias (Server-side)

```env
# Google OAuth2 (Conta Mestre)
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
GOOGLE_REFRESH_TOKEN=1//0gA...       # Refresh token da conta mestre

# Aplicação
APP_URL=https://cedro.example.com   # HTTPS obrigatório para webhooks
CRON_SECRET=seu-segredo-aleatorio   # Para proteger endpoints cron

# Supabase (já configuradas)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...       # Para worker
```

### Como Obter o Refresh Token

1. **Google Cloud Console:**
   - Criar projeto
   - Ativar Google Calendar API
   - Criar OAuth2 credentials (tipo: Desktop)
   - Salvar Client ID + Secret

2. **Obter refresh token (one-time):**

```bash
# 1. Obter authorization code
https://accounts.google.com/o/oauth2/auth?
  client_id=XXX&
  scope=https://www.googleapis.com/auth/calendar&
  response_type=code&
  redirect_uri=urn:ietf:wg:oauth:2.0:oob

# 2. Copiar código recebido, depois:
curl -X POST https://oauth2.googleapis.com/token \
  -d client_id=XXX \
  -d client_secret=YYY \
  -d code=ZZZ \
  -d redirect_uri=urn:ietf:wg:oauth:2.0:oob \
  -d grant_type=authorization_code

# Resposta contém refresh_token
```

---

## ⚙️ Fluxo de Sincronização

### Cedro → Google (CREATE)

```
1. Usuário cria agendamento no Cedro (therapist_id com google_calendar_id)
   ↓
2. Trigger trg_enqueue_gcal_sync_after_change dispara
   - INSERT job em gcal_sync_queue (status='pending', action='create')
   ↓
3. Cron executa POST /api/cron/process-gcal-sync (a cada 1-2 min)
   - Buscar batch de jobs pending (até 10)
   - Marcar como 'processing'
   - Chamar googleCalendarService.createEvent()
   ↓
4. Google Calendar API responde com event.id, html_link, etag
   ↓
5. Salvar em appointments:
   - external_event_id = event.id
   - external_calendar_id = calendarId
   - html_link = event.htmlLink
   - gcal_etag = event.etag
   ↓
6. Marcar job como 'completed'
   ↓
7. Log em calendar_sync_log (direction='cedro_to_google', status='success')
```

### Google → Cedro (WEBHOOK)

```
1. Usuário cria/edita/deleta evento no Google Calendar
   ↓
2. Google notifica POST /api/gcal/webhook com headers:
   - x-goog-channel-id
   - x-goog-resource-id
   - x-goog-resource-state: 'exists' (ou 'sync' primeiro)
   - x-goog-channel-token
   ↓
3. Validar canal em google_calendar_channels
   ↓
4. Ler syncToken de google_calendar_sync_state
   ↓
5. Se state='sync': fazer list() completo (timeMin/timeMax)
   Se state='exists': fazer list() com syncToken (incremental)
   ↓
6. Para cada evento:
   - Ignorar transparency='transparent'
   - Mapear para formato Cedro
   - UPSERT por (external_calendar_id, external_event_id)
   - Set origin='google' (previne loop)
   ↓
7. Atualizar sync_token em google_calendar_sync_state
   ↓
8. Log em calendar_sync_log (direction='google_to_cedro', status='success')
```

### Prevenção de Loop

```
CEDRO CREATE → Job enfileirado → Google (external_event_id atualizado)
               ↓
            origin='system' (trigger não enfileira)
               ✓ OK - Sem loop

GOOGLE UPDATE → Webhook chega → UPSERT origin='google'
               ↓
            origin='google' (trigger NÃO enfileira)
               ✓ OK - Sem loop
```

---

## 🔄 Fluxo de Recorrência

```
1. Google Calendar tem série recorrente (5 ocorrências)
   ↓
2. Webhook importa com recurring_event_id=abc123
   - appointments[0]: patient_id=NULL, recurring_event_id='abc123'
   - appointments[1]: patient_id=NULL, recurring_event_id='abc123'
   - appointments[2]: patient_id=NULL, recurring_event_id='abc123'
   - appointments[3]: patient_id=NULL, recurring_event_id='abc123'
   - appointments[4]: patient_id=NULL, recurring_event_id='abc123'
   ↓
3. Usuário vincula paciente na ocorrência[1] (2a ocorrência)
   UPDATE appointments SET patient_id='xyz' WHERE id=appointments[1].id
   ↓
4. Trigger trg_propagate_patient_for_series dispara
   UPDATE appointments
   SET patient_id='xyz'
   WHERE recurring_event_id='abc123'
     AND origin='google'
     AND patient_id IS NULL
     AND start_at >= now()
   ↓
5. Resultado:
   - appointments[0]: patient_id=NULL (passou)
   - appointments[1]: patient_id='xyz' (vinculado manualmente)
   - appointments[2]: patient_id='xyz' (propagado)
   - appointments[3]: patient_id='xyz' (propagado)
   - appointments[4]: patient_id='xyz' (propagado)
```

---

## 🔁 Retry Logic (Backoff Exponencial)

```
Job falha na 1ª tentativa (ex: rate limit, timeout)
  ↓
Esperar 2 segundos → Retry
  ↓ (se falhar novamente)
Esperar 4 segundos → Retry
  ↓ (se falhar novamente)
Esperar 8 segundos → Retry
  ↓ (se falhar novamente)
Esperar 16 segundos → Retry
  ↓ (se falhar depois de 3 retries = max_retries)
Marcar como 'failed' → Necessário ação manual (check logs)
```

---

## 📊 Monitoramento

### Status da Fila (em tempo real)

```sql
SELECT
  status,
  COUNT(*) as count,
  ROUND(AVG(EXTRACT(EPOCH FROM (processed_at - created_at))))::int as avg_processing_seconds
FROM cedro.gcal_sync_queue
GROUP BY status;
```

### Eventos Sincronizados (últimas 24h)

```sql
SELECT
  direction,
  status,
  COUNT(*) as count
FROM cedro.calendar_sync_log
WHERE created_at > now() - interval '24 hours'
GROUP BY direction, status;
```

### Canais Expirando

```sql
SELECT
  therapist_id,
  calendar_id,
  expiration,
  expiration - now() as time_until_expiration
FROM cedro.google_calendar_channels
WHERE is_active = true
  AND expiration < now() + interval '24 hours'
ORDER BY expiration;
```

---

## 📅 Agendamento de Cron Jobs

Você precisa configurar 2 cron jobs:

### 1️⃣ Process Sync Queue (a cada 1-2 minutos)

```bash
# Vercel Cron (dentro de vercel.json)
{
  "crons": [
    {
      "path": "/api/cron/process-gcal-sync",
      "schedule": "*/2 * * * *"  # A cada 2 minutos
    }
  ]
}

# Ou use GitHub Actions, AWS Lambda, Upstash, etc.
curl -X POST https://cedro.example.com/api/cron/process-gcal-sync \
  -H "Authorization: Bearer {CRON_SECRET}"
```

### 2️⃣ Renew Channels (a cada 6 horas)

```bash
# Vercel Cron
{
  "crons": [
    {
      "path": "/api/cron/renew-gcal-channels",
      "schedule": "0 */6 * * *"  # A cada 6 horas
    }
  ]
}
```

---

## 🎯 Checklist de Implementação

- [ ] SQL migrations aplicadas
- [ ] Variáveis de ambiente configuradas
- [ ] Google OAuth2 credentials obtidas
- [ ] Refresh token gerado e salvado
- [ ] Cron jobs configurados
- [ ] Testes de validação executados (ver GOOGLE_CALENDAR_SYNC_VALIDATION.md)
- [ ] UI integrada em appointment-modal
- [ ] Logs monitorados em produção
- [ ] Backup/disaster recovery documentado

---

## 📚 Arquivos Adicionados

```
db/schema/
  └── add_google_calendar_sync.sql     (8 blocos de migrations)

src/lib/google-calendar/
  ├── types.ts                         (TypeScript interfaces)
  ├── client.ts                        (OAuth2 authentication)
  └── service.ts                       (Core Google Calendar operations)

src/lib/api/
  └── google-calendar.ts               (Query/mutation helpers)

src/hooks/
  └── use-google-calendar-sync.ts      (React Query hooks)

src/app/api/
  ├── gcal/
  │   ├── webhook/route.ts             (Receber eventos do Google)
  │   ├── setup-watch/route.ts         (Ativar webhook)
  │   └── resync/[therapist_id]/route.ts (Full sync manual)
  └── cron/
      ├── process-gcal-sync/route.ts   (Worker principal)
      └── renew-gcal-channels/route.ts (Renovar webhooks)

src/components/agenda/
  └── appointment-google-calendar-info.tsx (UI component)

Docs:
  ├── GOOGLE_CALENDAR_SYNC_README.md (este arquivo)
  └── GOOGLE_CALENDAR_SYNC_VALIDATION.md (testes)
```

---

## 🆘 Troubleshooting

### "Webhook not receiving events"

1. Confirmar `APP_URL` é HTTPS e público
2. Verificar que `POST /api/gcal/setup-watch` executou com sucesso
3. Confirmar channel está `is_active=true`:
   ```sql
   SELECT * FROM cedro.google_calendar_channels WHERE is_active=true;
   ```
4. Verificar Google Cloud Quotas: https://console.cloud.google.com/apis/dashboard

### "Events from Google not appearing in Cedro"

1. Confirmar `sync_token` foi atualizado:
   ```sql
   SELECT sync_token, last_sync_at FROM cedro.google_calendar_sync_state;
   ```
2. Confirmar webhook headers validaram:
   ```sql
   SELECT * FROM cedro.calendar_sync_log
   WHERE direction='google_to_cedro' ORDER BY created_at DESC LIMIT 5;
   ```

### "Sync queue jobs failing"

1. Verificar último erro:
   ```sql
   SELECT appointment_id, last_error, retry_count
   FROM cedro.gcal_sync_queue
   WHERE status='failed';
   ```
2. Confirmar terapeuta tem `google_calendar_id`:
   ```sql
   SELECT id, email, google_calendar_id FROM cedro.users WHERE id=?;
   ```

---

## 📞 Suporte

Consulte a documentação de validação: [GOOGLE_CALENDAR_SYNC_VALIDATION.md](./GOOGLE_CALENDAR_SYNC_VALIDATION.md)
