import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  Plus, 
  Image, 
  Target, 
  Calendar,
  Users,
  Share2,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import FileUpload from '../Common/FileUpload'
import toast from 'react-hot-toast'

const campaignSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters'),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  category: z.enum(['sanitation', 'infrastructure', 'publicServices', 'utilities', 'transportation', 'other']),
  targetAudience: z.string().min(10, 'Target audience must be at least 10 characters'),
  goals: z.string().min(20, 'Goals must be at least 20 characters'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  isPublic: z.boolean().default(true)
})

type CampaignFormData = z.infer<typeof campaignSchema>

interface CampaignCreatorProps {
  onCampaignCreated?: (campaign: any) => void
  onCancel?: () => void
}

const CampaignCreator: React.FC<CampaignCreatorProps> = ({ 
  onCampaignCreated, 
  onCancel 
}) => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [campaignImages, setCampaignImages] = useState<any[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema)
  })

  const categories = [
    { value: 'sanitation', label: 'Sanitation & Cleanliness' },
    { value: 'infrastructure', label: 'Infrastructure Development' },
    { value: 'publicServices', label: 'Public Services' },
    { value: 'utilities', label: 'Utilities & Resources' },
    { value: 'transportation', label: 'Transportation' },
    { value: 'other', label: 'Other Social Causes' }
  ]

  const handleImagesUploaded = (files: any[]) => {
    setCampaignImages(files)
  }

  const onSubmit = async (data: CampaignFormData) => {
    if (!user) return

    try {
      setError('')
      setSuccess('')
      setLoading(true)

      // Create campaign in discussion_groups table with NGO-specific fields
      const { data: campaign, error: campaignError } = await supabase
        .from('discussion_groups')
        .insert({
          name: data.title,
          description: data.description,
          created_by: user.id,
          is_ngo_group: true,
          // Store additional campaign data in metadata
          metadata: {
            category: data.category,
            target_audience: data.targetAudience,
            goals: data.goals,
            start_date: data.startDate,
            end_date: data.endDate,
            is_public: data.isPublic,
            images: campaignImages.map(img => img.url),
            campaign_type: 'social_cause'
          }
        })
        .select()
        .single()

      if (campaignError) throw campaignError

      // Automatically add creator as admin
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: campaign.id,
          user_id: user.id,
          role: 'admin'
        })

      if (memberError) throw memberError

      setSuccess('Campaign created successfully!')
      toast.success('Campaign created successfully!')
      
      reset()
      setCampaignImages([])
      
      if (onCampaignCreated) {
        onCampaignCreated(campaign)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create campaign. Please try again.')
      toast.error('Failed to create campaign')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
          <Plus className="w-6 h-6 text-primary-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Create New Campaign</h2>
          <p className="text-gray-600">Launch a social cause campaign to engage your community</p>
        </div>
      </div>

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
        {/* Campaign Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Campaign Title *
          </label>
          <input
            {...register('title')}
            type="text"
            className="input-field"
            placeholder="Enter a compelling campaign title"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-error-600">{errors.title.message}</p>
          )}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Campaign Category *
          </label>
          <select
            {...register('category')}
            className="input-field"
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="mt-1 text-sm text-error-600">{errors.category.message}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Campaign Description *
          </label>
          <textarea
            {...register('description')}
            rows={6}
            className="input-field resize-none"
            placeholder="Describe your campaign, its purpose, and why people should support it..."
          />
          {errors.description && (
            <p className="mt-1 text-sm text-error-600">{errors.description.message}</p>
          )}
        </div>

        {/* Target Audience */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Target Audience *</span>
          </label>
          <input
            {...register('targetAudience')}
            type="text"
            className="input-field"
            placeholder="Who is this campaign for? (e.g., Local residents, Students, Families)"
          />
          {errors.targetAudience && (
            <p className="mt-1 text-sm text-error-600">{errors.targetAudience.message}</p>
          )}
        </div>

        {/* Goals */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
            <Target className="w-4 h-4" />
            <span>Campaign Goals *</span>
          </label>
          <textarea
            {...register('goals')}
            rows={3}
            className="input-field resize-none"
            placeholder="What do you hope to achieve with this campaign?"
          />
          {errors.goals && (
            <p className="mt-1 text-sm text-error-600">{errors.goals.message}</p>
          )}
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Start Date *</span>
            </label>
            <input
              {...register('startDate')}
              type="date"
              className="input-field"
            />
            {errors.startDate && (
              <p className="mt-1 text-sm text-error-600">{errors.startDate.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>End Date *</span>
            </label>
            <input
              {...register('endDate')}
              type="date"
              className="input-field"
            />
            {errors.endDate && (
              <p className="mt-1 text-sm text-error-600">{errors.endDate.message}</p>
            )}
          </div>
        </div>

        {/* Campaign Images */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
            <Image className="w-4 h-4" />
            <span>Campaign Images (Optional)</span>
          </label>
          <FileUpload
            onFilesUploaded={handleImagesUploaded}
            maxFiles={3}
            maxSize={5 * 1024 * 1024} // 5MB
            bucket="campaign-images"
            folder={`campaigns/${user?.id}`}
            acceptedTypes={['image/*']}
          />
        </div>

        {/* Visibility */}
        <div>
          <label className="flex items-center space-x-3">
            <input
              {...register('isPublic')}
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <div>
              <span className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                <Share2 className="w-4 h-4" />
                <span>Make this campaign public</span>
              </span>
              <p className="text-xs text-gray-500">
                Public campaigns can be discovered and joined by anyone
              </p>
            </div>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
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
                <Plus className="w-5 h-5" />
                <span>Create Campaign</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default CampaignCreator