import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import TestSuite from '../../components/Testing/TestSuite'

describe('TestSuite', () => {
  it('renders test suite interface', () => {
    render(<TestSuite />)
    
    expect(screen.getByText('SULABH Testing Suite')).toBeInTheDocument()
    expect(screen.getByText('Run All Tests')).toBeInTheDocument()
    expect(screen.getByText('Reset Tests')).toBeInTheDocument()
  })

  it('displays test statistics', () => {
    render(<TestSuite />)
    
    expect(screen.getByText('Total Tests')).toBeInTheDocument()
    expect(screen.getByText('Passed')).toBeInTheDocument()
    expect(screen.getByText('Failed')).toBeInTheDocument()
    expect(screen.getByText('Running')).toBeInTheDocument()
    expect(screen.getByText('Pending')).toBeInTheDocument()
  })

  it('shows test categories', () => {
    render(<TestSuite />)
    
    expect(screen.getByText('Security Tests')).toBeInTheDocument()
    expect(screen.getByText('Performance Tests')).toBeInTheDocument()
    expect(screen.getByText('Accessibility Tests')).toBeInTheDocument()
    expect(screen.getByText('Functionality Tests')).toBeInTheDocument()
  })

  it('runs tests when button is clicked', async () => {
    render(<TestSuite />)
    
    const runButton = screen.getByText('Run All Tests')
    fireEvent.click(runButton)
    
    await waitFor(() => {
      expect(screen.getByText('Running Tests...')).toBeInTheDocument()
    })
  })

  it('resets tests when reset button is clicked', () => {
    render(<TestSuite />)
    
    const resetButton = screen.getByText('Reset Tests')
    fireEvent.click(resetButton)
    
    // All tests should be in pending state
    expect(screen.getAllByText('PENDING')).toHaveLength(16) // 4 categories × 4 tests each
  })
})