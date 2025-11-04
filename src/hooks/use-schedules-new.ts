/**
 * CEDRO useSchedules Hooks - NEW CLEAN ARCHITECTURE
 *
 * React Query hooks for therapist schedule management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import {
  getAllTherapistSchedules,
  getTherapistSchedulesByTherapist,
  getTherapistSchedulesByWeekday,
  getTherapistScheduleById,
  getAllScheduleExceptions,
  getScheduleExceptionsByTherapist,
  getScheduleExceptionsByDateRange,
  getScheduleExceptionById,
  isTherapistAvailable,
  createTherapistSchedule,
  updateTherapistSchedule,
  deleteTherapistSchedule,
  createScheduleException,
  updateScheduleException,
  deleteScheduleException,
  bulkDeleteScheduleExceptions
} from '@/lib/api/schedules'
import { queryKeys, QUERY_OPTIONS_LIST, QUERY_OPTIONS_DETAIL, getMutationOptions } from '@/lib/api/react-query-patterns'
import type { TherapistSchedule, ScheduleException } from '@/lib/api/types'

// ============ THERAPIST SCHEDULES QUERIES ============

/**
 * Hook to fetch all therapist schedules
 */
export function useAllTherapistSchedules() {
  return useQuery({
    queryKey: queryKeys.schedules.all,
    queryFn: () => getAllTherapistSchedules(),
    ...QUERY_OPTIONS_LIST
  })
}

/**
 * Hook to fetch schedules for a therapist (grouped by weekday)
 */
export function useTherapistSchedules(therapistId: string | undefined) {
  return useQuery({
    queryKey: therapistId
      ? queryKeys.schedules.byTherapist(therapistId)
      : queryKeys.schedules.all,
    queryFn: () => {
      if (!therapistId) throw new Error('Therapist ID required')
      return getTherapistSchedulesByTherapist(therapistId)
    },
    enabled: !!therapistId,
    ...QUERY_OPTIONS_LIST
  })
}

/**
 * Hook to fetch schedules for specific weekday
 */
export function useTherapistSchedulesByWeekday(therapistId: string | undefined, weekday: number) {
  return useQuery({
    queryKey: ['therapist-schedules-weekday', therapistId, weekday],
    queryFn: () => {
      if (!therapistId) throw new Error('Therapist ID required')
      return getTherapistSchedulesByWeekday(therapistId, weekday)
    },
    enabled: !!therapistId,
    ...QUERY_OPTIONS_LIST
  })
}

/**
 * Hook to fetch single schedule
 */
export function useTherapistSchedule(scheduleId: string | undefined) {
  return useQuery({
    queryKey: ['therapist-schedule', scheduleId],
    queryFn: () => {
      if (!scheduleId) throw new Error('Schedule ID required')
      return getTherapistScheduleById(scheduleId)
    },
    enabled: !!scheduleId,
    ...QUERY_OPTIONS_DETAIL
  })
}

// ============ SCHEDULE EXCEPTIONS QUERIES ============

/**
 * Hook to fetch all schedule exceptions
 */
export function useAllScheduleExceptions() {
  return useQuery({
    queryKey: queryKeys.schedules.exceptions('all'),
    queryFn: () => getAllScheduleExceptions(),
    ...QUERY_OPTIONS_LIST
  })
}

/**
 * Hook to fetch exceptions for therapist
 */
export function useScheduleExceptionsByTherapist(therapistId: string | undefined) {
  return useQuery({
    queryKey: therapistId
      ? queryKeys.schedules.exceptions(therapistId)
      : queryKeys.schedules.all,
    queryFn: () => {
      if (!therapistId) throw new Error('Therapist ID required')
      return getScheduleExceptionsByTherapist(therapistId)
    },
    enabled: !!therapistId,
    ...QUERY_OPTIONS_LIST
  })
}

/**
 * Hook to fetch exceptions by date range
 */
export function useScheduleExceptionsByDateRange(
  therapistId: string | undefined,
  startDate: Date,
  endDate: Date
) {
  return useQuery({
    queryKey: ['schedule-exceptions-range', therapistId, startDate.toISOString(), endDate.toISOString()],
    queryFn: () => {
      if (!therapistId) throw new Error('Therapist ID required')
      return getScheduleExceptionsByDateRange(therapistId, startDate, endDate)
    },
    enabled: !!therapistId,
    ...QUERY_OPTIONS_LIST
  })
}

/**
 * Hook to fetch single exception
 */
export function useScheduleException(exceptionId: string | undefined) {
  return useQuery({
    queryKey: ['schedule-exception', exceptionId],
    queryFn: () => {
      if (!exceptionId) throw new Error('Exception ID required')
      return getScheduleExceptionById(exceptionId)
    },
    enabled: !!exceptionId,
    ...QUERY_OPTIONS_DETAIL
  })
}

/**
 * Hook to check therapist availability
 */
export function useTherapistAvailability(therapistId: string | undefined, dateTime: Date) {
  return useQuery({
    queryKey: ['therapist-availability', therapistId, dateTime.toISOString()],
    queryFn: () => {
      if (!therapistId) throw new Error('Therapist ID required')
      return isTherapistAvailable(therapistId, dateTime)
    },
    enabled: !!therapistId,
    ...QUERY_OPTIONS_LIST,
    staleTime: 1 * 60 * 1000 // 1 minute
  })
}

// ============ THERAPIST SCHEDULE MUTATIONS ============

/**
 * Hook to create therapist schedule
 */
export function useCreateTherapistSchedule() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (data: Omit<TherapistSchedule, 'id' | 'created_at' | 'updated_at'>) =>
      createTherapistSchedule(data),
    ...getMutationOptions<TherapistSchedule, Error>({
      onSuccess: (newSchedule) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.schedules.all })
        toast({
          title: 'Sucesso',
          description: 'Horário criado com sucesso'
        })
      },
      onError: (error: any) => {
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao criar horário',
          variant: 'destructive'
        })
      }
    })
  })
}

/**
 * Hook to update therapist schedule
 */
export function useUpdateTherapistSchedule(scheduleId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (data: Partial<Omit<TherapistSchedule, 'id' | 'created_at' | 'updated_at'>>) =>
      updateTherapistSchedule(scheduleId, data),
    ...getMutationOptions<TherapistSchedule, Error>({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.schedules.all })
        toast({
          title: 'Sucesso',
          description: 'Horário atualizado'
        })
      },
      onError: (error: any) => {
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao atualizar horário',
          variant: 'destructive'
        })
      }
    })
  })
}

/**
 * Hook to delete therapist schedule
 */
export function useDeleteTherapistSchedule() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (scheduleId: string) => deleteTherapistSchedule(scheduleId),
    ...getMutationOptions<void, Error>({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.schedules.all })
        toast({
          title: 'Sucesso',
          description: 'Horário removido'
        })
      },
      onError: (error: any) => {
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao remover horário',
          variant: 'destructive'
        })
      }
    })
  })
}

// ============ SCHEDULE EXCEPTION MUTATIONS ============

/**
 * Hook to create schedule exception (block or extra)
 */
export function useCreateScheduleException() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (data: Omit<ScheduleException, 'id' | 'created_at'>) =>
      createScheduleException(data),
    ...getMutationOptions<ScheduleException, Error>({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.schedules.all })
        toast({
          title: 'Sucesso',
          description: 'Exceção criada com sucesso'
        })
      },
      onError: (error: any) => {
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao criar exceção',
          variant: 'destructive'
        })
      }
    })
  })
}

/**
 * Hook to update schedule exception
 */
export function useUpdateScheduleException(exceptionId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (data: Partial<Omit<ScheduleException, 'id' | 'created_at'>>) =>
      updateScheduleException(exceptionId, data),
    ...getMutationOptions<ScheduleException, Error>({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.schedules.all })
        toast({
          title: 'Sucesso',
          description: 'Exceção atualizada'
        })
      },
      onError: (error: any) => {
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao atualizar exceção',
          variant: 'destructive'
        })
      }
    })
  })
}

/**
 * Hook to delete schedule exception
 */
export function useDeleteScheduleException() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (exceptionId: string) => deleteScheduleException(exceptionId),
    ...getMutationOptions<void, Error>({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.schedules.all })
        toast({
          title: 'Sucesso',
          description: 'Exceção removida'
        })
      },
      onError: (error: any) => {
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao remover exceção',
          variant: 'destructive'
        })
      }
    })
  })
}

/**
 * Hook to bulk delete schedule exceptions
 */
export function useBulkDeleteScheduleExceptions() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (exceptionIds: string[]) => bulkDeleteScheduleExceptions(exceptionIds),
    ...getMutationOptions<void, Error>({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.schedules.all })
        toast({
          title: 'Sucesso',
          description: 'Exceções removidas'
        })
      },
      onError: (error: any) => {
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao remover exceções',
          variant: 'destructive'
        })
      }
    })
  })
}
