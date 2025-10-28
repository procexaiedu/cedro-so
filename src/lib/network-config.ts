/**
 * Network configuration and utilities for better error handling and timeouts
 */

export const NETWORK_CONFIG = {
  // Request timeouts
  DEFAULT_TIMEOUT: 10000, // 10 seconds
  UPLOAD_TIMEOUT: 30000, // 30 seconds for file uploads
  POLLING_TIMEOUT: 5000, // 5 seconds for polling requests
  
  // Retry configuration
  MAX_RETRIES: 2,
  RETRY_DELAY: 1000, // 1 second
  
  // Polling configuration
  POLLING_INTERVAL: 5000, // 5 seconds
  MAX_POLLING_ATTEMPTS: 60, // 5 minutes total (60 * 5s)
} as const

/**
 * Creates a fetch wrapper with timeout and retry logic
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<Response> {
  const { timeout = NETWORK_CONFIG.DEFAULT_TIMEOUT, ...fetchOptions } = options
  
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`)
    }
    
    throw error
  }
}

/**
 * Retry wrapper for network requests
 */
export async function retryRequest<T>(
  requestFn: () => Promise<T>,
  maxRetries: number = NETWORK_CONFIG.MAX_RETRIES,
  delay: number = NETWORK_CONFIG.RETRY_DELAY
): Promise<T> {
  let lastError: Error
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')
      
      // Don't retry on client errors (4xx)
      if (error instanceof Error && 'status' in error) {
        const status = (error as any).status
        if (status >= 400 && status < 500) {
          throw error
        }
      }
      
      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * (attempt + 1)))
    }
  }
  
  throw lastError!
}

/**
 * Polling utility with timeout and max attempts
 */
export async function pollUntilCondition<T>(
  pollFn: () => Promise<T>,
  conditionFn: (result: T) => boolean,
  interval: number = NETWORK_CONFIG.POLLING_INTERVAL,
  maxAttempts: number = NETWORK_CONFIG.MAX_POLLING_ATTEMPTS
): Promise<T> {
  let attempts = 0
  
  while (attempts < maxAttempts) {
    try {
      const result = await pollFn()
      
      if (conditionFn(result)) {
        return result
      }
      
      attempts++
      
      if (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, interval))
      }
    } catch (error) {
      console.warn(`Polling attempt ${attempts + 1} failed:`, error)
      attempts++
      
      if (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, interval))
      }
    }
  }
  
  throw new Error(`Polling timeout after ${maxAttempts} attempts`)
}