import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getPresignedUrl } from '@/lib/minio'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const recordingJobId = searchParams.get('recordingJobId')
    
    if (!recordingJobId) {
      return NextResponse.json(
        { error: 'recordingJobId é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Get recording job with audio storage URL
    const { data: recordingJob, error } = await supabase
      .schema('cedro')
      .from('recording_jobs')
      .select('audio_storage_url')
      .eq('id', recordingJobId)
      .single()

    if (error || !recordingJob) {
      return NextResponse.json(
        { error: 'Job de gravação não encontrado' },
        { status: 404 }
      )
    }

    if (!recordingJob.audio_storage_url) {
      return NextResponse.json(
        { error: 'Arquivo de áudio não encontrado' },
        { status: 404 }
      )
    }

    // Generate presigned URL (valid for 1 hour)
    const presignedUrl = await getPresignedUrl(recordingJob.audio_storage_url, 3600)

    return NextResponse.json({
      downloadUrl: presignedUrl,
      expiresIn: 3600 // seconds
    })

  } catch (error) {
    console.error('Error generating download URL:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}