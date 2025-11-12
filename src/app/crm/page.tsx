'use client'

import { useState, useEffect } from 'react'
import { AppShell } from '@/components/layout/app-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Users, 
  TrendingUp, 
  Target, 
  UserPlus,
  Search,
  Filter,
  Phone,
  Mail,
  MessageSquare,
  MoreHorizontal,
  LayoutGrid,
  List,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'
import { 
  Lead, 
  LeadStats,
  LeadStage,
  LeadFilters,
  LeadSourceData,
  getLeads,
  getLeadStats,
  getLeadSources,
  getLeadSourcesData,
  updateLead,
  getStageColor,
  getStageText
} from '@/data/crm'
import { KanbanBoard } from '@/components/crm/kanban-board'
import { LeadForm } from '@/components/crm/lead-form'
import { LeadDetailDrawer } from '@/components/crm/lead-detail-drawer'
import { LeadDeleteDialog } from '@/components/crm/lead-delete-dialog'

export default function CRMPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [stats, setStats] = useState<LeadStats | null>(null)
  const [sources, setSources] = useState<LeadSourceData[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'kanban' | 'list'>('kanban')
  
  // Modal states
  const [leadFormOpen, setLeadFormOpen] = useState(false)
  const [leadDetailOpen, setLeadDetailOpen] = useState(false)
  const [leadDeleteOpen, setLeadDeleteOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [stageFilter, setStageFilter] = useState<LeadStage | 'all'>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [assignedFilter, setAssignedFilter] = useState<string>('all')

  // Load initial data
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [leadsData, statsData, sourcesData] = await Promise.all([
        getLeads({}, { page: 1, limit: 100 }),
        getLeadStats(),
        getLeadSourcesData()
      ])
      
      setLeads(leadsData.data)
      setStats(statsData)
      setSources(sourcesData)
    } catch (error) {
      console.error('Error loading CRM data:', error)
      toast.error('Erro ao carregar dados do CRM')
    } finally {
      setLoading(false)
    }
  }

  // Filter leads based on current filters
  const filteredLeads = (leads || []).filter(lead => {
    const matchesSearch = (lead.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (lead.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStage = stageFilter === 'all' || lead.stage === stageFilter
    const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter
    // Comentado temporariamente - assigned_to não implementado
    // const matchesAssigned = assignedFilter === 'all' || 
    //                        (assignedFilter === 'unassigned' && !lead.assigned_to) ||
    //                        lead.assigned_to === assignedFilter
    const matchesAssigned = true // Temporário até implementar assigned_to

    return matchesSearch && matchesStage && matchesSource && matchesAssigned
  })

  // Handle lead stage update (for Kanban drag & drop)
  const handleLeadUpdate = async (leadId: string, newStage: LeadStage) => {
    try {
      await updateLead(leadId, { stage: newStage })
      
      // Update local state
      setLeads(prevLeads => 
        prevLeads.map(lead => 
          lead.id === leadId 
            ? { ...lead, stage: newStage, updated_at: new Date().toISOString() }
            : lead
        )
      )
      
      toast.success('Estágio do lead atualizado!')
    } catch (error) {
      console.error('Error updating lead:', error)
      toast.error('Erro ao atualizar estágio do lead')
    }
  }

  // Handle lead actions
  const handleLeadView = (lead: Lead) => {
    setSelectedLead(lead)
    setLeadDetailOpen(true)
  }

  const handleLeadEdit = (lead: Lead) => {
    setSelectedLead(lead)
    setLeadFormOpen(true)
  }

  const handleLeadDelete = (lead: Lead) => {
    setSelectedLead(lead)
    setLeadDeleteOpen(true)
  }

  const handleLeadFormSuccess = () => {
    loadData() // Reload data after create/update
  }

  const handleLeadDeleteSuccess = () => {
    loadData() // Reload data after delete
  }

  // Get unique assigned users for filter
  // Comentado temporariamente - assigned_to não implementado
  // const assignedUsers = Array.from(
  //   new Set((leads || []).filter(l => l.assigned_to_name).map(l => ({ 
  //     id: l.assigned_to!, 
  //     name: l.assigned_to_name! 
  //   })))
  // )
  const assignedUsers: Array<{ id: string; name: string }> = [] // Temporário

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <AppShell>
      <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CRM</h1>
          <p className="text-muted-foreground">
            Gerencie seus leads e oportunidades de negócio
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
          <Button onClick={() => {
            setSelectedLead(null)
            setLeadFormOpen(true)
          }}>
            <UserPlus className="mr-2 h-4 w-4" />
            Novo Lead
          </Button>
        </div>
      </div>

      {/* CRM Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_leads}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+{stats.new_leads}</span> novos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.conversion_rate}%</div>
              <p className="text-xs text-muted-foreground">
                Baseado nos últimos 30 dias
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leads Qualificados</CardTitle>
              <Target className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.qualified_leads}</div>
              <p className="text-xs text-muted-foreground">
                Prontos para contato
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Convertidos</CardTitle>
              <UserPlus className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.converted_leads}</div>
              <p className="text-xs text-muted-foreground">
                Novos pacientes este mês
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dashboard Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Lead Sources */}
          <Card>
            <CardHeader>
              <CardTitle>Fontes de Leads</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {sources.map((source, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{source.name}</span>
                    <span className="text-muted-foreground">{source.count}</span>
                  </div>
                  <Progress value={source.percentage} className="h-2" />
                </div>
              ))}
              {sources.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">Carregando dados...</p>
                </div>
              )}
            </CardContent>
          </Card>

        {/* Pipeline de Vendas */}
         <Card>
           <CardHeader>
             <CardTitle>Pipeline de Vendas</CardTitle>
           </CardHeader>
           <CardContent className="space-y-4">
             {stats?.pipeline_stats?.map((stage, index) => (
               <div key={index} className="flex justify-between items-center">
                 <span className="text-sm">{stage.stage}</span>
                 <Badge variant="secondary">{stage.count}</Badge>
               </div>
             )) || (
               <div className="text-center py-4">
                 <p className="text-muted-foreground">Carregando dados...</p>
               </div>
             )}
           </CardContent>
         </Card>

         {/* Ações Pendentes */}
         <Card>
           <CardHeader>
             <CardTitle>Ações Pendentes</CardTitle>
           </CardHeader>
           <CardContent className="space-y-4">
             {stats?.pending_actions?.map((action, index) => (
               <div key={index} className="flex justify-between items-center">
                 <span className="text-sm">{action.action}</span>
                 <Badge variant="outline">{action.count}</Badge>
               </div>
             )) || (
               <div className="text-center py-4">
                 <p className="text-muted-foreground">Carregando dados...</p>
               </div>
             )}
           </CardContent>
         </Card>
      </div>

      {/* Filters and View Toggle */}
      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar leads..." 
                  className="pl-8 w-[300px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <Select value={stageFilter} onValueChange={(value) => setStageFilter(value as LeadStage | 'all')}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Estágio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="mql">MQL</SelectItem>
                  <SelectItem value="sql">SQL</SelectItem>
                  <SelectItem value="won">Ganho</SelectItem>
                  <SelectItem value="lost">Perdido</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Fonte" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {sources.map((source) => (
                    <SelectItem key={source.name} value={source.name}>
                      {source.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                {filteredLeads.length} de {(leads || []).length} leads
              </span>
              <div className="flex border rounded-lg">
                <Button
                  variant={view === 'kanban' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setView('kanban')}
                  className="rounded-r-none"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={view === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setView('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {view === 'kanban' ? (
            <KanbanBoard
              leads={filteredLeads}
              onLeadUpdate={handleLeadUpdate}
              onLeadView={handleLeadView}
              onLeadEdit={handleLeadEdit}
              onLeadDelete={handleLeadDelete}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Nome</th>
                    <th className="text-left p-2">Contato</th>
                    <th className="text-left p-2">Fonte</th>
                    <th className="text-left p-2">Score</th>
                    <th className="text-left p-2">Estágio</th>
                    <th className="text-left p-2">Responsável</th>
                    <th className="text-left p-2">Último Contato</th>
                    <th className="text-left p-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="border-b hover:bg-muted/50">
                      <td className="p-2">
                        <div>
                          <div className="font-medium">{lead.name}</div>
                          <div className="text-sm text-muted-foreground">{lead.email}</div>
                        </div>
                      </td>
                      <td className="p-2 text-sm">{lead.phone || '-'}</td>
                      <td className="p-2">
                        <Badge variant="outline">{lead.source}</Badge>
                      </td>
                      <td className="p-2">
                        <div className="flex items-center space-x-1">
                          <div className="w-8 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-green-500" 
                              style={{ width: `${lead.score}%` }}
                            />
                          </div>
                          <span className="text-sm">{lead.score}</span>
                        </div>
                      </td>
                      <td className="p-2">
                        <Badge variant={getStageColor(lead.stage)}>
                          {getStageText(lead.stage)}
                        </Badge>
                      </td>
                      {/* Comentado temporariamente - assigned_to não implementado */}
                      {/* <td className="p-2 text-sm">{lead.assigned_to_name || '-'}</td> */}
                      <td className="p-2 text-sm">-</td>
                      {/* Comentado temporariamente - last_contact não implementado */}
                      {/* <td className="p-2 text-sm">
                        {lead.last_contact ? new Date(lead.last_contact).toLocaleDateString() : '-'}
                      </td> */}
                      <td className="p-2 text-sm">-</td>
                      <td className="p-2">
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="sm" onClick={() => handleLeadView(lead)}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredLeads.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Nenhum lead encontrado</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <LeadForm
        open={leadFormOpen}
        onOpenChange={setLeadFormOpen}
        lead={selectedLead}
        onSuccess={handleLeadFormSuccess}
      />

      <LeadDetailDrawer
        open={leadDetailOpen}
        onOpenChange={setLeadDetailOpen}
        lead={selectedLead}
        onEdit={handleLeadEdit}
        onDelete={handleLeadDelete}
      />

      <LeadDeleteDialog
        open={leadDeleteOpen}
        onOpenChange={setLeadDeleteOpen}
        lead={selectedLead}
        onSuccess={handleLeadDeleteSuccess}
      />
      </div>
    </AppShell>
  )
}