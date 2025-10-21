'use client'

import { createClient } from '@/lib/supabase'

// Types
export interface Lead {
  id: string
  name: string
  email: string
  phone?: string
  source: string
  stage: LeadStage
  score: number
  notes?: string
  created_at: string
  updated_at: string
  
  // ===== CAMPOS NÃO IMPLEMENTADOS (FUTURAS FUNCIONALIDADES) =====
  // Descomente quando implementar as colunas no banco
  // last_contact?: string
  // next_action?: string
  // next_action_date?: string
  // assigned_to?: string
  // assigned_to_name?: string
  // converted_at?: string
  // converted_to_patient_id?: string
  
  // Campos adicionais calculados (não estão na tabela)
  city_uf?: string
  is_christian?: boolean
}

export type LeadStage = 'lead' | 'mql' | 'sql' | 'won' | 'lost'

export interface LeadActivity {
  id: string
  lead_id: string
  type: ActivityType
  description: string
  created_by: string
  created_by_name: string
  created_at: string
  metadata?: Record<string, any>
}

export type ActivityType = 'call' | 'email' | 'meeting' | 'note' | 'stage_change' | 'score_change' | 'converted' | 'created' | 'contact'

export interface LeadOverview {
  lead: Lead
  activities: LeadActivity[]
  conversion_probability: number
  days_in_pipeline: number
  total_interactions: number
  last_interaction: string | null
}

export interface LeadFilters {
  search?: string
  stage?: LeadStage[]
  source?: string[]
  assigned_to?: string[]
  score_min?: number
  score_max?: number
  created_after?: string
  created_before?: string
}

export interface PaginationParams {
  page: number
  limit: number
}

export interface LeadListResponse {
  data: Lead[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface CreateLeadData {
  name: string
  email: string
  phone?: string
  source: string
  score?: number
  notes?: string
  assigned_to?: string
}

export interface UpdateLeadData {
  name?: string
  email?: string
  phone?: string
  source?: string
  stage?: LeadStage
  score?: number
  next_action?: string
  notes?: string
  assigned_to?: string
}

export interface LeadSourceData {
  name: string
  count: number
  percentage: number
}

export interface LeadStats {
  total_leads: number
  new_leads: number
  qualified_leads: number
  conversion_rate: number
  avg_score: number
  leads_by_stage: Record<LeadStage, number>
  leads_by_source: Record<string, number>
  monthly_conversions: number
  converted_leads: number
  pipeline_stats?: Array<{ stage: string; count: number }>
  pending_actions?: Array<{ action: string; count: number }>
}

// API Functions
export async function getLeads(
  filters: LeadFilters = {},
  pagination: PaginationParams = { page: 1, limit: 50 }
): Promise<LeadListResponse> {
  try {
    const supabase = createClient()
    const { page, limit } = pagination
    const offset = (page - 1) * limit

    let query = supabase
      .schema('cedro')
      .from('crm_leads')
      .select('*', { count: 'exact' })

    // Apply filters
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`)
    }

    if (filters.stage && filters.stage.length > 0) {
      query = query.in('stage', filters.stage)
    }

    if (filters.source && filters.source.length > 0) {
      query = query.in('source', filters.source)
    }

    if (filters.assigned_to && filters.assigned_to.length > 0) {
      query = query.in('assigned_to', filters.assigned_to)
    }

    // Note: score filters will be applied after fetching data since score is calculated dynamically

    if (filters.created_after) {
      query = query.gte('created_at', filters.created_after)
    }

    if (filters.created_before) {
      query = query.lte('created_at', filters.created_before)
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching leads:', error)
      throw error
    }

    const leads: Lead[] = (data || []).map((item: any) => {
      // Calculate score dynamically based on lead data
      const calculatedScore = calculateLeadScore({
        source: item.source,
        email: item.email,
        phone: item.phone,
        stage: item.stage,
        is_christian: item.is_christian,
        created_at: item.created_at
      })

      return {
        id: item.id,
        name: item.name,
        email: item.email,
        phone: item.phone,
        source: item.source,
        stage: item.stage,
        score: calculatedScore,
        // Campos existentes na tabela
        notes: item.notes,
        created_at: item.created_at,
        updated_at: item.updated_at,
        city_uf: item.city_uf,
        is_christian: item.is_christian
        
        // ===== CAMPOS COMENTADOS (NÃO IMPLEMENTADOS) =====
        // last_contact: item.last_contact,
        // next_action: item.next_action,
        // assigned_to: item.assigned_to,
        // assigned_to_name: item.assigned_to_user?.name,
        // converted_at: item.converted_at,
        // converted_to_patient_id: item.converted_to_patient_id
      }
    })

    // Apply score filters after dynamic calculation
    let filteredLeads = leads
    if (filters.score_min !== undefined) {
      filteredLeads = filteredLeads.filter(lead => lead.score >= filters.score_min!)
    }
    if (filters.score_max !== undefined) {
      filteredLeads = filteredLeads.filter(lead => lead.score <= filters.score_max!)
    }

    const totalPages = Math.ceil((count || 0) / limit)

    return {
      data: filteredLeads,
      total: filteredLeads.length,
      page,
      limit,
      totalPages: Math.ceil(filteredLeads.length / limit)
    }
  } catch (error) {
    console.error('Error in getLeads:', error)
    return {
      data: [],
      total: 0,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: 0
    }
  }
}

export async function getLeadById(id: string): Promise<LeadOverview | null> {
  try {
    const supabase = createClient()

    // Get lead details
    const { data: leadData, error: leadError } = await supabase
      .schema('cedro')
      .from('crm_leads')
      .select('*')
      .eq('id', id)
      .single()

    if (leadError || !leadData) {
      console.error('Error fetching lead:', leadError)
      return null
    }

    const lead: Lead = {
      id: leadData.id,
      name: leadData.name,
      email: leadData.email,
      phone: leadData.phone,
      source: leadData.source,
      stage: leadData.stage,
      score: calculateLeadScore({
        source: leadData.source,
        email: leadData.email,
        phone: leadData.phone,
        stage: leadData.stage,
        is_christian: leadData.is_christian,
        created_at: leadData.created_at
      }),
      // Campos existentes na tabela
      notes: leadData.notes,
      created_at: leadData.created_at,
      updated_at: leadData.updated_at,
      city_uf: leadData.city_uf,
      is_christian: leadData.is_christian
      
      // ===== CAMPOS COMENTADOS (NÃO IMPLEMENTADOS) =====
      // last_contact: leadData.last_contact,
      // next_action: leadData.next_action,
      // next_action_date: leadData.next_action_date,
      // assigned_to: leadData.assigned_to,
      // assigned_to_name: leadData.assigned_to_name,
      // converted_at: leadData.converted_at,
      // converted_to_patient_id: leadData.converted_to_patient_id
    }

    // Get activities - COMENTADO: tabela lead_activities não existe ainda
    // const { data: activitiesData } = await supabase
    //   .schema('cedro')
    //   .from('lead_activities')
    //   .select(`
    //     *,
    //     created_by_user:users!lead_activities_created_by_fkey(name)
    //   `)
    //   .eq('lead_id', id)
    //   .order('created_at', { ascending: false })

    // const activities: LeadActivity[] = (activitiesData || []).map((item: any) => ({
    //   id: item.id,
    //   lead_id: item.lead_id,
    //   type: item.type,
    //   description: item.description,
    //   created_by: item.created_by,
    //   created_by_name: item.created_by_user?.name || 'Sistema',
    //   created_at: item.created_at,
    //   metadata: item.metadata
    // }))

    // Por enquanto, activities vazio
    const activities: LeadActivity[] = []

    // Calculate metrics
    const createdAt = new Date(lead.created_at)
    const now = new Date()
    const daysInPipeline = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
    
    const conversionProbability = calculateConversionProbability(lead, activities)
    const lastInteraction = activities.length > 0 ? activities[0].created_at : null

    return {
      lead,
      activities,
      conversion_probability: conversionProbability,
      days_in_pipeline: daysInPipeline,
      total_interactions: activities.length,
      last_interaction: lastInteraction
    }
  } catch (error) {
    console.error('Error in getLeadById:', error)
    return null
  }
}

export async function createLead(data: CreateLeadData): Promise<Lead | null> {
  try {
    const supabase = createClient()

    const leadData = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      source: data.source,
      stage: 'lead' as LeadStage,
      notes: data.notes,
      // assigned_to: data.assigned_to, // COMENTADO: campo não existe
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: newLead, error } = await supabase
      .schema('cedro')
      .from('crm_leads')
      .insert(leadData)
      .select('*')
      .single()

    if (error) {
      console.error('Error creating lead:', error)
      throw error
    }

    // Create initial activity - COMENTADO: tabela lead_activities não existe
    // await createActivity(newLead.id, {
    //   type: 'note',
    //   description: `Lead criado via ${data.source}`,
    //   metadata: { source: data.source }
    // })

    return {
      id: newLead.id,
      name: newLead.name,
      email: newLead.email,
      phone: newLead.phone,
      source: newLead.source,
      stage: newLead.stage,
      score: calculateLeadScore({
        source: newLead.source,
        email: newLead.email,
        phone: newLead.phone,
        stage: newLead.stage,
        is_christian: newLead.is_christian,
        created_at: newLead.created_at
      }),
      // Campos existentes na tabela
      notes: newLead.notes,
      created_at: newLead.created_at,
      updated_at: newLead.updated_at,
      city_uf: newLead.city_uf,
      is_christian: newLead.is_christian
      
      // ===== CAMPOS COMENTADOS (NÃO IMPLEMENTADOS) =====
      // last_contact: newLead.last_contact,
      // next_action: newLead.next_action,
      // assigned_to: newLead.assigned_to,
      // assigned_to_name: newLead.assigned_to_user?.name,
      // converted_at: newLead.converted_at,
      // converted_to_patient_id: newLead.converted_to_patient_id
    }
  } catch (error) {
    console.error('Error in createLead:', error)
    return null
  }
}

export async function updateLead(id: string, data: UpdateLeadData): Promise<Lead | null> {
  try {
    const supabase = createClient()

    // Get current lead for comparison
    const { data: currentLead } = await supabase
      .schema('cedro')
      .from('crm_leads')
      .select('*')
      .eq('id', id)
      .single()

    const updateData = {
      ...data,
      updated_at: new Date().toISOString()
    }

    const { data: updatedLead, error } = await supabase
      .schema('cedro')
      .from('crm_leads')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating lead:', error)
      throw error
    }

    // Create activities for significant changes
    if (currentLead) {
      if (data.stage && data.stage !== currentLead.stage) {
        // COMENTADO: função createActivity usa tabela que não existe
        // await createActivity(id, {
        //   type: 'stage_change',
        //   description: `Estágio alterado de "${currentLead.stage}" para "${data.stage}"`,
        //   metadata: { old_stage: currentLead.stage, new_stage: data.stage }
        // })
      }

      // Score is now calculated dynamically, no need to track changes
    }

    return {
      id: updatedLead.id,
      name: updatedLead.name,
      email: updatedLead.email,
      phone: updatedLead.phone,
      source: updatedLead.source,
      stage: updatedLead.stage,
      score: calculateLeadScore({
        source: updatedLead.source,
        email: updatedLead.email,
        phone: updatedLead.phone,
        stage: updatedLead.stage,
        is_christian: updatedLead.is_christian,
        created_at: updatedLead.created_at
      }),
      // Campos existentes na tabela
      notes: updatedLead.notes,
      created_at: updatedLead.created_at,
      updated_at: updatedLead.updated_at,
      city_uf: updatedLead.city_uf,
      is_christian: updatedLead.is_christian
      
      // ===== CAMPOS COMENTADOS (NÃO IMPLEMENTADOS) =====
      // last_contact: updatedLead.last_contact,
      // next_action: updatedLead.next_action,
      // assigned_to: updatedLead.assigned_to,
      // assigned_to_name: updatedLead.assigned_to_user?.name,
      // converted_at: updatedLead.converted_at,
      // converted_to_patient_id: updatedLead.converted_to_patient_id
    }
  } catch (error) {
    console.error('Error in updateLead:', error)
    return null
  }
}

export async function deleteLead(id: string): Promise<boolean> {
  try {
    const supabase = createClient()

    const { error } = await supabase
      .schema('cedro')
      .from('crm_leads')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting lead:', error)
      throw error
    }

    return true
  } catch (error) {
    console.error('Error in deleteLead:', error)
    return false
  }
}

// COMENTADO: função createActivity usa tabela lead_activities que não existe
// export async function createActivity(
//   leadId: string, 
//   activity: { type: ActivityType; description: string; metadata?: Record<string, any> }
// ): Promise<LeadActivity | null> {
//   try {
//     const supabase = createClient()

//     const { data: newActivity, error } = await supabase
//       .schema('cedro')
//       .from('lead_activities')
//       .insert({
//         lead_id: leadId,
//         type: activity.type,
//         description: activity.description,
//         metadata: activity.metadata,
//         created_by: 'system', // TODO: Get from auth context
//         created_at: new Date().toISOString()
//       })
//       .select(`
//         *,
//         created_by_user:users!lead_activities_created_by_fkey(name)
//       `)
//       .single()

//     if (error) {
//       console.error('Error creating activity:', error)
//       throw error
//     }

//     return {
//       id: newActivity.id,
//       lead_id: newActivity.lead_id,
//       type: newActivity.type,
//       description: newActivity.description,
//       created_by: newActivity.created_by,
//       created_by_name: newActivity.created_by_user?.name || 'Sistema',
//       created_at: newActivity.created_at,
//       metadata: newActivity.metadata
//     }
//   } catch (error) {
//     console.error('Error in createActivity:', error)
//     return null
//   }
// }

export async function getLeadStats(): Promise<LeadStats> {
  try {
    const supabase = createClient()

    // Get all leads for calculations
    const { data: leads } = await supabase
      .schema('cedro')
      .from('crm_leads')
      .select('*')

    if (!leads) {
      return getEmptyStats()
    }

    const totalLeads = leads.length
    const newLeads = leads.filter(l => l.stage === 'lead').length
    const qualifiedLeads = leads.filter(l => l.stage === 'mql' || l.stage === 'sql').length
    const convertedLeads = leads.filter(l => l.stage === 'won').length
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0
    const avgScore = totalLeads > 0 ? leads.reduce((sum, l) => sum + (l.score || 0), 0) / totalLeads : 0

    // Group by stage
    const leadsByStage = leads.reduce((acc, lead) => {
      acc[lead.stage as LeadStage] = (acc[lead.stage as LeadStage] || 0) + 1
      return acc
    }, {} as Record<LeadStage, number>)

    // Group by source
    const leadsBySource = leads.reduce((acc, lead) => {
      acc[lead.source] = (acc[lead.source] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Monthly conversions (current month) - COMENTADO: campo converted_at não existe
    // const currentMonth = new Date().getMonth()
    // const currentYear = new Date().getFullYear()
    // const monthlyConversions = leads.filter(l => {
    //   if (!l.converted_at) return false
    //   const convertedDate = new Date(l.converted_at)
    //   return convertedDate.getMonth() === currentMonth && convertedDate.getFullYear() === currentYear
    // }).length

    const monthlyConversions = 0 // Por enquanto 0, até implementar converted_at

     // Pipeline stats
     const pipelineStats = Object.entries(leadsByStage).map(([stage, count]) => ({
       stage: getStageText(stage as LeadStage),
       count
     }))

     // Pending actions (simplified for now) - COMENTADO: campo next_action não existe
     // const pendingActions = [
     //   { action: 'Ligações pendentes', count: leads.filter(l => l.next_action?.includes('ligar')).length },
     //   { action: 'E-mails pendentes', count: leads.filter(l => l.next_action?.includes('email')).length },
     //   { action: 'Reuniões agendadas', count: leads.filter(l => l.next_action?.includes('reunião')).length }
     // ]

     const pendingActions = [
       { action: 'Ligações pendentes', count: 0 },
       { action: 'E-mails pendentes', count: 0 },
       { action: 'Reuniões agendadas', count: 0 }
     ]

    return {
      total_leads: totalLeads,
      new_leads: newLeads,
      qualified_leads: qualifiedLeads,
      conversion_rate: conversionRate,
      avg_score: avgScore,
      leads_by_stage: leadsByStage,
      leads_by_source: leadsBySource,
      monthly_conversions: monthlyConversions,
      converted_leads: convertedLeads,
      pipeline_stats: Object.entries(leadsByStage).map(([stage, count]) => ({ stage, count: Number(count) })),
      pending_actions: pendingActions
    }
  } catch (error) {
    console.error('Error in getLeadStats:', error)
    return getEmptyStats()
  }
}

export async function getTherapistsForAssignment(): Promise<Array<{ id: string; name: string }>> {
  try {
    const supabase = createClient()

    const { data: therapists } = await supabase
      .schema('cedro')
      .from('users')
      .select('id, name')
      .in('role', ['therapist', 'admin'])
      .eq('is_active', true)

    return therapists || []
  } catch (error) {
    console.error('Error fetching therapists:', error)
    return []
  }
}

export async function getLeadSources(): Promise<string[]> {
  try {
    const supabase = createClient()

    const { data: sources } = await supabase
      .schema('cedro')
      .from('crm_leads')
      .select('source')
      .not('source', 'is', null)

    const uniqueSources = [...new Set((sources || []).map(s => s.source))]
    
    // Se não há fontes válidas na tabela, retorna lista padrão
    if (uniqueSources.length === 0) {
      return ['Website', 'Indicação', 'Google Ads', 'Facebook', 'Instagram', 'WhatsApp', 'Telefone']
    }
    
    return uniqueSources.sort()
  } catch (error) {
    console.error('Error fetching lead sources:', error)
    return ['Website', 'Indicação', 'Google Ads', 'Facebook', 'Instagram', 'WhatsApp', 'Telefone']
  }
}

export async function getLeadSourcesData(): Promise<LeadSourceData[]> {
  try {
    const supabase = createClient()

    const { data: leads } = await supabase
      .schema('cedro')
      .from('crm_leads')
      .select('source')
      .not('source', 'is', null)

    if (!leads || leads.length === 0) {
      return []
    }

    // Count leads by source
    const sourceCounts = leads.reduce((acc, lead) => {
      acc[lead.source] = (acc[lead.source] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const totalLeads = leads.length

    // Convert to array with percentages
    return Object.entries(sourceCounts)
      .map(([source, count]) => ({
        name: source,
        count,
        percentage: Math.round((count / totalLeads) * 100)
      }))
      .sort((a, b) => b.count - a.count)
  } catch (error) {
    console.error('Error fetching lead sources data:', error)
    return []
  }
}

// Utility functions
function calculateLeadScore(data: {
  source?: string
  email?: string
  phone?: string
  stage?: string
  is_christian?: boolean
  created_at?: string
}): number {
  let score = 50 // Base score

  // Source scoring
  const sourceScores: Record<string, number> = {
    'indicacao': 20,
    'google': 15,
    'instagram': 8,
    'whatsapp': 12,
  }

  if (data.source) {
    score += sourceScores[data.source.toLowerCase()] || 5
  }

  // Email domain scoring
  if (data.email) {
    const domain = data.email.split('@')[1]
    if (domain && !['gmail.com', 'hotmail.com', 'yahoo.com'].includes(domain)) {
      score += 10 // Corporate email
    }
  }

  // Phone number scoring
  if (data.phone) {
    score += 10
  }

  // Stage scoring
  const stageScores: Record<string, number> = {
    'lead': 0,
    'mql': 10,
    'sql': 20,
    'won': 30,
    'lost': -20
  }

  if (data.stage) {
    score += stageScores[data.stage] || 0
  }

  // Christian qualification scoring
  if (data.is_christian === true) {
    score += 15
  }

  // Time-based scoring (newer leads get slight boost)
  if (data.created_at) {
    const createdDate = new Date(data.created_at)
    const daysSinceCreated = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysSinceCreated <= 7) {
      score += 5 // Recent lead bonus
    }
  }

  return Math.min(100, Math.max(0, score))
}

function calculateInitialScore(data: CreateLeadData): number {
  let score = 50 // Base score

  // Source scoring
  const sourceScores: Record<string, number> = {
    'Indicação': 20,
    'Website': 15,
    'Google Ads': 10,
    'Facebook': 8,
    'Instagram': 8,
    'WhatsApp': 12,
    'Telefone': 15
  }

  score += sourceScores[data.source] || 5

  // Email domain scoring
  if (data.email) {
    const domain = data.email.split('@')[1]
    if (domain && !['gmail.com', 'hotmail.com', 'yahoo.com'].includes(domain)) {
      score += 10 // Corporate email
    }
  }

  // Phone number scoring
  if (data.phone) {
    score += 10
  }

  return Math.min(100, Math.max(0, score))
}

function calculateConversionProbability(lead: Lead, activities: LeadActivity[]): number {
  let probability = lead.score

  // Stage influence
  const stageMultipliers: Record<LeadStage, number> = {
    'lead': 0.8,
    'mql': 1.2,
    'sql': 1.5,
    'won': 2.0,
    'lost': 0.1
  }

  probability *= stageMultipliers[lead.stage]

  // Activity influence
  const recentActivities = activities.filter(a => {
    const activityDate = new Date(a.created_at)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return activityDate > weekAgo
  })

  probability += recentActivities.length * 5

  // Time in pipeline influence (longer = lower probability)
  const createdAt = new Date(lead.created_at)
  const daysInPipeline = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
  
  if (daysInPipeline > 30) {
    probability *= 0.8
  } else if (daysInPipeline > 60) {
    probability *= 0.6
  }

  return Math.min(100, Math.max(0, Math.round(probability)))
}

function getEmptyStats(): LeadStats {
  return {
    total_leads: 0,
    new_leads: 0,
    qualified_leads: 0,
    conversion_rate: 0,
    avg_score: 0,
    leads_by_stage: {
      'lead': 0,
      'mql': 0,
      'sql': 0,
      'won': 0,
      'lost': 0
    },
    leads_by_source: {},
    monthly_conversions: 0,
    converted_leads: 0,
    pipeline_stats: [],
    pending_actions: []
  }
}

// Utility functions for formatting
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('pt-BR')
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('pt-BR')
}

export function getStageColor(stage: LeadStage): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (stage) {
    case 'lead': return 'secondary'
    case 'mql': return 'default'
    case 'sql': return 'outline'
    case 'won': return 'default'
    case 'lost': return 'destructive'
    default: return 'secondary'
  }
}

export function getStageText(stage: LeadStage): string {
  switch (stage) {
    case 'lead': return 'Lead'
    case 'mql': return 'MQL'
    case 'sql': return 'SQL'
    case 'won': return 'Ganho'
    case 'lost': return 'Perdido'
    default: return stage
  }
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-yellow-600'
  if (score >= 40) return 'text-orange-600'
  return 'text-red-600'
}

export function getActivityIcon(type: ActivityType): string {
  switch (type) {
    case 'call': return '📞'
    case 'email': return '📧'
    case 'meeting': return '🤝'
    case 'note': return '📝'
    case 'stage_change': return '🔄'
    case 'score_change': return '⭐'
    case 'converted': return '🎉'
    case 'created': return '👤'
    case 'contact': return '📞'
    default: return '📋'
  }
}