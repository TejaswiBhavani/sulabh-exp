import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Calendar, 
  Users, 
  Target, 
  Share2,
  Heart,
  MessageCircle,
  UserPlus,
  Settings
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'

interface Campaign {
  id: string
  name: string
  description: string
  created_by: string
  is_ngo_group: boolean
  created_at: string
  metadata?: {
    category: string
    target_audience: string
    goals: string
    start_date: string
    end_date: string
    is_public: boolean
    images: string[]
    campaign_type: string
  }
  members: any[]
  creator: {
    first_name: string
    last_name: string
  }
}

const NGOCampaignPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [isJoined, setIsJoined] = useState(false)
  const [joinLoading, setJoinLoading] = useState(false)

  useEffect(() => {
    if (id) {
      loadCampaign()
    }
  }, [id])

  const loadCampaign = async () => {
    try {
      const { data, error } = await supabase
        .from('discussion_groups')
        .select(`
          *,
          group_members(*),
          profiles!discussion_groups_created_by_fkey(first_name, last_name)
        `)
        .eq('id', id)
        .eq('is_ngo_group', true)
        .single()

      if (error) throw error

      setCampaign({
        ...data,
        members: data.group_members || [],
        creator: data.profiles
      })

      // Check if user is already a member
      if (user && data.group_members) {
        const isMember = data.group_members.some((member: any) => member.user_id === user.id)
        setIsJoined(isMember)
      }
    } catch (error) {
      console.error('Error loading campaign:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinCampaign = async () => {
    if (!user || !campaign) return

    setJoinLoading(true)
    try {
      if (isJoined) {
        // Leave campaign
        const { error } = await supabase
          .from('group_members')
          .delete()
          .eq('group_id', campaign.id)
          .eq('user_id', user.id)

        if (error) throw error
        setIsJoined(false)
      } else {
        // Join campaign
        const { error } = await supabase
          .from('group_members')
          .insert({
            group_id: campaign.id,
            user_id: user.id,
            role: 'member'
          })

        if (error) throw error
        setIsJoined(true)
      }

      // Reload campaign to update member count
      await loadCampaign()
    } catch (error) {
      console.error('Error joining/leaving campaign:', error)
    } finally {
      setJoinLoading(false)
    }
  }

  const getCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      sanitation: 'Sanitation & Cleanliness',
      infrastructure: 'Infrastructure Development',
      publicServices: 'Public Services',
      utilities: 'Utilities & Resources',
      transportation: 'Transportation',
      other: 'Other Social Causes'
    }
    return categories[category] || category
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Campaign Not Found</h2>
            <p className="text-gray-600 mb-6">
              The campaign you're looking for doesn't exist or has been removed.
            </p>
            <button
              onClick={() => navigate('/ngo')}
              className="btn-primary"
            >
              Back to NGO Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  const metadata = campaign.metadata
  const isCreator = user?.id === campaign.created_by
  const campaignActive = metadata?.start_date && metadata?.end_date && 
    new Date() >= new Date(metadata.start_date) && 
    new Date() <= new Date(metadata.end_date)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {campaign.name}
              </h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Created on {format(new Date(campaign.created_at), 'PPP')}</span>
                </div>
                {metadata?.category && (
                  <div className="flex items-center space-x-1">
                    <span className="font-medium">Category:</span>
                    <span>{getCategoryLabel(metadata.category)}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                campaignActive 
                  ? 'bg-success-100 text-success-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {campaignActive ? 'Active Campaign' : 'Inactive Campaign'}
              </span>
            </div>
          </div>
        </div>

        {/* Campaign Banner */}
        {metadata?.images && metadata.images.length > 0 && (
          <div className="mb-6 rounded-lg overflow-hidden h-64 relative">
            <img 
              src={metadata.images[0]} 
              alt={campaign.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
              <div className="p-6 text-white">
                <h2 className="text-2xl font-bold">{campaign.name}</h2>
                <p className="text-white/80">
                  By {campaign.creator.first_name} {campaign.creator.last_name}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Campaign Description */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">About This Campaign</h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {campaign.description}
                </p>
              </div>
              
              {metadata?.goals && (
                <div className="mt-6 p-4 bg-primary-50 rounded-lg border border-primary-100">
                  <h3 className="font-medium text-primary-900 mb-2 flex items-center space-x-2">
                    <Target className="w-5 h-5" />
                    <span>Campaign Goals</span>
                  </h3>
                  <p className="text-primary-800">{metadata.goals}</p>
                </div>
              )}
            </div>

            {/* Campaign Gallery */}
            {metadata?.images && metadata.images.length > 0 && (
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Campaign Gallery</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {metadata.images.map((image, index) => (
                    <div key={index} className="rounded-lg overflow-hidden h-48">
                      <img 
                        src={image} 
                        alt={`Campaign image ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4">
              <button className="btn-outline flex items-center space-x-2">
                <Heart className="w-5 h-5" />
                <span>Support Campaign</span>
              </button>
              
              <button className="btn-outline flex items-center space-x-2">
                <MessageCircle className="w-5 h-5" />
                <span>Discuss</span>
              </button>
              
              <button className="btn-outline flex items-center space-x-2">
                <Share2 className="w-5 h-5" />
                <span>Share</span>
              </button>
              
              {isCreator && (
                <button className="btn-outline flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>Manage Campaign</span>
                </button>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Campaign Info */}
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Campaign Information</h3>
              <div className="space-y-4">
                {metadata?.target_audience && (
                  <div className="flex items-start space-x-3">
                    <Users className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Target Audience</p>
                      <p className="font-medium">{metadata.target_audience}</p>
                    </div>
                  </div>
                )}
                
                {metadata?.start_date && metadata?.end_date && (
                  <div className="flex items-start space-x-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Campaign Period</p>
                      <p className="font-medium">
                        {format(new Date(metadata.start_date), 'PPP')} - {format(new Date(metadata.end_date), 'PPP')}
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-start space-x-3">
                  <Users className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Members</p>
                    <p className="font-medium">{campaign.members.length} participants</p>
                  </div>
                </div>
                
                {metadata?.is_public !== undefined && (
                  <div className="flex items-start space-x-3">
                    <Share2 className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Visibility</p>
                      <p className="font-medium">{metadata.is_public ? 'Public Campaign' : 'Private Campaign'}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Join Campaign */}
            {user && !isCreator && (
              <div className="card">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Join This Campaign</h3>
                <p className="text-gray-600 mb-4">
                  {isJoined 
                    ? 'You are currently a member of this campaign.'
                    : 'Join this campaign to participate and receive updates.'
                  }
                </p>
                <button
                  onClick={handleJoinCampaign}
                  disabled={joinLoading}
                  className={`w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-lg font-medium transition-colors duration-200 ${
                    isJoined
                      ? 'bg-error-100 text-error-700 hover:bg-error-200 border border-error-300'
                      : 'bg-primary-600 text-white hover:bg-primary-700'
                  }`}
                >
                  {joinLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      {isJoined ? (
                        <>
                          <Users className="w-5 h-5" />
                          <span>Leave Campaign</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-5 h-5" />
                          <span>Join Campaign</span>
                        </>
                      )}
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Campaign Creator */}
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Campaign Organizer</h3>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-medium text-lg">
                    {campaign.creator.first_name.charAt(0)}{campaign.creator.last_name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {campaign.creator.first_name} {campaign.creator.last_name}
                  </p>
                  <p className="text-sm text-gray-600">Campaign Organizer</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NGOCampaignPage