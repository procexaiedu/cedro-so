import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPresignedUrl } from '@/lib/minio'

export async function POST(request: NextRequest) {
  try {
    const { recording_job_id } = await request.json()

    if (!recording_job_id) {
      return NextResponse.json(
        { error: 'ID do job de gravação é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Get recording job details
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

    if (!recordingJob.audio_storage_url) {
      return NextResponse.json(
        { error: 'URL de armazenamento de áudio não encontrada' },
        { status: 400 }
      )
    }

    // Generate presigned URL for n8n to download the audio
    const presignedUrl = await getPresignedUrl(recordingJob.audio_storage_url, 7200) // 2 hours

    // Extract filename from sources_json
    const audioFilename = recordingJob.sources_json?.[0]?.filename || 'audio.webm'

    // Prepare webhook payload for n8n
    const webhookPayload = {
      recording_job_id: recording_job_id,
      patient_id: recordingJob.patient_id,
      therapist_id: recordingJob.therapist_id,
      appointment_id: recordingJob.appointment_id,
      tipo_consulta: recordingJob.tipo_consulta || 'evolucao', // 'anamnese' ou 'evolucao'
      audio_url_assinada: presignedUrl,
      audio_original_filename: audioFilename,
      storage_path_do_audio: recordingJob.audio_storage_url
    }

    // Trigger n8n webhook
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || 'https://webh.procexai.tech/webhook/prontuarios-drbrain'
    
    const webhookResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload)
    })

    if (!webhookResponse.ok) {
      throw new Error(`Webhook failed: ${webhookResponse.status} ${webhookResponse.statusText}`)
    }

    // Update recording job status to indicate n8n processing has started
    const { error: updateError } = await supabase
      .schema('cedro')
      .from('recording_jobs')
      .update({
        status: 'processing_n8n',
        updated_at: new Date().toISOString()
      })
      .eq('id', recording_job_id)

    if (updateError) {
      console.error('Error updating recording job status:', updateError)
      // Don't fail the request if status update fails
    }

    return NextResponse.json({
      success: true,
      message: 'Processamento iniciado no n8n',
      recording_job_id: recording_job_id,
      webhook_triggered: true
    })

  } catch (error) {
    console.error('Error triggering n8n processing:', error)
    
    // Try to update job status to error
    try {
      const supabase = createClient()
      const { recording_job_id } = await request.json()
      
      if (recording_job_id) {
        await supabase
          .schema('cedro')
          .from('recording_jobs')
          .update({
            status: 'error',
            error_message: error instanceof Error ? error.message : 'Erro desconhecido',
            updated_at: new Date().toISOString()
          })
          .eq('id', recording_job_id)
      }
    } catch (updateError) {
      console.error('Error updating job status to error:', updateError)
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}