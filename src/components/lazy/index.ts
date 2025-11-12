import { lazy } from 'react'

// Lazy load heavy components
export const LazyAppointmentModal = lazy(() => 
  import('@/components/agenda/appointment-modal').then(module => ({
    default: module.AppointmentModal
  }))
)

export const LazyPatientForm = lazy(() => 
  import('@/components/pacientes/patient-form').then(module => ({
    default: module.PatientForm
  }))
)

export const LazyPatientDeleteDialog = lazy(() => 
  import('@/components/pacientes/patient-delete-dialog').then(module => ({
    default: module.PatientDeleteDialog
  }))
)

export const LazyPatientDetailDrawer = lazy(() => 
  import('@/components/pacientes/patient-detail-drawer').then(module => ({
    default: module.PatientDetailDrawer
  }))
)