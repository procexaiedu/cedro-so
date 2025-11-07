/**
 * CEDRO Recording Jobs API
 * CLEAN ARCHITECTURE - Processamento de Gravações de Áudio
 *
 * Handles audio recording, transcription, and medical record generation from AI
 */

import { supabase } from '@/lib/supabase'
import { api } from './client'
import type { RecordingJob, RecordingJobStatus } from './types'

// ============ QUERIES ============

/**
 * Get all recording jobs
 */
export async function getAllRecordingJobs(): Promise<RecordingJob[]> {
  return api.executeQuery<RecordingJob>('recording_jobs', {
    columns: 'id, patient_id, therapist_id, appointment_id, sources_json, audio_storage_url, merged_audio_url, status, transcript_raw_text, transcript_clean_text, record_id, error_msg, audio_chunks_json, total_chunks, processed_chunks, audio_duration_seconds, processing_started_at, processing_completed_at, medical_record, note_type, tipo_consulta, created_at, updated_at',
    order: { column: 'created_at', ascending: false }
  })
}

/**
 * Get recording jobs by patient
 */
export async function getRecordingJobsByPatient(patientId: string): Promise<RecordingJob[]> {
  return api.executeQuery<RecordingJob>('recording_jobs', {
    columns: 'id, patient_id, therapist_id, appointment_id, sources_json, audio_storage_url, merged_audio_url, status, transcript_raw_text, transcript_clean_text, record_id, error_msg, audio_chunks_json, total_chunks, processed_chunks, audio_duration_seconds, processing_started_at, processing_completed_at, medical_record, note_type, tipo_consulta, created_at, updated_at',
    filter: [{ key: 'patient_id', value: patientId }],
    order: { column: 'created_at', ascending: false }
  })
}

/**
 * Get recording jobs by therapist
 */
export async function getRecordingJobsByTherapist(therapistId: string): Promise<RecordingJob[]> {
  return api.executeQuery<RecordingJob>('recording_jobs', {
    columns: 'id, patient_id, therapist_id, appointment_id, sources_json, audio_storage_url, merged_audio_url, status, transcript_raw_text, transcript_clean_text, record_id, error_msg, audio_chunks_json, total_chunks, processed_chunks, audio_duration_seconds, processing_started_at, processing_completed_at, medical_record, note_type, tipo_consulta, created_at, updated_at',
    filter: [{ key: 'therapist_id', value: therapistId }],
    order: { column: 'created_at', ascending: false }
  })
}

/**
 * Get recording jobs by status
 */
export async function getRecordingJobsByStatus(status: RecordingJobStatus): Promise<RecordingJob[]> {
  return api.executeQuery<RecordingJob>('recording_jobs', {
    columns: 'id, patient_id, therapist_id, appointment_id, sources_json, audio_storage_url, merged_audio_url, status, transcript_raw_text, transcript_clean_text, record_id, error_msg, audio_chunks_json, total_chunks, processed_chunks, audio_duration_seconds, processing_started_at, processing_completed_at, medical_record, note_type, tipo_consulta, created_at, updated_at',
    filter: [{ key: 'status', value: status }],
    order: { column: 'created_at', ascending: false }
  })
}

/**
 * Get processing jobs (for dashboard monitoring)
 */
export async function getProcessingRecordingJobs(): Promise<RecordingJob[]> {
  try {
    const { data, error } = await supabase
      .schema('cedro')
      .from('recording_jobs')
      .select('id, patient_id, therapist_id, appointment_id, sources_json, audio_storage_url, merged_audio_url, status, transcript_raw_text, transcript_clean_text, record_id, error_msg, audio_chunks_json, total_chunks, processed_chunks, audio_duration_seconds, processing_started_at, processing_completed_at, medical_record, note_type, tipo_consulta, created_at, updated_at')
      .in('status', ['uploaded', 'processing', 'transcribing', 'generating_record'])
      .order('processing_started_at', { ascending: true })

    if (error) {
      throw api.errors.parseSupabaseError(error)
    }

    return (data || []) as RecordingJob[]
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
 * Get single recording job
 */
export async function getRecordingJobById(jobId: string): Promise<RecordingJob | null> {
  return api.getById<RecordingJob>('recording_jobs', jobId)
}

/**
 * Get recording jobs by appointment
 */
export async function getRecordingJobsByAppointment(appointmentId: string): Promise<RecordingJob[]> {
  return api.executeQuery<RecordingJob>('recording_jobs', {
    columns: 'id, patient_id, therapist_id, appointment_id, sources_json, audio_storage_url, merged_audio_url, status, transcript_raw_text, transcript_clean_text, record_id, error_msg, audio_chunks_json, total_chunks, processed_chunks, audio_duration_seconds, processing_started_at, processing_completed_at, medical_record, note_type, tipo_consulta, created_at, updated_at',
    filter: [{ key: 'appointment_id', value: appointmentId }],
    order: { column: 'created_at', ascending: false }
  })
}

/**
 * Count recording jobs by status
 */
export async function countRecordingJobsByStatus(status: RecordingJobStatus): Promise<number> {
  return api.count('recording_jobs', [{ key: 'status', value: status }])
}

/**
 * Count processing jobs
 */
export async function countProcessingRecordingJobs(): Promise<number> {
  try {
    const { count, error } = await supabase
      .schema('cedro')
      .from('recording_jobs')
      .select('*', { count: 'exact', head: true })
      .in('status', ['uploaded', 'processing', 'transcribing', 'generating_record'])

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
 * Create recording job
 */
export async function createRecordingJob(
  data: Omit<RecordingJob, 'id' | 'created_at' | 'updated_at'>
): Promise<RecordingJob> {
  return api.insert<RecordingJob>('recording_jobs', data)
}

/**
 * Update recording job
 */
export async function updateRecordingJob(
  jobId: string,
  data: Partial<Omit<RecordingJob, 'id' | 'created_at' | 'updated_at'>>
): Promise<RecordingJob> {
  return api.update<RecordingJob>('recording_jobs', jobId, data)
}

/**
 * Update recording job status
 */
export async function updateRecordingJobStatus(jobId: string, status: RecordingJobStatus): Promise<RecordingJob> {
  const updateData: any = { status }

  // Auto-set timestamps based on status transitions
  if (status === 'processing' || status === 'transcribing' || status === 'generating_record') {
    if (!updateData.processing_started_at) {
      updateData.processing_started_at = new Date().toISOString()
    }
  } else if (status === 'completed' || status === 'error') {
    updateData.processing_completed_at = new Date().toISOString()
  }

  return updateRecordingJob(jobId, updateData)
}

/**
 * Update recording job with processing progress
 */
export async function updateRecordingJobProgress(
  jobId: string,
  processedChunks: number,
  totalChunks: number
): Promise<RecordingJob> {
  return updateRecordingJob(jobId, {
    processed_chunks: processedChunks,
    total_chunks: totalChunks
  })
}

/**
 * Mark recording job as completed with medical record
 */
export async function completeRecordingJob(
  jobId: string,
  recordId: string,
  medicalRecord: Record<string, any>,
  transcriptClean: string
): Promise<RecordingJob> {
  return updateRecordingJob(jobId, {
    status: 'completed',
    record_id: recordId,
    medical_record: medicalRecord,
    transcript_clean_text: transcriptClean,
    processing_completed_at: new Date().toISOString()
  })
}

/**
 * Mark recording job as error
 */
export async function markRecordingJobAsError(jobId: string, errorMessage: string): Promise<RecordingJob> {
  return updateRecordingJob(jobId, {
    status: 'error',
    error_msg: errorMessage,
    processing_completed_at: new Date().toISOString()
  })
}

/**
 * Delete recording job
 */
export async function deleteRecordingJob(jobId: string): Promise<void> {
  return api.delete('recording_jobs', jobId)
}

/**
 * Retry failed recording job
 */
export async function retryRecordingJob(jobId: string): Promise<RecordingJob> {
  return updateRecordingJob(jobId, {
    status: 'uploaded',
    error_msg: null,
    processed_chunks: 0,
    processing_started_at: null,
    processing_completed_at: null
  })
}

/**
 * Bulk delete completed recording jobs
 */
export async function bulkDeleteCompletedRecordingJobs(jobIds: string[]): Promise<void> {
  try {
    const { error } = await supabase
      .schema('cedro')
      .from('recording_jobs')
      .delete()
      .in('id', jobIds)

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
