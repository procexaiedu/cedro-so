import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'x-client-info': 'cedro-so@1.0.0',
    },
    fetch: (url, options = {}) => {
      console.log('🌐 Supabase fetch:', url)
      return fetch(url, {
        ...options,
        signal: AbortSignal.timeout(30000), // 30 second timeout (increased from 10s)
      }).catch(error => {
        console.error('❌ Supabase fetch error:', error)
        throw error
      })
    }
  },
  db: {
    schema: 'cedro',
  },
  // TEMPORARIAMENTE DESABILITADO - pode estar causando infinite loading
  // realtime: {
  //   params: {
  //     eventsPerSecond: 10,
  //   },
  // },
})

// Export a function to create new client instances
export function createClient() {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      headers: {
        'x-client-info': 'cedro-so@1.0.0',
      },
      fetch: (url, options = {}) => {
        return fetch(url, {
          ...options,
          signal: AbortSignal.timeout(30000), // 30 second timeout (increased from 10s)
        }).catch(error => {
          console.error('❌ Supabase fetch error:', error)
          throw error
        })
      }
    },
    db: {
      schema: 'cedro',
    },
    // TEMPORARIAMENTE DESABILITADO - pode estar causando infinite loading
    // realtime: {
    //   params: {
    //     eventsPerSecond: 10,
    //   },
    // },
  })
}

// Database types based on the cedro schema
export type Database = {
  cedro: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: 'admin' | 'therapist' | 'patient'
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          role: 'admin' | 'therapist' | 'patient'
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'admin' | 'therapist' | 'patient'
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      patients: {
        Row: {
          id: string
          user_id: string
          birth_date: string | null
          gender: string | null
          emergency_contact: string | null
          medical_history: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          birth_date?: string | null
          gender?: string | null
          emergency_contact?: string | null
          medical_history?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          birth_date?: string | null
          gender?: string | null
          emergency_contact?: string | null
          medical_history?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      appointments: {
        Row: {
          id: string
          patient_id: string
          therapist_id: string
          scheduled_at: string
          duration_minutes: number
          status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          therapist_id: string
          scheduled_at: string
          duration_minutes?: number
          status?: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          therapist_id?: string
          scheduled_at?: string
          duration_minutes?: number
          status?: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      vw_patient_overview: {
        Row: {
          patient_id: string
          patient_name: string
          patient_email: string
          patient_phone: string | null
          birth_date: string | null
          gender: string | null
          emergency_contact: string | null
          current_therapist_id: string | null
          current_therapist_name: string | null
          total_appointments: number | null
          last_appointment: string | null
        }
      }
    }
    Functions: {
      calculate_recording_progress: {
        Args: {
          job_id: string
        }
        Returns: {
          job_id: string
          status: string
          progress_percentage: number
          estimated_completion: string | null
          created_at: string
          updated_at: string
          file_url: string | null
          patient_id: string
          therapist_id: string
        }
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}