import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Helper function to get current user profile
export const getCurrentUserProfile = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile
}

// Rate limiting for login attempts
const loginAttempts = new Map<string, { count: number, timestamp: number }>()
const MAX_ATTEMPTS = 5
const LOCKOUT_TIME = 15 * 60 * 1000 // 15 minutes in milliseconds

export const checkRateLimit = (email: string): boolean => {
  const now = Date.now()
  const userAttempts = loginAttempts.get(email)
  
  if (!userAttempts) {
    loginAttempts.set(email, { count: 1, timestamp: now })
    return true
  }
  
  // Check if lockout period has passed
  if (userAttempts.count >= MAX_ATTEMPTS && now - userAttempts.timestamp < LOCKOUT_TIME) {
    return false
  }
  
  // Reset if lockout period has passed
  if (userAttempts.count >= MAX_ATTEMPTS && now - userAttempts.timestamp >= LOCKOUT_TIME) {
    loginAttempts.set(email, { count: 1, timestamp: now })
    return true
  }
  
  // Increment attempt count
  loginAttempts.set(email, { 
    count: userAttempts.count + 1, 
    timestamp: userAttempts.timestamp 
  })
  
  return true
}

export const getRemainingLockoutTime = (email: string): number => {
  const userAttempts = loginAttempts.get(email)
  if (!userAttempts || userAttempts.count < MAX_ATTEMPTS) return 0
  
  const now = Date.now()
  const timeElapsed = now - userAttempts.timestamp
  const remainingTime = Math.max(0, LOCKOUT_TIME - timeElapsed)
  
  return Math.ceil(remainingTime / 1000 / 60) // Return minutes
}

// Password validation
export const validatePassword = (password: string): { valid: boolean, message: string } => {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' }
  }
  
  if (!/\d/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' }
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character' }
  }
  
  return { valid: true, message: '' }
}

// Username validation
export const validateUsername = (username: string): { valid: boolean, message: string } => {
  if (username.length < 3) {
    return { valid: false, message: 'Username must be at least 3 characters long' }
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { valid: false, message: 'Username can only contain letters, numbers, and underscores' }
  }
  
  return { valid: true, message: '' }
}