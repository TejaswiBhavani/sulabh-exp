import { supabase } from './supabase'

// Cache key generator
export const generateCacheKey = (
  endpoint: string,
  params: Record<string, any> = {},
  userId?: string,
  department?: string
): string => {
  // Create a sorted array of parameter entries for consistent key generation
  const sortedParams = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null && value !== '')
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([key, value]) => `${key}=${value}`)
    .join('&')

  // Build cache key with endpoint and optional user context
  let key = endpoint
  
  // Add user context if available
  if (userId) {
    key += `:user=${userId}`
  }
  
  // Add department context if available
  if (department) {
    key += `:dept=${department}`
  }
  
  // Add params if available
  if (sortedParams) {
    key += `:${sortedParams}`
  }
  
  return key
}

// Get cache configuration
export const getCacheConfig = async (endpoint: string): Promise<any> => {
  try {
    const { data, error } = await supabase.functions.invoke('cache-config', {
      body: {
        action: 'get_config',
        key: endpoint
      }
    })
    
    if (error) throw error
    return data.config
  } catch (error) {
    console.error('Error getting cache config:', error)
    // Return default config
    return {
      ttl: 300, // 5 minutes default
      vary: []
    }
  }
}

// Get cached data
export const getCachedData = async <T>(
  endpoint: string,
  params: Record<string, any> = {},
  userId?: string,
  department?: string
): Promise<{ data: T | null; cached: boolean }> => {
  try {
    const cacheKey = generateCacheKey(endpoint, params, userId, department)
    
    const { data, error } = await supabase.functions.invoke('cache-config', {
      body: {
        action: 'get',
        key: cacheKey
      }
    })
    
    if (error) throw error
    
    return {
      data: data.data as T,
      cached: data.cached
    }
  } catch (error) {
    console.error('Error getting cached data:', error)
    return {
      data: null,
      cached: false
    }
  }
}

// Set cached data
export const setCachedData = async <T>(
  endpoint: string,
  data: T,
  params: Record<string, any> = {},
  userId?: string,
  department?: string
): Promise<void> => {
  try {
    const cacheKey = generateCacheKey(endpoint, params, userId, department)
    
    await supabase.functions.invoke('cache-config', {
      body: {
        action: 'set',
        key: cacheKey,
        data
      }
    })
  } catch (error) {
    console.error('Error setting cached data:', error)
  }
}

// Invalidate cache
export const invalidateCache = async (
  endpoint: string,
  params: Record<string, any> = {},
  userId?: string,
  department?: string
): Promise<void> => {
  try {
    const cacheKey = generateCacheKey(endpoint, params, userId, department)
    
    await supabase.functions.invoke('cache-config', {
      body: {
        action: 'invalidate',
        key: cacheKey
      }
    })
  } catch (error) {
    console.error('Error invalidating cache:', error)
  }
}

// Cache wrapper for async functions
export const withCache = async <T>(
  endpoint: string,
  fetchFunction: () => Promise<T>,
  params: Record<string, any> = {},
  userId?: string,
  department?: string
): Promise<T> => {
  try {
    // Try to get from cache first
    const { data: cachedData, cached } = await getCachedData<T>(endpoint, params, userId, department)
    
    // If valid cache exists, return it
    if (cached && cachedData) {
      return cachedData
    }
    
    // Otherwise fetch fresh data
    const freshData = await fetchFunction()
    
    // Cache the fresh data
    await setCachedData(endpoint, freshData, params, userId, department)
    
    return freshData
  } catch (error) {
    console.error('Cache wrapper error:', error)
    // If cache operations fail, just return the fresh data
    return fetchFunction()
  }
}