import api from './api'
import { User } from '../types'

// Auth API interfaces
export interface LoginRequest {
  identifier: string // Can be email or username
  password: string
  rememberMe?: boolean
}

export interface LoginResponse {
  token: string
  email: string
  username: string
  fullName: string
  phoneNumber?: string
  user: {
    id: number
    email: string
    username: string
    fullName: string
    phoneNumber?: string
  }
}

export interface RegisterRequest {
  username: string
  email: string
  fullName: string
  phoneNumber?: string
  password: string
}

export interface RegisterResponse {
  token: string
  email: string
  username: string
  fullName: string
  phoneNumber?: string
  user: {
    id: number
    email: string
    username: string
    fullName: string
    phoneNumber?: string
  }
}

export interface UserResponse {
  id: number
  email: string
  username: string
  fullName: string
  phoneNumber?: string
}

// Auth Service Class
class AuthService {
  
  // Login user
  async login(identifier: string, password: string, rememberMe: boolean = false): Promise<LoginResponse> {
    try {
      const response = await api.post<LoginResponse>('/api/auth/login', {
        identifier,
        password,
        rememberMe
      }, {
        withCredentials: true // Enable cookies
      })
      
      // Store token and user data with session management
      if (response.data.token) {
        if (rememberMe) {
          localStorage.setItem('auth_token', response.data.token)
          localStorage.setItem('user_data', JSON.stringify(response.data.user))
          localStorage.setItem('remember_me', 'true')
        } else {
          sessionStorage.setItem('auth_token', response.data.token)
          sessionStorage.setItem('user_data', JSON.stringify(response.data.user))
          // Clear any remembered data
          localStorage.removeItem('auth_token')
          localStorage.removeItem('user_data')
          localStorage.removeItem('remember_me')
        }
      }
      
      return response.data
    } catch (error: any) {
      console.error('Login error:', error)
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message)
      } else if (error.response?.status === 401) {
        throw new Error('Invalid email or password')
      } else {
        throw new Error('Login failed. Please try again.')
      }
    }
  }

  // Register user
  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    try {
      const response = await api.post<RegisterResponse>('/api/auth/register', userData, {
        withCredentials: true
      })
      
      // Store token and user data (registration acts like remember me = false)
      if (response.data.token) {
        sessionStorage.setItem('auth_token', response.data.token)
        sessionStorage.setItem('user_data', JSON.stringify(response.data.user))
      }
      
      return response.data
    } catch (error: any) {
      console.error('Registration error:', error)
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message)
      } else if (error.response?.status === 400) {
        throw new Error('Registration failed. Please check your information.')
      } else {
        throw new Error('Registration failed. Please try again.')
      }
    }
  }

  // Get current user
  async getCurrentUser(): Promise<UserResponse> {
    try {
      const response = await api.get<UserResponse>('/api/auth/me')
      return response.data
    } catch (error: any) {
      console.error('Get current user error:', error)
      throw new Error('Failed to get user information')
    }
  }

  // Logout
  async logout(): Promise<void> {
    try {
      await api.post('/api/auth/logout', {}, {
        withCredentials: true
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Always clear all storage
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_data')
      localStorage.removeItem('remember_me')
      sessionStorage.removeItem('auth_token')
      sessionStorage.removeItem('user_data')
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = this.getToken()
    return !!token
  }

  // Get stored user data
  getStoredUser(): User | null {
    try {
      // Check session storage first, then localStorage for remember me
      const userData = sessionStorage.getItem('user_data') || localStorage.getItem('user_data')
      
      if (userData) {
        const parsedUser = JSON.parse(userData)
        return {
          id: parsedUser.id.toString(),
          email: parsedUser.email,
          username: parsedUser.username || parsedUser.email.split('@')[0],
          firstName: parsedUser.fullName.split(' ')[0] || '',
          lastName: parsedUser.fullName.split(' ').slice(1).join(' ') || '',
          phone: parsedUser.phoneNumber,
          role: 'citizen',
          isVerified: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      }
      return null
    } catch (error) {
      console.error('Error parsing stored user data:', error)
      return null
    }
  }

  // Get stored token
  getToken(): string | null {
    // Check session storage first, then localStorage for remember me
    return sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token')
  }

  // Check if remember me is enabled
  isRememberMeEnabled(): boolean {
    return localStorage.getItem('remember_me') === 'true'
  }
}

// Export singleton instance
export default new AuthService()