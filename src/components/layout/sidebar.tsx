'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  MessageSquare, 
  DollarSign, 
  UserPlus, 
  FileText,
  Clock,
  LogOut
} from 'lucide-react'
import { useSupabase } from '@/providers/supabase-provider'

const allNavigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['admin', 'therapist'],
  },
  {
    name: 'Agenda',
    href: '/agenda',
    icon: Calendar,
    roles: ['admin', 'therapist'],
  },
  {
    name: 'Disponibilidade',
    href: '/disponibilidade',
    icon: Clock,
    roles: ['admin', 'therapist'],
  },
  {
    name: 'Pacientes',
    href: '/pacientes',
    icon: Users,
    roles: ['admin', 'therapist'],
  },
  {
    name: 'Conversas',
    href: '/conversas',
    icon: MessageSquare,
    roles: ['admin'], // Apenas para admins
  },
  {
    name: 'Financeiro',
    href: '/financeiro',
    icon: DollarSign,
    roles: ['admin', 'therapist'],
  },
  {
    name: 'CRM',
    href: '/crm',
    icon: UserPlus,
    roles: ['admin'], // Apenas para admins
  },
  {
    name: 'Prontuários',
    href: '/prontuarios',
    icon: FileText,
    roles: ['admin', 'therapist'],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { signOut, user, cedroUser } = useSupabase()

  // Filtrar navegação baseado no role do usuário
  const navigation = allNavigation.filter(item => 
    cedroUser?.role ? item.roles.includes(cedroUser.role) : true
  )

  return (
    <div className="flex h-full w-64 flex-col bg-motherduck-beige border-r-standard border-motherduck-dark">
      {/* Logo */}
      <div className="flex h-20 items-center px-spacing-m border-b-standard border-motherduck-dark">
        <h1 className="font-mono text-heading-5 font-bold text-motherduck-dark uppercase tracking-wider">
          CEDRO
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-spacing-xxs px-spacing-xs py-spacing-xs">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center px-4 py-3 font-mono text-caption uppercase tracking-wider rounded-minimal transition-all border-standard',
                isActive
                  ? 'bg-motherduck-teal text-white border-motherduck-dark shadow-md'
                  : 'text-motherduck-dark border-transparent hover:bg-white hover:border-motherduck-dark'
              )}
            >
              <item.icon
                className={cn(
                  'mr-3 h-5 w-5 flex-shrink-0',
                  isActive ? 'text-white' : 'text-motherduck-dark/70 group-hover:text-motherduck-dark'
                )}
              />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      {user && cedroUser && (
        <div className="border-t-standard border-motherduck-dark p-spacing-xs">
          <div className="flex items-center mb-spacing-xxs p-spacing-xxs bg-white rounded-minimal border-standard border-motherduck-dark">
            <div className="flex-1 min-w-0">
              <p className="font-mono text-body-sm font-bold text-motherduck-dark truncate uppercase">
                {cedroUser.name}
              </p>
              <p className="text-caption text-motherduck-dark/70 truncate">
                {cedroUser.role === 'admin' ? 'ADMINISTRADOR' :
                 cedroUser.role === 'therapist' ? 'TERAPEUTA' : 'USUÁRIO'}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={signOut}
            className="w-full"
          >
            <LogOut className="mr-2 h-4 w-4" />
            SAIR
          </Button>
        </div>
      )}
    </div>
  )
}