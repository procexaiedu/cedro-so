'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { 
  Lead, 
  CreateLeadData, 
  UpdateLeadData, 
  LeadStage,
  createLead,
  updateLead,
  getTherapistsForAssignment,
  getLeadSources
} from '@/data/crm'

const leadFormSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  source: z.string().min(1, 'Fonte é obrigatória'),
  stage: z.enum(['lead', 'mql', 'sql', 'won', 'lost']),
  assigned_to: z.string().optional(),
  score: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
  next_action: z.string().optional(),
  next_action_date: z.string().optional(),
})

type LeadFormData = z.infer<typeof leadFormSchema>

interface LeadFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lead?: Lead | null
  onSuccess: () => void
}

interface Therapist {
  id: string
  name: string
}

export function LeadForm({ open, onOpenChange, lead, onSuccess }: LeadFormProps) {
  const [loading, setLoading] = useState(false)
  const [therapists, setTherapists] = useState<Therapist[]>([])
  const [sources, setSources] = useState<string[]>([])

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      source: '',
      stage: 'lead',
      assigned_to: '',
      notes: '',
      next_action: '',
      next_action_date: '',
    },
  })

  // Load therapists and sources when component mounts
  useEffect(() => {
    const loadData = async () => {
      try {
        const [therapistsData, sourcesData] = await Promise.all([
          getTherapistsForAssignment(),
          getLeadSources()
        ])
        setTherapists(therapistsData)
        setSources(sourcesData)
      } catch (error) {
        console.error('Error loading form data:', error)
        toast.error('Erro ao carregar dados do formulário')
      }
    }

    if (open) {
      loadData()
    }
  }, [open])

  // Reset form when lead changes or dialog opens
  useEffect(() => {
    if (open) {
      if (lead) {
        // Editing existing lead
        form.reset({
          name: lead.name,
          email: lead.email,
          phone: lead.phone || '',
          source: lead.source,
          stage: lead.stage,
          assigned_to: lead.assigned_to || '',
          notes: lead.notes || '',
          next_action: lead.next_action || '',
          next_action_date: lead.next_action_date || '',
        })
      } else {
        // Creating new lead
        form.reset({
          name: '',
          email: '',
          phone: '',
          source: '',
          stage: 'lead',
          assigned_to: '',
          notes: '',
          next_action: '',
          next_action_date: '',
        })
      }
    }
  }, [lead, open, form])

  const onSubmit = async (data: LeadFormData) => {
    setLoading(true)
    
    try {
      if (lead) {
        // Update existing lead
        const updateData: UpdateLeadData = {
          name: data.name,
          email: data.email,
          phone: data.phone || undefined,
          source: data.source,
          stage: data.stage,
          assigned_to: data.assigned_to || undefined,
          score: data.score || 50,
          notes: data.notes || undefined,
        }
        
        await updateLead(lead.id, updateData)
        toast.success('Lead atualizado com sucesso!')
      } else {
        // Create new lead
        const createData: CreateLeadData = {
          name: data.name,
          email: data.email,
          phone: data.phone || undefined,
          source: data.source,
          score: data.score || 50,
          notes: data.notes || undefined,
          assigned_to: data.assigned_to || undefined,
        }
        
        await createLead(createData)
        toast.success('Lead criado com sucesso!')
      }
      
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving lead:', error)
      toast.error(lead ? 'Erro ao atualizar lead' : 'Erro ao criar lead')
    } finally {
      setLoading(false)
    }
  }

  const stageOptions = [
    { value: 'lead', label: 'Lead' },
    { value: 'mql', label: 'MQL (Marketing Qualified Lead)' },
    { value: 'sql', label: 'SQL (Sales Qualified Lead)' },
    { value: 'won', label: 'Convertido' },
    { value: 'lost', label: 'Perdido' },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {lead ? 'Editar Lead' : 'Novo Lead'}
          </DialogTitle>
          <DialogDescription>
            {lead 
              ? 'Atualize as informações do lead abaixo.'
              : 'Preencha as informações para criar um novo lead.'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@exemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Phone */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input placeholder="(11) 99999-9999" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Source */}
              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fonte *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a fonte" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sources.map((source) => (
                          <SelectItem key={source} value={source}>
                            {source}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Stage */}
              <FormField
                control={form.control}
                name="stage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estágio</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o estágio" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {stageOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Assigned To */}
              <FormField
                control={form.control}
                name="assigned_to"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsável</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um terapeuta" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {therapists.map((therapist) => (
                          <SelectItem key={therapist.id} value={therapist.id}>
                            {therapist.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />



              {/* Next Action Date */}
              <FormField
                control={form.control}
                name="next_action_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data da Próxima Ação</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Next Action */}
            <FormField
              control={form.control}
              name="next_action"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Próxima Ação</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Ligar para agendar consulta" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Observações sobre o lead..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {lead ? 'Atualizar' : 'Criar'} Lead
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}