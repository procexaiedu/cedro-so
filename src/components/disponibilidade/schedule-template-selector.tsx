'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Clock, ChevronDown } from 'lucide-react'

export interface ScheduleTemplate {
  name: string
  start_time: string
  end_time: string
  description: string
}

export const SCHEDULE_TEMPLATES: ScheduleTemplate[] = [
  {
    name: 'Manhã',
    start_time: '09:00',
    end_time: '12:00',
    description: 'Período da manhã (9h às 12h)'
  },
  {
    name: 'Tarde',
    start_time: '14:00',
    end_time: '18:00',
    description: 'Período da tarde (14h às 18h)'
  },
  {
    name: 'Dia Completo',
    start_time: '09:00',
    end_time: '17:00',
    description: 'Horário comercial (9h às 17h)'
  },
  {
    name: 'Noite',
    start_time: '18:00',
    end_time: '21:00',
    description: 'Período noturno (18h às 21h)'
  },
  {
    name: 'Meio Período Manhã',
    start_time: '08:00',
    end_time: '12:00',
    description: 'Manhã estendida (8h às 12h)'
  },
  {
    name: 'Meio Período Tarde',
    start_time: '13:00',
    end_time: '17:00',
    description: 'Tarde padrão (13h às 17h)'
  }
]

interface ScheduleTemplateSelectorProps {
  onSelect: (template: ScheduleTemplate) => void
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
}

export function ScheduleTemplateSelector({
  onSelect,
  variant = 'outline',
  size = 'default'
}: ScheduleTemplateSelectorProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size}>
          <Clock className="h-4 w-4 mr-2" />
          Templates
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Templates de Horário</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {SCHEDULE_TEMPLATES.map((template) => (
          <DropdownMenuItem
            key={template.name}
            onClick={() => onSelect(template)}
            className="cursor-pointer"
          >
            <div className="flex flex-col">
              <div className="font-medium">{template.name}</div>
              <div className="text-xs text-muted-foreground">
                {template.description}
              </div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
