/**
 * CEDRO Appointments API
 * CLEAN ARCHITECTURE - Agendamentos/Consultas
 *
 * Handles all appointment-related queries and mutations
 * No data transformation at this layer - raw DB calls only
 */

import { supabase } from '@/lib/supabase'
import { api } from './client'
import type { Appointment, AppointmentWithDetails } from './types'

// ============ QUERIES ============

/**
 * Get all appointments (admin view)
 */
export async function getAllAppointments(): Promise<Appointment[]> {
  return api.executeQuery<Appointment>('appointments', {
    columns: 'id, patient_id, therapist_id, service_id, care_plan_id, status, start_at, end_at, notes, created_at, updated_at',
    order: { column: 'start_at', ascending: false }
  })
}

/**
 * Get appointments by therapist and date range
 * Main query for agenda/schedule view
 */
export async function getAppointmentsByTherapistAndDate(
  therapistId: string,
  startDate: Date,
  endDate: Date
): Promise<Appointment[]> {
  try {
    const startISO = startDate.toISOString()
    const endISO = endDate.toISOString()

    const { data, error } = await supabase
      .schema('cedro')
      .from('appointments')
      .select(
        `
        id,
        patient_id,
        therapist_id,
        service_id,
        care_plan_id,
        status,
        start_at,
        end_at,
        channel,
        notes,
        meet_link,
        created_at,
        updated_at
        `
      )
      .eq('therapist_id', therapistId)
      .gte('start_at', startISO)
      .lte('start_at', endISO)
      .order('start_at', { ascending: true })

    if (error) {
      throw api.errors.parseSupabaseError(error)
    }

    return (data || []) as Appointment[]
  } catch (error) {
    const apiError = api.errors.parseSupabaseError(error)
    throw new api.errors.CedroApiError(
      apiError.message,
      apiError.code,
      apiError.status,
      apiError.details
    )
  }
}

/**
 * Get appointments by patient
 */
export async function getAppointmentsByPatient(patientId: string): Promise<Appointment[]> {
  return api.executeQuery<Appointment>('appointments', {
    columns: 'id, patient_id, therapist_id, service_id, care_plan_id, status, start_at, end_at, notes, created_at, updated_at',
    filter: [{ key: 'patient_id', value: patientId }],
    order: { column: 'start_at', ascending: false }
  })
}

/**
 * Get appointments by date range (all therapists)
 */
export async function getAppointmentsByDateRange(
  startDate: Date,
  endDate: Date
): Promise<Appointment[]> {
  try {
    const startISO = startDate.toISOString()
    const endISO = endDate.toISOString()

    const { data, error } = await supabase
      .schema('cedro')
      .from('appointments')
      .select(
        `
        id,
        patient_id,
        therapist_id,
        service_id,
        care_plan_id,
        status,
        start_at,
        end_at,
        notes,
        created_at,
        updated_at
        `
      )
      .gte('start_at', startISO)
      .lte('start_at', endISO)
      .order('start_at', { ascending: true })

    if (error) {
      throw api.errors.parseSupabaseError(error)
    }

    return (data || []) as Appointment[]
  } catch (error) {
    const apiError = api.errors.parseSupabaseError(error)
    throw new api.errors.CedroApiError(
      apiError.message,
      apiError.code,
      apiError.status,
      apiError.details
    )
  }
}

/**
 * Get single appointment with full details
 */
export async function getAppointmentById(appointmentId: string): Promise<Appointment | null> {
  return api.getById<Appointment>('appointments', appointmentId)
}

/**
 * Get appointments by status
 */
export async function getAppointmentsByStatus(
  status: Appointment['status']
): Promise<Appointment[]> {
  return api.executeQuery<Appointment>('appointments', {
    columns: 'id, patient_id, therapist_id, service_id, care_plan_id, status, start_at, end_at, notes, created_at, updated_at',
    filter: [{ key: 'status', value: status }],
    order: { column: 'start_at', ascending: true }
  })
}

/**
 * Count appointments for a specific day
 */
export async function countAppointmentsForDay(
  therapistId: string,
  date: Date
): Promise<number> {
  try {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const startISO = startOfDay.toISOString()
    const endISO = endOfDay.toISOString()

    const { count, error } = await supabase
      .schema('cedro')
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('therapist_id', therapistId)
      .gte('start_at', startISO)
      .lte('start_at', endISO)

    if (error) {
      throw api.errors.parseSupabaseError(error)
    }

    return count || 0
  } catch (error) {
    const apiError = api.errors.parseSupabaseError(error)
    throw new api.errors.CedroApiError(
      apiError.message,
      apiError.code,
      apiError.status,
      apiError.details
    )
  }
}

// ============ MUTATIONS ============

/**
 * Create new appointment
 */
export async function createAppointment(
  data: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>
): Promise<Appointment> {
  return api.insert<Appointment>('appointments', data)
}

/**
 * Update appointment
 */
export async function updateAppointment(
  appointmentId: string,
  data: Partial<Omit<Appointment, 'id' | 'created_at' | 'updated_at'>>
): Promise<Appointment> {
  return api.update<Appointment>('appointments', appointmentId, data)
}

/**
 * Delete appointment
 */
export async function deleteAppointment(appointmentId: string): Promise<void> {
  return api.delete('appointments', appointmentId)
}

/**
 * Reschedule appointment (update date/time)
 */
export async function rescheduleAppointment(
  appointmentId: string,
  startAt: string,
  endAt: string
): Promise<Appointment> {
  return updateAppointment(appointmentId, {
    start_at: startAt,
    end_at: endAt,
    status: 'rescheduled'
  })
}

/**
 * Update appointment status
 */
export async function updateAppointmentStatus(
  appointmentId: string,
  status: Appointment['status']
): Promise<Appointment> {
  return updateAppointment(appointmentId, { status })
}

/**
 * Bulk update appointment status
 */
export async function bulkUpdateAppointmentStatus(
  appointmentIds: string[],
  status: Appointment['status']
): Promise<void> {
  try {
    const { error } = await supabase
      .schema('cedro')
      .from('appointments')
      .update({ status })
      .in('id', appointmentIds)

    if (error) {
      throw api.errors.parseSupabaseError(error)
    }
  } catch (error) {
    const apiError = api.errors.parseSupabaseError(error)
    throw new api.errors.CedroApiError(
      apiError.message,
      apiError.code,
      apiError.status,
      apiError.details
    )
  }
}

/**
 * Add meeting link to appointment
 */
export async function addMeetingLink(appointmentId: string, meetLink: string): Promise<Appointment> {
  return updateAppointment(appointmentId, { meet_link: meetLink })
}

/**
 * Get appointments with patient and therapist details
 * Note: This uses separate queries to avoid complex joins
 */
export async function getAppointmentsWithDetails(
  appointmentIds: string[]
): Promise<AppointmentWithDetails[]> {
  try {
    const { data, error } = await supabase
      .schema('cedro')
      .from('appointments')
      .select('*')
      .in('id', appointmentIds)

    if (error) {
      throw api.errors.parseSupabaseError(error)
    }

    return (data || []) as AppointmentWithDetails[]
  } catch (error) {
    const apiError = api.errors.parseSupabaseError(error)
    throw new api.errors.CedroApiError(
      apiError.message,
      apiError.code,
      apiError.status,
      apiError.details
    )
  }
}
