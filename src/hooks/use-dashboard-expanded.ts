import { useQuery } from '@tanstack/react-query'
import type { PeriodType } from '@/components/dashboard/period-selector'
import {
  getDashboardMetricsExpanded,
  getRevenueChartData,
  getAppointmentsByTherapist,
  getCRMFunnelData,
  getPaymentStatusData,
  getOverdueInvoices,
  getUnconvertedLeads,
  getPausedPatients,
} from '@/lib/api/dashboard-expanded'

const QUERY_OPTIONS_DASHBOARD = {
  staleTime: 1000 * 60 * 5, // 5 minutos
  refetchInterval: 1000 * 60 * 10, // Refetch a cada 10 minutos
}

export function useDashboardMetrics(period: PeriodType = '30d', therapistId?: string) {
  return useQuery({
    queryKey: ['dashboard', 'metrics', period, therapistId],
    queryFn: () => getDashboardMetricsExpanded(period, therapistId),
    ...QUERY_OPTIONS_DASHBOARD,
  })
}

export function useRevenueChartData(therapistId?: string) {
  return useQuery({
    queryKey: ['dashboard', 'revenue-chart', therapistId],
    queryFn: () => getRevenueChartData(therapistId),
    staleTime: 1000 * 60 * 15, // 15 minutos
  })
}

export function useAppointmentsByTherapist(period: PeriodType = '30d') {
  return useQuery({
    queryKey: ['dashboard', 'appointments-by-therapist', period],
    queryFn: () => getAppointmentsByTherapist(period),
    staleTime: 1000 * 60 * 15,
  })
}

export function useCRMFunnel() {
  return useQuery({
    queryKey: ['dashboard', 'crm-funnel'],
    queryFn: () => getCRMFunnelData(),
    staleTime: 1000 * 60 * 15,
  })
}

export function usePaymentStatusData(therapistId?: string) {
  return useQuery({
    queryKey: ['dashboard', 'payment-status', therapistId],
    queryFn: () => getPaymentStatusData(therapistId),
    staleTime: 1000 * 60 * 15,
  })
}

export function useOverdueInvoices(limit = 10, therapistId?: string) {
  return useQuery({
    queryKey: ['dashboard', 'overdue-invoices', limit, therapistId],
    queryFn: () => getOverdueInvoices(limit, therapistId),
    staleTime: 1000 * 60 * 10,
  })
}

export function useUnconvertedLeads(limit = 10) {
  return useQuery({
    queryKey: ['dashboard', 'unconverted-leads', limit],
    queryFn: () => getUnconvertedLeads(limit),
    staleTime: 1000 * 60 * 15,
  })
}

export function usePausedPatients(therapistId?: string) {
  return useQuery({
    queryKey: ['dashboard', 'paused-patients', therapistId],
    queryFn: () => getPausedPatients(therapistId),
    staleTime: 1000 * 60 * 15,
  })
}
