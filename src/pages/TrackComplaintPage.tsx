import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, FileText, Clock, CheckCircle, AlertTriangle, MapPin, Calendar, User } from 'lucide-react'
import { useComplaints } from '../contexts/ComplaintContext'
import { Complaint } from '../types'
import { format } from 'date-fns'

const TrackComplaintPage: React.FC = () => {
  const { t } = useTranslation()
  const { trackComplaint, loading } = useComplaints()
  const [complaintId, setComplaintId] = useState('')
  const [complaint, setComplaint] = useState<Complaint | null>(null)
  const [error, setError] = useState('')

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!complaintId.trim()) {
      setError('Please enter a complaint ID')
      return
    }

    try {
      setError('')
      const result = await trackComplaint(complaintId.trim())
      if (result) {
        setComplaint(result)
      } else {
        setError('Complaint not found. Please check the ID and try again.')
        setComplaint(null)
      }
    } catch (err) {
      setError('Failed to track complaint. Please try again.')
      setComplaint(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-warning-600 bg-warning-100'
      case 'inProgress': return 'text-secondary-600 bg-secondary-100'
      case 'resolved': return 'text-success-600 bg-success-100'
      case 'escalated': return 'text-error-600 bg-error-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock
      case 'inProgress': return FileText
      case 'resolved': return CheckCircle
      case 'escalated': return AlertTriangle
      default: return Clock
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'text-success-600 bg-success-100'
      case 'medium': return 'text-warning-600 bg-warning-100'
      case 'high': return 'text-error-600 bg-error-100'
      case 'urgent': return 'text-error-800 bg-error-200'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('complaint.track.title')}
          </h1>
          <p className="text-gray-600">
            Enter your complaint ID to check the current status and updates
          </p>
        </div>

        {/* Search Form */}
        <div className="card mb-8">
          <form onSubmit={handleTrack} className="space-y-4">
            <div>
              <label htmlFor="complaintId" className="block text-sm font-medium text-gray-700 mb-2">
                {t('complaint.track.enterComplaintId')}
              </label>
              <div className="flex space-x-4">
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FileText className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="complaintId"
                    value={complaintId}
                    onChange={(e) => setComplaintId(e.target.value)}
                    className="input-field pl-10"
                    placeholder="Enter complaint ID (e.g., CMP001)"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex items-center space-x-2"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Search className="w-5 h-5" />
                      <span>{t('complaint.track.trackButton')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {error && (
            <div className="mt-4 bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
        </div>

        {/* Complaint Details */}
        {complaint && (
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="card">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {complaint.subject}
                  </h2>
                  <p className="text-gray-600">
                    Complaint ID: <span className="font-medium">{complaint.id}</span>
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(complaint.status)}`}>
                    {React.createElement(getStatusIcon(complaint.status), { className: "w-4 h-4 mr-1" })}
                    {t(`complaint.status.${complaint.status}`)}
                  </span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(complaint.priority)}`}>
                    {t(`complaint.submit.priorities.${complaint.priority}`)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">{t('complaint.track.submittedOn')}</p>
                    <p className="font-medium">{format(complaint.submittedAt, 'PPP')}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">{t('complaint.track.lastUpdated')}</p>
                    <p className="font-medium">{format(complaint.updatedAt, 'PPP')}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="font-medium">{complaint.location}</p>
                  </div>
                </div>

                {complaint.assignedTo && (
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">{t('complaint.track.assignedTo')}</p>
                      <p className="font-medium">{complaint.assignedTo}</p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
                <p className="text-gray-700 leading-relaxed">{complaint.description}</p>
              </div>

              {complaint.assignedDepartment && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Assigned to: <span className="font-medium text-gray-900">{complaint.assignedDepartment}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Status Updates */}
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Status Updates</h3>
              <div className="space-y-4">
                {complaint.updates.map((update) => {
                  const StatusIcon = getStatusIcon(update.status)
                  return (
                    <div key={update.id} className="flex items-start space-x-4">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getStatusColor(update.status)}`}>
                        <StatusIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            {update.message}
                          </p>
                          <p className="text-sm text-gray-500">
                            {format(update.updatedAt, 'PPp')}
                          </p>
                        </div>
                        <p className="text-sm text-gray-600">
                          Updated by: {update.updatedBy}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Feedback Section */}
            {complaint.status === 'resolved' && complaint.feedback && (
              <div className="card">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Your Feedback</h3>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-sm text-gray-600">Rating:</span>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <CheckCircle
                        key={star}
                        className={`w-5 h-5 ${
                          star <= complaint.feedback!.rating
                            ? 'text-warning-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium">
                    {complaint.feedback.rating}/5
                  </span>
                </div>
                {complaint.feedback.comment && (
                  <p className="text-gray-700 mt-2">{complaint.feedback.comment}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Help Section */}
        <div className="mt-12 card bg-primary-50 border-primary-200">
          <h3 className="text-lg font-medium text-primary-900 mb-2">Need Help?</h3>
          <p className="text-primary-700 mb-4">
            If you have any questions about your complaint or need additional assistance, please contact us:
          </p>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-6 text-sm text-primary-700">
            <div>
              <strong>Email:</strong> support@sulabh.gov.in
            </div>
            <div>
              <strong>Phone:</strong> 1800-123-4567
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TrackComplaintPage