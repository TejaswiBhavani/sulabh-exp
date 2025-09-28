import { describe, it, expect } from 'vitest'
import { 
  sanitizeInput, 
  validateEmail, 
  validatePhone, 
  validateComplaintId,
  validateFileType,
  validateFileSize
} from '../../utils/securityUtils'

describe('Security Utils', () => {
  describe('sanitizeInput', () => {
    it('removes HTML tags from input', () => {
      const maliciousInput = '<script>alert("xss")</script>Hello'
      const sanitized = sanitizeInput(maliciousInput)
      expect(sanitized).toBe('Hello')
    })

    it('handles empty input', () => {
      expect(sanitizeInput('')).toBe('')
    })
  })

  describe('validateEmail', () => {
    it('validates correct email addresses', () => {
      expect(validateEmail('user@example.com')).toBe(true)
      expect(validateEmail('test.email+tag@domain.co.uk')).toBe(true)
    })

    it('rejects invalid email addresses', () => {
      expect(validateEmail('invalid-email')).toBe(false)
      expect(validateEmail('@domain.com')).toBe(false)
      expect(validateEmail('user@')).toBe(false)
    })

    it('rejects emails that are too long', () => {
      const longEmail = 'a'.repeat(250) + '@example.com'
      expect(validateEmail(longEmail)).toBe(false)
    })
  })

  describe('validatePhone', () => {
    it('validates correct phone numbers', () => {
      expect(validatePhone('+1234567890')).toBe(true)
      expect(validatePhone('123-456-7890')).toBe(true)
      expect(validatePhone('(123) 456-7890')).toBe(true)
    })

    it('rejects invalid phone numbers', () => {
      expect(validatePhone('123')).toBe(false)
      expect(validatePhone('abc-def-ghij')).toBe(false)
    })
  })

  describe('validateComplaintId', () => {
    it('validates correct UUID format', () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000'
      expect(validateComplaintId(validUuid)).toBe(true)
    })

    it('rejects invalid UUID format', () => {
      expect(validateComplaintId('invalid-uuid')).toBe(false)
      expect(validateComplaintId('123-456-789')).toBe(false)
    })
  })

  describe('validateFileType', () => {
    it('validates allowed file types', () => {
      const imageFile = new File([''], 'test.jpg', { type: 'image/jpeg' })
      expect(validateFileType(imageFile, ['image/*'])).toBe(true)
      
      const pdfFile = new File([''], 'test.pdf', { type: 'application/pdf' })
      expect(validateFileType(pdfFile, ['application/pdf'])).toBe(true)
    })

    it('rejects disallowed file types', () => {
      const execFile = new File([''], 'test.exe', { type: 'application/x-executable' })
      expect(validateFileType(execFile, ['image/*', 'application/pdf'])).toBe(false)
    })
  })

  describe('validateFileSize', () => {
    it('validates files within size limit', () => {
      const smallFile = new File(['a'.repeat(1000)], 'test.txt', { type: 'text/plain' })
      expect(validateFileSize(smallFile, 2000)).toBe(true)
    })

    it('rejects files exceeding size limit', () => {
      const largeFile = new File(['a'.repeat(3000)], 'test.txt', { type: 'text/plain' })
      expect(validateFileSize(largeFile, 2000)).toBe(false)
    })
  })
})