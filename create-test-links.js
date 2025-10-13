const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://zinrqzsxvpqfoogohrwg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppbnJxenN4dnBxZm9vZ29ocndnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMDk1MDIsImV4cCI6MjA3NTg4NTUwMn0.0VDP-0ys8Y_VUhLXNCJCcSV1xAXV4c6pBvUq4mjPsRU'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function createTestLink() {
  console.log('Creating test patient-therapist link...')
  
  try {
    // Get patient and first therapist
    const { data: patients } = await supabase
      .schema('cedro')
      .from('patients')
      .select('id')
      .limit(1)
    
    const { data: therapists } = await supabase
      .schema('cedro')
      .from('users')
      .select('id, name')
      .eq('role', 'therapist')
      .limit(1)
    
    if (!patients || patients.length === 0) {
      console.log('No patients found')
      return
    }
    
    if (!therapists || therapists.length === 0) {
      console.log('No therapists found')
      return
    }
    
    const patientId = patients[0].id
    const therapistId = therapists[0].id
    const therapistName = therapists[0].name
    
    console.log('Patient ID:', patientId)
    console.log('Therapist ID:', therapistId, '(', therapistName, ')')
    
    // Create single link
    const linkToCreate = {
      patient_id: patientId,
      therapist_id: therapistId,
      status: 'active',
      started_at: new Date().toISOString(),
      reason: 'Test link for validation'
    }
    
    console.log('Creating link:', linkToCreate)
    
    const { data: createdLink, error } = await supabase
      .schema('cedro')
      .from('patient_therapist_links')
      .insert(linkToCreate)
      .select()
    
    if (error) {
      console.error('Error creating link:', error)
    } else {
      console.log('Link created successfully:', createdLink)
    }
    
  } catch (error) {
    console.error('Failed to create test link:', error)
  }
}

createTestLink()