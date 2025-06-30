import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  Calendar,
  MapPin,
  User,
  MessageSquare
} from 'lucide-react'
import { useComplaints } from '../contexts/ComplaintContext'
import { useAuth } from '../contexts/AuthContext'
import { format } from 'date-fns'

const AuthorityDashboardPage: React.FC = () => {
  const { t } = useTranslation()
  const { complaints } = useComplaints()
  const { user } = useAuth()
  const [selectedTab, setSelectedTab] = useState('assigned')

  // Filter complaints assigned to this authority's department
  const assignedComplaints = complaints.filter(
    c => c.assignedDepartment === user?.department
  )

  const stats = {
    total: assignedComplaints.length,
    pending: assignedComplaints.filter(c => c.status === 'pending').length,
    inProgress: assignedComplaints.filter(c => c.status === 'inProgress').length,
    resolved: assignedComplaints.filter(c => c.status === 'resolved').length,
    escalated: assignedComplaints.filter(c => c.status === 'escalated').length
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
      case 'inProgress': return TrendingUp
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

  const filteredComplaints = selectedTab === 'assigned' 
    ? assignedComplaints
    : assignedComplaints.filter(c => c.status === selectedTab)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Authority Dashboard
          </h1>
          <p className="text-gray-600">
            Manage complaints assigned to {user?.department}
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Assigned</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <FileText className="w-8 h-8 text-primary-600" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-3xl font-bold text-warning-600">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-warning-600" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-3xl font-bold text-secondary-600">{stats.inProgress}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-secondary-600" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-3xl font-bold text-success-600">{stats.resolved}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-success-600" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Escalated</p>
                <p className="text-3xl font-bold text-error-600">{stats.escalated}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-error-600" />
            </div>
          </div>
        </div>

        {/* Complaints Management */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Assigned Complaints</h3>
            
            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setSelectedTab('assigned')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors duration-200 ${
                  selectedTab === 'assigned'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All ({stats.total})
              </button>
              <button
                onClick={() => setSelectedTab('pending')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors duration-200 ${
                  selectedTab === 'pending'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Pending ({stats.pending})
              </button>
              <button
                onClick={() => setSelectedTab('inProgress')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors duration-200 ${
                  selectedTab === 'inProgress'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                In Progress ({stats.inProgress})
              </button>
            </div>
          </div>

          {filteredComplaints.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No complaints found
              </h3>
              <p className="text-gray-600">
                {selectedTab === 'assigned' 
                  ? 'No complaints have been assigned to your department yet.'
                  : `No ${selectedTab} complaints found.`
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredComplaints.map((complaint) => {
                const StatusIcon = getStatusIcon(complaint.status)
                return (
                  <div key={complaint.id} className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors duration-200">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-medium text-gray-900">
                            {complaint.subject}
                          </h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {t(`complaint.status.${complaint.status}`)}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(complaint.priority)}`}>
                            {t(`complaint.submit.priorities.${complaint.priority}`)}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {complaint.description}
                        </p>
                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{format(complaint.submittedAt, 'MMM dd, yyyy')}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>{complaint.location}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="font-medium">ID:</span>
                            <span>{complaint.id}</span>
                          </div>
                          {complaint.assignedTo && (
                            <div className="flex items-center space-x-1">
                              <User className="w-4 h-4" />
                              <span>{complaint.assignedTo}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <button className="btn-outline text-sm">
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Update
                        </button>
                        <button className="btn-primary text-sm">
                          View Details
                        </button>
                      </div>
                    </div>

                    {/* Latest Update */}
                    {complaint.updates.length > 0 && (
                      <div className="border-t border-gray-200 pt-3">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${getStatusColor(complaint.updates[complaint.updates.length - 1].status)}`}>
                              {React.createElement(getStatusIcon(complaint.updates[complaint.updates.length - 1].status), { className: "w-3 h-3" })}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900">
                              {complaint.updates[complaint.updates.length - 1].message}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {format(complaint.updates[complaint.updates.length - 1].updatedAt, 'MMM dd, yyyy HH:mm')} by {complaint.updates[complaint.updates.length - 1].updatedBy}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AuthorityDashboardPage