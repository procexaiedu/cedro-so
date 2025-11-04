/**
 * Appointments Adapter
 * Bridges old component expectations with new clean architecture
 * Provides enriched appointment data with patient/therapist/service details
 */

import { supabase } from '@/lib/supabase'
import { api } from './client'
import type { Appointment } from './types'

export interface AppointmentWithDetails extends Appointment {
  patient_name?: string
  patient_email?: string
  therapist_name?: string
  service_name?: string
}

/**
 * Get enriched appointments with patient, therapist, and service details
 * This adapter queries the database view for backward compatibility
 */
export async function getAppointmentsWithDetails(
  startDate: Date,
  endDate: Date,
  therapistId?: string
): Promise<AppointmentWithDetails[]> {
  try {
    const startISO = startDate.toISOString()
    const endISO = endDate.toISOString()

    console.log('🔍 getAppointmentsWithDetails called with:', {
      startDate: startISO,
      endDate: endISO,
      therapistId
    })

    // Try to use the optimized view if it exists
    let query = supabase
      .schema('cedro')
      .from('appointments_with_details')
      .select('*')
      .gte('start_at', startISO)
      .lte('start_at', endISO)
      .order('start_at', { ascending: true })

    if (therapistId) {
      query = query.eq('therapist_id', therapistId)
    }

    const { data, error } = await query

    if (error) {
      // If view doesn't exist, fallback to building the data manually
      console.warn('View appointments_with_details not found, using fallback', error)
      return fallbackGetAppointmentsWithDetails(startDate, endDate, therapistId)
    }

    console.log('📊 Query result:', {
      data: data?.length || 0,
      firstItem: data?.[0]
    })

    return (data || []) as AppointmentWithDetails[]
  } catch (error) {
    console.error('Error in getAppointmentsWithDetails:', error)
    // Fallback to building data manually
    return fallbackGetAppointmentsWithDetails(startDate, endDate, therapistId)
  }
}

/**
 * Fallback method: Query appointments, then enrich with patient/therapist/service data
 */
async function fallbackGetAppointmentsWithDetails(
  startDate: Date,
  endDate: Date,
  therapistId?: string
): Promise<AppointmentWithDetails[]> {
  try {
    const startISO = startDate.toISOString()
    const endISO = endDate.toISOString()

    // Get appointments
    const { data: appointments, error: apptError } = await supabase
      .schema('cedro')
      .from('appointments')
      .select('*')
      .gte('start_at', startISO)
      .lte('start_at', endISO)
      .order('start_at', { ascending: true })

    if (apptError || !appointments) {
      throw apptError || new Error('No appointments found')
    }

    if (therapistId) {
      appointments.filter(a => a.therapist_id === therapistId)
    }

    // Get all related data in parallel
    const [patientsResult, therapistsResult, servicesResult] = await Promise.all([
      supabase.schema('cedro').from('users').select('id, name, email'),
      supabase.schema('cedro').from('users').select('id, name'),
      supabase.schema('cedro').from('services').select('id, name')
    ])

    const patients = new Map(patientsResult.data?.map(p => [p.id, p]) || [])
    const therapists = new Map(therapistsResult.data?.map(t => [t.id, t]) || [])
    const services = new Map(servicesResult.data?.map(s => [s.id, s]) || [])

    // Enrich appointments with related data
    const enriched = appointments.map(apt => ({
      ...apt,
      patient_name: patients.get(apt.patient_id)?.name,
      patient_email: patients.get(apt.patient_id)?.email,
      therapist_name: therapists.get(apt.therapist_id)?.name,
      service_name: apt.service_id ? services.get(apt.service_id)?.name : null
    }))

    return enriched as AppointmentWithDetails[]
  } catch (error) {
    console.error('Error in fallbackGetAppointmentsWithDetails:', error)
    return []
  }
}

/**
 * Get therapists list
 */
export async function getTherapistsList() {
  try {
    const { data, error } = await supabase
      .schema('cedro')
      .from('users')
      .select('id, name, email, role')
      .eq('role', 'therapist')
      .order('name', { ascending: true })

    if (error) {
      throw api.errors.parseSupabaseError(error)
    }

    return (data || []) as Array<{
      id: string
      name: string
      email?: string
      role: string
    }>
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
 * Get patients list
 */
export async function getPatientsList() {
  try {
    const { data, error } = await supabase
      .schema('cedro')
      .from('patients')
      .select('id, full_name, email, phone')
      .order('full_name', { ascending: true })

    if (error) {
      throw api.errors.parseSupabaseError(error)
    }

    return (data || []) as Array<{
      id: string
      full_name: string
      email?: string
      phone?: string
    }>
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
 * Get services list
 */
export async function getServicesList() {
  try {
    const { data, error } = await supabase
      .schema('cedro')
      .from('services')
      .select('id, name, description, default_duration_min, base_price_cents, active')
      .eq('active', true)
      .order('name', { ascending: true })

    if (error) {
      throw api.errors.parseSupabaseError(error)
    }

    return (data || []) as Array<{
      id: string
      name: string
      description?: string
      default_duration_min: number
      base_price_cents: number
      active: boolean
    }>
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
 * Get patients linked to a therapist
 */
export async function getLinkedPatientsByTherapist(therapistId: string) {
  try {
    const { data, error } = await supabase
      .schema('cedro')
      .from('patients')
      .select('id, full_name, email, phone')
      .eq('therapist_id', therapistId)
      .order('full_name', { ascending: true })

    if (error) {
      throw api.errors.parseSupabaseError(error)
    }

    return (data || []) as Array<{
      id: string
      full_name: string
      email?: string
      phone?: string
    }>
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
 * Get therapists linked to a patient
 */
export async function getLinkedTherapistsByPatient(patientId: string) {
  try {
    const { data: patient, error: patientError } = await supabase
      .schema('cedro')
      .from('patients')
      .select('therapist_id')
      .eq('id', patientId)
      .single()

    if (patientError || !patient?.therapist_id) {
      return []
    }

    const { data, error } = await supabase
      .schema('cedro')
      .from('users')
      .select('id, name, email')
      .eq('id', patient.therapist_id)

    if (error) {
      throw api.errors.parseSupabaseError(error)
    }

    return (data || []) as Array<{
      id: string
      name: string
      email?: string
    }>
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
