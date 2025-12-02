# 🔧 Prompt para Claude Code — Integração Bidirecional Cedro ⇄ Google Calendar

Você é o agente responsável por **implementar a sincronização bidirecional** entre o **Sistema Cedro** e o **Google Calendar**, com **robustez**, **idempotência** e **prevenção de loops**.

## 📌 Contexto essencial

* Banco: **PostgreSQL / Supabase** (sempre no **schema `cedro`**).
* Já existe ETL inicial (n8n) que importou eventos do GCal → `cedro.appointments`.
* **Disponibilidade** no Cedro é consultada **somente via banco** (nossas funções já usam `appointments`).
* **Conta mestre** do Google com **todas as agendas dos terapeutas compartilhadas** com permissão de edição.
* **users.google_calendar_id** contém o ID da agenda do GCal (e-mail ou id de grupo).
* Objetivo agora: **fechar a integração bidirecional, em produção, sem quebrar regras existentes**.

## ✅ Premissas funcionais

* **Cedro → GCal**: criar/editar/excluir eventos no Cedro deve refletir no GCal.
* **GCal → Cedro**: alterações no GCal chegam por **webhook** e são aplicadas via **sync incremental** por `syncToken`.
* **Sem loops**: alterações vindas do GCal **não** disparam escrita de volta pro GCal.
* **Eventos `transparent`** (GCal) **não bloqueiam** e devem ser ignorados.
* **Recorrentes**: usamos `recurring_event_id` (GCal `recurringEventId`); ao vincular `patient_id` numa ocorrência importada, **propagar** para a série (futuras e sem paciente).

---

## 🧱 1) Migrações/DDL (idempotentes)

**Tarefa (Supabase MCP → `execute query`)**: criar/garantir colunas/tabelas/índices/triggers abaixo.

```sql
-- 1. Appointments: colunas necessárias
ALTER TABLE cedro.appointments 
  ADD COLUMN IF NOT EXISTS origin text, -- 'google' | 'system'
  ADD COLUMN IF NOT EXISTS summary text,
  ADD COLUMN IF NOT EXISTS external_event_id text,
  ADD COLUMN IF NOT EXISTS external_calendar_id text,
  ADD COLUMN IF NOT EXISTS source_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS recurring_event_id text,
  ADD COLUMN IF NOT EXISTS ical_uid text,
  ADD COLUMN IF NOT EXISTS html_link text,
  ADD COLUMN IF NOT EXISTS gcal_etag text;

-- Composição única para idempotência de upsert:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname='cedro' AND indexname='uq_appointments_calendar_event'
  ) THEN
    CREATE UNIQUE INDEX uq_appointments_calendar_event
      ON cedro.appointments (external_calendar_id, external_event_id);
  END IF;
END$$;

-- 2. Estado de sync por calendário (independente do channel)
CREATE TABLE IF NOT EXISTS cedro.google_calendar_sync_state (
  calendar_id   text PRIMARY KEY,
  sync_token    text,
  last_sync_at  timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- 3. Canais de webhook (com shared secret)
CREATE TABLE IF NOT EXISTS cedro.google_calendar_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id uuid NOT NULL REFERENCES cedro.users(id) ON DELETE CASCADE,
  calendar_id  text NOT NULL REFERENCES cedro.google_calendar_sync_state(calendar_id),
  channel_id   text NOT NULL UNIQUE,
  resource_id  text NOT NULL,
  channel_token text NOT NULL,
  expiration   timestamptz NOT NULL,
  is_active    boolean DEFAULT true,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now(),
  CONSTRAINT unique_therapist_calendar UNIQUE(therapist_id, calendar_id)
);

-- 4. Fila de sincronização (Cedro → GCal)
CREATE TABLE IF NOT EXISTS cedro.gcal_sync_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES cedro.appointments(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('create','update','delete')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed')),
  retry_count int DEFAULT 0,
  max_retries int DEFAULT 3,
  last_error text,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON cedro.gcal_sync_queue(status, created_at);

-- 5. Logs de sincronização
CREATE TABLE IF NOT EXISTS cedro.calendar_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    text,
  calendar_id text,
  action      text NOT NULL,
  direction   text NOT NULL, -- 'cedro_to_google' | 'google_to_cedro'
  status      text NOT NULL, -- 'success' | 'error' | 'skipped'
  error_message text,
  payload     jsonb,
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sync_log_event   ON cedro.calendar_sync_log(event_id);
CREATE INDEX IF NOT EXISTS idx_sync_log_created ON cedro.calendar_sync_log(created_at DESC);
```

### 1.1 Triggers já existentes (manter/confirmar)

* **Bypass vínculo paciente**: não bloquear quando `origin='google'` **e** `patient_id IS NULL`.
* **No-overlap**: ignorar sobreposição **apenas** para `origin='google' AND patient_id IS NULL`.
* **Propagação de paciente em série**:

```sql
CREATE OR REPLACE FUNCTION cedro.trg_propagate_patient_for_series()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.patient_id IS NOT NULL
     AND OLD.patient_id IS NULL
     AND NEW.recurring_event_id IS NOT NULL
  THEN
    UPDATE cedro.appointments a
       SET patient_id = NEW.patient_id
     WHERE a.therapist_id = NEW.therapist_id
       AND a.external_calendar_id = NEW.external_calendar_id
       AND a.recurring_event_id = NEW.recurring_event_id
       AND a.origin = 'google'
       AND a.status <> 'cancelled'
       AND a.patient_id IS NULL
       AND a.start_at >= date_trunc('day', now());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_propagate_patient_for_series ON cedro.appointments;
CREATE TRIGGER trg_propagate_patient_for_series
AFTER UPDATE OF patient_id ON cedro.appointments
FOR EACH ROW
EXECUTE FUNCTION cedro.trg_propagate_patient_for_series();
```

### 1.2 Trigger de enfileiramento (novo)

**Prevenção de loop:** não enfileirar quando `origin='google'`.

```sql
CREATE OR REPLACE FUNCTION cedro.trg_enqueue_gcal_sync()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.origin = 'google' THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1 FROM cedro.users u
    WHERE u.id = NEW.therapist_id AND u.google_calendar_id IS NOT NULL
  ) THEN
    INSERT INTO cedro.gcal_sync_queue (appointment_id, action, status)
    VALUES (
      NEW.id,
      CASE WHEN TG_OP='INSERT' THEN 'create' ELSE 'update' END,
      'pending'
    );
  END IF;

  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_to_gcal_after_change ON cedro.appointments;
CREATE TRIGGER sync_to_gcal_after_change
AFTER INSERT OR UPDATE ON cedro.appointments
FOR EACH ROW
EXECUTE FUNCTION cedro.trg_enqueue_gcal_sync();

CREATE OR REPLACE FUNCTION cedro.trg_enqueue_gcal_sync_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.external_event_id IS NOT NULL THEN
    INSERT INTO cedro.gcal_sync_queue (appointment_id, action, status)
    VALUES (OLD.id, 'delete', 'pending');
  END IF;
  RETURN OLD;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_to_gcal_before_delete ON cedro.appointments;
CREATE TRIGGER sync_to_gcal_before_delete
BEFORE DELETE ON cedro.appointments
FOR EACH ROW
EXECUTE FUNCTION cedro.trg_enqueue_gcal_sync_delete();
```

---

## 🧩 2) Service Google Calendar (server-side, refresh token da conta mestre)

**Tarefa:** criar `src/lib/google-calendar/service.ts`. **Não** depender de token por terapeuta.

* Use `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN` (conta mestre).
* Em **createEvent**, enviar:

  * `summary`, `start/end` com `timeZone: 'America/Sao_Paulo'`
  * `transparency: 'opaque'`
  * `extendedProperties.private.cedro_appointment_id = <uuid>`
* Persistir na volta: `external_event_id`, `external_calendar_id`, `html_link`, `gcal_etag`.

**Stub:**

```ts
import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

function getAuth() {
  const auth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
  auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return auth;
}

export class GoogleCalendarService {
  private calendar = google.calendar({ version: 'v3', auth: getAuth() });

  async createEvent(appointment: any, calendarId: string) {
    const body: any = {
      summary: appointment.summary || 'Sessão - Cedro',
      description: 'Origem: Cedro',
      start: { dateTime: appointment.start_at, timeZone: 'America/Sao_Paulo' },
      end:   { dateTime: appointment.end_at,   timeZone: 'America/Sao_Paulo' },
      transparency: 'opaque',
      extendedProperties: { private: { cedro_appointment_id: appointment.id } }
    };
    const resp = await this.calendar.events.insert({ calendarId, requestBody: body });
    await supabase.from('appointments').update({
      external_event_id: resp.data.id,
      external_calendar_id: calendarId,
      html_link: resp.data.htmlLink ?? null,
      gcal_etag: resp.data.etag ?? null
    }).eq('id', appointment.id);
    return resp.data;
  }

  async patchEvent(appointment: any) {
    const updates: any = {};
    if (appointment.summary) updates.summary = appointment.summary;
    if (appointment.start_at) updates.start = { dateTime: appointment.start_at, timeZone: 'America/Sao_Paulo' };
    if (appointment.end_at)   updates.end   = { dateTime: appointment.end_at,   timeZone: 'America/Sao_Paulo' };
    if (appointment.notes)    updates.description = appointment.notes;

    const resp = await this.calendar.events.patch({
      calendarId: appointment.external_calendar_id,
      eventId: appointment.external_event_id,
      requestBody: updates
      // Fase 4: headers If-Match com gcal_etag salvo
    });
    await supabase.from('appointments').update({
      html_link: resp.data.htmlLink ?? null,
      gcal_etag: resp.data.etag ?? null
    }).eq('id', appointment.id);
    return resp.data;
  }

  async deleteEvent(calendarId: string, eventId: string) {
    try {
      await this.calendar.events.delete({ calendarId, eventId });
    } catch (e: any) {
      if (e.code === 410) return; // já deletado
      throw e;
    }
  }
}
```

---

## 🔁 3) Worker/Cron — processar `gcal_sync_queue` (Cedro → GCal)

**Tarefa:** criar endpoint/rota cron (`/api/cron/process-gcal-sync`) que:

1. Busca lotes `pending` (ex.: 10).
2. Marca `processing`.
3. Executa `createEvent` / `patchEvent` / `deleteEvent`.
4. Marca `completed` **ou** incrementa `retry_count` com backoff (2s/4s/8s…).

**Observação:** consultar `users.google_calendar_id` pelo `appointment.therapist_id` para saber o `calendarId`.

---

## 📣 4) Webhook (GCal → Cedro) + Sync incremental

**Tarefa:** criar `POST /api/gcal/webhook` com validação:

* Headers: `x-goog-channel-id`, `x-goog-resource-id`, `x-goog-resource-state`, `x-goog-channel-token`.
* Validar canal ativo por **`channel_id` + `resource_id` + `channel_token` + `is_active=true`**.
* Descobrir `calendar_id` do canal → ler `sync_token` em `cedro.google_calendar_sync_state`.
* Se `state='sync'`: fazer **list inicial** para capturar **primeiro `nextSyncToken`**.
* Sempre usar `singleEvents=true`.
* Processar:

  * ignorar `transparency='transparent'`
  * upsert por (`external_calendar_id`,`external_event_id`), set `origin='google'`
  * salvar `summary`, `start/end`, `status` (cancelled/scheduled), `source_updated_at`, `recurring_event_id`, `ical_uid`, `html_link`, `gcal_etag`
* Atualizar `sync_state.sync_token` e `last_sync_at`.

**Separar**: `calendar_id` tem **um só `syncToken`**, **independente** do channel.

**Resync manual**: `GET /api/gcal/resync/:therapist_id` faz full sync da janela móvel (ex.: `timeMin=now()-30d`, `timeMax=now()+365d`) e atualiza `syncToken`.

---

## 🖥️ 5) Setup Watch / Renovação

**Tarefa:** `POST /api/gcal/setup-watch` para um `therapist_id`:

1. Ler `users.google_calendar_id`.
2. Gerar `channel_id` (UUID) e `channel_token` (UUID).
3. Registrar `events.watch` com `address={APP_URL}/api/gcal/webhook` e `token=channel_token`.
4. Inserir `google_calendar_sync_state` (se não existir) e `google_calendar_channels` (ativo).
5. **Não** mexer no `sync_token` ao renovar.

**Cron** de renovação: buscar channels que expiram em < 24h, chamar `stop` e criar novo, mantendo `syncToken`.

---

## 🧪 6) Testes / Aceite

**Cenários (use Chrome DevTools MCP para inspecionar a UI se necessário):**

1. **Cedro→GCal (create/update/delete)**: confirmar no GCal (usar `html_link`).
2. **GCal→Cedro (webhook)**: criar/editar/deletar no GCal e ver upsert no banco.
3. **Resync (410)**: forçar 410 e checar full resync + novo token.
4. **Recorrência**: vincular `patient_id` em uma ocorrência importada e validar propagação nas futuras (mesma série).
5. **Transparência**: evento `transparent` NÃO aparece/bloqueia.
6. **Loop**: garantir que update vindo do GCal **não** cria job na fila (ver `gcal_sync_queue`).
7. **Conflito de horário**: Cedro→GCal deve falhar com mensagem amigável se GCal recusar.

---

## 🎨 7) UI (mínimo necessário)

* Mostrar `summary`, `origin` (badge “Google”/“Cedro”), `html_link` (abrir no Google).
* Destacar `patient_id IS NULL` (alerta) com ação “Vincular paciente”.

---

## 🔐 8) Vars de ambiente (no servidor)

```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=  # da conta mestre
APP_URL=https://<seu-app>
CRON_SECRET=<segredo>
SUPABASE_SERVICE_ROLE_KEY=<key>
NEXT_PUBLIC_SUPABASE_URL=<url>
```

---

## 🧭 9) Ordem de execução (sugestão)

1. **Migrations** (Supabase MCP) + validar triggers existentes (bypass/overlap/propagate).
2. **Service** GoogleCalendar + **worker/cron** (Cedro→GCal).
3. **Webhook** + **sync incremental** (GCal→Cedro) + **setup-watch**.
4. **Cron de renovação** dos channels.
5. **UI mínima** + **testes** + **logs**.

---

## ✅ Critérios de aceite (objetivos)

* **Ida e volta** funcionando, sem loop.
* **`syncToken` por calendário** persistido e reaproveitado ao renovar channel.
* **Eventos transparent** ignorados; all-day conforme regra (ignorar transparent; opaque opcionalmente bloquear).
* **Logs** gravados em `calendar_sync_log` (request/response sanitizados).
* **Fila** esvazia com sucesso e reprocessa falhas com retry/backoff.

> Dúvidas de implementação me pergunte, além disso use Chrome DevTools MCP e Supabase MCP (`execute query`) para validar DDL/dados.

---