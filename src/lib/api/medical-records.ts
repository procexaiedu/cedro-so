/**
 * CEDRO Medical Records API
 * CLEAN ARCHITECTURE - Prontuários Médicos
 *
 * Handles all medical record queries and mutations
 * Integration with AI for record generation
 */

import { supabase } from '@/lib/supabase'
import { api } from './client'
import type { MedicalRecord, MedicalRecordType } from './types'

// ============ QUERIES ============

/**
 * Get all medical records
 */
export async function getAllMedicalRecords(): Promise<MedicalRecord[]> {
  return api.executeQuery<MedicalRecord>('medical_records', {
    columns: 'id, patient_id, appointment_id, note_type, visibility, signed_by, signed_at, created_at, updated_at',
    order: { column: 'created_at', ascending: false }
  })
}

/**
 * Get medical records by patient
 */
export async function getMedicalRecordsByPatient(patientId: string): Promise<MedicalRecord[]> {
  return api.executeQuery<MedicalRecord>('medical_records', {
    columns: 'id, patient_id, appointment_id, note_type, visibility, signed_by, signed_at, created_at, updated_at',
    filter: [{ key: 'patient_id', value: patientId }],
    order: { column: 'created_at', ascending: false }
  })
}

/**
 * Get medical records by appointment
 */
export async function getMedicalRecordsByAppointment(appointmentId: string): Promise<MedicalRecord[]> {
  return api.executeQuery<MedicalRecord>('medical_records', {
    columns: 'id, patient_id, appointment_id, note_type, visibility, signed_by, signed_at, created_at, updated_at',
    filter: [{ key: 'appointment_id', value: appointmentId }],
    order: { column: 'created_at', ascending: false }
  })
}

/**
 * Get medical records by type
 */
export async function getMedicalRecordsByType(noteType: MedicalRecordType): Promise<MedicalRecord[]> {
  return api.executeQuery<MedicalRecord>('medical_records', {
    columns: 'id, patient_id, appointment_id, note_type, visibility, signed_by, signed_at, created_at, updated_at',
    filter: [{ key: 'note_type', value: noteType }],
    order: { column: 'created_at', ascending: false }
  })
}

/**
 * Get single medical record with full content
 */
export async function getMedicalRecordById(recordId: string): Promise<MedicalRecord | null> {
  return api.getById<MedicalRecord>('medical_records', recordId)
}

/**
 * Get unsigned medical records (pending signature)
 */
export async function getUnsignedMedicalRecords(): Promise<MedicalRecord[]> {
  try {
    const { data, error } = await supabase
      .schema('cedro')
      .from('medical_records')
      .select('id, patient_id, appointment_id, note_type, visibility, signed_by, signed_at, created_at, updated_at')
      .is('signed_by', null)
      .order('created_at', { ascending: false })

    if (error) {
      throw api.errors.parseSupabaseError(error)
    }

    return (data || []) as MedicalRecord[]
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
 * Get signed medical records
 */
export async function getSignedMedicalRecords(): Promise<MedicalRecord[]> {
  try {
    const { data, error } = await supabase
      .schema('cedro')
      .from('medical_records')
      .select('id, patient_id, appointment_id, note_type, visibility, signed_by, signed_at, created_at, updated_at')
      .not('signed_by', 'is', null)
      .order('signed_at', { ascending: false })

    if (error) {
      throw api.errors.parseSupabaseError(error)
    }

    return (data || []) as MedicalRecord[]
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
 * Count medical records by patient
 */
export async function countMedicalRecordsByPatient(patientId: string): Promise<number> {
  return api.count('medical_records', [{ key: 'patient_id', value: patientId }])
}

/**
 * Count unsigned medical records
 */
export async function countUnsignedMedicalRecords(): Promise<number> {
  try {
    const { count, error } = await supabase
      .schema('cedro')
      .from('medical_records')
      .select('*', { count: 'exact', head: true })
      .is('signed_by', null)

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
 * Create medical record
 */
export async function createMedicalRecord(
  data: Omit<MedicalRecord, 'id' | 'created_at' | 'updated_at'>
): Promise<MedicalRecord> {
  return api.insert<MedicalRecord>('medical_records', data)
}

/**
 * Update medical record
 */
export async function updateMedicalRecord(
  recordId: string,
  data: Partial<Omit<MedicalRecord, 'id' | 'created_at' | 'updated_at'>>
): Promise<MedicalRecord> {
  return api.update<MedicalRecord>('medical_records', recordId, data)
}

/**
 * Delete medical record
 */
export async function deleteMedicalRecord(recordId: string): Promise<void> {
  return api.delete('medical_records', recordId)
}

/**
 * Sign medical record (set signed_by and signed_at)
 */
export async function signMedicalRecord(
  recordId: string,
  userId: string
): Promise<MedicalRecord> {
  return updateMedicalRecord(recordId, {
    signed_by: userId,
    signed_at: new Date().toISOString()
  })
}

/**
 * Update medical record content
 */
export async function updateMedicalRecordContent(
  recordId: string,
  contentJson: Record<string, any>
): Promise<MedicalRecord> {
  return updateMedicalRecord(recordId, { content_json: contentJson })
}

/**
 * Change medical record visibility
 */
export async function updateMedicalRecordVisibility(
  recordId: string,
  visibility: 'private' | 'team'
): Promise<MedicalRecord> {
  return updateMedicalRecord(recordId, { visibility })
}

/**
 * Bulk update medical record visibility
 */
export async function bulkUpdateMedicalRecordVisibility(
  recordIds: string[],
  visibility: 'private' | 'team'
): Promise<void> {
  try {
    const { error } = await supabase
      .schema('cedro')
      .from('medical_records')
      .update({ visibility })
      .in('id', recordIds)

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
 * Bulk sign medical records
 */
export async function bulkSignMedicalRecords(
  recordIds: string[],
  userId: string
): Promise<void> {
  try {
    const now = new Date().toISOString()
    const { error } = await supabase
      .schema('cedro')
      .from('medical_records')
      .update({ signed_by: userId, signed_at: now })
      .in('id', recordIds)

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
 * Search medical records by patient name
 */
export async function searchMedicalRecordsByPatientName(
  searchTerm: string
): Promise<MedicalRecord[]> {
  try {
    // This would need a join with patients table in real implementation
    // For now, we fetch all and filter in-app (or use materialized view)
    const { data, error } = await supabase
      .schema('cedro')
      .from('medical_records')
      .select('id, patient_id, appointment_id, note_type, visibility, signed_by, signed_at, created_at, updated_at')
      .ilike('note_type', `%${searchTerm}%`)
      .order('created_at', { ascending: false })

    if (error) {
      throw api.errors.parseSupabaseError(error)
    }

    return (data || []) as MedicalRecord[]
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
