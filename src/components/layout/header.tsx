'use client'

import { Bell, Search, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { useSupabase } from '@/providers/supabase-provider'

export function Header() {
  const { user, signOut } = useSupabase()

  return (
    <header className="h-20 bg-motherduck-beige border-b-standard border-motherduck-dark flex items-center justify-between px-spacing-m">
      {/* Logo/Brand */}
      <div className="font-mono text-heading-6 uppercase tracking-wider text-motherduck-dark font-bold">
        CEDRO
      </div>

      {/* Search */}
      <div className="flex-1 max-w-2xl mx-spacing-m">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-motherduck-dark/50 h-5 w-5" />
          <Input
            placeholder="BUSCAR PACIENTES, AGENDAMENTOS..."
            className="pl-12 bg-white uppercase placeholder:text-motherduck-dark/40 text-body-sm"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-spacing-xxs">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs border-standard border-motherduck-dark rounded-full"
          >
            3
          </Badge>
        </Button>

        {/* Settings */}
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-minimal">
              <div className="h-10 w-10 rounded-minimal bg-motherduck-teal border-standard border-motherduck-dark flex items-center justify-center text-white text-body-sm font-mono font-bold">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 border-standard border-motherduck-dark rounded-minimal" align="end" forceMount>
            <DropdownMenuLabel className="font-mono uppercase text-caption">
              <div className="flex flex-col space-y-1">
                <p className="text-body-sm font-bold leading-none">
                  {user?.user_metadata?.name || 'USUÁRIO'}
                </p>
                <p className="text-caption leading-none text-motherduck-dark/70 normal-case">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-motherduck-dark/20" />
            <DropdownMenuItem className="font-mono uppercase text-caption">
              PERFIL
            </DropdownMenuItem>
            <DropdownMenuItem className="font-mono uppercase text-caption">
              CONFIGURAÇÕES
            </DropdownMenuItem>
            <DropdownMenuItem className="font-mono uppercase text-caption">
              SUPORTE
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-motherduck-dark/20" />
            <DropdownMenuItem onClick={signOut} className="font-mono uppercase text-caption text-destructive">
              SAIR
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}