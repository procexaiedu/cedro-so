/**
 * CEDRO Patients API
 * NEW CLEAN ARCHITECTURE - Example of proper data fetching patterns
 *
 * This file demonstrates:
 * 1. Typed queries with proper error handling
 * 2. Consistent parameter passing
 * 3. Single responsibility functions
 * 4. No data transformation at this layer
 * 5. Proper use of API client
 */

import { supabase } from '@/lib/supabase'
import { api } from './client'
import type { Patient, PaginatedResponse } from './types'

// ============ QUERIES ============

/**
 * Get all patients (basic)
 * For admins to see all patients
 */
export async function getAllPatients(): Promise<Patient[]> {
  return api.executeQuery<Patient>('patients', {
    columns: 'id, full_name, email, phone, therapist_id, created_at, updated_at'
  })
}

/**
 * Get patients by therapist
 * Therapists see only their assigned patients
 */
export async function getPatientsByTherapist(therapistId: string): Promise<Patient[]> {
  return api.executeQuery<Patient>('patients', {
    columns: 'id, full_name, email, phone, therapist_id, created_at, updated_at',
    filter: [{ key: 'therapist_id', value: therapistId }]
  })
}

/**
 * Search patients by name
 * Case-insensitive search
 */
export async function searchPatients(searchTerm: string, therapistId?: string): Promise<Patient[]> {
  try {
    let query = supabase
      .schema('cedro')
      .from('patients')
      .select('id, full_name, email, phone, therapist_id, created_at, updated_at')
      .ilike('full_name', `%${searchTerm}%`)
      .order('full_name', { ascending: true })

    if (therapistId) {
      query = query.eq('therapist_id', therapistId)
    }

    const { data, error } = await query

    if (error) {
      throw api.errors.parseSupabaseError(error)
    }

    return (data || []) as Patient[]
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
 * Get single patient by ID (full details)
 * Includes all fields for detail view
 */
export async function getPatientById(patientId: string): Promise<Patient | null> {
  return api.getById<Patient>('patients', patientId)
}

/**
 * Get patients with pagination
 * For list views with pagination
 */
export async function getPatientsPaginated(
  page: number = 1,
  pageSize: number = 20,
  therapistId?: string
): Promise<PaginatedResponse<Patient>> {
  try {
    // Calculate offset
    const offset = (page - 1) * pageSize

    // Get total count
    const total = await api.count('patients', therapistId ? [{ key: 'therapist_id', value: therapistId }] : undefined)

    // Get paginated data
    let query = supabase
      .schema('cedro')
      .from('patients')
      .select('id, full_name, email, phone, therapist_id, created_at, updated_at')
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (therapistId) {
      query = query.eq('therapist_id', therapistId)
    }

    const { data, error } = await query

    if (error) {
      throw api.errors.parseSupabaseError(error)
    }

    return {
      data: (data || []) as Patient[],
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
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

// ============ MUTATIONS ============

/**
 * Create new patient
 * Input validation should be done in the hook/component
 */
export async function createPatient(data: Omit<Patient, 'id' | 'created_at' | 'updated_at'>): Promise<Patient> {
  return api.insert<Patient>('patients', data)
}

/**
 * Update patient
 * Only updates provided fields
 */
export async function updatePatient(
  patientId: string,
  data: Partial<Omit<Patient, 'id' | 'created_at' | 'updated_at'>>
): Promise<Patient> {
  return api.update<Patient>('patients', patientId, data)
}

/**
 * Delete patient
 * Be careful - this is permanent!
 */
export async function deletePatient(patientId: string): Promise<void> {
  return api.delete('patients', patientId)
}

/**
 * Bulk update patients (e.g., assign to therapist)
 */
export async function bulkUpdatePatients(
  patientIds: string[],
  data: Partial<Omit<Patient, 'id' | 'created_at' | 'updated_at'>>
): Promise<void> {
  try {
    const { error } = await supabase
      .schema('cedro')
      .from('patients')
      .update(data)
      .in('id', patientIds)

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

// ============ SPECIALIZED QUERIES ============

/**
 * Get patients on hold
 */
export async function getPatientsOnHold(therapistId?: string): Promise<Patient[]> {
  try {
    let query = supabase
      .schema('cedro')
      .from('patients')
      .select('*')
      .eq('is_on_hold', true)
      .order('updated_at', { ascending: false })

    if (therapistId) {
      query = query.eq('therapist_id', therapistId)
    }

    const { data, error } = await query

    if (error) {
      throw api.errors.parseSupabaseError(error)
    }

    return (data || []) as Patient[]
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
 * Count active patients by therapist
 */
export async function countActivePatientsByTherapist(therapistId: string): Promise<number> {
  return api.count('patients', [
    { key: 'therapist_id', value: therapistId },
    { key: 'is_on_hold', value: 'false' }
  ])
}
