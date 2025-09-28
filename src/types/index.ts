export interface User {
  id: string
  email: string
  username: string
  firstName: string
  lastName: string
  phone?: string
  role: 'citizen' | 'authority' | 'admin' | 'ngo'
  department?: string
  isVerified?: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Complaint {
  id: string
  userId: string
  category: ComplaintCategory
  subject: string
  description: string
  location: string
  priority: Priority
  status: ComplaintStatus
  attachments?: string[]
  assignedTo?: string
  assignedDepartment?: string
  submittedAt: Date
  updatedAt: Date
  resolvedAt?: Date
  feedback?: ComplaintFeedback
  updates: ComplaintUpdate[]
}

export interface ComplaintUpdate {
  id: string
  complaintId: string
  message: string
  status: ComplaintStatus
  updatedBy: string
  updatedAt: Date
  attachments?: string[]
}

export interface ComplaintFeedback {
  rating: number
  comment?: string
  submittedAt: Date
}

export interface Suggestion {
  id: string
  userId: string
  title: string
  description: string
  category: ComplaintCategory
  status: SuggestionStatus
  supportCount: number
  createdAt: Date
  updatedAt: Date
  supports: SuggestionSupport[]
  comments: SuggestionComment[]
}

export interface SuggestionSupport {
  id: string
  suggestionId: string
  userId: string
  createdAt: Date
}

export interface SuggestionComment {
  id: string
  suggestionId: string
  userId: string
  comment: string
  createdAt: Date
  user?: {
    firstName: string
    lastName: string
  }
}

export interface DiscussionGroup {
  id: string
  name: string
  description: string
  createdBy: string
  isNgoGroup: boolean
  createdAt: Date
  members: GroupMember[]
}

export interface GroupMember {
  id: string
  groupId: string
  userId: string
  role: GroupMemberRole
  joinedAt: Date
  user?: {
    firstName: string
    lastName: string
  }
}

export type ComplaintCategory = 
  | 'sanitation'
  | 'infrastructure'
  | 'publicServices'
  | 'utilities'
  | 'transportation'
  | 'other'

export type Priority = 'low' | 'medium' | 'high' | 'urgent'

export type ComplaintStatus = 
  | 'pending'
  | 'inProgress'
  | 'resolved'
  | 'escalated'
  | 'closed'

export type SuggestionStatus = 
  | 'active'
  | 'under_review'
  | 'implemented'
  | 'rejected'

export type GroupMemberRole = 'member' | 'moderator' | 'admin'

export interface Department {
  id: string
  name: string
  description: string
  categories: ComplaintCategory[]
  contactEmail: string
  contactPhone?: string
}

export interface Statistics {
  totalComplaints: number
  pendingComplaints: number
  inProgressComplaints: number
  resolvedComplaints: number
  escalatedComplaints: number
  averageResolutionTime: number
  complaintsByCategory: Record<ComplaintCategory, number>
  complaintsByPriority: Record<Priority, number>
  monthlyTrends: Array<{
    month: string
    submitted: number
    resolved: number
  }>
}

export interface AuthContextType {
  user: User | null
  session: any | null
  login: (identifier: string, password: string, rememberMe?: boolean) => Promise<void>
  register: (userData: RegisterData) => Promise<void>
  logout: () => void
  resetPassword: (email: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
  loading: boolean
}

export interface RegisterData {
  firstName: string
  lastName: string
  username: string
  email: string
  phone?: string
  password: string
}

export interface ComplaintContextType {
  complaints: Complaint[]
  submitComplaint: (complaintData: Omit<Complaint, 'id' | 'userId' | 'submittedAt' | 'updatedAt' | 'updates'>) => Promise<string>
  updateComplaint: (id: string, updates: Partial<Complaint>) => Promise<void>
  getComplaint: (id: string) => Complaint | undefined
  getComplaintsByUser: (userId: string) => Complaint[]
  trackComplaint: (id: string) => Promise<Complaint | null>
  loading: boolean
}

export interface SuggestionContextType {
  suggestions: Suggestion[]
  submitSuggestion: (suggestionData: Omit<Suggestion, 'id' | 'userId' | 'supportCount' | 'createdAt' | 'updatedAt' | 'supports' | 'comments'>) => Promise<string>
  updateSuggestion: (id: string, updates: Partial<Suggestion>) => Promise<void>
  getSuggestion: (id: string) => Suggestion | undefined
  getSuggestionsByUser: (userId: string) => Suggestion[]
  supportSuggestion: (suggestionId: string) => Promise<void>
  unsupportSuggestion: (suggestionId: string) => Promise<void>
  addComment: (suggestionId: string, comment: string) => Promise<void>
  updateComment: (commentId: string, comment: string) => Promise<void>
  deleteComment: (commentId: string) => Promise<void>
  loading: boolean
}