import React, { useState, useEffect } from 'react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line,
  ResponsiveContainer
} from 'recharts'
import { 
  FileText, 
  Download, 
  TrendingUp, 
  AlertTriangle,
  Users,
  Clock,
  Star,
  Filter,
  RefreshCw
} from 'lucide-react'
import { useReports, ReportData } from '../contexts/ReportsContext'
import { useAuth } from '../contexts/AuthContext'

const ReportsPage: React.FC = () => {
  const { user } = useAuth()
  const { 
    generateDashboardReport, 
    generateEscalationReport, 
    generateComplaintReport,
    generateFeedbackSummary,
    generateUserActivityReport,
    exportReport,
    loading 
  } = useReports()

  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month')
  const [selectedReport, setSelectedReport] = useState('dashboard')
  const [escalationData, setEscalationData] = useState<any[]>([])
  const [complaintData, setComplaintData] = useState<any[]>([])
  const [feedbackData, setFeedbackData] = useState<any>(null)
  const [userActivityData, setUserActivityData] = useState<any>(null)

  // Filters for complaint report
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    category: '',
    department: '',
    status: ''
  })

  useEffect(() => {
    loadReports()
  }, [selectedPeriod])

  const loadReports = async () => {
    try {
      const dashboard = await generateDashboardReport(selectedPeriod)
      setReportData(dashboard)

      if (selectedReport === 'escalation') {
        const escalation = await generateEscalationReport()
        setEscalationData(escalation)
      } else if (selectedReport === 'complaints') {
        const complaints = await generateComplaintReport(filters)
        setComplaintData(complaints)
      } else if (selectedReport === 'feedback') {
        const feedback = await generateFeedbackSummary()
        setFeedbackData(feedback)
      } else if (selectedReport === 'users') {
        const userActivity = await generateUserActivityReport()
        setUserActivityData(userActivity)
      }
    } catch (error) {
      console.error('Error loading reports:', error)
    }
  }

  const handleReportChange = async (reportType: string) => {
    setSelectedReport(reportType)
    
    try {
      switch (reportType) {
        case 'escalation':
          const escalation = await generateEscalationReport()
          setEscalationData(escalation)
          break
        case 'complaints':
          const complaints = await generateComplaintReport(filters)
          setComplaintData(complaints)
          break
        case 'feedback':
          const feedback = await generateFeedbackSummary()
          setFeedbackData(feedback)
          break
        case 'users':
          const userActivity = await generateUserActivityReport()
          setUserActivityData(userActivity)
          break
      }
    } catch (error) {
      console.error('Error loading report:', error)
    }
  }

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      let data
      switch (selectedReport) {
        case 'escalation':
          data = escalationData
          break
        case 'complaints':
          data = complaintData
          break
        case 'feedback':
          data = feedbackData
          break
        case 'users':
          data = userActivityData
          break
        default:
          data = reportData
      }
      
      await exportReport(selectedReport, data, format)
    } catch (error) {
      console.error('Error exporting report:', error)
    }
  }

  const COLORS = ['#ea580c', '#0284c7', '#16a34a', '#dc2626', '#7c3aed', '#059669']

  if (!reportData && loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading reports...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Reports & Analytics
              </h1>
              <p className="text-gray-600">
                Comprehensive reporting and analytics for the SULABH system
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as any)}
                className="input-field"
              >
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="quarter">Last Quarter</option>
                <option value="year">Last Year</option>
              </select>
              <button
                onClick={() => loadReports()}
                disabled={loading}
                className="btn-outline flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Report Type Selector */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart },
              { id: 'escalation', label: 'Escalation Report', icon: AlertTriangle },
              { id: 'complaints', label: 'Complaint Report', icon: FileText },
              { id: 'feedback', label: 'Feedback Summary', icon: Star },
              ...(user?.role === 'admin' ? [{ id: 'users', label: 'User Activity', icon: Users }] : [])
            ].map((report) => (
              <button
                key={report.id}
                onClick={() => handleReportChange(report.id)}
                className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  selectedReport === report.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <report.icon className="w-4 h-4" />
                <span>{report.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Export Actions */}
        <div className="mb-6 flex justify-end space-x-2">
          <button
            onClick={() => handleExport('csv')}
            className="btn-outline flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="btn-outline flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export PDF</span>
          </button>
        </div>

        {/* Dashboard Report */}
        {selectedReport === 'dashboard' && reportData && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Complaints</p>
                    <p className="text-3xl font-bold text-gray-900">{reportData.totalComplaints}</p>
                  </div>
                  <FileText className="w-8 h-8 text-primary-600" />
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Resolution Rate</p>
                    <p className="text-3xl font-bold text-success-600">{reportData.resolutionRate.toFixed(1)}%</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-success-600" />
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg. Resolution Time</p>
                    <p className="text-3xl font-bold text-secondary-600">{reportData.averageResolutionTime.toFixed(1)} days</p>
                  </div>
                  <Clock className="w-8 h-8 text-secondary-600" />
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Satisfaction Score</p>
                    <p className="text-3xl font-bold text-warning-600">{reportData.satisfactionScore.toFixed(1)}/5</p>
                  </div>
                  <Star className="w-8 h-8 text-warning-600" />
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Status Distribution */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Complaint Status Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Pending', value: reportData.pendingComplaints },
                        { name: 'In Progress', value: reportData.inProgressComplaints },
                        { name: 'Resolved', value: reportData.resolvedComplaints },
                        { name: 'Escalated', value: reportData.escalatedComplaints }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        { name: 'Pending', value: reportData.pendingComplaints },
                        { name: 'In Progress', value: reportData.inProgressComplaints },
                        { name: 'Resolved', value: reportData.resolvedComplaints },
                        { name: 'Escalated', value: reportData.escalatedComplaints }
                      ].map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Category Breakdown */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Complaints by Category</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={Object.entries(reportData.complaintsByCategory).map(([key, value]) => ({ category: key, count: value }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#ea580c" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Trends */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trends</h3>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={reportData.monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="submitted" stroke="#ea580c" strokeWidth={2} />
                  <Line type="monotone" dataKey="resolved" stroke="#16a34a" strokeWidth={2} />
                  <Line type="monotone" dataKey="pending" stroke="#dc2626" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Department Performance (Admin only) */}
            {user?.role === 'admin' && reportData.departmentPerformance.length > 0 && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Performance</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Department
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Assigned
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Resolved
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pending
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Avg. Resolution Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Satisfaction Score
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.departmentPerformance.map((dept, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {dept.department}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {dept.totalAssigned}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {dept.resolved}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {dept.pending}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {dept.averageResolutionTime.toFixed(1)} days
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {dept.satisfactionScore.toFixed(1)}/5
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Escalation Report */}
        {selectedReport === 'escalation' && (
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Escalation Report</h3>
            {escalationData.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No complaints require escalation at this time.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Complaint ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subject
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Days Pending
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Escalation Reason
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {escalationData.map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.complaintId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.subject}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            item.priority === 'urgent' ? 'bg-error-100 text-error-800' :
                            item.priority === 'high' ? 'bg-error-100 text-error-800' :
                            item.priority === 'medium' ? 'bg-warning-100 text-warning-800' :
                            'bg-success-100 text-success-800'
                          }`}>
                            {item.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.daysPending}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.assignedDepartment}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.escalationReason}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Complaint Report */}
        {selectedReport === 'complaints' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    className="input-field"
                  >
                    <option value="">All Categories</option>
                    <option value="sanitation">Sanitation</option>
                    <option value="infrastructure">Infrastructure</option>
                    <option value="publicServices">Public Services</option>
                    <option value="utilities">Utilities</option>
                    <option value="transportation">Transportation</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="input-field"
                  >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="inProgress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="escalated">Escalated</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => handleReportChange('complaints')}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <Filter className="w-4 h-4" />
                    <span>Apply Filters</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Complaint Table */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Complaint Details</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subject
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Submitted
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Resolution Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {complaintData.map((complaint, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {complaint.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {complaint.subject}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {complaint.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            complaint.status === 'resolved' ? 'bg-success-100 text-success-800' :
                            complaint.status === 'inProgress' ? 'bg-secondary-100 text-secondary-800' :
                            complaint.status === 'pending' ? 'bg-warning-100 text-warning-800' :
                            'bg-error-100 text-error-800'
                          }`}>
                            {complaint.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(complaint.submittedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {complaint.assignedDepartment}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {complaint.resolutionTime ? `${complaint.resolutionTime} days` : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Feedback Summary */}
        {selectedReport === 'feedback' && feedbackData && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">Total Feedbacks</p>
                  <p className="text-3xl font-bold text-gray-900">{feedbackData.totalFeedbacks}</p>
                </div>
              </div>
              <div className="card">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">Average Rating</p>
                  <p className="text-3xl font-bold text-warning-600">{feedbackData.averageRating.toFixed(1)}/5</p>
                </div>
              </div>
              <div className="card">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">Satisfaction Rate</p>
                  <p className="text-3xl font-bold text-success-600">
                    {feedbackData.totalFeedbacks > 0 
                      ? ((Object.entries(feedbackData.ratingDistribution)
                          .filter(([rating]) => parseInt(rating) >= 4)
                          .reduce((acc, [, count]) => acc + (count as number), 0) / feedbackData.totalFeedbacks) * 100).toFixed(1)
                      : 0}%
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Rating Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={Object.entries(feedbackData.ratingDistribution).map(([rating, count]) => ({ rating: `${rating} Star`, count }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="rating" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Feedback by Category</h3>
                <div className="space-y-3">
                  {Object.entries(feedbackData.feedbackByCategory).map(([category, data]: [string, any]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 capitalize">{category}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">
                          {data.averageRating.toFixed(1)}/5
                        </span>
                        <span className="text-xs text-gray-500">({data.total} reviews)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Activity Report */}
        {selectedReport === 'users' && userActivityData && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900">{userActivityData.totalUsers}</p>
                </div>
              </div>
              <div className="card">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">New Users This Month</p>
                  <p className="text-3xl font-bold text-success-600">{userActivityData.newUsersThisMonth}</p>
                </div>
              </div>
              <div className="card">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">Growth Rate</p>
                  <p className="text-3xl font-bold text-secondary-600">
                    {userActivityData.totalUsers > 0 
                      ? ((userActivityData.newUsersThisMonth / userActivityData.totalUsers) * 100).toFixed(1)
                      : 0}%
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Users by Role</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={Object.entries(userActivityData.usersByRole).map(([role, count]) => ({ name: role, value: count }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {Object.entries(userActivityData.usersByRole).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Users by Department</h3>
                <div className="space-y-3">
                  {Object.entries(userActivityData.usersByDepartment).map(([department, count]) => (
                    <div key={department} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{department}</span>
                      <span className="text-sm font-medium text-gray-900">{count as number}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ReportsPage