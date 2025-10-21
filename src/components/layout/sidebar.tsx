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
    <div className="flex h-full w-64 flex-col bg-gray-50 border-r">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b">
        <h1 className="text-xl font-bold text-gray-900">Sistema Cedro</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <item.icon
                className={cn(
                  'mr-3 h-5 w-5 flex-shrink-0',
                  isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                )}
              />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      {user && cedroUser && (
        <div className="border-t p-4">
          <div className="flex items-center mb-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {cedroUser.name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {cedroUser.role === 'admin' ? 'Administrador' : 
                 cedroUser.role === 'therapist' ? 'Terapeuta' : 'Usuário'}
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
            Sair
          </Button>
        </div>
      )}
    </div>
  )
}