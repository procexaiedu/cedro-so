/**
 * CEDRO React Query Patterns
 * Standardized patterns for queries and mutations across the application
 */

import { UseQueryOptions, UseMutationOptions } from '@tanstack/react-query'
import type { ApiError } from './types'

// ============ QUERY OPTIONS ============

/**
 * Standard query options for list queries (frequently changing data)
 * - Low stale time (1 min)
 * - Quick refetch on mount if stale
 * - Aggressive cache clearing
 */
export const QUERY_OPTIONS_LIST: UseQueryOptions = {
  staleTime: 1 * 60 * 1000, // 1 minute
  gcTime: 5 * 60 * 1000, // 5 minutes (garbage collection)
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
  refetchOnMount: 'stale', // Refetch if stale on mount
  retry: (failureCount, error) => {
    const apiError = error as ApiError
    // Don't retry 4xx errors (client errors like 403, 404)
    if (apiError.status >= 400 && apiError.status < 500) {
      return false
    }
    // Retry 5xx and network errors up to 2 times
    return failureCount < 2
  }
}

/**
 * Standard query options for static/reference data (users, services, etc)
 * - Higher stale time (15 min)
 * - Longer cache
 * - Less refetching
 */
export const QUERY_OPTIONS_STATIC: UseQueryOptions = {
  staleTime: 15 * 60 * 1000, // 15 minutes
  gcTime: 30 * 60 * 1000, // 30 minutes
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  refetchOnMount: false,
  retry: (failureCount, error) => {
    const apiError = error as ApiError
    if (apiError.status >= 400 && apiError.status < 500) {
      return false
    }
    return failureCount < 1
  }
}

/**
 * Standard query options for detail views (single record)
 * - Medium stale time (5 min)
 * - Medium cache
 * - Refetch on demand
 */
export const QUERY_OPTIONS_DETAIL: UseQueryOptions = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 15 * 60 * 1000, // 15 minutes
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
  refetchOnMount: false,
  retry: (failureCount, error) => {
    const apiError = error as ApiError
    if (apiError.status >= 400 && apiError.status < 500) {
      return false
    }
    return failureCount < 2
  }
}

// ============ MUTATION OPTIONS ============

/**
 * Standard mutation options for create/update/delete
 * - No retry on failure (user should see error immediately)
 * - Invalidate related queries on success
 * - Show toast feedback
 */
export function getMutationOptions<TData, TError>(options?: Partial<UseMutationOptions<TData, TError, any>>): UseMutationOptions<TData, TError, any> {
  return {
    retry: false, // Don't retry mutations
    ...options
  }
}

// ============ QUERY KEY FACTORY ============

/**
 * Standardized query key patterns
 * Makes cache invalidation predictable and type-safe
 */
export const queryKeys = {
  // Users
  users: {
    all: ['users'] as const,
    list: () => [...queryKeys.users.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.users.all, 'detail', id] as const,
    therapists: () => [...queryKeys.users.all, 'therapists'] as const
  },

  // Patients
  patients: {
    all: ['patients'] as const,
    list: () => [...queryKeys.patients.all, 'list'] as const,
    listFiltered: (filters: Record<string, any>) => [...queryKeys.patients.list(), filters] as const,
    detail: (id: string) => [...queryKeys.patients.all, 'detail', id] as const,
    byTherapist: (therapistId: string) => [...queryKeys.patients.all, 'byTherapist', therapistId] as const
  },

  // Appointments
  appointments: {
    all: ['appointments'] as const,
    list: () => [...queryKeys.appointments.all, 'list'] as const,
    listByDate: (startDate: string, endDate: string) => [...queryKeys.appointments.list(), { startDate, endDate }] as const,
    listByTherapist: (therapistId: string, startDate: string, endDate: string) => [...queryKeys.appointments.list(), { therapistId, startDate, endDate }] as const,
    detail: (id: string) => [...queryKeys.appointments.all, 'detail', id] as const
  },

  // Medical Records
  medicalRecords: {
    all: ['medicalRecords'] as const,
    list: () => [...queryKeys.medicalRecords.all, 'list'] as const,
    byPatient: (patientId: string) => [...queryKeys.medicalRecords.all, 'byPatient', patientId] as const,
    detail: (id: string) => [...queryKeys.medicalRecords.all, 'detail', id] as const
  },

  // Schedules
  schedules: {
    all: ['schedules'] as const,
    byTherapist: (therapistId: string) => [...queryKeys.schedules.all, 'byTherapist', therapistId] as const,
    exceptions: (therapistId: string) => [...queryKeys.schedules.all, 'exceptions', therapistId] as const
  },

  // Services
  services: {
    all: ['services'] as const,
    list: () => [...queryKeys.services.all, 'list'] as const
  },

  // CRM Leads
  leads: {
    all: ['leads'] as const,
    list: () => [...queryKeys.leads.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.leads.all, 'detail', id] as const
  },

  // CRM (new clean architecture)
  crm: {
    all: ['crm'] as const,
    list: () => [...queryKeys.crm.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.crm.all, 'detail', id] as const,
    byStage: (stage: string) => [...queryKeys.crm.all, 'byStage', stage] as const
  },

  // Care Plans
  carePlans: {
    all: ['carePlans'] as const,
    byPatient: (patientId: string) => [...queryKeys.carePlans.all, 'byPatient', patientId] as const,
    detail: (id: string) => [...queryKeys.carePlans.all, 'detail', id] as const
  },

  // Recording Jobs
  recordingJobs: {
    all: ['recordingJobs'] as const,
    list: () => [...queryKeys.recordingJobs.all, 'list'] as const,
    byPatient: (patientId: string) => [...queryKeys.recordingJobs.all, 'byPatient', patientId] as const,
    byStatus: (status: string) => [...queryKeys.recordingJobs.all, 'byStatus', status] as const,
    detail: (id: string) => [...queryKeys.recordingJobs.all, 'detail', id] as const
  },

  // Invoices
  invoices: {
    all: ['invoices'] as const,
    list: () => [...queryKeys.invoices.all, 'list'] as const,
    byPatient: (patientId: string) => [...queryKeys.invoices.all, 'byPatient', patientId] as const,
    detail: (id: string) => [...queryKeys.invoices.all, 'detail', id] as const
  }
}

// ============ INVALIDATION HELPERS ============

/**
 * Invalidation patterns to use with onSuccess callbacks
 * Automatically invalidates related queries when mutations succeed
 */
export const invalidationPatterns = {
  // When patient is modified, invalidate:
  // - Patient list
  // - Patient detail
  // - Appointments list (patient name may show)
  // - Medical records (associated with patient)
  patient: (queryClient: any, patientId?: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.patients.all })
    if (patientId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.medicalRecords.byPatient(patientId) })
    }
  },

  // When appointment is modified, invalidate:
  // - Appointment list
  // - Appointment detail
  // - Therapist schedules (may affect availability)
  appointment: (queryClient: any, _appointmentId?: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all })
  },

  // When medical record is modified, invalidate:
  // - Medical records list
  // - Medical record detail
  medicalRecord: (queryClient: any, _recordId?: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.medicalRecords.all })
  },

  // When schedule is modified, invalidate:
  // - Therapist schedules
  // - Therapist availability
  schedule: (queryClient: any, therapistId?: string) => {
    if (therapistId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.schedules.byTherapist(therapistId) })
    }
  }
}
