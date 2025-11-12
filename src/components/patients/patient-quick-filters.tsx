'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import type { PatientFilters } from '@/data/pacientes'

interface QuickFilterChip {
  id: string
  label: string
  description?: string
  icon?: React.ReactNode
}

interface PatientQuickFiltersProps {
  activeFilters: PatientFilters
  onFilterChange: (key: keyof PatientFilters, value: string | undefined) => void
  quickFilters?: QuickFilterChip[]
}

const DEFAULT_QUICK_FILTERS: QuickFilterChip[] = [
  {
    id: 'active',
    label: 'Ativos',
    description: 'Pacientes não pausados'
  },
  {
    id: 'on-hold',
    label: 'Em Pausa',
    description: 'Pacientes em pausa'
  },
  {
    id: 'no-appointment',
    label: 'Sem Agendamento',
    description: 'Sem próxima consulta'
  },
  {
    id: 'new',
    label: 'Novos (7d)',
    description: 'Criados nos últimos 7 dias'
  }
]

export function PatientQuickFilters({
  activeFilters,
  onFilterChange,
  quickFilters = DEFAULT_QUICK_FILTERS
}: PatientQuickFiltersProps) {
  const activeFilterCount = Object.values(activeFilters).filter(v => v !== undefined).length

  const isFilterActive = (filterId: string) => {
    switch (filterId) {
      case 'active':
        return activeFilters.status === 'active'
      case 'on-hold':
        return activeFilters.status === 'inactive'
      case 'no-appointment':
        // This would need custom implementation in the API
        return false
      case 'new':
        // This would need custom implementation in the API
        return false
      default:
        return false
    }
  }

  const handleFilterClick = (filterId: string) => {
    switch (filterId) {
      case 'active':
        onFilterChange('status', activeFilters.status === 'active' ? undefined : 'active')
        break
      case 'on-hold':
        onFilterChange('status', activeFilters.status === 'inactive' ? undefined : 'inactive')
        break
      case 'no-appointment':
        // Would need API implementation
        break
      case 'new':
        // Would need API implementation
        break
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Filtros Rápidos</h3>
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onFilterChange('status', undefined)
              onFilterChange('therapistId', undefined)
            }}
            className="h-6 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Limpar ({activeFilterCount})
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {quickFilters.map((filter) => (
          <Badge
            key={filter.id}
            variant={isFilterActive(filter.id) ? 'default' : 'outline'}
            className="cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => handleFilterClick(filter.id)}
            title={filter.description}
          >
            {filter.label}
          </Badge>
        ))}
      </div>
    </div>
  )
}
