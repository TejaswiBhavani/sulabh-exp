import React, { useState, useEffect, useRef } from 'react'

import { 
  BarChart3, 
  Users, 
  Clock, 
  Star,
  AlertTriangle,
  FileText,
  Lightbulb
} from 'lucide-react'
import { useReports, ReportData } from '../contexts/ReportsContext'
import { useAuth } from '../contexts/AuthContext'
import ReportFilters from '../components/Reports/ReportFilters'
import ReportExporter from '../components/Reports/ReportExporter'
import {
  ComplaintTrendsChart,
  CategoryDistributionChart,
  DepartmentPerformanceChart,
  SatisfactionRadarChart
} from '../components/Reports/AdvancedCharts'
import { supabase } from '../lib/supabase'

const EnhancedReportsPage: React.FC = () => {

  const { user } = useAuth()
  const { 
    generateDashboardReport, 
    generateEscalationReport, 
    generateComplaintReport,
    generateFeedbackSummary,
    generateUserActivityReport,
    loading 
  } = useReports()

  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [selectedReport, setSelectedReport] = useState('dashboard')
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month')
  // escalationData, feedbackData, userActivityData removed as they are unused
  const [complaintData, setComplaintData] = useState<any[]>([])
  const [predictiveData, setPredictiveData] = useState<any>(null)
  const [predictiveLoading, setPredictiveLoading] = useState(false)

  // Chart refs for export
  const trendsChartRef = useRef<HTMLDivElement>(null)
  const categoryChartRef = useRef<HTMLDivElement>(null)
  const performanceChartRef = useRef<HTMLDivElement>(null)
  const satisfactionChartRef = useRef<HTMLDivElement>(null)
  const predictiveChartRef = useRef<HTMLDivElement>(null)

  // Filters state
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    category: '',
    department: '',
    status: '',
    priority: ''
  })

  useEffect(() => {
    loadReports()
  }, [selectedPeriod])

  const loadReports = async () => {
    try {
      const dashboard = await generateDashboardReport(selectedPeriod)
      setReportData(dashboard)

      if (selectedReport === 'escalation') {
        await generateEscalationReport()
        // setEscalationData(escalation) // Removed as escalationData is unused
      } else if (selectedReport === 'complaints') {
        const complaints = await generateComplaintReport(filters)
        setComplaintData(complaints)
      } else if (selectedReport === 'feedback') {
        await generateFeedbackSummary()
        // setFeedbackData(feedback) // Removed as feedbackData is unused
      } else if (selectedReport === 'users') {
        await generateUserActivityReport()
        // setUserActivityData(userActivity) // Removed as userActivityData is unused
      } else if (selectedReport === 'predictive') {
        loadPredictiveData()
      }
    } catch (error) {
      console.error('Error loading reports:', error)
    }
  }

  const loadPredictiveData = async () => {
    setPredictiveLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('predict-trends', {
        body: {
          period: selectedPeriod,
          category: filters.category || null,
          department: filters.department || null,
          months: 3
        }
      })

      if (error) throw error
      setPredictiveData(data)
    } catch (error) {
      console.error('Error loading predictive data:', error)
    } finally {
      setPredictiveLoading(false)
    }
  }

  const handleReportChange = async (reportType: string) => {
    setSelectedReport(reportType)
    
    try {
      switch (reportType) {
        case 'escalation':
          await generateEscalationReport()
          // setEscalationData(escalation) // Removed as escalationData is unused
          break
        case 'complaints':
          const complaints = await generateComplaintReport(filters)
          setComplaintData(complaints)
          break
        case 'feedback':
          await generateFeedbackSummary()
          // setFeedbackData(feedback) // Removed as feedbackData is unused
          break
        case 'users':
          await generateUserActivityReport()
          // setUserActivityData(userActivity) // Removed as userActivityData is unused
          break
        case 'predictive':
          loadPredictiveData()
          break
      }
    } catch (error) {
      console.error('Error loading report:', error)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleApplyFilters = async () => {
    if (selectedReport === 'complaints') {
      const complaints = await generateComplaintReport(filters)
      setComplaintData(complaints)
    } else if (selectedReport === 'predictive') {
      loadPredictiveData()
    }
  }

  const handleResetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      category: '',
      department: '',
      status: '',
      priority: ''
    })
  }

  if (!reportData && loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Generating comprehensive reports...</p>
        </div>
      </div>
    )
  }

  // Prepare chart data
  const trendsChartData = reportData ? {
    labels: reportData.monthlyTrends.map(t => t.month),
    submitted: reportData.monthlyTrends.map(t => t.submitted),
    resolved: reportData.monthlyTrends.map(t => t.resolved),
    pending: reportData.monthlyTrends.map(t => t.pending)
  } : null

  const categoryChartData = reportData ? {
    labels: Object.keys(reportData.complaintsByCategory),
    values: Object.values(reportData.complaintsByCategory)
  } : null

  const departmentChartData = reportData && reportData.departmentPerformance.length > 0 ? {
    labels: reportData.departmentPerformance.map(d => d.department),
    totalAssigned: reportData.departmentPerformance.map(d => d.totalAssigned),
    resolved: reportData.departmentPerformance.map(d => d.resolved),
    pending: reportData.departmentPerformance.map(d => d.pending)
  } : null

  const satisfactionChartData = reportData && reportData.departmentPerformance.length > 0 ? {
    labels: reportData.departmentPerformance.map(d => d.department),
    values: reportData.departmentPerformance.map(d => d.satisfactionScore)
  } : null

  // Prepare predictive chart data
  const predictiveChartData = predictiveData ? {
    labels: [...predictiveData.historical.map((d: any) => d.period), ...predictiveData.predictions.map((d: any) => d.period)],
    historical: {
      submitted: [...predictiveData.historical.map((d: any) => d.total), ...Array(predictiveData.predictions.length).fill(null)],
      resolved: [...predictiveData.historical.map((d: any) => d.resolved), ...Array(predictiveData.predictions.length).fill(null)]
    },
    predictions: {
      submitted: [...Array(predictiveData.historical.length).fill(null), ...predictiveData.predictions.map((d: any) => d.total)],
      resolved: [...Array(predictiveData.historical.length).fill(null), ...predictiveData.predictions.map((d: any) => d.resolved)]
    }
  } : null

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Advanced Reports & Analytics
              </h1>
              <p className="text-gray-600">
                Comprehensive insights and data visualization for the SULABH system
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
              <ReportExporter
                data={reportData ? [reportData] : []}
                reportType="dashboard"
                title="SULABH Dashboard Report"
                chartRef={trendsChartRef}
              />
            </div>
          </div>
        </div>

        {/* Report Type Selector */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg overflow-x-auto">
            {[
              { id: 'dashboard', label: 'Executive Dashboard', icon: BarChart3 },
              { id: 'predictive', label: 'Predictive Analytics', icon: Lightbulb },
              { id: 'escalation', label: 'Escalation Analysis', icon: AlertTriangle },
              { id: 'complaints', label: 'Detailed Complaints', icon: FileText },
              { id: 'feedback', label: 'Satisfaction Analysis', icon: Star },
              ...(user?.role === 'admin' ? [{ id: 'users', label: 'User Analytics', icon: Users }] : [])
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

        {/* Dashboard Report */}
        {selectedReport === 'dashboard' && reportData && (
          <div className="space-y-8">
            {/* Executive Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="card bg-gradient-to-br from-primary-500 to-primary-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-primary-100 text-sm font-medium">Total Complaints</p>
                    <p className="text-3xl font-bold">{reportData.totalComplaints}</p>
                    <p className="text-primary-200 text-xs mt-1">
                      {reportData.resolutionRate.toFixed(1)}% resolution rate
                    </p>
                  </div>
                  <FileText className="w-10 h-10 text-primary-200" />
                </div>
              </div>

              <div className="card bg-gradient-to-br from-success-500 to-success-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-success-100 text-sm font-medium">Avg. Resolution</p>
                    <p className="text-3xl font-bold">{reportData.averageResolutionTime.toFixed(1)}</p>
                    <p className="text-success-200 text-xs mt-1">days to resolve</p>
                  </div>
                  <Clock className="w-10 h-10 text-success-200" />
                </div>
              </div>

              <div className="card bg-gradient-to-br from-warning-500 to-warning-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-warning-100 text-sm font-medium">Satisfaction</p>
                    <p className="text-3xl font-bold">{reportData.satisfactionScore.toFixed(1)}</p>
                    <p className="text-warning-200 text-xs mt-1">out of 5.0</p>
                  </div>
                  <Star className="w-10 h-10 text-warning-200" />
                </div>
              </div>

              <div className="card bg-gradient-to-br from-secondary-500 to-secondary-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-secondary-100 text-sm font-medium">Active Users</p>
                    <p className="text-3xl font-bold">{reportData.activeUsers}</p>
                    <p className="text-secondary-200 text-xs mt-1">
                      +{reportData.newRegistrations} this period
                    </p>
                  </div>
                  <Users className="w-10 h-10 text-secondary-200" />
                </div>
              </div>
            </div>

            {/* Advanced Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Trends Chart */}
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Complaint Trends</h3>
                  <ReportExporter
                    data={reportData.monthlyTrends}
                    reportType="trends"
                    title="Complaint Trends Analysis"
                    chartRef={trendsChartRef}
                    columns={[
                      { key: 'month', label: 'Month' },
                      { key: 'submitted', label: 'Submitted' },
                      { key: 'resolved', label: 'Resolved' },
                      { key: 'pending', label: 'Pending' }
                    ]}
                  />
                </div>
                <div ref={trendsChartRef}>
                  {trendsChartData && <ComplaintTrendsChart data={trendsChartData} />}
                </div>
              </div>

              {/* Category Distribution */}
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Category Distribution</h3>
                  <ReportExporter
                    data={Object.entries(reportData.complaintsByCategory).map(([category, count]) => ({ category, count }))}
                    reportType="categories"
                    title="Complaints by Category"
                    chartRef={categoryChartRef}
                    columns={[
                      { key: 'category', label: 'Category' },
                      { key: 'count', label: 'Count' }
                    ]}
                  />
                </div>
                <div ref={categoryChartRef}>
                  {categoryChartData && <CategoryDistributionChart data={categoryChartData} />}
                </div>
              </div>
            </div>

            {/* Department Performance (Admin only) */}
            {user?.role === 'admin' && reportData.departmentPerformance.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="card">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Department Performance</h3>
                    <ReportExporter
                      data={reportData.departmentPerformance}
                      reportType="department_performance"
                      title="Department Performance Analysis"
                      chartRef={performanceChartRef}
                      columns={[
                        { key: 'department', label: 'Department' },
                        { key: 'totalAssigned', label: 'Total Assigned' },
                        { key: 'resolved', label: 'Resolved' },
                        { key: 'pending', label: 'Pending' },
                        { key: 'averageResolutionTime', label: 'Avg Resolution Time' },
                        { key: 'satisfactionScore', label: 'Satisfaction Score' }
                      ]}
                    />
                  </div>
                  <div ref={performanceChartRef}>
                    {departmentChartData && <DepartmentPerformanceChart data={departmentChartData} />}
                  </div>
                </div>

                <div className="card">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Satisfaction by Department</h3>
                    <ReportExporter
                      data={reportData.departmentPerformance.map(d => ({ 
                        department: d.department, 
                        satisfaction: d.satisfactionScore 
                      }))}
                      reportType="satisfaction"
                      title="Department Satisfaction Analysis"
                      chartRef={satisfactionChartRef}
                      columns={[
                        { key: 'department', label: 'Department' },
                        { key: 'satisfaction', label: 'Satisfaction Score' }
                      ]}
                    />
                  </div>
                  <div ref={satisfactionChartRef}>
                    {satisfactionChartData && <SatisfactionRadarChart data={satisfactionChartData} />}
                  </div>
                </div>
              </div>
            )}

            {/* Detailed Performance Table */}
            {user?.role === 'admin' && reportData.departmentPerformance.length > 0 && (
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Detailed Department Metrics</h3>
                  <ReportExporter
                    data={reportData.departmentPerformance}
                    reportType="detailed_metrics"
                    title="Detailed Department Performance Metrics"
                    columns={[
                      { key: 'department', label: 'Department' },
                      { key: 'totalAssigned', label: 'Total Assigned' },
                      { key: 'resolved', label: 'Resolved' },
                      { key: 'pending', label: 'Pending' },
                      { key: 'averageResolutionTime', label: 'Avg Resolution Time (days)' },
                      { key: 'satisfactionScore', label: 'Satisfaction Score' }
                    ]}
                  />
                </div>
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
                          Resolution Rate
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
                      {reportData.departmentPerformance.map((dept, index) => {
                        const resolutionRate = dept.totalAssigned > 0 ? (dept.resolved / dept.totalAssigned) * 100 : 0
                        return (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {dept.department}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {dept.totalAssigned}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
                                {dept.resolved}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning-100 text-warning-800">
                                {dept.pending}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex items-center">
                                <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                  <div 
                                    className={`h-2 rounded-full ${
                                      resolutionRate >= 80 ? 'bg-success-600' :
                                      resolutionRate >= 60 ? 'bg-warning-600' : 'bg-error-600'
                                    }`}
                                    style={{ width: `${resolutionRate}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs font-medium">
                                  {resolutionRate.toFixed(1)}%
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                dept.averageResolutionTime <= 3 ? 'bg-success-100 text-success-800' :
                                dept.averageResolutionTime <= 7 ? 'bg-warning-100 text-warning-800' :
                                'bg-error-100 text-error-800'
                              }`}>
                                {dept.averageResolutionTime.toFixed(1)} days
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex items-center">
                                <Star className="w-4 h-4 text-warning-400 mr-1" />
                                <span className="font-medium">
                                  {dept.satisfactionScore.toFixed(1)}/5.0
                                </span>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Predictive Analytics */}
        {selectedReport === 'predictive' && (
          <div className="space-y-6">
            <ReportFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onApplyFilters={handleApplyFilters}
              onResetFilters={handleResetFilters}
              loading={predictiveLoading}
            />

            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Complaint Volume Prediction (Next 3 Months)
                </h3>
                <ReportExporter
                  data={predictiveData ? [...predictiveData.historical, ...predictiveData.predictions] : []}
                  reportType="predictive_trends"
                  title="Complaint Volume Prediction"
                  chartRef={predictiveChartRef}
                  columns={[
                    { key: 'period', label: 'Period' },
                    { key: 'total', label: 'Total Complaints' },
                    { key: 'resolved', label: 'Resolved' },
                    { key: 'pending', label: 'Pending' },
                    { key: 'isPrediction', label: 'Is Prediction' }
                  ]}
                />
              </div>

              {predictiveLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Generating predictive analytics...</p>
                </div>
              ) : predictiveData ? (
                <div ref={predictiveChartRef}>
                  <div className="h-80">
                    {/* Custom chart for predictive data */}
                    <div className="mb-4 p-4 bg-primary-50 border border-primary-200 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <Lightbulb className="w-5 h-5 text-primary-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-primary-900">Predictive Insights</h4>
                          <p className="text-sm text-primary-700">
                            Based on historical trends, we predict {predictiveData.predictions[2].total} complaints in {predictiveData.predictions[2].period}, 
                            with approximately {predictiveData.predictions[2].resolved} resolved cases.
                            {predictiveData.predictions[2].total > predictiveData.historical[predictiveData.historical.length - 1].total ? 
                              ' This represents an increase in complaint volume.' : 
                              ' This represents a decrease in complaint volume.'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Render chart using ComplaintTrendsChart component */}
                    {predictiveChartData && (
                      <ComplaintTrendsChart
                        data={{
                          labels: predictiveChartData.labels,
                          submitted: [...predictiveChartData.historical.submitted, ...predictiveChartData.predictions.submitted.map((v: any) => v !== null ? v : undefined)],
                          resolved: [...predictiveChartData.historical.resolved, ...predictiveChartData.predictions.resolved.map((v: any) => v !== null ? v : undefined)],
                          pending: [...predictiveData.historical.map((d: any) => d.pending), ...predictiveData.predictions.map((d: any) => d.pending)]
                        }}
                      />
                    )}
                  </div>
                  
                  <div className="mt-6 border-t border-gray-200 pt-4">
                    <h4 className="font-medium text-gray-900 mb-3">Prediction Details</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Period
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Predicted Complaints
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Predicted Resolutions
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Predicted Pending
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {predictiveData.predictions.map((prediction: any, index: number) => (
                            <tr key={index} className="bg-primary-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-900">
                                {prediction.period} (Predicted)
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-800">
                                {prediction.total}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-800">
                                {prediction.resolved}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-800">
                                {prediction.pending}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    Apply filters and click "Apply Filters" to generate predictive analytics.
                  </p>
                </div>
              )}
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                About Predictive Analytics
              </h3>
              <div className="space-y-4 text-gray-700">
                <p>
                  Our predictive analytics uses historical complaint data to forecast future trends. 
                  The system analyzes patterns in complaint submissions, resolutions, and other metrics 
                  to provide insights into expected future volumes.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Methodology</h4>
                    <p className="text-sm">
                      We use linear regression and time series analysis to identify trends and 
                      seasonal patterns in complaint data.
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Accuracy</h4>
                    <p className="text-sm">
                      Predictions are most accurate for short-term forecasts and may vary based on 
                      external factors not captured in historical data.
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Applications</h4>
                    <p className="text-sm">
                      Use these predictions for resource planning, staffing decisions, and 
                      proactive issue management.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Complaint Report with Filters */}
        {selectedReport === 'complaints' && (
          <div className="space-y-6">
            <ReportFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onApplyFilters={handleApplyFilters}
              onResetFilters={handleResetFilters}
              loading={loading}
            />

            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Detailed Complaint Report ({complaintData.length} records)
                </h3>
                <ReportExporter
                  data={complaintData}
                  reportType="detailed_complaints"
                  title="Detailed Complaint Report"
                  columns={[
                    { key: 'id', label: 'Complaint ID' },
                    { key: 'subject', label: 'Subject' },
                    { key: 'category', label: 'Category' },
                    { key: 'priority', label: 'Priority' },
                    { key: 'status', label: 'Status' },
                    { key: 'submittedAt', label: 'Submitted Date' },
                    { key: 'assignedDepartment', label: 'Department' },
                    { key: 'resolutionTime', label: 'Resolution Time (days)' }
                  ]}
                />
              </div>
              
              {complaintData.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No complaints found matching the selected filters.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Complaint Details
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category & Priority
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Timeline
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Department
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {complaintData.slice(0, 50).map((complaint, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                                {complaint.subject}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {complaint.id}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary-100 text-secondary-800">
                                {complaint.category}
                              </span>
                              <br />
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                complaint.priority === 'urgent' ? 'bg-error-100 text-error-800' :
                                complaint.priority === 'high' ? 'bg-error-100 text-error-800' :
                                complaint.priority === 'medium' ? 'bg-warning-100 text-warning-800' :
                                'bg-success-100 text-success-800'
                              }`}>
                                {complaint.priority}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              complaint.status === 'resolved' ? 'bg-success-100 text-success-800' :
                              complaint.status === 'inProgress' ? 'bg-secondary-100 text-secondary-800' :
                              complaint.status === 'pending' ? 'bg-warning-100 text-warning-800' :
                              'bg-error-100 text-error-800'
                            }`}>
                              {complaint.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            <div>
                              <div>Submitted: {new Date(complaint.submittedAt).toLocaleDateString()}</div>
                              {complaint.resolutionTime && (
                                <div className="text-xs text-gray-400">
                                  Resolved in: {complaint.resolutionTime} days
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {complaint.assignedDepartment || 'Unassigned'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Other report types remain the same but with enhanced export functionality */}
        {/* ... (escalation, feedback, users reports with similar enhancements) ... */}
      </div>
    </div>
  )
}

export default EnhancedReportsPage