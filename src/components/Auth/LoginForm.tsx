import React, { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, User, Lock, AlertCircle, Clock } from 'lucide-react'
import { supabase, checkRateLimit, getRemainingLockoutTime } from '../../lib/supabase'
import toast from 'react-hot-toast'

// Define the form schema with Zod
const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional()
})

type LoginFormData = z.infer<typeof loginSchema>

const LoginForm: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRateLimited, setIsRateLimited] = useState(false)
  const [lockoutTimeRemaining, setLockoutTimeRemaining] = useState(0)
  const [loginMessage, setLoginMessage] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  })

  // Check for message from registration or password reset
  useEffect(() => {
    if (location.state?.message) {
      setLoginMessage(location.state.message)
    }
  }, [location])

  // Check rate limit status periodically if locked out
  useEffect(() => {
    if (isRateLimited) {
      const interval = setInterval(() => {
        const identifier = getValues('identifier')
        if (identifier) {
          const remainingTime = getRemainingLockoutTime(identifier)
          setLockoutTimeRemaining(remainingTime)
          
          if (remainingTime <= 0) {
            setIsRateLimited(false)
            clearInterval(interval)
          }
        }
      }, 60000) // Check every minute
      
      return () => clearInterval(interval)
    }
  }, [isRateLimited, getValues])

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError('')
      setIsSubmitting(true)
      
      // Check if user is rate limited
      const identifier = data.identifier.toLowerCase()
      if (!checkRateLimit(identifier)) {
        const remainingTime = getRemainingLockoutTime(identifier)
        setLockoutTimeRemaining(remainingTime)
        setIsRateLimited(true)
        setError(`Too many failed login attempts. Please try again in ${remainingTime} minutes.`)
        return
      }

      // Determine if the identifier is an email or username
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)
      
      let authResponse
      
      if (isEmail) {
        // Login with email
        authResponse = await supabase.auth.signInWithPassword({
          email: identifier,
          password: data.password
        })
      } else {
        // Login with username - first get the email associated with the username
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('username', identifier)
        
        // Check if profile data exists and has at least one record
        if (profileError || !profileData || profileData.length === 0) {
          throw new Error('Invalid username or password')
        }
        
        // Then login with the email
        authResponse = await supabase.auth.signInWithPassword({
          email: profileData[0].email,
          password: data.password
        })
      }
      
      const { error: signInError } = authResponse
      
      if (signInError) {
        if (signInError.message.includes('Email not confirmed')) {
          throw new Error('Please verify your email address before logging in.')
        }
        throw signInError
      }
      
      // Set session persistence based on "Remember me" option
      if (!data.rememberMe) {
        // If "Remember me" is not checked, set session expiry to 1 day
        await supabase.auth.updateUser({
          data: { session_expiry: '1d' }
        })
      }
      
      toast.success('Logged in successfully!')
      navigate('/dashboard')
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message || 'Invalid username or password')
      toast.error('Login failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
        <p className="text-gray-600 mt-2">Sign in to your SULABH account</p>
      </div>

      {loginMessage && (
        <div className="mb-6 bg-info-50 border border-info-200 text-info-700 px-4 py-3 rounded-lg">
          {loginMessage}
        </div>
      )}

      {error && (
        <div className="mb-6 bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isRateLimited && (
        <div className="mb-6 bg-warning-50 border border-warning-200 text-warning-700 px-4 py-3 rounded-lg flex items-center space-x-2">
          <Clock className="w-5 h-5 flex-shrink-0" />
          <span>Account temporarily locked. Try again in {lockoutTimeRemaining} minutes.</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-1">
            Email or Username
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <input
              {...register('identifier')}
              type="text"
              id="identifier"
              className="input-field pl-10"
              placeholder="Enter your email or username"
              disabled={isRateLimited}
            />
          </div>
          {errors.identifier && (
            <p className="mt-1 text-sm text-error-600">{errors.identifier.message}</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <Link to="/forgot-password" className="text-sm text-primary-600 hover:text-primary-500">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              id="password"
              className="input-field pl-10 pr-10"
              placeholder="Enter your password"
              disabled={isRateLimited}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isRateLimited}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-error-600">{errors.password.message}</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              {...register('rememberMe')}
              type="checkbox"
              id="rememberMe"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              disabled={isRateLimited}
            />
            <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
              Remember me
            </label>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isSubmitting || isRateLimited}
            className="w-full btn-primary flex justify-center items-center"
          >
            {isSubmitting ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              'Sign In'
            )}
          </button>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary-600 hover:text-primary-500 font-medium">
              Sign up here
            </Link>
          </p>
        </div>
      </form>
    </div>
  )
}

export default LoginForm