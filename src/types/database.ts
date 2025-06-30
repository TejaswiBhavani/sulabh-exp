export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          first_name: string
          last_name: string
          phone: string | null
          role: 'citizen' | 'authority' | 'admin' | 'ngo'
          department: string | null
          is_verified: boolean
          phone_notification_enabled: boolean
          email_notification_enabled: boolean
          is_phone_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          first_name: string
          last_name: string
          phone?: string | null
          role?: 'citizen' | 'authority' | 'admin' | 'ngo'
          department?: string | null
          is_verified?: boolean
          phone_notification_enabled?: boolean
          email_notification_enabled?: boolean
          is_phone_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string
          last_name?: string
          phone?: string | null
          role?: 'citizen' | 'authority' | 'admin' | 'ngo'
          department?: string | null
          is_verified?: boolean
          phone_notification_enabled?: boolean
          email_notification_enabled?: boolean
          is_phone_verified?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      complaints: {
        Row: {
          id: string
          user_id: string
          category: 'sanitation' | 'infrastructure' | 'publicServices' | 'utilities' | 'transportation' | 'other'
          subject: string
          description: string
          location: string
          priority: 'low' | 'medium' | 'high' | 'urgent'
          status: 'pending' | 'inProgress' | 'resolved' | 'escalated' | 'closed'
          assigned_to: string | null
          assigned_department: string | null
          attachments: string[] | null
          submitted_at: string
          updated_at: string
          resolved_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          category: 'sanitation' | 'infrastructure' | 'publicServices' | 'utilities' | 'transportation' | 'other'
          subject: string
          description: string
          location: string
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          status?: 'pending' | 'inProgress' | 'resolved' | 'escalated' | 'closed'
          assigned_to?: string | null
          assigned_department?: string | null
          attachments?: string[] | null
          submitted_at?: string
          updated_at?: string
          resolved_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          category?: 'sanitation' | 'infrastructure' | 'publicServices' | 'utilities' | 'transportation' | 'other'
          subject?: string
          description?: string
          location?: string
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          status?: 'pending' | 'inProgress' | 'resolved' | 'escalated' | 'closed'
          assigned_to?: string | null
          assigned_department?: string | null
          attachments?: string[] | null
          submitted_at?: string
          updated_at?: string
          resolved_at?: string | null
        }
      }
      complaint_updates: {
        Row: {
          id: string
          complaint_id: string
          message: string
          status: 'pending' | 'inProgress' | 'resolved' | 'escalated' | 'closed'
          updated_by: string
          updated_at: string
          attachments: string[] | null
        }
        Insert: {
          id?: string
          complaint_id: string
          message: string
          status: 'pending' | 'inProgress' | 'resolved' | 'escalated' | 'closed'
          updated_by: string
          updated_at?: string
          attachments?: string[] | null
        }
        Update: {
          id?: string
          complaint_id?: string
          message?: string
          status?: 'pending' | 'inProgress' | 'resolved' | 'escalated' | 'closed'
          updated_by?: string
          updated_at?: string
          attachments?: string[] | null
        }
      }
      complaint_feedback: {
        Row: {
          id: string
          complaint_id: string
          rating: number
          comment: string | null
          submitted_at: string
        }
        Insert: {
          id?: string
          complaint_id: string
          rating: number
          comment?: string | null
          submitted_at?: string
        }
        Update: {
          id?: string
          complaint_id?: string
          rating?: number
          comment?: string | null
          submitted_at?: string
        }
      }
      suggestions: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string
          category: 'sanitation' | 'infrastructure' | 'publicServices' | 'utilities' | 'transportation' | 'other'
          status: 'active' | 'under_review' | 'implemented' | 'rejected'
          support_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description: string
          category: 'sanitation' | 'infrastructure' | 'publicServices' | 'utilities' | 'transportation' | 'other'
          status?: 'active' | 'under_review' | 'implemented' | 'rejected'
          support_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string
          category?: 'sanitation' | 'infrastructure' | 'publicServices' | 'utilities' | 'transportation' | 'other'
          status?: 'active' | 'under_review' | 'implemented' | 'rejected'
          support_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      suggestion_supports: {
        Row: {
          id: string
          suggestion_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          suggestion_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          suggestion_id?: string
          user_id?: string
          created_at?: string
        }
      }
      suggestion_comments: {
        Row: {
          id: string
          suggestion_id: string
          user_id: string
          comment: string
          created_at: string
        }
        Insert: {
          id?: string
          suggestion_id: string
          user_id: string
          comment: string
          created_at?: string
        }
        Update: {
          id?: string
          suggestion_id?: string
          user_id?: string
          comment?: string
          created_at?: string
        }
      }
      discussion_groups: {
        Row: {
          id: string
          name: string
          description: string
          created_by: string
          is_ngo_group: boolean
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          created_by: string
          is_ngo_group?: boolean
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          created_by?: string
          is_ngo_group?: boolean
          metadata?: Json | null
          created_at?: string
        }
      }
      group_members: {
        Row: {
          id: string
          group_id: string
          user_id: string
          role: 'member' | 'moderator' | 'admin'
          joined_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          role?: 'member' | 'moderator' | 'admin'
          joined_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          role?: 'member' | 'moderator' | 'admin'
          joined_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          related_id: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message: string
          related_id?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string
          related_id?: string | null
          is_read?: boolean
          created_at?: string
        }
      }
      cache: {
        Row: {
          key: string
          data: Json
          created_at: string
        }
        Insert: {
          key: string
          data: Json
          created_at?: string
        }
        Update: {
          key?: string
          data?: Json
          created_at?: string
        }
      }
      sms_logs: {
        Row: {
          id: string
          phone_number: string
          message: string
          complaint_id: string | null
          user_id: string | null
          message_id: string | null
          status: string | null
          sent_at: string
        }
        Insert: {
          id?: string
          phone_number: string
          message: string
          complaint_id?: string | null
          user_id?: string | null
          message_id?: string | null
          status?: string | null
          sent_at?: string
        }
        Update: {
          id?: string
          phone_number?: string
          message?: string
          complaint_id?: string | null
          user_id?: string | null
          message_id?: string | null
          status?: string | null
          sent_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'citizen' | 'authority' | 'admin' | 'ngo'
      complaint_category: 'sanitation' | 'infrastructure' | 'publicServices' | 'utilities' | 'transportation' | 'other'
      complaint_priority: 'low' | 'medium' | 'high' | 'urgent'
      complaint_status: 'pending' | 'inProgress' | 'resolved' | 'escalated' | 'closed'
      suggestion_status: 'active' | 'under_review' | 'implemented' | 'rejected'
      group_member_role: 'member' | 'moderator' | 'admin'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}