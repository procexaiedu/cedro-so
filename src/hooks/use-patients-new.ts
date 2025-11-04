// @ts-nocheck
/**
 * CEDRO usePatients Hook - NEW CLEAN ARCHITECTURE
 *
 * This hook demonstrates proper React Query usage:
 * 1. Single useQuery call per data need (no nested queries)
 * 2. Proper error handling with fallbacks
 * 3. Loading states are managed by React Query
 * 4. No useState for data fetching
 * 5. Mutations are separate and explicit
 * 6. No race conditions or dependency loops
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import {
  getAllPatients,
  getPatientsByTherapist,
  searchPatients,
  getPatientById,
  getPatientsPaginated,
  createPatient,
  updatePatient,
  deletePatient,
  bulkUpdatePatients
} from '@/lib/api/patients'
import { queryKeys, QUERY_OPTIONS_LIST, QUERY_OPTIONS_DETAIL, getMutationOptions } from '@/lib/api/react-query-patterns'
import type { Patient, PaginatedResponse } from '@/lib/api/types'

// ============ QUERIES ============

/**
 * Hook to fetch all patients
 * Use for admin views
 */
export function useAllPatients() {
  return useQuery({
    queryKey: queryKeys.patients.list(),
    queryFn: () => getAllPatients(),
    ...QUERY_OPTIONS_LIST
  })
}

/**
 * Hook to fetch patients for current therapist
 * Use for therapist-specific views
 */
export function useMyPatients(therapistId: string | undefined) {
  return useQuery({
    queryKey: therapistId ? queryKeys.patients.byTherapist(therapistId) : queryKeys.patients.all,
    queryFn: () => {
      if (!therapistId) throw new Error('Therapist ID required')
      return getPatientsByTherapist(therapistId)
    },
    enabled: !!therapistId, // Only run when therapistId is available
    ...QUERY_OPTIONS_LIST
  })
}

/**
 * Hook to search patients by name
 * Use for search inputs
 */
export function useSearchPatients(
  searchTerm: string,
  therapistId?: string,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ['patients-search', searchTerm, therapistId],
    queryFn: () => searchPatients(searchTerm, therapistId),
    enabled: enabled && searchTerm.length > 0, // Only run when there's a search term
    ...QUERY_OPTIONS_LIST,
    staleTime: 0, // Never stale for search results
  })
}

/**
 * Hook to fetch single patient details
 * Use for detail views
 */
export function usePatient(patientId: string | undefined) {
  return useQuery({
    queryKey: patientId ? queryKeys.patients.detail(patientId) : queryKeys.patients.all,
    queryFn: () => {
      if (!patientId) throw new Error('Patient ID required')
      return getPatientById(patientId)
    },
    enabled: !!patientId, // Only run when patientId is available
    ...QUERY_OPTIONS_DETAIL
  })
}

/**
 * Hook to fetch paginated patients
 * Use for list views with pagination
 */
export function usePaginatedPatients(
  page: number = 1,
  pageSize: number = 20,
  therapistId?: string
) {
  return useQuery({
    queryKey: ['patients-paginated', page, pageSize, therapistId],
    queryFn: () => getPatientsPaginated(page, pageSize, therapistId),
    ...QUERY_OPTIONS_LIST
  })
}

// ============ MUTATIONS ============

/**
 * Hook to create a new patient
 * Usage: const { mutate, isLoading, error } = useCreatePatient()
 */
export function useCreatePatient() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (data: Omit<Patient, 'id' | 'created_at' | 'updated_at'>) =>
      createPatient(data),
    ...getMutationOptions<Patient, Error>({
      onSuccess: () => {
        // Invalidate all patient queries to refetch
        queryClient.invalidateQueries({ queryKey: queryKeys.patients.all })
        toast({
          title: 'Sucesso',
          description: 'Paciente criado com sucesso'
        })
      },
      onError: (error: any) => {
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao criar paciente',
          variant: 'destructive'
        })
      }
    })
  })
}

/**
 * Hook to update a patient
 * Usage: const { mutate, isLoading, error } = useUpdatePatient(patientId)
 */
export function useUpdatePatient(patientId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (data: Partial<Omit<Patient, 'id' | 'created_at' | 'updated_at'>>) =>
      updatePatient(patientId, data),
    ...getMutationOptions<Patient, Error>({
      onSuccess: (updatedPatient) => {
        // Update specific patient detail query
        queryClient.setQueryData(
          queryKeys.patients.detail(patientId),
          updatedPatient
        )
        // Invalidate list queries
        queryClient.invalidateQueries({ queryKey: queryKeys.patients.all })
        toast({
          title: 'Sucesso',
          description: 'Paciente atualizado com sucesso'
        })
      },
      onError: (error: any) => {
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao atualizar paciente',
          variant: 'destructive'
        })
      }
    })
  })
}

/**
 * Hook to delete a patient
 * Usage: const { mutate, isLoading, error } = useDeletePatient()
 */
export function useDeletePatient() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (patientId: string) => deletePatient(patientId),
    ...getMutationOptions<void, Error>({
      onSuccess: () => {
        // Invalidate all patient queries
        queryClient.invalidateQueries({ queryKey: queryKeys.patients.all })
        toast({
          title: 'Sucesso',
          description: 'Paciente removido com sucesso'
        })
      },
      onError: (error: any) => {
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao remover paciente',
          variant: 'destructive'
        })
      }
    })
  })
}

/**
 * Hook to bulk update patients
 * Usage: const { mutate, isLoading } = useBulkUpdatePatients()
 */
export function useBulkUpdatePatients() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({
      patientIds,
      data
    }: {
      patientIds: string[]
      data: Partial<Omit<Patient, 'id' | 'created_at' | 'updated_at'>>
    }) => bulkUpdatePatients(patientIds, data),
    ...getMutationOptions<void, Error>({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.patients.all })
        toast({
          title: 'Sucesso',
          description: 'Pacientes atualizados com sucesso'
        })
      },
      onError: (error: any) => {
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao atualizar pacientes',
          variant: 'destructive'
        })
      }
    })
  })
}
