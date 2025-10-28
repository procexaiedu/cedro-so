'use client'

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
  User,
  Loader2
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { fetchWithTimeout, NETWORK_CONFIG } from '@/lib/network-config'

// Tipos para TypeScript
interface Conversation {
  id: string
  contact_key: string
  contact_name: string
  channel: string
  last_message: string
  last_message_at: string
  unread_count: number
  created_at: string
  updated_at: string
}

interface Message {
  id: string
  external_msg_id: string
  direction: 'inbound' | 'outbound'
  from_addr: string
  to_addr: string[]
  body_text: string
  attachments: any
  sent_at: string
  received_at: string
  created_at: string
}

interface MessagesResponse {
  messages: Message[]
  pagination: {
    page: number
    limit: number
    total: number
  }
}

interface MessageContent {
  type: 'text' | 'image' | 'audio' | 'video' | 'document' | 'edited' | 'unknown'
  content?: string
  url?: string
  mimetype?: string
  originalContent?: string
}

export default function ConversasPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [showCloserModal, setShowCloserModal] = useState(false)

  // Carregar conversas
  useEffect(() => {
    loadConversations()
  }, [])

  // Carregar mensagens quando uma conversa é selecionada
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id)
    }
  }, [selectedConversation])

  const loadConversations = async () => {
    try {
      setLoading(true)
      const response = await fetchWithTimeout('http://localhost:3001/api/conversations', {
        timeout: NETWORK_CONFIG.DEFAULT_TIMEOUT
      })
      if (!response.ok) throw new Error('Erro ao carregar conversas')
      
      const data = await response.json()
      setConversations(data)
      
      // Selecionar primeira conversa automaticamente
      if (data.length > 0 && !selectedConversation) {
        setSelectedConversation(data[0])
      }
    } catch (error) {
      console.error('Erro ao carregar conversas:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (conversationId: string) => {
    try {
      setMessagesLoading(true)
      const response = await fetchWithTimeout(`http://localhost:3001/api/conversations/${conversationId}/messages`, {
        timeout: NETWORK_CONFIG.DEFAULT_TIMEOUT
      })
      if (!response.ok) throw new Error('Erro ao carregar mensagens')
      
      const data: MessagesResponse = await response.json()
      setMessages(data.messages.reverse()) // Ordem cronológica
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error)
    } finally {
      setMessagesLoading(false)
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    } else if (diffInHours < 48) {
      return 'Ontem'
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    }
  }

  const processMessageContent = (bodyText: string) => {
    try {
      // Verificar se é um JSON de mídia
      if (bodyText.startsWith('{') && (bodyText.includes('Message') || bodyText.includes('message'))) {
        const mediaData = JSON.parse(bodyText)
        
        // Processar documento
        if (mediaData.documentMessage) {
          const doc = mediaData.documentMessage
          return {
            type: 'document',
            title: doc.title || doc.fileName || 'Documento',
            fileName: doc.fileName,
            mimetype: doc.mimetype,
            url: doc.url
          }
        }
        
        // Processar imagem
        if (mediaData.imageMessage) {
          const img = mediaData.imageMessage
          return {
            type: 'image',
            url: img.url,
            width: img.width,
            height: img.height,
            mimetype: img.mimetype
          }
        }
        
        // Processar sticker
        if (mediaData.stickerMessage) {
          return {
            type: 'sticker',
            url: mediaData.stickerMessage.url,
            isAnimated: mediaData.stickerMessage.isAnimated || false,
            mimetype: mediaData.stickerMessage.mimetype
          }
        }
        
        // Processar mensagem editada
        if (mediaData.editedMessage) {
          const editedMsg = mediaData.editedMessage
          // Tentar extrair o conteúdo da mensagem editada
          if (editedMsg.message && editedMsg.message.protocolMessage && editedMsg.message.protocolMessage.editedMessage) {
            const editedContent = editedMsg.message.protocolMessage.editedMessage
            if (editedContent.conversation) {
              return {
                type: 'edited',
                content: editedContent.conversation,
                originalContent: bodyText
              }
            }
          }
          return {
            type: 'edited',
            content: 'Mensagem editada',
            originalContent: bodyText
          }
        }
        
        // Processar áudio
        if (mediaData.audioMessage) {
          return {
            type: 'audio',
            url: mediaData.audioMessage.url,
            mimetype: mediaData.audioMessage.mimetype
          }
        }
        
        // Processar vídeo
        if (mediaData.videoMessage) {
          return {
            type: 'video',
            url: mediaData.videoMessage.url,
            mimetype: mediaData.videoMessage.mimetype
          }
        }
        
        // Fallback para JSON não reconhecido - tentar extrair campo "conversation"
        if (mediaData.conversation) {
          return {
            type: 'text',
            content: mediaData.conversation
          }
        }
        
        // Se chegou até aqui, é um JSON que não conseguimos processar
        return {
          type: 'unknown',
          content: 'Mensagem de mídia não suportada',
          originalContent: bodyText
        }
      }
      
      // Retornar texto normal
      return {
        type: 'text',
        content: bodyText
      }
    } catch (error) {
      // Se não conseguir fazer parse, retornar como texto
      return {
        type: 'text',
        content: bodyText
      }
    }
  }

  const getContactInitial = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : '?'
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return
    
    try {
      const response = await fetchWithTimeout(`http://localhost:3001/api/conversations/${selectedConversation.id}/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: newMessage }),
        timeout: NETWORK_CONFIG.DEFAULT_TIMEOUT
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao enviar mensagem')
      }
      
      const result = await response.json()
      console.log('✅ Mensagem enviada:', result)
      
      // Limpar campo de mensagem
      setNewMessage('')
      
      // Recarregar mensagens para mostrar a nova mensagem
      await loadMessages(selectedConversation.id)
      
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error)
      alert(`Erro ao enviar mensagem: ${error.message}`)
    }
  }

  const handleActivateCloser = async () => {
    if (!selectedConversation) return
    
    try {
      const response = await fetchWithTimeout(`http://localhost:3001/api/conversations/${selectedConversation.id}/closer`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ closer_active: true }),
        timeout: NETWORK_CONFIG.DEFAULT_TIMEOUT
      })
      
      if (!response.ok) throw new Error('Erro ao ativar closer')
      
      // Atualizar a conversa local
      setConversations(prev => prev.map(conv => 
        conv.id === selectedConversation.id 
          ? { ...conv, closer_active: true }
          : conv
      ))
      
      setShowCloserModal(false)
      alert('Closer ativado com sucesso!')
    } catch (error) {
      console.error('Erro ao ativar closer:', error)
      alert('Erro ao ativar closer')
    }
  }

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
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              conversations.map((conversation) => (
                <div 
                  key={conversation.id} 
                  className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${
                    selectedConversation?.id === conversation.id ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
                        {getContactInitial(conversation.contact_name)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {conversation.contact_name || conversation.contact_key}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatTime(conversation.last_message_at)}
                        </p>
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {conversation.last_message}
                      </p>
                    </div>
                    {conversation.unread_count > 0 && (
                      <Badge className="ml-2">{conversation.unread_count}</Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
                {selectedConversation ? getContactInitial(selectedConversation.contact_name) : '?'}
              </div>
              <div>
                <h3 className="font-medium">
                  {selectedConversation ? (selectedConversation.contact_name || selectedConversation.contact_key) : 'Selecione uma conversa'}
                </h3>
                <p className="text-xs text-gray-500">
                  {selectedConversation ? selectedConversation.channel : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={() => setShowCloserModal(true)}>
                <User className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
            {messagesLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.direction === 'outbound' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        message.direction === 'outbound'
                          ? 'bg-blue-500 text-white'
                          : 'bg-white border'
                      }`}
                    >
                      {(() => {
                        const content = processMessageContent(message.body_text)
                        
                        switch (content.type) {
                          case 'document':
                            return (
                              <div className="flex items-center space-x-2">
                                <PaperclipIcon className="h-4 w-4" />
                                <div>
                                  <p className="text-sm font-medium">{content.title}</p>
                                  <p className="text-xs opacity-70">{content.fileName}</p>
                                </div>
                              </div>
                            )
                          
                          case 'image':
                            return (
                              <div>
                                <div className="bg-gray-200 rounded p-2 mb-1">
                                  <div className="flex items-center space-x-2">
                                    <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                                      <span className="text-white text-xs">📷</span>
                                    </div>
                                    <span className="text-sm">Imagem</span>
                                  </div>
                                </div>
                              </div>
                            )
                          
                          case 'audio':
                            return (
                              <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-xs">🎵</span>
                                </div>
                                <span className="text-sm">Áudio</span>
                              </div>
                            )
                          
                          case 'video':
                            return (
                              <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center">
                                  <span className="text-white text-xs">🎬</span>
                                </div>
                                <span className="text-sm">Vídeo</span>
                              </div>
                            )
                          
                          case 'sticker':
                            return (
                              <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-yellow-500 rounded flex items-center justify-center">
                                  <span className="text-white text-xs">😀</span>
                                </div>
                                <span className="text-sm">
                                  {content.isAnimated ? 'Sticker Animado' : 'Sticker'}
                                </span>
                              </div>
                            )
                          
                          case 'edited':
                            return (
                              <div>
                                <div className="flex items-center space-x-1 mb-1">
                                  <span className="text-xs opacity-60">✏️ editado</span>
                                </div>
                                <p className="text-sm whitespace-pre-wrap">{content.content}</p>
                              </div>
                            )
                          
                          case 'unknown':
                            return (
                              <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-gray-500 rounded flex items-center justify-center">
                                  <span className="text-white text-xs">❓</span>
                                </div>
                                <div>
                                  <p className="text-sm whitespace-pre-wrap">{content.content}</p>
                                  <p className="text-xs opacity-60">Tipo de mensagem não suportado</p>
                                </div>
                              </div>
                            )
                          
                          default:
                            return <p className="text-sm whitespace-pre-wrap">{content.content}</p>
                        }
                      })()}
                      <p
                        className={`text-xs mt-1 text-right ${
                          message.direction === 'outbound' ? 'text-blue-100' : 'text-gray-400'
                        }`}
                      >
                        {formatTime(message.sent_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={!selectedConversation}
              />
              <Button onClick={handleSendMessage} disabled={!selectedConversation || !newMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Confirmação do Closer */}
      {showCloserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Ativar Closer</h3>
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja ativar o closer para esta conversa? 
              Isso fará com que o agente não seja mais acionado para responder mensagens.
            </p>
            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setShowCloserModal(false)}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleActivateCloser}
                className="bg-red-600 hover:bg-red-700"
              >
                Ativar Closer
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}