'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useOverdueInvoices } from '@/hooks/use-dashboard-expanded'
import { AlertCircle, Eye } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function OverdueInvoicesTable({ therapistId }: { therapistId?: string }) {
  const router = useRouter()
  const { data, isLoading } = useOverdueInvoices(10, therapistId)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount / 100)
  }

  const getDaysOverdue = (dueDate: string) => {
    const due = new Date(dueDate)
    const today = new Date()
    const diffTime = today.getTime() - due.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" strokeWidth={2} />
            Faturas Vencidas
          </CardTitle>
          <CardDescription>Contas pendentes de recebimento</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-green-500" strokeWidth={2} />
            Faturas Vencidas
          </CardTitle>
          <CardDescription>Contas pendentes de recebimento</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">Nenhuma fatura vencida 🎉</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalOverdue = data.reduce((sum, invoice) => sum + (invoice.amount_cents || 0), 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" strokeWidth={2} />
              Faturas Vencidas
            </CardTitle>
            <CardDescription>
              {data.length} faturas • Total: {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(totalOverdue / 100)}
            </CardDescription>
          </div>
          <Badge variant="destructive" className="font-semibold">
            {data.length} em atraso
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data.map((invoice: any) => (
            <div
              key={invoice.id}
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm truncate">{invoice.patients?.full_name || 'Desconhecido'}</p>
                  <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 dark:bg-red-950">
                    {getDaysOverdue(invoice.due_date)} dias
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Vencimento: {new Date(invoice.due_date).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-2">
                <div className="text-right">
                  <p className="font-semibold text-sm">{formatCurrency(invoice.amount_cents)}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => router.push(`/financeiro?invoice=${invoice.id}`)}
                  className="h-8 w-8 p-0"
                >
                  <Eye className="h-4 w-4" strokeWidth={2} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
