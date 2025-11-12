'use client'

import { useState, memo, useCallback, useMemo, useEffect } from 'react'
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
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTherapist, setSelectedTherapist] = useState<string>('')
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(new Set(['scheduled', 'completed']))
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if no modal is open and no input is focused
      const isInputFocused = document.activeElement?.tagName === 'INPUT' ||
                            document.activeElement?.tagName === 'TEXTAREA'

      if (isInputFocused || isNewAppointmentOpen) return

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault()
        handleNewAppointment()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        navigateDate('prev')
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        navigateDate('next')
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault()
        setCurrentDate(new Date())
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleNewAppointment, isNewAppointmentOpen])

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

  const getDateRangeLabel = (direction: 'prev' | 'next') => {
    const newDate = direction === 'next'
      ? (viewMode === 'day' ? addDays(currentDate, 1) : viewMode === 'week' ? addWeeks(currentDate, 1) : addMonths(currentDate, 1))
      : (viewMode === 'day' ? subDays(currentDate, 1) : viewMode === 'week' ? subWeeks(currentDate, 1) : subMonths(currentDate, 1))

    switch (viewMode) {
      case 'day':
        return format(newDate, "dd 'de' MMM", { locale: ptBR })
      case 'week':
        const weekStart = startOfWeek(newDate, { locale: ptBR })
        const weekEnd = endOfWeek(newDate, { locale: ptBR })
        return `${format(weekStart, 'd', { locale: ptBR })}-${format(weekEnd, 'd MMM', { locale: ptBR })}`
      case 'month':
        return format(newDate, "MMM yyyy", { locale: ptBR })
    }
  }

  const getFilteredAppointments = useMemo(() => {
    return appointments.filter(appointment => {
      const matchesSearch = !debouncedSearchTerm ||
        appointment.patient_name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        appointment.service_name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())

      const matchesTherapist = !selectedTherapist || appointment.therapist_id === selectedTherapist

      const matchesStatus = selectedStatuses.size === 0 || selectedStatuses.has(appointment.status)

      return matchesSearch && matchesTherapist && matchesStatus
    })
  }, [appointments, debouncedSearchTerm, selectedTherapist, selectedStatuses])

  const getAppointmentsByDate = useCallback((date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const dayAppointments = getFilteredAppointments.filter(appointment => {
      // Parse the start_at string to Date and format it to compare dates
      const appointmentDate = format(new Date(appointment.start_at), 'yyyy-MM-dd')
      return appointmentDate === dateStr
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

  const toggleStatusFilter = (status: string) => {
    const newStatuses = new Set(selectedStatuses)
    if (newStatuses.has(status)) {
      newStatuses.delete(status)
    } else {
      newStatuses.add(status)
    }
    setSelectedStatuses(newStatuses)
  }

  const renderDayView = () => {
    const dayAppointments = getAppointmentsByDate(currentDate)

    return (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar: Calendar + Stats */}
        <div className="space-y-6">
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

          {/* Quick Stats for Day View */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estatísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-motherduck-dark">Total</span>
                <span className="font-bold text-lg">{getAppointmentStats.total}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-600">Agendados</span>
                <span className="font-bold text-lg text-green-600">{getAppointmentStats.scheduled}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-600">Concluídos</span>
                <span className="font-bold text-lg text-blue-600">{getAppointmentStats.completed}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-red-600">Cancelados</span>
                <span className="font-bold text-lg text-red-600">{getAppointmentStats.cancelled}</span>
              </div>
            </CardContent>
          </Card>
        </div>

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
                  <CalendarIcon className="mx-auto h-12 w-12 text-motherduck-dark/30" />
                  <h3 className="mt-4 text-body-md font-bold text-motherduck-dark">
                    {getFilteredAppointments.length === 0
                      ? 'Nenhum agendamento'
                      : 'Sem agendamentos nesta data'}
                  </h3>
                  <p className="mt-2 text-sm text-motherduck-dark/60">
                    {getFilteredAppointments.length === 0
                      ? 'Aplique novos agendamentos para visualizá-los aqui'
                      : 'Selecione outro dia ou ajuste seus filtros'}
                  </p>
                  {selectedStatuses.size < 4 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedStatuses(new Set(['scheduled', 'completed', 'cancelled', 'no_show']))}
                      className="mt-4"
                    >
                      Ver todos os status
                    </Button>
                  )}
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
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

    return (
      <Card>
        <CardHeader>
          <CardTitle>{formatDateHeader()}</CardTitle>
        </CardHeader>
        <CardContent>
          {isMobile ? (
            // Mobile: Single column layout with day selector
            <div className="space-y-4">
              {weekDays.map((day) => {
                const dayAppointments = getAppointmentsByDate(day)
                const isToday = isSameDay(day, new Date())

                return (
                  <div key={day.toISOString()} className="space-y-2">
                    <div
                      className={`text-center p-3 rounded-lg cursor-pointer transition-colors ${
                        isToday
                          ? 'bg-motherduck-teal text-white'
                          : selectedDate ? isSameDay(day, selectedDate) : false
                            ? 'bg-motherduck-teal/20'
                            : 'bg-gray-50'
                      }`}
                      onClick={() => {
                        setSelectedDate(day)
                        setCurrentDate(day)
                      }}
                    >
                      <div className="text-sm font-medium">
                        {format(day, 'EEE', { locale: ptBR })}
                      </div>
                      <div className="text-lg font-bold">
                        {format(day, 'd')}
                      </div>
                    </div>
                    {dayAppointments.length > 0 && (
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
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            // Desktop: 7-column grid layout
            <div className="grid grid-cols-7 gap-3 overflow-x-auto">
              {weekDays.map((day) => {
                const dayAppointments = getAppointmentsByDate(day)
                const isToday = isSameDay(day, new Date())

                return (
                  <div key={day.toISOString()} className="space-y-2 min-w-[150px]">
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
          )}
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

  return (
    <AppShell>
      <div className="space-y-spacing-m">
        {/* Header */}
        <div className="flex justify-between items-center border-b-standard border-motherduck-dark pb-spacing-xs">
          <div>
            <h1 className="font-mono text-heading-2 font-bold text-motherduck-dark uppercase tracking-wider">AGENDA</h1>
            <p className="text-body-md text-motherduck-dark/70 mt-spacing-xxs">Gerencie seus agendamentos</p>
          </div>
          <Button variant="teal" onClick={() => handleNewAppointment()}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Agendamento
          </Button>
        </div>

        {/* Filters and Search */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-spacing-m">
            <div className="space-y-spacing-m">
              <div className="flex flex-col sm:flex-row gap-spacing-xxs">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-motherduck-dark/50 h-5 w-5" />
                    <Input
                      placeholder="Buscar por paciente ou serviço..."
                      className="pl-12 placeholder:text-motherduck-dark/40"
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
                    <SelectTrigger className="w-[200px] border-standard border-motherduck-dark rounded-minimal">
                      <SelectValue placeholder="Terapeuta" />
                    </SelectTrigger>
                    <SelectContent className="border-standard border-motherduck-dark rounded-minimal">
                      <SelectItem value="todos">Todos os terapeutas</SelectItem>
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

              {/* Status Filters */}
              <div className="flex flex-wrap gap-spacing-xxs items-center">
                <span className="text-sm font-medium text-motherduck-dark">Status:</span>
                {[
                  { value: 'scheduled', label: 'Agendado' },
                  { value: 'completed', label: 'Concluído' },
                  { value: 'cancelled', label: 'Cancelado' },
                  { value: 'no_show', label: 'Não Compareceu' }
                ].map(status => (
                  <button
                    key={status.value}
                    onClick={() => toggleStatusFilter(status.value)}
                    className={`px-3 py-1 text-sm font-mono border-standard rounded-minimal transition-colors ${
                      selectedStatuses.has(status.value)
                        ? 'bg-motherduck-teal text-white border-motherduck-teal'
                        : 'border-motherduck-dark/30 text-motherduck-dark hover:bg-motherduck-dark/5'
                    }`}
                    aria-pressed={selectedStatuses.has(status.value)}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* View Controls */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-spacing-xxs">
            <div className="relative group">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateDate('prev')}
                title={`Anterior (${getDateRangeLabel('prev')}) - Atalho: ← `}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="absolute bottom-full left-0 mb-2 bg-motherduck-dark text-white px-2 py-1 text-xs rounded pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                ← para anterior
              </span>
            </div>
            <div className="relative group">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateDate('next')}
                title={`Próximo (${getDateRangeLabel('next')}) - Atalho: →`}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <span className="absolute bottom-full left-0 mb-2 bg-motherduck-dark text-white px-2 py-1 text-xs rounded pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                → para próximo
              </span>
            </div>
            <h2 className="font-mono text-heading-5 font-bold text-motherduck-dark uppercase ml-spacing-xs">{formatDateHeader()}</h2>
          </div>

          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
            <TabsList className="border-standard border-motherduck-dark">
              <TabsTrigger value="day" className="font-mono text-caption">Dia</TabsTrigger>
              <TabsTrigger value="week" className="font-mono text-caption">Semana</TabsTrigger>
              <TabsTrigger value="month" className="font-mono text-caption">Mês</TabsTrigger>
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
      <div className={`p-2 text-caption bg-motherduck-blue/10 rounded-minimal border-l-standard border-motherduck-teal transition-all hover:bg-motherduck-teal/20 ${
        appointment.status === 'cancelled' ? 'opacity-50' : ''
      }`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="font-mono font-bold truncate text-motherduck-dark">
              {format(parseISO(appointment.start_at), 'HH:mm')}
            </div>
            <div className="truncate text-motherduck-dark/70">
              {appointment.patient_name}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => onEdit(appointment)}
              aria-label="Editar agendamento"
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => onView(appointment)}
              aria-label="Ver detalhes"
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex items-center justify-between p-4 border-standard border-motherduck-dark rounded-minimal transition-all hover:bg-motherduck-beige hover:shadow-md ${
      appointment.status === 'cancelled' ? 'opacity-50' : ''
    }`}>
      <div className="flex items-center space-x-4 flex-1">
        <div className="flex flex-col items-center justify-center w-16 bg-motherduck-teal rounded-minimal border-standard border-motherduck-dark p-2">
          <div className="font-mono font-bold text-white text-heading-6">
            {format(parseISO(appointment.start_at), 'HH:mm')}
          </div>
          <div className="text-xs text-motherduck-beige mt-1">
            {format(parseISO(appointment.start_at), 'EEE', { locale: ptBR })}
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="font-mono font-bold text-body-md text-motherduck-dark">{appointment.patient_name}</h3>
            <Badge variant={getStatusColor(appointment.status)} className="border-standard border-motherduck-dark uppercase font-mono text-caption">
              {getStatusLabel(appointment.status)}
            </Badge>
          </div>
          <p className="text-body-sm text-motherduck-dark/70 mb-2">{appointment.service_name}</p>
          <div className="flex items-center space-x-4 text-caption text-motherduck-dark/60">
            <span className="flex items-center">
              <User className="mr-1 h-3 w-3" />
              {appointment.therapist_name}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(appointment)}
          aria-label="Editar agendamento"
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onView(appointment)}
          aria-label="Ver detalhes"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
})
