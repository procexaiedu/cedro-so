'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/providers/supabase-provider'
import { Loader2 } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useSupabase()
  const router = useRouter()

  // Debug logging
  console.log('🛡️ AuthGuard render:', { 
    user: user?.id, 
    loading, 
    timestamp: new Date().toISOString() 
  })

  useEffect(() => {
    console.log('🛡️ AuthGuard useEffect:', { user: user?.id, loading })
    if (!loading && !user) {
      console.log('🔄 Redirecting to login...')
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    console.log('🔄 AuthGuard: Showing loading spinner')
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    console.log('❌ AuthGuard: No user, returning null')
    return null
  }

  console.log('✅ AuthGuard: User authenticated, rendering children')
  return <>{children}</>
}