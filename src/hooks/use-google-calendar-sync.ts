/**
 * React Query Hooks para Google Calendar Sync
 * Gerencia queries, mutations e cache com React Query v5
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSyncedAppointments,
  getUnlinkedGoogleAppointments,
  linkPatientToAppointment,
  getSyncHistory,
  getSyncQueueStatus,
  setupGoogleCalendarWatch,
  checkGoogleCalendarWatchStatus,
  manualResyncGoogleCalendar,
} from '@/lib/api/google-calendar';
import type { Appointment } from '@/lib/api/types';

/**
 * Query keys factory para Google Calendar
 */
const queryKeys = {
  all: ['google-calendar'] as const,
  synced: ['google-calendar', 'synced'] as const,
  syncedByTherapist: (therapistId: string) =>
    ['google-calendar', 'synced', therapistId] as const,
  unlinked: ['google-calendar', 'unlinked'] as const,
  unlinkedByTherapist: (therapistId: string) =>
    ['google-calendar', 'unlinked', therapistId] as const,
  syncHistory: ['google-calendar', 'sync-history'] as const,
  syncHistoryByEvent: (eventId: string) =>
    ['google-calendar', 'sync-history', eventId] as const,
  queueStatus: ['google-calendar', 'queue-status'] as const,
  watchStatus: (therapistId: string) =>
    ['google-calendar', 'watch-status', therapistId] as const,
};

/**
 * Buscar agendamentos sincronizados
 */
export function useSyncedAppointments(
  therapistId?: string,
  startDate?: Date,
  endDate?: Date,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: therapistId
      ? queryKeys.syncedByTherapist(therapistId)
      : queryKeys.synced,
    queryFn: () =>
      getSyncedAppointments(therapistId, startDate, endDate),
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
}

/**
 * Buscar agendamentos do Google sem paciente vinculado
 */
export function useUnlinkedGoogleAppointments(
  therapistId?: string,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: therapistId
      ? queryKeys.unlinkedByTherapist(therapistId)
      : queryKeys.unlinked,
    queryFn: () => getUnlinkedGoogleAppointments(therapistId),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 15 * 60 * 1000, // 15 minutos
  });
}

/**
 * Mutation para vincular paciente a agendamento
 */
export function useLinkPatientToAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ appointmentId, patientId }: { appointmentId: string; patientId: string }) =>
      linkPatientToAppointment(appointmentId, patientId),
    onSuccess: (appointment) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({
        queryKey: queryKeys.unlinked,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.synced,
      });

      // Atualizar detail query se existir
      queryClient.setQueryData(['appointments', appointment.id], appointment);
    },
  });
}

/**
 * Buscar histórico de sincronização
 */
export function useSyncHistory(
  eventId?: string,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: eventId
      ? queryKeys.syncHistoryByEvent(eventId)
      : queryKeys.syncHistory,
    queryFn: () => getSyncHistory(eventId),
    enabled,
    staleTime: 1 * 60 * 1000, // 1 minuto
    gcTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Buscar status da fila de sincronização
 */
export function useSyncQueueStatus(enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.queueStatus,
    queryFn: getSyncQueueStatus,
    enabled,
    staleTime: 30 * 1000, // 30 segundos
    gcTime: 2 * 60 * 1000, // 2 minutos
    refetchInterval: 10 * 1000, // Auto-refetch a cada 10 segundos
  });
}

/**
 * Mutation para setup de webhook
 */
export function useSetupGoogleCalendarWatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (therapistId: string) =>
      setupGoogleCalendarWatch(therapistId),
    onSuccess: (data, therapistId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.watchStatus(therapistId),
      });
    },
  });
}

/**
 * Buscar status do webhook configurado
 */
export function useGoogleCalendarWatchStatus(
  therapistId: string,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: queryKeys.watchStatus(therapistId),
    queryFn: () => checkGoogleCalendarWatchStatus(therapistId),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 15 * 60 * 1000, // 15 minutos
  });
}

/**
 * Mutation para resync manual
 */
export function useManualGoogleCalendarResync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      params: {
        therapistId: string;
        daysBack?: number;
        daysForward?: number;
      }
    ) =>
      manualResyncGoogleCalendar(
        params.therapistId,
        params.daysBack,
        params.daysForward
      ),
    onSuccess: (data, variables) => {
      // Invalidar queries relacionadas após resync
      queryClient.invalidateQueries({
        queryKey: queryKeys.syncedByTherapist(variables.therapistId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.unlinkedByTherapist(variables.therapistId),
      });
    },
  });
}
