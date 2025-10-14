'use client'

import { useState, useEffect } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Lead, 
  LeadActivity,
  getStageText, 
  getStageColor, 
  getScoreColor,
  formatDate,
  formatDateTime
} from '@/data/crm'
import { 
  Phone, 
  Mail, 
  Star, 
  Calendar, 
  User,
  Edit,
  Trash2,
  MessageSquare,
  Clock,
  Target,
  TrendingUp,
  FileText,
  Activity,
  MapPin,
  Globe,
  Building
} from 'lucide-react'
import { toast } from 'sonner'

interface LeadDetailDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lead: Lead | null
  onEdit: (lead: Lead) => void
  onDelete: (lead: Lead) => void
}

export function LeadDetailDrawer({ 
  open, 
  onOpenChange, 
  lead, 
  onEdit, 
  onDelete 
}: LeadDetailDrawerProps) {
  const [activities, setActivities] = useState<LeadActivity[]>([])
  const [loadingActivities, setLoadingActivities] = useState(false)

  // Load activities when lead changes
  useEffect(() => {
    if (lead && open) {
      loadActivities()
    }
  }, [lead, open])

  const loadActivities = async () => {
    if (!lead) return
    
    setLoadingActivities(true)
    try {
      // Mock activities for now - replace with actual API call
      const mockActivities: LeadActivity[] = [
        {
          id: '1',
          lead_id: lead.id,
          type: 'created',
          description: 'Lead criado no sistema',
          created_at: lead.created_at,
          created_by: 'sistema',
          created_by_name: 'Sistema',
          metadata: {}
        },
        {
          id: '2',
          lead_id: lead.id,
          type: 'stage_change',
          description: `Estágio alterado para ${getStageText(lead.stage)}`,
          created_at: lead.updated_at,
          created_by: lead.assigned_to || 'sistema',
          created_by_name: lead.assigned_to_name || 'Sistema',
          metadata: { new_stage: lead.stage }
        },
        {
          id: '3',
          lead_id: lead.id,
          type: 'contact',
          description: 'Primeiro contato realizado via telefone',
          created_at: lead.last_contact || lead.created_at,
          created_by: lead.assigned_to || 'sistema',
          created_by_name: lead.assigned_to_name || 'Sistema',
          metadata: { contact_method: 'phone' }
        }
      ]
      
      setActivities(mockActivities.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ))
    } catch (error) {
      console.error('Error loading activities:', error)
      toast.error('Erro ao carregar atividades')
    } finally {
      setLoadingActivities(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'created':
        return <User className="h-4 w-4" />
      case 'stage_change':
        return <TrendingUp className="h-4 w-4" />
      case 'contact':
        return <Phone className="h-4 w-4" />
      case 'email':
        return <Mail className="h-4 w-4" />
      case 'note':
        return <FileText className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'created':
        return 'text-blue-600 bg-blue-100'
      case 'stage_change':
        return 'text-green-600 bg-green-100'
      case 'contact':
        return 'text-purple-600 bg-purple-100'
      case 'email':
        return 'text-orange-600 bg-orange-100'
      case 'note':
        return 'text-gray-600 bg-gray-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  if (!lead) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] sm:w-[700px] sm:max-w-[700px]">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="text-lg">
                  {getInitials(lead.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <SheetTitle className="text-xl">{lead.name}</SheetTitle>
                <SheetDescription className="flex items-center space-x-2">
                  <Badge variant={getStageColor(lead.stage)}>
                    {getStageText(lead.stage)}
                  </Badge>
                  <span>•</span>
                  <span>{lead.source}</span>
                </SheetDescription>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={() => onEdit(lead)}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onDelete(lead)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            </div>
          </div>
        </SheetHeader>

        <Tabs defaultValue="overview" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="activities">Atividades</TabsTrigger>
            <TabsTrigger value="details">Detalhes</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <ScrollArea className="h-[calc(100vh-200px)]">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <User className="mr-2 h-5 w-5" />
                    Informações de Contato
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center space-x-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Email</p>
                        <p className="text-sm text-muted-foreground">{lead.email}</p>
                      </div>
                    </div>
                    
                    {lead.phone && (
                      <div className="flex items-center space-x-3">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Telefone</p>
                          <p className="text-sm text-muted-foreground">{lead.phone}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Lead Score & Stage */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Target className="mr-2 h-5 w-5" />
                    Score e Estágio
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Star className={`h-5 w-5 ${getScoreColor(lead.score)}`} />
                      <span className="font-medium">Score:</span>
                    </div>
                    <Badge variant="outline" className={getScoreColor(lead.score)}>
                      {lead.score}/100
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Estágio:</span>
                    <Badge variant={getStageColor(lead.stage)}>
                      {getStageText(lead.stage)}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Fonte:</span>
                    <Badge variant="outline">{lead.source}</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Assignment & Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Calendar className="mr-2 h-5 w-5" />
                    Responsável e Ações
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {lead.assigned_to_name && (
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Responsável:</span>
                      <span className="text-sm">{lead.assigned_to_name}</span>
                    </div>
                  )}
                  
                  {lead.last_contact && (
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Último Contato:</span>
                      <span className="text-sm">{formatDate(lead.last_contact)}</span>
                    </div>
                  )}
                  
                  {lead.next_action && (
                    <div>
                      <p className="font-medium mb-2">Próxima Ação:</p>
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm text-blue-800">{lead.next_action}</p>
                        {lead.next_action_date && (
                          <p className="text-xs text-blue-600 mt-1">
                            Data: {formatDate(lead.next_action_date)}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Notes */}
              {lead.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <FileText className="mr-2 h-5 w-5" />
                      Observações
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">{lead.notes}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="activities" className="space-y-4">
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Timeline de Atividades</h3>
                  <Button variant="outline" size="sm">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Nova Atividade
                  </Button>
                </div>

                {loadingActivities ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="text-sm text-muted-foreground mt-2">Carregando atividades...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activities.map((activity, index) => (
                      <div key={activity.id} className="flex space-x-4">
                        <div className="flex flex-col items-center">
                          <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
                            {getActivityIcon(activity.type)}
                          </div>
                          {index < activities.length - 1 && (
                            <div className="w-px h-8 bg-gray-200 mt-2" />
                          )}
                        </div>
                        
                        <div className="flex-1 pb-4">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">{activity.description}</p>
                            <span className="text-xs text-muted-foreground">
                              {formatDateTime(activity.created_at)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            por {activity.created_by_name}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="space-y-6">
                {/* System Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Clock className="mr-2 h-5 w-5" />
                      Informações do Sistema
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">ID:</span>
                      <span className="text-sm text-muted-foreground">{lead.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Criado em:</span>
                      <span className="text-sm text-muted-foreground">
                        {formatDateTime(lead.created_at)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Atualizado em:</span>
                      <span className="text-sm text-muted-foreground">
                        {formatDateTime(lead.updated_at)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Lead Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <TrendingUp className="mr-2 h-5 w-5" />
                      Métricas do Lead
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Probabilidade de Conversão:</span>
                      <span className="text-sm text-muted-foreground">
                        {Math.round((lead.score / 100) * 100)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Tempo no Pipeline:</span>
                      <span className="text-sm text-muted-foreground">
                        {Math.ceil((new Date().getTime() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24))} dias
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Última Interação:</span>
                      <span className="text-sm text-muted-foreground">
                        {lead.last_contact ? formatDate(lead.last_contact) : 'Nunca'}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Ações Rápidas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" size="sm" className="justify-start">
                        <Phone className="h-4 w-4 mr-2" />
                        Ligar
                      </Button>
                      <Button variant="outline" size="sm" className="justify-start">
                        <Mail className="h-4 w-4 mr-2" />
                        Enviar Email
                      </Button>
                      <Button variant="outline" size="sm" className="justify-start">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        WhatsApp
                      </Button>
                      <Button variant="outline" size="sm" className="justify-start">
                        <Calendar className="h-4 w-4 mr-2" />
                        Agendar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}