'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { APPOINTMENTS_QUERY_KEYS } from '@/hooks/use-appointments'
import { useToast } from '@/hooks/use-toast'

export function useRealtimeAppointments() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  useEffect(() => {
    // Configurar canal do Realtime para a tabela appointments
    const appointmentsChannel = supabase
      .channel('appointments-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Escutar todos os eventos (INSERT, UPDATE, DELETE)
          schema: 'cedro',
          table: 'appointments'
        },
        (payload) => {
          console.log('Realtime appointment change:', payload)
          
          // Invalidar todas as queries relacionadas a appointments
          queryClient.invalidateQueries({ queryKey: APPOINTMENTS_QUERY_KEYS.all })
          queryClient.invalidateQueries({ queryKey: ['linked-patients'] })
          queryClient.invalidateQueries({ queryKey: ['linked-therapists'] })
          queryClient.invalidateQueries({ queryKey: APPOINTMENTS_QUERY_KEYS.patients() })
          queryClient.invalidateQueries({ queryKey: APPOINTMENTS_QUERY_KEYS.therapists() })
          
          // Mostrar notificação baseada no tipo de evento
          switch (payload.eventType) {
            case 'INSERT':
              toast({
                title: 'Novo agendamento',
                description: 'Um novo agendamento foi criado.',
                variant: 'default',
              })
              break
            case 'UPDATE':
              toast({
                title: 'Agendamento atualizado',
                description: 'Um agendamento foi modificado.',
                variant: 'default',
              })
              break
            case 'DELETE':
              toast({
                title: 'Agendamento removido',
                description: 'Um agendamento foi excluído.',
                variant: 'default',
              })
              break
          }
        }
      )
      .subscribe((status) => {
        console.log('Appointments realtime status:', status)
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Conectado ao Realtime para appointments')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Erro na conexão Realtime para appointments')
        }
      })

    // Configurar canal para a tabela patient_therapist_links
    const linksChannel = supabase
      .channel('patient-therapist-links-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'cedro',
          table: 'patient_therapist_links'
        },
        (payload) => {
          console.log('Realtime patient-therapist link change:', payload)
          
          // Invalidar queries de links
          queryClient.invalidateQueries({ queryKey: ['linked-patients'] })
          queryClient.invalidateQueries({ queryKey: ['linked-therapists'] })
          
          // Notificação para mudanças nos vínculos
          switch (payload.eventType) {
            case 'INSERT':
              toast({
                title: 'Novo vínculo criado',
                description: 'Um novo vínculo paciente-terapeuta foi estabelecido.',
                variant: 'default',
              })
              break
            case 'UPDATE':
              toast({
                title: 'Vínculo atualizado',
                description: 'Um vínculo paciente-terapeuta foi modificado.',
                variant: 'default',
              })
              break
            case 'DELETE':
              toast({
                title: 'Vínculo removido',
                description: 'Um vínculo paciente-terapeuta foi removido.',
                variant: 'default',
              })
              break
          }
        }
      )
      .subscribe((status) => {
        console.log('Patient-therapist links realtime status:', status)
      })

    // Cleanup: desinscrever dos canais quando o componente for desmontado
    return () => {
      console.log('🧹 Limpando subscriptions do Realtime')
      supabase.removeChannel(appointmentsChannel)
      supabase.removeChannel(linksChannel)
    }
  }, [queryClient, toast])
}

// Hook para refresh manual de dados quando modal é aberto
export function useRefreshOnModalOpen() {
  const queryClient = useQueryClient()

  const refreshAppointmentData = () => {
    console.log('🔄 Refreshing appointment data on modal open')
    
    // Invalidar todas as queries relacionadas para forçar refetch
    queryClient.invalidateQueries({ queryKey: APPOINTMENTS_QUERY_KEYS.all })
    queryClient.invalidateQueries({ queryKey: ['linked-patients'] })
    queryClient.invalidateQueries({ queryKey: ['linked-therapists'] })
    queryClient.invalidateQueries({ queryKey: APPOINTMENTS_QUERY_KEYS.patients() })
    queryClient.invalidateQueries({ queryKey: APPOINTMENTS_QUERY_KEYS.therapists() })
    
    // Refetch imediatamente as queries mais importantes
    queryClient.refetchQueries({ queryKey: ['linked-patients'] })
    queryClient.refetchQueries({ queryKey: ['linked-therapists'] })
  }

  return { refreshAppointmentData }
}