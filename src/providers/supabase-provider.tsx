'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { CedroUser, mapAuthUserToCedroUser } from '@/lib/auth'
import { useAuthInterceptor } from '@/hooks/use-auth-interceptor'
import { useRealtimeAppointments } from '@/hooks/use-realtime-appointments'

type SupabaseContextType = {
  user: User | null
  session: Session | null
  cedroUser: CedroUser | null
  loading: boolean
  signOut: () => Promise<void>
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined)

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [cedroUser, setCedroUser] = useState<CedroUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Ativar interceptador de autenticação
  const { handleAuthError } = useAuthInterceptor()
  
  // Ativar atualizações em tempo real para appointments
  useRealtimeAppointments()

  // Function to handle JWT expiration
  const handleJWTExpired = async () => {
    console.log('🔄 JWT expired, forcing logout...')
    await supabase.auth.signOut()
    setSession(null)
    setUser(null)
    setCedroUser(null)
    router.push('/login')
  }

  useEffect(() => {
    let isMounted = true

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!isMounted) return
        
        if (error) {
          console.error('Error getting session:', error)
          setSession(null)
          setUser(null)
          setCedroUser(null)
          setLoading(false)
          return
        }

        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          try {
            const mappedUser = await mapAuthUserToCedroUser(session.user)
            if (isMounted) {
              setCedroUser(mappedUser)
            }
          } catch (error) {
            console.error('Error mapping user:', error)
            if (isMounted) {
              setCedroUser(null)
            }
          }
        } else {
          setCedroUser(null)
        }
        
        if (isMounted) {
          setLoading(false)
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error)
        if (isMounted) {
          setSession(null)
          setUser(null)
          setCedroUser(null)
          setLoading(false)
        }
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return

        console.log('Auth state change:', event, session?.user?.id)
        
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          try {
            const mappedUser = await mapAuthUserToCedroUser(session.user)
            if (isMounted) {
              setCedroUser(mappedUser)
            }
          } catch (error) {
            console.error('Error mapping user on auth change:', error)
            if (isMounted) {
              setCedroUser(null)
            }
          }
        } else {
          setCedroUser(null)
        }
        
        if (isMounted) {
          setLoading(false)
        }
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setCedroUser(null)
  }

  const value = {
    user,
    session,
    cedroUser,
    loading,
    signOut,
  }

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  )
}

export function useSupabase() {
  const context = useContext(SupabaseContext)
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context
}