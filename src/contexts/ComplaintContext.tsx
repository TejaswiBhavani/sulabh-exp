import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { Complaint, ComplaintContextType } from '../types'
import { useAuth } from './AuthContext'
import { getCachedData, setCachedData, invalidateCache } from '../lib/cacheUtils'

const ComplaintContext = createContext<ComplaintContextType | undefined>(undefined)

export const useComplaints = () => {
  const context = useContext(ComplaintContext)
  if (context === undefined) {
    throw new Error('useComplaints must be used within a ComplaintProvider')
  }
  return context
}

interface ComplaintProviderProps {
  children: ReactNode
}

export const ComplaintProvider: React.FC<ComplaintProviderProps> = ({ children }) => {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  // Load complaints when user changes
  useEffect(() => {
    if (user) {
      loadComplaints()
    } else {
      setComplaints([])
    }
  }, [user])

  const loadComplaints = async () => {
    if (!user) return

    // In demo mode, load from localStorage
    if (!isSupabaseConfigured) {
      const demoComplaints = JSON.parse(localStorage.getItem('demo_complaints') || '[]')
      const userComplaints = demoComplaints.filter((c: any) => c.userId === user.id)
      setComplaints(userComplaints)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      // Try to get complaints from cache first
      const cacheKey = `complaints_list:user=${user.id}:role=${user.role}${user.department ? `:dept=${user.department}` : ''}`
      const { data: cachedData, cached } = await getCachedData<Complaint[]>(cacheKey, {})
      
      if (cached && cachedData) {
        setComplaints(cachedData)
        setLoading(false)
        return
      }
      
      // If not cached, fetch from database
      let query = supabase
        .from('complaints')
        .select(`
          *,
          complaint_updates(*),
          complaint_feedback(*)
        `)
        .order('submitted_at', { ascending: false })

      // Filter based on user role
      if (user.role === 'citizen') {
        query = query.eq('user_id', user.id)
      } else if (user.role === 'authority' && user.department) {
        query = query.eq('assigned_department', user.department)
      }
      // Admin can see all complaints (no additional filter)

      const { data, error } = await query

      if (error) throw error

      const formattedComplaints: Complaint[] = data.map(complaint => ({
        id: complaint.id,
        userId: complaint.user_id,
        category: complaint.category,
        subject: complaint.subject,
        description: complaint.description,
        location: complaint.location,
        priority: complaint.priority,
        status: complaint.status,
        attachments: complaint.attachments || undefined,
        assignedTo: complaint.assigned_to || undefined,
        assignedDepartment: complaint.assigned_department || undefined,
        submittedAt: new Date(complaint.submitted_at),
        updatedAt: new Date(complaint.updated_at),
        resolvedAt: complaint.resolved_at ? new Date(complaint.resolved_at) : undefined,
        feedback: complaint.complaint_feedback?.[0] ? {
          rating: complaint.complaint_feedback[0].rating,
          comment: complaint.complaint_feedback[0].comment || undefined,
          submittedAt: new Date(complaint.complaint_feedback[0].submitted_at)
        } : undefined,
        // rawUpdate is from DB (snake_case), the returned object conforms to ComplaintUpdate (camelCase)
        updates: complaint.complaint_updates.map((rawUpdate: any) => ({
          id: rawUpdate.id,
          complaintId: rawUpdate.complaint_id,
          message: rawUpdate.message,
          status: rawUpdate.status,
          updatedBy: rawUpdate.updated_by,
          updatedAt: new Date(rawUpdate.updated_at)
        }))
      }))

      // Cache the formatted complaints
      await setCachedData(cacheKey, formattedComplaints, {})
      
      setComplaints(formattedComplaints)
    } catch (error) {
      console.error('Error loading complaints:', error)
    } finally {
      setLoading(false)
    }
  }

  const submitComplaint = async (complaintData: Omit<Complaint, 'id' | 'userId' | 'submittedAt' | 'updatedAt' | 'updates'>): Promise<string> => {
    if (!user) throw new Error('User not authenticated')

    // In demo mode, simulate complaint submission
    if (!isSupabaseConfigured) {
      const mockComplaintId = `demo-complaint-${Date.now()}`
      
      const mockComplaint: Complaint = {
        id: mockComplaintId,
        userId: user.id,
        ...complaintData,
        submittedAt: new Date(),
        updatedAt: new Date(),
        updates: [{
          id: `update-${Date.now()}`,
          complaintId: mockComplaintId,
          message: 'Complaint submitted successfully',
          status: complaintData.status,
          updatedBy: user.id,
          updatedAt: new Date()
        }]
      }
      
      // Store in localStorage for demo
      const existingComplaints = JSON.parse(localStorage.getItem('demo_complaints') || '[]')
      existingComplaints.push(mockComplaint)
      localStorage.setItem('demo_complaints', JSON.stringify(existingComplaints))
      
      // Update state
      setComplaints(prev => [mockComplaint, ...prev])
      
      return mockComplaintId
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('complaints')
        .insert({
          user_id: user.id,
          category: complaintData.category,
          subject: complaintData.subject,
          description: complaintData.description,
          location: complaintData.location,
          priority: complaintData.priority,
          status: complaintData.status,
          attachments: complaintData.attachments || null,
          assigned_to: complaintData.assignedTo || null,
          assigned_department: complaintData.assignedDepartment || null
        })
        .select()
        .single()

      if (error) throw error

      // Invalidate complaints cache
      await invalidateCache(`complaints_list:user=${user.id}:role=${user.role}${user.department ? `:dept=${user.department}` : ''}`, {})
      
      // Reload complaints to get the updated list
      await loadComplaints()

      return data.id
    } catch (error: any) {
      throw new Error(error.message || 'Failed to submit complaint')
    } finally {
      setLoading(false)
    }
  }

  const updateComplaint = async (id: string, updates: Partial<Complaint>): Promise<void> => {
    setLoading(true)
    try {
      const updateData: any = {}
      
      if (updates.status) updateData.status = updates.status
      if (updates.assignedTo) updateData.assigned_to = updates.assignedTo
      if (updates.assignedDepartment) updateData.assigned_department = updates.assignedDepartment

      const { error } = await supabase
        .from('complaints')
        .update(updateData)
        .eq('id', id)

      if (error) throw error

      // Invalidate complaints cache
      if (user) {
        await invalidateCache(`complaints_list:user=${user.id}:role=${user.role}${user.department ? `:dept=${user.department}` : ''}`, {})
      }
      
      // Reload complaints to get the updated list
      await loadComplaints()
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update complaint')
    } finally {
      setLoading(false)
    }
  }

  const getComplaint = (id: string): Complaint | undefined => {
    return complaints.find(complaint => complaint.id === id)
  }

  const getComplaintsByUser = (userId: string): Complaint[] => {
    return complaints.filter(complaint => complaint.userId === userId)
  }

  const trackComplaint = async (id: string): Promise<Complaint | null> => {
    setLoading(true)
    try {
      // Try to get from cache first
      const cacheKey = `complaint:${id}`
      const { data: cachedData, cached } = await getCachedData<Complaint>(cacheKey, {})
      
      if (cached && cachedData) {
        return cachedData
      }
      
      // If not cached, fetch from database
      const { data, error } = await supabase
        .from('complaints')
        .select(`
          *,
          complaint_updates(*),
          complaint_feedback(*)
        `)
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // Complaint not found
        }
        throw error
      }

      const complaint: Complaint = {
        id: data.id,
        userId: data.user_id,
        category: data.category,
        subject: data.subject,
        description: data.description,
        location: data.location,
        priority: data.priority,
        status: data.status,
        attachments: data.attachments || undefined,
        assignedTo: data.assigned_to || undefined,
        assignedDepartment: data.assigned_department || undefined,
        submittedAt: new Date(data.submitted_at),
        updatedAt: new Date(data.updated_at),
        resolvedAt: data.resolved_at ? new Date(data.resolved_at) : undefined,
        feedback: data.complaint_feedback?.[0] ? {
          rating: data.complaint_feedback[0].rating,
          comment: data.complaint_feedback[0].comment || undefined,
          submittedAt: new Date(data.complaint_feedback[0].submitted_at)
        } : undefined,
        // rawUpdate is from DB (snake_case), the returned object conforms to ComplaintUpdate (camelCase)
        updates: data.complaint_updates.map((rawUpdate: any) => ({
          id: rawUpdate.id,
          complaintId: rawUpdate.complaint_id,
          message: rawUpdate.message,
          status: rawUpdate.status,
          updatedBy: rawUpdate.updated_by,
          updatedAt: new Date(rawUpdate.updated_at)
        }))
      }

      // Cache the complaint
      await setCachedData(cacheKey, complaint, {})
      
      return complaint
    } catch (error: any) {
      throw new Error(error.message || 'Failed to track complaint')
    } finally {
      setLoading(false)
    }
  }

  const value: ComplaintContextType = {
    complaints,
    submitComplaint,
    updateComplaint,
    getComplaint,
    getComplaintsByUser,
    trackComplaint,
    loading
  }

  return (
    <ComplaintContext.Provider value={value}>
      {children}
    </ComplaintContext.Provider>
  )
}