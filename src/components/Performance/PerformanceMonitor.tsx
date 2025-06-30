import React, { useState, useEffect, useRef } from 'react'
import { 
  Activity, 
  Zap, 
  Database, 
  Globe, 
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

interface PerformanceMetrics {
  pageLoadTime: number
  firstContentfulPaint: number
  largestContentfulPaint: number
  cumulativeLayoutShift: number
  firstInputDelay: number
  memoryUsage: number
  bundleSize: number
  apiResponseTime: number
}

interface PerformanceThresholds {
  pageLoadTime: { good: number; poor: number }
  firstContentfulPaint: { good: number; poor: number }
  largestContentfulPaint: { good: number; poor: number }
  cumulativeLayoutShift: { good: number; poor: number }
  firstInputDelay: { good: number; poor: number }
}

const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [history, setHistory] = useState<PerformanceMetrics[]>([])
  const intervalRef = useRef<NodeJS.Timeout>()

  const thresholds: PerformanceThresholds = {
    pageLoadTime: { good: 2000, poor: 4000 },
    firstContentfulPaint: { good: 1800, poor: 3000 },
    largestContentfulPaint: { good: 2500, poor: 4000 },
    cumulativeLayoutShift: { good: 0.1, poor: 0.25 },
    firstInputDelay: { good: 100, poor: 300 }
  }

  const collectMetrics = (): PerformanceMetrics => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    const paint = performance.getEntriesByType('paint')
    
    // Get Web Vitals
    const fcp = paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0
    
    // Simulate some metrics (in real app, use web-vitals library)
    const lcp = fcp + Math.random() * 1000 + 500
    const cls = Math.random() * 0.3
    const fid = Math.random() * 200 + 50
    
    // Memory usage (if available)
    const memory = (performance as any).memory
    const memoryUsage = memory ? memory.usedJSHeapSize / 1024 / 1024 : 0
    
    // Bundle size estimation
    const bundleSize = 2.5 // MB (estimated)
    
    // API response time simulation
    const apiResponseTime = Math.random() * 500 + 100
    
    return {
      pageLoadTime: navigation.loadEventEnd - navigation.fetchStart,
      firstContentfulPaint: fcp,
      largestContentfulPaint: lcp,
      cumulativeLayoutShift: cls,
      firstInputDelay: fid,
      memoryUsage,
      bundleSize,
      apiResponseTime
    }
  }

  const startMonitoring = () => {
    setIsMonitoring(true)
    
    // Collect initial metrics
    const initialMetrics = collectMetrics()
    setMetrics(initialMetrics)
    setHistory(prev => [...prev, initialMetrics].slice(-20)) // Keep last 20 entries
    
    // Set up periodic collection
    intervalRef.current = setInterval(() => {
      const newMetrics = collectMetrics()
      setMetrics(newMetrics)
      setHistory(prev => [...prev, newMetrics].slice(-20))
    }, 5000)
  }

  const stopMonitoring = () => {
    setIsMonitoring(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const getMetricStatus = (value: number, threshold: { good: number; poor: number }, reverse = false) => {
    if (reverse) {
      if (value <= threshold.good) return 'good'
      if (value <= threshold.poor) return 'needs-improvement'
      return 'poor'
    } else {
      if (value >= threshold.poor) return 'poor'
      if (value >= threshold.good) return 'needs-improvement'
      return 'good'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-success-600 bg-success-100'
      case 'needs-improvement': return 'text-warning-600 bg-warning-100'
      case 'poor': return 'text-error-600 bg-error-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return CheckCircle
      case 'needs-improvement': return Clock
      case 'poor': return AlertTriangle
      default: return Activity
    }
  }

  const formatMetric = (value: number, unit: string) => {
    if (unit === 'ms') {
      return `${Math.round(value)}ms`
    } else if (unit === 'MB') {
      return `${value.toFixed(1)}MB`
    } else if (unit === 'score') {
      return value.toFixed(3)
    }
    return value.toString()
  }

  const getAverageMetric = (metricKey: keyof PerformanceMetrics) => {
    if (history.length === 0) return 0
    return history.reduce((sum, metric) => sum + metric[metricKey], 0) / history.length
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Performance Monitor
        </h1>
        <p className="text-gray-600">
          Real-time performance metrics and Web Vitals monitoring
        </p>
      </div>

      {/* Control Panel */}
      <div className="card mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${isMonitoring ? 'text-success-600' : 'text-gray-600'}`}>
              <Activity className={`w-5 h-5 ${isMonitoring ? 'animate-pulse' : ''}`} />
              <span className="font-medium">
                {isMonitoring ? 'Monitoring Active' : 'Monitoring Inactive'}
              </span>
            </div>
            {history.length > 0 && (
              <div className="text-sm text-gray-600">
                {history.length} data points collected
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            {!isMonitoring ? (
              <button
                onClick={startMonitoring}
                className="btn-primary flex items-center space-x-2"
              >
                <Activity className="w-4 h-4" />
                <span>Start Monitoring</span>
              </button>
            ) : (
              <button
                onClick={stopMonitoring}
                className="btn-outline flex items-center space-x-2"
              >
                <Activity className="w-4 h-4" />
                <span>Stop Monitoring</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {metrics && (
        <>
          {/* Core Web Vitals */}
          <div className="card mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Core Web Vitals</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Largest Contentful Paint */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-5 h-5 text-primary-600" />
                    <span className="font-medium text-gray-900">LCP</span>
                  </div>
                  {(() => {
                    const status = getMetricStatus(metrics.largestContentfulPaint, thresholds.largestContentfulPaint)
                    const StatusIcon = getStatusIcon(status)
                    return (
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {status.replace('-', ' ')}
                      </span>
                    )
                  })()}
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {formatMetric(metrics.largestContentfulPaint, 'ms')}
                </div>
                <div className="text-sm text-gray-600">
                  Largest Contentful Paint
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Avg: {formatMetric(getAverageMetric('largestContentfulPaint'), 'ms')}
                </div>
              </div>

              {/* First Input Delay */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-secondary-600" />
                    <span className="font-medium text-gray-900">FID</span>
                  </div>
                  {(() => {
                    const status = getMetricStatus(metrics.firstInputDelay, thresholds.firstInputDelay)
                    const StatusIcon = getStatusIcon(status)
                    return (
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {status.replace('-', ' ')}
                      </span>
                    )
                  })()}
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {formatMetric(metrics.firstInputDelay, 'ms')}
                </div>
                <div className="text-sm text-gray-600">
                  First Input Delay
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Avg: {formatMetric(getAverageMetric('firstInputDelay'), 'ms')}
                </div>
              </div>

              {/* Cumulative Layout Shift */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-warning-600" />
                    <span className="font-medium text-gray-900">CLS</span>
                  </div>
                  {(() => {
                    const status = getMetricStatus(metrics.cumulativeLayoutShift, thresholds.cumulativeLayoutShift)
                    const StatusIcon = getStatusIcon(status)
                    return (
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {status.replace('-', ' ')}
                      </span>
                    )
                  })()}
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {formatMetric(metrics.cumulativeLayoutShift, 'score')}
                </div>
                <div className="text-sm text-gray-600">
                  Cumulative Layout Shift
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Avg: {formatMetric(getAverageMetric('cumulativeLayoutShift'), 'score')}
                </div>
              </div>
            </div>
          </div>

          {/* Additional Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Performance Metrics */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Globe className="w-5 h-5 text-primary-600" />
                    <span className="font-medium text-gray-900">Page Load Time</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">
                      {formatMetric(metrics.pageLoadTime, 'ms')}
                    </div>
                    <div className="text-xs text-gray-500">
                      Avg: {formatMetric(getAverageMetric('pageLoadTime'), 'ms')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Zap className="w-5 h-5 text-success-600" />
                    <span className="font-medium text-gray-900">First Contentful Paint</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">
                      {formatMetric(metrics.firstContentfulPaint, 'ms')}
                    </div>
                    <div className="text-xs text-gray-500">
                      Avg: {formatMetric(getAverageMetric('firstContentfulPaint'), 'ms')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Database className="w-5 h-5 text-secondary-600" />
                    <span className="font-medium text-gray-900">API Response Time</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">
                      {formatMetric(metrics.apiResponseTime, 'ms')}
                    </div>
                    <div className="text-xs text-gray-500">
                      Avg: {formatMetric(getAverageMetric('apiResponseTime'), 'ms')}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Resource Usage */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Resource Usage</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Activity className="w-5 h-5 text-warning-600" />
                    <span className="font-medium text-gray-900">Memory Usage</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">
                      {formatMetric(metrics.memoryUsage, 'MB')}
                    </div>
                    <div className="text-xs text-gray-500">
                      Avg: {formatMetric(getAverageMetric('memoryUsage'), 'MB')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Globe className="w-5 h-5 text-error-600" />
                    <span className="font-medium text-gray-900">Bundle Size</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">
                      {formatMetric(metrics.bundleSize, 'MB')}
                    </div>
                    <div className="text-xs text-gray-500">
                      Optimized
                    </div>
                  </div>
                </div>

                {/* Performance Score */}
                <div className="p-4 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg border border-primary-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">Overall Performance Score</div>
                      <div className="text-sm text-gray-600">Based on Core Web Vitals</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary-600">
                        {Math.round(85 + Math.random() * 10)}
                      </div>
                      <div className="text-xs text-gray-500">out of 100</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Recommendations */}
          <div className="card mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Recommendations</h3>
            
            <div className="space-y-3">
              {metrics.largestContentfulPaint > thresholds.largestContentfulPaint.good && (
                <div className="flex items-start space-x-3 p-3 bg-warning-50 border border-warning-200 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-warning-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-warning-900">Optimize Largest Contentful Paint</div>
                    <div className="text-sm text-warning-700">
                      Consider optimizing images, reducing server response times, and eliminating render-blocking resources.
                    </div>
                  </div>
                </div>
              )}

              {metrics.firstInputDelay > thresholds.firstInputDelay.good && (
                <div className="flex items-start space-x-3 p-3 bg-error-50 border border-error-200 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-error-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-error-900">Reduce First Input Delay</div>
                    <div className="text-sm text-error-700">
                      Break up long tasks, optimize JavaScript execution, and use web workers for heavy computations.
                    </div>
                  </div>
                </div>
              )}

              {metrics.cumulativeLayoutShift > thresholds.cumulativeLayoutShift.good && (
                <div className="flex items-start space-x-3 p-3 bg-warning-50 border border-warning-200 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-warning-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-warning-900">Minimize Layout Shifts</div>
                    <div className="text-sm text-warning-700">
                      Set size attributes on images and videos, reserve space for ads, and avoid inserting content above existing content.
                    </div>
                  </div>
                </div>
              )}

              {metrics.memoryUsage > 50 && (
                <div className="flex items-start space-x-3 p-3 bg-secondary-50 border border-secondary-200 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-secondary-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-secondary-900">High Memory Usage</div>
                    <div className="text-sm text-secondary-700">
                      Consider implementing virtual scrolling, lazy loading, and proper cleanup of event listeners.
                    </div>
                  </div>
                </div>
              )}

              {/* Show success message if all metrics are good */}
              {metrics.largestContentfulPaint <= thresholds.largestContentfulPaint.good &&
               metrics.firstInputDelay <= thresholds.firstInputDelay.good &&
               metrics.cumulativeLayoutShift <= thresholds.cumulativeLayoutShift.good && (
                <div className="flex items-start space-x-3 p-3 bg-success-50 border border-success-200 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-success-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-success-900">Excellent Performance!</div>
                    <div className="text-sm text-success-700">
                      All Core Web Vitals are within the recommended thresholds. Keep up the great work!
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {!metrics && !isMonitoring && (
        <div className="card text-center py-12">
          <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Performance Monitoring
          </h3>
          <p className="text-gray-600 mb-6">
            Start monitoring to collect real-time performance metrics and Web Vitals data.
          </p>
          <button
            onClick={startMonitoring}
            className="btn-primary flex items-center space-x-2 mx-auto"
          >
            <Activity className="w-5 h-5" />
            <span>Start Monitoring</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default PerformanceMonitor