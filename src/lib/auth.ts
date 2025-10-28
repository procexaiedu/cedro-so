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
    console.log('🔍 Mapping auth user to cedro user:', { email: authUser.email, id: authUser.id })
    
    // Validate input
    if (!authUser.email) {
      console.error('❌ Auth user has no email')
      return null
    }
    
    // First, try to find existing user by email
    console.log('📡 Querying cedro.users for email:', authUser.email)
    const { data: existingUser, error: fetchError } = await supabase
      .schema('cedro')
      .from('users')
      .select('*')
      .eq('email', authUser.email)
      .single()

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

    const { data: createdUser, error: createError } = await supabase
      .schema('cedro')
      .from('users')
      .insert(newUser)
      .select()
      .single()

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