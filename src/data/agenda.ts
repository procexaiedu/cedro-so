import { supabase } from '@/lib/supabase'
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'

export type Appointment = {
  id: string
  patient_id: string
  therapist_id: string
  service_id: string | null
  care_plan_id: string | null
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
  start_at: string
  end_at: string
  notes: string | null
  created_at: string
  updated_at: string
  // Joined data
  patient_name?: string
  patient_email?: string
  therapist_name?: string
  service_name?: string
}

export type TherapistSchedule = {
  id: string
  therapist_id: string
  weekday: number // 0 = Sunday, 1 = Monday, etc.
  start_time: string
  end_time: string
  note?: string
  created_at: string
  updated_at: string
}

export type ScheduleException = {
  id: string
  therapist_id: string
  date: string
  kind: 'block' | 'extra'
  start_time: string
  end_time: string
  note: string | null
  created_at: string
}

export type ViewMode = 'day' | 'week' | 'month'

/**
 * Get appointments for a specific date range
 */
export async function getAppointments(
  startDate: Date,
  endDate: Date,
  therapistId?: string
): Promise<Appointment[]> {
  try {
    console.log('🔍 getAppointments called with:', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      therapistId
    })

    // Use the optimized view for better performance
    let query = supabase
      .schema('cedro')
      .from('appointments_with_details')
      .select('*')
      .gte('start_at', startDate.toISOString())
      .lte('start_at', endDate.toISOString())
      .order('start_at', { ascending: true })

    if (therapistId) {
      query = query.eq('therapist_id', therapistId)
    }

    const { data, error } = await query

    console.log('📊 Query result:', { 
      data: data?.length || 0, 
      error: error?.message,
      firstItem: data?.[0]
    })

    if (error) {
      console.error('Error fetching appointments:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getAppointments:', error)
    return []
  }
}

/**
 * Get appointments for a specific day
 */
export async function getDayAppointments(date: Date, therapistId?: string): Promise<Appointment[]> {
  return getAppointments(startOfDay(date), endOfDay(date), therapistId)
}

/**
 * Get appointments for a specific week
 */
export async function getWeekAppointments(date: Date, therapistId?: string): Promise<Appointment[]> {
  return getAppointments(startOfWeek(date), endOfWeek(date), therapistId)
}

/**
 * Get appointments for a specific month
 */
export async function getMonthAppointments(date: Date, therapistId?: string): Promise<Appointment[]> {
  return getAppointments(startOfMonth(date), endOfMonth(date), therapistId)
}

/**
 * Create a new appointment
 */
export async function createAppointment(appointment: {
  patient_id: string
  therapist_id: string
  service_id?: string
  care_plan_id?: string
  start_at: string
  end_at: string
  notes?: string
}): Promise<Appointment | null> {
  try {
    const { data, error } = await supabase
      .schema('cedro')
      .from('appointments')
      .insert({
        ...appointment,
        status: 'scheduled',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating appointment:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in createAppointment:', error)
    return null
  }
}

/**
 * Update an existing appointment
 */
export async function updateAppointment(
  id: string,
  updates: Partial<Appointment>
): Promise<Appointment | null> {
  try {
    const { data, error } = await supabase
      .schema('cedro')
      .from('appointments')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating appointment:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in updateAppointment:', error)
    return null
  }
}

/**
 * Delete an appointment
 */
export async function deleteAppointment(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .schema('cedro')
      .from('appointments')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting appointment:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in deleteAppointment:', error)
    return false
  }
}

/**
 * Get therapist schedules
 */
export async function getTherapistSchedules(therapistId?: string): Promise<TherapistSchedule[]> {
  try {
    let query = supabase
      .schema('cedro')
      .from('therapist_schedules')
      .select('*')
      .order('weekday', { ascending: true })
      .order('start_time', { ascending: true })

    if (therapistId) {
      query = query.eq('therapist_id', therapistId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching therapist schedules:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getTherapistSchedules:', error)
    return []
  }
}

/**
 * Get schedule exceptions for a date range
 */
export async function getScheduleExceptions(
  startDate: Date,
  endDate: Date,
  therapistId?: string
): Promise<ScheduleException[]> {
  try {
    let query = supabase
      .schema('cedro')
      .from('therapist_schedule_exceptions')
      .select('*')
      .gte('date', format(startDate, 'yyyy-MM-dd'))
      .lte('date', format(endDate, 'yyyy-MM-dd'))
      .order('date', { ascending: true })

    if (therapistId) {
      query = query.eq('therapist_id', therapistId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching schedule exceptions:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getScheduleExceptions:', error)
    return []
  }
}

/**
 * Create a schedule exception
 */
export async function createScheduleException(exception: {
  therapist_id: string
  date: string
  kind: 'block' | 'extra'
  start_time: string
  end_time: string
  note?: string
}): Promise<ScheduleException | null> {
  try {
    const { data, error } = await supabase
      .schema('cedro')
      .from('therapist_schedule_exceptions')
      .insert(exception)
      .select()
      .single()

    if (error) {
      console.error('Error creating schedule exception:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in createScheduleException:', error)
    return null
  }
}

/**
 * Get all therapists (users with role 'therapist' or admin users who can also act as therapists)
 */
export async function getTherapists(): Promise<Array<{ id: string; name: string; email: string }>> {
  try {
    const { data, error } = await supabase
      .schema('cedro')
      .from('users')
      .select('id, name, email')
      .in('role', ['therapist', 'admin'])
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching therapists:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getTherapists:', error)
    return []
  }
}

/**
 * Get all patients
 */
export async function getPatients(): Promise<Array<{ id: string; name: string; email: string }>> {
  try {
    const { data, error } = await supabase
      .schema('cedro')
      .from('patients')
      .select(`
        id,
        full_name,
        email
      `)
      .order('full_name', { ascending: true })

    if (error) {
      console.error('Error fetching patients:', error)
      return []
    }

    return (data || []).map((patient: any) => ({
      id: patient.id,
      name: patient.full_name,
      email: patient.email,
    }))
  } catch (error) {
    console.error('Error in getPatients:', error)
    return []
  }
}

/**
 * Get all services
 */
export async function getServices(): Promise<Array<{ id: string; name: string; duration_minutes: number }>> {
  try {
    const { data, error } = await supabase
      .schema('cedro')
      .from('services')
      .select('id, name, default_duration_min')
      .eq('active', true)
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching services:', error)
      return []
    }

    // Map default_duration_min to duration_minutes for interface compatibility
    return (data || []).map(service => ({
      id: service.id,
      name: service.name,
      duration_minutes: service.default_duration_min
    }))
  } catch (error) {
    console.error('Error in getServices:', error)
    return []
  }
}

/**
 * Update or create a therapist schedule
 */
export async function updateTherapistSchedule(schedule: {
  therapist_id: string
  weekday: number
  start_time: string
  end_time: string
}): Promise<TherapistSchedule | null> {
  try {
    const { data, error } = await supabase
      .schema('cedro')
      .from('therapist_schedules')
      .upsert({
        therapist_id: schedule.therapist_id,
        weekday: schedule.weekday,
        start_time: schedule.start_time,
        end_time: schedule.end_time
      })
      .select()
      .single()

    if (error) {
      console.error('Error updating therapist schedule:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in updateTherapistSchedule:', error)
    return null
  }
}

/**
 * Create a new therapist schedule slot
 */
export async function createTherapistSchedule(schedule: {
  therapist_id: string
  weekday: number
  start_time: string
  end_time: string
  note?: string
}): Promise<TherapistSchedule | null> {
  try {
    const { data, error } = await supabase
      .schema('cedro')
      .from('therapist_schedules')
      .insert({
        therapist_id: schedule.therapist_id,
        weekday: schedule.weekday,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        note: schedule.note
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating therapist schedule:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error in createTherapistSchedule:', error)
    return null
  }
}

/**
 * Update an existing therapist schedule slot
 */
export async function updateTherapistScheduleSlot(
  scheduleId: string,
  updates: {
    start_time?: string
    end_time?: string
    note?: string
  }
): Promise<TherapistSchedule | null> {
  try {
    const { data, error } = await supabase
      .schema('cedro')
      .from('therapist_schedules')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', scheduleId)
      .select()
      .single()

    if (error) {
      console.error('Error updating therapist schedule slot:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error in updateTherapistScheduleSlot:', error)
    return null
  }
}

/**
 * Delete a therapist schedule slot
 */
export async function deleteTherapistSchedule(scheduleId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .schema('cedro')
      .from('therapist_schedules')
      .delete()
      .eq('id', scheduleId)

    if (error) {
      console.error('Error deleting therapist schedule:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in deleteTherapistSchedule:', error)
    return false
  }
}

/**
 * Get schedules grouped by weekday for a therapist
 */
export async function getTherapistSchedulesByDay(therapistId: string): Promise<Record<number, TherapistSchedule[]>> {
  try {
    const schedules = await getTherapistSchedules(therapistId)
    
    const schedulesByDay: Record<number, TherapistSchedule[]> = {}
    
    // Initialize all days
    for (let i = 0; i <= 6; i++) {
      schedulesByDay[i] = []
    }
    
    // Group schedules by weekday
    schedules.forEach(schedule => {
      schedulesByDay[schedule.weekday].push(schedule)
    })
    
    // Sort schedules within each day by start time
    Object.keys(schedulesByDay).forEach(day => {
      schedulesByDay[parseInt(day)].sort((a, b) => 
        a.start_time.localeCompare(b.start_time)
      )
    })
    
    return schedulesByDay
  } catch (error) {
    console.error('Error in getTherapistSchedulesByDay:', error)
    return {}
  }
}

/**
 * Update an existing schedule exception
 */
export async function updateScheduleException(
  exceptionId: string,
  updates: {
    date?: string
    kind?: 'block' | 'extra'
    start_time?: string
    end_time?: string
    note?: string | null
  }
): Promise<ScheduleException | null> {
  try {
    const { data, error } = await supabase
      .schema('cedro')
      .from('therapist_schedule_exceptions')
      .update(updates)
      .eq('id', exceptionId)
      .select()
      .single()

    if (error) {
      console.error('Error updating schedule exception:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error in updateScheduleException:', error)
    return null
  }
}

/**
 * Delete a schedule exception
 */
export async function deleteScheduleException(exceptionId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .schema('cedro')
      .from('therapist_schedule_exceptions')
      .delete()
      .eq('id', exceptionId)

    if (error) {
      console.error('Error deleting schedule exception:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in deleteScheduleException:', error)
    return false
  }
}

/**
 * Get patients linked to a specific therapist
 */
export async function getLinkedPatients(therapistId: string): Promise<Array<{ id: string; name: string; email: string; phone: string }>> {
  try {
    const { data, error } = await supabase
      .schema('cedro')
      .from('patient_therapist_links')
      .select(`
        patient_id,
        patients!inner (
          id,
          full_name,
          email,
          phone
        )
      `)
      .eq('therapist_id', therapistId)
      .eq('status', 'active')

    if (error) {
      console.error('Error fetching linked patients:', error)
      return []
    }

    return data?.map((link: any) => ({
      id: link.patients.id,
      name: link.patients.full_name,
      email: link.patients.email,
      phone: link.patients.phone
    })) || []
  } catch (error) {
    console.error('Error in getLinkedPatients:', error)
    return []
  }
}

/**
 * Get therapists linked to a specific patient
 */
export async function getLinkedTherapists(patientId: string): Promise<Array<{ id: string; name: string; email: string }>> {
  try {
    const { data, error } = await supabase
      .schema('cedro')
      .from('patient_therapist_links')
      .select(`
        therapist_id,
        therapists:users!therapist_id (
          id,
          name,
          email
        )
      `)
      .eq('patient_id', patientId)
      .eq('status', 'active')

    if (error) {
      console.error('Error fetching linked therapists:', error)
      return []
    }

    return data?.map((link: any) => ({
      id: link.therapists.id,
      name: link.therapists.name,
      email: link.therapists.email
    })) || []
  } catch (error) {
    console.error('Error in getLinkedTherapists:', error)
    return []
  }
}

/**
 * Check if a patient is linked to a therapist
 */
export async function isPatientLinkedToTherapist(patientId: string, therapistId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .schema('cedro')
      .from('patient_therapist_links')
      .select('id')
      .eq('patient_id', patientId)
      .eq('therapist_id', therapistId)
      .eq('status', 'active')
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error checking patient-therapist link:', error)
      return false
    }

    return !!data
  } catch (error) {
    console.error('Error in isPatientLinkedToTherapist:', error)
    return false
  }
}