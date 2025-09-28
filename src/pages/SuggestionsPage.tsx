import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { 
  Lightbulb, 
  Heart, 
  MessageCircle, 
  Calendar, 
  Search,
  Plus,
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react'
import { useSuggestions } from '../contexts/SuggestionContext'
import { useAuth } from '../contexts/AuthContext'
import { format } from 'date-fns'
import { ComplaintCategory, SuggestionStatus } from '../types'

const SuggestionsPage: React.FC = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { suggestions, supportSuggestion, unsupportSuggestion, loading } = useSuggestions()
  const [selectedCategory, setSelectedCategory] = useState<ComplaintCategory | 'all'>('all')
  const [selectedStatus, setSelectedStatus] = useState<SuggestionStatus | 'all'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'supported'>('recent')

  // Filter and sort suggestions
  const filteredSuggestions = suggestions
    .filter(suggestion => {
      const matchesCategory = selectedCategory === 'all' || suggestion.category === selectedCategory
      const matchesStatus = selectedStatus === 'all' || suggestion.status === selectedStatus
      const matchesSearch = searchTerm === '' || 
        suggestion.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        suggestion.description.toLowerCase().includes(searchTerm.toLowerCase())
      
      return matchesCategory && matchesStatus && matchesSearch
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.supportCount - a.supportCount
        case 'supported':
          if (!user) return 0
          const aSupported = a.supports.some(s => s.userId === user.id)
          const bSupported = b.supports.some(s => s.userId === user.id)
          if (aSupported && !bSupported) return -1
          if (!aSupported && bSupported) return 1
          return b.createdAt.getTime() - a.createdAt.getTime()
        default: // recent
          return b.createdAt.getTime() - a.createdAt.getTime()
      }
    })

  const getStatusColor = (status: SuggestionStatus) => {
    switch (status) {
      case 'active': return 'text-secondary-600 bg-secondary-100'
      case 'under_review': return 'text-warning-600 bg-warning-100'
      case 'implemented': return 'text-success-600 bg-success-100'
      case 'rejected': return 'text-error-600 bg-error-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: SuggestionStatus) => {
    switch (status) {
      case 'active': return TrendingUp
      case 'under_review': return Clock
      case 'implemented': return CheckCircle
      case 'rejected': return XCircle
      default: return TrendingUp
    }
  }

  const handleSupport = async (suggestionId: string) => {
    if (!user) return
    
    const suggestion = suggestions.find(s => s.id === suggestionId)
    if (!suggestion) return

    const isSupported = suggestion.supports.some(s => s.userId === user.id)
    
    try {
      if (isSupported) {
        await unsupportSuggestion(suggestionId)
      } else {
        await supportSuggestion(suggestionId)
      }
    } catch (error) {
      console.error('Error handling support:', error)
    }
  }

  const categories = [
    { value: 'all' as const, label: 'All Categories' },
    { value: 'sanitation' as const, label: t('complaint.submit.categories.sanitation') },
    { value: 'infrastructure' as const, label: t('complaint.submit.categories.infrastructure') },
    { value: 'publicServices' as const, label: t('complaint.submit.categories.publicServices') },
    { value: 'utilities' as const, label: t('complaint.submit.categories.utilities') },
    { value: 'transportation' as const, label: t('complaint.submit.categories.transportation') },
    { value: 'other' as const, label: t('complaint.submit.categories.other') }
  ]

  const statuses = [
    { value: 'all' as const, label: 'All Statuses' },
    { value: 'active' as const, label: t('suggestion.status.active') },
    { value: 'under_review' as const, label: t('suggestion.status.under_review') },
    { value: 'implemented' as const, label: t('suggestion.status.implemented') },
    { value: 'rejected' as const, label: t('suggestion.status.rejected') }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Community Suggestions
              </h1>
              <p className="text-gray-600">
                Discover and support ideas to improve our community
              </p>
            </div>
            {user && (
              <Link
                to="/submit-suggestion"
                className="btn-primary flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Submit Suggestion</span>
              </Link>
            )}
          </div>
        </div>

        {/* Filters and Search */}
        <div className="card mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
                placeholder="Search suggestions..."
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="input-field"
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="input-field"
            >
              {statuses.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="input-field"
            >
              <option value="recent">Most Recent</option>
              <option value="popular">Most Popular</option>
              {user && <option value="supported">My Supported</option>}
            </select>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Suggestions</p>
                <p className="text-3xl font-bold text-gray-900">{suggestions.length}</p>
              </div>
              <Lightbulb className="w-8 h-8 text-primary-600" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Under Review</p>
                <p className="text-3xl font-bold text-warning-600">
                  {suggestions.filter(s => s.status === 'under_review').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-warning-600" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Implemented</p>
                <p className="text-3xl font-bold text-success-600">
                  {suggestions.filter(s => s.status === 'implemented').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-success-600" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Support</p>
                <p className="text-3xl font-bold text-secondary-600">
                  {suggestions.reduce((acc, s) => acc + s.supportCount, 0)}
                </p>
              </div>
              <Heart className="w-8 h-8 text-secondary-600" />
            </div>
          </div>
        </div>

        {/* Suggestions List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading suggestions...</p>
          </div>
        ) : filteredSuggestions.length === 0 ? (
          <div className="text-center py-12">
            <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No suggestions found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all'
                ? 'Try adjusting your filters to see more suggestions.'
                : 'Be the first to submit a suggestion for community improvement!'
              }
            </p>
            {user && (
              <Link to="/submit-suggestion" className="btn-primary">
                Submit First Suggestion
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredSuggestions.map((suggestion) => {
              const StatusIcon = getStatusIcon(suggestion.status)
              const isSupported = user ? suggestion.supports.some(s => s.userId === user.id) : false
              
              return (
                <div key={suggestion.id} className="card hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Link
                          to={`/suggestion/${suggestion.id}`}
                          className="text-xl font-semibold text-gray-900 hover:text-primary-600 transition-colors duration-200"
                        >
                          {suggestion.title}
                        </Link>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(suggestion.status)}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {t(`suggestion.status.${suggestion.status}`)}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {suggestion.description}
                      </p>
                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{format(suggestion.createdAt, 'MMM dd, yyyy')}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="font-medium">Category:</span>
                          <span className="capitalize">{t(`complaint.submit.categories.${suggestion.category}`)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageCircle className="w-4 h-4" />
                          <span>{suggestion.comments.length} comments</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-4">
                      {user && (
                        <button
                          onClick={() => handleSupport(suggestion.id)}
                          className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${
                            isSupported
                              ? 'bg-error-100 text-error-700 hover:bg-error-200'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${isSupported ? 'fill-current' : ''}`} />
                          <span>{isSupported ? 'Supported' : 'Support'}</span>
                          <span className="bg-white px-2 py-0.5 rounded-full text-xs">
                            {suggestion.supportCount}
                          </span>
                        </button>
                      )}
                      
                      {!user && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Heart className="w-4 h-4" />
                          <span>{suggestion.supportCount} supporters</span>
                        </div>
                      )}
                    </div>

                    <Link
                      to={`/suggestion/${suggestion.id}`}
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default SuggestionsPage