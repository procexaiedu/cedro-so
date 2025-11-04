/**
 * Appointments Adapter Hooks
 * Bridges old component expectations with new clean architecture
 * Provides backward-compatible hooks while using new API layer
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getAppointmentsWithDetails,
  getTherapistsList,
  getPatientsList,
  getServicesList,
  getLinkedPatientsByTherapist,
  getLinkedTherapistsByPatient,
  type AppointmentWithDetails
} from '@/lib/api/appointments-adapter'
import {
  createAppointment,
  updateAppointment,
  deleteAppointment
} from '@/lib/api/appointments'
import { useToast } from '@/hooks/use-toast'

// Re-export type for backward compatibility
export type Appointment = AppointmentWithDetails

// Query Keys (same as old interface)
export const APPOINTMENTS_QUERY_KEYS = {
  all: ['appointments'] as const,
  lists: () => [...APPOINTMENTS_QUERY_KEYS.all, 'list'] as const,
  list: (startDate: Date, endDate: Date, therapistId?: string) =>
    [...APPOINTMENTS_QUERY_KEYS.lists(), { startDate: startDate.toISOString(), endDate: endDate.toISOString(), therapistId }] as const,
  therapists: () => ['appointments', 'therapists'] as const,
  patients: () => ['appointments', 'patients'] as const,
  services: () => ['appointments', 'services'] as const,
  linkedPatients: (therapistId: string) => ['appointments', 'linked-patients', therapistId] as const,
  linkedTherapists: (patientId: string) => ['appointments', 'linked-therapists', patientId] as const,
}

/**
 * Hook to fetch appointments with all related data
 * Uses new clean architecture API but provides old interface for backward compatibility
 */
export function useAppointments(
  startDate: Date,
  endDate: Date,
  therapistId?: string
) {
  return useQuery<AppointmentWithDetails[], Error>({
    queryKey: APPOINTMENTS_QUERY_KEYS.list(startDate, endDate, therapistId),
    queryFn: () => getAppointmentsWithDetails(startDate, endDate, therapistId),
    staleTime: 1 * 60 * 1000, // 1 minute - new strategy
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: true,
    retry: (failureCount, error) => {
      // Don't retry 4xx errors
      if ((error as any).status >= 400 && (error as any).status < 500) {
        return false
      }
      return failureCount < 2
    }
  })
}

/**
 * Hook to fetch therapists
 */
export function useTherapists() {
  return useQuery<Array<{ id: string; name: string; email?: string; role: string }>, Error>({
    queryKey: APPOINTMENTS_QUERY_KEYS.therapists(),
    queryFn: () => getTherapistsList(),
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  })
}

/**
 * Hook to fetch patients for appointments
 */
export function usePatientsForAppointments() {
  return useQuery<Array<{ id: string; full_name: string; email?: string; phone?: string }>, Error>({
    queryKey: APPOINTMENTS_QUERY_KEYS.patients(),
    queryFn: () => getPatientsList(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 20 * 60 * 1000, // 20 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}

/**
 * Hook to fetch services
 */
export function useServices() {
  return useQuery<Array<{ id: string; name: string; description?: string; default_duration_min: number; base_price_cents: number; active: boolean }>, Error>({
    queryKey: APPOINTMENTS_QUERY_KEYS.services(),
    queryFn: () => getServicesList(),
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}

/**
 * Hook to fetch linked patients by therapist
 */
export function useLinkedPatients(therapistId: string | null) {
  return useQuery({
    queryKey: APPOINTMENTS_QUERY_KEYS.linkedPatients(therapistId || ''),
    queryFn: () => (therapistId ? getLinkedPatientsByTherapist(therapistId) : Promise.resolve([])),
    enabled: !!therapistId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook to fetch linked therapists by patient
 */
export function useLinkedTherapists(patientId: string | null) {
  return useQuery({
    queryKey: APPOINTMENTS_QUERY_KEYS.linkedTherapists(patientId || ''),
    queryFn: () => (patientId ? getLinkedTherapistsByPatient(patientId) : Promise.resolve([])),
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

// ============ MUTATIONS ============

/**
 * Hook to create appointment
 */
export function useCreateAppointment() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: createAppointment,
    onSuccess: () => {
      // Invalidate all appointment-related queries
      queryClient.invalidateQueries({ queryKey: APPOINTMENTS_QUERY_KEYS.all })
      queryClient.invalidateQueries({ queryKey: ['appointments', 'linked-patients'] })
      queryClient.invalidateQueries({ queryKey: ['appointments', 'linked-therapists'] })
      queryClient.invalidateQueries({ queryKey: APPOINTMENTS_QUERY_KEYS.patients() })
      queryClient.invalidateQueries({ queryKey: APPOINTMENTS_QUERY_KEYS.therapists() })

      toast({
        title: 'Sucesso',
        description: 'Agendamento criado com sucesso'
      })
    },
    onError: (error: any) => {
      console.error('Error creating appointment:', error)
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao criar agendamento',
        variant: 'destructive'
      })
    }
  })
}

/**
 * Hook to update appointment
 */
export function useUpdateAppointment() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Appointment> }) =>
      updateAppointment(id, data),
    onSuccess: () => {
      // Invalidate all appointment-related queries
      queryClient.invalidateQueries({ queryKey: APPOINTMENTS_QUERY_KEYS.all })
      queryClient.invalidateQueries({ queryKey: ['appointments', 'linked-patients'] })
      queryClient.invalidateQueries({ queryKey: ['appointments', 'linked-therapists'] })
      queryClient.invalidateQueries({ queryKey: APPOINTMENTS_QUERY_KEYS.patients() })
      queryClient.invalidateQueries({ queryKey: APPOINTMENTS_QUERY_KEYS.therapists() })

      toast({
        title: 'Sucesso',
        description: 'Agendamento atualizado com sucesso'
      })
    },
    onError: (error: any) => {
      console.error('Error updating appointment:', error)
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar agendamento',
        variant: 'destructive'
      })
    }
  })
}

/**
 * Hook to delete appointment
 */
export function useDeleteAppointment() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: deleteAppointment,
    onSuccess: () => {
      // Invalidate all appointment-related queries
      queryClient.invalidateQueries({ queryKey: APPOINTMENTS_QUERY_KEYS.all })
      queryClient.invalidateQueries({ queryKey: ['appointments', 'linked-patients'] })
      queryClient.invalidateQueries({ queryKey: ['appointments', 'linked-therapists'] })
      queryClient.invalidateQueries({ queryKey: APPOINTMENTS_QUERY_KEYS.patients() })
      queryClient.invalidateQueries({ queryKey: APPOINTMENTS_QUERY_KEYS.therapists() })

      toast({
        title: 'Sucesso',
        description: 'Agendamento removido com sucesso'
      })
    },
    onError: (error: any) => {
      console.error('Error deleting appointment:', error)
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao remover agendamento',
        variant: 'destructive'
      })
    }
  })
}
