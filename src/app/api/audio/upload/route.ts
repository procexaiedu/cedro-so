import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { uploadAudioFile } from '@/lib/minio'
import { fetchWithTimeout, NETWORK_CONFIG } from '@/lib/network-config'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    const patientId = formData.get('patient_id') as string
    const therapistId = formData.get('therapist_id') as string
    const appointmentId = formData.get('appointment_id') as string
    const tipoConsulta = formData.get('tipo_consulta') as string || 'evolucao'

    if (!audioFile || !patientId || !therapistId) {
      return NextResponse.json(
        { error: 'Arquivo de áudio, ID do paciente e ID do terapeuta são obrigatórios' },
        { status: 400 }
      )
    }

    // Validate file type - accept audio files and WebM (which can contain audio)
    const validAudioTypes = [
      'audio/',
      'video/webm',
      'video/mp4', // MP4 can also contain audio-only
      'application/octet-stream' // Sometimes browsers send this for audio files
    ]
    
    const isValidAudio = validAudioTypes.some(type => 
      audioFile.type.startsWith(type) || audioFile.type === type
    )
    
    if (!isValidAudio) {
      return NextResponse.json(
        { error: `Arquivo deve ser um áudio válido. Tipo recebido: ${audioFile.type}` },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Create recording job entry
    const { data: recordingJob, error: jobError } = await supabase
      .schema('cedro')
      .from('recording_jobs')
      .insert({
        patient_id: patientId,
        therapist_id: therapistId,
        appointment_id: appointmentId,
        tipo_consulta: tipoConsulta,
        status: 'uploaded',
        sources_json: [{
          type: 'teleconsultation',
          filename: audioFile.name,
          size: audioFile.size,
          mime_type: audioFile.type
        }]
      })
      .select()
      .single()

    if (jobError) {
      console.error('Error creating recording job:', jobError)
      return NextResponse.json(
        { error: 'Erro ao criar job de processamento' },
        { status: 500 }
      )
    }

    // Store audio file in MinIO
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer())
    const audioStorageUrl = await uploadAudioFile(
      audioFile.name,
      audioBuffer,
      {
        'patient-id': patientId,
        'therapist-id': therapistId,
        'appointment-id': appointmentId || '',
        'upload-timestamp': new Date().toISOString()
      }
    )

    // Update recording job with storage URL
    const { error: updateError } = await supabase
      .schema('cedro')
      .from('recording_jobs')
      .update({
        audio_storage_url: audioStorageUrl,
        status: 'processing'
      })
      .eq('id', recordingJob.id)

    if (updateError) {
      console.error('Error updating recording job:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar job de processamento' },
        { status: 500 }
      )
    }

    // Trigger audio processing pipeline
    try {
      const processResponse = await fetchWithTimeout(`${request.nextUrl.origin}/api/audio/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recording_job_id: recordingJob.id
        }),
        timeout: NETWORK_CONFIG.DEFAULT_TIMEOUT
      })

      if (!processResponse.ok) {
        console.error('Error triggering audio processing:', await processResponse.text())
        // Don't fail the upload if processing trigger fails
      }
    } catch (processError) {
      console.error('Error triggering audio processing:', processError)
      // Don't fail the upload if processing trigger fails
    }

    return NextResponse.json({
      success: true,
      recording_job_id: recordingJob.id,
      message: 'Áudio enviado com sucesso. Processamento iniciado.'
    })

  } catch (error) {
    console.error('Error in audio upload:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}