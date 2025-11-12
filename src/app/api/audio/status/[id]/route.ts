import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const recordingJobId = params.id

    if (!recordingJobId) {
      return NextResponse.json(
        { error: 'ID do job de gravação é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Get recording job status with progress calculation
    const { data: progressData, error: progressError } = await supabase
      .schema('cedro')
      .rpc('calculate_recording_progress', { job_id: recordingJobId })

    if (progressError || !progressData) {
      return NextResponse.json(
        { error: 'Job de gravação não encontrado' },
        { status: 404 }
      )
    }

    // Get full recording job details
    const { data: recordingJob, error: jobError } = await supabase
      .schema('cedro')
      .from('recording_jobs')
      .select(`
        id,
        status,
        error_msg,
        transcript_raw_text,
        transcript_clean_text,
        medical_record,
        record_id,
        audio_chunks_json,
        total_chunks,
        processed_chunks,
        audio_duration_seconds,
        processing_started_at,
        processing_completed_at,
        created_at,
        updated_at,
        sources_json
      `)
      .eq('id', recordingJobId)
      .single()

    if (jobError || !recordingJob) {
      return NextResponse.json(
        { error: 'Job de gravação não encontrado' },
        { status: 404 }
      )
    }

    // Get medical record if available
    let medicalRecord: { id: any; content_json: any; created_at: any; } | null = null
    if (recordingJob.record_id) {
      const { data: record } = await supabase
        .schema('cedro')
        .from('medical_records')
        .select('id, content_json, created_at')
        .eq('id', recordingJob.record_id)
        .single()
      
      medicalRecord = record
    }

    return NextResponse.json({
      id: recordingJob.id,
      status: recordingJob.status,
      progress: (progressData as any)?.progress_percentage || 0,
      error_message: recordingJob.error_msg,
      has_transcript: !!recordingJob.transcript_raw_text,
      has_structured_record: !!recordingJob.transcript_clean_text,
      medical_record_id: recordingJob.record_id,
      medical_record: medicalRecord || recordingJob.medical_record,
      
      // Chunk processing details
      audio_chunks: recordingJob.audio_chunks_json || [],
      total_chunks: recordingJob.total_chunks || 0,
      processed_chunks: recordingJob.processed_chunks || 0,
      
      // Timing information
      audio_duration_seconds: recordingJob.audio_duration_seconds,
      processing_started_at: recordingJob.processing_started_at,
      processing_completed_at: recordingJob.processing_completed_at,
      estimated_completion: (progressData as any)?.estimated_completion,
      
      // Timestamps
      created_at: recordingJob.created_at,
      updated_at: recordingJob.updated_at,
      sources: recordingJob.sources_json,
      
      // Progress details from function
      progress_details: progressData
    })

  } catch (error) {
    console.error('Error getting recording job status:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}