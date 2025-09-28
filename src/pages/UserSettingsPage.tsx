import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  User, 
  Bell, 
  Shield, 
  Save,
  AlertCircle,
  CheckCircle,
  Globe
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const profileSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  phone: z.string().optional(),
  emailNotifications: z.boolean().default(true),
  smsNotifications: z.boolean().default(false),
  language: z.string().default('en')
})

type ProfileFormData = z.infer<typeof profileSchema>

const UserSettingsPage: React.FC = () => {
  const { i18n } = useTranslation()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [phoneVerified, setPhoneVerified] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
      emailNotifications: true,
      smsNotifications: false,
      language: i18n.language
    }
  })

  useEffect(() => {
    if (user) {
      loadUserSettings()
    }
  }, [user])

  const loadUserSettings = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      
      // Get user profile with notification settings
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
        
      if (error) throw error
      
      // Set form values
      setValue('firstName', data.first_name)
      setValue('lastName', data.last_name)
      setValue('phone', data.phone || '')
      setValue('emailNotifications', data.email_notification_enabled !== false) // Default to true
      setValue('smsNotifications', data.phone_notification_enabled || false)
      
      // Check if phone is verified
      setPhoneVerified(data.is_phone_verified || false)
      
    } catch (error) {
      console.error('Error loading user settings:', error)
      toast.error('Failed to load user settings')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) return
    
    try {
      setLoading(true)
      setError('')
      setSuccess('')
      
      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: data.firstName,
          last_name: data.lastName,
          phone: data.phone || null,
          email_notification_enabled: data.emailNotifications,
          phone_notification_enabled: data.smsNotifications
        })
        .eq('id', user.id)
        
      if (error) throw error
      
      // Update language preference
      if (data.language !== i18n.language) {
        i18n.changeLanguage(data.language)
      }
      
      setSuccess('Profile updated successfully!')
      toast.success('Profile updated successfully!')
      
    } catch (err: any) {
      setError(err.message || 'Failed to update profile. Please try again.')
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
    { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
    { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
    { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
    { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            User Settings
          </h1>
          <p className="text-gray-600">
            Manage your profile and notification preferences
          </p>
        </div>

        <div className="card">
          {error && (
            <div className="mb-6 bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 bg-success-50 border border-success-200 text-success-700 px-4 py-3 rounded-lg flex items-center space-x-2">
              <CheckCircle className="w-5 h-5" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <User className="w-5 h-5 text-primary-600" />
                  <span>Personal Information</span>
                </h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    {...register('firstName')}
                    type="text"
                    className="input-field"
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-error-600">{errors.firstName.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    {...register('lastName')}
                    type="text"
                    className="input-field"
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-error-600">{errors.lastName.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <div className="flex items-center">
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="input-field bg-gray-50 text-gray-500"
                    />
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
                      Verified
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <div className="flex items-center">
                    <input
                      {...register('phone')}
                      type="tel"
                      className="input-field"
                      placeholder="+91 9876543210"
                    />
                    {user?.phone && phoneVerified && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
                        Verified
                      </span>
                    )}
                  </div>
                  {errors.phone && (
                    <p className="mt-1 text-sm text-error-600">{errors.phone.message}</p>
                  )}
                </div>
              </div>

              {/* Notification Preferences */}
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <Bell className="w-5 h-5 text-primary-600" />
                  <span>Notification Preferences</span>
                </h2>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      {...register('emailNotifications')}
                      type="checkbox"
                      id="emailNotifications"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <div className="ml-3">
                      <label htmlFor="emailNotifications" className="font-medium text-gray-700">Email Notifications</label>
                      <p className="text-gray-500 text-sm">Receive updates about your complaints via email</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      {...register('smsNotifications')}
                      type="checkbox"
                      id="smsNotifications"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      disabled={!user?.phone}
                    />
                    <div className="ml-3">
                      <label htmlFor="smsNotifications" className="font-medium text-gray-700">SMS Notifications</label>
                      <p className="text-gray-500 text-sm">
                        {user?.phone 
                          ? "Receive important updates via SMS" 
                          : "Add a phone number to enable SMS notifications"}
                      </p>
                    </div>
                  </div>
                </div>
                
                <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2 pt-4">
                  <Globe className="w-5 h-5 text-primary-600" />
                  <span>Language Preference</span>
                </h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preferred Language
                  </label>
                  <select
                    {...register('language')}
                    className="input-field"
                  >
                    {languages.map(lang => (
                      <option key={lang.code} value={lang.code}>
                        {lang.nativeName} ({lang.name})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="bg-primary-50 border border-primary-100 rounded-lg p-4 mt-4">
                  <div className="flex items-start space-x-3">
                    <Shield className="w-5 h-5 text-primary-600 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-primary-900">Data Privacy</h3>
                      <p className="text-sm text-primary-700">
                        Your personal information is protected and will only be used for communication related to your complaints and suggestions.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center space-x-2"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Save Settings</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default UserSettingsPage