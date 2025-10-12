import api from './api'

export interface FileUploadResponse {
  success: boolean
  filePath?: string
  fileName?: string
  fileSize?: number
  fileType?: string
  url?: string
  error?: string
}

export interface MultipleFileUploadResponse {
  success: boolean
  filePaths?: string[]
  count?: number
  error?: string
}

export interface FileValidationResponse {
  valid: boolean
  fileName: string
  fileSize: number
  fileType: string
  error?: string
}

class FileUploadService {
  
  // Upload a single file
  async uploadFile(file: File, folder: string = 'general'): Promise<FileUploadResponse> {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', folder)

      const response = await api.post<FileUploadResponse>('/api/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      return response.data
    } catch (error: any) {
      console.error('File upload error:', error)
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error)
      } else {
        throw new Error('Failed to upload file. Please try again.')
      }
    }
  }

  // Upload multiple files
  async uploadMultipleFiles(files: File[], folder: string = 'general'): Promise<MultipleFileUploadResponse> {
    try {
      const formData = new FormData()
      files.forEach(file => {
        formData.append('files', file)
      })
      formData.append('folder', folder)

      const response = await api.post<MultipleFileUploadResponse>('/api/files/upload/multiple', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      return response.data
    } catch (error: any) {
      console.error('Multiple file upload error:', error)
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error)
      } else {
        throw new Error('Failed to upload files. Please try again.')
      }
    }
  }

  // Delete a file
  async deleteFile(filePath: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await api.delete(`/api/files/${encodeURIComponent(filePath)}`)
      return response.data
    } catch (error: any) {
      console.error('File delete error:', error)
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error)
      } else {
        throw new Error('Failed to delete file. Please try again.')
      }
    }
  }

  // Validate a file before upload
  async validateFile(file: File): Promise<FileValidationResponse> {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await api.post<FileValidationResponse>('/api/files/validate', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      return response.data
    } catch (error: any) {
      console.error('File validation error:', error)
      return {
        valid: false,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        error: 'Failed to validate file'
      }
    }
  }

  // Get file URL for download
  getFileDownloadUrl(filePath: string): string {
    const encodedPath = filePath.replace(/\//g, '%2F')
    return `${api.defaults.baseURL}/api/files/download/${encodedPath}`
  }

  // Get file URL for viewing
  getFileViewUrl(filePath: string): string {
    const encodedPath = filePath.replace(/\//g, '%2F')
    return `${api.defaults.baseURL}/api/files/view/${encodedPath}`
  }

  // Check if file type is allowed
  isAllowedFileType(file: File): boolean {
    const allowedTypes = [
      // Images
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp',
      // Documents
      'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain', 'application/rtf',
      // Videos
      'video/mp4', 'video/avi', 'video/quicktime', 'video/x-ms-wmv', 'video/webm',
      // Audio
      'audio/mpeg', 'audio/wav', 'audio/aac', 'audio/ogg'
    ]

    return allowedTypes.includes(file.type)
  }

  // Check if file size is allowed (10MB max)
  isAllowedFileSize(file: File, maxSize: number = 10 * 1024 * 1024): boolean {
    return file.size <= maxSize
  }

  // Format file size for display
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Get file extension
  getFileExtension(filename: string): string {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2)
  }

  // Check if file is an image
  isImageFile(file: File): boolean {
    return file.type.startsWith('image/')
  }

  // Check if file is a document
  isDocumentFile(file: File): boolean {
    const documentTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/rtf'
    ]
    return documentTypes.includes(file.type)
  }

  // Check if file is a video
  isVideoFile(file: File): boolean {
    return file.type.startsWith('video/')
  }

  // Check if file is audio
  isAudioFile(file: File): boolean {
    return file.type.startsWith('audio/')
  }
}

// Export singleton instance
export default new FileUploadService()