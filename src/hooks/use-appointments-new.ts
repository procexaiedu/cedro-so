// @ts-nocheck
/**
 * CEDRO useAppointments Hooks - NEW CLEAN ARCHITECTURE
 *
 * React Query hooks for appointment management
 * Handles all appointment data fetching and mutations with proper caching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import {
  getAllAppointments,
  getAppointmentsByTherapistAndDate,
  getAppointmentsByPatient,
  getAppointmentsByDateRange,
  getAppointmentById,
  getAppointmentsByStatus,
  countAppointmentsForDay,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  rescheduleAppointment,
  updateAppointmentStatus,
  bulkUpdateAppointmentStatus,
  addMeetingLink
} from '@/lib/api/appointments'
import { queryKeys, QUERY_OPTIONS_LIST, QUERY_OPTIONS_DETAIL, getMutationOptions } from '@/lib/api/react-query-patterns'
import type { Appointment } from '@/lib/api/types'

// ============ QUERIES ============

/**
 * Hook to fetch all appointments
 * Use for admin views
 */
export function useAllAppointments() {
  return useQuery({
    queryKey: queryKeys.appointments.list(),
    queryFn: () => getAllAppointments(),
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: true
  })
}

/**
 * Hook to fetch appointments by therapist and date range
 * Main hook for agenda/schedule views
 */
export function useAppointmentsByTherapistAndDate(
  therapistId: string | undefined,
  startDate: Date,
  endDate: Date
) {
  return useQuery({
    queryKey: queryKeys.appointments.listByTherapist(
      therapistId || '',
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    ),
    queryFn: () => {
      if (!therapistId) throw new Error('Therapist ID required')
      return getAppointmentsByTherapistAndDate(therapistId, startDate, endDate)
    },
    enabled: !!therapistId,
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: true
  })
}

/**
 * Hook to fetch appointments by patient
 */
export function useAppointmentsByPatient(patientId: string | undefined) {
  return useQuery({
    queryKey: patientId
      ? ['appointments-patient', patientId]
      : queryKeys.appointments.all,
    queryFn: () => {
      if (!patientId) throw new Error('Patient ID required')
      return getAppointmentsByPatient(patientId)
    },
    enabled: !!patientId,
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: true
  })
}

/**
 * Hook to fetch appointments by date range (all therapists)
 */
export function useAppointmentsByDateRange(startDate: Date, endDate: Date) {
  return useQuery({
    queryKey: queryKeys.appointments.listByDate(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    ),
    queryFn: () => getAppointmentsByDateRange(startDate, endDate),
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: true
  })
}

/**
 * Hook to fetch single appointment details
 */
export function useAppointment(appointmentId: string | undefined) {
  return useQuery({
    queryKey: appointmentId
      ? queryKeys.appointments.detail(appointmentId)
      : queryKeys.appointments.all,
    queryFn: () => {
      if (!appointmentId) throw new Error('Appointment ID required')
      return getAppointmentById(appointmentId)
    },
    enabled: !!appointmentId,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false
  })
}

/**
 * Hook to fetch appointments by status
 */
export function useAppointmentsByStatus(status: Appointment['status']) {
  return useQuery({
    queryKey: ['appointments-status', status],
    queryFn: () => getAppointmentsByStatus(status),
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: true
  })
}

/**
 * Hook to count appointments for a specific day
 */
export function useAppointmentCountForDay(therapistId: string, date: Date) {
  return useQuery({
    queryKey: ['appointments-count-day', therapistId, date.toISOString().split('T')[0]],
    queryFn: () => countAppointmentsForDay(therapistId, date),
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: true
  })
}

// ============ MUTATIONS ============

/**
 * Hook to create new appointment
 */
export function useCreateAppointment() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (data: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>) =>
      createAppointment(data),
    ...getMutationOptions<Appointment, Error>({
      onSuccess: (newAppointment) => {
        // Invalidate all appointment queries
        queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all })
        toast({
          title: 'Sucesso',
          description: 'Agendamento criado com sucesso'
        })
      },
      onError: (error: any) => {
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao criar agendamento',
          variant: 'destructive'
        })
      }
    })
  })
}

/**
 * Hook to update appointment
 */
export function useUpdateAppointment(appointmentId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (data: Partial<Omit<Appointment, 'id' | 'created_at' | 'updated_at'>>) =>
      updateAppointment(appointmentId, data),
    ...getMutationOptions<Appointment, Error>({
      onSuccess: (updatedAppointment) => {
        // Update detail cache
        queryClient.setQueryData(
          queryKeys.appointments.detail(appointmentId),
          updatedAppointment
        )
        // Invalidate list queries
        queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all })
        toast({
          title: 'Sucesso',
          description: 'Agendamento atualizado com sucesso'
        })
      },
      onError: (error: any) => {
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao atualizar agendamento',
          variant: 'destructive'
        })
      }
    })
  })
}

/**
 * Hook to delete appointment
 */
export function useDeleteAppointment() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (appointmentId: string) => deleteAppointment(appointmentId),
    ...getMutationOptions<void, Error>({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all })
        toast({
          title: 'Sucesso',
          description: 'Agendamento removido com sucesso'
        })
      },
      onError: (error: any) => {
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao remover agendamento',
          variant: 'destructive'
        })
      }
    })
  })
}

/**
 * Hook to reschedule appointment
 */
export function useRescheduleAppointment() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({
      appointmentId,
      startAt,
      endAt
    }: {
      appointmentId: string
      startAt: string
      endAt: string
    }) => rescheduleAppointment(appointmentId, startAt, endAt),
    ...getMutationOptions<Appointment, Error>({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all })
        toast({
          title: 'Sucesso',
          description: 'Agendamento reagendado com sucesso'
        })
      },
      onError: (error: any) => {
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao reagendar',
          variant: 'destructive'
        })
      }
    })
  })
}

/**
 * Hook to update appointment status
 */
export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({
      appointmentId,
      status
    }: {
      appointmentId: string
      status: Appointment['status']
    }) => updateAppointmentStatus(appointmentId, status),
    ...getMutationOptions<Appointment, Error>({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all })
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
 * Hook to bulk update appointment status
 */
export function useBulkUpdateAppointmentStatus() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({
      appointmentIds,
      status
    }: {
      appointmentIds: string[]
      status: Appointment['status']
    }) => bulkUpdateAppointmentStatus(appointmentIds, status),
    ...getMutationOptions<void, Error>({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all })
        toast({
          title: 'Sucesso',
          description: 'Agendamentos atualizados'
        })
      },
      onError: (error: any) => {
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao atualizar agendamentos',
          variant: 'destructive'
        })
      }
    })
  })
}

/**
 * Hook to add meeting link to appointment
 */
export function useAddMeetingLink() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({
      appointmentId,
      meetLink
    }: {
      appointmentId: string
      meetLink: string
    }) => addMeetingLink(appointmentId, meetLink),
    ...getMutationOptions<Appointment, Error>({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all })
        toast({
          title: 'Sucesso',
          description: 'Link de reunião adicionado'
        })
      },
      onError: (error: any) => {
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao adicionar link',
          variant: 'destructive'
        })
      }
    })
  })
}
