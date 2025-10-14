'use client'

import { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  Lead, 
  LeadStage, 
  getStageText, 
  getStageColor, 
  getScoreColor,
  formatDate 
} from '@/data/crm'
import { 
  Phone, 
  Mail, 
  Star, 
  Calendar, 
  User,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface KanbanBoardProps {
  leads: Lead[]
  onLeadUpdate: (leadId: string, stage: LeadStage) => void
  onLeadView: (lead: Lead) => void
  onLeadEdit: (lead: Lead) => void
  onLeadDelete: (lead: Lead) => void
}

interface KanbanColumn {
  id: LeadStage
  title: string
  color: string
  leads: Lead[]
}

const COLUMN_DEFINITIONS: Omit<KanbanColumn, 'leads'>[] = [
  { id: 'lead', title: 'Leads', color: 'bg-blue-50 border-blue-200' },
  { id: 'mql', title: 'MQL', color: 'bg-green-50 border-green-200' },
  { id: 'sql', title: 'SQL', color: 'bg-yellow-50 border-yellow-200' },
  { id: 'won', title: 'Convertidos', color: 'bg-emerald-50 border-emerald-200' },
  { id: 'lost', title: 'Perdidos', color: 'bg-red-50 border-red-200' }
]

export function KanbanBoard({ leads, onLeadUpdate, onLeadView, onLeadEdit, onLeadDelete }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // Group leads by stage
  const columns: KanbanColumn[] = COLUMN_DEFINITIONS.map(col => ({
    ...col,
    leads: leads.filter(lead => lead.stage === col.id)
  }))

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id as string)
    
    const lead = leads.find(l => l.id === active.id)
    setDraggedLead(lead || null)
  }

  const handleDragOver = (event: DragOverEvent) => {
    // Handle drag over logic if needed
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) {
      setActiveId(null)
      setDraggedLead(null)
      return
    }

    const leadId = active.id as string
    const newStage = over.id as LeadStage

    // Check if the lead is being dropped on a different column
    const lead = leads.find(l => l.id === leadId)
    if (lead && lead.stage !== newStage) {
      onLeadUpdate(leadId, newStage)
    }

    setActiveId(null)
    setDraggedLead(null)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 overflow-x-auto pb-4">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            onLeadView={onLeadView}
            onLeadEdit={onLeadEdit}
            onLeadDelete={onLeadDelete}
          />
        ))}
      </div>

      <DragOverlay>
        {draggedLead ? (
          <LeadCard
            lead={draggedLead}
            onView={() => {}}
            onEdit={() => {}}
            onDelete={() => {}}
            isDragging
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

interface KanbanColumnProps {
  column: KanbanColumn
  onLeadView: (lead: Lead) => void
  onLeadEdit: (lead: Lead) => void
  onLeadDelete: (lead: Lead) => void
}

function KanbanColumn({ column, onLeadView, onLeadEdit, onLeadDelete }: KanbanColumnProps) {
  const {
    setNodeRef,
    isOver
  } = useSortable({
    id: column.id,
    data: {
      type: 'column',
      stage: column.id
    }
  })

  return (
    <div
      ref={setNodeRef}
      className={`min-w-[300px] max-w-[300px] ${column.color} rounded-lg border-2 border-dashed transition-colors ${
        isOver ? 'border-blue-400 bg-blue-100' : ''
      }`}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">{column.title}</h3>
          <Badge variant="secondary" className="text-xs">
            {column.leads.length}
          </Badge>
        </div>

        <SortableContext items={column.leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {column.leads.map((lead) => (
              <SortableLeadCard
                key={lead.id}
                lead={lead}
                onView={onLeadView}
                onEdit={onLeadEdit}
                onDelete={onLeadDelete}
              />
            ))}
          </div>
        </SortableContext>

        {column.leads.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-sm">
            Nenhum lead nesta etapa
          </div>
        )}
      </div>
    </div>
  )
}

interface SortableLeadCardProps {
  lead: Lead
  onView: (lead: Lead) => void
  onEdit: (lead: Lead) => void
  onDelete: (lead: Lead) => void
}

function SortableLeadCard({ lead, onView, onEdit, onDelete }: SortableLeadCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: lead.id,
    data: {
      type: 'lead',
      lead
    }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <LeadCard
        lead={lead}
        onView={onView}
        onEdit={onEdit}
        onDelete={onDelete}
        isDragging={isDragging}
      />
    </div>
  )
}

interface LeadCardProps {
  lead: Lead
  onView: (lead: Lead) => void
  onEdit: (lead: Lead) => void
  onDelete: (lead: Lead) => void
  isDragging?: boolean
}

function LeadCard({ lead, onView, onEdit, onDelete, isDragging = false }: LeadCardProps) {
  const getInitials = (name: string) => {
    return (name || '')
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Card className={`cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md ${
      isDragging ? 'shadow-lg rotate-2' : ''
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {getInitials(lead.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-sm font-medium">{lead.name}</CardTitle>
              <p className="text-xs text-muted-foreground">{lead.source}</p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(lead)}>
                <Eye className="mr-2 h-4 w-4" />
                Visualizar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(lead)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(lead)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* Contact Info */}
        <div className="space-y-1">
          <div className="flex items-center text-xs text-muted-foreground">
            <Mail className="mr-2 h-3 w-3" />
            <span className="truncate">{lead.email}</span>
          </div>
          {lead.phone && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Phone className="mr-2 h-3 w-3" />
              <span>{lead.phone}</span>
            </div>
          )}
        </div>

        {/* Score */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <Star className={`h-3 w-3 ${getScoreColor(lead.score)}`} />
            <span className={`text-xs font-medium ${getScoreColor(lead.score)}`}>
              {lead.score}
            </span>
          </div>
          <Badge variant={getStageColor(lead.stage)} className="text-xs">
            {getStageText(lead.stage)}
          </Badge>
        </div>

        {/* Assigned To */}
        {lead.assigned_to_name && (
          <div className="flex items-center text-xs text-muted-foreground">
            <User className="mr-2 h-3 w-3" />
            <span className="truncate">{lead.assigned_to_name}</span>
          </div>
        )}

        {/* Last Contact */}
        {lead.last_contact && (
          <div className="flex items-center text-xs text-muted-foreground">
            <Calendar className="mr-2 h-3 w-3" />
            <span>Último contato: {formatDate(lead.last_contact)}</span>
          </div>
        )}

        {/* Next Action */}
        {lead.next_action && (
          <div className="bg-gray-50 rounded p-2">
            <p className="text-xs font-medium text-gray-700">Próxima ação:</p>
            <p className="text-xs text-gray-600">{lead.next_action}</p>
          </div>
        )}

        {/* Notes Preview */}
        {lead.notes && (
          <div className="bg-blue-50 rounded p-2">
            <p className="text-xs text-blue-700 line-clamp-2">{lead.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}