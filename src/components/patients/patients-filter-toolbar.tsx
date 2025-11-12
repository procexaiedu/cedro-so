'use client'

import React from 'react'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PatientFilters } from '@/data/pacientes'

interface PatientsFilterToolbarProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  onSearch: () => void
  filters: PatientFilters
  onFilterChange: (key: keyof PatientFilters, value: string) => void
  therapists: Array<{ id: string; name: string }>
  hasActiveFilters: boolean
  onClearFilters: () => void
}

export function PatientsFilterToolbar({
  searchTerm,
  onSearchChange,
  onSearch,
  filters,
  onFilterChange,
  therapists,
  hasActiveFilters,
  onClearFilters
}: PatientsFilterToolbarProps) {
  return (
    <div className="sticky top-0 z-40 bg-white border-b-standard border-motherduck-dark shadow-sm">
      <div className="p-spacing-m">
        <div className="flex flex-col gap-spacing-xs md:flex-row md:gap-spacing-m md:items-center">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email ou telefone..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearch()}
              className="pl-8"
            />
          </div>

          {/* Status Filter */}
          <Select
            value={filters.status || 'todos'}
            onValueChange={(value) => onFilterChange('status', value)}
          >
            <SelectTrigger className="w-full md:w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Status</SelectItem>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="inactive">Inativo</SelectItem>
              <SelectItem value="suspended">Suspenso</SelectItem>
            </SelectContent>
          </Select>

          {/* Therapist Filter */}
          <Select
            value={filters.therapistId || 'todos'}
            onValueChange={(value) => onFilterChange('therapistId', value)}
          >
            <SelectTrigger className="w-full md:w-[160px]">
              <SelectValue placeholder="Terapeuta" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {therapists.map(therapist => (
                <SelectItem key={therapist.id} value={therapist.id}>
                  {therapist.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
              className="w-full md:w-auto"
            >
              <X className="mr-2 h-4 w-4" />
              Limpar
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
