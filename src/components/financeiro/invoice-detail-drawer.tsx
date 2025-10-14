'use client'

import { useState, useEffect } from 'react'
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle 
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { 
  Calendar, 
  DollarSign, 
  User, 
  CreditCard,
  Receipt
} from 'lucide-react'
import { 
  getInvoiceDetails,
  formatCurrency,
  formatDate,
  getStatusBadgeVariant,
  getStatusText,
  type Invoice,
  type Payment
} from '@/data/financeiro'

interface InvoiceDetailDrawerProps {
  invoice: Invoice | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InvoiceDetailDrawer({ invoice, open, onOpenChange }: InvoiceDetailDrawerProps) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (invoice && open) {
      loadInvoiceDetails()
    }
  }, [invoice, open])

  const loadInvoiceDetails = async () => {
    if (!invoice) return
    
    setLoading(true)
    try {
      const details = await getInvoiceDetails(invoice.id)
      setPayments(details.payments)
    } catch (error) {
      console.error('Erro ao carregar detalhes da fatura:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPaymentMethodText = (method: string | null) => {
    if (!method) return 'Não informado'
    
    const methods: Record<string, string> = {
      'credit_card': 'Cartão de Crédito',
      'debit_card': 'Cartão de Débito',
      'pix': 'PIX',
      'cash': 'Dinheiro',
      'bank_transfer': 'Transferência Bancária',
      'check': 'Cheque'
    }
    return methods[method] || method
  }

  const getPaymentStatusText = (status: string | null) => {
    if (!status) return 'Não informado'
    
    const statuses: Record<string, string> = {
      'pending': 'Pendente',
      'completed': 'Concluído',
      'failed': 'Falhou',
      'cancelled': 'Cancelado'
    }
    return statuses[status] || status
  }

  const getPaymentStatusVariant = (status: string | null) => {
    if (!status) return 'outline'
    
    switch (status) {
      case 'completed':
        return 'default'
      case 'pending':
        return 'secondary'
      case 'failed':
      case 'cancelled':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  if (!invoice) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Detalhes da Fatura
          </SheetTitle>
          <SheetDescription>
            Informações completas da fatura e histórico de pagamentos
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Informações da Fatura */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações Gerais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">ID da Fatura</label>
                  <p className="font-mono text-sm">{invoice.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">
                    <Badge variant={getStatusBadgeVariant(invoice.status)}>
                      {getStatusText(invoice.status)}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Paciente</label>
                    <p className="font-medium">{invoice.patient_name || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Terapeuta</label>
                    <p className="font-medium">{invoice.therapist_name || '-'}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Data de Vencimento</label>
                    <p className="font-medium">{formatDate(invoice.due_date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Valor Total</label>
                    <p className="font-bold text-lg">{formatCurrency(invoice.amount_cents)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-800">Valor Pago</span>
                  <span className="font-bold text-green-600">
                    {formatCurrency(invoice.paid_amount_cents || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm font-medium text-red-800">Valor Pendente</span>
                  <span className="font-bold text-red-600">
                    {formatCurrency(invoice.amount_cents - (invoice.paid_amount_cents || 0))}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Histórico de Pagamentos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Histórico de Pagamentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : payments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum pagamento registrado
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          {payment.paid_at ? formatDate(payment.paid_at) : '-'}
                        </TableCell>
                        <TableCell>
                          {getPaymentMethodText(payment.method)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getPaymentStatusVariant(payment.status)}>
                            {getPaymentStatusText(payment.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(payment.amount_cents)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  )
}