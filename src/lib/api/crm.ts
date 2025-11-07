/**
 * CEDRO CRM API
 * CLEAN ARCHITECTURE - Gestão de Leads
 *
 * Handles CRM lead management, funnel progression, and lead analytics
 */

import { supabase } from '@/lib/supabase'
import { api } from './client'
import type { CrmLead } from './types'

// ============ QUERIES ============

/**
 * Get all CRM leads
 */
export async function getAllCrmLeads(): Promise<CrmLead[]> {
  return api.executeQuery<CrmLead>('crm_leads', {
    columns: 'id, name, phone, email, city_uf, is_christian, source, stage, notes, created_at, updated_at',
    order: { column: 'created_at', ascending: false }
  })
}

/**
 * Get CRM leads by stage
 */
export async function getCrmLeadsByStage(
  stage: 'lead' | 'mql' | 'sql' | 'won' | 'lost'
): Promise<CrmLead[]> {
  return api.executeQuery<CrmLead>('crm_leads', {
    columns: 'id, name, phone, email, city_uf, is_christian, source, stage, notes, created_at, updated_at',
    filter: [{ key: 'stage', value: stage }],
    order: { column: 'created_at', ascending: false }
  })
}

/**
 * Get CRM leads by source
 */
export async function getCrmLeadsBySource(source: string): Promise<CrmLead[]> {
  return api.executeQuery<CrmLead>('crm_leads', {
    columns: 'id, name, phone, email, city_uf, is_christian, source, stage, notes, created_at, updated_at',
    filter: [{ key: 'source', value: source }],
    order: { column: 'created_at', ascending: false }
  })
}

/**
 * Get CRM leads by city/UF
 */
export async function getCrmLeadsByCity(cityUf: string): Promise<CrmLead[]> {
  return api.executeQuery<CrmLead>('crm_leads', {
    columns: 'id, name, phone, email, city_uf, is_christian, source, stage, notes, created_at, updated_at',
    filter: [{ key: 'city_uf', value: cityUf }],
    order: { column: 'created_at', ascending: false }
  })
}

/**
 * Get single CRM lead
 */
export async function getCrmLeadById(leadId: string): Promise<CrmLead | null> {
  return api.getById<CrmLead>('crm_leads', leadId)
}

/**
 * Search CRM leads by name
 */
export async function searchCrmLeadsByName(searchTerm: string): Promise<CrmLead[]> {
  try {
    const { data, error } = await supabase
      .schema('cedro')
      .from('crm_leads')
      .select('id, name, phone, email, city_uf, is_christian, source, stage, notes, created_at, updated_at')
      .ilike('name', `%${searchTerm}%`)
      .order('created_at', { ascending: false })

    if (error) {
      throw api.errors.parseSupabaseError(error)
    }

    return (data || []) as CrmLead[]
  } catch (error) {
    const apiError = api.errors.parseSupabaseError(error)
    throw new api.errors.CedroApiError(
      apiError.message,
      apiError.code,
      apiError.status,
      apiError.details
    )
  }
}

/**
 * Count CRM leads by stage
 */
export async function countCrmLeadsByStage(stage: 'lead' | 'mql' | 'sql' | 'won' | 'lost'): Promise<number> {
  return api.count('crm_leads', [{ key: 'stage', value: stage }])
}

/**
 * Count all CRM leads
 */
export async function countAllCrmLeads(): Promise<number> {
  return api.count('crm_leads', [])
}

/**
 * Get CRM leads paginated
 */
export async function getCrmLeadsPaginated(
  page: number = 1,
  limit: number = 20
): Promise<{ data: CrmLead[]; total: number; page: number; pages: number }> {
  try {
    const offset = (page - 1) * limit

    const { data, error, count } = await supabase
      .schema('cedro')
      .from('crm_leads')
      .select('id, name, phone, email, city_uf, is_christian, source, stage, notes, created_at, updated_at', {
        count: 'exact'
      })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw api.errors.parseSupabaseError(error)
    }

    const total = count || 0
    const pages = Math.ceil(total / limit)

    return {
      data: (data || []) as CrmLead[],
      total,
      page,
      pages
    }
  } catch (error) {
    const apiError = api.errors.parseSupabaseError(error)
    throw new api.errors.CedroApiError(
      apiError.message,
      apiError.code,
      apiError.status,
      apiError.details
    )
  }
}

// ============ MUTATIONS ============

/**
 * Create CRM lead
 */
export async function createCrmLead(data: Omit<CrmLead, 'id' | 'created_at' | 'updated_at'>): Promise<CrmLead> {
  return api.insert<CrmLead>('crm_leads', data)
}

/**
 * Update CRM lead
 */
export async function updateCrmLead(
  leadId: string,
  data: Partial<Omit<CrmLead, 'id' | 'created_at' | 'updated_at'>>
): Promise<CrmLead> {
  return api.update<CrmLead>('crm_leads', leadId, data)
}

/**
 * Update CRM lead stage (funnel progression)
 */
export async function updateCrmLeadStage(
  leadId: string,
  stage: 'lead' | 'mql' | 'sql' | 'won' | 'lost'
): Promise<CrmLead> {
  return updateCrmLead(leadId, { stage })
}

/**
 * Delete CRM lead
 */
export async function deleteCrmLead(leadId: string): Promise<void> {
  return api.delete('crm_leads', leadId)
}

/**
 * Bulk update CRM leads stage
 */
export async function bulkUpdateCrmLeadsStage(
  leadIds: string[],
  stage: 'lead' | 'mql' | 'sql' | 'won' | 'lost'
): Promise<void> {
  try {
    const { error } = await supabase
      .schema('cedro')
      .from('crm_leads')
      .update({ stage })
      .in('id', leadIds)

    if (error) {
      throw api.errors.parseSupabaseError(error)
    }
  } catch (error) {
    const apiError = api.errors.parseSupabaseError(error)
    throw new api.errors.CedroApiError(
      apiError.message,
      apiError.code,
      apiError.status,
      apiError.details
    )
  }
}

/**
 * Get funnel summary (count by stage)
 */
export async function getCrmFunnelSummary(): Promise<{
  lead: number
  mql: number
  sql: number
  won: number
  lost: number
}> {
  try {
    const { data, error } = await supabase
      .schema('cedro')
      .from('crm_leads')
      .select('stage')

    if (error) {
      throw api.errors.parseSupabaseError(error)
    }

    const summary = {
      lead: 0,
      mql: 0,
      sql: 0,
      won: 0,
      lost: 0
    }

    ;(data || []).forEach((item: any) => {
      if (item.stage in summary) {
        summary[item.stage as keyof typeof summary]++
      }
    })

    return summary
  } catch (error) {
    const apiError = api.errors.parseSupabaseError(error)
    throw new api.errors.CedroApiError(
      apiError.message,
      apiError.code,
      apiError.status,
      apiError.details
    )
  }
}
