# Cedro Database Schema

**Last Updated:** November 2025 | **Schema:** `cedro` (PostgreSQL)
**Related Docs:** [Project Architecture](./01-project-architecture.md), [SOP](./04-sop.md)

## Schema Overview

All tables are in the `cedro` schema (not `public`). The database is hosted on Supabase (PostgreSQL) and uses standard SQL with Postgres-specific features.

## Core Entities

### users
Therapists and clinic administrators.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | uuid | PK | auto-generated |
| name | text | - | Therapist/admin name |
| email | text | UNIQUE | Contact email |
| phone | text | nullable | Phone number |
| role | text | CHECK: admin, therapist | User role |
| gender | text | nullable, CHECK: M/F/O | Gender |
| approaches | text[] | nullable, default: [] | Therapy approaches |
| is_active | boolean | default: true | Account status |
| created_at | timestamptz | default: now() | Creation timestamp |
| updated_at | timestamptz | default: now() | Last update |

**Foreign Keys Referenced By:**
- patient_therapist_links.therapist_id
- therapist_schedules.therapist_id
- care_plans.therapist_id
- appointments.therapist_id
- invoices.therapist_id
- recording_jobs.therapist_id
- medical_records.signed_by
- contracts.therapist_id
- patients.therapist_id

---

### patients
Patient/client information.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | uuid | PK | auto-generated |
| full_name | text | required | Patient name |
| birth_date | date | nullable | Date of birth |
| cpf | text | nullable, UNIQUE | Brazilian CPF |
| email | text | nullable | Contact email |
| phone | text | nullable, UNIQUE | Phone number |
| gender | text | nullable, CHECK: M/F/O | Gender |
| is_christian | boolean | nullable | Religious affiliation |
| origin | text | nullable | Patient origin/referral source |
| marital_status | text | nullable | Marital status |
| occupation | text | nullable | Patient occupation |
| notes | text | nullable | Clinical notes |
| address_json | jsonb | default: {} | Address components |
| tags_text | text[] | default: [] | Custom tags |
| is_on_hold | boolean | default: false | Pause status |
| therapist_id | uuid | nullable, FK | Primary therapist |
| created_at | timestamptz | default: now() | Registration date |
| updated_at | timestamptz | default: now() | Last update |

**Key Relationships:**
- Can have multiple therapists via `patient_therapist_links`
- Primary therapist via `therapist_id`

---

### patient_therapist_links
Links between patients and therapists (many-to-many).

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | uuid | PK | auto-generated |
| patient_id | uuid | FK (patients) | Patient reference |
| therapist_id | uuid | FK (users) | Therapist reference |
| status | text | default: active, CHECK | active, ended |
| started_at | timestamptz | default: now() | Start date |
| ended_at | timestamptz | nullable | End date |
| reason | text | nullable | Reason for ending |
| created_at | timestamptz | default: now() | Link creation |

---

### appointments
Scheduled therapy sessions.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | uuid | PK | auto-generated |
| patient_id | uuid | FK (patients) | Patient |
| therapist_id | uuid | FK (users) | Therapist |
| service_id | uuid | nullable, FK (services) | Service type |
| care_plan_id | uuid | nullable, FK (care_plans) | Associated care plan |
| status | text | default: scheduled, CHECK | scheduled, confirmed, completed, cancelled, no_show, rescheduled |
| start_at | timestamptz | required | Appointment start |
| end_at | timestamptz | required | Appointment end |
| channel | text | nullable | Communication channel |
| origin_message_id | uuid | nullable | Linked message ID |
| notes | text | nullable | Session notes |
| meet_link | text | nullable | Video call link |
| created_at | timestamptz | default: now() | Creation date |
| updated_at | timestamptz | default: now() | Last update |

---

### therapist_schedules
Recurring availability for therapists.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | uuid | PK | auto-generated |
| therapist_id | uuid | FK (users) | Therapist |
| weekday | integer | CHECK: 0-6 | 0=Sunday, 6=Saturday |
| start_time | time | required | Work start time |
| end_time | time | required | Work end time |
| note | text | nullable | Notes |
| created_at | timestamptz | default: now() | Creation |
| updated_at | timestamptz | default: now() | Update |

---

### therapist_schedule_exceptions
Override recurring schedules (blocks or extra times).

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | uuid | PK | auto-generated |
| therapist_id | uuid | FK (users) | Therapist |
| date | date | required | Exception date |
| kind | text | CHECK: block, extra | block=unavailable, extra=additional hours |
| start_time | time | required | Start time |
| end_time | time | required | End time |
| note | text | nullable | Reason |
| created_at | timestamptz | default: now() | Creation |

---

### services
Service types offered (therapy sessions, consultations, etc.).

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | uuid | PK | auto-generated |
| name | text | required | Service name |
| description | text | nullable | Service description |
| default_duration_min | integer | default: 50 | Session duration |
| base_price_cents | integer | default: 0 | Price in cents |
| active | boolean | default: true | Active status |
| created_at | timestamptz | default: now() | Creation |
| updated_at | timestamptz | default: now() | Update |

---

## Financial Entities

### care_plans
Treatment plans with session packages and pricing.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | uuid | PK | auto-generated |
| patient_id | uuid | FK (patients) | Patient |
| therapist_id | uuid | FK (users) | Therapist |
| service_id | uuid | nullable, FK (services) | Associated service |
| plan_type | text | CHECK: avulsa, 4, 10, quinzenal | Package type |
| total_sessions | integer | default: 1 | Total sessions included |
| used_sessions | integer | default: 0 | Sessions used |
| price_cents | integer | required | Total price in cents |
| discount_percent | integer | nullable, default: 0 | Discount % |
| status | text | default: active, CHECK | active, paused, ended |
| created_at | timestamptz | default: now() | Creation |
| updated_at | timestamptz | default: now() | Update |

---

### invoices
Patient billing and payment tracking.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | uuid | PK | auto-generated |
| patient_id | uuid | FK (patients) | Patient |
| appointment_id | uuid | nullable, FK (appointments) | Single session billing |
| care_plan_id | uuid | nullable, FK (care_plans) | Plan billing |
| therapist_id | uuid | nullable, FK (users) | Therapist |
| status | text | CHECK | draft, open, paid, partial, overdue, cancelled |
| amount_cents | integer | required | Amount in cents |
| currency | text | default: BRL | Currency |
| due_date | date | nullable | Payment due date |
| paid_at | timestamptz | nullable | Payment date |
| asaas_customer_id | text | nullable | Asaas customer ID |
| asaas_invoice_id | text | nullable | Asaas invoice ID |
| breakdown_json | jsonb | default: {} | Line items breakdown |
| google_docs_contract_id | text | nullable | Contract doc ID |
| contract_generated_at | timestamptz | nullable | Contract generation |
| contract_status | text | default: pending | Contract status |
| contract_id | uuid | nullable, FK (contracts) | Associated contract |
| created_at | timestamptz | default: now() | Creation |
| updated_at | timestamptz | default: now() | Update |

---

### payments
Payment records for invoices.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | uuid | PK | auto-generated |
| invoice_id | uuid | FK (invoices) | Invoice |
| amount_cents | integer | required | Payment amount |
| method | text | nullable | Payment method |
| status | text | nullable | Payment status |
| asaas_payment_id | text | nullable | Asaas payment ID |
| gateway_payload_json | jsonb | default: {} | Gateway response |
| paid_at | timestamptz | nullable | Actual payment date |
| created_at | timestamptz | default: now() | Record creation |
| updated_at | timestamptz | default: now() | Update |

---

### account_credits
Patient account credits (overpayments, refunds).

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | uuid | PK | auto-generated |
| patient_id | uuid | FK (patients) | Patient |
| origin_invoice_id | uuid | nullable, FK (invoices) | Source invoice |
| amount_cents | integer | required | Credit amount |
| applied_to_care_plan_id | uuid | nullable, FK (care_plans) | Applied to plan |
| note | text | nullable | Reason for credit |
| created_at | timestamptz | default: now() | Creation |
| updated_at | timestamptz | default: now() | Update |

---

### contracts
Digital service contracts.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | uuid | PK | auto-generated |
| invoice_id | uuid | FK (invoices) | Associated invoice |
| patient_id | uuid | FK (patients) | Patient |
| therapist_id | uuid | FK (users) | Therapist |
| google_docs_id | text | UNIQUE | Google Docs document ID |
| google_docs_share_link | text | nullable | Share link |
| status | text | default: draft | draft, signed, finalized |
| template_version | text | default: v1 | Template version |
| placeholder_values | jsonb | nullable | Template variables |
| signed_at | timestamptz | nullable | Signature date |
| finalized_at | timestamptz | nullable | Finalization date |
| created_at | timestamptz | default: now() | Creation |
| updated_at | timestamptz | default: now() | Update |

---

## Medical Records

### medical_records
Patient clinical notes (SOAP, evolution, anamnesis, prescriptions).

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | uuid | PK | auto-generated |
| patient_id | uuid | FK (patients) | Patient |
| appointment_id | uuid | nullable, FK (appointments) | Session reference |
| note_type | text | CHECK | anamnesis, soap, evolution, prescription_draft |
| content_json | jsonb | required | Record content |
| visibility | text | default: private, CHECK | private, team |
| signed_by | uuid | nullable, FK (users) | Signing therapist |
| signed_at | timestamptz | nullable | Signature date |
| created_at | timestamptz | default: now() | Creation |
| updated_at | timestamptz | default: now() | Update |

---

### recording_jobs
Audio transcription job tracking and medical record generation.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | uuid | PK | auto-generated |
| patient_id | uuid | FK (patients) | Patient |
| therapist_id | uuid | FK (users) | Therapist |
| appointment_id | uuid | nullable, FK (appointments) | Session |
| status | text | default: uploaded, CHECK | uploaded, processing, transcribing, generating_record, completed, error |
| sources_json | jsonb | default: [] | Audio file sources |
| audio_storage_url | text | nullable | MinIO URL |
| merged_audio_url | text | nullable | Merged audio URL |
| transcript_raw_text | text | nullable | Raw transcription |
| transcript_clean_text | text | nullable | Cleaned transcript |
| record_id | uuid | nullable, FK (medical_records) | Generated record |
| error_msg | text | nullable | Error details |
| audio_chunks_json | jsonb | default: [] | Processed chunks |
| total_chunks | integer | default: 0 | Total chunks |
| processed_chunks | integer | default: 0 | Processed count |
| audio_duration_seconds | integer | nullable | Total duration |
| processing_started_at | timestamptz | nullable | Process start |
| processing_completed_at | timestamptz | nullable | Process end |
| medical_record | jsonb | nullable | Generated record JSON |
| note_type | text | default: evolution, CHECK | anamnesis, soap, evolution, prescription_draft |
| tipo_consulta | varchar | default: evolucao, CHECK | anamnese, evolucao (Portuguese) |
| created_at | timestamptz | default: now() | Creation |
| updated_at | timestamptz | default: now() | Update |

**Progress Tracking:**
- `processed_chunks / total_chunks` = percentage complete
- `status` transitions: uploaded → processing → transcribing → generating_record → completed

---

## Business & CRM

### crm_leads
Sales leads and prospects.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | uuid | PK | auto-generated |
| name | text | nullable | Lead name |
| phone | text | nullable, UNIQUE | Contact phone |
| email | text | nullable | Email address |
| city_uf | text | nullable | Location |
| is_christian | boolean | nullable | Religious affiliation |
| source | text | nullable | Lead source |
| stage | text | default: lead, CHECK | lead, mql, sql, won, lost |
| notes | text | nullable | Lead notes |
| created_at | timestamptz | default: now() | Creation |
| updated_at | timestamptz | default: now() | Update |

**Stage Definitions:**
- lead: New prospect
- mql: Marketing Qualified Lead
- sql: Sales Qualified Lead
- won: Converted to patient
- lost: Lost opportunity

---

### conversations
Chat messages and contact records across channels.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | uuid | PK | auto-generated |
| channel | text | required | Communication channel |
| contact_key | text | required | Unique contact identifier |
| lead_id | uuid | nullable, FK (crm_leads) | Associated lead |
| patient_id | uuid | nullable, FK (patients) | Associated patient |
| closer_active | boolean | default: false | Closer integration |
| created_at | timestamptz | default: now() | Creation |
| updated_at | timestamptz | default: now() | Update |

---

## AI & Automation

### cerebro
System prompts for LLM modules.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | integer | PK | auto-increment |
| modulo | varchar | UNIQUE | Module identifier |
| nome_display | varchar | - | Display name |
| system_prompt | text | - | Full LLM prompt |
| descricao | text | nullable | Module description |
| versao | varchar | default: 1.0 | Prompt version |
| ativo | boolean | default: true | Active status |
| created_at | timestamptz | default: now() | Creation |
| updated_at | timestamptz | default: now() | Update |
| created_by | varchar | nullable | Creator |

---

### n8n_memoria_agente_* (4 tables)
Agent memory storage for n8n workflows.

**Tables:**
- `n8n_memoria_agente_atendimento` - Support agent
- `n8n_memoria_agente_crm` - CRM agent
- `n8n_memoria_agente_financeiro` - Financial agent
- `n8n_memoria_agente_agendamento` - Scheduling agent

| Field | Type | Notes |
|-------|------|-------|
| id | integer | PK, auto-increment |
| session_id | varchar | Conversation session ID |
| message | jsonb | Message data |

---

### logs
Application event logs.

| Field | Type | Notes |
|-------|------|-------|
| id | bigint | PK, auto-increment |
| input | text | nullable | Input data |
| output_real | text | nullable | Actual output |
| output_esperado | text | nullable | Expected output |
| intermediate_steps | text | nullable | Processing steps |
| feito | boolean | default: false | Completion status |
| ambiente | text | default: atendimento | Environment |
| created_at | timestamptz | default: now() | Timestamp |

---

### audit_logs
Change tracking and audit trail.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | uuid | PK | auto-generated |
| actor_type | text | CHECK: user, agent, system | Who made change |
| actor_id | text | nullable | Actor ID |
| action | text | required | Action type |
| entity | text | required | Entity changed |
| entity_id | text | required | Entity ID |
| diff_json | jsonb | nullable | Change diff |
| created_at | timestamptz | default: now() | Change date |

---

## System Configuration

### policies
System configuration and feature flags.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | uuid | PK | auto-generated |
| key | text | UNIQUE | Config key |
| value_json | jsonb | - | Configuration value |
| version_int | integer | default: 1 | Version for migrations |
| updated_at | timestamptz | default: now() | Last update |

---

## Legacy Tables

### Message
WhatsApp and chat message archival.

| Field | Type | Notes |
|-------|------|-------|
| id | text | PK |
| key | jsonb | Message metadata |
| messageType | varchar | Type of message |
| message | jsonb | Message content |
| participant | varchar | nullable | Message sender |
| messageTimestamp | integer | Timestamp |
| chatwootMessageId | integer | nullable | Chatwoot ID |
| chatwootInboxId | integer | nullable | Chatwoot inbox |
| chatwootConversationId | integer | nullable | Chatwoot conversation |
| status | varchar | nullable | Message status |
| instanceId | text | Instance identifier |
| sessionId | text | nullable | Session ID |

---

### leads, campaigns, campaign_records
Legacy lead management (separate from CRM).

**leads:**
- id, full_name, first_name (generated), phone_e164, source, created_at, last_sent_at

**campaigns:**
- id, name, message_content, created_at

**campaign_records:**
- id, lead_id, campaign_id, status, sent_at

---

## Data Integrity & Constraints

### Key Relationships
- **Patient → Therapist**: Many-to-many via `patient_therapist_links`
- **Appointment → Patient/Therapist**: One-to-many
- **Appointment → Care Plan**: Many-to-one
- **Care Plan → Invoices**: One-to-many
- **Medical Record → Appointment**: One-to-many
- **Recording Job → Medical Record**: One-to-one

### Status Enums
- **Appointment**: scheduled, confirmed, completed, cancelled, no_show, rescheduled
- **Care Plan**: active, paused, ended
- **Invoice**: draft, open, paid, partial, overdue, cancelled
- **Lead Stage**: lead, mql, sql, won, lost
- **Recording Job**: uploaded, processing, transcribing, generating_record, completed, error
- **Contract**: draft, signed, finalized

---

## Query Patterns

### Always Use cedro Schema
```sql
SELECT * FROM cedro.patients WHERE id = $1;
```

### Get Patient with Therapists
```sql
SELECT p.*, u.name as therapist_name
FROM cedro.patients p
LEFT JOIN cedro.patient_therapist_links ptl ON p.id = ptl.patient_id
LEFT JOIN cedro.users u ON ptl.therapist_id = u.id
WHERE p.id = $1 AND ptl.status = 'active';
```

### Get Upcoming Appointments
```sql
SELECT a.*, p.full_name, u.name as therapist
FROM cedro.appointments a
JOIN cedro.patients p ON a.patient_id = p.id
JOIN cedro.users u ON a.therapist_id = u.id
WHERE a.start_at > now() AND a.status IN ('scheduled', 'confirmed')
ORDER BY a.start_at;
```

---

## Performance Indexes

Supabase automatically maintains indexes on:
- Primary keys
- Foreign keys
- UNIQUE constraints

For frequently queried fields, consider requesting additional indexes on:
- `appointments.therapist_id + start_at`
- `medical_records.patient_id + created_at`
- `invoices.status + due_date`

---

## Related Documentation

- [Project Architecture](./01-project-architecture.md) - System design
- [SOP](./04-sop.md) - Database migration procedures
