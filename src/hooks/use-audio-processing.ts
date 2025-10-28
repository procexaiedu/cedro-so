import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { fetchWithTimeout, pollUntilCondition, NETWORK_CONFIG } from '@/lib/network-config'

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
  const [pollingAttempts, setPollingAttempts] = useState(0)

  const fetchStatus = useCallback(async () => {
    if (!recordingJobId) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetchWithTimeout(`/api/audio/status/${recordingJobId}`, {
        timeout: NETWORK_CONFIG.POLLING_TIMEOUT
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch status: ${response.statusText}`)
      }

      const data = await response.json()
      setStatus(data)
    } catch (err) {
      console.error('Error fetching audio processing status:', err)
      
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [recordingJobId])

  // Polling effect with improved timeout and retry logic
  useEffect(() => {
    if (!recordingJobId) return

    let isPolling = false
    let timeoutId: NodeJS.Timeout

    const startPolling = async () => {
      if (isPolling) return
      isPolling = true
      setPollingAttempts(0)

      try {
        // Use the new polling utility
        await pollUntilCondition(
          async () => {
            setPollingAttempts(prev => prev + 1)
            return await fetchStatus()
          },
          (result) => {
            // Stop polling when status is completed, error, or result is null (error occurred)
            return result === null || result?.status === 'completed' || result?.status === 'error'
          },
          NETWORK_CONFIG.POLLING_INTERVAL,
          NETWORK_CONFIG.MAX_POLLING_ATTEMPTS
        )
      } catch (error) {
        console.error('Polling timeout or max attempts reached:', error)
        setError('Audio processing is taking longer than expected. Please refresh the page.')
      } finally {
        isPolling = false
      }
    }

    // Only start polling if status is not in a final state
    if (!status || (status.status !== 'completed' && status.status !== 'error')) {
      // Add a small delay to prevent immediate polling on mount
      timeoutId = setTimeout(startPolling, 1000)
    }

    return () => {
      isPolling = false
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [recordingJobId, fetchStatus]) // Removed status?.status from dependencies to avoid circular updates

  // Log when audio processing reaches final state
  useEffect(() => {
    if (status?.status === 'completed' || status?.status === 'error') {
      console.log('Audio processing finished with status:', status.status, 'after', pollingAttempts, 'attempts')
    }
  }, [status?.status, pollingAttempts])

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
    pollingAttempts,
    refetch: fetchStatus
  }
}