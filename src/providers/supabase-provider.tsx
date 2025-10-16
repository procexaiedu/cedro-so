'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { CedroUser, mapAuthUserToCedroUser } from '@/lib/auth'

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
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        const mappedUser = await mapAuthUserToCedroUser(session.user)
        setCedroUser(mappedUser)
      } else {
        setCedroUser(null)
      }
      
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          const mappedUser = await mapAuthUserToCedroUser(session.user)
          setCedroUser(mappedUser)
        } else {
          setCedroUser(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
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