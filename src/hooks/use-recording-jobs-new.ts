/**
 * CEDRO useRecordingJobs Hooks - NEW CLEAN ARCHITECTURE
 *
 * React Query hooks for recording job management
 * Handles audio processing, transcription, and medical record generation
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import {
  getAllRecordingJobs,
  getRecordingJobsByPatient,
  getRecordingJobsByTherapist,
  getRecordingJobsByStatus,
  getProcessingRecordingJobs,
  getRecordingJobById,
  getRecordingJobsByAppointment,
  countRecordingJobsByStatus,
  countProcessingRecordingJobs,
  createRecordingJob,
  updateRecordingJob,
  updateRecordingJobStatus,
  updateRecordingJobProgress,
  completeRecordingJob,
  markRecordingJobAsError,
  deleteRecordingJob,
  retryRecordingJob,
  bulkDeleteCompletedRecordingJobs
} from '@/lib/api/recording-jobs'
import { queryKeys, QUERY_OPTIONS_LIST, QUERY_OPTIONS_DETAIL, getMutationOptions } from '@/lib/api/react-query-patterns'
import type { RecordingJob, RecordingJobStatus } from '@/lib/api/types'

// ============ QUERIES ============

/**
 * Hook to fetch all recording jobs
 */
export function useAllRecordingJobs() {
  return useQuery({
    queryKey: ['recording-jobs-all'],
    queryFn: () => getAllRecordingJobs(),
    ...QUERY_OPTIONS_LIST
  })
}

/**
 * Hook to fetch recording jobs by patient
 */
export function useRecordingJobsByPatient(patientId: string | undefined) {
  return useQuery({
    queryKey: ['recording-jobs-patient', patientId],
    queryFn: () => {
      if (!patientId) throw new Error('Patient ID required')
      return getRecordingJobsByPatient(patientId)
    },
    enabled: !!patientId,
    ...QUERY_OPTIONS_LIST
  })
}

/**
 * Hook to fetch recording jobs by therapist
 */
export function useRecordingJobsByTherapist(therapistId: string | undefined) {
  return useQuery({
    queryKey: ['recording-jobs-therapist', therapistId],
    queryFn: () => {
      if (!therapistId) throw new Error('Therapist ID required')
      return getRecordingJobsByTherapist(therapistId)
    },
    enabled: !!therapistId,
    ...QUERY_OPTIONS_LIST
  })
}

/**
 * Hook to fetch recording jobs by status
 */
export function useRecordingJobsByStatus(status: RecordingJobStatus) {
  return useQuery({
    queryKey: ['recording-jobs-status', status],
    queryFn: () => getRecordingJobsByStatus(status),
    ...QUERY_OPTIONS_LIST
  })
}

/**
 * Hook to fetch processing recording jobs (for dashboard)
 */
export function useProcessingRecordingJobs() {
  return useQuery({
    queryKey: ['recording-jobs-processing'],
    queryFn: () => getProcessingRecordingJobs(),
    ...QUERY_OPTIONS_LIST,
    refetchInterval: 15000 // Refetch every 15 seconds for real-time progress
  })
}

/**
 * Hook to fetch single recording job
 */
export function useRecordingJob(jobId: string | undefined) {
  return useQuery({
    queryKey: ['recording-job', jobId],
    queryFn: () => {
      if (!jobId) throw new Error('Job ID required')
      return getRecordingJobById(jobId)
    },
    enabled: !!jobId,
    ...QUERY_OPTIONS_DETAIL,
    refetchInterval: (data) => {
      // Auto-refresh if job is still processing
      if (data && ['processing', 'transcribing', 'generating_record'].includes((data as RecordingJob).status)) {
        return 10000 // Refetch every 10 seconds while processing
      }
      return false // Stop refetching when completed/error
    }
  })
}

/**
 * Hook to fetch recording jobs by appointment
 */
export function useRecordingJobsByAppointment(appointmentId: string | undefined) {
  return useQuery({
    queryKey: ['recording-jobs-appointment', appointmentId],
    queryFn: () => {
      if (!appointmentId) throw new Error('Appointment ID required')
      return getRecordingJobsByAppointment(appointmentId)
    },
    enabled: !!appointmentId,
    ...QUERY_OPTIONS_LIST
  })
}

/**
 * Hook to count recording jobs by status
 */
export function useRecordingJobsCountByStatus(status: RecordingJobStatus) {
  return useQuery({
    queryKey: ['recording-jobs-count', status],
    queryFn: () => countRecordingJobsByStatus(status),
    ...QUERY_OPTIONS_LIST
  })
}

/**
 * Hook to count processing recording jobs
 */
export function useProcessingRecordingJobsCount() {
  return useQuery({
    queryKey: ['recording-jobs-count-processing'],
    queryFn: () => countProcessingRecordingJobs(),
    ...QUERY_OPTIONS_LIST,
    refetchInterval: 15000 // Refetch every 15 seconds
  })
}

// ============ MUTATIONS ============

/**
 * Hook to create recording job
 */
export function useCreateRecordingJob() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (data: Omit<RecordingJob, 'id' | 'created_at' | 'updated_at'>) => createRecordingJob(data),
    ...getMutationOptions<RecordingJob, Error>({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['recording-jobs-all'] })
        queryClient.invalidateQueries({ queryKey: ['recording-jobs-processing'] })
        toast({
          title: 'Sucesso',
          description: 'Gravação enviada para processamento'
        })
      },
      onError: (error: any) => {
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao enviar gravação',
          variant: 'destructive'
        })
      }
    })
  })
}

/**
 * Hook to update recording job
 */
export function useUpdateRecordingJob(jobId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (data: Partial<Omit<RecordingJob, 'id' | 'created_at' | 'updated_at'>>) =>
      updateRecordingJob(jobId, data),
    ...getMutationOptions<RecordingJob, Error>({
      onSuccess: (updatedJob) => {
        queryClient.setQueryData(['recording-job', jobId], updatedJob)
        queryClient.invalidateQueries({ queryKey: ['recording-jobs-all'] })
        toast({
          title: 'Sucesso',
          description: 'Gravação atualizada'
        })
      },
      onError: (error: any) => {
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao atualizar gravação',
          variant: 'destructive'
        })
      }
    })
  })
}

/**
 * Hook to update recording job status
 */
export function useUpdateRecordingJobStatus() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ jobId, status }: { jobId: string; status: RecordingJobStatus }) =>
      updateRecordingJobStatus(jobId, status),
    ...getMutationOptions<RecordingJob, Error>({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['recording-jobs-all'] })
        queryClient.invalidateQueries({ queryKey: ['recording-jobs-processing'] })
      },
      onError: (error: any) => {
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao atualizar status',
          variant: 'destructive'
        })
      }
    })
  })
}

/**
 * Hook to update recording job progress
 */
export function useUpdateRecordingJobProgress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      jobId,
      processedChunks,
      totalChunks
    }: {
      jobId: string
      processedChunks: number
      totalChunks: number
    }) => updateRecordingJobProgress(jobId, processedChunks, totalChunks),
    ...getMutationOptions<RecordingJob, Error>({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['recording-jobs-all'] })
        queryClient.invalidateQueries({ queryKey: ['recording-jobs-processing'] })
      }
    })
  })
}

/**
 * Hook to complete recording job
 */
export function useCompleteRecordingJob() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({
      jobId,
      recordId,
      medicalRecord,
      transcriptClean
    }: {
      jobId: string
      recordId: string
      medicalRecord: Record<string, any>
      transcriptClean: string
    }) => completeRecordingJob(jobId, recordId, medicalRecord, transcriptClean),
    ...getMutationOptions<RecordingJob, Error>({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['recording-jobs-all'] })
        queryClient.invalidateQueries({ queryKey: ['recording-jobs-processing'] })
        queryClient.invalidateQueries({ queryKey: ['medical-records'] })
        toast({
          title: 'Sucesso',
          description: 'Prontuário gerado automaticamente'
        })
      },
      onError: (error: any) => {
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao completar processamento',
          variant: 'destructive'
        })
      }
    })
  })
}

/**
 * Hook to mark recording job as error
 */
export function useMarkRecordingJobAsError() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ jobId, errorMessage }: { jobId: string; errorMessage: string }) =>
      markRecordingJobAsError(jobId, errorMessage),
    ...getMutationOptions<RecordingJob, Error>({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['recording-jobs-all'] })
        queryClient.invalidateQueries({ queryKey: ['recording-jobs-processing'] })
        toast({
          title: 'Aviso',
          description: 'Erro registrado no processamento',
          variant: 'destructive'
        })
      }
    })
  })
}

/**
 * Hook to delete recording job
 */
export function useDeleteRecordingJob() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (jobId: string) => deleteRecordingJob(jobId),
    ...getMutationOptions<void, Error>({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['recording-jobs-all'] })
        toast({
          title: 'Sucesso',
          description: 'Gravação removida'
        })
      },
      onError: (error: any) => {
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao remover gravação',
          variant: 'destructive'
        })
      }
    })
  })
}

/**
 * Hook to retry recording job
 */
export function useRetryRecordingJob() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (jobId: string) => retryRecordingJob(jobId),
    ...getMutationOptions<RecordingJob, Error>({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['recording-jobs-all'] })
        queryClient.invalidateQueries({ queryKey: ['recording-jobs-processing'] })
        toast({
          title: 'Sucesso',
          description: 'Gravação reenviada para processamento'
        })
      },
      onError: (error: any) => {
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao reenviar gravação',
          variant: 'destructive'
        })
      }
    })
  })
}

/**
 * Hook to bulk delete completed recording jobs
 */
export function useBulkDeleteCompletedRecordingJobs() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (jobIds: string[]) => bulkDeleteCompletedRecordingJobs(jobIds),
    ...getMutationOptions<void, Error>({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['recording-jobs-all'] })
        toast({
          title: 'Sucesso',
          description: 'Gravações removidas'
        })
      },
      onError: (error: any) => {
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao remover gravações',
          variant: 'destructive'
        })
      }
    })
  })
}
