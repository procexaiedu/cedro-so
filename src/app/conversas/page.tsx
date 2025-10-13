import { AppShell } from '@/components/layout/app-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  Send, 
  PaperclipIcon, 
  Phone, 
  Video,
  MoreVertical,
  User
} from 'lucide-react'

export default function ConversasPage() {
  const contacts = [
    { id: 1, name: 'Maria Silva', lastMessage: 'Olá, gostaria de confirmar minha consulta', time: '10:30', unread: 2 },
    { id: 2, name: 'João Santos', lastMessage: 'Obrigado pelo atendimento', time: '09:15', unread: 0 },
    { id: 3, name: 'Ana Costa', lastMessage: 'Preciso remarcar minha consulta', time: 'Ontem', unread: 0 },
    { id: 4, name: 'Pedro Lima', lastMessage: 'Vou enviar os exames solicitados', time: 'Ontem', unread: 1 },
    { id: 5, name: 'Carla Oliveira', lastMessage: 'Confirmado para amanhã', time: 'Seg', unread: 0 },
  ]

  const messages = [
    { id: 1, sender: 'patient', content: 'Olá, bom dia!', time: '10:25' },
    { id: 2, sender: 'patient', content: 'Gostaria de confirmar minha consulta para amanhã às 14h.', time: '10:26' },
    { id: 3, sender: 'user', content: 'Bom dia, Maria! Tudo bem?', time: '10:28' },
    { id: 4, sender: 'user', content: 'Sim, sua consulta está confirmada para amanhã às 14h com o Dr. Silva.', time: '10:28' },
    { id: 5, sender: 'user', content: 'Por favor, chegue com 15 minutos de antecedência para o preenchimento da ficha.', time: '10:29' },
    { id: 6, sender: 'patient', content: 'Perfeito! Muito obrigada.', time: '10:30' },
    { id: 7, sender: 'patient', content: 'Preciso trazer algum documento específico?', time: '10:30' },
  ]

  return (
    <AppShell>
      <div className="h-[calc(100vh-4rem)] flex">
        {/* Contacts Sidebar */}
        <div className="w-80 border-r flex flex-col">
          <div className="p-4 border-b">
            <h2 className="text-lg font-bold mb-4">Conversas</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar contatos..."
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {contacts.map((contact) => (
              <div 
                key={contact.id} 
                className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${
                  contact.id === 1 ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
                      {contact.name.charAt(0)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {contact.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {contact.time}
                      </p>
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {contact.lastMessage}
                    </p>
                  </div>
                  {contact.unread > 0 && (
                    <Badge className="ml-2">{contact.unread}</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
                M
              </div>
              <div>
                <h3 className="font-medium">Maria Silva</h3>
                <p className="text-xs text-gray-500">Online</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Phone className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Video className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <User className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      message.sender === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white border'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p
                      className={`text-xs mt-1 text-right ${
                        message.sender === 'user' ? 'text-blue-100' : 'text-gray-400'
                      }`}
                    >
                      {message.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Message Input */}
          <div className="p-4 border-t">
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <PaperclipIcon className="h-5 w-5" />
              </Button>
              <Input
                placeholder="Digite sua mensagem..."
                className="flex-1"
              />
              <Button>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}