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
  
  // Lock to prevent concurrent mapAuthUserToCedroUser executions
  const [isMapping, setIsMapping] = useState(false)

  // Helper function to safely map user with lock
  const safeMapAuthUserToCedroUser = async (authUser: User): Promise<CedroUser | null> => {
    if (isMapping) {
      console.log('⚠️ mapAuthUserToCedroUser already in progress, skipping...')
      return null
    }

    setIsMapping(true)
    try {
      console.log('🔒 Acquiring lock for mapAuthUserToCedroUser...')
      const result = await mapAuthUserToCedroUser(authUser)
      console.log('🔓 Releasing lock for mapAuthUserToCedroUser')
      return result
    } catch (error) {
      console.error('❌ Error in safeMapAuthUserToCedroUser:', error)
      return null
    } finally {
      setIsMapping(false)
    }
  }

  // Debug logging
  useEffect(() => {
    console.log('🔍 SupabaseProvider render:', {
      user: user?.id,
      session: !!session,
      cedroUser: cedroUser?.id,
      loading,
      isMapping,
      timestamp: new Date().toISOString()
    })
  })

  // Ativar interceptador de autenticação
  const { handleAuthError } = useAuthInterceptor()
  
  // Ativar atualizações em tempo real para appointments
  // TEMPORARIAMENTE DESABILITADO PARA TESTE - pode estar causando infinite loading
  // useRealtimeAppointments()

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
      console.log('🚀 Starting getInitialSession...')
      try {
        console.log('📡 Calling supabase.auth.getSession()...')
        
        // Add timeout to prevent infinite hanging
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('getSession timeout after 10 seconds')), 10000)
        })
        
        const sessionPromise = supabase.auth.getSession()
        
        const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise]) as any
        console.log('📡 getSession result:', { session: !!session, error: !!error })
        
        if (!isMounted) {
          console.log('⚠️ Component unmounted, returning early')
          return
        }
        
        if (error) {
          console.error('❌ Error getting session:', error)
          setSession(null)
          setUser(null)
          setCedroUser(null)
          setLoading(false)
          return
        }

        console.log('✅ Setting session and user state...')
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          console.log('👤 User found, mapping to CedroUser...')
          const mappedUser = await safeMapAuthUserToCedroUser(session.user)
          console.log('🔄 mapAuthUserToCedroUser result:', {
            success: !!mappedUser,
            userId: mappedUser?.id,
            userEmail: mappedUser?.email,
            userRole: mappedUser?.role
          })
          if (isMounted) {
            console.log('🔄 Setting cedroUser state:', mappedUser ? 'with user data' : 'to null')
            setCedroUser(mappedUser)
          }
        } else {
          console.log('👤 No user in session')
          setCedroUser(null)
        }
        
        if (isMounted) {
          console.log('🏁 Setting loading to false')
          setLoading(false)
        }
      } catch (error) {
        console.error('❌ Error in getInitialSession:', error)
        
        // Emergency fallback - if Supabase is completely unresponsive
        if (error instanceof Error && error.message?.includes('timeout')) {
          console.log('⚠️ Supabase timeout detected - using emergency fallback')
          
          // Try to redirect to login as fallback
          if (typeof window !== 'undefined') {
            console.log('🔄 Emergency redirect to login')
            window.location.href = '/login'
            return
          }
        }
        
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
          console.log('🔄 Auth state change - mapping user to CedroUser...')
          const mappedUser = await safeMapAuthUserToCedroUser(session.user)
          console.log('🔄 Auth state change - mapAuthUserToCedroUser result:', {
            success: !!mappedUser,
            userId: mappedUser?.id,
            userEmail: mappedUser?.email,
            userRole: mappedUser?.role
          })
          if (isMounted) {
            console.log('🔄 Auth state change - setting cedroUser state:', mappedUser ? 'with user data' : 'to null')
            setCedroUser(mappedUser)
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