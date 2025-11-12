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
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Patient, CreatePatientData, UpdatePatientData, getPatientById, createPatientTherapistLink } from '@/data/pacientes'
import { useCreatePatient, useUpdatePatient } from '@/hooks/use-patients'
import { CedroUser } from '@/lib/auth'

const patientFormSchema = z.object({
  full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().min(1).optional().or(z.literal('')),
  birth_date: z.string().optional(),
  gender: z.string().optional(),
  cpf: z.string().optional(),
  is_christian: z.boolean().optional(),
  origin: z.string().optional(),
  marital_status: z.string().optional(),
  occupation: z.string().optional(),
  notes: z.string().optional(),
})

type PatientFormData = z.infer<typeof patientFormSchema>

interface PatientFormProps {
  patientId?: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (patient: Patient) => void
  cedroUser?: CedroUser | null
}

export function PatientForm({ patientId, open, onOpenChange, onSuccess, cedroUser }: PatientFormProps) {
  const [loadingPatient, setLoadingPatient] = useState(false)
  const isEditing = !!patientId

  // React Query mutations
  const createPatientMutation = useCreatePatient()
  const updatePatientMutation = useUpdatePatient()

  const form = useForm<PatientFormData>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      birth_date: '',
      gender: '',
      cpf: '',
      is_christian: false,
      origin: '',
      marital_status: '',
      occupation: '',
      notes: '',
    },
  })

  const loading = createPatientMutation.isPending || updatePatientMutation.isPending

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
        cpf: '',
        is_christian: false,
        origin: '',
        marital_status: '',
        occupation: '',
        notes: '',
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
          email: patient.email || '',
          phone: patient.phone || '',
          birth_date: patient.birth_date || '',
          gender: patient.gender || '',
          cpf: patient.cpf || '',
          is_christian: patient.is_christian || false,
          origin: patient.origin || '',
          marital_status: patient.marital_status || '',
          occupation: patient.occupation || '',
          notes: patient.notes || '',
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
    try {
      if (isEditing && patientId) {
        const updateData: UpdatePatientData = {
          full_name: data.full_name,
          email: data.email && data.email.trim() !== '' ? data.email : undefined,
          phone: data.phone && data.phone.trim() !== '' ? data.phone : undefined,
          birth_date: data.birth_date || undefined,
          gender: data.gender || undefined,
          cpf: data.cpf || undefined,
          is_christian: data.is_christian,
          origin: data.origin || undefined,
          marital_status: data.marital_status || undefined,
          occupation: data.occupation || undefined,
          notes: data.notes || undefined,
        }
        
        const result = await updatePatientMutation.mutateAsync({ id: patientId, data: updateData })
        if (result) {
          onSuccess?.(result)
          onOpenChange(false)
        }
      } else {
        const createData: CreatePatientData = {
          full_name: data.full_name,
          email: data.email && data.email.trim() !== '' ? data.email : undefined,
          phone: data.phone && data.phone.trim() !== '' ? data.phone : undefined,
          birth_date: data.birth_date || undefined,
          gender: data.gender || undefined,
          cpf: data.cpf || undefined,
          is_christian: data.is_christian,
          origin: data.origin || undefined,
          marital_status: data.marital_status || undefined,
          occupation: data.occupation || undefined,
          notes: data.notes || undefined,
        }
        
        const result = await createPatientMutation.mutateAsync(createData)
        
        // If a therapist created the patient, create the link automatically
        if (result && cedroUser?.role === 'therapist') {
          const linkCreated = await createPatientTherapistLink(result.id, cedroUser.id)
          if (!linkCreated) {
            console.warn('Patient created but failed to create therapist link')
          }
        }
        
        if (result) {
          onSuccess?.(result)
          onOpenChange(false)
        }
      }
    } catch (error) {
      // Error handling is done by the mutations
      console.error('Error saving patient:', error)
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
      <DialogContent className="sm:max-w-[700px] max-h-[95vh] overflow-hidden flex flex-col gap-0">
        <DialogHeader className="pb-4">
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
          <div className="flex items-center justify-center py-8 flex-1">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Carregando dados do paciente...</span>
          </div>
        ) : (
          <>
            <Form {...form}>
              <form id="patient-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 overflow-y-auto flex-1 px-2">
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
                          <SelectItem value="M">Masculino</SelectItem>
                          <SelectItem value="F">Feminino</SelectItem>
                          <SelectItem value="O">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="000.000.000-00" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_christian"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          É cristão?
                        </FormLabel>
                        <FormDescription>
                          Informação sobre religião do paciente
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="origin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Origem</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Como chegou até nós?" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="marital_status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado Civil</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o estado civil" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                          <SelectItem value="casado">Casado(a)</SelectItem>
                          <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                          <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                          <SelectItem value="uniao-estavel">União Estável</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="occupation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profissão</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Qual a profissão do paciente?" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Observações gerais sobre o paciente..."
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Inclua informações relevantes sobre o paciente
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>

            <DialogFooter className="pt-4 mt-4 border-t shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Cancelar
              </Button>
              <button 
                type="submit" 
                form="patient-form"
                disabled={loading}
                className="inline-flex items-center justify-center rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:pointer-events-none disabled:opacity-50"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Atualizar' : 'Criar'} Paciente
              </button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}