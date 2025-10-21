'use client'

import { AppShell } from '@/components/layout/app-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  Stethoscope,
  Loader2,
  Trash2
} from 'lucide-react'
import { NewRecordModal } from '@/components/prontuarios/new-record-modal'
import { ViewRecordModal } from '@/components/prontuarios/view-record-modal'
import { EditRecordModal } from '@/components/prontuarios/edit-record-modal'
import { useState, useEffect } from 'react'
import { useSupabase } from '@/providers/supabase-provider'
import { 
  getMedicalRecords, 
  getMedicalRecordStats, 
  getMedicalRecordTypeLabel, 
  getAllRecords,
  getTherapistsForFilter,
  type MedicalRecordWithLegacyFields, 
  type MedicalRecordStats,
  type PendingRecord 
} from '@/data/pacientes'

export default function ProntuariosPage() {
  const { user, cedroUser } = useSupabase()
  const [newRecordModalOpen, setNewRecordModalOpen] = useState(false)
  const [viewRecordModalOpen, setViewRecordModalOpen] = useState(false)
  const [editRecordModalOpen, setEditRecordModalOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecordWithLegacyFields | null>(null)
  const [records, setRecords] = useState<PendingRecord[]>([])
  const [stats, setStats] = useState<MedicalRecordStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [therapists, setTherapists] = useState<Array<{ id: string; name: string }>>([])
  const [selectedTherapist, setSelectedTherapist] = useState<string>('')

  useEffect(() => {
    if (user && cedroUser) {
      loadData()
      loadTherapists()
    }
  }, [user, cedroUser])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Apenas terapeutas têm filtro automático - administradores veem todos os dados
      const therapistId = cedroUser?.role === 'therapist' ? cedroUser.id : undefined
      
      const [recordsData, statsData] = await Promise.all([
        getAllRecords(therapistId),
        getMedicalRecordStats()
      ])
      
      setRecords(recordsData)
      setStats(statsData)
    } catch (error) {
      console.error('Error loading medical records data:', error)
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

  const filteredRecords = records.filter(record => {
    // Filtro por busca
    const matchesSearch = !searchTerm || (() => {
      const searchLower = searchTerm.toLowerCase()
      return (
        record.patient_name?.toLowerCase().includes(searchLower) ||
        record.therapist_name?.toLowerCase().includes(searchLower) ||
        (record.note_type && getMedicalRecordTypeLabel(record.note_type).toLowerCase().includes(searchLower)) ||
        (record.tipo_consulta && record.tipo_consulta.toLowerCase().includes(searchLower)) ||
        record.content?.toLowerCase().includes(searchLower) ||
        record.title?.toLowerCase().includes(searchLower)
      )
    })()

    // Filtro por terapeuta (apenas para administradores)
    const matchesTherapist = !selectedTherapist || record.therapist_id === selectedTherapist

    return matchesSearch && matchesTherapist
  })

  const getStatusColor = (visibility: string) => {
    switch (visibility) {
      case 'public': return 'default'
      case 'private': return 'secondary'
      case 'restricted': return 'destructive'
      default: return 'secondary'
    }
  }

  const getVisibilityLabel = (visibility: string) => {
    switch (visibility) {
      case 'public': return 'Público'
      case 'private': return 'Privado'
      case 'restricted': return 'Restrito'
      default: return 'Desconhecido'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  const getRecordStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default'
      case 'processing': return 'secondary'
      case 'uploaded': return 'outline'
      case 'failed': return 'destructive'
      case 'completed_with_errors': return 'destructive'
      default: return 'secondary'
    }
  }

  const getRecordStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Concluído'
      case 'processing': return 'Processando'
      case 'uploaded': return 'Enviado'
      case 'failed': return 'Falhou'
      case 'completed_with_errors': return 'Concluído com erros'
      default: return 'Desconhecido'
    }
  }

  const getRecordTypeLabel = (record: PendingRecord) => {
    if (record.type === 'medical_record' && record.note_type) {
      return getMedicalRecordTypeLabel(record.note_type)
    }
    if (record.type === 'recording_job' && record.tipo_consulta) {
      return record.tipo_consulta === 'anamnese' ? 'Anamnese' : 'Evolução'
    }
    return 'Não especificado'
  }

  const handleRecordCreated = (newRecord?: MedicalRecordWithLegacyFields) => {
    loadData() // Reload to get all records including new ones
  }

  const handleViewRecord = (record: PendingRecord | MedicalRecordWithLegacyFields) => {
    // Check if it's a PendingRecord
    if ('type' in record && 'status' in record) {
      // Only allow viewing completed medical records
      if (record.type === 'medical_record' && record.status === 'completed') {
        // Convert PendingRecord back to MedicalRecordWithLegacyFields for the modal
        let contentJson: any = {};
        if (record.content) {
          try {
            // Try to parse as JSON first (in case it's already a JSON string)
            const parsedContent = JSON.parse(record.content);
            contentJson = parsedContent;
          } catch {
            // If parsing fails, treat as plain markdown content
            contentJson = { markdown_content: record.content };
          }
        }
        
        const medicalRecord: MedicalRecordWithLegacyFields = {
          id: record.id,
          patient_id: record.patient_id,
          appointment_id: record.appointment_id || null,
          note_type: record.note_type!,
          visibility: 'private',
          content_json: contentJson,
          created_at: record.created_at,
          updated_at: record.created_at,
          patient_name: record.patient_name,
          therapist_name: record.therapist_name,
          appointment_date: undefined,
          content: record.content
        }
        setSelectedRecord(medicalRecord)
        setViewRecordModalOpen(true)
      }
    } else {
      // It's already a MedicalRecordWithLegacyFields
      setSelectedRecord(record)
      setViewRecordModalOpen(true)
    }
  }

  const handleEditRecord = (record: PendingRecord | MedicalRecordWithLegacyFields) => {
    // Check if it's a PendingRecord
    if ('type' in record && 'status' in record) {
      // Only allow editing completed medical records
      if (record.type === 'medical_record' && record.status === 'completed') {
        // Convert PendingRecord back to MedicalRecordWithLegacyFields for the modal
        let contentJson: any = {};
        if (record.content) {
          try {
            // Try to parse as JSON first (in case it's already a JSON string)
            const parsedContent = JSON.parse(record.content);
            contentJson = parsedContent;
          } catch {
            // If parsing fails, treat as plain markdown content
            contentJson = { markdown_content: record.content };
          }
        }
        
        const medicalRecord: MedicalRecordWithLegacyFields = {
          id: record.id,
          patient_id: record.patient_id,
          appointment_id: record.appointment_id || null,
          note_type: record.note_type!,
          visibility: 'private',
          content_json: contentJson,
          created_at: record.created_at,
          updated_at: record.created_at,
          patient_name: record.patient_name,
          therapist_name: record.therapist_name,
          appointment_date: undefined,
          content: record.content
        }
        setSelectedRecord(medicalRecord)
        setEditRecordModalOpen(true)
      }
    } else {
      // It's already a MedicalRecordWithLegacyFields
      setSelectedRecord(record)
      setEditRecordModalOpen(true)
    }
  }

  const handleRecordUpdated = (updatedRecord: MedicalRecordWithLegacyFields) => {
    loadData() // Reload to get updated records
  }

  const handleDownloadRecord = (record: PendingRecord | MedicalRecordWithLegacyFields) => {
    // Extract content from different sources
    const getRecordContent = () => {
      // Check if it's a MedicalRecordWithLegacyFields
      if ('content_json' in record && record.content_json?.markdown_content) {
        return record.content_json.markdown_content
      }
      if (record.content) {
        return record.content
      }
      return null
    }

    const getTranscriptionContent = () => {
      // Check if it's a MedicalRecordWithLegacyFields
      if ('content_json' in record && record.content_json?.raw_transcript) {
        return record.content_json.raw_transcript
      }
      if ('transcription' in record && record.transcription) {
        return record.transcription
      }
      return null
    }

    const content = getRecordContent()
    const transcription = getTranscriptionContent()
    
    const downloadContent = `
PRONTUÁRIO MÉDICO
================

Paciente: ${record.patient_name || 'Não informado'}
Terapeuta: ${record.therapist_name || 'Não informado'}
Tipo: ${'note_type' in record && record.note_type ? getMedicalRecordTypeLabel(record.note_type) : 'Não especificado'}
Data: ${formatDateTime(record.created_at)}
Visibilidade: ${'visibility' in record ? getVisibilityLabel(record.visibility) : 'Não especificado'}

CONTEÚDO:
${content || 'Sem conteúdo disponível'}

${'audio_url' in record && record.audio_url ? `\nÁudio disponível: ${record.audio_url}` : ''}
${transcription ? `\nTranscrição: ${transcription}` : ''}
    `.trim()

    const blob = new Blob([downloadContent], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `prontuario_${record.patient_name?.replace(/\s+/g, '_') || 'paciente'}_${new Date(record.created_at).toISOString().split('T')[0]}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleDeleteRecord = async (record: MedicalRecordWithLegacyFields | PendingRecord) => {
    const isPendingRecord = 'type' in record && (record.type === 'recording_job' || record.type === 'medical_record')
    const confirmMessage = isPendingRecord && record.type === 'medical_record'
      ? `Tem certeza que deseja deletar este prontuário de ${record.patient_name || 'paciente não identificado'}?`
      : `Tem certeza que deseja deletar este registro de processamento de ${record.patient_name || 'paciente não identificado'}?`
    
    if (!confirm(confirmMessage)) {
      return
    }

    try {
      let endpoint = ''
      
      if (isPendingRecord && record.type === 'medical_record') {
        // Delete processed medical record
        endpoint = `/api/medical-records/${record.id}`
      } else {
        // Delete pending recording job
        endpoint = `/api/recording-jobs/${record.id}`
      }

      const response = await fetch(endpoint, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Erro ao deletar registro')
      }

      // Refresh data after deletion
      loadData()
      
      // Show success message
      alert(isPendingRecord && record.type === 'medical_record' 
        ? 'Prontuário deletado com sucesso!' 
        : 'Registro de processamento deletado com sucesso!')
        
    } catch (error) {
      console.error('Erro ao deletar registro:', error)
      alert('Erro ao deletar registro. Tente novamente.')
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando prontuários...</span>
        </div>
      </AppShell>
    )
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
          <Button onClick={() => setNewRecordModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Registro
          </Button>
        </div>

        {/* Processing Status Banner */}
        {records.some(record => record.status === 'processing' || record.status === 'uploaded') && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <div>
                  <h3 className="font-medium text-blue-900">Registros em Processamento</h3>
                  <p className="text-sm text-blue-700">
                    {records.filter(r => r.status === 'processing').length} registros sendo processados, 
                    {records.filter(r => r.status === 'uploaded').length} aguardando processamento
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Medical Records Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Prontuários</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_records || 0}</div>
              <p className="text-xs text-muted-foreground">
                Registros no sistema
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pacientes Ativos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.active_patients || 0}</div>
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
              <div className="text-2xl font-bold">{stats?.records_today || 0}</div>
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
              <div className="text-2xl font-bold">{stats?.medical_alerts || 0}</div>
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
                        placeholder="Buscar por paciente, tipo de registro ou terapeuta..."
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
                <CardTitle>Registros Médicos</CardTitle>
                <CardDescription>
                  Visualize e gerencie os registros médicos dos pacientes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredRecords.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum registro encontrado</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {searchTerm ? 'Tente ajustar os termos de busca.' : 'Comece criando um novo registro médico.'}
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Paciente</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Terapeuta</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRecords.map((record) => (
                        <TableRow 
                          key={record.id}
                          className={record.status !== 'completed' ? 'bg-blue-50 border-l-4 border-l-blue-400' : ''}
                        >
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <span className="font-medium">{record.patient_name || 'Paciente não identificado'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {getRecordTypeLabel(record)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {record.status === 'processing' && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
                              <Badge variant={getRecordStatusColor(record.status)}>
                                {getRecordStatusLabel(record.status)}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <span>{formatDateTime(record.created_at)}</span>
                            </div>
                          </TableCell>
                          <TableCell>{record.therapist_name || 'Não informado'}</TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
                              {record.type === 'medical_record' && record.status === 'completed' ? (
                                <>
                                  <Button variant="ghost" size="sm" title="Visualizar" onClick={() => handleViewRecord(record)}>
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" title="Editar" onClick={() => handleEditRecord(record)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" title="Download" onClick={() => handleDownloadRecord(record)}>
                                    <Download className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" title="Deletar" onClick={() => handleDeleteRecord(record)}>
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </>
                              ) : (
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                                    {record.status === 'processing' && (
                                      <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Processando...</span>
                                      </>
                                    )}
                                    {record.status === 'uploaded' && (
                                      <span>Aguardando processamento</span>
                                    )}
                                    {record.status === 'failed' && (
                                      <span className="text-red-500">Falha no processamento</span>
                                    )}
                                  </div>
                                  <Button variant="ghost" size="sm" title="Deletar" onClick={() => handleDeleteRecord(record)}>
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
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
                {stats?.recent_records && stats.recent_records.length > 0 ? (
                  <div className="space-y-4">
                    {stats.recent_records.map((record) => (
                      <div key={record.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">{getMedicalRecordTypeLabel(record.note_type)}</Badge>
                            <span className="font-medium">{record.patient_name || 'Paciente não identificado'}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <Clock className="h-4 w-4" />
                            {formatDateTime(record.created_at)}
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">
                          <strong>Terapeuta:</strong> {record.therapist_name || 'Não informado'}
                        </div>
                        <div className="text-sm">
                          {record.content_json?.content ? record.content_json.content.substring(0, 150) + '...' : 'Sem conteúdo disponível'}
                        </div>
                        <div className="flex space-x-2 pt-2">
                          <Button variant="ghost" size="sm" onClick={() => handleViewRecord(record)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Detalhes
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEditRecord(record)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDownloadRecord(record)}>
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteRecord(record)}>
                            <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                            Deletar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum registro recente</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Os registros recentes aparecerão aqui quando forem criados.
                    </p>
                  </div>
                )}
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
                <div className="text-center py-8">
                  <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Sistema de alertas em desenvolvimento</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Os alertas médicos serão implementados em uma próxima versão.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <NewRecordModal
        open={newRecordModalOpen}
        onOpenChange={setNewRecordModalOpen}
        onRecordCreated={handleRecordCreated}
      />

      <ViewRecordModal
        open={viewRecordModalOpen}
        onOpenChange={setViewRecordModalOpen}
        record={selectedRecord}
      />

      <EditRecordModal
        open={editRecordModalOpen}
        onOpenChange={setEditRecordModalOpen}
        record={selectedRecord}
        onRecordUpdated={handleRecordUpdated}
      />
    </AppShell>
  )
}