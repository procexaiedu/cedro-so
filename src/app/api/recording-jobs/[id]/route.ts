import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'ID do recording job é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Get recording job details
    const { data: recordingJob, error: jobError } = await supabase
      .schema('cedro')
      .from('recording_jobs')
      .select(`
        *,
        medical_records (
          id,
          title,
          type,
          note_type,
          created_at
        )
      `)
      .eq('id', id)
      .single()

    if (jobError) {
      console.error('Error fetching recording job:', jobError)
      return NextResponse.json(
        { error: 'Erro ao buscar job de gravação' },
        { status: 500 }
      )
    }

    if (!recordingJob) {
      return NextResponse.json(
        { error: 'Job de gravação não encontrado' },
        { status: 404 }
      )
    }

    // Calculate processing duration if completed
    let processingDuration: number | null = null
    if (recordingJob.processing_started_at && recordingJob.processing_completed_at) {
      const startTime = new Date(recordingJob.processing_started_at)
      const endTime = new Date(recordingJob.processing_completed_at)
      processingDuration = Math.round((endTime.getTime() - startTime.getTime()) / 1000) // seconds
    }

    // Prepare response with additional metadata
    const response = {
      ...recordingJob,
      processing_duration_seconds: processingDuration,
      has_medical_record: !!recordingJob.record_id,
      transcript_length: recordingJob.transcript_raw_text?.length || 0,
      medical_record_summary: recordingJob.medical_records ? {
        id: recordingJob.medical_records.id,
        title: recordingJob.medical_records.title,
        type: recordingJob.medical_records.type,
        note_type: recordingJob.medical_records.note_type,
        created_at: recordingJob.medical_records.created_at
      } : null
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error in recording job status endpoint:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'ID do recording job é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Validate that the job exists
    const { data: existingJob, error: fetchError } = await supabase
      .schema('cedro')
      .from('recording_jobs')
      .select('id, status')
      .eq('id', id)
      .single()

    if (fetchError || !existingJob) {
      return NextResponse.json(
        { error: 'Job de gravação não encontrado' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData = {
      ...body,
      updated_at: new Date().toISOString()
    }

    // If status is being updated to processing, set processing_started_at
    if (body.status && body.status.includes('processing') && !existingJob.status.includes('processing')) {
      updateData.processing_started_at = new Date().toISOString()
    }

    // If status is being updated to completed, set processing_completed_at
    if (body.status && (body.status === 'completed' || body.status === 'completed_with_errors')) {
      updateData.processing_completed_at = new Date().toISOString()
    }

    // Update the recording job
    const { data: updatedJob, error: updateError } = await supabase
      .schema('cedro')
      .from('recording_jobs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating recording job:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar job de gravação' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Job atualizado com sucesso',
      job: updatedJob
    })

  } catch (error) {
    console.error('Error updating recording job:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'ID do recording job é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Check if the job exists and get its status
    const { data: existingJob, error: fetchError } = await supabase
      .schema('cedro')
      .from('recording_jobs')
      .select('id, status, record_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingJob) {
      return NextResponse.json(
        { error: 'Job de gravação não encontrado' },
        { status: 404 }
      )
    }

    // If the job has an associated medical record, we should not delete it
    // Instead, we should only allow deletion of pending/failed jobs
    if (existingJob.record_id) {
      return NextResponse.json(
        { error: 'Não é possível deletar um job que já possui prontuário associado' },
        { status: 400 }
      )
    }

    // Delete the recording job
    const { error: deleteError } = await supabase
      .schema('cedro')
      .from('recording_jobs')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting recording job:', deleteError)
      return NextResponse.json(
        { error: 'Erro ao deletar job de gravação' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Job de gravação deletado com sucesso' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error deleting recording job:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}