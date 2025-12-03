Failed to compile.
./src/components/agenda/appointment-google-calendar-info.tsx:25:36
Type error: Property 'origin' does not exist on type 'AppointmentWithDetails'.
  23 |   isLoadingPatientLink = false,
  24 | }: GoogleCalendarInfoProps) {
> 25 |   const isFromGoogle = appointment.origin === 'google'
     |                                    ^
  26 |   const hasLink = appointment.html_link
  27 |   const patientNotLinked = isFromGoogle && !appointment.patient_id
  28 |
Error: Command "npm run build" exited with 1