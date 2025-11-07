// @ts-nocheck
/**
 * CEDRO useCarePlans Hooks - NEW CLEAN ARCHITECTURE
 *
 * React Query hooks for care plan management
 * Handles patient treatment plans and session tracking
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import {
  getAllCarePlans,
  getCarePlansByPatient,
  getActiveCarePlansByPatient,
  getCarePlansByTherapist,
  getCarePlansByStatus,
  getCarePlanById,
  countCarePlansByPatient,
  countActiveCarePlans,
  getCarePlansNeedingSessions,
  getCarePlanSummaryByPatient,
  createCarePlan,
  updateCarePlan,
  consumeSessionFromCarePlan,
  updateCarePlanStatus,
  deleteCarePlan,
  bulkUpdateCarePlansStatus
} from '@/lib/api/care-plans'
import { queryKeys, QUERY_OPTIONS_LIST, QUERY_OPTIONS_DETAIL, getMutationOptions } from '@/lib/api/react-query-patterns'
import type { CarePlan } from '@/lib/api/types'

// ============ QUERIES ============

/**
 * Hook to fetch all care plans
 */
export function useAllCarePlans() {
  return useQuery({
    queryKey: queryKeys.carePlans.all,
    queryFn: () => getAllCarePlans(),
    ...QUERY_OPTIONS_LIST
  })
}

/**
 * Hook to fetch care plans by patient
 */
export function useCarePlansByPatient(patientId: string | undefined) {
  return useQuery({
    queryKey: patientId ? queryKeys.carePlans.byPatient(patientId) : queryKeys.carePlans.all,
    queryFn: () => {
      if (!patientId) throw new Error('Patient ID required')
      return getCarePlansByPatient(patientId)
    },
    enabled: !!patientId,
    ...QUERY_OPTIONS_LIST
  })
}

/**
 * Hook to fetch active care plans by patient
 */
export function useActiveCarePlansByPatient(patientId: string | undefined) {
  return useQuery({
    queryKey: ['care-plans-active', patientId],
    queryFn: () => {
      if (!patientId) throw new Error('Patient ID required')
      return getActiveCarePlansByPatient(patientId)
    },
    enabled: !!patientId,
    ...QUERY_OPTIONS_LIST
  })
}

/**
 * Hook to fetch care plans by therapist
 */
export function useCarePlansByTherapist(therapistId: string | undefined) {
  return useQuery({
    queryKey: ['care-plans-therapist', therapistId],
    queryFn: () => {
      if (!therapistId) throw new Error('Therapist ID required')
      return getCarePlansByTherapist(therapistId)
    },
    enabled: !!therapistId,
    ...QUERY_OPTIONS_LIST
  })
}

/**
 * Hook to fetch care plans by status
 */
export function useCarePlansByStatus(status: 'active' | 'paused' | 'ended') {
  return useQuery({
    queryKey: ['care-plans-status', status],
    queryFn: () => getCarePlansByStatus(status),
    ...QUERY_OPTIONS_LIST
  })
}

/**
 * Hook to fetch single care plan
 */
export function useCarePlan(planId: string | undefined) {
  return useQuery({
    queryKey: planId ? queryKeys.carePlans.detail(planId) : queryKeys.carePlans.all,
    queryFn: () => {
      if (!planId) throw new Error('Plan ID required')
      return getCarePlanById(planId)
    },
    enabled: !!planId,
    ...QUERY_OPTIONS_DETAIL
  })
}

/**
 * Hook to count care plans by patient
 */
export function useCarePlansCountByPatient(patientId: string) {
  return useQuery({
    queryKey: ['care-plans-count', patientId],
    queryFn: () => countCarePlansByPatient(patientId),
    ...QUERY_OPTIONS_LIST
  })
}

/**
 * Hook to count active care plans
 */
export function useActiveCarePlansCount() {
  return useQuery({
    queryKey: ['care-plans-count-active'],
    queryFn: () => countActiveCarePlans(),
    ...QUERY_OPTIONS_LIST
  })
}

/**
 * Hook to fetch care plans needing sessions
 */
export function useCarePlansNeedingSessions() {
  return useQuery({
    queryKey: ['care-plans-needing-sessions'],
    queryFn: () => getCarePlansNeedingSessions(),
    ...QUERY_OPTIONS_LIST,
    refetchInterval: 300000 // Refetch every 5 minutes
  })
}

/**
 * Hook to fetch care plan summary for patient
 */
export function useCarePlanSummaryByPatient(patientId: string | undefined) {
  return useQuery({
    queryKey: ['care-plan-summary', patientId],
    queryFn: () => {
      if (!patientId) throw new Error('Patient ID required')
      return getCarePlanSummaryByPatient(patientId)
    },
    enabled: !!patientId,
    ...QUERY_OPTIONS_LIST
  })
}

// ============ MUTATIONS ============

/**
 * Hook to create care plan
 */
export function useCreateCarePlan() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (data: Omit<CarePlan, 'id' | 'created_at' | 'updated_at'>) => createCarePlan(data),
    ...getMutationOptions<CarePlan, Error>({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.carePlans.all })
        queryClient.invalidateQueries({ queryKey: ['care-plans-needing-sessions'] })
        toast({
          title: 'Sucesso',
          description: 'Plano de cuidado criado com sucesso'
        })
      },
      onError: (error: any) => {
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao criar plano de cuidado',
          variant: 'destructive'
        })
      }
    })
  })
}

/**
 * Hook to update care plan
 */
export function useUpdateCarePlan(planId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (data: Partial<Omit<CarePlan, 'id' | 'created_at' | 'updated_at'>>) =>
      updateCarePlan(planId, data),
    ...getMutationOptions<CarePlan, Error>({
      onSuccess: (updatedPlan) => {
        queryClient.setQueryData(queryKeys.carePlans.detail(planId), updatedPlan)
        queryClient.invalidateQueries({ queryKey: queryKeys.carePlans.all })
        toast({
          title: 'Sucesso',
          description: 'Plano de cuidado atualizado'
        })
      },
      onError: (error: any) => {
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao atualizar plano de cuidado',
          variant: 'destructive'
        })
      }
    })
  })
}

/**
 * Hook to consume a session from care plan
 */
export function useConsumeSessionFromCarePlan() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (planId: string) => consumeSessionFromCarePlan(planId),
    ...getMutationOptions<CarePlan, Error>({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.carePlans.all })
        queryClient.invalidateQueries({ queryKey: ['care-plans-needing-sessions'] })
        toast({
          title: 'Sucesso',
          description: 'Sessão contabilizada'
        })
      },
      onError: (error: any) => {
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao usar sessão',
          variant: 'destructive'
        })
      }
    })
  })
}

/**
 * Hook to update care plan status
 */
export function useUpdateCarePlanStatus() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({
      planId,
      status
    }: {
      planId: string
      status: 'active' | 'paused' | 'ended'
    }) => updateCarePlanStatus(planId, status),
    ...getMutationOptions<CarePlan, Error>({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.carePlans.all })
        queryClient.invalidateQueries({ queryKey: ['care-plans-needing-sessions'] })
        toast({
          title: 'Sucesso',
          description: 'Status atualizado'
        })
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
 * Hook to delete care plan
 */
export function useDeleteCarePlan() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (planId: string) => deleteCarePlan(planId),
    ...getMutationOptions<void, Error>({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.carePlans.all })
        queryClient.invalidateQueries({ queryKey: ['care-plans-needing-sessions'] })
        toast({
          title: 'Sucesso',
          description: 'Plano de cuidado removido'
        })
      },
      onError: (error: any) => {
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao remover plano de cuidado',
          variant: 'destructive'
        })
      }
    })
  })
}

/**
 * Hook to bulk update care plans status
 */
export function useBulkUpdateCarePlansStatus() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({
      planIds,
      status
    }: {
      planIds: string[]
      status: 'active' | 'paused' | 'ended'
    }) => bulkUpdateCarePlansStatus(planIds, status),
    ...getMutationOptions<void, Error>({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.carePlans.all })
        queryClient.invalidateQueries({ queryKey: ['care-plans-needing-sessions'] })
        toast({
          title: 'Sucesso',
          description: 'Planos atualizados'
        })
      },
      onError: (error: any) => {
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao atualizar planos',
          variant: 'destructive'
        })
      }
    })
  })
}
