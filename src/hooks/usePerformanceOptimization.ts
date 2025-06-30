import { useCallback, useMemo, useRef, useEffect } from 'react'
import { debounce, throttle } from 'lodash-es'

// Performance optimization hook for search and filtering
export const useOptimizedSearch = (data: any[], searchTerm: string, delay = 300) => {
  const debouncedSearch = useMemo(
    () => debounce((term: string) => term, delay),
    [delay]
  )

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data
    
    const lowercaseSearch = searchTerm.toLowerCase()
    return data.filter(item => 
      Object.values(item).some(value => 
        String(value).toLowerCase().includes(lowercaseSearch)
      )
    )
  }, [data, debouncedSearch(searchTerm)])

  return filteredData
}

// Virtualization hook for large lists
export const useVirtualization = (itemCount: number, itemHeight: number, containerHeight: number) => {
  const scrollTop = useRef(0)
  const startIndex = Math.floor(scrollTop.current / itemHeight)
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    itemCount
  )

  const visibleItems = useMemo(() => ({
    startIndex,
    endIndex,
    offsetY: startIndex * itemHeight
  }), [startIndex, endIndex, itemHeight])

  const handleScroll = useCallback(
    throttle((e: React.UIEvent<HTMLDivElement>) => {
      scrollTop.current = e.currentTarget.scrollTop
    }, 16),
    []
  )

  return { visibleItems, handleScroll }
}

// Memory optimization for large datasets
export const useMemoizedData = <T>(data: T[], dependencies: any[]) => {
  return useMemo(() => data, dependencies)
}

// Intersection Observer for lazy loading
export const useIntersectionObserver = (
  callback: () => void,
  options: IntersectionObserverInit = {}
) => {
  const targetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const target = targetRef.current
    if (!target) return

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        callback()
      }
    }, options)

    observer.observe(target)

    return () => {
      observer.unobserve(target)
      observer.disconnect()
    }
  }, [callback, options])

  return targetRef
}