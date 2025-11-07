import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  getPatients, 
  getTherapistsForFilter, 
  createPatient, 
  updatePatient, 
  deletePatient,
  type Patient,
  type PatientFilters,
  type PaginationParams,
  type UpdatePatientData
} from '@/data/pacientes'
import { useToast } from '@/hooks/use-toast'

// Query Keys
export const PATIENTS_QUERY_KEYS = {
  all: ['patients'] as const,
  lists: () => [...PATIENTS_QUERY_KEYS.all, 'list'] as const,
  list: (filters: PatientFilters, pagination: PaginationParams, therapistId?: string) => 
    [...PATIENTS_QUERY_KEYS.lists(), { filters, pagination, therapistId }] as const,
  therapists: () => ['therapists', 'filter'] as const,
}

// Hook para buscar pacientes com cache
export function usePatients(
  filters: PatientFilters, 
  pagination: PaginationParams, 
  therapistId?: string
) {
  return useQuery({
    queryKey: PATIENTS_QUERY_KEYS.list(filters, pagination, therapistId),
    queryFn: () => getPatients(filters, pagination, therapistId),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  })
}

// Hook para buscar terapeutas para filtro
export function useTherapistsForFilter() {
  return useQuery({
    queryKey: PATIENTS_QUERY_KEYS.therapists(),
    queryFn: getTherapistsForFilter,
    staleTime: 15 * 60 * 1000, // 15 minutos - dados menos voláteis
    gcTime: 30 * 60 * 1000, // 30 minutos
  })
}

// Hook para criar paciente
export function useCreatePatient() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: createPatient,
    onSuccess: () => {
      // Invalidar todas as queries de pacientes para refetch
      queryClient.invalidateQueries({ queryKey: PATIENTS_QUERY_KEYS.all })
      toast({
        title: "Sucesso",
        description: "Paciente criado com sucesso",
      })
    },
    onError: (error) => {
      console.error('Error creating patient:', error)
      toast({
        title: "Erro",
        description: "Erro ao criar paciente",
        variant: "destructive"
      })
    }
  })
}

// Hook para atualizar paciente
export function useUpdatePatient() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: UpdatePatientData }) => 
      updatePatient(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PATIENTS_QUERY_KEYS.all })
      toast({
        title: "Sucesso",
        description: "Paciente atualizado com sucesso",
      })
    },
    onError: (error) => {
      console.error('Error updating patient:', error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar paciente",
        variant: "destructive"
      })
    }
  })
}

// Hook para deletar paciente
export function useDeletePatient() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: deletePatient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PATIENTS_QUERY_KEYS.all })
      toast({
        title: "Sucesso",
        description: "Paciente removido com sucesso",
      })
    },
    onError: (error) => {
      console.error('Error deleting patient:', error)
      toast({
        title: "Erro",
        description: "Erro ao remover paciente",
        variant: "destructive"
      })
    }
  })
}