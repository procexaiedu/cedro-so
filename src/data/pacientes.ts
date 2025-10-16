import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'

export type PatientStatus = 'active' | 'inactive' | 'suspended'

export type Patient = {
  id: string
  user_id: string
  full_name: string
  email: string
  phone: string | null
  birth_date: string | null
  gender: string | null
  emergency_contact: string | null
  medical_history: string | null
  status: PatientStatus
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
    start_date: string
    end_date: string | null
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
  email: string
  phone?: string
  birth_date?: string
  gender?: string
  emergency_contact?: string
  medical_history?: string
  status?: PatientStatus
}

export type UpdatePatientData = Partial<CreatePatientData>

/**
 * Get patients with filtering and pagination
 */
export async function getPatients(
  filters: PatientFilters = {},
  pagination: PaginationParams = { page: 1, limit: 10 }
): Promise<PatientListResponse> {
  try {
    let query = supabase
      .schema('cedro')
      .from('patients')
      .select('*', { count: 'exact' })

    // Apply filters
    if (filters.search) {
      query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`)
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
      id: row.id,
      user_id: row.id, // Using patient id as user_id
      full_name: row.full_name,
      email: row.email || '',
      phone: row.phone,
      birth_date: row.birth_date,
      gender: row.gender,
      emergency_contact: null, // Not in patients table
      medical_history: row.notes, // Using notes as medical history
      status: row.is_on_hold ? 'suspended' : 'active' as PatientStatus,
      created_at: row.created_at,
      updated_at: row.updated_at,
      current_therapist_id: null, // Will be loaded separately if needed
      current_therapist_name: null, // Will be loaded separately if needed
      total_appointments: 0, // Will be calculated separately if needed
      last_appointment: null,
      next_appointment: null
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
      user_id: data.user_id || '',
      full_name: data.full_name,
      email: data.email,
      phone: data.phone,
      birth_date: data.birth_date,
      gender: data.gender,
      emergency_contact: data.emergency_contact,
      medical_history: data.medical_history,
      status: 'active' as PatientStatus,
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
        start_date,
        end_date,
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
      start_date: link.start_date,
      end_date: link.end_date
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
    // First create user
    const { data: userData, error: userError } = await supabase
      .schema('cedro')
      .from('users')
      .insert({
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        role: 'patient'
      })
      .select()
      .single()

    if (userError) {
      console.error('Error creating user:', userError)
      throw userError
    }

    // Then create patient
    const { data: patientData, error: patientError } = await supabase
      .schema('cedro')
      .from('patients')
      .insert({
        user_id: userData.id,
        birth_date: data.birth_date,
        gender: data.gender,
        emergency_contact: data.emergency_contact,
        medical_history: data.medical_history
      })
      .select()
      .single()

    if (patientError) {
      console.error('Error creating patient:', patientError)
      throw patientError
    }

    return {
      id: patientData.id,
      user_id: patientData.user_id,
      full_name: data.full_name,
      email: data.email,
      phone: data.phone || null,
      birth_date: data.birth_date || null,
      gender: data.gender || null,
      emergency_contact: data.emergency_contact || null,
      medical_history: data.medical_history || null,
      status: data.status || 'active',
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

    // Update user data
    if (data.full_name || data.email || data.phone) {
      const { error: userError } = await supabase
        .schema('cedro')
        .from('users')
        .update({
          ...(data.full_name && { full_name: data.full_name }),
          ...(data.email && { email: data.email }),
          ...(data.phone !== undefined && { phone: data.phone })
        })
        .eq('id', patient.user_id)

      if (userError) {
        console.error('Error updating user:', userError)
        throw userError
      }
    }

    // Update patient data
    const { data: patientData, error: patientError } = await supabase
      .schema('cedro')
      .from('patients')
      .update({
        ...(data.birth_date !== undefined && { birth_date: data.birth_date }),
        ...(data.gender !== undefined && { gender: data.gender }),
        ...(data.emergency_contact !== undefined && { emergency_contact: data.emergency_contact }),
        ...(data.medical_history !== undefined && { medical_history: data.medical_history }),
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

    // Delete user record
    const { error: userError } = await supabase
      .schema('cedro')
      .from('users')
      .delete()
      .eq('id', patient.user_id)

    if (userError) {
      console.error('Error deleting user:', userError)
      throw userError
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
      .eq('role', 'therapist')
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
export type MedicalRecordVisibility = 'private' | 'team'

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

export async function createMedicalRecord(data: CreateMedicalRecordData): Promise<MedicalRecord> {
  try {
    const { data: record, error } = await supabase
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
          appointment_date,
          users!appointments_therapist_id_fkey(full_name)
        )
      `)
      .single()

    if (error) {
      console.error('Error creating medical record:', error)
      throw new Error('Erro ao criar registro médico')
    }

    return {
      ...record,
      patient_name: record.patients?.full_name,
      therapist_name: record.appointments?.users?.full_name,
      appointment_date: record.appointments?.appointment_date
    }
  } catch (error) {
    console.error('Error in createMedicalRecord:', error)
    throw error
  }
}

export async function getMedicalRecords(patientId?: string): Promise<MedicalRecord[]> {
  try {
    let query = supabase
      .from('medical_records')
      .select(`
        *,
        patients!inner(full_name),
        appointments(
          appointment_date,
          users!appointments_therapist_id_fkey(full_name)
        )
      `)
      .order('created_at', { ascending: false })

    if (patientId) {
      query = query.eq('patient_id', patientId)
    }

    const { data: records, error } = await query

    if (error) {
      console.error('Error fetching medical records:', error)
      throw new Error('Erro ao buscar registros médicos')
    }

    return records?.map(record => ({
      ...record,
      patient_name: record.patients?.full_name,
      therapist_name: record.appointments?.users?.full_name,
      appointment_date: record.appointments?.appointment_date
    })) || []
  } catch (error) {
    console.error('Error in getMedicalRecords:', error)
    throw error
  }
}

export async function updateMedicalRecord(id: string, data: Partial<CreateMedicalRecordData>): Promise<MedicalRecord> {
  try {
    const { data: record, error } = await supabase
      .from('medical_records')
      .update({
        note_type: data.note_type,
        content_json: data.content_json,
        visibility: data.visibility,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        patients!inner(full_name),
        appointments(
          appointment_date,
          users!appointments_therapist_id_fkey(full_name)
        )
      `)
      .single()

    if (error) {
      console.error('Error updating medical record:', error)
      throw new Error('Erro ao atualizar registro médico')
    }

    return {
      ...record,
      patient_name: record.patients?.full_name,
      therapist_name: record.appointments?.users?.full_name,
      appointment_date: record.appointments?.appointment_date
    }
  } catch (error) {
    console.error('Error in updateMedicalRecord:', error)
    throw error
  }
}

export async function deleteMedicalRecord(id: string): Promise<void> {
  try {
    const { error } = await supabase
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