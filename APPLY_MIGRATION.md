# Aplicar Migration - Campos do Google Calendar

## Problema Identificado
A view `appointments_with_details` no banco de dados não incluía os campos de sincronização do Google Calendar (summary, origin, html_link, etc.), impossibilitando que essas informações fossem exibidas na interface.

## Solução
Atualizar a view para incluir todos os campos necessários.

## Como Executar a Migration

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse seu projeto no Supabase: https://supabase.com/dashboard
2. Vá para **SQL Editor**
3. Clique em **New Query**
4. Copie e cole todo o conteúdo do arquivo:
   ```
   db/migrations/update_appointments_view_with_google_fields.sql
   ```
5. Clique em **Run**
6. Aguarde a execução (deve ser rápido)

### Opção 2: Via CLI (se tiver configurado)

```bash
# Se tiver supabase-cli instalado:
supabase db push

# Ou manualmente via psql:
psql $DATABASE_URL < db/migrations/update_appointments_view_with_google_fields.sql
```

### Opção 3: Executar SQL Direto

Abra um SQL client conectado ao seu banco Cedro e execute:

```sql
-- Drop existing view
DROP VIEW IF EXISTS cedro.appointments_with_details CASCADE;

-- Recreate the view with all fields
CREATE OR REPLACE VIEW cedro.appointments_with_details AS
SELECT
    a.id,
    a.patient_id,
    a.therapist_id,
    a.service_id,
    a.care_plan_id,
    a.status,
    a.start_at,
    a.end_at,
    a.channel,
    a.origin_message_id,
    a.notes,
    a.meet_link,
    a.created_at,
    a.updated_at,
    -- Google Calendar sync fields
    a.origin,
    a.summary,
    a.external_event_id,
    a.external_calendar_id,
    a.source_updated_at,
    a.recurring_event_id,
    a.ical_uid,
    a.html_link,
    a.gcal_etag,
    -- Related data
    p.full_name as patient_name,
    p.email as patient_email,
    p.phone as patient_phone,
    u.name as therapist_name,
    u.email as therapist_email,
    s.name as service_name,
    s.description as service_description,
    s.default_duration_min as service_duration,
    s.base_price_cents as service_price
FROM cedro.appointments a
LEFT JOIN cedro.patients p ON a.patient_id = p.id
LEFT JOIN cedro.users u ON a.therapist_id = u.id
LEFT JOIN cedro.services s ON a.service_id = s.id;

-- Add comment
COMMENT ON VIEW cedro.appointments_with_details IS 'View otimizada com dados relacionados de agendamentos, incluindo campos de sincronização com Google Calendar';
```

## O que Mudou

### Campos Adicionados à View:
- ✅ `origin` - Origem do agendamento (system ou google)
- ✅ `summary` - Título/resumo do evento do Google Calendar
- ✅ `external_event_id` - ID do evento no Google Calendar
- ✅ `external_calendar_id` - ID da agenda no Google Calendar
- ✅ `source_updated_at` - Última atualização na fonte
- ✅ `recurring_event_id` - ID da série recorrente
- ✅ `ical_uid` - UID iCalendar
- ✅ `html_link` - Link para abrir no Google Calendar
- ✅ `gcal_etag` - ETag para detecção de conflitos
- ✅ `channel` - Canal de comunicação
- ✅ `origin_message_id` - ID da mensagem de origem
- ✅ `meet_link` - Link do Google Meet

## Resultado Esperado

Após executar a migration, a agenda exibirá:
- 📅 Indicador de origem (Google Calendar vs Cedro)
- 📝 Summary/Título do evento
- 🔗 Link para abrir no Google Calendar
- 🕐 Horário e duração com service name
- 👤 Nome do paciente
- 💼 Nome do terapeuta e serviço

## Verificação

Para verificar se funcionou, execute no Supabase SQL:

```sql
SELECT
    id,
    patient_name,
    therapist_name,
    summary,
    origin,
    html_link
FROM cedro.appointments_with_details
LIMIT 5;
```

Você deve ver colunas com `summary`, `origin` e `html_link` preenchidas.

## Troubleshooting

### Erro: "View does not exist"
- A view pode ter sido dropada, execute novamente a migration completa

### Erro: "Column does not exist"
- Verifique se os campos foram adicionados à tabela `cedro.appointments`
- Execute: `SELECT origin, summary, html_link FROM cedro.appointments LIMIT 1;`

### Os dados ainda não aparecem na UI
- Faça cache clear no navegador (Ctrl+Shift+Delete ou Cmd+Shift+Delete)
- Reinicie a aplicação se necessário
