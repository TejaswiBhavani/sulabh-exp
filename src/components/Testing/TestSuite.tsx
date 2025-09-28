import React, { useState } from 'react'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Play, 
  RefreshCw,
  AlertTriangle,
  Shield,
  Zap,
  Users
} from 'lucide-react'

interface TestResult {
  id: string
  name: string
  category: 'security' | 'performance' | 'accessibility' | 'functionality'
  status: 'pending' | 'running' | 'passed' | 'failed'
  duration?: number
  error?: string
  details?: string
}

const TestSuite: React.FC = () => {
  const [tests, setTests] = useState<TestResult[]>([
    // Security Tests
    {
      id: 'sec-1',
      name: 'Input Sanitization',
      category: 'security',
      status: 'pending'
    },
    {
      id: 'sec-2',
      name: 'XSS Protection',
      category: 'security',
      status: 'pending'
    },
    {
      id: 'sec-3',
      name: 'File Upload Validation',
      category: 'security',
      status: 'pending'
    },
    {
      id: 'sec-4',
      name: 'Rate Limiting',
      category: 'security',
      status: 'pending'
    },
    
    // Performance Tests
    {
      id: 'perf-1',
      name: 'Page Load Time',
      category: 'performance',
      status: 'pending'
    },
    {
      id: 'perf-2',
      name: 'Database Query Optimization',
      category: 'performance',
      status: 'pending'
    },
    {
      id: 'perf-3',
      name: 'Memory Usage',
      category: 'performance',
      status: 'pending'
    },
    {
      id: 'perf-4',
      name: 'Bundle Size Analysis',
      category: 'performance',
      status: 'pending'
    },
    
    // Accessibility Tests
    {
      id: 'a11y-1',
      name: 'Keyboard Navigation',
      category: 'accessibility',
      status: 'pending'
    },
    {
      id: 'a11y-2',
      name: 'Screen Reader Compatibility',
      category: 'accessibility',
      status: 'pending'
    },
    {
      id: 'a11y-3',
      name: 'Color Contrast Ratio',
      category: 'accessibility',
      status: 'pending'
    },
    {
      id: 'a11y-4',
      name: 'ARIA Labels',
      category: 'accessibility',
      status: 'pending'
    },
    
    // Functionality Tests
    {
      id: 'func-1',
      name: 'User Authentication',
      category: 'functionality',
      status: 'pending'
    },
    {
      id: 'func-2',
      name: 'Complaint Submission',
      category: 'functionality',
      status: 'pending'
    },
    {
      id: 'func-3',
      name: 'Suggestion System',
      category: 'functionality',
      status: 'pending'
    },
    {
      id: 'func-4',
      name: 'Report Generation',
      category: 'functionality',
      status: 'pending'
    }
  ])

  const [isRunning, setIsRunning] = useState(false)
  const [currentTest, setCurrentTest] = useState<string | null>(null)

  const runTest = async (testId: string): Promise<TestResult> => {
    const test = tests.find(t => t.id === testId)!
    const startTime = Date.now()
    
    setCurrentTest(testId)
    
    // Simulate test execution
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500))
    
    const duration = Date.now() - startTime
    const success = Math.random() > 0.2 // 80% success rate for demo
    
    return {
      ...test,
      status: success ? 'passed' : 'failed',
      duration,
      error: success ? undefined : 'Test failed due to validation error',
      details: success ? 'All checks passed successfully' : 'Failed validation checks'
    }
  }

  const runAllTests = async () => {
    setIsRunning(true)
    
    for (const test of tests) {
      setTests(prev => prev.map(t => 
        t.id === test.id ? { ...t, status: 'running' } : t
      ))
      
      const result = await runTest(test.id)
      
      setTests(prev => prev.map(t => 
        t.id === test.id ? result : t
      ))
    }
    
    setCurrentTest(null)
    setIsRunning(false)
  }

  const resetTests = () => {
    setTests(prev => prev.map(test => ({
      ...test,
      status: 'pending',
      duration: undefined,
      error: undefined,
      details: undefined
    })))
    setCurrentTest(null)
    setIsRunning(false)
  }

  const getTestStats = () => {
    const passed = tests.filter(t => t.status === 'passed').length
    const failed = tests.filter(t => t.status === 'failed').length
    const pending = tests.filter(t => t.status === 'pending').length
    const running = tests.filter(t => t.status === 'running').length
    
    return { passed, failed, pending, running, total: tests.length }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'security': return Shield
      case 'performance': return Zap
      case 'accessibility': return Users
      case 'functionality': return CheckCircle
      default: return CheckCircle
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'security': return 'text-error-600 bg-error-100'
      case 'performance': return 'text-warning-600 bg-warning-100'
      case 'accessibility': return 'text-secondary-600 bg-secondary-100'
      case 'functionality': return 'text-success-600 bg-success-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return CheckCircle
      case 'failed': return XCircle
      case 'running': return RefreshCw
      default: return Clock
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'text-success-600'
      case 'failed': return 'text-error-600'
      case 'running': return 'text-secondary-600'
      default: return 'text-gray-400'
    }
  }

  const stats = getTestStats()

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          SULABH Testing Suite
        </h1>
        <p className="text-gray-600">
          Comprehensive testing for security, performance, accessibility, and functionality
        </p>
      </div>

      {/* Test Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="card">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Tests</div>
          </div>
        </div>
        
        <div className="card">
          <div className="text-center">
            <div className="text-2xl font-bold text-success-600">{stats.passed}</div>
            <div className="text-sm text-gray-600">Passed</div>
          </div>
        </div>
        
        <div className="card">
          <div className="text-center">
            <div className="text-2xl font-bold text-error-600">{stats.failed}</div>
            <div className="text-sm text-gray-600">Failed</div>
          </div>
        </div>
        
        <div className="card">
          <div className="text-center">
            <div className="text-2xl font-bold text-secondary-600">{stats.running}</div>
            <div className="text-sm text-gray-600">Running</div>
          </div>
        </div>
        
        <div className="card">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center space-x-4 mb-8">
        <button
          onClick={runAllTests}
          disabled={isRunning}
          className="btn-primary flex items-center space-x-2"
        >
          {isRunning ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Play className="w-5 h-5" />
          )}
          <span>{isRunning ? 'Running Tests...' : 'Run All Tests'}</span>
        </button>
        
        <button
          onClick={resetTests}
          disabled={isRunning}
          className="btn-outline flex items-center space-x-2"
        >
          <RefreshCw className="w-5 h-5" />
          <span>Reset Tests</span>
        </button>
      </div>

      {/* Test Results by Category */}
      {['security', 'performance', 'accessibility', 'functionality'].map(category => {
        const categoryTests = tests.filter(t => t.category === category)
        const CategoryIcon = getCategoryIcon(category)
        
        return (
          <div key={category} className="card mb-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className={`p-2 rounded-lg ${getCategoryColor(category)}`}>
                <CategoryIcon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 capitalize">
                {category} Tests
              </h3>
              <span className="text-sm text-gray-500">
                ({categoryTests.filter(t => t.status === 'passed').length}/{categoryTests.length} passed)
              </span>
            </div>
            
            <div className="space-y-3">
              {categoryTests.map(test => {
                const StatusIcon = getStatusIcon(test.status)
                const isCurrentTest = currentTest === test.id
                
                return (
                  <div 
                    key={test.id} 
                    className={`flex items-center justify-between p-4 border rounded-lg transition-colors duration-200 ${
                      isCurrentTest ? 'border-secondary-300 bg-secondary-50' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <StatusIcon 
                        className={`w-5 h-5 ${getStatusColor(test.status)} ${
                          test.status === 'running' ? 'animate-spin' : ''
                        }`} 
                      />
                      <div>
                        <div className="font-medium text-gray-900">{test.name}</div>
                        {test.details && (
                          <div className="text-sm text-gray-600">{test.details}</div>
                        )}
                        {test.error && (
                          <div className="text-sm text-error-600 flex items-center space-x-1">
                            <AlertTriangle className="w-4 h-4" />
                            <span>{test.error}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      {test.duration && (
                        <div className="text-sm text-gray-500">
                          {test.duration}ms
                        </div>
                      )}
                      <div className={`text-xs font-medium ${getStatusColor(test.status)}`}>
                        {test.status.toUpperCase()}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Test Progress */}
      {isRunning && (
        <div className="card bg-secondary-50 border-secondary-200">
          <div className="flex items-center space-x-3">
            <RefreshCw className="w-6 h-6 text-secondary-600 animate-spin" />
            <div>
              <div className="font-medium text-secondary-900">
                Running Tests...
              </div>
              <div className="text-sm text-secondary-700">
                {currentTest && `Currently testing: ${tests.find(t => t.id === currentTest)?.name}`}
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="w-full bg-secondary-200 rounded-full h-2">
              <div 
                className="bg-secondary-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${((stats.passed + stats.failed) / stats.total) * 100}%` 
                }}
              ></div>
            </div>
            <div className="text-xs text-secondary-600 mt-1">
              {stats.passed + stats.failed} of {stats.total} tests completed
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TestSuite