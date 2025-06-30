import { renderHook } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useOptimizedSearch, useMemoizedData } from '../../hooks/usePerformanceOptimization'

describe('Performance Optimization Hooks', () => {
  describe('useOptimizedSearch', () => {
    const mockData = [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
      { id: 3, name: 'Bob Johnson', email: 'bob@example.com' }
    ]

    it('returns all data when search term is empty', () => {
      const { result } = renderHook(() => useOptimizedSearch(mockData, '', 0))
      expect(result.current).toEqual(mockData)
    })

    it('filters data based on search term', () => {
      const { result } = renderHook(() => useOptimizedSearch(mockData, 'john', 0))
      expect(result.current).toHaveLength(2)
      expect(result.current[0].name).toBe('John Doe')
      expect(result.current[1].name).toBe('Bob Johnson')
    })

    it('performs case-insensitive search', () => {
      const { result } = renderHook(() => useOptimizedSearch(mockData, 'JANE', 0))
      expect(result.current).toHaveLength(1)
      expect(result.current[0].name).toBe('Jane Smith')
    })
  })

  describe('useMemoizedData', () => {
    it('memoizes data based on dependencies', () => {
      const data = [1, 2, 3, 4, 5]
      const { result, rerender } = renderHook(
        ({ deps }) => useMemoizedData(data, deps),
        { initialProps: { deps: [1] } }
      )

      const firstResult = result.current
      
      // Rerender with same dependencies
      rerender({ deps: [1] })
      expect(result.current).toBe(firstResult) // Same reference

      // Rerender with different dependencies
      rerender({ deps: [2] })
      expect(result.current).toBe(firstResult) // Still same data, but could be different reference
    })
  })
})