'use client'

import { useState, useEffect } from 'react'
import { AppShell } from '@/components/layout/app-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, Plus, Users, Calendar, Phone, Mail, MoreHorizontal, Eye, Edit, Trash2, AlertCircle } from 'lucide-react'
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
  getPatients, 
  getTherapistsForFilter, 
  calculateAge, 
  formatDate, 
  getStatusBadgeVariant, 
  getStatusText 
} from '@/data/pacientes'
import { PatientDetailDrawer } from '@/components/pacientes/patient-detail-drawer'
import { PatientForm } from '@/components/pacientes/patient-form'
import { PatientDeleteDialog } from '@/components/pacientes/patient-delete-dialog'

export default function PacientesPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [therapists, setTherapists] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [limit] = useState(10)

  // Filters
  const [filters, setFilters] = useState<PatientFilters>({})
  const [searchTerm, setSearchTerm] = useState('')

  // Modals
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false)
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingPatient, setDeletingPatient] = useState<Patient | null>(null)

  useEffect(() => {
    loadPatients()
    loadTherapists()
  }, [currentPage, filters])

  const loadPatients = async () => {
    setLoading(true)
    try {
      const response = await getPatients(filters, { page: currentPage, limit })
      setPatients(response.data)
      setTotal(response.total)
      setTotalPages(response.totalPages)
    } catch (error) {
      console.error('Error loading patients:', error)
      toast.error('Erro ao carregar pacientes')
    } finally {
      setLoading(false)
    }
  }

  const loadTherapists = async () => {
    try {
      const therapistsData = await getTherapistsForFilter()
      setTherapists(therapistsData)
    } catch (error) {
      console.error('Error loading therapists:', error)
    }
  }

  const handleFilterChange = (key: keyof PatientFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'todos' ? undefined : value
    }))
    setCurrentPage(1)
  }

  const handleSearch = () => {
    setFilters(prev => ({
      ...prev,
      search: searchTerm || undefined
    }))
    setCurrentPage(1)
  }

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

  const handleNewPatient = () => {
    setEditingPatientId(null)
    setFormOpen(true)
  }

  const handlePatientSaved = () => {
    loadPatients()
  }

  const handlePatientDeleted = () => {
    loadPatients()
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

  // Calculate stats
  const activePatients = patients.filter(p => p.status === 'active').length
  const totalAppointments = patients.reduce((sum, p) => sum + (p.total_appointments || 0), 0)

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Pacientes</h1>
            <p className="text-muted-foreground">
              Gerencie os pacientes da clínica com visão 360 graus
            </p>
          </div>
          <Button onClick={handleNewPatient}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Paciente
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Pacientes
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{total}</div>
                  <p className="text-xs text-muted-foreground">
                    {activePatients} ativos
                  </p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pacientes Ativos
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{activePatients}</div>
                  <p className="text-xs text-muted-foreground">
                    {total > 0 ? ((activePatients / total) * 100).toFixed(1) : 0}% do total
                  </p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Consultas
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{totalAppointments}</div>
                  <p className="text-xs text-muted-foreground">
                    {patients.length > 0 ? (totalAppointments / patients.length).toFixed(1) : 0} por paciente
                  </p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Terapeutas Ativos
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{therapists.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Atendendo pacientes
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>
              Use os filtros abaixo para encontrar pacientes específicos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, email ou telefone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-8"
                  />
                </div>
              </div>
              <Button variant="outline" onClick={handleSearch}>
                <Search className="mr-2 h-4 w-4" />
                Buscar
              </Button>
              <Select 
                value={filters.status || 'todos'} 
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Status</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                  <SelectItem value="suspended">Suspenso</SelectItem>
                </SelectContent>
              </Select>
              <Select 
                value={filters.therapistId || 'todos'} 
                onValueChange={(value) => handleFilterChange('therapistId', value)}
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
            </div>
          </CardContent>
        </Card>

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
                    {patients.map((patient) => (
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
                          <Badge variant={getStatusBadgeVariant(patient.status)}>
                            {getStatusText(patient.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>{patient.current_therapist_name || 'Não atribuído'}</TableCell>
                        <TableCell>{formatDate(patient.last_appointment || null)}</TableCell>
                        <TableCell>{patient.total_appointments || 0}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleViewPatient(patient.id)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver detalhes
                              </DropdownMenuItem>
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
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {patients.length === 0 && (
                  <div className="text-center py-8">
                    <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="text-muted-foreground mt-2">Nenhum paciente encontrado</p>
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
      <PatientDetailDrawer
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

      {/* Patient Form Dialog */}
      <PatientForm
        patientId={editingPatientId}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={handlePatientSaved}
      />

      {/* Patient Delete Dialog */}
      <PatientDeleteDialog
        patient={deletingPatient}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onSuccess={handlePatientDeleted}
      />
    </AppShell>
  )
}