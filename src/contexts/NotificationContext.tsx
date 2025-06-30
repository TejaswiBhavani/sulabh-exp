import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'

export interface Notification {
  id: string
  userId: string
  type: 'complaint_update' | 'complaint_assigned' | 'complaint_escalated' | 'complaint_resolved' | 'system_announcement'
  title: string
  message: string
  relatedId?: string // complaint ID, etc.
  isRead: boolean
  createdAt: Date
}

export interface EmailTemplate {
  type: string
  subject: string
  htmlContent: string
  textContent: string
}

export interface SMSTemplate {
  type: string
  content: string
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  sendNotification: (userId: string, type: string, title: string, message: string, relatedId?: string) => Promise<void>
  sendEmailNotification: (email: string, template: EmailTemplate, data: any) => Promise<void>
  sendSMSNotification: (phone: string, template: SMSTemplate, data: any) => Promise<void>
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (notificationId: string) => Promise<void>
  loading: boolean
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

interface NotificationProviderProps {
  children: ReactNode
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  const unreadCount = notifications.filter(n => !n.isRead).length

  useEffect(() => {
    if (user) {
      loadNotifications()
      subscribeToNotifications()
    } else {
      setNotifications([])
    }
  }, [user])

  const loadNotifications = async () => {
    if (!user) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      const formattedNotifications: Notification[] = data.map(notification => ({
        id: notification.id,
        userId: notification.user_id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        relatedId: notification.related_id || undefined,
        isRead: notification.is_read,
        createdAt: new Date(notification.created_at)
      }))

      setNotifications(formattedNotifications)
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const subscribeToNotifications = () => {
    if (!user) return

    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotification: Notification = {
            id: payload.new.id,
            userId: payload.new.user_id,
            type: payload.new.type,
            title: payload.new.title,
            message: payload.new.message,
            relatedId: payload.new.related_id || undefined,
            isRead: payload.new.is_read,
            createdAt: new Date(payload.new.created_at)
          }

          setNotifications(prev => [newNotification, ...prev])
          
          // Show toast notification
          // The 'description' property is not a standard option for react-hot-toast's success method.
          // The first argument is the message. If a more complex structure is needed,
          // a custom toast or React element should be used as the first argument.
          // For now, we'll just use the title as the main message.
          toast.success(newNotification.title)
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }

  const sendNotification = async (
    userId: string, 
    type: string, 
    title: string, 
    message: string, 
    relatedId?: string
  ): Promise<void> => {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type,
          title,
          message,
          related_id: relatedId || null,
          is_read: false
        })

      if (error) throw error
    } catch (error: any) {
      console.error('Error sending notification:', error)
      throw new Error(error.message || 'Failed to send notification')
    }
  }

  const sendEmailNotification = async (
    email: string, 
    template: EmailTemplate, 
    data: any
  ): Promise<void> => {
    try {
      // Call Supabase Edge Function for email sending
      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          to: email,
          subject: template.subject,
          html: template.htmlContent,
          text: template.textContent,
          data
        }
      })

      if (error) throw error
    } catch (error: any) {
      console.error('Error sending email:', error)
      throw new Error(error.message || 'Failed to send email')
    }
  }

  const sendSMSNotification = async (
    phone: string,
    template: SMSTemplate,
    data: any
  ): Promise<void> => {
    try {
      // Replace template variables
      let messageContent = template.content
      Object.entries(data).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`
        messageContent = messageContent.replace(new RegExp(placeholder, 'g'), String(value))
      })

      // Call Supabase Edge Function for SMS sending
      const { error } = await supabase.functions.invoke('send-sms', {
        body: {
          to: phone,
          body: messageContent,
          complaintId: data.complaintId,
          userId: data.userId
        }
      })

      if (error) throw error
    } catch (error: any) {
      console.error('Error sending SMS:', error)
      throw new Error(error.message || 'Failed to send SMS')
    }
  }

  const markAsRead = async (notificationId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

      if (error) throw error

      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, isRead: true }
            : notification
        )
      )
    } catch (error: any) {
      console.error('Error marking notification as read:', error)
      throw new Error(error.message || 'Failed to mark notification as read')
    }
  }

  const markAllAsRead = async (): Promise<void> => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (error) throw error

      setNotifications(prev => 
        prev.map(notification => ({ ...notification, isRead: true }))
      )
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error)
      throw new Error(error.message || 'Failed to mark all notifications as read')
    }
  }

  const deleteNotification = async (notificationId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) throw error

      setNotifications(prev => 
        prev.filter(notification => notification.id !== notificationId)
      )
    } catch (error: any) {
      console.error('Error deleting notification:', error)
      throw new Error(error.message || 'Failed to delete notification')
    }
  }

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    sendNotification,
    sendEmailNotification,
    sendSMSNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loading
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

// Email Templates
export const emailTemplates = {
  complaintSubmitted: {
    type: 'complaint_submitted',
    subject: 'Complaint Submitted Successfully - SULABH',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #ea580c; color: white; padding: 20px; text-align: center;">
          <h1>SULABH</h1>
          <p>Online Grievance Redressal System</p>
        </div>
        <div style="padding: 20px;">
          <h2>Complaint Submitted Successfully</h2>
          <p>Dear {{userName}},</p>
          <p>Your complaint has been successfully submitted to our system. Here are the details:</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Complaint ID:</strong> {{complaintId}}</p>
            <p><strong>Subject:</strong> {{subject}}</p>
            <p><strong>Category:</strong> {{category}}</p>
            <p><strong>Priority:</strong> {{priority}}</p>
            <p><strong>Submitted On:</strong> {{submittedAt}}</p>
          </div>
          <p>You can track the status of your complaint using the complaint ID above.</p>
          <p>We will keep you updated on the progress of your complaint.</p>
          <p>Thank you for using SULABH.</p>
        </div>
        <div style="background-color: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
          <p>This is an automated email. Please do not reply to this email.</p>
          <p>© 2024 SULABH - Online Grievance Redressal System</p>
        </div>
      </div>
    `,
    textContent: `
      SULABH - Online Grievance Redressal System
      
      Complaint Submitted Successfully
      
      Dear {{userName}},
      
      Your complaint has been successfully submitted to our system.
      
      Complaint Details:
      - Complaint ID: {{complaintId}}
      - Subject: {{subject}}
      - Category: {{category}}
      - Priority: {{priority}}
      - Submitted On: {{submittedAt}}
      
      You can track the status of your complaint using the complaint ID above.
      We will keep you updated on the progress of your complaint.
      
      Thank you for using SULABH.
    `
  },

  complaintUpdated: {
    type: 'complaint_updated',
    subject: 'Complaint Update - SULABH',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #ea580c; color: white; padding: 20px; text-align: center;">
          <h1>SULABH</h1>
          <p>Online Grievance Redressal System</p>
        </div>
        <div style="padding: 20px;">
          <h2>Complaint Status Update</h2>
          <p>Dear {{userName}},</p>
          <p>There has been an update to your complaint:</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Complaint ID:</strong> {{complaintId}}</p>
            <p><strong>Subject:</strong> {{subject}}</p>
            <p><strong>New Status:</strong> <span style="color: #16a34a; font-weight: bold;">{{status}}</span></p>
            <p><strong>Update Message:</strong> {{updateMessage}}</p>
            <p><strong>Updated By:</strong> {{updatedBy}}</p>
            <p><strong>Updated On:</strong> {{updatedAt}}</p>
          </div>
          <p>You can view the complete details and history of your complaint by logging into your SULABH account.</p>
          <p>Thank you for your patience.</p>
        </div>
        <div style="background-color: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
          <p>This is an automated email. Please do not reply to this email.</p>
          <p>© 2024 SULABH - Online Grievance Redressal System</p>
        </div>
      </div>
    `,
    textContent: `
      SULABH - Online Grievance Redressal System
      
      Complaint Status Update
      
      Dear {{userName}},
      
      There has been an update to your complaint:
      
      - Complaint ID: {{complaintId}}
      - Subject: {{subject}}
      - New Status: {{status}}
      - Update Message: {{updateMessage}}
      - Updated By: {{updatedBy}}
      - Updated On: {{updatedAt}}
      
      You can view the complete details and history of your complaint by logging into your SULABH account.
      
      Thank you for your patience.
    `
  },

  complaintEscalated: {
    type: 'complaint_escalated',
    subject: 'Complaint Escalated - SULABH',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #dc2626; color: white; padding: 20px; text-align: center;">
          <h1>SULABH</h1>
          <p>Online Grievance Redressal System</p>
        </div>
        <div style="padding: 20px;">
          <h2>Complaint Escalated</h2>
          <p>Dear {{userName}},</p>
          <p>Your complaint has been escalated for priority attention:</p>
          <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
            <p><strong>Complaint ID:</strong> {{complaintId}}</p>
            <p><strong>Subject:</strong> {{subject}}</p>
            <p><strong>Escalation Reason:</strong> {{escalationReason}}</p>
            <p><strong>Escalated On:</strong> {{escalatedAt}}</p>
          </div>
          <p>Your complaint is now receiving priority attention from our senior team members. We apologize for any delay and are committed to resolving this matter promptly.</p>
          <p>You will receive updates as we work on your complaint.</p>
        </div>
        <div style="background-color: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
          <p>This is an automated email. Please do not reply to this email.</p>
          <p>© 2024 SULABH - Online Grievance Redressal System</p>
        </div>
      </div>
    `,
    textContent: `
      SULABH - Online Grievance Redressal System
      
      Complaint Escalated
      
      Dear {{userName}},
      
      Your complaint has been escalated for priority attention:
      
      - Complaint ID: {{complaintId}}
      - Subject: {{subject}}
      - Escalation Reason: {{escalationReason}}
      - Escalated On: {{escalatedAt}}
      
      Your complaint is now receiving priority attention from our senior team members.
      We apologize for any delay and are committed to resolving this matter promptly.
      
      You will receive updates as we work on your complaint.
    `
  },

  complaintResolved: {
    type: 'complaint_resolved',
    subject: 'Complaint Resolved - SULABH',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #16a34a; color: white; padding: 20px; text-align: center;">
          <h1>SULABH</h1>
          <p>Online Grievance Redressal System</p>
        </div>
        <div style="padding: 20px;">
          <h2>Complaint Resolved</h2>
          <p>Dear {{userName}},</p>
          <p>We are pleased to inform you that your complaint has been resolved:</p>
          <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0;">
            <p><strong>Complaint ID:</strong> {{complaintId}}</p>
            <p><strong>Subject:</strong> {{subject}}</p>
            <p><strong>Resolution Details:</strong> {{resolutionDetails}}</p>
            <p><strong>Resolved On:</strong> {{resolvedAt}}</p>
            <p><strong>Resolution Time:</strong> {{resolutionTime}} days</p>
          </div>
          <p>We would appreciate your feedback on how we handled your complaint. Please log into your SULABH account to provide a rating and comments.</p>
          <p>Thank you for using SULABH and helping us improve our services.</p>
        </div>
        <div style="background-color: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
          <p>This is an automated email. Please do not reply to this email.</p>
          <p>© 2024 SULABH - Online Grievance Redressal System</p>
        </div>
      </div>
    `,
    textContent: `
      SULABH - Online Grievance Redressal System
      
      Complaint Resolved
      
      Dear {{userName}},
      
      We are pleased to inform you that your complaint has been resolved:
      
      - Complaint ID: {{complaintId}}
      - Subject: {{subject}}
      - Resolution Details: {{resolutionDetails}}
      - Resolved On: {{resolvedAt}}
      - Resolution Time: {{resolutionTime}} days
      
      We would appreciate your feedback on how we handled your complaint.
      Please log into your SULABH account to provide a rating and comments.
      
      Thank you for using SULABH and helping us improve our services.
    `
  }
}

// SMS Templates
export const smsTemplates = {
  complaintSubmitted: {
    type: 'complaint_submitted',
    content: 'SULABH: Your complaint (ID: {{complaintId}}) has been submitted successfully. Track status at sulabh.gov.in/track'
  },
  
  statusUpdate: {
    type: 'status_update',
    content: 'SULABH: Your complaint (ID: {{complaintId}}) status is now {{status}}. {{message}}'
  },
  
  complaintResolved: {
    type: 'complaint_resolved',
    content: 'SULABH: Good news! Your complaint (ID: {{complaintId}}) has been resolved. Please login to provide feedback.'
  },
  
  complaintEscalated: {
    type: 'complaint_escalated',
    content: 'SULABH: Your complaint (ID: {{complaintId}}) has been escalated for priority attention. We will update you soon.'
  }
}