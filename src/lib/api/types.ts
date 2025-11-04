/**
 * CEDRO API Types
 * Type definitions for all API responses and data structures
 */

// ============ SHARED TYPES ============

export type CedroRole = 'admin' | 'therapist' | 'patient'

export interface Timestamps {
  created_at: string
  updated_at: string
}

// ============ USER ============

export interface User extends Timestamps {
  id: string
  name: string
  email: string
  phone: string | null
  role: CedroRole
  gender?: 'M' | 'F' | 'O' | null
  approaches?: string[]
  is_active: boolean
}

export interface Therapist extends User {
  role: 'therapist'
}

// ============ PATIENT ============

export interface Patient extends Timestamps {
  id: string
  full_name: string
  birth_date: string | null
  cpf: string | null
  email: string | null
  phone: string | null
  gender: 'M' | 'F' | 'O' | null
  is_christian: boolean | null
  origin: string | null
  marital_status: string | null
  occupation: string | null
  notes: string | null
  address_json: Record<string, any> | null
  tags_text: string[]
  is_on_hold: boolean
  therapist_id: string | null
}

export interface PatientWithTherapist extends Patient {
  therapist?: User | null
}

// ============ APPOINTMENT ============

export interface Appointment extends Timestamps {
  id: string
  patient_id: string
  therapist_id: string
  service_id: string | null
  care_plan_id: string | null
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled'
  start_at: string
  end_at: string
  channel: string | null
  origin_message_id: string | null
  notes: string | null
  meet_link: string | null
}

export interface AppointmentWithDetails extends Appointment {
  patient?: Patient
  therapist?: User
  service?: Service
}

// ============ SERVICE ============

export interface Service extends Timestamps {
  id: string
  name: string
  description: string | null
  default_duration_min: number
  base_price_cents: number
  active: boolean
}

// ============ SCHEDULE ============

export interface TherapistSchedule extends Timestamps {
  id: string
  therapist_id: string
  weekday: number // 0-6 (Sunday-Saturday)
  start_time: string // HH:MM
  end_time: string // HH:MM
  note: string | null
}

export interface ScheduleException extends Timestamps {
  id: string
  therapist_id: string
  date: string // YYYY-MM-DD
  kind: 'block' | 'extra'
  start_time: string // HH:MM
  end_time: string // HH:MM
  note: string | null
}

// ============ MEDICAL RECORD ============

export type MedicalRecordType = 'anamnesis' | 'soap' | 'evolution' | 'prescription_draft'

export interface MedicalRecord extends Timestamps {
  id: string
  patient_id: string
  appointment_id: string | null
  note_type: MedicalRecordType
  content_json: Record<string, any>
  visibility: 'private' | 'team'
  signed_by: string | null
  signed_at: string | null
}

export interface MedicalRecordWithDetails extends MedicalRecord {
  patient?: Patient
  appointment?: Appointment
  signed_by_user?: User
}

// ============ RECORDING JOB ============

export type RecordingJobStatus =
  | 'uploaded'
  | 'processing'
  | 'transcribing'
  | 'generating_record'
  | 'completed'
  | 'error'

export interface RecordingJob extends Timestamps {
  id: string
  patient_id: string
  therapist_id: string
  appointment_id: string | null
  sources_json: string[] | null
  audio_storage_url: string | null
  merged_audio_url: string | null
  status: RecordingJobStatus
  transcript_raw_text: string | null
  transcript_clean_text: string | null
  record_id: string | null
  error_msg: string | null
  audio_chunks_json: Record<string, any>[]
  total_chunks: number
  processed_chunks: number
  audio_duration_seconds: number | null
  processing_started_at: string | null
  processing_completed_at: string | null
  medical_record: Record<string, any> | null
  note_type: MedicalRecordType
  tipo_consulta: 'anamnese' | 'evolucao'
}

export interface RecordingJobWithDetails extends RecordingJob {
  patient?: Patient
  therapist?: User
  appointment?: Appointment
  record?: MedicalRecord
}

// ============ CRM LEAD ============

export interface CrmLead extends Timestamps {
  id: string
  name: string | null
  phone: string | null
  email: string | null
  city_uf: string | null
  is_christian: boolean | null
  source: string | null
  stage: 'lead' | 'mql' | 'sql' | 'won' | 'lost'
  notes: string | null
}

// ============ CARE PLAN ============

export interface CarePlan extends Timestamps {
  id: string
  patient_id: string
  therapist_id: string
  service_id: string | null
  plan_type: 'avulsa' | '4' | '10' | 'quinzenal'
  total_sessions: number
  used_sessions: number
  price_cents: number
  discount_percent: number
  status: 'active' | 'paused' | 'ended'
}

export interface CarePlanWithDetails extends CarePlan {
  patient?: Patient
  therapist?: User
  service?: Service
}

// ============ INVOICE ============

export interface Invoice extends Timestamps {
  id: string
  patient_id: string
  appointment_id: string | null
  care_plan_id: string | null
  therapist_id: string | null
  status: 'draft' | 'open' | 'paid' | 'partial' | 'overdue' | 'cancelled'
  amount_cents: number
  currency: string
  due_date: string | null
  paid_at: string | null
  asaas_customer_id: string | null
  asaas_invoice_id: string | null
  breakdown_json: Record<string, any>
  google_docs_contract_id: string | null
  contract_generated_at: string | null
  contract_status: string
  contract_id: string | null
}

export interface InvoiceWithDetails extends Invoice {
  patient?: Patient
  therapist?: User
  appointment?: Appointment
  care_plan?: CarePlan
}

// ============ API ERRORS ============

export interface ApiError {
  code: string
  message: string
  status: number
  details?: Record<string, any>
}

// ============ PAGINATION ============

export interface PaginationParams {
  page: number
  pageSize: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
