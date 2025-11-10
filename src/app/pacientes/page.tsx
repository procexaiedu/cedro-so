'use client'

import React, { useState, useMemo, memo, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Users, Calendar, Phone, Mail, MoreHorizontal, Edit, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import {
  Patient,
  PatientFilters,
  calculateAge,
  formatDate,
  getStatusBadgeVariant,
  getStatusText,
  getPatientStatus
} from '@/data/pacientes'
import { Suspense } from 'react'
import { LazyPatientForm, LazyPatientDetailDrawer, LazyPatientDeleteDialog } from '@/components/lazy'
import { PatientListSkeleton, PatientTableSkeleton } from '@/components/skeletons/patient-skeleton'
import { VirtualList } from '@/components/ui/virtual-list'
import { useSupabase } from '@/providers/supabase-provider'
import { usePatients, useTherapistsForFilter, usePatientStats } from '@/hooks/use-patients'
import { useDebounce } from '@/hooks/use-debounce'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'
import { PatientQuickActions } from '@/components/patients/patient-quick-actions'
import { PatientCard } from '@/components/patients/patient-card'
import { PatientsFilterToolbar } from '@/components/patients/patients-filter-toolbar'
import { formatRelativeTime } from '@/lib/date-utils'

const limit = 10

function PacientesPageContent() {
  const { cedroUser } = useSupabase()
  const searchParams = useSearchParams()
  
  // Filter states
  const [filters, setFilters] = useState<PatientFilters>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  // Debounce search term to avoid excessive API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  // Memoize final filters to prevent unnecessary re-renders
  const finalFilters = useMemo(() => ({
    ...filters,
    search: debouncedSearchTerm || undefined
  }), [filters, debouncedSearchTerm])

  // Determine therapist ID for filtering
  const therapistId = cedroUser?.role === 'therapist' ? cedroUser.id : undefined

  // React Query hooks
  const { 
    data: patientsResponse, 
    isLoading: loadingPatients, 
    error: patientsError 
  } = usePatients(finalFilters, { page: currentPage, limit }, therapistId)

  const {
    data: therapists = [],
    isLoading: loadingTherapists
  } = useTherapistsForFilter()

  // Get global patient statistics
  const {
    data: patientStats,
    isLoading: loadingStats
  } = usePatientStats(therapistId)

  // Extract data from response
  const patients = patientsResponse?.data || []
  const total = patientsResponse?.total || 0
  const totalPages = patientsResponse?.totalPages || 0
  const loading = loadingPatients

  // Modals
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false)
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingPatient, setDeletingPatient] = useState<Patient | null>(null)

  // Show error toast if there's an error
  if (patientsError) {
    toast.error('Erro ao carregar pacientes')
  }

  // Open new patient modal if 'new' parameter is present
  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setEditingPatientId(null)
      setFormOpen(true)
    }
  }, [searchParams])

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: '/',
      callback: () => {
        // Focus search input - would need ref for this
        const searchInput = document.querySelector('input[placeholder*="Buscar"]') as HTMLInputElement
        searchInput?.focus()
      },
      description: 'Focar busca'
    },
    {
      key: 'n',
      ctrlKey: true,
      callback: () => handleNewPatient(),
      description: 'Novo paciente'
    }
  ])

  const handleFilterChange = (key: keyof PatientFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'todos' ? undefined : value
    }))
    setCurrentPage(1)
  }

  const handleSearch = () => {
    // Search is now handled automatically by debounced search term
    // Reset to first page when searching
    setCurrentPage(1)
  }

  const handleClearFilters = () => {
    setFilters({})
    setSearchTerm('')
    setCurrentPage(1)
  }

  const hasActiveFilters = Object.values(filters).some(v => v !== undefined) || searchTerm.length > 0

  const handleViewPatient = (patientId: string) => {
    setSelectedPatientId(patientId)
    setDetailDrawerOpen(true)
  }

  const handleEditPatient = (patientId: string) => {
    setEditingPatientId(patientId)
    setFormOpen(true)
  }

  const handleDeletePatient = (patient: Patient) => {
    setDeletingPatient(patient)
    setDeleteDialogOpen(true)
  }

  // Component for rendering patient row - optimized for virtual list
  const PatientRow = memo(({ patient }: { patient: Patient }) => (
    <TableRow key={patient.id}>
      <TableCell>
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              {getInitials(patient.full_name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{patient.full_name}</div>
            <div className="text-sm text-muted-foreground">{patient.gender || 'Não informado'}</div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          <div className="flex items-center text-sm">
            <Mail className="mr-1 h-3 w-3" />
            {patient.email}
          </div>
          {patient.phone && (
            <div className="flex items-center text-sm">
              <Phone className="mr-1 h-3 w-3" />
              {patient.phone}
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        {calculateAge(patient.birth_date) || '-'} {calculateAge(patient.birth_date) ? 'anos' : ''}
      </TableCell>
      <TableCell>
        {(() => {
          const status = getPatientStatus(patient)
          return (
            <Badge variant={getStatusBadgeVariant(status)}>
              {getStatusText(status)}
            </Badge>
          )
        })()}
      </TableCell>
      <TableCell>{patient.current_therapist_name || 'Não atribuído'}</TableCell>
      <TableCell className="text-sm text-muted-foreground">{formatRelativeTime(patient.last_appointment)}</TableCell>
      <TableCell className="text-center">{patient.total_appointments || 0}</TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <PatientQuickActions
            patient={patient}
            isCompact
            onSchedule={() => {
              // TODO: Open appointment modal for this patient
              toast.info('Agendar: Funcionalidade em desenvolvimento')
            }}
            onViewRecords={() => {
              // TODO: Open medical records view for this patient
              toast.info('Prontuários: Funcionalidade em desenvolvimento')
            }}
            onViewDetails={() => handleViewPatient(patient.id)}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Mais ações</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleEditPatient(patient.id)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => handleDeletePatient(patient)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
     </TableRow>
   ))
   
   PatientRow.displayName = 'PatientRow'

  const handleNewPatient = () => {
    setEditingPatientId(null)
    setFormOpen(true)
  }

  const handlePatientSaved = () => {
    // React Query will automatically refetch data via mutations
    setFormOpen(false)
    setEditingPatientId(null)
  }

  const handlePatientDeleted = () => {
    // React Query will automatically refetch data via mutations
    setDeleteDialogOpen(false)
    setDeletingPatient(null)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <AppShell>
      {/* Sticky Filter Toolbar */}
      <PatientsFilterToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onSearch={handleSearch}
        filters={filters}
        onFilterChange={handleFilterChange}
        therapists={therapists}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
      />

      <div className="space-y-spacing-m p-spacing-m">
        {/* Header */}
        <div className="flex items-center justify-between border-b-standard border-motherduck-dark pb-spacing-xs">
          <div>
            <h1 className="font-mono text-heading-2 font-bold text-motherduck-dark uppercase tracking-wider">PACIENTES</h1>
            <p className="text-body-md text-motherduck-dark/70 mt-spacing-xxs">
              Gerencie os pacientes da clínica com visão 360 graus
            </p>
          </div>
          <Button variant="teal" onClick={handleNewPatient}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Paciente
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-spacing-xs md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-spacing-xxs">
              <CardTitle>
                Total de Pacientes
              </CardTitle>
              <Users className="h-5 w-5 text-motherduck-blue" />
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <Skeleton className="h-10 w-16" />
              ) : (
                <>
                  <div className="font-mono text-heading-3 font-bold text-motherduck-dark">{patientStats?.totalPatients || 0}</div>
                  <p className="text-caption text-motherduck-dark/70 mt-spacing-xxs">
                    {patientStats?.activePatients || 0} ativos
                  </p>
                </>
              )}
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-spacing-xxs">
              <CardTitle>
                Pacientes Ativos
              </CardTitle>
              <Users className="h-5 w-5 text-motherduck-teal" />
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <Skeleton className="h-10 w-16" />
              ) : (
                <>
                  <div className="font-mono text-heading-3 font-bold text-motherduck-dark">{patientStats?.activePatients || 0}</div>
                  <p className="text-caption text-motherduck-dark/70 mt-spacing-xxs">
                    {patientStats && patientStats.totalPatients > 0 ? ((patientStats.activePatients / patientStats.totalPatients) * 100).toFixed(1) : 0}% do total
                  </p>
                </>
              )}
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-spacing-xxs">
              <CardTitle>
                Total de Consultas
              </CardTitle>
              <Calendar className="h-5 w-5 text-motherduck-blue" />
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <Skeleton className="h-10 w-16" />
              ) : (
                <>
                  <div className="font-mono text-heading-3 font-bold text-motherduck-dark">{patientStats?.totalAppointments || 0}</div>
                  <p className="text-caption text-motherduck-dark/70 mt-spacing-xxs">
                    {patientStats && patientStats.totalPatients > 0 ? (patientStats.totalAppointments / patientStats.totalPatients).toFixed(1) : 0} por paciente
                  </p>
                </>
              )}
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Terapeutas Ativos
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{patientStats?.activeTherapists || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Atendendo pacientes
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Patients Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Pacientes</CardTitle>
            <CardDescription>
              {loading ? 'Carregando...' : `${total} paciente(s) encontrado(s)`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-4 w-[150px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Paciente</TableHead>
                        <TableHead>Contato</TableHead>
                        <TableHead>Idade</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Terapeuta</TableHead>
                        <TableHead>Última Consulta</TableHead>
                        <TableHead>Total Consultas</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <PatientTableSkeleton count={5} />
                      ) : patients.length > 50 ? (
                        // Use virtual list for large datasets
                        <VirtualList
                          items={patients}
                          itemHeight={72}
                          height={400}
                          renderItem={(patient) => <PatientRow patient={patient} />}
                        />
                      ) : (
                        // Regular rendering for smaller datasets
                        patients.map((patient) => (
                          <PatientRow key={patient.id} patient={patient} />
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-spacing-m">
                  {patients.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Nenhum paciente encontrado</p>
                    </div>
                  ) : (
                    patients.map((patient) => (
                      <PatientCard
                        key={patient.id}
                        patient={patient}
                        onViewDetails={handleViewPatient}
                        onEdit={handleEditPatient}
                        onDelete={handleDeletePatient}
                      />
                    ))
                  )}
                </div>

                {patients.length === 0 && (
                  <div className="hidden md:block text-center py-8">
                    <p className="text-muted-foreground">Nenhum paciente encontrado</p>
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Página {currentPage} de {totalPages} ({total} pacientes)
                    </p>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Próxima
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Patient Detail Drawer */}
      <Suspense fallback={<div>Carregando...</div>}>
        <LazyPatientDetailDrawer
          patientId={selectedPatientId}
          open={detailDrawerOpen}
          onOpenChange={setDetailDrawerOpen}
          onEdit={handleEditPatient}
          onDelete={(patientId: string) => {
            const patient = patients.find(p => p.id === patientId)
            if (patient) {
              handleDeletePatient(patient)
            }
          }}
        />
      </Suspense>

      {/* Patient Form Dialog */}
      <Suspense fallback={<div>Carregando...</div>}>
        <LazyPatientForm
          patientId={editingPatientId}
          open={formOpen}
          onOpenChange={setFormOpen}
          onSuccess={handlePatientSaved}
          cedroUser={cedroUser}
        />
      </Suspense>

      {/* Patient Delete Dialog */}
      <Suspense fallback={<div>Carregando...</div>}>
        <LazyPatientDeleteDialog
          patient={deletingPatient}
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onSuccess={handlePatientDeleted}
        />
      </Suspense>
    </AppShell>
  )
}

export default function PacientesPage() {
  return (
    <Suspense fallback={<PatientListSkeleton />}>
      <PacientesPageContent />
    </Suspense>
  )
}