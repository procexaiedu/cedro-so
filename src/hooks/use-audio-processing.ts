import { useState, useEffect, useCallback } from 'react'

export interface AudioProcessingStatus {
  id: string
  status: string
  progress: number
  error_message?: string
  has_transcript: boolean
  has_structured_record: boolean
  medical_record_id?: string
  medical_record?: any
  created_at: string
  updated_at: string
  sources: any[]
  
  // New chunk processing details
  audio_chunks?: any[]
  total_chunks?: number
  processed_chunks?: number
  
  // Timing information
  audio_duration_seconds?: number
  processing_started_at?: string
  processing_completed_at?: string
  
  // Progress details from function
  progress_details?: {
    progress_percentage: number
    estimated_completion?: string
    current_phase: string
    chunks_completed: number
    chunks_total: number
  }
}

export function useAudioProcessing(recordingJobId: string | null) {
  const [status, setStatus] = useState<AudioProcessingStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = useCallback(async () => {
    if (!recordingJobId) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/audio/status/${recordingJobId}`)
      
      if (!response.ok) {
        throw new Error('Erro ao buscar status do processamento')
      }

      const data = await response.json()
      setStatus(data)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [recordingJobId])

  useEffect(() => {
    if (!recordingJobId) return

    // Initial fetch
    fetchStatus()

    // Poll for updates every 3 seconds if not completed
    const interval = setInterval(() => {
      if (status?.status !== 'completed' && status?.status !== 'error') {
        fetchStatus()
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [recordingJobId, fetchStatus, status?.status])

  const isCompleted = status?.status === 'completed'
  const isError = status?.status === 'error'
  const isProcessing = status && !isCompleted && !isError

  return {
    status,
    loading,
    error,
    isCompleted,
    isError,
    isProcessing,
    refetch: fetchStatus
  }
}