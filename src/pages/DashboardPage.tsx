import React from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Plus,
  TrendingUp,
  Calendar,
  MapPin
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useComplaints } from '../contexts/ComplaintContext'
import { format } from 'date-fns'

const DashboardPage: React.FC = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { getComplaintsByUser } = useComplaints()

  const userComplaints = user ? getComplaintsByUser(user.id) : []
  
  const stats = {
    total: userComplaints.length,
    pending: userComplaints.filter(c => c.status === 'pending').length,
    inProgress: userComplaints.filter(c => c.status === 'inProgress').length,
    resolved: userComplaints.filter(c => c.status === 'resolved').length,
    escalated: userComplaints.filter(c => c.status === 'escalated').length
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'status-pending'
      case 'inProgress': return 'status-in-progress'
      case 'resolved': return 'status-resolved'
      case 'escalated': return 'status-escalated'
      default: return 'status-pending'
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('dashboard.welcome')}, {user?.firstName}!
          </h1>
          <p className="text-gray-600">
            Track and manage your grievances from your personal dashboard
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/submit-complaint"
              className="btn-primary flex items-center justify-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>{t('nav.submitComplaint')}</span>
            </Link>
            <Link
              to="/track"
              className="btn-outline flex items-center justify-center space-x-2"
            >
              <FileText className="w-5 h-5" />
              <span>{t('nav.trackComplaint')}</span>
            </Link>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('dashboard.totalComplaints')}</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <FileText className="w-8 h-8 text-primary-600" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('dashboard.pendingComplaints')}</p>
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
                <p className="text-sm font-medium text-gray-600">{t('dashboard.resolvedComplaints')}</p>
                <p className="text-3xl font-bold text-success-600">{stats.resolved}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-success-600" />
            </div>
          </div>
        </div>

        {/* Recent Complaints */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">{t('dashboard.myComplaints')}</h2>
            <Link to="/complaints" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              View All
            </Link>
          </div>

          {userComplaints.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No complaints yet</h3>
              <p className="text-gray-600 mb-6">
                You haven't submitted any complaints yet. Start by submitting your first grievance.
              </p>
              <Link to="/submit-complaint" className="btn-primary">
                Submit Your First Complaint
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {userComplaints.slice(0, 5).map((complaint) => {
                const StatusIcon = getStatusIcon(complaint.status)
                return (
                  <div key={complaint.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors duration-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">
                            {complaint.subject}
                          </h3>
                          <span className={`status-badge ${getStatusColor(complaint.status)}`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {t(`complaint.status.${complaint.status}`)}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {complaint.description}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
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
                        </div>
                      </div>
                      <Link
                        to={`/complaint/${complaint.id}`}
                        className="ml-4 text-primary-600 hover:text-primary-700 text-sm font-medium"
                      >
                        View Details
                      </Link>
                    </div>
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

export default DashboardPage