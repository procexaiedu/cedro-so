import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      recording_job_id,
      patient_id,
      therapist_id,
      texto_transcricao_bruta,
      texto_rascunho,
      output
    } = body

    if (!recording_job_id) {
      return NextResponse.json(
        { error: 'recording_job_id é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Get recording job details to validate
    const { data: recordingJob, error: jobError } = await supabase
      .schema('cedro')
      .from('recording_jobs')
      .select('*')
      .eq('id', recording_job_id)
      .single()

    if (jobError || !recordingJob) {
      return NextResponse.json(
        { error: 'Job de gravação não encontrado' },
        { status: 404 }
      )
    }

    // Output is now markdown text, no parsing needed
    const markdownOutput = output || ''

    // Update recording job with results
    const { error: updateJobError } = await supabase
      .schema('cedro')
      .from('recording_jobs')
      .update({
        transcript_raw_text: texto_transcricao_bruta,
        transcript_clean_text: texto_rascunho,
        medical_record: markdownOutput,
        status: 'completed',
        processing_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', recording_job_id)

    if (updateJobError) {
      console.error('Error updating recording job:', updateJobError)
      return NextResponse.json(
        { error: 'Erro ao atualizar job de gravação' },
        { status: 500 }
      )
    }

    // Determine note type and if it's anamnesis
    let isAnamnesis = recordingJob.note_type === 'anamnesis'
    
    // Fallback: if note_type is not anamnesis, check if this is the first medical record for this patient
    if (!isAnamnesis && recordingJob.note_type !== 'anamnesis') {
      const { data: existingRecords, error: recordsError } = await supabase
        .schema('cedro')
        .from('medical_records')
        .select('id')
        .eq('patient_id', patient_id)
        .limit(1)
      
      // If no existing records found, treat as anamnesis
      if (!recordsError && (!existingRecords || existingRecords.length === 0)) {
        isAnamnesis = true
      }
    }

    // Extract title from markdown (first # heading) or use default
    const titleMatch = markdownOutput.match(/^#\s+(.+)$/m)
    const extractedTitle = titleMatch ? titleMatch[1] : `Teleconsulta - ${new Date().toLocaleDateString('pt-BR')}`
    
    // Extract summary from first paragraph or use truncated content
    const summaryMatch = markdownOutput.match(/^(?!#)(.+?)(?:\n\n|\n#|$)/m)
    const extractedSummary = summaryMatch ? summaryMatch[1].substring(0, 500) : markdownOutput.substring(0, 500)

    // Create medical record entry
    const { data: medicalRecord, error: recordError } = await supabase
      .schema('cedro')
      .from('medical_records')
      .insert({
        patient_id: patient_id,
        appointment_id: recordingJob.appointment_id,
        note_type: recordingJob.note_type || (isAnamnesis ? 'anamnesis' : 'consultation'),
        type: 'markdown',
        title: extractedTitle,
        content: markdownOutput,
        summary: extractedSummary,
        keywords: [], // Keywords can be extracted later if needed
        content_json: {
          raw_transcript: texto_transcricao_bruta,
          markdown_content: markdownOutput,
          processing_metadata: {
            processed_by: 'n8n',
            processed_at: new Date().toISOString(),
            model_used: 'whisper-large-v3 + gpt-4.1'
          }
        },
        visibility: 'private',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (recordError) {
      console.error('Error creating medical record:', recordError)
      
      // Update job status to indicate medical record creation failed
      await supabase
        .schema('cedro')
        .from('recording_jobs')
        .update({
          status: 'completed_with_errors',
          error_message: 'Erro ao criar prontuário médico',
          updated_at: new Date().toISOString()
        })
        .eq('id', recording_job_id)

      return NextResponse.json(
        { error: 'Erro ao criar prontuário médico' },
        { status: 500 }
      )
    }

    // Update recording job with medical record reference
    const { error: linkError } = await supabase
      .schema('cedro')
      .from('recording_jobs')
      .update({ 
        record_id: medicalRecord.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', recording_job_id)

    if (linkError) {
      console.error('Error linking medical record to job:', linkError)
      // Don't fail the request if linking fails
    }

    return NextResponse.json({
      success: true,
      message: 'Callback processado com sucesso',
      recording_job_id: recording_job_id,
      medical_record_id: medicalRecord.id,
      transcript_length: texto_transcricao_bruta?.length || 0
    })

  } catch (error) {
    console.error('Error processing n8n callback:', error)
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}