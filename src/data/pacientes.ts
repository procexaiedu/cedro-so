import { supabase } from '@/lib/supabase'

// Recording Jobs Types
export type RecordingJobStatus = 'uploaded' | 'processing' | 'completed' | 'failed' | 'completed_with_errors'

export type RecordingJob = {
  id: string
  patient_id: string
  therapist_id: string
  appointment_id: string | null
  tipo_consulta: 'anamnese' | 'evolucao'
  status: RecordingJobStatus
  sources_json: any[]
  storage_url: string | null
  transcript_raw_text: string | null
  transcript_clean_text: string | null
  medical_record: any | null
  record_id: string | null
  error_message: string | null
  processing_started_at: string | null
  processing_completed_at: string | null
  created_at: string
  updated_at: string
  // Joined data
  patient_name?: string
  therapist_name?: string
}

export type PendingRecord = {
  id: string
  type: 'recording_job' | 'medical_record'
  patient_id: string
  patient_name: string
  therapist_name: string
  therapist_id: string
  status: RecordingJobStatus | 'completed'
  created_at: string
  appointment_id?: string | null
  tipo_consulta?: 'anamnese' | 'evolucao'
  note_type?: MedicalRecordType
  title?: string
  content?: string
}

/**
 * Get pending recording jobs (uploaded, processing)
 */
export async function getPendingRecordingJobs(therapistId?: string): Promise<RecordingJob[]> {
  try {
    let query = supabase
      .schema('cedro')
      .from('recording_jobs')
      .select(`
        *,
        patients!inner(full_name),
        users!recording_jobs_therapist_id_fkey(name)
      `)
      .in('status', ['uploaded', 'processing'])
      .order('created_at', { ascending: false })

    if (therapistId) {
      query = query.eq('therapist_id', therapistId)
    }

    const { data: jobs, error } = await query

    if (error) {
      console.error('Error fetching pending recording jobs:', error)
      throw new Error('Erro ao buscar jobs de gravação pendentes')
    }

    return jobs?.map(job => ({
      ...job,
      patient_name: (job as any).patients?.full_name,
      therapist_name: (job as any).users?.name
    })) || []
  } catch (error) {
    console.error('Error in getPendingRecordingJobs:', error)
    throw error
  }
}

/**
 * Get all records (medical records + pending recording jobs) combined
 */
export async function getAllRecords(therapistId?: string): Promise<PendingRecord[]> {
  try {
    const [medicalRecords, pendingJobs] = await Promise.all([
      getMedicalRecords(therapistId),
      getPendingRecordingJobs(therapistId)
    ])

    const combinedRecords: PendingRecord[] = []

    // Add completed medical records
    medicalRecords.forEach(record => {
      const recordWithLegacyFields = addLegacyFields(record)
      combinedRecords.push({
        id: record.id,
        type: 'medical_record',
        patient_id: record.patient_id,
        patient_name: record.patient_name || 'Paciente não encontrado',
        therapist_name: record.therapist_name || 'Terapeuta não encontrado',
        therapist_id: record.therapist_id || '',
        status: 'completed',
        created_at: record.created_at,
        appointment_id: record.appointment_id,
        note_type: record.note_type,
        title: recordWithLegacyFields.title,
        content: recordWithLegacyFields.content
      })
    })

    // Add pending recording jobs
    pendingJobs.forEach(job => {
      combinedRecords.push({
        id: job.id,
        type: 'recording_job',
        patient_id: job.patient_id,
        patient_name: job.patient_name || 'Paciente não encontrado',
        therapist_name: job.therapist_name || 'Terapeuta não encontrado',
        therapist_id: job.therapist_id,
        status: job.status,
        created_at: job.created_at,
        appointment_id: job.appointment_id,
        tipo_consulta: job.tipo_consulta
      })
    })

    // Sort by creation date (newest first)
    combinedRecords.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return combinedRecords
  } catch (error) {
    console.error('Error in getAllRecords:', error)
    throw error
  }
}

import { format } from 'date-fns'

export type PatientStatus = 'active' | 'inactive' | 'suspended'

export type Patient = {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  birth_date: string | null
  gender: string | null
  cpf: string | null
  is_christian: boolean | null
  origin: string | null
  marital_status: string | null
  occupation: string | null
  notes: string | null
  address_json: any
  tags_text: string[]
  is_on_hold: boolean
  created_at: string
  updated_at: string
  // Joined data
  current_therapist_id?: string | null
  current_therapist_name?: string | null
  total_appointments?: number
  last_appointment?: string | null
  next_appointment?: string | null
}

export type PatientOverview = {
  patient: Patient
  appointments: {
    total: number
    completed: number
    scheduled: number
    cancelled: number
    last_appointment: string | null
    next_appointment: string | null
  }
  therapists: Array<{
    id: string
    name: string
    email: string
    is_current: boolean
    started_at: string
    ended_at: string | null
  }>
  invoices: {
    total: number
    paid: number
    pending: number
    overdue: number
    total_amount: number
    paid_amount: number
  }
  medical_records: Array<{
    id: string
    date: string
    type: string
    summary: string
    therapist_name: string
  }>
}

export type PatientFilters = {
  status?: PatientStatus
  therapistId?: string
  search?: string
  ageMin?: number
  ageMax?: number
}

export type PaginationParams = {
  page: number
  limit: number
}

export type PatientListResponse = {
  data: Patient[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export type CreatePatientData = {
  full_name: string
  email?: string
  phone?: string
  birth_date?: string
  gender?: string
  cpf?: string
  is_christian?: boolean
  origin?: string
  marital_status?: string
  occupation?: string
  notes?: string
  address_json?: any
  tags_text?: string[]
  is_on_hold?: boolean
}

export type UpdatePatientData = Partial<CreatePatientData>

/**
 * Get patients with filtering and pagination
 */
export async function getPatients(
  filters: PatientFilters = {},
  pagination: PaginationParams = { page: 1, limit: 10 },
  therapistId?: string
): Promise<PatientListResponse> {
  try {
    // Use the optimized view for better performance
    let query = supabase
      .schema('cedro')
      .from('vw_patient_overview')
      .select('*', { count: 'exact' })

    // If therapistId is provided, filter by linked patients only
    if (therapistId) {
      query = query.eq('current_therapist_id', therapistId)
    }

    // Apply filters
    if (filters.search) {
      query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`)
    }

    // Apply therapist filter from UI dropdown
    if (filters.therapistId) {
      query = query.eq('current_therapist_id', filters.therapistId)
    }

    // Apply pagination
    const from = (pagination.page - 1) * pagination.limit
    const to = from + pagination.limit - 1
    query = query.range(from, to)

    // Order by name
    query = query.order('full_name', { ascending: true })

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching patients:', error)
      throw error
    }

    const patients: Patient[] = (data || []).map((row: any) => ({
      id: row.patient_id,
      full_name: row.full_name,
      email: row.email,
      phone: row.phone,
      birth_date: row.birth_date,
      gender: row.gender,
      cpf: row.cpf,
      is_christian: row.is_christian,
      origin: row.origin,
      marital_status: row.marital_status,
      occupation: row.occupation,
      notes: row.notes,
      address_json: row.address_json || {},
      tags_text: row.tags_text || [],
      is_on_hold: row.is_on_hold || false,
      created_at: row.created_at,
      updated_at: row.updated_at,
      current_therapist_id: row.current_therapist_id,
      current_therapist_name: row.current_therapist_name,
      total_appointments: row.total_appointments || 0,
      last_appointment: row.last_appointment,
      next_appointment: row.next_appointment
    }))

    return {
      data: patients,
      total: count || 0,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil((count || 0) / pagination.limit)
    }
  } catch (error) {
    console.error('Error in getPatients:', error)
    return {
      data: [],
      total: 0,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: 0
    }
  }
}

/**
 * Create patient-therapist link
 */
export async function createPatientTherapistLink(
  patientId: string, 
  therapistId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .schema('cedro')
      .from('patient_therapist_links')
      .insert({
        patient_id: patientId,
        therapist_id: therapistId,
        status: 'active',
        started_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error creating patient-therapist link:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in createPatientTherapistLink:', error)
    return false
  }
}

/**
 * Get patient by ID
 */
export async function getPatientById(id: string): Promise<Patient | null> {
  try {
    const { data, error } = await supabase
      .schema('cedro')
      .from('patients')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching patient:', error)
      return null
    }

    if (!data) return null

    return {
      id: data.id,
      full_name: data.full_name,
      email: data.email,
      phone: data.phone,
      birth_date: data.birth_date,
      gender: data.gender,
      cpf: data.cpf,
      is_christian: data.is_christian,
      origin: data.origin,
      marital_status: data.marital_status,
      occupation: data.occupation,
      notes: data.notes,
      address_json: data.address_json || {},
      tags_text: data.tags_text || [],
      is_on_hold: data.is_on_hold || false,
      created_at: data.created_at,
      updated_at: data.updated_at
    }
  } catch (error) {
    console.error('Error in getPatientById:', error)
    return null
  }
}

/**
 * Get comprehensive patient overview
 */
export async function getPatientOverview(id: string): Promise<PatientOverview | null> {
  try {
    // Get patient basic info
    const patient = await getPatientById(id)
    if (!patient) return null

    // Get appointments summary
    const { data: appointmentsData } = await supabase
      .schema('cedro')
      .from('appointments')
      .select('status, start_at')
      .eq('patient_id', id)

    const appointments = {
      total: appointmentsData?.length || 0,
      completed: appointmentsData?.filter(a => a.status === 'completed').length || 0,
      scheduled: appointmentsData?.filter(a => a.status === 'scheduled').length || 0,
      cancelled: appointmentsData?.filter(a => a.status === 'cancelled').length || 0,
      last_appointment: appointmentsData
        ?.filter(a => a.status === 'completed')
        .sort((a, b) => new Date(b.start_at).getTime() - new Date(a.start_at).getTime())[0]?.start_at || null,
      next_appointment: appointmentsData
        ?.filter(a => a.status === 'scheduled')
        .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())[0]?.start_at || null
    }

    // Get therapists
    const { data: therapistsData } = await supabase
      .schema('cedro')
      .from('patient_therapist_links')
      .select(`
        therapist_id,
        started_at,
        ended_at,
        status,
        users!inner (
          name,
          email
        )
      `)
      .eq('patient_id', id)

    const therapists = (therapistsData || []).map((link: any) => ({
      id: link.therapist_id,
      name: link.users.name,
      email: link.users.email,
      is_current: link.status === 'active',
      started_at: link.started_at,
      ended_at: link.ended_at
    }))

    // Get invoices summary
    const { data: invoicesData } = await supabase
      .schema('cedro')
      .from('invoices')
      .select('status, amount_cents')
      .eq('patient_id', id)

    const invoices = {
      total: invoicesData?.length || 0,
      paid: invoicesData?.filter(i => i.status === 'paid').length || 0,
      pending: invoicesData?.filter(i => ['open', 'partial'].includes(i.status)).length || 0,
      overdue: invoicesData?.filter(i => i.status === 'overdue').length || 0,
      total_amount: invoicesData?.reduce((sum, i) => sum + i.amount_cents, 0) || 0,
      paid_amount: invoicesData?.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount_cents, 0) || 0
    }

    // Get medical records (placeholder - would need actual medical records table)
    const medical_records: any[] = []

    return {
      patient,
      appointments,
      therapists,
      invoices,
      medical_records
    }
  } catch (error) {
    console.error('Error in getPatientOverview:', error)
    return null
  }
}

/**
 * Create new patient
 */
export async function createPatient(data: CreatePatientData): Promise<Patient | null> {
  try {
    // Create patient directly (no user table needed based on current schema)
    const { data: patientData, error: patientError } = await supabase
      .schema('cedro')
      .from('patients')
      .insert({
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        birth_date: data.birth_date,
        gender: data.gender,
        cpf: data.cpf,
        is_christian: data.is_christian,
        origin: data.origin,
        marital_status: data.marital_status,
        occupation: data.occupation,
        notes: data.notes,
        address_json: data.address_json || {},
        tags_text: data.tags_text || [],
        is_on_hold: data.is_on_hold || false
      })
      .select()
      .single()

    if (patientError) {
      console.error('Error creating patient:', patientError)
      throw patientError
    }

    return {
      id: patientData.id,
      full_name: patientData.full_name,
      email: patientData.email,
      phone: patientData.phone,
      birth_date: patientData.birth_date,
      gender: patientData.gender,
      cpf: patientData.cpf,
      is_christian: patientData.is_christian,
      origin: patientData.origin,
      marital_status: patientData.marital_status,
      occupation: patientData.occupation,
      notes: patientData.notes,
      address_json: patientData.address_json,
      tags_text: patientData.tags_text,
      is_on_hold: patientData.is_on_hold,
      created_at: patientData.created_at,
      updated_at: patientData.updated_at
    }
  } catch (error) {
    console.error('Error in createPatient:', error)
    return null
  }
}

/**
 * Update patient
 */
export async function updatePatient(id: string, data: UpdatePatientData): Promise<Patient | null> {
  try {
    const patient = await getPatientById(id)
    if (!patient) return null

    // Update patient data
    const { data: patientData, error: patientError } = await supabase
      .schema('cedro')
      .from('patients')
      .update({
        ...(data.full_name && { full_name: data.full_name }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.birth_date !== undefined && { birth_date: data.birth_date }),
        ...(data.gender !== undefined && { gender: data.gender }),
        ...(data.cpf !== undefined && { cpf: data.cpf }),
        ...(data.is_christian !== undefined && { is_christian: data.is_christian }),
        ...(data.origin !== undefined && { origin: data.origin }),
        ...(data.marital_status !== undefined && { marital_status: data.marital_status }),
        ...(data.occupation !== undefined && { occupation: data.occupation }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.address_json !== undefined && { address_json: data.address_json }),
        ...(data.tags_text !== undefined && { tags_text: data.tags_text }),
        ...(data.is_on_hold !== undefined && { is_on_hold: data.is_on_hold }),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (patientError) {
      console.error('Error updating patient:', patientError)
      throw patientError
    }

    return await getPatientById(id)
  } catch (error) {
    console.error('Error in updatePatient:', error)
    return null
  }
}

/**
 * Delete patient
 */
export async function deletePatient(id: string): Promise<boolean> {
  try {
    const patient = await getPatientById(id)
    if (!patient) return false

    // Delete patient record
    const { error: patientError } = await supabase
      .schema('cedro')
      .from('patients')
      .delete()
      .eq('id', id)

    if (patientError) {
      console.error('Error deleting patient:', patientError)
      throw patientError
    }

    return true
  } catch (error) {
    console.error('Error in deletePatient:', error)
    return false
  }
}

/**
 * Get therapists for filter dropdown
 */
export async function getTherapistsForFilter(): Promise<Array<{ id: string; name: string }>> {
  try {
    const { data, error } = await supabase
      .schema('cedro')
      .from('users')
      .select('id, name')
      .in('role', ['therapist', 'admin'])
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching therapists:', error)
      return []
    }

    return (data || []).map((therapist: any) => ({
      id: therapist.id,
      name: therapist.name
    }))
  } catch (error) {
    console.error('Error in getTherapistsForFilter:', error)
    return []
  }
}

/**
 * Get global statistics for patients dashboard
 */
export type PatientStats = {
  totalPatients: number
  activePatients: number
  onHoldPatients: number
  totalAppointments: number
  activeTherapists: number
}

export async function getPatientStats(therapistId?: string): Promise<PatientStats> {
  try {
    // Get total and active patient counts
    let patientQuery = supabase
      .schema('cedro')
      .from('vw_patient_overview')
      .select('*', { count: 'exact' })

    if (therapistId) {
      patientQuery = patientQuery.eq('current_therapist_id', therapistId)
    }

    const { count: totalCount, data: allPatients, error: patientError } = await patientQuery

    if (patientError) {
      throw patientError
    }

    const patients = allPatients || []
    const activeCount = patients.filter(p => !p.is_on_hold).length
    const onHoldCount = patients.filter(p => p.is_on_hold).length
    const totalAppointments = patients.reduce((sum: number, p: any) => sum + (p.total_appointments || 0), 0)

    // Get active therapists count (only if not filtered by therapist)
    let therapistCount = 1
    if (!therapistId) {
      const { data: therapists, error: therapistError } = await supabase
        .schema('cedro')
        .from('users')
        .select('id', { count: 'exact', head: true })
        .in('role', ['therapist', 'admin'])

      if (!therapistError) {
        therapistCount = therapists?.length || 0
      }
    }

    return {
      totalPatients: totalCount || 0,
      activePatients: activeCount,
      onHoldPatients: onHoldCount,
      totalAppointments,
      activeTherapists: therapistCount
    }
  } catch (error) {
    console.error('Error in getPatientStats:', error)
    return {
      totalPatients: 0,
      activePatients: 0,
      onHoldPatients: 0,
      totalAppointments: 0,
      activeTherapists: 0
    }
  }
}

/**
 * Utility functions
 */
export function calculateAge(birthDate: string | null): number | null {
  if (!birthDate) return null
  
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  
  return age
}

export function formatDate(dateString: string | null): string {
  if (!dateString) return '-'
  return format(new Date(dateString), 'dd/MM/yyyy')
}

export function formatCurrency(amountCents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(amountCents / 100)
}

export function getStatusBadgeVariant(status: PatientStatus): 'default' | 'secondary' | 'destructive' {
  switch (status) {
    case 'active':
      return 'default'
    case 'inactive':
      return 'secondary'
    case 'suspended':
      return 'destructive'
    default:
      return 'secondary'
  }
}

export function getStatusText(status: PatientStatus): string {
  switch (status) {
    case 'active':
      return 'Ativo'
    case 'inactive':
      return 'Inativo'
    case 'suspended':
      return 'Suspenso'
    default:
      return 'Desconhecido'
  }
}

// Medical Records Types and Functions
export type MedicalRecordType = 'anamnesis' | 'soap' | 'evolution' | 'prescription_draft'
export type MedicalRecordVisibility = 'private' | 'shared'

export type MedicalRecord = {
  id: string
  patient_id: string
  appointment_id?: string | null
  note_type: MedicalRecordType
  content_json: any
  visibility: MedicalRecordVisibility
  signed_by?: string | null
  signed_at?: string | null
  created_at: string
  updated_at: string
  // Joined data
  patient_name?: string
  therapist_name?: string
  therapist_id?: string
  appointment_date?: string
}

export type CreateMedicalRecordData = {
  patient_id: string
  appointment_id?: string | null
  note_type: MedicalRecordType
  content_json: any
  visibility?: MedicalRecordVisibility
  audio_url?: string
}

export type UpdateMedicalRecordData = {
  note_type?: MedicalRecordType
  content_json?: any
  visibility?: 'private' | 'shared'
  signed_by?: string
  signed_at?: string
}

export async function createMedicalRecord(data: CreateMedicalRecordData): Promise<MedicalRecordWithLegacyFields> {
  try {
    const { data: record, error } = await supabase
      .schema('cedro')
      .from('medical_records')
      .insert({
        patient_id: data.patient_id,
        appointment_id: data.appointment_id,
        note_type: data.note_type,
        content_json: data.content_json,
        visibility: data.visibility || 'private'
      })
      .select(`
        *,
        patients!inner(full_name),
        appointments(
          start_at,
          users!appointments_therapist_id_fkey(name)
        )
      `)
      .single()

    if (error) {
      console.error('Error creating medical record:', error)
      throw new Error('Erro ao criar registro médico')
    }

    const baseRecord = {
      ...record,
      patient_name: (record as any).patients?.full_name,
      therapist_name: (record as any).appointments?.users?.name,
      appointment_date: (record as any).appointments?.start_at
    }

    return addLegacyFields(baseRecord)
  } catch (error) {
    console.error('Error in createMedicalRecord:', error)
    throw error
  }
}

export async function getMedicalRecord(id: string): Promise<MedicalRecordWithLegacyFields | null> {
  try {
    const { data, error } = await supabase
      .schema('cedro')
      .from('medical_records')
      .select(`
        *,
        patients!inner(full_name),
        appointments(
          start_at,
          users!appointments_therapist_id_fkey(name)
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching medical record:', error)
      throw error
    }

    if (!data) return null

    const baseRecord = {
      ...data,
      patient_name: (data as any).patients?.full_name || 'Paciente não encontrado',
      therapist_name: (data as any).appointments?.users?.name || 'Terapeuta não encontrado',
      appointment_date: (data as any).appointments?.start_at || null
    }

    return addLegacyFields(baseRecord)
  } catch (error) {
    console.error('Error in getMedicalRecord:', error)
    throw error
  }
}

export async function getMedicalRecords(patientId?: string, therapistId?: string): Promise<MedicalRecordWithLegacyFields[]> {
  try {
    let query = supabase
      .schema('cedro')
      .from('medical_records')
      .select(`
        *,
        patients!inner(full_name),
        appointments(
          start_at,
          therapist_id,
          users!appointments_therapist_id_fkey(name)
        )
      `)
      .order('created_at', { ascending: false })

    if (patientId) {
      query = query.eq('patient_id', patientId)
    }

    if (therapistId) {
      query = query.eq('appointments.therapist_id', therapistId)
    }

    const { data: records, error } = await query

    if (error) {
      console.error('Error fetching medical records:', error)
      throw new Error('Erro ao buscar registros médicos')
    }

    return records?.map(record => {
      const baseRecord = {
        ...record,
        patient_name: (record as any).patients?.full_name,
        therapist_name: (record as any).appointments?.users?.name,
        therapist_id: (record as any).appointments?.therapist_id,
        appointment_date: (record as any).appointments?.start_at
      }
      return addLegacyFields(baseRecord)
    }) || []
  } catch (error) {
    console.error('Error in getMedicalRecords:', error)
    throw error
  }
}

export async function updateMedicalRecord(id: string, updates: {
  note_type?: MedicalRecordType
  content_json?: any
  visibility?: 'private' | 'shared'
  signed_by?: string
  signed_at?: string
}): Promise<MedicalRecordWithLegacyFields> {
  try {
    const { data, error } = await supabase
      .schema('cedro')
      .from('medical_records')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        patients!inner(full_name),
        appointments(
          start_at,
          users!appointments_therapist_id_fkey(name)
        )
      `)
      .single()

    if (error) {
      console.error('Error updating medical record:', error)
      throw error
    }

    const baseRecord = {
      ...data,
      patient_name: (data as any).patients?.full_name || 'Paciente não encontrado',
      therapist_name: (data as any).appointments?.users?.name || 'Terapeuta não encontrado',
      appointment_date: (data as any).appointments?.start_at || null
    }

    return addLegacyFields(baseRecord)
  } catch (error) {
    console.error('Error in updateMedicalRecord:', error)
    throw error
  }
}

export async function deleteMedicalRecord(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .schema('cedro')
      .from('medical_records')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting medical record:', error)
      throw new Error('Erro ao excluir registro médico')
    }
  } catch (error) {
    console.error('Error in deleteMedicalRecord:', error)
    throw error
  }
}

export function getMedicalRecordTypeLabel(type: MedicalRecordType): string {
  switch (type) {
    case 'anamnesis':
      return 'Anamnese'
    case 'soap':
      return 'SOAP'
    case 'evolution':
      return 'Evolução'
    case 'prescription_draft':
      return 'Prescrição'
    default:
      return 'Desconhecido'
  }
}

// Helper functions for backward compatibility and content extraction
export function getMedicalRecordContent(record: MedicalRecord): string {
  if (!record.content_json) return ''
  
  // If it's a structured record with content
  if (record.content_json.conteudo) {
    const content = record.content_json.conteudo
    // Extract text from SOAP structure
    if (content.subjetivo || content.objetivo || content.avaliacao || content.plano) {
      const parts: string[] = []
      if (content.subjetivo?.queixa_principal) parts.push(`Queixa: ${content.subjetivo.queixa_principal}`)
      if (content.subjetivo?.historia_doenca_atual) parts.push(`História: ${content.subjetivo.historia_doenca_atual}`)
      if (content.avaliacao?.impressao_clinica) parts.push(`Avaliação: ${content.avaliacao.impressao_clinica}`)
      if (content.plano?.proximos_passos?.length) parts.push(`Plano: ${content.plano.proximos_passos.join(', ')}`)
      return parts.join('\n\n')
    }
  }
  
  // If it's a simple text content
  if (typeof record.content_json === 'string') {
    return record.content_json
  }
  
  // If it has a content property
  if (record.content_json.content) {
    return record.content_json.content
  }
  
  // If it has raw_transcript
  if (record.content_json.raw_transcript) {
    return record.content_json.raw_transcript
  }
  
  return JSON.stringify(record.content_json, null, 2)
}

export function getMedicalRecordTranscription(record: MedicalRecord): string | null {
  if (!record.content_json) return null
  
  // Check for raw transcript
  if (record.content_json.raw_transcript) {
    return record.content_json.raw_transcript
  }
  
  // Check for transcription field
  if (record.content_json.transcription) {
    return record.content_json.transcription
  }
  
  return null
}

export function getMedicalRecordAudioUrl(record: MedicalRecord): string | null {
  if (!record.content_json) return null
  
  // Check for audio_url field
  if (record.content_json.audio_url) {
    return record.content_json.audio_url
  }
  
  return null
}

export function getMedicalRecordTitle(record: MedicalRecord): string | undefined {
  if (!record.content_json) return undefined
  
  // Check for title field
  if (record.content_json.title) {
    return record.content_json.title
  }
  
  // Generate title based on note type and date
  const date = new Date(record.created_at).toLocaleDateString('pt-BR')
  const typeLabel = getMedicalRecordTypeLabel(record.note_type)
  return `${typeLabel} - ${date}`
}

// Extended type for backward compatibility
export type MedicalRecordWithLegacyFields = MedicalRecord & {
  type?: MedicalRecordType
  title?: string
  content?: string
  transcription?: string | null
  audio_url?: string | null
}

export function addLegacyFields(record: MedicalRecord): MedicalRecordWithLegacyFields {
  return {
    ...record,
    type: record.note_type,
    title: getMedicalRecordTitle(record),
    content: getMedicalRecordContent(record),
    transcription: getMedicalRecordTranscription(record),
    audio_url: getMedicalRecordAudioUrl(record)
  }
}

export type MedicalRecordStats = {
  total_records: number
  active_patients: number
  records_today: number
  medical_alerts: number
  recent_records: MedicalRecord[]
}

export async function getMedicalRecordStats(): Promise<MedicalRecordStats> {
  try {
    // Get total records count
    const { count: totalRecords, error: totalError } = await supabase
      .schema('cedro')
      .from('medical_records')
      .select('*', { count: 'exact', head: true })

    if (totalError) {
      console.error('Error fetching total records:', totalError)
    }

    // Get active patients count
    const { count: activePatients, error: activePatientsError } = await supabase
      .schema('cedro')
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .eq('is_on_hold', false)

    if (activePatientsError) {
      console.error('Error fetching active patients:', activePatientsError)
    }

    // Get records created today
    const today = new Date().toISOString().split('T')[0]
    const { count: recordsToday, error: todayError } = await supabase
      .schema('cedro')
      .from('medical_records')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lt('created_at', `${today}T23:59:59.999Z`)

    if (todayError) {
      console.error('Error fetching today records:', todayError)
    }

    // Get recent records (last 10)
    const { data: recentRecords, error: recentError } = await supabase
      .schema('cedro')
      .from('medical_records')
      .select(`
        *,
        patients!inner(full_name),
        appointments(
          start_at,
          users!appointments_therapist_id_fkey(name)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    if (recentError) {
      console.error('Error fetching recent records:', recentError)
    }

    const formattedRecentRecords = recentRecords?.map(record => ({
      ...record,
      patient_name: (record as any).patients?.full_name,
      therapist_name: (record as any).appointments?.users?.name,
      appointment_date: (record as any).appointments?.start_at
    })) || []

    return {
      total_records: totalRecords || 0,
      active_patients: activePatients || 0,
      records_today: recordsToday || 0,
      medical_alerts: 0, // TODO: Implement medical alerts logic
      recent_records: formattedRecentRecords
    }
  } catch (error) {
    console.error('Error in getMedicalRecordStats:', error)
    return {
      total_records: 0,
      active_patients: 0,
      records_today: 0,
      medical_alerts: 0,
      recent_records: []
    }
  }
}