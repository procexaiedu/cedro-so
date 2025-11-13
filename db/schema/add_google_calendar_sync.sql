-- ============================================================================
-- GOOGLE CALENDAR SYNCHRONIZATION - IDEMPOTENT MIGRATIONS
-- Schema: cedro
-- Purpose: Sincronização bidirecional entre Cedro e Google Calendar
-- ============================================================================
-- BLOCO 1: Alterações na tabela 'appointments'
-- Adiciona campos para rastrear sincronização com Google Calendar
-- ============================================================================
ALTER TABLE cedro.appointments
  ADD COLUMN IF NOT EXISTS origin text DEFAULT 'system' CHECK (origin IN ('system', 'google')),
  ADD COLUMN IF NOT EXISTS summary text,
  ADD COLUMN IF NOT EXISTS external_event_id text,
  ADD COLUMN IF NOT EXISTS external_calendar_id text,
  ADD COLUMN IF NOT EXISTS source_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS recurring_event_id text,
  ADD COLUMN IF NOT EXISTS ical_uid text,
  ADD COLUMN IF NOT EXISTS html_link text,
  ADD COLUMN IF NOT EXISTS gcal_etag text;

COMMENT ON COLUMN cedro.appointments.origin IS 'Origem do agendamento: system (criado no Cedro) ou google (sincronizado do Google Calendar)';
COMMENT ON COLUMN cedro.appointments.summary IS 'Título/resumo do evento (pode ser diferente do description)';
COMMENT ON COLUMN cedro.appointments.external_event_id IS 'ID do evento no Google Calendar (eventId)';
COMMENT ON COLUMN cedro.appointments.external_calendar_id IS 'ID da agenda no Google Calendar (calendarId)';
COMMENT ON COLUMN cedro.appointments.source_updated_at IS 'Timestamp da última atualização na fonte (GCal)';
COMMENT ON COLUMN cedro.appointments.recurring_event_id IS 'ID da série recorrente no Google Calendar (para rastrear ocorrências de série)';
COMMENT ON COLUMN cedro.appointments.ical_uid IS 'UID iCalendar único para o evento';
COMMENT ON COLUMN cedro.appointments.html_link IS 'Link para abrir o evento no Google Calendar';
COMMENT ON COLUMN cedro.appointments.gcal_etag IS 'ETag do Google para detecção de conflitos (If-Match)';

-- ============================================================================
-- BLOCO 2: Índice de unicidade para idempotência
-- Garante que não criaremos duplicatas ao sincronizar do GCal
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname='cedro' AND indexname='uq_appointments_calendar_event'
  ) THEN
    CREATE UNIQUE INDEX uq_appointments_calendar_event
      ON cedro.appointments (external_calendar_id, external_event_id)
      WHERE external_event_id IS NOT NULL AND origin = 'google';

    RAISE NOTICE 'Índice uq_appointments_calendar_event criado com sucesso';
  ELSE
    RAISE NOTICE 'Índice uq_appointments_calendar_event já existe';
  END IF;
END$$;

-- ============================================================================
-- BLOCO 3: Tabela para estado de sincronização (sync token)
-- Armazena o token de sincronização incremental por calendário
-- ============================================================================
CREATE TABLE IF NOT EXISTS cedro.google_calendar_sync_state (
  calendar_id   text PRIMARY KEY,
  sync_token    text,
  last_sync_at  timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sync_state_last_sync ON cedro.google_calendar_sync_state(last_sync_at DESC);

COMMENT ON TABLE cedro.google_calendar_sync_state IS 'Armazena estado de sincronização incremental por calendário do Google';
COMMENT ON COLUMN cedro.google_calendar_sync_state.calendar_id IS 'ID da agenda no Google Calendar (e-mail ou ID de grupo)';
COMMENT ON COLUMN cedro.google_calendar_sync_state.sync_token IS 'Token para sincronização incremental (usado em próximas chamadas)';
COMMENT ON COLUMN cedro.google_calendar_sync_state.last_sync_at IS 'Data/hora do último sync bem-sucedido';

-- ============================================================================
-- BLOCO 4: Tabela para canais de webhook
-- Registra os webhooks ativos para notificações em tempo real do GCal
-- ============================================================================
CREATE TABLE IF NOT EXISTS cedro.google_calendar_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id uuid NOT NULL REFERENCES cedro.users(id) ON DELETE CASCADE,
  calendar_id  text NOT NULL REFERENCES cedro.google_calendar_sync_state(calendar_id) ON DELETE CASCADE,
  channel_id   text NOT NULL UNIQUE,
  resource_id  text NOT NULL,
  channel_token text NOT NULL,
  expiration   timestamptz NOT NULL,
  is_active    boolean DEFAULT true,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now(),
  CONSTRAINT unique_therapist_calendar UNIQUE(therapist_id, calendar_id)
);

CREATE INDEX IF NOT EXISTS idx_channels_therapist ON cedro.google_calendar_channels(therapist_id);
CREATE INDEX IF NOT EXISTS idx_channels_calendar ON cedro.google_calendar_channels(calendar_id);
CREATE INDEX IF NOT EXISTS idx_channels_expiration ON cedro.google_calendar_channels(expiration) WHERE is_active = true;

COMMENT ON TABLE cedro.google_calendar_channels IS 'Canais de webhook ativos para monitorar mudanças no Google Calendar em tempo real';
COMMENT ON COLUMN cedro.google_calendar_channels.channel_id IS 'ID do canal gerado localmente (UUID)';
COMMENT ON COLUMN cedro.google_calendar_channels.resource_id IS 'ID do recurso no Google (retornado pela API)';
COMMENT ON COLUMN cedro.google_calendar_channels.channel_token IS 'Token para validar webhooks recebidos';
COMMENT ON COLUMN cedro.google_calendar_channels.expiration IS 'Data de expiração do canal (Google expira após ~24h)';

-- ============================================================================
-- BLOCO 5: Tabela para fila de sincronização (Cedro → GCal)
-- Garante entrega confiável de mudanças criadas no Cedro para o GCal
-- ============================================================================
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
CREATE INDEX IF NOT EXISTS idx_sync_queue_appointment ON cedro.gcal_sync_queue(appointment_id);

COMMENT ON TABLE cedro.gcal_sync_queue IS 'Fila de trabalho para sincronizar mudanças do Cedro para o Google Calendar';
COMMENT ON COLUMN cedro.gcal_sync_queue.action IS 'Tipo de operação: create (novo), update (edição), delete (exclusão)';
COMMENT ON COLUMN cedro.gcal_sync_queue.status IS 'Estado do job: pending (aguardando), processing (em processamento), completed (sucesso), failed (falha)';
COMMENT ON COLUMN cedro.gcal_sync_queue.retry_count IS 'Número de tentativas realizadas';
COMMENT ON COLUMN cedro.gcal_sync_queue.last_error IS 'Mensagem de erro da última tentativa';

-- ============================================================================
-- BLOCO 6: Tabela para logs de sincronização
-- Auditoria e troubleshooting de todas as operações de sincronização
-- ============================================================================
CREATE TABLE IF NOT EXISTS cedro.calendar_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    text,
  calendar_id text,
  action      text NOT NULL,
  direction   text NOT NULL CHECK (direction IN ('cedro_to_google', 'google_to_cedro')),
  status      text NOT NULL CHECK (status IN ('success', 'error', 'skipped')),
  error_message text,
  payload     jsonb,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sync_log_event   ON cedro.calendar_sync_log(event_id);
CREATE INDEX IF NOT EXISTS idx_sync_log_created ON cedro.calendar_sync_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_log_calendar ON cedro.calendar_sync_log(calendar_id);

COMMENT ON TABLE cedro.calendar_sync_log IS 'Log de auditoria para todas as operações de sincronização';
COMMENT ON COLUMN cedro.calendar_sync_log.direction IS 'cedro_to_google (Cedro enviando para GCal) ou google_to_cedro (GCal enviando para Cedro)';
COMMENT ON COLUMN cedro.calendar_sync_log.payload IS 'Payload JSON da operação (request/response sanitizado)';

-- ============================================================================
-- BLOCO 7: Trigger de propagação de paciente para série recorrente
-- Quando vincular um paciente a uma ocorrência importada, propaguar para futuras
-- ============================================================================
CREATE OR REPLACE FUNCTION cedro.trg_propagate_patient_for_series()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Se foi feito UPDATE de patient_id (de NULL para um ID):
  -- E o evento é de origem Google (origin='google')
  -- E faz parte de uma série recorrente (recurring_event_id NOT NULL)
  -- Então propagar para TODAS as futuras ocorrências não confirmadas
  IF TG_OP = 'UPDATE'
     AND NEW.patient_id IS NOT NULL
     AND OLD.patient_id IS NULL
     AND NEW.recurring_event_id IS NOT NULL
     AND NEW.origin = 'google'
  THEN
    UPDATE cedro.appointments a
       SET patient_id = NEW.patient_id,
           updated_at = now()
     WHERE a.therapist_id = NEW.therapist_id
       AND a.external_calendar_id = NEW.external_calendar_id
       AND a.recurring_event_id = NEW.recurring_event_id
       AND a.origin = 'google'
       AND a.status <> 'cancelled'
       AND a.patient_id IS NULL
       AND a.start_at >= date_trunc('day', now());

    RAISE NOTICE 'Propagado patient_id % para série recorrente %',
                 NEW.patient_id, NEW.recurring_event_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Remover trigger anterior se existir
DROP TRIGGER IF EXISTS trg_propagate_patient_for_series ON cedro.appointments;

-- Criar novo trigger
CREATE TRIGGER trg_propagate_patient_for_series
AFTER UPDATE OF patient_id ON cedro.appointments
FOR EACH ROW
EXECUTE FUNCTION cedro.trg_propagate_patient_for_series();

COMMENT ON FUNCTION cedro.trg_propagate_patient_for_series()
  IS 'Propaga vinculação de paciente para futuras ocorrências da mesma série recorrente';

-- ============================================================================
-- BLOCO 8: Triggers para enfileiramento de mudanças Cedro → GCal
-- Previne loops: não enfileira se origin='google'
-- ============================================================================

-- Função para enfileirar INSERT/UPDATE (exceto eventos do GCal)
CREATE OR REPLACE FUNCTION cedro.trg_enqueue_gcal_sync()
RETURNS TRIGGER AS $$
DECLARE
  v_has_gcal_enabled boolean;
BEGIN
  -- Não enfileirar mudanças vindas do Google Calendar
  IF NEW.origin = 'google' THEN
    RAISE DEBUG 'Evento origem=google, não enfileirando para sincronização';
    RETURN NEW;
  END IF;

  -- Verificar se o terapeuta tem Google Calendar configurado
  SELECT (u.google_calendar_id IS NOT NULL) INTO v_has_gcal_enabled
  FROM cedro.users u
  WHERE u.id = NEW.therapist_id;

  -- Se tem Google Calendar, enfileirar para sincronização
  IF v_has_gcal_enabled THEN
    INSERT INTO cedro.gcal_sync_queue (appointment_id, action, status, created_at)
    VALUES (
      NEW.id,
      CASE
        WHEN TG_OP='INSERT' THEN 'create'
        WHEN TG_OP='UPDATE' THEN 'update'
        ELSE 'update'
      END,
      'pending',
      now()
    );

    RAISE DEBUG 'Agendamento % enfileirado para sincronização com Google Calendar', NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover triggers anteriores se existirem
DROP TRIGGER IF EXISTS sync_to_gcal_after_change ON cedro.appointments;
DROP TRIGGER IF EXISTS sync_to_gcal_before_delete ON cedro.appointments;

-- Criar trigger para INSERT/UPDATE
CREATE TRIGGER sync_to_gcal_after_change
AFTER INSERT OR UPDATE ON cedro.appointments
FOR EACH ROW
EXECUTE FUNCTION cedro.trg_enqueue_gcal_sync();

-- Função para enfileirar DELETE
CREATE OR REPLACE FUNCTION cedro.trg_enqueue_gcal_sync_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Só enfileirar se o evento foi sincronizado com o Google (tem external_event_id)
  IF OLD.external_event_id IS NOT NULL AND OLD.origin <> 'google' THEN
    INSERT INTO cedro.gcal_sync_queue (appointment_id, action, status, created_at)
    VALUES (
      OLD.id,
      'delete',
      'pending',
      now()
    );

    RAISE DEBUG 'Agendamento % enfileirado para DELEÇÃO no Google Calendar', OLD.id;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para DELETE
CREATE TRIGGER sync_to_gcal_before_delete
BEFORE DELETE ON cedro.appointments
FOR EACH ROW
EXECUTE FUNCTION cedro.trg_enqueue_gcal_sync_delete();

COMMENT ON FUNCTION cedro.trg_enqueue_gcal_sync()
  IS 'Enfileira INSERT/UPDATE de agendamentos criados no Cedro para sincronização com Google Calendar';
COMMENT ON FUNCTION cedro.trg_enqueue_gcal_sync_delete()
  IS 'Enfileira DELETE de agendamentos sincronizados para remoção no Google Calendar';

-- ============================================================================
-- VERIFICAÇÃO: Confirme que tudo foi criado
-- Execute esta query para validar se as tabelas e índices existem
-- ============================================================================
/*
-- Descomente para executar validação:
SELECT 'Tabelas criadas:' as validation;

SELECT
  table_name,
  'cedro.' || table_name as full_name,
  'EXISTS' as status
FROM information_schema.tables
WHERE table_schema = 'cedro'
  AND table_name IN (
    'google_calendar_sync_state',
    'google_calendar_channels',
    'gcal_sync_queue',
    'calendar_sync_log'
  )
ORDER BY table_name;

SELECT 'Índices criados:' as validation;

SELECT
  indexname,
  'EXISTS' as status
FROM pg_indexes
WHERE schemaname = 'cedro'
  AND indexname IN (
    'uq_appointments_calendar_event',
    'idx_sync_state_last_sync',
    'idx_channels_therapist',
    'idx_channels_calendar',
    'idx_channels_expiration',
    'idx_sync_queue_status',
    'idx_sync_queue_appointment',
    'idx_sync_log_event',
    'idx_sync_log_created',
    'idx_sync_log_calendar'
  )
ORDER BY indexname;

SELECT 'Colunas adicionadas em appointments:' as validation;

SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'cedro'
  AND table_name = 'appointments'
  AND column_name IN (
    'origin',
    'summary',
    'external_event_id',
    'external_calendar_id',
    'source_updated_at',
    'recurring_event_id',
    'ical_uid',
    'html_link',
    'gcal_etag'
  )
ORDER BY column_name;

SELECT 'Triggers criados:' as validation;

SELECT
  trigger_name,
  event_manipulation,
  action_orientation,
  'EXISTS' as status
FROM information_schema.triggers
WHERE trigger_schema = 'cedro'
  AND trigger_name IN (
    'trg_propagate_patient_for_series',
    'sync_to_gcal_after_change',
    'sync_to_gcal_before_delete'
  )
ORDER BY trigger_name;
*/
