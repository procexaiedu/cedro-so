import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  getAppointments,
  getTherapists,
  getPatients,
  getServices,
  getLinkedPatients,
  getLinkedTherapists,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  type Appointment 
} from '@/data/agenda'
import { useToast } from '@/hooks/use-toast'

// Re-export types
export type { Appointment }

// Query Keys
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

// Hook para buscar agendamentos
export function useAppointments(startDate: Date, endDate: Date, therapistId?: string) {
  return useQuery({
    queryKey: APPOINTMENTS_QUERY_KEYS.list(startDate, endDate, therapistId),
    queryFn: () => getAppointments(startDate, endDate, therapistId),
    staleTime: 2 * 60 * 1000, // 2 minutos - dados mais voláteis
    gcTime: 5 * 60 * 1000, // 5 minutos
  })
}

// Hook para buscar terapeutas
export function useTherapists() {
  return useQuery({
    queryKey: APPOINTMENTS_QUERY_KEYS.therapists(),
    queryFn: getTherapists,
    staleTime: 15 * 60 * 1000, // 15 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
  })
}

// Hook para buscar pacientes (para agenda)
export function usePatientsForAppointments() {
  return useQuery({
    queryKey: APPOINTMENTS_QUERY_KEYS.patients(),
    queryFn: getPatients,
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 20 * 60 * 1000, // 20 minutos
  })
}

// Hook para buscar serviços
export function useServices() {
  return useQuery({
    queryKey: APPOINTMENTS_QUERY_KEYS.services(),
    queryFn: getServices,
    staleTime: 30 * 60 * 1000, // 30 minutos - dados muito estáveis
    gcTime: 60 * 60 * 1000, // 1 hora
  })
}

// Hook para buscar pacientes vinculados a um terapeuta
export function useLinkedPatients(therapistId: string | null) {
  return useQuery({
    queryKey: APPOINTMENTS_QUERY_KEYS.linkedPatients(therapistId || ''),
    queryFn: () => therapistId ? getLinkedPatients(therapistId) : Promise.resolve([]),
    enabled: !!therapistId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  })
}

// Hook para buscar terapeutas vinculados a um paciente
export function useLinkedTherapists(patientId: string | null) {
  return useQuery({
    queryKey: APPOINTMENTS_QUERY_KEYS.linkedTherapists(patientId || ''),
    queryFn: () => patientId ? getLinkedTherapists(patientId) : Promise.resolve([]),
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  })
}

// Hook para criar agendamento
export function useCreateAppointment() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: createAppointment,
    onSuccess: () => {
      // Invalidar todas as queries relacionadas a agendamentos
      queryClient.invalidateQueries({ queryKey: APPOINTMENTS_QUERY_KEYS.all })
      // Invalidar queries de linked patients/therapists para garantir dados atualizados
      queryClient.invalidateQueries({ queryKey: ['appointments', 'linked-patients'] })
      queryClient.invalidateQueries({ queryKey: ['appointments', 'linked-therapists'] })
      // Invalidar listas de pacientes e terapeutas
      queryClient.invalidateQueries({ queryKey: APPOINTMENTS_QUERY_KEYS.patients() })
      queryClient.invalidateQueries({ queryKey: APPOINTMENTS_QUERY_KEYS.therapists() })
      
      toast({
        title: "Sucesso",
        description: "Agendamento criado com sucesso",
      })
    },
    onError: (error) => {
      console.error('Error creating appointment:', error)
      toast({
        title: "Erro",
        description: "Erro ao criar agendamento",
        variant: "destructive"
      })
    }
  })
}

// Hook para atualizar agendamento
export function useUpdateAppointment() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<Appointment> }) => 
      updateAppointment(id, data),
    onSuccess: () => {
      // Invalidar todas as queries relacionadas a agendamentos
      queryClient.invalidateQueries({ queryKey: APPOINTMENTS_QUERY_KEYS.all })
      // Invalidar queries de linked patients/therapists para garantir dados atualizados
      queryClient.invalidateQueries({ queryKey: ['appointments', 'linked-patients'] })
      queryClient.invalidateQueries({ queryKey: ['appointments', 'linked-therapists'] })
      // Invalidar listas de pacientes e terapeutas
      queryClient.invalidateQueries({ queryKey: APPOINTMENTS_QUERY_KEYS.patients() })
      queryClient.invalidateQueries({ queryKey: APPOINTMENTS_QUERY_KEYS.therapists() })
      
      toast({
        title: "Sucesso",
        description: "Agendamento atualizado com sucesso",
      })
    },
    onError: (error) => {
      console.error('Error updating appointment:', error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar agendamento",
        variant: "destructive"
      })
    }
  })
}

// Hook para deletar agendamento
export function useDeleteAppointment() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: deleteAppointment,
    onSuccess: () => {
      // Invalidar todas as queries relacionadas a agendamentos
      queryClient.invalidateQueries({ queryKey: APPOINTMENTS_QUERY_KEYS.all })
      // Invalidar queries de linked patients/therapists para garantir dados atualizados
      queryClient.invalidateQueries({ queryKey: ['appointments', 'linked-patients'] })
      queryClient.invalidateQueries({ queryKey: ['appointments', 'linked-therapists'] })
      // Invalidar listas de pacientes e terapeutas
      queryClient.invalidateQueries({ queryKey: APPOINTMENTS_QUERY_KEYS.patients() })
      queryClient.invalidateQueries({ queryKey: APPOINTMENTS_QUERY_KEYS.therapists() })
      
      toast({
        title: "Sucesso",
        description: "Agendamento removido com sucesso",
      })
    },
    onError: (error) => {
      console.error('Error deleting appointment:', error)
      toast({
        title: "Erro",
        description: "Erro ao remover agendamento",
        variant: "destructive"
      })
    }
  })
}