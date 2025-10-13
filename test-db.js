const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://zinrqzsxvpqfoogohrwg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppbnJxenN4dnBxZm9vZ29ocndnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMDk1MDIsImV4cCI6MjA3NTg4NTUwMn0.0VDP-0ys8Y_VUhLXNCJCcSV1xAXV4c6pBvUq4mjPsRU'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testDatabase() {
  console.log('Testing database connection...')
  
  try {
    // Test therapists
    console.log('\n--- Testing Therapists ---')
    const { data: therapists, error: therapistsError } = await supabase
      .schema('cedro')
      .from('users')
      .select('id, name, email, role')
      .eq('role', 'therapist')
    
    if (therapistsError) {
      console.error('Therapists error:', therapistsError)
    } else {
      console.log('Therapists found:', therapists?.length || 0)
      console.log('Therapists data:', therapists)
    }

    // Test patients
    console.log('\n--- Testing Patients ---')
    const { data: patients, error: patientsError } = await supabase
      .schema('cedro')
      .from('patients')
      .select('id, full_name, email')
    
    if (patientsError) {
      console.error('Patients error:', patientsError)
    } else {
      console.log('Patients found:', patients?.length || 0)
      console.log('Patients data:', patients)
    }

    // Test users table
    console.log('\n--- Testing Users Table ---')
    const { data: users, error: usersError } = await supabase
      .schema('cedro')
      .from('users')
      .select('id, name, email, role')
      .limit(10)
    
    if (usersError) {
      console.error('Users error:', usersError)
    } else {
      console.log('Users found:', users?.length || 0)
      console.log('Users data:', users)
    }

    // Test patient_therapist_links
    console.log('\n--- Testing Patient-Therapist Links ---')
    const { data: links, error: linksError } = await supabase
      .schema('cedro')
      .from('patient_therapist_links')
      .select('*')
      .limit(10)
    
    if (linksError) {
      console.error('Links error:', linksError)
    } else {
      console.log('Links found:', links?.length || 0)
      console.log('Links data:', links)
    }

  } catch (error) {
    console.error('Database test failed:', error)
  }
}

testDatabase()