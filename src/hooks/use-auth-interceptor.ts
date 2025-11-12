'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

export function useAuthInterceptor() {
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Monitorar mudanças de estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed successfully')
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out')
          router.push('/login')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router])

  // Função para verificar e lidar com erros de autenticação
  const handleAuthError = async (error: any) => {
    if (!error) return

    // Detectar erros de token expirado ou inválido
    const isAuthError = 
      error.message?.includes('JWT') ||
      error.message?.includes('expired') ||
      error.message?.includes('invalid') ||
      error.code === 'PGRST301' || // JWT expired
      error.code === 'PGRST302' || // JWT invalid
      error.status === 401

    if (isAuthError) {
      console.warn('Token expirado detectado:', error)
      
      // Forçar logout
      await supabase.auth.signOut()
      
      toast({
        title: 'Sessão expirada',
        description: 'Sua sessão expirou. Você será redirecionado para o login.',
        variant: 'destructive',
      })
      
      // Redirecionar para login após um pequeno delay
      setTimeout(() => {
        router.push('/login')
      }, 1500)
    }
  }

  // Retornar a função para uso em outros hooks
  return { handleAuthError }
}