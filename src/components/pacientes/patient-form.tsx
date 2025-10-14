'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Patient, CreatePatientData, UpdatePatientData, createPatient, updatePatient, getPatientById } from '@/data/pacientes'

const patientFormSchema = z.object({
  full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  birth_date: z.string().optional(),
  gender: z.string().optional(),
  emergency_contact: z.string().optional(),
  medical_history: z.string().optional(),
})

type PatientFormData = z.infer<typeof patientFormSchema>

interface PatientFormProps {
  patientId?: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (patient: Patient) => void
}

export function PatientForm({ patientId, open, onOpenChange, onSuccess }: PatientFormProps) {
  const [loading, setLoading] = useState(false)
  const [loadingPatient, setLoadingPatient] = useState(false)
  const isEditing = !!patientId

  const form = useForm<PatientFormData>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      birth_date: '',
      gender: '',
      emergency_contact: '',
      medical_history: '',
    },
  })

  useEffect(() => {
    if (isEditing && patientId && open) {
      loadPatient()
    } else if (!isEditing && open) {
      form.reset({
        full_name: '',
        email: '',
        phone: '',
        birth_date: '',
        gender: '',
        emergency_contact: '',
        medical_history: '',
      })
    }
  }, [patientId, open, isEditing])

  const loadPatient = async () => {
    if (!patientId) return

    setLoadingPatient(true)
    try {
      const patient = await getPatientById(patientId)
      if (patient) {
        form.reset({
          full_name: patient.full_name,
          email: patient.email,
          phone: patient.phone || '',
          birth_date: patient.birth_date || '',
          gender: patient.gender || '',
          emergency_contact: patient.emergency_contact || '',
          medical_history: patient.medical_history || '',
        })
      }
    } catch (error) {
      console.error('Error loading patient:', error)
      toast.error('Erro ao carregar dados do paciente')
    } finally {
      setLoadingPatient(false)
    }
  }

  const onSubmit = async (data: PatientFormData) => {
    setLoading(true)
    try {
      let result: Patient | null = null

      if (isEditing && patientId) {
        const updateData: UpdatePatientData = {
          full_name: data.full_name,
          email: data.email,
          phone: data.phone || undefined,
          birth_date: data.birth_date || undefined,
          gender: data.gender || undefined,
          emergency_contact: data.emergency_contact || undefined,
          medical_history: data.medical_history || undefined,
        }
        result = await updatePatient(patientId, updateData)
      } else {
        const createData: CreatePatientData = {
          full_name: data.full_name,
          email: data.email,
          phone: data.phone || undefined,
          birth_date: data.birth_date || undefined,
          gender: data.gender || undefined,
          emergency_contact: data.emergency_contact || undefined,
          medical_history: data.medical_history || undefined,
          status: 'active',
        }
        result = await createPatient(createData)
      }

      if (result) {
        toast.success(
          isEditing 
            ? 'Paciente atualizado com sucesso!' 
            : 'Paciente criado com sucesso!'
        )
        onSuccess?.(result)
        onOpenChange(false)
      } else {
        toast.error(
          isEditing 
            ? 'Erro ao atualizar paciente' 
            : 'Erro ao criar paciente'
        )
      }
    } catch (error) {
      console.error('Error saving patient:', error)
      toast.error(
        isEditing 
          ? 'Erro ao atualizar paciente' 
          : 'Erro ao criar paciente'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      onOpenChange(false)
      form.reset()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Paciente' : 'Novo Paciente'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Atualize as informações do paciente.' 
              : 'Preencha as informações para criar um novo paciente.'
            }
          </DialogDescription>
        </DialogHeader>

        {loadingPatient ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Carregando dados do paciente...</span>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Nome Completo *</FormLabel>
                      <FormControl>
                        <Input placeholder="Digite o nome completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="email@exemplo.com" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="(11) 99999-9999" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="birth_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Nascimento</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gênero</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o gênero" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="masculino">Masculino</SelectItem>
                          <SelectItem value="feminino">Feminino</SelectItem>
                          <SelectItem value="nao-binario">Não-binário</SelectItem>
                          <SelectItem value="prefiro-nao-informar">Prefiro não informar</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="emergency_contact"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Contato de Emergência</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Nome e telefone do contato de emergência" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Ex: Maria Silva - (11) 98765-4321
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="medical_history"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Histórico Médico</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descreva o histórico médico relevante do paciente..."
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Inclua informações sobre condições médicas, medicamentos, alergias, etc.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEditing ? 'Atualizar' : 'Criar'} Paciente
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}