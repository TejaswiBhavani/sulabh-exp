import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Heart,
  MessageCircle,
  Send,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  TrendingUp,
  XCircle
} from 'lucide-react'
import { useSuggestions } from '../contexts/SuggestionContext'
import { useAuth } from '../contexts/AuthContext'
import { format } from 'date-fns'
import { SuggestionStatus } from '../types'

const commentSchema = z.object({
  comment: z.string().min(10, 'Comment must be at least 10 characters')
})

type CommentFormData = z.infer<typeof commentSchema>

const SuggestionDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { 
    getSuggestion, 
    supportSuggestion, 
    unsupportSuggestion, 
    addComment, 
    updateComment, 
    deleteComment,
    loading 
  } = useSuggestions()

  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editCommentText, setEditCommentText] = useState('')

  const suggestion = id ? getSuggestion(id) : null

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema)
  })

  if (!suggestion) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Suggestion Not Found</h2>
            <p className="text-gray-600 mb-6">
              The suggestion you're looking for doesn't exist or has been removed.
            </p>
            <button
              onClick={() => navigate('/suggestions')}
              className="btn-primary"
            >
              Back to Suggestions
            </button>
          </div>
        </div>
      </div>
    )
  }

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

  const isSupported = user ? suggestion.supports.some(s => s.userId === user.id) : false

  const handleSupport = async () => {
    if (!user) return
    
    try {
      if (isSupported) {
        await unsupportSuggestion(suggestion.id)
      } else {
        await supportSuggestion(suggestion.id)
      }
    } catch (error) {
      console.error('Error handling support:', error)
    }
  }

  const onSubmitComment = async (data: CommentFormData) => {
    if (!user) return

    try {
      await addComment(suggestion.id, data.comment)
      reset()
    } catch (error) {
      console.error('Error adding comment:', error)
    }
  }

  const handleEditComment = (commentId: string, currentText: string) => {
    setEditingCommentId(commentId)
    setEditCommentText(currentText)
  }

  const handleUpdateComment = async (commentId: string) => {
    try {
      await updateComment(commentId, editCommentText)
      setEditingCommentId(null)
      setEditCommentText('')
    } catch (error) {
      console.error('Error updating comment:', error)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        await deleteComment(commentId)
      } catch (error) {
        console.error('Error deleting comment:', error)
      }
    }
  }

  const StatusIcon = getStatusIcon(suggestion.status)

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
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {suggestion.title}
              </h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{format(suggestion.createdAt, 'PPP')}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="font-medium">Category:</span>
                  <span className="capitalize">{t(`complaint.submit.categories.${suggestion.category}`)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3 ml-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(suggestion.status)}`}>
                <StatusIcon className="w-4 h-4 mr-1" />
                {t(`suggestion.status.${suggestion.status}`)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Suggestion Details */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {suggestion.description}
                </p>
              </div>
            </div>

            {/* Support Section */}
            <div className="card">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{suggestion.supportCount}</div>
                    <div className="text-sm text-gray-600">Supporters</div>
                  </div>
                  {user && (
                    <button
                      onClick={handleSupport}
                      disabled={loading}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                        isSupported
                          ? 'bg-error-100 text-error-700 hover:bg-error-200'
                          : 'bg-primary-600 text-white hover:bg-primary-700'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${isSupported ? 'fill-current' : ''}`} />
                      <span>{isSupported ? 'Remove Support' : 'Support This Idea'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Comments ({suggestion.comments.length})
              </h2>

              {/* Add Comment Form */}
              {user && (
                <form onSubmit={handleSubmit(onSubmitComment)} className="mb-6">
                  <div className="space-y-3">
                    <textarea
                      {...register('comment')}
                      rows={3}
                      className="input-field resize-none"
                      placeholder="Share your thoughts on this suggestion..."
                    />
                    {errors.comment && (
                      <p className="text-sm text-error-600">{errors.comment.message}</p>
                    )}
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary flex items-center space-x-2"
                      >
                        <Send className="w-4 h-4" />
                        <span>Post Comment</span>
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Comments List */}
              <div className="space-y-4">
                {suggestion.comments.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No comments yet. Be the first to share your thoughts!</p>
                  </div>
                ) : (
                  suggestion.comments.map((comment) => (
                    <div key={comment.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <User className="w-5 h-5 text-gray-400" />
                          <span className="font-medium text-gray-900">
                            {comment.user ? `${comment.user.firstName} ${comment.user.lastName}` : 'Anonymous'}
                          </span>
                          <span className="text-sm text-gray-500">
                            {format(comment.createdAt, 'MMM dd, yyyy HH:mm')}
                          </span>
                        </div>
                        {user && user.id === comment.userId && (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEditComment(comment.id, comment.comment)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-gray-400 hover:text-error-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {editingCommentId === comment.id ? (
                        <div className="space-y-3">
                          <textarea
                            value={editCommentText}
                            onChange={(e) => setEditCommentText(e.target.value)}
                            rows={3}
                            className="input-field resize-none"
                          />
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleUpdateComment(comment.id)}
                              className="btn-primary text-sm"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingCommentId(null)}
                              className="btn-outline text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-700">{comment.comment}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Suggestion Info</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(suggestion.status)}`}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {t(`suggestion.status.${suggestion.status}`)}
                  </span>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Category</p>
                  <p className="font-medium capitalize">{t(`complaint.submit.categories.${suggestion.category}`)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Submitted</p>
                  <p className="font-medium">{format(suggestion.createdAt, 'PPP')}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Last Updated</p>
                  <p className="font-medium">{format(suggestion.updatedAt, 'PPP')}</p>
                </div>
              </div>
            </div>

            {/* Engagement Stats */}
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Engagement</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Heart className="w-5 h-5 text-error-500" />
                    <span className="text-sm text-gray-600">Supporters</span>
                  </div>
                  <span className="font-medium">{suggestion.supportCount}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="w-5 h-5 text-secondary-500" />
                    <span className="text-sm text-gray-600">Comments</span>
                  </div>
                  <span className="font-medium">{suggestion.comments.length}</span>
                </div>
              </div>
            </div>

            {/* Help Section */}
            <div className="card bg-primary-50 border-primary-200">
              <h3 className="text-lg font-medium text-primary-900 mb-2">How It Works</h3>
              <div className="text-sm text-primary-700 space-y-2">
                <p>• <strong>Support:</strong> Show your backing for this idea</p>
                <p>• <strong>Comment:</strong> Share your thoughts and feedback</p>
                <p>• <strong>Review:</strong> Authorities evaluate popular suggestions</p>
                <p>• <strong>Implementation:</strong> Approved ideas become reality</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SuggestionDetailsPage