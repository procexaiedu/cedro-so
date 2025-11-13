'use client'

import { useState, memo, useCallback, useMemo } from 'react'
import { AppShell } from '@/components/layout/app-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  CalendarIcon,
  Plus,
  Clock,
  User,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  MoreHorizontal,
  CheckCircle,
  AlertCircle,
  XCircle,
  Pause,
  ExternalLink
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSupabase } from '@/providers/supabase-provider'
import {
  useAppointments,
  useTherapists,
  usePatientsForAppointments,
  useServices,
  useUpdateAppointment,
  type Appointment
} from '@/hooks/use-appointments-adapter'
import { useDebounce } from '@/hooks/use-debounce'
import { AppointmentListSkeleton } from '@/components/skeletons/appointment-skeleton'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, addWeeks, addMonths, subDays, subWeeks, subMonths, isSameDay, parseISO, addMinutes } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useToast } from '@/hooks/use-toast'
import { Suspense } from 'react'
import { LazyAppointmentModal } from '@/components/lazy'

type ViewMode = 'day' | 'week' | 'month'

// Helper function to get status color and icon
const getStatusStyle = (status: string) => {
  switch (status) {
    case 'scheduled':
      return {
        bg: 'bg-blue-100',
        border: 'border-blue-500',
        text: 'text-blue-900',
        badge: 'bg-blue-100 text-blue-800',
        icon: Clock
      }
    case 'confirmed':
      return {
        bg: 'bg-cyan-100',
        border: 'border-cyan-500',
        text: 'text-cyan-900',
        badge: 'bg-cyan-100 text-cyan-800',
        icon: Clock
      }
    case 'completed':
      return {
        bg: 'bg-green-100',
        border: 'border-green-500',
        text: 'text-green-900',
        badge: 'bg-green-100 text-green-800',
        icon: CheckCircle
      }
    case 'cancelled':
      return {
        bg: 'bg-red-100',
        border: 'border-red-500',
        text: 'text-red-900',
        badge: 'bg-red-100 text-red-800',
        icon: XCircle
      }
    case 'no_show':
      return {
        bg: 'bg-gray-100',
        border: 'border-gray-500',
        text: 'text-gray-900',
        badge: 'bg-gray-100 text-gray-800',
        icon: AlertCircle
      }
    case 'rescheduled':
      return {
        bg: 'bg-yellow-100',
        border: 'border-yellow-500',
        text: 'text-yellow-900',
        badge: 'bg-yellow-100 text-yellow-800',
        icon: Pause
      }
    default:
      return {
        bg: 'bg-purple-100',
        border: 'border-purple-500',
        text: 'text-purple-900',
        badge: 'bg-purple-100 text-purple-800',
        icon: Clock
      }
  }
}

export default function AgendaPage() {
  const { user, cedroUser } = useSupabase()
  const { toast } = useToast()
  const [viewMode, setViewMode] = useState<ViewMode>('week')
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTherapist, setSelectedTherapist] = useState<string>('')
  const [selectedPatient, setSelectedPatient] = useState<string>('')
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create')
  const [defaultDate, setDefaultDate] = useState<Date | undefined>(undefined)
  const [defaultTime, setDefaultTime] = useState<string | undefined>(undefined)
  const [draggedAppointment, setDraggedAppointment] = useState<Appointment | null>(null)
  const [dragOverHour, setDragOverHour] = useState<number | null>(null)

  // Debounce search term
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  // Update appointment mutation for drag and drop
  const { mutate: updateAppointmentForReschedule } = useUpdateAppointment()

  const getDateRange = () => {
    switch (viewMode) {
      case 'day':
        return {
          startDate: format(currentDate, 'yyyy-MM-dd'),
          endDate: format(currentDate, 'yyyy-MM-dd')
        }
      case 'week':
        return {
          startDate: format(startOfWeek(currentDate, { locale: ptBR }), 'yyyy-MM-dd'),
          endDate: format(endOfWeek(currentDate, { locale: ptBR }), 'yyyy-MM-dd')
        }
      case 'month':
        return {
          startDate: format(startOfMonth(currentDate), 'yyyy-MM-dd'),
          endDate: format(endOfMonth(currentDate), 'yyyy-MM-dd')
        }
    }
  }

  // React Query hooks
  const { startDate, endDate } = getDateRange()
  const therapistId = cedroUser?.role === 'therapist' ? cedroUser.id : undefined

  console.log('🔍 AgendaPage - Date range:', { startDate, endDate, currentDate })

  const appointmentsQuery = useAppointments(
    new Date(startDate),
    new Date(endDate),
    therapistId
  )
  const appointments = (appointmentsQuery.data || []) as Appointment[]
  const appointmentsLoading = appointmentsQuery.isLoading

  const { data: therapistsData = [] } = useTherapists()
  const { data: patientsData = [] } = usePatientsForAppointments()
  const { data: servicesData = [] } = useServices()

  // Transform data to match component prop types
  const therapists = useMemo(() =>
    therapistsData.map(t => ({ id: t.id, name: t.name, email: t.email || '' })),
    [therapistsData]
  )

  const patients = useMemo(() =>
    patientsData.map(p => ({ id: p.id, name: p.full_name, email: p.email || '' })),
    [patientsData]
  )

  const services = useMemo(() =>
    servicesData.map(s => ({ id: s.id, name: s.name, duration_minutes: s.default_duration_min })),
    [servicesData]
  )

  const loading = appointmentsLoading

  const handleNewAppointment = useCallback((date?: Date, time?: string) => {
    setSelectedAppointment(null)
    setModalMode('create')
    setDefaultDate(date)
    setDefaultTime(time)
    setIsNewAppointmentOpen(true)
  }, [])

  const handleEditAppointment = useCallback((appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setModalMode('edit')
    setIsNewAppointmentOpen(true)
  }, [])

  const handleViewAppointment = useCallback((appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setModalMode('view')
    setIsNewAppointmentOpen(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setIsNewAppointmentOpen(false)
    setSelectedAppointment(null)
    setDefaultDate(undefined)
    setDefaultTime(undefined)
  }, [])

  const handleModalSave = useCallback(() => {
    // React Query will automatically refetch data
  }, [])

  // Drag and drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, appointment: Appointment) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', appointment.id)
    setDraggedAppointment(appointment)
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggedAppointment(null)
    setDragOverHour(null)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, hour?: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (hour !== undefined) {
      setDragOverHour(hour)
    }
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOverHour(null)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, targetDate: Date, hour: number) => {
    e.preventDefault()
    e.stopPropagation()

    if (!draggedAppointment) return

    // Don't allow dropping on same time
    const startHour = new Date(draggedAppointment.start_at).getHours()
    if (startHour === hour && isSameDay(new Date(draggedAppointment.start_at), targetDate)) {
      toast({
        title: 'Info',
        description: 'Solte em um horário diferente para remarcar'
      })
      setDraggedAppointment(null)
      setDragOverHour(null)
      return
    }

    // Calculate duration
    const startTime = parseISO(draggedAppointment.start_at)
    const endTime = parseISO(draggedAppointment.end_at)
    const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60)

    // Create new times
    const newStartDateTime = new Date(targetDate)
    newStartDateTime.setHours(hour, 0, 0, 0)
    const newEndDateTime = addMinutes(newStartDateTime, durationMinutes)

    // Update appointment
    updateAppointmentForReschedule(
      {
        id: draggedAppointment.id,
        data: {
          patient_id: draggedAppointment.patient_id,
          therapist_id: draggedAppointment.therapist_id,
          service_id: draggedAppointment.service_id,
          care_plan_id: draggedAppointment.care_plan_id,
          status: draggedAppointment.status,
          start_at: newStartDateTime.toISOString(),
          end_at: newEndDateTime.toISOString(),
          channel: draggedAppointment.channel,
          origin_message_id: draggedAppointment.origin_message_id,
          notes: draggedAppointment.notes,
          meet_link: draggedAppointment.meet_link
        }
      },
      {
        onSuccess: () => {
          toast({
            title: 'Sucesso',
            description: `Agendamento remarcado para ${format(newStartDateTime, 'dd/MM/yyyy HH:mm', { locale: ptBR })}`
          })
        },
        onError: (error: any) => {
          toast({
            title: 'Erro',
            description: error.message || 'Erro ao remarcar agendamento',
            variant: 'destructive'
          })
        }
      }
    )

    setDraggedAppointment(null)
    setDragOverHour(null)
  }, [draggedAppointment, updateAppointmentForReschedule, toast])

  const navigateDate = (direction: 'prev' | 'next') => {
    switch (viewMode) {
      case 'day':
        setCurrentDate(direction === 'next' ? addDays(currentDate, 1) : subDays(currentDate, 1))
        break
      case 'week':
        setCurrentDate(direction === 'next' ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1))
        break
      case 'month':
        setCurrentDate(direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1))
        break
    }
  }

  const getFilteredAppointments = useMemo(() => {
    return appointments.filter(appointment => {
      const matchesSearch = !debouncedSearchTerm ||
        appointment.patient_name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        appointment.service_name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())

      const matchesTherapist = !selectedTherapist || appointment.therapist_id === selectedTherapist
      const matchesPatient = !selectedPatient || appointment.patient_id === selectedPatient

      return matchesSearch && matchesTherapist && matchesPatient
    })
  }, [appointments, debouncedSearchTerm, selectedTherapist, selectedPatient])

  const getAppointmentsByDate = useCallback((date: Date) => {
    // Use local date string (YYYY-MM-DD) without timezone conversion
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`

    const dayAppointments = getFilteredAppointments.filter(appointment => {
      if (!appointment.start_at) return false

      // Parse appointment date without timezone conversion
      const apptDate = new Date(appointment.start_at)
      const apptYear = apptDate.getFullYear()
      const apptMonth = String(apptDate.getMonth() + 1).padStart(2, '0')
      const apptDay = String(apptDate.getDate()).padStart(2, '0')
      const apptDateStr = `${apptYear}-${apptMonth}-${apptDay}`

      return apptDateStr === dateStr
    })

    console.log('🗓️ Getting appointments for date:', {
      date: dateStr,
      totalAppointments: appointments.length,
      filteredAppointments: getFilteredAppointments.length,
      dayAppointments: dayAppointments.length,
      sampleAppointment: dayAppointments[0]
    })
    return dayAppointments
  }, [getFilteredAppointments, appointments.length])

  const getAppointmentStats = useMemo(() => {
    return {
      total: getFilteredAppointments.length,
      scheduled: getFilteredAppointments.filter(a => a.status === 'scheduled').length,
      completed: getFilteredAppointments.filter(a => a.status === 'completed').length,
      cancelled: getFilteredAppointments.filter(a => a.status === 'cancelled').length
    }
  }, [getFilteredAppointments])

  const formatDateHeader = () => {
    switch (viewMode) {
      case 'day':
        return format(currentDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })
      case 'week':
        const weekStart = startOfWeek(currentDate, { locale: ptBR })
        const weekEnd = endOfWeek(currentDate, { locale: ptBR })
        return `${format(weekStart, 'd MMM', { locale: ptBR })} - ${format(weekEnd, 'd MMM yyyy', { locale: ptBR })}`
      case 'month':
        return format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })
    }
  }

  const renderDayView = () => {
    const dayAppointments = getAppointmentsByDate(currentDate)
    const hours = Array.from({ length: 24 }, (_, i) => i)

    // Group appointments by hour for positioning
    const appointmentsByHour: Record<number, Appointment[]> = {}
    dayAppointments.forEach((appointment) => {
      const hour = new Date(appointment.start_at).getHours()
      if (!appointmentsByHour[hour]) {
        appointmentsByHour[hour] = []
      }
      appointmentsByHour[hour].push(appointment)
    })

    return (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Mini Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Calendário</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                if (date) {
                  setSelectedDate(date)
                  setCurrentDate(date)
                }
              }}
              className="rounded-md border"
              locale={ptBR}
            />
          </CardContent>
        </Card>

        {/* Timeline View with Time Axis */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>{formatDateHeader()}</CardTitle>
            <CardDescription>
              {dayAppointments.length} agendamento(s) para este dia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[700px] w-full border rounded-lg">
              <div className="flex">
                {/* Time Axis */}
                <div className="w-16 flex-shrink-0 pt-2">
                  {hours.map((hour) => (
                    <div
                      key={hour}
                      className="h-20 text-right pr-2 text-xs font-medium text-gray-500 border-t border-gray-100"
                    >
                      {String(hour).padStart(2, '0')}:00
                    </div>
                  ))}
                </div>

                {/* Appointments Grid */}
                <div className="flex-1 relative border-l border-gray-200">
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center space-y-4">
                        <div className="animate-spin">
                          <CalendarIcon className="h-12 w-12 text-blue-500 mx-auto" />
                        </div>
                        <p className="text-sm text-gray-600">Carregando agendamentos...</p>
                      </div>
                    </div>
                  ) : dayAppointments.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <CalendarIcon className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                      <p className="text-sm font-medium mb-1">Nenhum agendamento para este dia</p>
                      <p className="text-xs text-gray-400">Clique em qualquer horário para criar um novo agendamento</p>
                    </div>
                  ) : (
                    <>
                      {hours.map((hour) => (
                        <div
                          key={hour}
                          className={`h-20 border-b border-gray-100 relative group hover:bg-blue-50 transition-colors cursor-pointer ${
                            dragOverHour === hour ? 'bg-blue-100 ring-2 ring-blue-500' : ''
                          }`}
                          onDragOver={(e) => handleDragOver(e, hour)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, currentDate, hour)}
                          onClick={() => {
                            handleNewAppointment(currentDate, `${String(hour).padStart(2, '0')}:00`)
                          }}
                        >
                          {appointmentsByHour[hour]?.map((appointment, idx) => {
                            const startHour = new Date(appointment.start_at).getHours()
                            const startMinutes = new Date(appointment.start_at).getMinutes()
                            const endHour = new Date(appointment.end_at).getHours()
                            const endMinutes = new Date(appointment.end_at).getMinutes()

                            const durationMinutes = (endHour - startHour) * 60 + (endMinutes - startMinutes)
                            const topOffset = (startMinutes / 60) * 80 // 80px per hour
                            const height = (durationMinutes / 60) * 80 // Height proportional to duration

                            const statusStyle = getStatusStyle(appointment.status)
                            const StatusIcon = statusStyle.icon

                            return (
                              <div
                                key={appointment.id}
                                draggable
                                className={`absolute left-1 right-1 p-2 rounded border-l-4 text-xs overflow-hidden ${statusStyle.bg} ${statusStyle.border} hover:opacity-90 transition-all cursor-move shadow-sm hover:shadow-md ${
                                  appointment.status === 'cancelled' ? 'opacity-60' : ''
                                } ${draggedAppointment?.id === appointment.id ? 'opacity-50 ring-2 ring-offset-2' : ''}`}
                                style={{
                                  top: `${topOffset}px`,
                                  minHeight: `${Math.max(height, 30)}px`,
                                  zIndex: 10 + idx
                                }}
                                onDragStart={(e) => handleDragStart(e, appointment)}
                                onDragEnd={handleDragEnd}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEditAppointment(appointment)
                                }}
                              >
                                <div className="flex items-center justify-between gap-0.5 mb-0.5">
                                  <div className="font-bold text-xs">
                                    {format(parseISO(appointment.start_at), 'HH:mm')}
                                  </div>
                                  <div className="flex items-center gap-0.5">
                                    <StatusIcon className="h-2.5 w-2.5 flex-shrink-0" />
                                    {appointment.origin === 'google' && (
                                      <span title="Google Calendar">📅</span>
                                    )}
                                  </div>
                                </div>
                                <div className={`truncate font-semibold text-xs ${statusStyle.text}`}>
                                  {appointment.patient_name}
                                </div>
                                {appointment.service_name && (
                                  <div className="truncate text-xs opacity-75 leading-tight">
                                    {appointment.service_name}
                                  </div>
                                )}
                                {appointment.summary && appointment.summary !== 'Sessão - Cedro' && (
                                  <div className="truncate text-xs italic opacity-70 text-gray-700 leading-tight">
                                    &quot;{appointment.summary}&quot;
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { locale: ptBR })
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
    const hours = Array.from({ length: 24 }, (_, i) => i)

    return (
      <Card>
        <CardHeader>
          <CardTitle>{formatDateHeader()}</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="w-full border rounded-lg">
            <div className="flex">
              {/* Time Axis */}
              <div className="w-16 flex-shrink-0 pt-8">
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="h-20 text-right pr-2 text-xs font-medium text-gray-500 border-t border-gray-100"
                  >
                    {String(hour).padStart(2, '0')}:00
                  </div>
                ))}
              </div>

              {/* Days Grid */}
              <div className="flex flex-1 border-l border-gray-200">
                {weekDays.map((day) => {
                  const dayAppointments = getAppointmentsByDate(day)
                  const isToday = isSameDay(day, new Date())

                  // Group appointments by hour
                  const appointmentsByHour: Record<number, Appointment[]> = {}
                  dayAppointments.forEach((appointment) => {
                    const hour = new Date(appointment.start_at).getHours()
                    if (!appointmentsByHour[hour]) {
                      appointmentsByHour[hour] = []
                    }
                    appointmentsByHour[hour].push(appointment)
                  })

                  return (
                    <div
                      key={day.toISOString()}
                      className={`flex-1 border-r border-gray-200 min-w-[140px] ${
                        isToday ? 'bg-blue-50' : ''
                      }`}
                    >
                      {/* Day Header */}
                      <div
                        className={`text-center p-2 border-b border-gray-200 sticky top-0 z-20 ${
                          isToday ? 'bg-blue-100 text-blue-900' : 'bg-gray-50'
                        }`}
                      >
                        <div className="text-sm font-medium">
                          {format(day, 'EEE', { locale: ptBR })}
                        </div>
                        <div className="text-lg font-bold">
                          {format(day, 'd')}
                        </div>
                      </div>

                      {/* Time Grid */}
                      <div className="relative">
                        {hours.map((hour) => (
                          <div
                            key={hour}
                            className={`h-20 border-b border-gray-100 relative group hover:bg-blue-100 transition-colors cursor-pointer ${
                              dragOverHour === hour ? 'bg-blue-300 ring-2 ring-blue-500' : ''
                            }`}
                            onDragOver={(e) => handleDragOver(e, hour)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, day, hour)}
                            onClick={() => {
                              handleNewAppointment(day, `${String(hour).padStart(2, '0')}:00`)
                            }}
                          >
                            {appointmentsByHour[hour]?.map((appointment, idx) => {
                              const startHour = new Date(appointment.start_at).getHours()
                              const startMinutes = new Date(appointment.start_at).getMinutes()
                              const endHour = new Date(appointment.end_at).getHours()
                              const endMinutes = new Date(appointment.end_at).getMinutes()

                              const durationMinutes = (endHour - startHour) * 60 + (endMinutes - startMinutes)
                              const topOffset = (startMinutes / 60) * 80 // 80px per hour
                              const height = (durationMinutes / 60) * 80 // Height proportional to duration

                              const statusStyle = getStatusStyle(appointment.status)
                              const StatusIcon = statusStyle.icon

                              return (
                                <div
                                  key={appointment.id}
                                  draggable
                                  className={`absolute left-0.5 right-0.5 p-1 rounded border-l-4 text-xs overflow-hidden ${statusStyle.bg} ${statusStyle.border} hover:opacity-90 transition-all cursor-move shadow-sm hover:shadow-md ${
                                    appointment.status === 'cancelled' ? 'opacity-60' : ''
                                  } ${draggedAppointment?.id === appointment.id ? 'opacity-50 ring-2 ring-offset-1' : ''}`}
                                  style={{
                                    top: `${topOffset}px`,
                                    minHeight: `${Math.max(height, 24)}px`,
                                    zIndex: 10 + idx
                                  }}
                                  onDragStart={(e) => handleDragStart(e, appointment)}
                                  onDragEnd={handleDragEnd}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleEditAppointment(appointment)
                                  }}
                                >
                                  <div className="flex items-center justify-between gap-0.5 mb-0.5">
                                    <div className="font-bold text-xs">
                                      {format(parseISO(appointment.start_at), 'HH:mm')}
                                    </div>
                                    <div className="flex items-center gap-0.5">
                                      <StatusIcon className="h-2 w-2 flex-shrink-0" />
                                      {appointment.origin === 'google' && (
                                        <span title="Google Calendar">📅</span>
                                      )}
                                    </div>
                                  </div>
                                  <div className={`truncate font-semibold text-xs ${statusStyle.text}`}>
                                    {appointment.patient_name}
                                  </div>
                                  {appointment.service_name && (
                                    <div className="truncate text-xs opacity-70 leading-tight">
                                      {appointment.service_name}
                                    </div>
                                  )}
                                  {appointment.summary && appointment.summary !== 'Sessão - Cedro' && (
                                    <div className="truncate text-xs italic opacity-65 leading-tight text-gray-700">
                                      &quot;{appointment.summary}&quot;
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    )
  }

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const calendarStart = startOfWeek(monthStart, { locale: ptBR })
    const calendarEnd = endOfWeek(monthEnd, { locale: ptBR })
    
    const calendarDays: Date[] = []
    let day = calendarStart
    
    while (day <= calendarEnd) {
      calendarDays.push(day)
      day = addDays(day, 1)
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>{formatDateHeader()}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dayName) => (
              <div key={dayName} className="p-2 text-center text-sm font-medium text-gray-500">
                {dayName}
              </div>
            ))}
            {calendarDays.map((day) => {
              const dayAppointments = getAppointmentsByDate(day)
              const isCurrentMonth = day.getMonth() === currentDate.getMonth()
              const isToday = isSameDay(day, new Date())
              
              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[100px] p-1 border cursor-pointer hover:bg-gray-50 ${
                    !isCurrentMonth ? 'bg-gray-100 text-gray-400' : ''
                  } ${isToday ? 'bg-blue-50 border-blue-300' : ''}`}
                  onClick={(e) => {
                    // Check if click was on an appointment
                    const target = e.target as HTMLElement
                    const appointmentElement = target.closest('.appointment-item')
                    
                    if (appointmentElement) {
                      // Click was on an appointment - prevent day click
                      e.stopPropagation()
                      return
                    }
                    
                    // Click was on empty space - open new appointment modal with selected date
                    handleNewAppointment(day)
                  }}
                >
                  <div className={`text-sm font-medium ${isToday ? 'text-blue-600' : ''}`}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-1 mt-1">
                    {dayAppointments.slice(0, 3).map((appointment) => {
                      const appointmentStatusStyle = getStatusStyle(appointment.status)
                      return (
                        <div
                          key={appointment.id}
                          className={`appointment-item text-xs p-1 rounded cursor-pointer transition-all hover:shadow-sm ${appointmentStatusStyle.bg} hover:opacity-80 ${
                            appointment.status === 'cancelled' ? 'opacity-60' : ''
                          }`}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditAppointment(appointment)
                          }}
                          title={`${appointment.patient_name}${appointment.summary ? ` - ${appointment.summary}` : ''}`}
                        >
                          <div className="flex items-center gap-0.5 mb-0.5">
                            <span className="font-bold">{format(parseISO(appointment.start_at), 'HH:mm')}</span>
                            {appointment.origin === 'google' && (
                              <span title="Google Calendar">📅</span>
                            )}
                          </div>
                          <div className="truncate font-semibold leading-tight">{appointment.patient_name}</div>
                          {appointment.summary && appointment.summary !== 'Sessão - Cedro' && (
                            <div className="truncate text-xs italic opacity-70 leading-tight">
                              &quot;{appointment.summary}&quot;
                            </div>
                          )}
                        </div>
                      )
                    })}
                    {dayAppointments.length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{dayAppointments.length - 3} mais
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    )
  }

  const stats = getAppointmentStats

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Agenda</h1>
            <p className="text-gray-600">Gerencie seus agendamentos</p>
          </div>
          <Button onClick={() => handleNewAppointment()}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Agendamento
          </Button>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar por paciente ou serviço..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              {/* Filtro por terapeuta - apenas para administradores */}
              {cedroUser?.role === 'admin' && (
                <Select
                  value={selectedTherapist || 'todos'}
                  onValueChange={(value) => setSelectedTherapist(value === 'todos' ? '' : value)}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Terapeuta" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Terapeutas</SelectItem>
                    {therapists.map(therapist => (
                      <SelectItem key={therapist.id} value={therapist.id}>
                        {therapist.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Filtro por paciente - para admin e terapeutas */}
              {(cedroUser?.role === 'admin' || cedroUser?.role === 'therapist') && (
                <Select
                  value={selectedPatient || 'todos'}
                  onValueChange={(value) => setSelectedPatient(value === 'todos' ? '' : value)}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Pacientes</SelectItem>
                    {patients.map(patient => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Button
                variant="outline"
                onClick={() => setCurrentDate(new Date())}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                Hoje
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* View Controls */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-semibold ml-4">{formatDateHeader()}</h2>
          </div>
          
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
            <TabsList>
              <TabsTrigger value="day">Dia</TabsTrigger>
              <TabsTrigger value="week">Semana</TabsTrigger>
              <TabsTrigger value="month">Mês</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Calendar Views */}
        <Tabs value={viewMode} className="space-y-4">
          <TabsContent value="day">
            {renderDayView()}
          </TabsContent>
          <TabsContent value="week">
            {renderWeekView()}
          </TabsContent>
          <TabsContent value="month">
            {renderMonthView()}
          </TabsContent>
        </Tabs>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <CalendarIcon className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Agendados</p>
                  <p className="text-2xl font-bold text-green-600">{stats.scheduled}</p>
                </div>
                <Clock className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Concluídos</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Cancelados</p>
                  <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
                </div>
                <Clock className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Suspense fallback={<div>Carregando...</div>}>
        <LazyAppointmentModal
          isOpen={isNewAppointmentOpen}
          onClose={handleCloseModal}
          onSave={handleModalSave}
          appointment={selectedAppointment}
          mode={modalMode}
          therapists={therapists}
          patients={patients}
          services={services}
          defaultDate={defaultDate}
          defaultTime={defaultTime}
          cedroUser={cedroUser}
        />
      </Suspense>
    </AppShell>
  )
}

// Status Labels helper
const getStatusLabel = (status: string) => {
  switch (status) {
    case 'scheduled': return 'Agendado'
    case 'confirmed': return 'Confirmado'
    case 'completed': return 'Concluído'
    case 'cancelled': return 'Cancelado'
    case 'no_show': return 'Não Compareceu'
    case 'rescheduled': return 'Remarcado'
    default: return status
  }
}

// Appointment Card Component
const AppointmentCard = memo(function AppointmentCard({
  appointment,
  onUpdate,
  onEdit,
  onView,
  compact = false
}: {
  appointment: Appointment;
  onUpdate: () => void;
  onEdit: (appointment: Appointment) => void;
  onView: (appointment: Appointment) => void;
  compact?: boolean;
}) {
  const statusStyle = getStatusStyle(appointment.status)
  const StatusIcon = statusStyle.icon

  if (compact) {
    return (
      <div className={`p-2 text-xs rounded border-l-2 transition-all hover:shadow-md group ${
        statusStyle.bg
      } ${statusStyle.border} ${
        appointment.status === 'cancelled' ? 'opacity-60' : ''
      }`}>
        <div className="flex items-center justify-between gap-1">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 mb-0.5">
              <div className="font-medium truncate">
                {format(parseISO(appointment.start_at), 'HH:mm')}
              </div>
              <StatusIcon className="h-3 w-3 flex-shrink-0" />
              {appointment.origin === 'google' && (
                <span className="text-blue-600" title="Google Calendar">📅</span>
              )}
            </div>
            <div className={`truncate ${statusStyle.text} font-semibold`}>
              {appointment.patient_name}
            </div>
            {appointment.summary && appointment.summary !== 'Sessão - Cedro' && (
              <div className="truncate text-gray-700 text-xs italic mt-0.5">
                {appointment.summary}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {appointment.html_link && (
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  window.open(appointment.html_link, '_blank')
                }}
                title="Abrir no Google Calendar"
              >
                <ExternalLink className="h-2.5 w-2.5" />
              </Button>
            )}
            <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => onEdit(appointment)}>
              <Edit className="h-2.5 w-2.5" />
            </Button>
            <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => onView(appointment)}>
              <MoreHorizontal className="h-2.5 w-2.5" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex items-center justify-between p-4 border rounded-lg transition-all hover:shadow-md hover:border-gray-400 ${
      statusStyle.bg
    } ${
      appointment.status === 'cancelled' ? 'opacity-60' : ''
    }`}>
      <div className="flex items-center space-x-4 flex-1">
        <div className={`flex items-center justify-center w-12 h-12 ${statusStyle.bg} rounded-full border-2 ${statusStyle.border}`}>
          <StatusIcon className="h-6 w-6" style={{ color: statusStyle.border.replace('border-', '').replace('-500', '') }} />
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2 flex-wrap gap-1">
            <h3 className={`font-semibold ${statusStyle.text}`}>{appointment.patient_name}</h3>
            <Badge className={statusStyle.badge}>
              {getStatusLabel(appointment.status)}
            </Badge>
            {/* Origin Badge */}
            {appointment.origin === 'google' && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                Google Calendar
              </Badge>
            )}
          </div>

          {/* Summary if different from default */}
          {appointment.summary && appointment.summary !== 'Sessão - Cedro' && (
            <p className="text-sm font-medium text-gray-700 mt-1">
              {appointment.summary}
            </p>
          )}

          <p className="text-sm text-gray-600">{appointment.service_name}</p>

          <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1 flex-wrap gap-2">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {format(parseISO(appointment.start_at), 'HH:mm')} - {format(parseISO(appointment.end_at), 'HH:mm')}
            </span>
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {appointment.therapist_name}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-1">
        {/* Google Calendar Link */}
        {appointment.html_link && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(appointment.html_link, '_blank')}
            title="Abrir no Google Calendar"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={() => onEdit(appointment)}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onView(appointment)}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
})