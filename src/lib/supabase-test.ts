import { supabase } from './supabase'

/**
 * Test Supabase connection in read-only mode
 * This function attempts to query the users table to verify connectivity
 */
export async function testSupabaseConnection() {
  try {
    // Test basic connection by querying users table (read-only)
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, role')
      .limit(1)

    if (error) {
      console.error('Supabase connection test failed:', error.message)
      return {
        success: false,
        error: error.message,
        data: null
      }
    }

    console.log('Supabase connection test successful')
    return {
      success: true,
      error: null,
      data: data
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error('Supabase connection test failed:', errorMessage)
    return {
      success: false,
      error: errorMessage,
      data: null
    }
  }
}

/**
 * Test patient overview view access
 */
export async function testPatientOverviewAccess() {
  try {
    const { data, error } = await supabase
      .from('vw_patient_overview')
      .select('*')
      .limit(5)

    if (error) {
      console.error('Patient overview access test failed:', error.message)
      return {
        success: false,
        error: error.message,
        data: null
      }
    }

    console.log('Patient overview access test successful')
    return {
      success: true,
      error: null,
      data: data
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error('Patient overview access test failed:', errorMessage)
    return {
      success: false,
      error: errorMessage,
      data: null
    }
  }
}