import { supabase } from './supabase'
import { User } from '@supabase/supabase-js'

export type CedroUser = {
  id: string
  email: string
  name: string
  role: 'admin' | 'therapist' | 'patient'
  phone: string | null
  created_at: string
  updated_at: string
}

/**
 * Maps a Supabase Auth user to a cedro.users record by email
 * Creates a new cedro.users record if one doesn't exist
 */
export async function mapAuthUserToCedroUser(authUser: User): Promise<CedroUser | null> {
  try {
    console.log('🔍 Starting mapAuthUserToCedroUser for:', { 
      id: authUser.id, 
      email: authUser.email,
      aud: authUser.aud,
      role: authUser.role
    })

    console.log('🔍 AuthUser object details:', authUser)
    console.log('🔍 AuthUser email check:', { 
      email: authUser.email, 
      hasEmail: !!authUser.email,
      emailType: typeof authUser.email 
    })

    // Log current session info
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    console.log('🔐 Current session info:', {
      hasSession: !!session,
      sessionError: sessionError,
      accessToken: session?.access_token ? 'present' : 'missing',
      tokenExpiry: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'unknown'
    })

    if (!authUser.email) {
      console.error('❌ No email found in auth user')
      return null
    }
    
    // Test connectivity first
    console.log('🔌 Testing database connectivity...')
    console.log('🔧 Supabase client config:', {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'missing',
      key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'present' : 'missing',
      schema: 'cedro'
    })
    
    try {
      const { data: testData, error: testError } = await supabase
        .schema('cedro')
        .from('users')
        .select('count')
        .limit(1)
      
      console.log('🔌 Connectivity test raw result:', { testData, testError })
      
      if (testError) {
        console.error('❌ Database connectivity test failed:', testError)
        return null
      }
      console.log('✅ Database connectivity test passed')
    } catch (connectError) {
      console.error('❌ Database connectivity error:', connectError)
      return null
    }

    // First, try to find existing user by email
    console.log('📡 Querying cedro.users for email:', authUser.email)
    
    // Add timeout to prevent hanging
    const queryPromise = supabase
      .schema('cedro')
      .from('users')
      .select('*')
      .eq('email', authUser.email)
      .single()

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Query timeout after 10 seconds')), 10000)
    )

    let existingUser, fetchError
    try {
      const result = await Promise.race([queryPromise, timeoutPromise]) as any
      existingUser = result.data
      fetchError = result.error
      console.log('📊 Query completed successfully')
    } catch (timeoutError) {
      console.error('⏰ Query timeout or error:', timeoutError)
      return null
    }

    console.log('📊 Existing user query result:', { 
      existingUser: existingUser ? { id: existingUser.id, email: existingUser.email, role: existingUser.role } : null, 
      fetchError: fetchError ? { code: fetchError.code, message: fetchError.message } : null 
    })

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is expected for new users
      console.error('❌ Error fetching user:', fetchError)
      return null
    }

    if (existingUser) {
      console.log('✅ Found existing user, returning:', { id: existingUser.id, email: existingUser.email, role: existingUser.role })
      return existingUser as CedroUser
    }

    // If user doesn't exist, create a new one
    const newUser = {
      id: authUser.id,
      email: authUser.email!,
      name: authUser.user_metadata?.name || authUser.email!.split('@')[0],
      role: 'therapist' as const, // Default role, can be changed by admin
      phone: authUser.user_metadata?.phone || null,
    }

    console.log('🆕 Creating new user:', newUser)

    // Add timeout to creation query
    const createPromise = supabase
      .schema('cedro')
      .from('users')
      .insert(newUser)
      .select()
      .single()

    const createTimeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('User creation timeout after 10 seconds')), 10000)
    )

    let createdUser, createError
    try {
      const result = await Promise.race([createPromise, createTimeoutPromise]) as any
      createdUser = result.data
      createError = result.error
      console.log('📊 User creation query completed')
    } catch (timeoutError) {
      console.error('⏰ User creation timeout or error:', timeoutError)
      return null
    }

    console.log('📝 User creation result:', { 
      createdUser: createdUser ? { id: createdUser.id, email: createdUser.email, role: createdUser.role } : null, 
      createError: createError ? { code: createError.code, message: createError.message } : null 
    })

    if (createError) {
      console.error('❌ Error creating user:', createError)
      return null
    }

    console.log('✅ Successfully created user, returning:', { id: createdUser.id, email: createdUser.email, role: createdUser.role })
    return createdUser as CedroUser
  } catch (error) {
    console.error('❌ CRITICAL ERROR in mapAuthUserToCedroUser:', error)
    console.error('❌ Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace'
    })
    return null
  }
}

/**
 * Gets the current authenticated user's cedro.users record
 */
export async function getCurrentCedroUser(): Promise<CedroUser | null> {
  try {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    
    if (!authUser) {
      return null
    }

    return await mapAuthUserToCedroUser(authUser)
  } catch (error) {
    console.error('Error getting current cedro user:', error)
    return null
  }
}

/**
 * Checks if the current user has the required role
 */
export async function hasRole(requiredRole: CedroUser['role']): Promise<boolean> {
  const user = await getCurrentCedroUser()
  return user?.role === requiredRole
}

/**
 * Checks if the current user has any of the required roles
 */
export async function hasAnyRole(requiredRoles: CedroUser['role'][]): Promise<boolean> {
  const user = await getCurrentCedroUser()
  return user ? requiredRoles.includes(user.role) : false
}