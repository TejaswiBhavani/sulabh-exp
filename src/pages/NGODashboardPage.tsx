import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Users, 
  MessageCircle, 
  TrendingUp, 
  Calendar,
  Plus,
  Settings,
  UserPlus,
  Crown,
  Eye,
  X
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import CampaignCreator from '../components/NGO/CampaignCreator'
import { format } from 'date-fns'

const NGODashboardPage: React.FC = () => {
  const { user } = useAuth()
  const [selectedTab, setSelectedTab] = useState('overview')
  const [showCampaignCreator, setShowCampaignCreator] = useState(false)
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Load campaigns when component mounts
  useEffect(() => {
    if (user) {
      loadCampaigns()
    }
  }, [user])

  const loadCampaigns = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('discussion_groups')
        .select(`
          *,
          group_members(*)
        `)
        .eq('is_ngo_group', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Format campaigns
      const formattedCampaigns = data.map(campaign => ({
        id: campaign.id,
        name: campaign.name,
        description: campaign.description,
        createdBy: campaign.created_by,
        isNgoGroup: campaign.is_ngo_group,
        createdAt: campaign.created_at,
        metadata: campaign.metadata,
        members: campaign.group_members?.length || 0
      }))

      setCampaigns(formattedCampaigns)
    } catch (error) {
      console.error('Error loading campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCampaignCreated = () => {
    setShowCampaignCreator(false)
    loadCampaigns()
  }

  // Mock data for NGO dashboard
  const ngoStats = {
    totalMembers: campaigns.reduce((total, campaign) => total + campaign.members, 0),
    activeGroups: campaigns.length,
    totalSuggestions: 23,
    implementedSuggestions: 7,
    monthlyGrowth: 12
  }

  const recentActivities = [
    {
      id: 1,
      type: 'member_joined',
      message: 'New member joined Clean Water Initiative',
      timestamp: '2 hours ago'
    },
    {
      id: 2,
      type: 'suggestion_supported',
      message: 'Solar Panel Installation gained 50 supporters',
      timestamp: '4 hours ago'
    },
    {
      id: 3,
      type: 'group_created',
      message: 'New group "Urban Gardening" was created',
      timestamp: '1 day ago'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                NGO Dashboard
              </h1>
              <p className="text-gray-600">
                Manage your organization's community initiatives and campaigns
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="btn-outline flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </button>
              <button 
                className="btn-primary flex items-center space-x-2"
                onClick={() => setShowCampaignCreator(true)}
              >
                <Plus className="w-5 h-5" />
                <span>Create Campaign</span>
              </button>
            </div>
          </div>
        </div>

        {/* Campaign Creator Modal */}
        {showCampaignCreator && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Create New Campaign</h3>
                <button 
                  onClick={() => setShowCampaignCreator(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <CampaignCreator 
                  onCampaignCreated={handleCampaignCreated}
                  onCancel={() => setShowCampaignCreator(false)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {[
              { id: 'overview', label: 'Overview', icon: TrendingUp },
              { id: 'campaigns', label: 'Campaigns', icon: Users },
              { id: 'members', label: 'Members', icon: UserPlus },
              { id: 'suggestions', label: 'Suggestions', icon: MessageCircle }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  selectedTab === tab.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Overview Tab */}
        {selectedTab === 'overview' && (
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Members</p>
                    <p className="text-3xl font-bold text-gray-900">{ngoStats.totalMembers}</p>
                  </div>
                  <Users className="w-8 h-8 text-primary-600" />
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Campaigns</p>
                    <p className="text-3xl font-bold text-secondary-600">{ngoStats.activeGroups}</p>
                  </div>
                  <MessageCircle className="w-8 h-8 text-secondary-600" />
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Suggestions</p>
                    <p className="text-3xl font-bold text-warning-600">{ngoStats.totalSuggestions}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-warning-600" />
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Implemented</p>
                    <p className="text-3xl font-bold text-success-600">{ngoStats.implementedSuggestions}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-success-600" />
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Monthly Growth</p>
                    <p className="text-3xl font-bold text-error-600">+{ngoStats.monthlyGrowth}%</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-error-600" />
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{activity.message}</p>
                      <p className="text-xs text-gray-500">{activity.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Campaigns Tab */}
        {selectedTab === 'campaigns' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Social Campaigns</h2>
              <button 
                className="btn-primary flex items-center space-x-2"
                onClick={() => setShowCampaignCreator(true)}
              >
                <Plus className="w-5 h-5" />
                <span>Create New Campaign</span>
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading campaigns...</p>
              </div>
            ) : campaigns.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns yet</h3>
                <p className="text-gray-600 mb-6">
                  Create your first campaign to start engaging with your community.
                </p>
                <button 
                  className="btn-primary"
                  onClick={() => setShowCampaignCreator(true)}
                >
                  Create Your First Campaign
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="card hover:shadow-md transition-shadow duration-200">
                    {campaign.metadata?.images && campaign.metadata.images.length > 0 && (
                      <div className="h-40 -mx-6 -mt-6 mb-4 rounded-t-lg overflow-hidden">
                        <img 
                          src={campaign.metadata.images[0]} 
                          alt={campaign.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{campaign.name}</h3>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{campaign.description}</p>
                      </div>
                      {campaign.metadata?.is_public && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
                          Public
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{campaign.members} members</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{format(new Date(campaign.createdAt), 'MMM dd, yyyy')}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Link 
                        to={`/ngo/campaign/${campaign.id}`}
                        className="btn-outline text-sm flex-1"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Link>
                      <button className="btn-primary text-sm flex-1">
                        <Settings className="w-4 h-4 mr-1" />
                        Manage
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Members Tab */}
        {selectedTab === 'members' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Organization Members</h2>
              <button className="btn-primary flex items-center space-x-2">
                <UserPlus className="w-5 h-5" />
                <span>Invite Members</span>
              </button>
            </div>

            <div className="card">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Member
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Groups
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {/* Mock member data */}
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                              <span className="text-primary-600 font-medium">JD</span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">John Doe</div>
                            <div className="text-sm text-gray-500">john@example.com</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                          <Crown className="w-3 h-3 mr-1" />
                          Admin
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        3 groups
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Jan 15, 2024
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-primary-600 hover:text-primary-900">Edit</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Suggestions Tab */}
        {selectedTab === 'suggestions' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Organization Suggestions</h2>
              <button className="btn-primary flex items-center space-x-2">
                <Plus className="w-5 h-5" />
                <span>New Suggestion</span>
              </button>
            </div>

            <div className="card">
              <p className="text-gray-600 text-center py-8">
                Suggestion management interface will be implemented here.
                This will show all suggestions created by organization members.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default NGODashboardPage