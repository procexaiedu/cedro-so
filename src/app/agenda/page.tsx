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
  MoreHorizontal
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSupabase } from '@/providers/supabase-provider'
import {
  useAppointments,
  useTherapists,
  usePatientsForAppointments,
  useServices,
  type Appointment
} from '@/hooks/use-appointments-adapter'
import { useDebounce } from '@/hooks/use-debounce'
import { AppointmentListSkeleton } from '@/components/skeletons/appointment-skeleton'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, addWeeks, addMonths, subDays, subWeeks, subMonths, isSameDay, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useToast } from '@/hooks/use-toast'
import { Suspense } from 'react'
import { LazyAppointmentModal } from '@/components/lazy'

type ViewMode = 'day' | 'week' | 'month'

export default function AgendaPage() {
  const { user, cedroUser } = useSupabase()
  const { toast } = useToast()
  const [viewMode, setViewMode] = useState<ViewMode>('week')
  const [currentDate, setCurrentDate] = useState(new Date('2025-01-27'))
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTherapist, setSelectedTherapist] = useState<string>('')
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create')
  const [defaultDate, setDefaultDate] = useState<Date | undefined>(undefined)
  const [defaultTime, setDefaultTime] = useState<string | undefined>(undefined)

  // Debounce search term
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

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
  
  const { data: appointments = [], isLoading: appointmentsLoading } = useAppointments(
    new Date(startDate),
    new Date(endDate),
    therapistId
  )
  
  const { data: therapists = [] } = useTherapists()
  const { data: patients = [] } = usePatientsForAppointments()
  const { data: services = [] } = useServices()
  
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
      
      return matchesSearch && matchesTherapist
    })
  }, [appointments, debouncedSearchTerm, selectedTherapist])

  const getAppointmentsByDate = useCallback((date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const dayAppointments = getFilteredAppointments.filter(appointment => {
      // Parse the start_at string to Date and format it to compare dates
      const appointmentDate = format(new Date(appointment.start_at), 'yyyy-MM-dd')
      return appointmentDate === dateStr
    })
    console.log('🗓️ Getting appointments for date:', { 
      date, 
      dateStr, 
      totalAppointments: appointments.length,
      filteredAppointments: getFilteredAppointments.length,
      dayAppointments: dayAppointments.length,
      appointments: dayAppointments
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

        {/* Appointments List */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>{formatDateHeader()}</CardTitle>
            <CardDescription>
              {dayAppointments.length} agendamento(s) para este dia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              {loading ? (
                <AppointmentListSkeleton count={5} />
              ) : dayAppointments.length === 0 ? (
                <div className="text-center py-12">
                  <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum agendamento</h3>
                  <p className="mt-1 text-sm text-gray-500">Não há agendamentos para este dia.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dayAppointments.map((appointment) => (
                    <AppointmentCard 
                  key={appointment.id} 
                  appointment={appointment} 
                  onUpdate={handleModalSave}
                  onEdit={handleEditAppointment}
                  onView={handleViewAppointment}
                />
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { locale: ptBR })
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

    return (
      <Card>
        <CardHeader>
          <CardTitle>{formatDateHeader()}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-4">
            {weekDays.map((day) => {
              const dayAppointments = getAppointmentsByDate(day)
              const isToday = isSameDay(day, new Date())
              
              return (
                <div key={day.toISOString()} className="space-y-2">
                  <div className={`text-center p-2 rounded-lg ${isToday ? 'bg-blue-100 text-blue-900' : 'bg-gray-50'}`}>
                    <div className="text-sm font-medium">
                      {format(day, 'EEE', { locale: ptBR })}
                    </div>
                    <div className="text-lg font-bold">
                      {format(day, 'd')}
                    </div>
                  </div>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-1">
                      {dayAppointments.map((appointment) => (
                        <AppointmentCard 
                          key={appointment.id} 
                          appointment={appointment} 
                          onUpdate={handleModalSave}
                          onEdit={handleEditAppointment}
                          onView={handleViewAppointment}
                          compact={true}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )
            })}
          </div>
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
                    {dayAppointments.slice(0, 3).map((appointment) => (
                      <div
                        key={appointment.id}
                        className="appointment-item text-xs p-1 bg-blue-100 rounded truncate cursor-pointer hover:bg-blue-200 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditAppointment(appointment)
                        }}
                      >
                        {format(parseISO(appointment.start_at), 'HH:mm')} {appointment.patient_name}
                      </div>
                    ))}
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
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'default'
      case 'completed': return 'secondary'
      case 'cancelled': return 'destructive'
      case 'no_show': return 'outline'
      default: return 'secondary'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Agendado'
      case 'completed': return 'Concluído'
      case 'cancelled': return 'Cancelado'
      case 'no_show': return 'Não Compareceu'
      default: return status
    }
  }

  if (compact) {
    return (
      <div className={`p-2 text-xs bg-blue-100 rounded border-l-2 border-blue-500 transition-colors hover:bg-blue-200 group ${
        appointment.status === 'cancelled' ? 'opacity-50' : ''
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">
              {format(parseISO(appointment.start_at), 'HH:mm')}
            </div>
            <div className="truncate text-gray-600">
              {appointment.patient_name}
            </div>
          </div>
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => onEdit(appointment)}>
              <Edit className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => onView(appointment)}>
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex items-center justify-between p-4 border rounded-lg transition-colors hover:bg-gray-50 ${
      appointment.status === 'cancelled' ? 'opacity-50' : ''
    }`}>
      <div className="flex items-center space-x-4">
        <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full">
          <Clock className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="font-medium">{appointment.patient_name}</h3>
            <Badge variant={getStatusColor(appointment.status)}>
              {getStatusLabel(appointment.status)}
            </Badge>
          </div>
          <p className="text-sm text-gray-500">{appointment.service_name}</p>
          <div className="flex items-center space-x-4 text-xs text-gray-400 mt-1">
            <span className="flex items-center">
              <Clock className="mr-1 h-3 w-3" />
              {format(parseISO(appointment.start_at), 'HH:mm')} - {format(parseISO(appointment.end_at), 'HH:mm')}
            </span>
            <span className="flex items-center">
              <User className="mr-1 h-3 w-3" />
              {appointment.therapist_name}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-2">
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