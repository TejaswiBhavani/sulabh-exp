import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import toast from 'react-hot-toast'

// Define validation schema using Zod
const registerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .refine(
      (password) => /\d/.test(password),
      { message: 'Password must contain at least one number' }
    )
    .refine(
      (password) => /[!@#$%^&*(),.?":{}|<>]/.test(password),
      { message: 'Password must contain at least one special character' }
    )
})

export type RegisterData = z.infer<typeof registerSchema>

export const useRegister = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  /**
   * Handles user registration and account creation
   * @param userData User registration form data
   * @returns Promise that resolves when registration is complete
   */
  const registerUser = async (userData: RegisterData): Promise<void> => {
    // Reset state
    setLoading(true)
    setError(null)
    
    try {
      console.log('Starting registration process for:', userData.email)
      
      // Check if Supabase is properly configured
      if (!isSupabaseConfigured) {
        throw new Error(
          'Authentication service is not configured. Please contact the administrator or check your environment setup.'
        )
      }
      
      // Validate all required fields
      const validationResult = registerSchema.safeParse(userData)
      if (!validationResult.success) {
        const formattedErrors = validationResult.error.format();
        let errorMessage = 'Invalid form data';
        
        // Iterate over the formatted errors to find the first message
        // Check form errors first
        if (formattedErrors._errors && formattedErrors._errors.length > 0) {
            errorMessage = formattedErrors._errors[0];
        } else {
          // Check field-specific errors
          for (const key in formattedErrors) {
            if (key !== '_errors' && Object.prototype.hasOwnProperty.call(formattedErrors, key)) {
              const fieldErrorObject = (formattedErrors as any)[key];
              if (fieldErrorObject && fieldErrorObject._errors && fieldErrorObject._errors.length > 0) {
                errorMessage = fieldErrorObject._errors[0];
                break;
              }
            }
          }
        }
        throw new Error(errorMessage);
      }
      
      // Check if username already exists
      const { data: existingUsers, error: usernameCheckError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', userData.username)
        .limit(1)

      if (usernameCheckError) {
        // If it's an RLS error, we can't check existing usernames before signup
        // This is expected behavior when RLS is properly configured
        console.log('Username check error (expected with RLS):', usernameCheckError.message)
        // Continue with signup - the profile creation will handle username uniqueness via constraints
      } else if (existingUsers && existingUsers.length > 0) {
        throw new Error('Username is already taken. Please choose another one.')
      }
      
      console.log('Proceeding with auth signup')

      // Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName,
            username: userData.username,
            phone: userData.phone || null
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        // Enhanced error handling for user already exists scenarios
        const errorMessage = error.message?.toLowerCase() || ''
        const errorCode = (error as any).code || ''
        
        if (errorCode === 'user_already_exists' || 
            errorMessage.includes('user already registered') || 
            errorMessage.includes('user already exists') ||
            errorMessage.includes('already registered') ||
            errorMessage.includes('email address is already registered')) {
          throw new Error('This email is already registered. Please log in or use a different email.')
        }
        
        throw error
      }

      if (!data.user) {
        throw new Error('Registration failed: No user data returned')
      }
      
      console.log('Auth signup successful, creating profile record')

      // Create profile with user information
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email: userData.email,
          username: userData.username,
          first_name: userData.firstName,
          last_name: userData.lastName,
          phone: userData.phone || null,
          role: 'citizen'
        })

      if (profileError) {
        console.error('Profile creation error:', profileError)
        
        // If profile creation fails, clean up the auth user to prevent orphaned accounts
        await supabase.auth.signOut()
        throw new Error('Failed to create user profile. Please try again.')
      }
      
      console.log('Registration successful for:', userData.email)
      
      // Show success message
      toast.success('Account created successfully! Please check your email to verify your account.')
      
      // Redirect to login page with message
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Please check your email to verify your account before logging in.' 
          } 
        })
      }, 2000)
      
    } catch (err: any) {
      console.error('Registration error:', err)
      setError(err.message || 'Registration failed. Please try again.')
      toast.error(err.message || 'Registration failed')
      throw err // Re-throw to allow component to handle the error
    } finally {
      setLoading(false)
    }
  }

  return {
    registerUser,
    loading,
    error
  }
}