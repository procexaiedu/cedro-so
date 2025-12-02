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

    if (!authUser.email) {
      console.error('❌ No email found in auth user')
      return null
    }

    console.log('✅ Email validated, proceeding with user lookup...')

    // First, try to find existing user by email
    console.log('📡 Querying cedro.users for email:', authUser.email)

    // Query only necessary columns to improve performance
    const queryPromise = supabase
      .schema('cedro')
      .from('users')
      .select('id, email, name, role, phone, created_at, updated_at')
      .eq('email', authUser.email)
      .single()

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Query timeout after 30 seconds')), 30000)
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
      // Check for ID mismatch (legacy user issue) and migrate if necessary
      if (existingUser.id !== authUser.id) {
        console.warn('⚠️ ID mismatch detected! Attempting to migrate user data...', {
          cedroId: existingUser.id,
          authId: authUser.id,
          email: authUser.email
        })
        
        try {
          // Call RPC to migrate data
          // Note: We use RPC because we need to update PKs and FKs transactionally
          const { data: migrationResult, error: migrationError } = await supabase
            .rpc('sync_user_id', {
              email_input: authUser.email,
              auth_id: authUser.id
            })
            
          if (migrationError) {
            console.error('❌ Migration RPC failed:', migrationError)
            // Fallback: return existing user, but warn about instability
            console.warn('⚠️ Returning mismatched user due to migration failure. Application may be unstable.')
          } else {
            console.log('✅ User migration successful:', migrationResult)
            // Update the ID in the object we're about to return
            // This ensures the session immediately uses the correct, new ID
            existingUser.id = authUser.id
          }
        } catch (e) {
          console.error('❌ Exception during user migration:', e)
        }
      }

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
      .select('id, email, name, role, phone, created_at, updated_at')
      .single()

    const createTimeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('User creation timeout after 30 seconds')), 30000)
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