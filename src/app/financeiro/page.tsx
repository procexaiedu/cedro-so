import { AppShell } from '@/components/layout/app-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Plus,
  Download,
  Filter,
  CreditCard,
  Banknote
} from 'lucide-react'

export default function FinanceiroPage() {
  const transactions = [
    { id: 1, date: '2024-10-13', patient: 'Maria Silva', description: 'Consulta', amount: 150.00, status: 'pago', method: 'cartão' },
    { id: 2, date: '2024-10-13', patient: 'João Santos', description: 'Retorno', amount: 80.00, status: 'pago', method: 'dinheiro' },
    { id: 3, date: '2024-10-12', patient: 'Ana Costa', description: 'Primeira consulta', amount: 200.00, status: 'pendente', method: 'pix' },
    { id: 4, date: '2024-10-12', patient: 'Pedro Lima', description: 'Consulta', amount: 150.00, status: 'pago', method: 'cartão' },
    { id: 5, date: '2024-10-11', patient: 'Carla Oliveira', description: 'Retorno', amount: 80.00, status: 'pago', method: 'dinheiro' },
    { id: 6, date: '2024-10-11', patient: 'Roberto Alves', description: 'Consulta', amount: 150.00, status: 'cancelado', method: 'cartão' },
    { id: 7, date: '2024-10-10', patient: 'Lucia Ferreira', description: 'Primeira consulta', amount: 200.00, status: 'pago', method: 'pix' },
  ]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const totalReceita = transactions
    .filter(t => t.status === 'pago')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalPendente = transactions
    .filter(t => t.status === 'pendente')
    .reduce((sum, t) => sum + t.amount, 0)

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Financeiro</h1>
            <p className="text-gray-600">Gerencie receitas e pagamentos</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Relatório
            </Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Transação
            </Button>
          </div>
        </div>

        {/* Financial Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totalReceita)}
              </div>
              <p className="text-xs text-muted-foreground">
                +12% desde o mês passado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendente</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {formatCurrency(totalPendente)}
              </div>
              <p className="text-xs text-muted-foreground">
                1 transação pendente
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ 45.231</div>
              <p className="text-xs text-muted-foreground">
                Outubro 2024
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Média por Consulta</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ 142</div>
              <p className="text-xs text-muted-foreground">
                +5% vs mês anterior
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Payment Methods Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Métodos de Pagamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Cartão</span>
                </div>
                <span className="text-sm font-medium">45%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Banknote className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Dinheiro</span>
                </div>
                <span className="text-sm font-medium">30%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-purple-500" />
                  <span className="text-sm">PIX</span>
                </div>
                <span className="text-sm font-medium">25%</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Receita Semanal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 mb-2">
                R$ 2.840
              </div>
              <div className="flex items-center text-sm text-green-600">
                <TrendingUp className="mr-1 h-3 w-3" />
                +15% vs semana anterior
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Consultas Pagas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">18</div>
              <div className="text-sm text-gray-500">
                Esta semana
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Transações Recentes</CardTitle>
                <CardDescription>
                  Histórico de pagamentos e receitas
                </CardDescription>
              </div>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filtros
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      {formatDate(transaction.date)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {transaction.patient}
                    </TableCell>
                    <TableCell>
                      {transaction.description}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {transaction.method === 'cartão' && <CreditCard className="h-4 w-4" />}
                        {transaction.method === 'dinheiro' && <Banknote className="h-4 w-4" />}
                        {transaction.method === 'pix' && <DollarSign className="h-4 w-4" />}
                        <span className="capitalize">{transaction.method}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          transaction.status === 'pago' ? 'default' :
                          transaction.status === 'pendente' ? 'secondary' : 'destructive'
                        }
                      >
                        {transaction.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}