import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  Lightbulb, 
  AlertCircle,
  CheckCircle,
  Users,
  TrendingUp
} from 'lucide-react'
import { useSuggestions } from '../contexts/SuggestionContext'
import { useAuth } from '../contexts/AuthContext'
import { ComplaintCategory } from '../types'
import toast from 'react-hot-toast'

const suggestionSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters'),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  category: z.enum(['sanitation', 'infrastructure', 'publicServices', 'utilities', 'transportation', 'other'])
})

type SuggestionFormData = z.infer<typeof suggestionSchema>

const SubmitSuggestionPage: React.FC = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { submitSuggestion, loading } = useSuggestions()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<SuggestionFormData>({
    resolver: zodResolver(suggestionSchema)
  })

  const categories: { value: ComplaintCategory; label: string; description: string }[] = [
    { 
      value: 'sanitation', 
      label: t('complaint.submit.categories.sanitation'),
      description: 'Waste management, cleanliness, hygiene improvements'
    },
    { 
      value: 'infrastructure', 
      label: t('complaint.submit.categories.infrastructure'),
      description: 'Roads, bridges, buildings, public facilities'
    },
    { 
      value: 'publicServices', 
      label: t('complaint.submit.categories.publicServices'),
      description: 'Healthcare, education, government services'
    },
    { 
      value: 'utilities', 
      label: t('complaint.submit.categories.utilities'),
      description: 'Water supply, electricity, gas, internet'
    },
    { 
      value: 'transportation', 
      label: t('complaint.submit.categories.transportation'),
      description: 'Public transport, traffic management, parking'
    },
    { 
      value: 'other', 
      label: t('complaint.submit.categories.other'),
      description: 'Any other civic improvement ideas'
    }
  ]

  const onSubmit = async (data: SuggestionFormData) => {
    if (!user) return

    try {
      setError('')
      setSuccess('')
      
      const suggestionId = await submitSuggestion({
        ...data,
        status: 'active'
      })
      
      setSuccess(`Suggestion submitted successfully! Your suggestion ID is: ${suggestionId}`)
      toast.success('Suggestion submitted successfully!')
      
      reset()
      
      // Redirect to suggestions page after 3 seconds
      setTimeout(() => {
        navigate('/suggestions')
      }, 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to submit suggestion. Please try again.')
      toast.error('Failed to submit suggestion')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('suggestion.submit.title')}
          </h1>
          <p className="text-gray-600">
            Share your ideas to improve civic services and community life
          </p>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <Lightbulb className="w-6 h-6 text-primary-600" />
              <div>
                <h3 className="font-medium text-primary-900">Share Ideas</h3>
                <p className="text-sm text-primary-700">Propose improvements for your community</p>
              </div>
            </div>
          </div>
          
          <div className="bg-secondary-50 border border-secondary-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <Users className="w-6 h-6 text-secondary-600" />
              <div>
                <h3 className="font-medium text-secondary-900">Get Support</h3>
                <p className="text-sm text-secondary-700">Rally community backing for your ideas</p>
              </div>
            </div>
          </div>
          
          <div className="bg-success-50 border border-success-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-6 h-6 text-success-600" />
              <div>
                <h3 className="font-medium text-success-900">Make Impact</h3>
                <p className="text-sm text-success-700">See your suggestions implemented</p>
              </div>
            </div>
          </div>
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
            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('suggestion.submit.category')} *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {categories.map((category) => (
                  <label key={category.value} className="relative">
                    <input
                      {...register('category')}
                      type="radio"
                      value={category.value}
                      className="sr-only peer"
                    />
                    <div className="border-2 border-gray-200 rounded-lg p-4 cursor-pointer peer-checked:border-primary-500 peer-checked:bg-primary-50 hover:bg-gray-50 transition-colors duration-200">
                      <div className="font-medium text-gray-900 mb-1">
                        {category.label}
                      </div>
                      <div className="text-sm text-gray-600">
                        {category.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              {errors.category && (
                <p className="mt-1 text-sm text-error-600">{errors.category.message}</p>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('suggestion.submit.title')} *
              </label>
              <input
                {...register('title')}
                type="text"
                className="input-field"
                placeholder="Brief, clear title for your suggestion"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-error-600">{errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('suggestion.submit.description')} *
              </label>
              <textarea
                {...register('description')}
                rows={8}
                className="input-field resize-none"
                placeholder="Describe your suggestion in detail. Include:
• What problem does it solve?
• How would it benefit the community?
• Any implementation ideas you have
• Examples from other places if applicable"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-error-600">{errors.description.message}</p>
              )}
            </div>

            {/* Guidelines */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Suggestion Guidelines</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Be specific and constructive in your suggestions</li>
                <li>• Focus on solutions that benefit the broader community</li>
                <li>• Provide clear reasoning for why your idea would be valuable</li>
                <li>• Be respectful and professional in your language</li>
                <li>• Check if similar suggestions already exist before submitting</li>
              </ul>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/suggestions')}
                className="btn-outline"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center space-x-2"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Lightbulb className="w-5 h-5" />
                    <span>{t('common.submit')}</span>
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

export default SubmitSuggestionPage