'use client'

import { useState, useEffect } from 'react'
import { AppShell } from '@/components/layout/app-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Search, 
  Filter, 
  Eye,
  ChevronLeft,
  ChevronRight,
  Calendar,
  DollarSign
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { 
  getInvoices, 
  getTherapistsForFilter,
  formatCurrency,
  formatDate,
  getStatusBadgeVariant,
  getStatusText,
  type Invoice,
  type InvoiceFilters,
  type InvoiceStatus
} from '@/data/financeiro'
import { InvoiceDetailDrawer } from '@/components/financeiro/invoice-detail-drawer'

const statusOptions: { value: InvoiceStatus | 'todos'; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'draft', label: 'Rascunho' },
  { value: 'open', label: 'Em aberto' },
  { value: 'paid', label: 'Pago' },
  { value: 'partial', label: 'Parcial' },
  { value: 'overdue', label: 'Vencido' },
  { value: 'cancelled', label: 'Cancelado' }
]

export default function FinanceiroPage() {
  const { toast } = useToast()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [therapists, setTherapists] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  
  // Filtros
  const [filters, setFilters] = useState<InvoiceFilters>({
    status: 'todos'
  })
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 20

  // Carregar dados iniciais
  useEffect(() => {
    loadTherapists()
    loadInvoices()
  }, [])

  // Recarregar quando filtros ou página mudarem
  useEffect(() => {
    loadInvoices()
  }, [filters, currentPage])

  const loadTherapists = async () => {
    try {
      const data = await getTherapistsForFilter()
      setTherapists(data)
    } catch (error) {
      console.error('Erro ao carregar terapeutas:', error)
    }
  }

  const loadInvoices = async () => {
    setLoading(true)
    try {
      const response = await getInvoices(filters, { page: currentPage, limit })
      setInvoices(response.data)
      setTotalPages(response.totalPages)
      setTotal(response.total)
    } catch (error) {
      console.error('Erro ao carregar faturas:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao carregar faturas',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: keyof InvoiceFilters, value: any) => {
    // Se o valor for "todos", definir como undefined para não filtrar
    const filterValue = value === 'todos' ? undefined : value
    setFilters(prev => ({ ...prev, [key]: filterValue }))
    setCurrentPage(1) // Reset para primeira página
  }

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setDrawerOpen(true)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
            <p className="text-muted-foreground">
              Gerencie faturas e pagamentos da clínica
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Status */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={filters.status || 'todos'}
                  onValueChange={(value) => handleFilterChange('status', value as InvoiceStatus)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Data início */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Data início</label>
                <Input
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                />
              </div>

              {/* Data fim */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Data fim</label>
                <Input
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                />
              </div>

              {/* Terapeuta */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Terapeuta</label>
                <Select
                  value={filters.therapistId || 'todos'}
                  onValueChange={(value) => handleFilterChange('therapistId', value === 'todos' ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os terapeutas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os terapeutas</SelectItem>
                    {therapists.map((therapist) => (
                      <SelectItem key={therapist.id} value={therapist.id}>
                        {therapist.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Busca por paciente */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Paciente</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar paciente..."
                    value={filters.patientName || ''}
                    onChange={(e) => handleFilterChange('patientName', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de faturas */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Faturas</CardTitle>
              <div className="text-sm text-muted-foreground">
                {total} faturas encontradas
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fatura</TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Terapeuta</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Pago</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          Nenhuma fatura encontrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      invoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-mono text-sm">
                            {invoice.id.slice(0, 8)}...
                          </TableCell>
                          <TableCell>{invoice.patient_name || '-'}</TableCell>
                          <TableCell>{invoice.therapist_name || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(invoice.status)}>
                              {getStatusText(invoice.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(invoice.due_date)}</TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(invoice.amount_cents)}
                          </TableCell>
                          <TableCell className="font-medium text-green-600">
                            {formatCurrency(invoice.paid_amount_cents || 0)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewInvoice(invoice)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                {/* Paginação */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Página {currentPage} de {totalPages}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Próxima
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Drawer de detalhes */}
      <InvoiceDetailDrawer
        invoice={selectedInvoice}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </AppShell>
  )
}