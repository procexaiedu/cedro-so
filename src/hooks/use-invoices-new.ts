// @ts-nocheck
/**
 * CEDRO useInvoices Hooks - NEW CLEAN ARCHITECTURE
 *
 * React Query hooks for invoice management
 * Handles billing, payment tracking, and financial operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import {
  getAllInvoices,
  getInvoicesByPatient,
  getInvoicesByStatus,
  getInvoicesByTherapist,
  getInvoicesByCarePlan,
  getInvoiceById,
  getOverdueInvoices,
  getInvoicesByDateRange,
  countInvoicesByStatus,
  countOverdueInvoices,
  getFinancialSummary,
  createInvoice,
  updateInvoice,
  updateInvoiceStatus,
  markInvoiceAsPaid,
  deleteInvoice,
  bulkUpdateInvoicesStatus,
  syncInvoiceWithAsaas,
  generateInvoiceContract
} from '@/lib/api/invoices'
import { queryKeys, QUERY_OPTIONS_LIST, QUERY_OPTIONS_DETAIL, getMutationOptions } from '@/lib/api/react-query-patterns'
import type { Invoice } from '@/lib/api/types'

// ============ QUERIES ============

/**
 * Hook to fetch all invoices
 */
export function useAllInvoices() {
  return useQuery({
    queryKey: queryKeys.invoices.list(),
    queryFn: () => getAllInvoices(),
    ...QUERY_OPTIONS_LIST
  })
}

/**
 * Hook to fetch invoices by patient
 */
export function useInvoicesByPatient(patientId: string | undefined) {
  return useQuery({
    queryKey: patientId ? queryKeys.invoices.byPatient(patientId) : queryKeys.invoices.all,
    queryFn: () => {
      if (!patientId) throw new Error('Patient ID required')
      return getInvoicesByPatient(patientId)
    },
    enabled: !!patientId,
    ...QUERY_OPTIONS_LIST
  })
}

/**
 * Hook to fetch invoices by status
 */
export function useInvoicesByStatus(status: 'draft' | 'open' | 'paid' | 'partial' | 'overdue' | 'cancelled') {
  return useQuery({
    queryKey: ['invoices-status', status],
    queryFn: () => getInvoicesByStatus(status),
    ...QUERY_OPTIONS_LIST
  })
}

/**
 * Hook to fetch invoices by therapist
 */
export function useInvoicesByTherapist(therapistId: string | undefined) {
  return useQuery({
    queryKey: ['invoices-therapist', therapistId],
    queryFn: () => {
      if (!therapistId) throw new Error('Therapist ID required')
      return getInvoicesByTherapist(therapistId)
    },
    enabled: !!therapistId,
    ...QUERY_OPTIONS_LIST
  })
}

/**
 * Hook to fetch invoices by care plan
 */
export function useInvoicesByCarePlan(carePlanId: string | undefined) {
  return useQuery({
    queryKey: ['invoices-careplan', carePlanId],
    queryFn: () => {
      if (!carePlanId) throw new Error('Care Plan ID required')
      return getInvoicesByCarePlan(carePlanId)
    },
    enabled: !!carePlanId,
    ...QUERY_OPTIONS_LIST
  })
}

/**
 * Hook to fetch single invoice
 */
export function useInvoice(invoiceId: string | undefined) {
  return useQuery({
    queryKey: invoiceId ? queryKeys.invoices.detail(invoiceId) : queryKeys.invoices.all,
    queryFn: () => {
      if (!invoiceId) throw new Error('Invoice ID required')
      return getInvoiceById(invoiceId)
    },
    enabled: !!invoiceId,
    ...QUERY_OPTIONS_DETAIL
  })
}

/**
 * Hook to fetch overdue invoices
 */
export function useOverdueInvoices() {
  return useQuery({
    queryKey: ['invoices-overdue'],
    queryFn: () => getOverdueInvoices(),
    ...QUERY_OPTIONS_LIST,
    refetchInterval: 3600000 // Refetch every hour
  })
}

/**
 * Hook to fetch invoices by date range
 */
export function useInvoicesByDateRange(startDate: Date, endDate: Date) {
  return useQuery({
    queryKey: ['invoices-daterange', startDate.toISOString(), endDate.toISOString()],
    queryFn: () => getInvoicesByDateRange(startDate, endDate),
    ...QUERY_OPTIONS_LIST
  })
}

/**
 * Hook to count invoices by status
 */
export function useInvoicesCountByStatus(status: 'draft' | 'open' | 'paid' | 'partial' | 'overdue' | 'cancelled') {
  return useQuery({
    queryKey: ['invoices-count', status],
    queryFn: () => countInvoicesByStatus(status),
    ...QUERY_OPTIONS_LIST
  })
}

/**
 * Hook to count overdue invoices
 */
export function useOverdueInvoicesCount() {
  return useQuery({
    queryKey: ['invoices-overdue-count'],
    queryFn: () => countOverdueInvoices(),
    ...QUERY_OPTIONS_LIST,
    refetchInterval: 3600000 // Refetch every hour
  })
}

/**
 * Hook to get financial summary
 */
export function useFinancialSummary() {
  return useQuery({
    queryKey: ['financial-summary'],
    queryFn: () => getFinancialSummary(),
    ...QUERY_OPTIONS_LIST,
    refetchInterval: 1800000 // Refetch every 30 minutes
  })
}

// ============ MUTATIONS ============

/**
 * Hook to create invoice
 */
export function useCreateInvoice() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (data: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>) => createInvoice(data),
    ...getMutationOptions<Invoice, Error>({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all })
        queryClient.invalidateQueries({ queryKey: ['financial-summary'] })
        toast({
          title: 'Sucesso',
          description: 'Fatura criada com sucesso'
        })
      },
      onError: (error: any) => {
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao criar fatura',
          variant: 'destructive'
        })
      }
    })
  })
}

/**
 * Hook to update invoice
 */
export function useUpdateInvoice(invoiceId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (data: Partial<Omit<Invoice, 'id' | 'created_at' | 'updated_at'>>) =>
      updateInvoice(invoiceId, data),
    ...getMutationOptions<Invoice, Error>({
      onSuccess: (updatedInvoice) => {
        queryClient.setQueryData(queryKeys.invoices.detail(invoiceId), updatedInvoice)
        queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all })
        queryClient.invalidateQueries({ queryKey: ['financial-summary'] })
        toast({
          title: 'Sucesso',
          description: 'Fatura atualizada'
        })
      },
      onError: (error: any) => {
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao atualizar fatura',
          variant: 'destructive'
        })
      }
    })
  })
}

/**
 * Hook to update invoice status
 */
export function useUpdateInvoiceStatus() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({
      invoiceId,
      status
    }: {
      invoiceId: string
      status: 'draft' | 'open' | 'paid' | 'partial' | 'overdue' | 'cancelled'
    }) => updateInvoiceStatus(invoiceId, status),
    ...getMutationOptions<Invoice, Error>({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all })
        queryClient.invalidateQueries({ queryKey: ['financial-summary'] })
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
 * Hook to mark invoice as paid
 */
export function useMarkInvoiceAsPaid() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (invoiceId: string) => markInvoiceAsPaid(invoiceId),
    ...getMutationOptions<Invoice, Error>({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all })
        queryClient.invalidateQueries({ queryKey: ['financial-summary'] })
        queryClient.invalidateQueries({ queryKey: ['invoices-overdue'] })
        toast({
          title: 'Sucesso',
          description: 'Fatura marcada como paga'
        })
      },
      onError: (error: any) => {
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao marcar como paga',
          variant: 'destructive'
        })
      }
    })
  })
}

/**
 * Hook to delete invoice
 */
export function useDeleteInvoice() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (invoiceId: string) => deleteInvoice(invoiceId),
    ...getMutationOptions<void, Error>({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all })
        queryClient.invalidateQueries({ queryKey: ['financial-summary'] })
        toast({
          title: 'Sucesso',
          description: 'Fatura removida'
        })
      },
      onError: (error: any) => {
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao remover fatura',
          variant: 'destructive'
        })
      }
    })
  })
}

/**
 * Hook to bulk update invoices status
 */
export function useBulkUpdateInvoicesStatus() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({
      invoiceIds,
      status
    }: {
      invoiceIds: string[]
      status: 'draft' | 'open' | 'paid' | 'partial' | 'overdue' | 'cancelled'
    }) => bulkUpdateInvoicesStatus(invoiceIds, status),
    ...getMutationOptions<void, Error>({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all })
        queryClient.invalidateQueries({ queryKey: ['financial-summary'] })
        toast({
          title: 'Sucesso',
          description: 'Faturas atualizadas'
        })
      },
      onError: (error: any) => {
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao atualizar faturas',
          variant: 'destructive'
        })
      }
    })
  })
}

/**
 * Hook to sync invoice with Asaas payment processor
 */
export function useSyncInvoiceWithAsaas() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({
      invoiceId,
      asaasInvoiceId,
      asaasCustomerId
    }: {
      invoiceId: string
      asaasInvoiceId: string
      asaasCustomerId: string
    }) => syncInvoiceWithAsaas(invoiceId, asaasInvoiceId, asaasCustomerId),
    ...getMutationOptions<Invoice, Error>({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all })
        toast({
          title: 'Sucesso',
          description: 'Fatura sincronizada com Asaas'
        })
      },
      onError: (error: any) => {
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao sincronizar com Asaas',
          variant: 'destructive'
        })
      }
    })
  })
}

/**
 * Hook to generate invoice contract
 */
export function useGenerateInvoiceContract() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({
      invoiceId,
      contractId,
      googleDocsId
    }: {
      invoiceId: string
      contractId: string
      googleDocsId: string
    }) => generateInvoiceContract(invoiceId, contractId, googleDocsId),
    ...getMutationOptions<Invoice, Error>({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all })
        toast({
          title: 'Sucesso',
          description: 'Contrato gerado com sucesso'
        })
      },
      onError: (error: any) => {
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao gerar contrato',
          variant: 'destructive'
        })
      }
    })
  })
}
