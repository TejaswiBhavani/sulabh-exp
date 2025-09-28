import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  MessageSquare, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Send
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useNotifications, smsTemplates } from '../../contexts/NotificationContext'
import { ComplaintStatus } from '../../types'
import FileUpload from '../Common/FileUpload'
import toast from 'react-hot-toast'

const updateSchema = z.object({
  message: z.string().min(10, 'Message must be at least 10 characters'),
  status: z.enum(['pending', 'inProgress', 'resolved', 'escalated', 'closed']),
  sendSmsNotification: z.boolean().optional()
})

type UpdateFormData = z.infer<typeof updateSchema>

interface ComplaintUpdateFormProps {
  complaintId: string
  currentStatus: ComplaintStatus
  userId: string
  subject: string
  onUpdateAdded: () => void
}

const ComplaintUpdateForm: React.FC<ComplaintUpdateFormProps> = ({
  complaintId,
  currentStatus,
  userId,
  subject,
  onUpdateAdded
}) => {
  const { user } = useAuth()
  const { sendNotification, sendSMSNotification } = useNotifications()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [attachments, setAttachments] = useState<any[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<UpdateFormData>({
    resolver: zodResolver(updateSchema),
    defaultValues: {
      status: currentStatus,
      sendSmsNotification: false
    }
  })

  const selectedStatus = watch('status')
  const sendSmsNotification = watch('sendSmsNotification')

  const handleFilesUploaded = (files: any[]) => {
    setAttachments(files)
  }

  const getStatusIcon = (status: ComplaintStatus) => {
    switch (status) {
      case 'pending': return Clock
      case 'inProgress': return TrendingUp
      case 'resolved': return CheckCircle
      case 'escalated': return AlertCircle
      case 'closed': return CheckCircle
      default: return Clock
    }
  }

  const getStatusColor = (status: ComplaintStatus) => {
    switch (status) {
      case 'pending': return 'text-warning-600 bg-warning-100'
      case 'inProgress': return 'text-secondary-600 bg-secondary-100'
      case 'resolved': return 'text-success-600 bg-success-100'
      case 'escalated': return 'text-error-600 bg-error-100'
      case 'closed': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const onSubmit = async (data: UpdateFormData) => {
    if (!user) return

    try {
      setLoading(true)
      setError('')

      // Get user profile to check if phone notifications are enabled
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('phone, phone_notification_enabled')
        .eq('id', userId)
        .single()

      if (profileError) throw profileError

      // Add update to complaint_updates
      const { error: updateError } = await supabase
        .from('complaint_updates')
        .insert({
          complaint_id: complaintId,
          message: data.message,
          status: data.status,
          updated_by: user.id,
          attachments: attachments.map(file => file.url)
        })

      if (updateError) throw updateError

      // Update complaint status if changed
      if (data.status !== currentStatus) {
        const { error: statusError } = await supabase
          .from('complaints')
          .update({
            status: data.status,
            resolved_at: data.status === 'resolved' ? new Date().toISOString() : null
          })
          .eq('id', complaintId)

        if (statusError) throw statusError
      }

      // Send in-app notification
      await sendNotification(
        userId,
        'complaint_update',
        `Complaint Update: ${subject}`,
        `Your complaint has been updated to status: ${data.status}. Message: ${data.message}`,
        complaintId
      )

      // Send SMS notification if enabled
      if (
        sendSmsNotification && 
        userProfile.phone && 
        userProfile.phone_notification_enabled
      ) {
        const template = smsTemplates.statusUpdate
        await sendSMSNotification(userProfile.phone, template, {
          complaintId,
          status: data.status,
          message: data.message.substring(0, 50) + (data.message.length > 50 ? '...' : ''),
          userId
        })
      }

      toast.success('Update added successfully')
      reset()
      setAttachments([])
      onUpdateAdded()
    } catch (err: any) {
      setError(err.message || 'Failed to add update')
      toast.error('Failed to add update')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
        <MessageSquare className="w-5 h-5 text-primary-600" />
        <span>Add Update</span>
      </h3>

      {error && (
        <div className="mb-4 bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Status Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Update Status
          </label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {(['pending', 'inProgress', 'resolved', 'escalated', 'closed'] as const).map((status) => {
              const StatusIcon = getStatusIcon(status)
              return (
                <label key={status} className="relative">
                  <input
                    {...register('status')}
                    type="radio"
                    value={status}
                    className="sr-only peer"
                  />
                  <div className={`border-2 border-gray-200 rounded-lg p-3 cursor-pointer peer-checked:border-primary-500 peer-checked:bg-primary-50 hover:bg-gray-50 transition-colors duration-200 flex flex-col items-center space-y-1 ${
                    selectedStatus === status ? getStatusColor(status) : ''
                  }`}>
                    <StatusIcon className="w-5 h-5" />
                    <div className="text-xs font-medium capitalize">
                      {status === 'inProgress' ? 'In Progress' : status}
                    </div>
                  </div>
                </label>
              )
            })}
          </div>
          {errors.status && (
            <p className="mt-1 text-sm text-error-600">{errors.status.message}</p>
          )}
        </div>

        {/* Update Message */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Update Message
          </label>
          <textarea
            {...register('message')}
            rows={4}
            className="input-field resize-none"
            placeholder="Provide details about this update..."
          />
          {errors.message && (
            <p className="mt-1 text-sm text-error-600">{errors.message.message}</p>
          )}
        </div>

        {/* Attachments */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Attachments (Optional)
          </label>
          <FileUpload
            onFilesUploaded={handleFilesUploaded}
            maxFiles={3}
            maxSize={5 * 1024 * 1024} // 5MB
            bucket="complaint-attachments"
            folder={`updates/${complaintId}`}
            acceptedTypes={['image/*', '.pdf', '.doc', '.docx']}
          />
        </div>

        {/* SMS Notification Option */}
        <div className="flex items-center">
          <input
            {...register('sendSmsNotification')}
            type="checkbox"
            id="sendSmsNotification"
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label htmlFor="sendSmsNotification" className="ml-2 block text-sm text-gray-700">
            Send SMS notification to complainant
          </label>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center space-x-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Add Update</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ComplaintUpdateForm