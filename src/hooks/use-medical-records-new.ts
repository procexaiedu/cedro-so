// @ts-nocheck
/**
 * CEDRO useMedicalRecords Hooks - NEW CLEAN ARCHITECTURE
 *
 * React Query hooks for medical record management
 * Handles all medical record data fetching and mutations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import {
  getAllMedicalRecords,
  getMedicalRecordsByPatient,
  getMedicalRecordsByAppointment,
  getMedicalRecordsByType,
  getMedicalRecordById,
  getUnsignedMedicalRecords,
  getSignedMedicalRecords,
  countMedicalRecordsByPatient,
  countUnsignedMedicalRecords,
  createMedicalRecord,
  updateMedicalRecord,
  deleteMedicalRecord,
  signMedicalRecord,
  updateMedicalRecordContent,
  updateMedicalRecordVisibility,
  bulkUpdateMedicalRecordVisibility,
  bulkSignMedicalRecords
} from '@/lib/api/medical-records'
import { queryKeys, QUERY_OPTIONS_LIST, QUERY_OPTIONS_DETAIL, getMutationOptions } from '@/lib/api/react-query-patterns'
import type { MedicalRecord, MedicalRecordType } from '@/lib/api/types'

// ============ QUERIES ============

/**
 * Hook to fetch all medical records
 */
export function useAllMedicalRecords() {
  return useQuery({
    queryKey: queryKeys.medicalRecords.list(),
    queryFn: () => getAllMedicalRecords(),
    ...QUERY_OPTIONS_LIST
  })
}

/**
 * Hook to fetch medical records by patient
 */
export function useMedicalRecordsByPatient(patientId: string | undefined) {
  return useQuery({
    queryKey: patientId
      ? queryKeys.medicalRecords.byPatient(patientId)
      : queryKeys.medicalRecords.all,
    queryFn: () => {
      if (!patientId) throw new Error('Patient ID required')
      return getMedicalRecordsByPatient(patientId)
    },
    enabled: !!patientId,
    ...QUERY_OPTIONS_LIST
  })
}

/**
 * Hook to fetch medical records by appointment
 */
export function useMedicalRecordsByAppointment(appointmentId: string | undefined) {
  return useQuery({
    queryKey: ['medical-records-appointment', appointmentId],
    queryFn: () => {
      if (!appointmentId) throw new Error('Appointment ID required')
      return getMedicalRecordsByAppointment(appointmentId)
    },
    enabled: !!appointmentId,
    ...QUERY_OPTIONS_LIST
  })
}

/**
 * Hook to fetch medical records by type
 */
export function useMedicalRecordsByType(noteType: MedicalRecordType) {
  return useQuery({
    queryKey: ['medical-records-type', noteType],
    queryFn: () => getMedicalRecordsByType(noteType),
    ...QUERY_OPTIONS_LIST
  })
}

/**
 * Hook to fetch single medical record
 */
export function useMedicalRecord(recordId: string | undefined) {
  return useQuery({
    queryKey: recordId
      ? queryKeys.medicalRecords.detail(recordId)
      : queryKeys.medicalRecords.all,
    queryFn: () => {
      if (!recordId) throw new Error('Record ID required')
      return getMedicalRecordById(recordId)
    },
    enabled: !!recordId,
    ...QUERY_OPTIONS_DETAIL
  })
}

/**
 * Hook to fetch unsigned medical records
 */
export function useUnsignedMedicalRecords() {
  return useQuery({
    queryKey: ['medical-records-unsigned'],
    queryFn: () => getUnsignedMedicalRecords(),
    ...QUERY_OPTIONS_LIST
  })
}

/**
 * Hook to fetch signed medical records
 */
export function useSignedMedicalRecords() {
  return useQuery({
    queryKey: ['medical-records-signed'],
    queryFn: () => getSignedMedicalRecords(),
    ...QUERY_OPTIONS_LIST
  })
}

/**
 * Hook to count medical records by patient
 */
export function useMedicalRecordCountByPatient(patientId: string) {
  return useQuery({
    queryKey: ['medical-records-count', patientId],
    queryFn: () => countMedicalRecordsByPatient(patientId),
    ...QUERY_OPTIONS_LIST
  })
}

/**
 * Hook to count unsigned medical records
 */
export function useUnsignedMedicalRecordCount() {
  return useQuery({
    queryKey: ['medical-records-unsigned-count'],
    queryFn: () => countUnsignedMedicalRecords(),
    ...QUERY_OPTIONS_LIST,
    refetchInterval: 30000 // Refetch every 30 seconds
  })
}

// ============ MUTATIONS ============

/**
 * Hook to create medical record
 */
export function useCreateMedicalRecord() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (data: Omit<MedicalRecord, 'id' | 'created_at' | 'updated_at'>) =>
      createMedicalRecord(data),
    ...getMutationOptions<MedicalRecord, Error>({
      onSuccess: (newRecord) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.medicalRecords.all })
        // Also invalidate unsigned records count
        queryClient.invalidateQueries({ queryKey: ['medical-records-unsigned-count'] })
        toast({
          title: 'Sucesso',
          description: 'Prontuário criado com sucesso'
        })
      },
      onError: (error: any) => {
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao criar prontuário',
          variant: 'destructive'
        })
      }
    })
  })
}

/**
 * Hook to update medical record
 */
export function useUpdateMedicalRecord(recordId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (data: Partial<Omit<MedicalRecord, 'id' | 'created_at' | 'updated_at'>>) =>
      updateMedicalRecord(recordId, data),
    ...getMutationOptions<MedicalRecord, Error>({
      onSuccess: (updatedRecord) => {
        queryClient.setQueryData(
          queryKeys.medicalRecords.detail(recordId),
          updatedRecord
        )
        queryClient.invalidateQueries({ queryKey: queryKeys.medicalRecords.all })
        toast({
          title: 'Sucesso',
          description: 'Prontuário atualizado'
        })
      },
      onError: (error: any) => {
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao atualizar prontuário',
          variant: 'destructive'
        })
      }
    })
  })
}

/**
 * Hook to delete medical record
 */
export function useDeleteMedicalRecord() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (recordId: string) => deleteMedicalRecord(recordId),
    ...getMutationOptions<void, Error>({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.medicalRecords.all })
        toast({
          title: 'Sucesso',
          description: 'Prontuário removido'
        })
      },
      onError: (error: any) => {
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao remover prontuário',
          variant: 'destructive'
        })
      }
    })
  })
}

/**
 * Hook to sign medical record
 */
export function useSignMedicalRecord() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({
      recordId,
      userId
    }: {
      recordId: string
      userId: string
    }) => signMedicalRecord(recordId, userId),
    ...getMutationOptions<MedicalRecord, Error>({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.medicalRecords.all })
        queryClient.invalidateQueries({ queryKey: ['medical-records-unsigned'] })
        queryClient.invalidateQueries({ queryKey: ['medical-records-unsigned-count'] })
        toast({
          title: 'Sucesso',
          description: 'Prontuário assinado'
        })
      },
      onError: (error: any) => {
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao assinar prontuário',
          variant: 'destructive'
        })
      }
    })
  })
}

/**
 * Hook to update medical record content
 */
export function useUpdateMedicalRecordContent() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({
      recordId,
      contentJson
    }: {
      recordId: string
      contentJson: Record<string, any>
    }) => updateMedicalRecordContent(recordId, contentJson),
    ...getMutationOptions<MedicalRecord, Error>({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.medicalRecords.all })
        toast({
          title: 'Sucesso',
          description: 'Conteúdo atualizado'
        })
      },
      onError: (error: any) => {
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao atualizar conteúdo',
          variant: 'destructive'
        })
      }
    })
  })
}

/**
 * Hook to change medical record visibility
 */
export function useUpdateMedicalRecordVisibility() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({
      recordId,
      visibility
    }: {
      recordId: string
      visibility: 'private' | 'team'
    }) => updateMedicalRecordVisibility(recordId, visibility),
    ...getMutationOptions<MedicalRecord, Error>({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.medicalRecords.all })
        toast({
          title: 'Sucesso',
          description: 'Visibilidade atualizada'
        })
      },
      onError: (error: any) => {
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao atualizar visibilidade',
          variant: 'destructive'
        })
      }
    })
  })
}

/**
 * Hook to bulk update medical record visibility
 */
export function useBulkUpdateMedicalRecordVisibility() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({
      recordIds,
      visibility
    }: {
      recordIds: string[]
      visibility: 'private' | 'team'
    }) => bulkUpdateMedicalRecordVisibility(recordIds, visibility),
    ...getMutationOptions<void, Error>({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.medicalRecords.all })
        toast({
          title: 'Sucesso',
          description: 'Prontuários atualizados'
        })
      },
      onError: (error: any) => {
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao atualizar prontuários',
          variant: 'destructive'
        })
      }
    })
  })
}

/**
 * Hook to bulk sign medical records
 */
export function useBulkSignMedicalRecords() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({
      recordIds,
      userId
    }: {
      recordIds: string[]
      userId: string
    }) => bulkSignMedicalRecords(recordIds, userId),
    ...getMutationOptions<void, Error>({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.medicalRecords.all })
        queryClient.invalidateQueries({ queryKey: ['medical-records-unsigned'] })
        queryClient.invalidateQueries({ queryKey: ['medical-records-unsigned-count'] })
        toast({
          title: 'Sucesso',
          description: 'Prontuários assinados'
        })
      },
      onError: (error: any) => {
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao assinar prontuários',
          variant: 'destructive'
        })
      }
    })
  })
}
