import React, { createContext, useContext, useState, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { withCache } from '../lib/cacheUtils'

export interface ReportData {
  // Basic Statistics
  totalComplaints: number
  pendingComplaints: number
  inProgressComplaints: number
  resolvedComplaints: number
  escalatedComplaints: number
  closedComplaints: number
  
  // Performance Metrics
  averageResolutionTime: number
  resolutionRate: number
  escalationRate: number
  satisfactionScore: number
  
  // Category Breakdown
  complaintsByCategory: Record<string, number>
  complaintsByPriority: Record<string, number>
  complaintsByDepartment: Record<string, number>
  
  // Time-based Data
  monthlyTrends: Array<{
    month: string
    submitted: number
    resolved: number
    pending: number
  }>
  
  weeklyTrends: Array<{
    week: string
    submitted: number
    resolved: number
  }>
  
  // User Analytics
  activeUsers: number
  newRegistrations: number
  usersByRole: Record<string, number>
  
  // Feedback Analytics
  feedbackSummary: {
    totalFeedbacks: number
    averageRating: number
    ratingDistribution: Record<number, number>
  }
  
  // Department Performance
  departmentPerformance: Array<{
    department: string
    totalAssigned: number
    resolved: number
    pending: number
    averageResolutionTime: number
    satisfactionScore: number
  }>
}

export interface EscalationReport {
  complaintId: string
  subject: string
  category: string
  priority: string
  submittedAt: string
  daysPending: number
  assignedDepartment: string
  escalationReason: string
}

export interface ComplaintReport {
  id: string
  subject: string
  category: string
  priority: string
  status: string
  submittedAt: string
  resolvedAt?: string
  resolutionTime?: number
  assignedDepartment: string
  userFeedback?: {
    rating: number
    comment?: string
  }
}

interface ReportsContextType {
  generateDashboardReport: (period: 'week' | 'month' | 'quarter' | 'year') => Promise<ReportData>
  generateEscalationReport: (department?: string) => Promise<EscalationReport[]>
  generateComplaintReport: (filters: {
    startDate?: string
    endDate?: string
    category?: string
    department?: string
    status?: string
  }) => Promise<ComplaintReport[]>
  generateFeedbackSummary: (department?: string) => Promise<any>
  generateUserActivityReport: () => Promise<any>
  exportReport: (reportType: string, data: any, format: 'csv' | 'pdf') => Promise<void>
  loading: boolean
}

const ReportsContext = createContext<ReportsContextType | undefined>(undefined)

export const useReports = () => {
  const context = useContext(ReportsContext)
  if (context === undefined) {
    throw new Error('useReports must be used within a ReportsProvider')
  }
  return context
}

interface ReportsProviderProps {
  children: ReactNode
}

export const ReportsProvider: React.FC<ReportsProviderProps> = ({ children }) => {
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  const generateDashboardReport = async (period: 'week' | 'month' | 'quarter' | 'year'): Promise<ReportData> => {
    setLoading(true)
    try {
      // Use cache wrapper for dashboard report
      return await withCache(
        'dashboard_stats',
        async () => {
          // Calculate date range based on period
          const now = new Date()
          const startDate = new Date()
          
          switch (period) {
            case 'week':
              startDate.setDate(now.getDate() - 7)
              break
            case 'month':
              startDate.setMonth(now.getMonth() - 1)
              break
            case 'quarter':
              startDate.setMonth(now.getMonth() - 3)
              break
            case 'year':
              startDate.setFullYear(now.getFullYear() - 1)
              break
          }

          // Fetch complaints data
          let complaintsQuery = supabase
            .from('complaints')
            .select(`
              *,
              complaint_feedback(rating, comment),
              profiles!complaints_user_id_fkey(role, department)
            `)
            .gte('submitted_at', startDate.toISOString())

          // Apply role-based filtering
          if (user?.role === 'authority' && user.department) {
            complaintsQuery = complaintsQuery.eq('assigned_department', user.department)
          }

          const { data: complaints, error: complaintsError } = await complaintsQuery

          if (complaintsError) throw complaintsError

          // Fetch users data
          const { data: users, error: usersError } = await supabase
            .from('profiles')
            .select('role, created_at')
            .gte('created_at', startDate.toISOString())

          if (usersError) throw usersError

          // Process data
          const totalComplaints = complaints?.length || 0
          const pendingComplaints = complaints?.filter(c => c.status === 'pending').length || 0
          const inProgressComplaints = complaints?.filter(c => c.status === 'inProgress').length || 0
          const resolvedComplaints = complaints?.filter(c => c.status === 'resolved').length || 0
          const escalatedComplaints = complaints?.filter(c => c.status === 'escalated').length || 0
          const closedComplaints = complaints?.filter(c => c.status === 'closed').length || 0

          // Calculate resolution metrics
          const resolvedWithTime = complaints?.filter(c => c.status === 'resolved' && c.resolved_at) || []
          const averageResolutionTime = resolvedWithTime.length > 0
            ? resolvedWithTime.reduce((acc, c) => {
                const submitted = new Date(c.submitted_at)
                const resolved = new Date(c.resolved_at!)
                return acc + (resolved.getTime() - submitted.getTime()) / (1000 * 60 * 60 * 24)
              }, 0) / resolvedWithTime.length
            : 0

          const resolutionRate = totalComplaints > 0 ? (resolvedComplaints / totalComplaints) * 100 : 0
          const escalationRate = totalComplaints > 0 ? (escalatedComplaints / totalComplaints) * 100 : 0

          // Calculate satisfaction score
          const feedbacks = complaints?.flatMap(c => c.complaint_feedback || []) || []
          const satisfactionScore = feedbacks.length > 0
            ? feedbacks.reduce((acc, f) => acc + f.rating, 0) / feedbacks.length
            : 0

          // Category breakdown
          const complaintsByCategory = complaints?.reduce((acc, c) => {
            acc[c.category] = (acc[c.category] || 0) + 1
            return acc
          }, {} as Record<string, number>) || {}

          // Priority breakdown
          const complaintsByPriority = complaints?.reduce((acc, c) => {
            acc[c.priority] = (acc[c.priority] || 0) + 1
            return acc
          }, {} as Record<string, number>) || {}

          // Department breakdown
          const complaintsByDepartment = complaints?.reduce((acc, c) => {
            if (c.assigned_department) {
              acc[c.assigned_department] = (acc[c.assigned_department] || 0) + 1
            }
            return acc
          }, {} as Record<string, number>) || {}

          // Generate monthly trends
          const monthlyTrends = generateTimeTrends(complaints || [], 'month')
          const weeklyTrends = generateTimeTrends(complaints || [], 'week')

          // User analytics
          const activeUsers = users?.length || 0
          const newRegistrations = users?.length || 0
          const usersByRole = users?.reduce((acc, u) => {
            acc[u.role] = (acc[u.role] || 0) + 1
            return acc
          }, {} as Record<string, number>) || {}

          // Feedback summary
          const feedbackSummary = {
            totalFeedbacks: feedbacks.length,
            averageRating: satisfactionScore,
            ratingDistribution: feedbacks.reduce((acc, f) => {
              acc[f.rating] = (acc[f.rating] || 0) + 1
              return acc
            }, {} as Record<number, number>)
          }

          // Department performance (for admin users)
          const departmentPerformance = user?.role === 'admin' 
            ? generateDepartmentPerformance(complaints || [])
            : []

          return {
            totalComplaints,
            pendingComplaints,
            inProgressComplaints,
            resolvedComplaints,
            escalatedComplaints,
            closedComplaints,
            averageResolutionTime,
            resolutionRate,
            escalationRate,
            satisfactionScore,
            complaintsByCategory,
            complaintsByPriority,
            complaintsByDepartment,
            monthlyTrends,
            weeklyTrends,
            activeUsers,
            newRegistrations,
            usersByRole,
            feedbackSummary,
            departmentPerformance
          }
        },
        { period },
        user?.id,
        user?.department
      )
    } catch (error) {
      console.error('Error generating dashboard report:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const generateEscalationReport = async (department?: string): Promise<EscalationReport[]> => {
    setLoading(true)
    try {
      // Use cache wrapper for escalation report
      return await withCache(
        'escalation_report',
        async () => {
          let query = supabase
            .from('complaints')
            .select('*')
            .in('status', ['pending', 'escalated'])
            .order('submitted_at', { ascending: true })

          if (department) {
            query = query.eq('assigned_department', department)
          } else if (user?.role === 'authority' && user.department) {
            query = query.eq('assigned_department', user.department)
          }

          const { data: complaints, error } = await query

          if (error) throw error

          const escalationReports: EscalationReport[] = complaints?.map(complaint => {
            const submittedDate = new Date(complaint.submitted_at)
            const daysPending = Math.floor((Date.now() - submittedDate.getTime()) / (1000 * 60 * 60 * 24))
            
            let escalationReason = ''
            if (daysPending > 7 && complaint.priority === 'urgent') {
              escalationReason = 'Urgent complaint pending for more than 7 days'
            } else if (daysPending > 14 && complaint.priority === 'high') {
              escalationReason = 'High priority complaint pending for more than 14 days'
            } else if (daysPending > 30) {
              escalationReason = 'Complaint pending for more than 30 days'
            } else if (complaint.status === 'escalated') {
              escalationReason = 'Manually escalated'
            }

            return {
              complaintId: complaint.id,
              subject: complaint.subject,
              category: complaint.category,
              priority: complaint.priority,
              submittedAt: complaint.submitted_at,
              daysPending,
              assignedDepartment: complaint.assigned_department || 'Unassigned',
              escalationReason
            }
          }).filter(report => report.escalationReason) || []

          return escalationReports
        },
        { department },
        user?.id,
        user?.department
      )
    } catch (error) {
      console.error('Error generating escalation report:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const generateComplaintReport = async (filters: {
    startDate?: string
    endDate?: string
    category?: string
    department?: string
    status?: string
  }): Promise<ComplaintReport[]> => {
    setLoading(true)
    try {
      // Use cache wrapper for complaint report
      return await withCache(
        'complaints_report',
        async () => {
          let query = supabase
            .from('complaints')
            .select(`
              *,
              complaint_feedback(rating, comment)
            `)
            .order('submitted_at', { ascending: false })

          // Apply filters
          if (filters.startDate) {
            query = query.gte('submitted_at', filters.startDate)
          }
          if (filters.endDate) {
            query = query.lte('submitted_at', filters.endDate)
          }
          if (filters.category) {
            query = query.eq('category', filters.category)
          }
          if (filters.department) {
            query = query.eq('assigned_department', filters.department)
          }
          if (filters.status) {
            query = query.eq('status', filters.status)
          }

          // Apply role-based filtering
          if (user?.role === 'authority' && user.department) {
            query = query.eq('assigned_department', user.department)
          } else if (user?.role === 'citizen') {
            query = query.eq('user_id', user.id)
          }

          const { data: complaints, error } = await query

          if (error) throw error

          const complaintReports: ComplaintReport[] = complaints?.map(complaint => {
            const submittedAt = new Date(complaint.submitted_at)
            const resolvedAt = complaint.resolved_at ? new Date(complaint.resolved_at) : undefined
            const resolutionTime = resolvedAt 
              ? Math.floor((resolvedAt.getTime() - submittedAt.getTime()) / (1000 * 60 * 60 * 24))
              : undefined

            return {
              id: complaint.id,
              subject: complaint.subject,
              category: complaint.category,
              priority: complaint.priority,
              status: complaint.status,
              submittedAt: complaint.submitted_at,
              resolvedAt: complaint.resolved_at || undefined,
              resolutionTime,
              assignedDepartment: complaint.assigned_department || 'Unassigned',
              userFeedback: complaint.complaint_feedback?.[0] ? {
                rating: complaint.complaint_feedback[0].rating,
                comment: complaint.complaint_feedback[0].comment || undefined
              } : undefined
            }
          }) || []

          return complaintReports
        },
        filters,
        user?.id,
        user?.department
      )
    } catch (error) {
      console.error('Error generating complaint report:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const generateFeedbackSummary = async (department?: string) => {
    setLoading(true)
    try {
      // Use cache wrapper for feedback summary
      return await withCache(
        'feedback_summary',
        async () => {
          let query = supabase
            .from('complaint_feedback')
            .select(`
              *,
              complaints!inner(assigned_department, category, priority)
            `)

          if (department) {
            query = query.eq('complaints.assigned_department', department)
          } else if (user?.role === 'authority' && user.department) {
            query = query.eq('complaints.assigned_department', user.department)
          }

          const { data: feedbacks, error } = await query

          if (error) throw error

          // Process feedback data
          const summary = {
            totalFeedbacks: feedbacks?.length || 0,
            averageRating: feedbacks?.length ? 
              feedbacks.reduce((acc, f) => acc + f.rating, 0) / feedbacks.length : 0,
            ratingDistribution: feedbacks?.reduce((acc, f) => {
              acc[f.rating] = (acc[f.rating] || 0) + 1
              return acc
            }, {} as Record<number, number>) || {},
            feedbackByCategory: feedbacks?.reduce((acc, f) => {
              const category = f.complaints.category
              if (!acc[category]) {
                acc[category] = { total: 0, averageRating: 0, ratings: [] }
              }
              acc[category].total++
              acc[category].ratings.push(f.rating)
              acc[category].averageRating = acc[category].ratings.reduce((a: number, b: number) => a + b, 0) / acc[category].ratings.length
              return acc
            }, {} as Record<string, any>) || {}
          }

          return summary
        },
        { department },
        user?.id,
        user?.department
      )
    } catch (error) {
      console.error('Error generating feedback summary:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const generateUserActivityReport = async () => {
    setLoading(true)
    try {
      // Use cache wrapper for user activity report
      return await withCache(
        'user_activity',
        async () => {
          const { data: users, error } = await supabase
            .from('profiles')
            .select('role, created_at, department')
            .order('created_at', { ascending: false })

          if (error) throw error

          const now = new Date()
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())

          const report = {
            totalUsers: users?.length || 0,
            newUsersThisMonth: users?.filter(u => new Date(u.created_at) >= lastMonth).length || 0,
            usersByRole: users?.reduce((acc, u) => {
              acc[u.role] = (acc[u.role] || 0) + 1
              return acc
            }, {} as Record<string, number>) || {},
            usersByDepartment: users?.filter(u => u.department).reduce((acc, u) => {
              acc[u.department!] = (acc[u.department!] || 0) + 1
              return acc
            }, {} as Record<string, number>) || {}
          }

          return report
        },
        {},
        user?.id,
        user?.role === 'admin' ? undefined : user?.department
      )
    } catch (error) {
      console.error('Error generating user activity report:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const exportReport = async (reportType: string, data: any, format: 'csv' | 'pdf'): Promise<void> => {
    try {
      if (format === 'csv') {
        exportToCSV(reportType, data)
      } else if (format === 'pdf') {
        exportToPDF(reportType, data)
      }
    } catch (error) {
      console.error('Error exporting report:', error)
      throw error
    }
  }

  const value: ReportsContextType = {
    generateDashboardReport,
    generateEscalationReport,
    generateComplaintReport,
    generateFeedbackSummary,
    generateUserActivityReport,
    exportReport,
    loading
  }

  return (
    <ReportsContext.Provider value={value}>
      {children}
    </ReportsContext.Provider>
  )
}

// Helper functions
const generateTimeTrends = (complaints: any[], period: 'week' | 'month') => {
  const trends: any[] = []
  const now = new Date()
  const periods = period === 'week' ? 12 : 12 // Last 12 weeks or months

  for (let i = periods - 1; i >= 0; i--) {
    const periodStart = new Date(now)
    const periodEnd = new Date(now)

    if (period === 'week') {
      periodStart.setDate(now.getDate() - (i + 1) * 7)
      periodEnd.setDate(now.getDate() - i * 7)
    } else {
      periodStart.setMonth(now.getMonth() - (i + 1))
      periodEnd.setMonth(now.getMonth() - i)
    }

    const periodComplaints = complaints.filter(c => {
      const date = new Date(c.submitted_at)
      return date >= periodStart && date < periodEnd
    })

    const resolved = periodComplaints.filter(c => c.status === 'resolved').length
    const pending = periodComplaints.filter(c => c.status === 'pending').length

    trends.push({
      [period]: period === 'week' 
        ? `Week ${periodStart.getDate()}/${periodStart.getMonth() + 1}`
        : periodStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      submitted: periodComplaints.length,
      resolved,
      pending
    })
  }

  return trends
}

const generateDepartmentPerformance = (complaints: any[]) => {
  const departments = [...new Set(complaints.map(c => c.assigned_department).filter(Boolean))]
  
  return departments.map(dept => {
    const deptComplaints = complaints.filter(c => c.assigned_department === dept)
    const resolved = deptComplaints.filter(c => c.status === 'resolved')
    const pending = deptComplaints.filter(c => c.status === 'pending')
    
    const avgResolutionTime = resolved.length > 0
      ? resolved.reduce((acc, c) => {
          if (c.resolved_at) {
            const submitted = new Date(c.submitted_at)
            const resolvedDate = new Date(c.resolved_at)
            return acc + (resolvedDate.getTime() - submitted.getTime()) / (1000 * 60 * 60 * 24)
          }
          return acc
        }, 0) / resolved.length
      : 0

    const feedbacks = deptComplaints.flatMap(c => c.complaint_feedback || [])
    const satisfactionScore = feedbacks.length > 0
      ? feedbacks.reduce((acc, f) => acc + f.rating, 0) / feedbacks.length
      : 0

    return {
      department: dept,
      totalAssigned: deptComplaints.length,
      resolved: resolved.length,
      pending: pending.length,
      averageResolutionTime: avgResolutionTime,
      satisfactionScore
    }
  })
}

const exportToCSV = (reportType: string, data: any) => {
  let csvContent = ''
  let headers: string[] = []
  let rows: any[] = []

  switch (reportType) {
    case 'complaints':
      headers = ['ID', 'Subject', 'Category', 'Priority', 'Status', 'Submitted At', 'Department', 'Resolution Time']
      rows = data.map((item: ComplaintReport) => [
        item.id,
        item.subject,
        item.category,
        item.priority,
        item.status,
        new Date(item.submittedAt).toLocaleDateString(),
        item.assignedDepartment,
        item.resolutionTime ? `${item.resolutionTime} days` : 'N/A'
      ])
      break
    case 'escalation':
      headers = ['Complaint ID', 'Subject', 'Category', 'Priority', 'Days Pending', 'Department', 'Escalation Reason']
      rows = data.map((item: EscalationReport) => [
        item.complaintId,
        item.subject,
        item.category,
        item.priority,
        item.daysPending,
        item.assignedDepartment,
        item.escalationReason
      ])
      break
  }

  csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`
  link.click()
  window.URL.revokeObjectURL(url)
}

const exportToPDF = (reportType: string, data: any) => {
  // For now, we'll create a simple HTML-based PDF export
  // In a real application, you'd use a library like jsPDF or Puppeteer
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  let htmlContent = `
    <html>
      <head>
        <title>SULABH ${reportType.toUpperCase()} Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          h1 { color: #333; }
          .header { text-align: center; margin-bottom: 30px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>SULABH - Online Grievance Redressal System</h1>
          <h2>${reportType.toUpperCase()} Report</h2>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
        </div>
  `

  if (reportType === 'complaints') {
    htmlContent += `
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Subject</th>
            <th>Category</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Submitted</th>
            <th>Department</th>
          </tr>
        </thead>
        <tbody>
    `
    data.forEach((item: ComplaintReport) => {
      htmlContent += `
        <tr>
          <td>${item.id}</td>
          <td>${item.subject}</td>
          <td>${item.category}</td>
          <td>${item.priority}</td>
          <td>${item.status}</td>
          <td>${new Date(item.submittedAt).toLocaleDateString()}</td>
          <td>${item.assignedDepartment}</td>
        </tr>
      `
    })
    htmlContent += '</tbody></table>'
  }

  htmlContent += '</body></html>'

  printWindow.document.write(htmlContent)
  printWindow.document.close()
  printWindow.print()
}