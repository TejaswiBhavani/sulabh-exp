import api from './api'

export interface ComplaintRequest {
  category: string
  subject: string
  description: string
  location: string
  priority?: string
  attachments?: string[]
}

export interface ComplaintResponse {
  id: number
  category: string
  subject: string
  description: string
  location: string
  priority: string
  status: string
  assignedTo?: string
  attachments: string[]
  submittedAt: string
  updatedAt: string
  resolvedAt?: string
  user: {
    id: number
    email: string
    username: string
    fullName: string
  }
  updates: ComplaintUpdateResponse[]
}

export interface ComplaintUpdateResponse {
  id: number
  message: string
  status?: string
  updatedBy: string
  attachments: string[]
  updatedAt: string
}

export interface ComplaintUpdateRequest {
  message: string
  status?: string
  attachments?: string[]
}

class ComplaintService {
  
  // Submit a new complaint
  async submitComplaint(complaintData: ComplaintRequest): Promise<ComplaintResponse> {
    try {
      const response = await api.post<ComplaintResponse>('/api/complaints', complaintData)
      return response.data
    } catch (error: any) {
      console.error('Submit complaint error:', error)
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message)
      } else {
        throw new Error('Failed to submit complaint. Please try again.')
      }
    }
  }

  // Get complaint by ID
  async getComplaint(id: string): Promise<ComplaintResponse> {
    try {
      const response = await api.get<ComplaintResponse>(`/api/complaints/${id}`)
      return response.data
    } catch (error: any) {
      console.error('Get complaint error:', error)
      if (error.response?.status === 404) {
        throw new Error('Complaint not found')
      } else {
        throw new Error('Failed to fetch complaint. Please try again.')
      }
    }
  }

  // Get user's complaints
  async getMyComplaints(): Promise<ComplaintResponse[]> {
    try {
      const response = await api.get<ComplaintResponse[]>('/api/complaints/my')
      return response.data
    } catch (error: any) {
      console.error('Get my complaints error:', error)
      throw new Error('Failed to fetch complaints. Please try again.')
    }
  }

  // Get user's complaints with pagination
  async getMyComplaintsPaginated(page: number = 0, size: number = 10): Promise<{
    content: ComplaintResponse[]
    totalElements: number
    totalPages: number
    size: number
    number: number
  }> {
    try {
      const response = await api.get(`/api/complaints/my/paginated?page=${page}&size=${size}`)
      return response.data
    } catch (error: any) {
      console.error('Get paginated complaints error:', error)
      throw new Error('Failed to fetch complaints. Please try again.')
    }
  }

  // Get all complaints (admin)
  async getAllComplaints(): Promise<ComplaintResponse[]> {
    try {
      const response = await api.get<ComplaintResponse[]>('/api/complaints')
      return response.data
    } catch (error: any) {
      console.error('Get all complaints error:', error)
      throw new Error('Failed to fetch complaints. Please try again.')
    }
  }

  // Get complaints by status
  async getComplaintsByStatus(status: string): Promise<ComplaintResponse[]> {
    try {
      const response = await api.get<ComplaintResponse[]>(`/api/complaints/status/${status}`)
      return response.data
    } catch (error: any) {
      console.error('Get complaints by status error:', error)
      throw new Error('Failed to fetch complaints. Please try again.')
    }
  }

  // Add update to complaint
  async addComplaintUpdate(complaintId: string, updateData: ComplaintUpdateRequest): Promise<ComplaintUpdateResponse> {
    try {
      const response = await api.post<ComplaintUpdateResponse>(`/api/complaints/${complaintId}/updates`, updateData)
      return response.data
    } catch (error: any) {
      console.error('Add complaint update error:', error)
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message)
      } else {
        throw new Error('Failed to add update. Please try again.')
      }
    }
  }

  // Get complaint updates
  async getComplaintUpdates(complaintId: string): Promise<ComplaintUpdateResponse[]> {
    try {
      const response = await api.get<ComplaintUpdateResponse[]>(`/api/complaints/${complaintId}/updates`)
      return response.data
    } catch (error: any) {
      console.error('Get complaint updates error:', error)
      throw new Error('Failed to fetch updates. Please try again.')
    }
  }

  // Update complaint status
  async updateComplaintStatus(complaintId: string, status: string): Promise<ComplaintResponse> {
    try {
      const response = await api.put<ComplaintResponse>(`/api/complaints/${complaintId}/status`, { status })
      return response.data
    } catch (error: any) {
      console.error('Update complaint status error:', error)
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message)
      } else {
        throw new Error('Failed to update status. Please try again.')
      }
    }
  }

  // Delete complaint
  async deleteComplaint(complaintId: string): Promise<void> {
    try {
      await api.delete(`/api/complaints/${complaintId}`)
    } catch (error: any) {
      console.error('Delete complaint error:', error)
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message)
      } else {
        throw new Error('Failed to delete complaint. Please try again.')
      }
    }
  }

  // Get complaint statistics
  async getComplaintStats(): Promise<{
    total: number
    pending: number
    inProgress: number
    resolved: number
    closed: number
  }> {
    try {
      const response = await api.get('/api/complaints/stats')
      return response.data
    } catch (error: any) {
      console.error('Get complaint stats error:', error)
      throw new Error('Failed to fetch statistics. Please try again.')
    }
  }

  // Get admin complaint statistics
  async getAdminComplaintStats(): Promise<{
    total: number
    pending: number
    inProgress: number
    resolved: number
    closed: number
  }> {
    try {
      const response = await api.get('/api/complaints/admin/stats')
      return response.data
    } catch (error: any) {
      console.error('Get admin complaint stats error:', error)
      throw new Error('Failed to fetch statistics. Please try again.')
    }
  }
}

// Export singleton instance
export default new ComplaintService()