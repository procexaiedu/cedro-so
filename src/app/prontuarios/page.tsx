'use client'

import { AppShell } from '@/components/layout/app-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  FileText, 
  Users, 
  Calendar, 
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Download,
  Clock,
  User,
  Stethoscope
} from 'lucide-react'
import { NewRecordModal } from '@/components/prontuarios/new-record-modal'
import { useState } from 'react'

export default function ProntuariosPage() {
  const [isNewRecordModalOpen, setIsNewRecordModalOpen] = useState(false)
  const records = [
    { 
      id: 1, 
      patient: 'Ana Silva', 
      age: 34,
      lastVisit: '2024-10-13', 
      diagnosis: 'Hipertensão', 
      status: 'ativo',
      doctor: 'Dr. João Santos',
      nextAppointment: '2024-10-20',
      recordsCount: 12
    },
    { 
      id: 2, 
      patient: 'Carlos Mendes', 
      age: 45,
      lastVisit: '2024-10-12', 
      diagnosis: 'Diabetes Tipo 2', 
      status: 'em_tratamento',
      doctor: 'Dra. Maria Costa',
      nextAppointment: '2024-10-18',
      recordsCount: 8
    },
    { 
      id: 3, 
      patient: 'Fernanda Lima', 
      age: 28,
      lastVisit: '2024-10-11', 
      diagnosis: 'Ansiedade', 
      status: 'ativo',
      doctor: 'Dr. Pedro Oliveira',
      nextAppointment: '2024-10-25',
      recordsCount: 15
    },
    { 
      id: 4, 
      patient: 'Ricardo Santos', 
      age: 52,
      lastVisit: '2024-10-10', 
      diagnosis: 'Artrite', 
      status: 'monitoramento',
      doctor: 'Dra. Ana Rodrigues',
      nextAppointment: '2024-11-01',
      recordsCount: 20
    },
    { 
      id: 5, 
      patient: 'Juliana Costa', 
      age: 39,
      lastVisit: '2024-10-09', 
      diagnosis: 'Enxaqueca', 
      status: 'ativo',
      doctor: 'Dr. João Santos',
      nextAppointment: '2024-10-22',
      recordsCount: 6
    }
  ]

  const recentRecords = [
    {
      id: 1,
      patient: 'Ana Silva',
      type: 'Consulta',
      date: '2024-10-13',
      doctor: 'Dr. João Santos',
      summary: 'Controle de pressão arterial. Paciente apresenta melhora significativa.'
    },
    {
      id: 2,
      patient: 'Carlos Mendes',
      type: 'Exame',
      date: '2024-10-12',
      doctor: 'Dra. Maria Costa',
      summary: 'Hemoglobina glicada: 7.2%. Ajuste na medicação necessário.'
    },
    {
      id: 3,
      patient: 'Fernanda Lima',
      type: 'Terapia',
      date: '2024-10-11',
      doctor: 'Dr. Pedro Oliveira',
      summary: 'Sessão de terapia cognitivo-comportamental. Progresso positivo.'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo': return 'default'
      case 'em_tratamento': return 'secondary'
      case 'monitoramento': return 'default'
      case 'inativo': return 'destructive'
      default: return 'secondary'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Prontuários</h1>
            <p className="text-gray-600">Gerencie registros médicos e histórico dos pacientes</p>
          </div>
          <Button onClick={() => setIsNewRecordModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Registro
          </Button>
        </div>

        {/* Medical Records Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Prontuários</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,247</div>
              <p className="text-xs text-muted-foreground">
                +23 este mês
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pacientes Ativos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">342</div>
              <p className="text-xs text-muted-foreground">
                Em tratamento ativo
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Registros Hoje</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">18</div>
              <p className="text-xs text-muted-foreground">
                Novos registros
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alertas Médicos</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground">
                Requerem atenção
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different views */}
        <Tabs defaultValue="prontuarios" className="space-y-6">
          <TabsList>
            <TabsTrigger value="prontuarios">Prontuários</TabsTrigger>
            <TabsTrigger value="registros">Registros Recentes</TabsTrigger>
            <TabsTrigger value="alertas">Alertas Médicos</TabsTrigger>
          </TabsList>

          <TabsContent value="prontuarios" className="space-y-6">
            {/* Search and Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Buscar por paciente, diagnóstico ou médico..."
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Button variant="outline">
                    <Filter className="mr-2 h-4 w-4" />
                    Filtros
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Medical Records Table */}
            <Card>
              <CardHeader>
                <CardTitle>Prontuários dos Pacientes</CardTitle>
                <CardDescription>
                  Visualize e gerencie os prontuários médicos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Idade</TableHead>
                      <TableHead>Última Consulta</TableHead>
                      <TableHead>Diagnóstico Principal</TableHead>
                      <TableHead>Médico Responsável</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Próxima Consulta</TableHead>
                      <TableHead>Registros</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{record.patient}</span>
                          </div>
                        </TableCell>
                        <TableCell>{record.age} anos</TableCell>
                        <TableCell>{formatDate(record.lastVisit)}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Stethoscope className="h-4 w-4 text-gray-400" />
                            <span>{record.diagnosis}</span>
                          </div>
                        </TableCell>
                        <TableCell>{record.doctor}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(record.status)}>
                            {record.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(record.nextAppointment)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{record.recordsCount}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="registros" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Registros Recentes</CardTitle>
                <CardDescription>
                  Últimos registros médicos adicionados ao sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentRecords.map((record) => (
                    <div key={record.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{record.type}</Badge>
                          <span className="font-medium">{record.patient}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Clock className="h-4 w-4" />
                          {formatDate(record.date)}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        <strong>Médico:</strong> {record.doctor}
                      </div>
                      <div className="text-sm">
                        {record.summary}
                      </div>
                      <div className="flex space-x-2 pt-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Detalhes
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alertas" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Alertas Médicos</CardTitle>
                <CardDescription>
                  Pacientes que requerem atenção especial ou acompanhamento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-l-4 border-red-500 bg-red-50 p-4 rounded">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      <span className="font-medium text-red-800">Alerta Crítico</span>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm text-red-700">
                        <strong>Ana Silva</strong> - Pressão arterial elevada na última consulta. Requer monitoramento imediato.
                      </p>
                    </div>
                  </div>

                  <div className="border-l-4 border-yellow-500 bg-yellow-50 p-4 rounded">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      <span className="font-medium text-yellow-800">Atenção</span>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm text-yellow-700">
                        <strong>Carlos Mendes</strong> - Exames de rotina em atraso há 3 meses.
                      </p>
                    </div>
                  </div>

                  <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-5 w-5 text-blue-500" />
                      <span className="font-medium text-blue-800">Lembrete</span>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm text-blue-700">
                        <strong>Fernanda Lima</strong> - Próxima sessão de terapia agendada para amanhã.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <NewRecordModal
        open={isNewRecordModalOpen}
        onOpenChange={setIsNewRecordModalOpen}
        onRecordCreated={() => {
          // Aqui você pode adicionar lógica para recarregar os dados
          console.log('Novo registro criado!')
        }}
      />
    </AppShell>
  )
}