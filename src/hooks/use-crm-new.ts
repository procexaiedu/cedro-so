/**
 * CEDRO useCrm Hooks - NEW CLEAN ARCHITECTURE
 *
 * React Query hooks for CRM lead management
 * Handles lead funnel progression and analytics
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import {
  getAllCrmLeads,
  getCrmLeadsByStage,
  getCrmLeadsBySource,
  getCrmLeadsByCity,
  getCrmLeadById,
  searchCrmLeadsByName,
  countCrmLeadsByStage,
  countAllCrmLeads,
  getCrmLeadsPaginated,
  createCrmLead,
  updateCrmLead,
  updateCrmLeadStage,
  deleteCrmLead,
  bulkUpdateCrmLeadsStage,
  getCrmFunnelSummary
} from '@/lib/api/crm'
import { queryKeys, QUERY_OPTIONS_LIST, QUERY_OPTIONS_DETAIL, getMutationOptions } from '@/lib/api/react-query-patterns'
import type { CrmLead } from '@/lib/api/types'

// ============ QUERIES ============

/**
 * Hook to fetch all CRM leads
 */
export function useAllCrmLeads() {
  return useQuery({
    queryKey: queryKeys.crm.all,
    queryFn: () => getAllCrmLeads(),
    ...QUERY_OPTIONS_LIST
  })
}

/**
 * Hook to fetch CRM leads by stage
 */
export function useCrmLeadsByStage(stage: 'lead' | 'mql' | 'sql' | 'won' | 'lost') {
  return useQuery({
    queryKey: ['crm-leads-stage', stage],
    queryFn: () => getCrmLeadsByStage(stage),
    ...QUERY_OPTIONS_LIST
  })
}

/**
 * Hook to fetch CRM leads by source
 */
export function useCrmLeadsBySource(source: string | undefined) {
  return useQuery({
    queryKey: ['crm-leads-source', source],
    queryFn: () => {
      if (!source) throw new Error('Source required')
      return getCrmLeadsBySource(source)
    },
    enabled: !!source,
    ...QUERY_OPTIONS_LIST
  })
}

/**
 * Hook to fetch CRM leads by city/UF
 */
export function useCrmLeadsByCity(cityUf: string | undefined) {
  return useQuery({
    queryKey: ['crm-leads-city', cityUf],
    queryFn: () => {
      if (!cityUf) throw new Error('City/UF required')
      return getCrmLeadsByCity(cityUf)
    },
    enabled: !!cityUf,
    ...QUERY_OPTIONS_LIST
  })
}

/**
 * Hook to fetch single CRM lead
 */
export function useCrmLead(leadId: string | undefined) {
  return useQuery({
    queryKey: ['crm-lead', leadId],
    queryFn: () => {
      if (!leadId) throw new Error('Lead ID required')
      return getCrmLeadById(leadId)
    },
    enabled: !!leadId,
    ...QUERY_OPTIONS_DETAIL
  })
}

/**
 * Hook to search CRM leads by name
 */
export function useSearchCrmLeads(searchTerm: string | undefined) {
  return useQuery({
    queryKey: ['crm-leads-search', searchTerm],
    queryFn: () => {
      if (!searchTerm) throw new Error('Search term required')
      return searchCrmLeadsByName(searchTerm)
    },
    enabled: !!searchTerm && searchTerm.length > 0,
    ...QUERY_OPTIONS_LIST
  })
}

/**
 * Hook to count CRM leads by stage
 */
export function useCrmLeadsCountByStage(stage: 'lead' | 'mql' | 'sql' | 'won' | 'lost') {
  return useQuery({
    queryKey: ['crm-leads-count', stage],
    queryFn: () => countCrmLeadsByStage(stage),
    ...QUERY_OPTIONS_LIST
  })
}

/**
 * Hook to count all CRM leads
 */
export function useAllCrmLeadsCount() {
  return useQuery({
    queryKey: ['crm-leads-count-all'],
    queryFn: () => countAllCrmLeads(),
    ...QUERY_OPTIONS_LIST
  })
}

/**
 * Hook to fetch paginated CRM leads
 */
export function usePaginatedCrmLeads(page: number = 1, limit: number = 20) {
  return useQuery({
    queryKey: ['crm-leads-paginated', page, limit],
    queryFn: () => getCrmLeadsPaginated(page, limit),
    ...QUERY_OPTIONS_LIST
  })
}

/**
 * Hook to fetch CRM funnel summary
 */
export function useCrmFunnelSummary() {
  return useQuery({
    queryKey: ['crm-funnel-summary'],
    queryFn: () => getCrmFunnelSummary(),
    ...QUERY_OPTIONS_LIST,
    refetchInterval: 60000 // Refetch every 60 seconds for dashboard
  })
}

// ============ MUTATIONS ============

/**
 * Hook to create CRM lead
 */
export function useCreateCrmLead() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (data: Omit<CrmLead, 'id' | 'created_at' | 'updated_at'>) => createCrmLead(data),
    ...getMutationOptions<CrmLead, Error>({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.crm.all })
        queryClient.invalidateQueries({ queryKey: ['crm-funnel-summary'] })
        toast({
          title: 'Sucesso',
          description: 'Lead criado com sucesso'
        })
      },
      onError: (error: any) => {
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao criar lead',
          variant: 'destructive'
        })
      }
    })
  })
}

/**
 * Hook to update CRM lead
 */
export function useUpdateCrmLead(leadId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (data: Partial<Omit<CrmLead, 'id' | 'created_at' | 'updated_at'>>) => updateCrmLead(leadId, data),
    ...getMutationOptions<CrmLead, Error>({
      onSuccess: (updatedLead) => {
        queryClient.setQueryData(['crm-lead', leadId], updatedLead)
        queryClient.invalidateQueries({ queryKey: queryKeys.crm.all })
        toast({
          title: 'Sucesso',
          description: 'Lead atualizado'
        })
      },
      onError: (error: any) => {
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao atualizar lead',
          variant: 'destructive'
        })
      }
    })
  })
}

/**
 * Hook to update CRM lead stage
 */
export function useUpdateCrmLeadStage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({
      leadId,
      stage
    }: {
      leadId: string
      stage: 'lead' | 'mql' | 'sql' | 'won' | 'lost'
    }) => updateCrmLeadStage(leadId, stage),
    ...getMutationOptions<CrmLead, Error>({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.crm.all })
        queryClient.invalidateQueries({ queryKey: ['crm-funnel-summary'] })
        toast({
          title: 'Sucesso',
          description: 'Estágio atualizado'
        })
      },
      onError: (error: any) => {
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao atualizar estágio',
          variant: 'destructive'
        })
      }
    })
  })
}

/**
 * Hook to delete CRM lead
 */
export function useDeleteCrmLead() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (leadId: string) => deleteCrmLead(leadId),
    ...getMutationOptions<void, Error>({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.crm.all })
        queryClient.invalidateQueries({ queryKey: ['crm-funnel-summary'] })
        toast({
          title: 'Sucesso',
          description: 'Lead removido'
        })
      },
      onError: (error: any) => {
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao remover lead',
          variant: 'destructive'
        })
      }
    })
  })
}

/**
 * Hook to bulk update CRM leads stage
 */
export function useBulkUpdateCrmLeadsStage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({
      leadIds,
      stage
    }: {
      leadIds: string[]
      stage: 'lead' | 'mql' | 'sql' | 'won' | 'lost'
    }) => bulkUpdateCrmLeadsStage(leadIds, stage),
    ...getMutationOptions<void, Error>({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.crm.all })
        queryClient.invalidateQueries({ queryKey: ['crm-funnel-summary'] })
        toast({
          title: 'Sucesso',
          description: 'Leads atualizados'
        })
      },
      onError: (error: any) => {
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao atualizar leads',
          variant: 'destructive'
        })
      }
    })
  })
}
