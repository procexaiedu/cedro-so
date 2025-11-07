'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/providers/supabase-provider'
import { Loader2 } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()
  const { user, loading } = useSupabase()

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Usuário logado - redirecionar para dashboard
        router.replace('/dashboard')
      } else {
        // Usuário não logado - redirecionar para login
        router.replace('/login')
      }
    }
  }, [user, loading, router])

  // Mostrar loading enquanto verifica autenticação
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
        <p className="text-gray-600">Carregando...</p>
      </div>
    </div>
  )
}