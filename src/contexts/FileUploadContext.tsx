import React, { createContext, useContext, useState, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'

export interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  uploadedAt: Date
}

interface FileUploadContextType {
  uploadFile: (file: File, bucket: string, folder?: string) => Promise<UploadedFile>
  uploadMultipleFiles: (files: File[], bucket: string, folder?: string) => Promise<UploadedFile[]>
  deleteFile: (bucket: string, path: string) => Promise<void>
  getFileUrl: (bucket: string, path: string) => string
  loading: boolean
  uploadProgress: number
}

const FileUploadContext = createContext<FileUploadContextType | undefined>(undefined)

export const useFileUpload = () => {
  const context = useContext(FileUploadContext)
  if (context === undefined) {
    throw new Error('useFileUpload must be used within a FileUploadProvider')
  }
  return context
}

interface FileUploadProviderProps {
  children: ReactNode
}

export const FileUploadProvider: React.FC<FileUploadProviderProps> = ({ children }) => {
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const { user } = useAuth()

  const uploadFile = async (file: File, bucket: string, folder?: string): Promise<UploadedFile> => {
    if (!user) throw new Error('User not authenticated')

    setLoading(true)
    setUploadProgress(0)

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = folder ? `${folder}/${fileName}` : fileName

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) throw error

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)

      const uploadedFile: UploadedFile = {
        id: data.path,
        name: file.name,
        size: file.size,
        type: file.type,
        url: publicUrl,
        uploadedAt: new Date()
      }

      setUploadProgress(100)
      toast.success(`File "${file.name}" uploaded successfully`)

      return uploadedFile
    } catch (error: any) {
      console.error('Error uploading file:', error)
      toast.error(`Failed to upload file: ${error.message}`)
      throw new Error(error.message || 'Failed to upload file')
    } finally {
      setLoading(false)
      setTimeout(() => setUploadProgress(0), 1000)
    }
  }

  const uploadMultipleFiles = async (files: File[], bucket: string, folder?: string): Promise<UploadedFile[]> => {
    if (!user) throw new Error('User not authenticated')

    setLoading(true)
    const uploadedFiles: UploadedFile[] = []
    const totalFiles = files.length

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setUploadProgress(((i + 1) / totalFiles) * 100)

        const uploadedFile = await uploadFile(file, bucket, folder)
        uploadedFiles.push(uploadedFile)
      }

      toast.success(`Successfully uploaded ${files.length} files`)
      return uploadedFiles
    } catch (error: any) {
      console.error('Error uploading multiple files:', error)
      toast.error(`Failed to upload files: ${error.message}`)
      throw new Error(error.message || 'Failed to upload files')
    } finally {
      setLoading(false)
      setUploadProgress(0)
    }
  }

  const deleteFile = async (bucket: string, path: string): Promise<void> => {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path])

      if (error) throw error

      toast.success('File deleted successfully')
    } catch (error: any) {
      console.error('Error deleting file:', error)
      toast.error(`Failed to delete file: ${error.message}`)
      throw new Error(error.message || 'Failed to delete file')
    }
  }

  const getFileUrl = (bucket: string, path: string): string => {
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path)

    return publicUrl
  }

  const value: FileUploadContextType = {
    uploadFile,
    uploadMultipleFiles,
    deleteFile,
    getFileUrl,
    loading,
    uploadProgress
  }

  return (
    <FileUploadContext.Provider value={value}>
      {children}
    </FileUploadContext.Provider>
  )
}