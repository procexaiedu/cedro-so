/**
 * CEDRO API Client
 * Wrapper around Supabase with error handling, logging, and retry logic
 */

import { supabase } from '@/lib/supabase'
import type { ApiError, PaginatedResponse } from './types'

// ============ ERROR HANDLING ============

class CedroApiError extends Error implements ApiError {
  code: string
  status: number
  details?: Record<string, any>

  constructor(message: string, code: string = 'UNKNOWN_ERROR', status: number = 500, details?: Record<string, any>) {
    super(message)
    this.name = 'CedroApiError'
    this.code = code
    this.status = status
    this.details = details
  }
}

/**
 * Parse Supabase error into standardized ApiError
 */
function parseSupabaseError(error: any): ApiError {
  const message = error?.message || error?.error_description || String(error)
  const code = error?.code || 'UNKNOWN_ERROR'
  const status = error?.status || 500

  console.error('🔴 API Error:', { message, code, status })

  return {
    message,
    code,
    status,
    details: error?.details || {}
  }
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: ApiError): boolean {
  // Don't retry 4xx errors (client errors)
  if (error.status >= 400 && error.status < 500) {
    return false
  }
  // Retry 5xx and network errors
  return true
}

// ============ QUERY BUILDER ============

interface QueryOptions {
  columns?: string
  filter?: { key: string; value: string; operator?: 'eq' | 'in' | 'gte' | 'lte' | 'lt' | 'gt' }[]
  order?: { column: string; ascending?: boolean }
  limit?: number
  offset?: number
}

/**
 * Build Supabase query with error handling
 */
async function executeQuery<T>(
  tableName: string,
  options: QueryOptions = {}
): Promise<T[]> {
  try {
    let query: any = supabase.schema('cedro').from(tableName)

    // Select columns
    const columns = options.columns || '*'
    query = query.select(columns)

    // Apply filters
    if (options.filter?.length) {
      for (const f of options.filter) {
        const operator = f.operator || 'eq'
        switch (operator) {
          case 'eq':
            query = query.eq(f.key, f.value)
            break
          case 'in':
            query = query.in(f.key, f.value.split(','))
            break
          case 'gte':
            query = query.gte(f.key, f.value)
            break
          case 'lte':
            query = query.lte(f.key, f.value)
            break
          case 'lt':
            query = query.lt(f.key, f.value)
            break
          case 'gt':
            query = query.gt(f.key, f.value)
            break
        }
      }
    }

    // Apply ordering
    if (options.order) {
      query = query.order(options.order.column, {
        ascending: options.order.ascending ?? true
      })
    }

    // Apply limit and offset
    if (options.limit) {
      query = query.limit(options.limit)
    }
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    // Execute query
    const { data, error } = await query

    if (error) {
      const apiError = parseSupabaseError(error)
      throw new CedroApiError(apiError.message, apiError.code, apiError.status, apiError.details)
    }

    return (data || []) as T[]
  } catch (error) {
    if (error instanceof CedroApiError) {
      throw error
    }
    const apiError = parseSupabaseError(error)
    throw new CedroApiError(apiError.message, apiError.code, apiError.status, apiError.details)
  }
}

/**
 * Get single record by ID
 */
async function getById<T>(tableName: string, id: string, columns?: string): Promise<T | null> {
  try {
    let query: any = supabase.schema('cedro').from(tableName)

    if (columns) {
      query = query.select(columns)
    } else {
      query = query.select('*')
    }

    const { data, error } = await query.eq('id', id).maybeSingle()

    if (error) {
      const apiError = parseSupabaseError(error)
      throw new CedroApiError(apiError.message, apiError.code, apiError.status, apiError.details)
    }

    return (data || null) as T | null
  } catch (error) {
    if (error instanceof CedroApiError) {
      throw error
    }
    const apiError = parseSupabaseError(error)
    throw new CedroApiError(apiError.message, apiError.code, apiError.status, apiError.details)
  }
}

/**
 * Count records
 */
async function count(
  tableName: string,
  filters?: { key: string; value: string; operator?: 'eq' | 'in' }[]
): Promise<number> {
  try {
    let query: any = supabase.schema('cedro').from(tableName).select('*', { count: 'exact', head: true })

    if (filters?.length) {
      for (const f of filters) {
        if (f.operator === 'in') {
          query = query.in(f.key, f.value.split(','))
        } else {
          query = query.eq(f.key, f.value)
        }
      }
    }

    const { count: total, error } = await query

    if (error) {
      const apiError = parseSupabaseError(error)
      throw new CedroApiError(apiError.message, apiError.code, apiError.status, apiError.details)
    }

    return total || 0
  } catch (error) {
    if (error instanceof CedroApiError) {
      throw error
    }
    const apiError = parseSupabaseError(error)
    throw new CedroApiError(apiError.message, apiError.code, apiError.status, apiError.details)
  }
}

/**
 * Insert record
 */
async function insert<T>(tableName: string, data: Partial<T>): Promise<T> {
  try {
    const { data: result, error } = await supabase
      .schema('cedro')
      .from(tableName)
      .insert([data])
      .select()
      .single()

    if (error) {
      const apiError = parseSupabaseError(error)
      throw new CedroApiError(apiError.message, apiError.code, apiError.status, apiError.details)
    }

    return result as T
  } catch (error) {
    if (error instanceof CedroApiError) {
      throw error
    }
    const apiError = parseSupabaseError(error)
    throw new CedroApiError(apiError.message, apiError.code, apiError.status, apiError.details)
  }
}

/**
 * Update record
 */
async function update<T>(tableName: string, id: string, data: Partial<T>): Promise<T> {
  try {
    const { data: result, error } = await supabase
      .schema('cedro')
      .from(tableName)
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      const apiError = parseSupabaseError(error)
      throw new CedroApiError(apiError.message, apiError.code, apiError.status, apiError.details)
    }

    return result as T
  } catch (error) {
    if (error instanceof CedroApiError) {
      throw error
    }
    const apiError = parseSupabaseError(error)
    throw new CedroApiError(apiError.message, apiError.code, apiError.status, apiError.details)
  }
}

/**
 * Delete record
 */
async function deleteRecord(tableName: string, id: string): Promise<void> {
  try {
    const { error } = await supabase
      .schema('cedro')
      .from(tableName)
      .delete()
      .eq('id', id)

    if (error) {
      const apiError = parseSupabaseError(error)
      throw new CedroApiError(apiError.message, apiError.code, apiError.status, apiError.details)
    }
  } catch (error) {
    if (error instanceof CedroApiError) {
      throw error
    }
    const apiError = parseSupabaseError(error)
    throw new CedroApiError(apiError.message, apiError.code, apiError.status, apiError.details)
  }
}

// Export API client
export const api = {
  executeQuery,
  getById,
  count,
  insert,
  update,
  delete: deleteRecord,
  errors: {
    CedroApiError,
    isRetryableError,
    parseSupabaseError
  }
}
