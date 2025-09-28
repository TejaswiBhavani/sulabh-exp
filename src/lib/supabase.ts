import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check if environment variables are configured with valid values
export const isSupabaseConfigured = !!(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'your_supabase_project_url' &&
  supabaseAnonKey !== 'your_supabase_anon_key' &&
  supabaseUrl.startsWith('https://') &&
  supabaseUrl.includes('.supabase.co')
)

if (!isSupabaseConfigured) {
  console.warn('⚠️ Supabase not configured - using demo mode')
  console.warn('📋 To enable full functionality:')
  console.warn('   1. Click "Connect to Supabase" button in the top right')
  console.warn('   2. Or manually update .env with your Supabase credentials')
}

// Create client with safe fallback values that won't cause URL construction errors
export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDk3NDA4MDAsImV4cCI6MTk2NTM0ODgwMH0.placeholder',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
)

// Helper function to get current user profile
export const getCurrentUserProfile = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile as any // Type assertion to allow flexible profile data
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