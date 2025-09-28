import React, { useState, useEffect } from 'react'
import { 
  Eye, 
  Keyboard, 
  Volume2, 
  Palette, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Users,
  Settings
} from 'lucide-react'

interface AccessibilityIssue {
  id: string
  type: 'error' | 'warning' | 'info'
  category: 'keyboard' | 'screen-reader' | 'color-contrast' | 'aria' | 'structure'
  element: string
  description: string
  suggestion: string
  wcagLevel: 'A' | 'AA' | 'AAA'
}

const AccessibilityChecker: React.FC = () => {
  const [issues, setIssues] = useState<AccessibilityIssue[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [colorBlindnessSimulation, setColorBlindnessSimulation] = useState<string>('none')

  const mockIssues: AccessibilityIssue[] = [
    {
      id: '1',
      type: 'error',
      category: 'aria',
      element: 'button.submit-complaint',
      description: 'Button missing accessible name',
      suggestion: 'Add aria-label or visible text to describe the button purpose',
      wcagLevel: 'A'
    },
    {
      id: '2',
      type: 'warning',
      category: 'color-contrast',
      element: '.text-gray-500',
      description: 'Text color contrast ratio is 3.2:1 (minimum 4.5:1)',
      suggestion: 'Use a darker color to meet WCAG AA standards',
      wcagLevel: 'AA'
    },
    {
      id: '3',
      type: 'error',
      category: 'keyboard',
      element: '.dropdown-menu',
      description: 'Dropdown not accessible via keyboard navigation',
      suggestion: 'Implement proper focus management and arrow key navigation',
      wcagLevel: 'A'
    },
    {
      id: '4',
      type: 'warning',
      category: 'screen-reader',
      element: 'img.complaint-attachment',
      description: 'Image missing alternative text',
      suggestion: 'Add descriptive alt text for screen readers',
      wcagLevel: 'A'
    },
    {
      id: '5',
      type: 'info',
      category: 'structure',
      element: 'main',
      description: 'Consider adding skip navigation link',
      suggestion: 'Add "Skip to main content" link for keyboard users',
      wcagLevel: 'AA'
    }
  ]

  const runAccessibilityCheck = async () => {
    setIsScanning(true)
    
    // Simulate scanning delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // In a real implementation, this would use tools like axe-core
    setIssues(mockIssues)
    setIsScanning(false)
  }

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'error': return XCircle
      case 'warning': return AlertTriangle
      case 'info': return CheckCircle
      default: return CheckCircle
    }
  }

  const getIssueColor = (type: string) => {
    switch (type) {
      case 'error': return 'text-error-600 bg-error-100 border-error-200'
      case 'warning': return 'text-warning-600 bg-warning-100 border-warning-200'
      case 'info': return 'text-secondary-600 bg-secondary-100 border-secondary-200'
      default: return 'text-gray-600 bg-gray-100 border-gray-200'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'keyboard': return Keyboard
      case 'screen-reader': return Volume2
      case 'color-contrast': return Palette
      case 'aria': return Users
      case 'structure': return Settings
      default: return Eye
    }
  }

  const filteredIssues = selectedCategory === 'all' 
    ? issues 
    : issues.filter(issue => issue.category === selectedCategory)

  const getStats = () => {
    const errors = issues.filter(i => i.type === 'error').length
    const warnings = issues.filter(i => i.type === 'warning').length
    const info = issues.filter(i => i.type === 'info').length
    
    return { errors, warnings, info, total: issues.length }
  }

  const stats = getStats()

  // Color blindness simulation styles
  const getColorBlindnessFilter = () => {
    switch (colorBlindnessSimulation) {
      case 'protanopia':
        return 'sepia(100%) saturate(0%) hue-rotate(0deg)'
      case 'deuteranopia':
        return 'sepia(100%) saturate(0%) hue-rotate(90deg)'
      case 'tritanopia':
        return 'sepia(100%) saturate(0%) hue-rotate(180deg)'
      case 'monochromacy':
        return 'grayscale(100%)'
      default:
        return 'none'
    }
  }

  useEffect(() => {
    if (colorBlindnessSimulation !== 'none') {
      document.body.style.filter = getColorBlindnessFilter()
    } else {
      document.body.style.filter = 'none'
    }

    return () => {
      document.body.style.filter = 'none'
    }
  }, [colorBlindnessSimulation])

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Accessibility Checker
        </h1>
        <p className="text-gray-600">
          Comprehensive accessibility testing and WCAG compliance checking
        </p>
      </div>

      {/* Control Panel */}
      <div className="card mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={runAccessibilityCheck}
              disabled={isScanning}
              className="btn-primary flex items-center space-x-2"
            >
              {isScanning ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <Eye className="w-5 h-5" />
              )}
              <span>{isScanning ? 'Scanning...' : 'Run Accessibility Check'}</span>
            </button>

            {issues.length > 0 && (
              <div className="text-sm text-gray-600">
                Found {issues.length} accessibility issues
              </div>
            )}
          </div>

          {/* Color Blindness Simulation */}
          <div className="flex items-center space-x-3">
            <label className="text-sm font-medium text-gray-700">
              Color Vision Simulation:
            </label>
            <select
              value={colorBlindnessSimulation}
              onChange={(e) => setColorBlindnessSimulation(e.target.value)}
              className="input-field text-sm"
            >
              <option value="none">Normal Vision</option>
              <option value="protanopia">Protanopia (Red-blind)</option>
              <option value="deuteranopia">Deuteranopia (Green-blind)</option>
              <option value="tritanopia">Tritanopia (Blue-blind)</option>
              <option value="monochromacy">Monochromacy (Color-blind)</option>
            </select>
          </div>
        </div>

        {/* Statistics */}
        {issues.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Issues</div>
            </div>
            
            <div className="text-center p-4 bg-error-50 rounded-lg">
              <div className="text-2xl font-bold text-error-600">{stats.errors}</div>
              <div className="text-sm text-gray-600">Errors</div>
            </div>
            
            <div className="text-center p-4 bg-warning-50 rounded-lg">
              <div className="text-2xl font-bold text-warning-600">{stats.warnings}</div>
              <div className="text-sm text-gray-600">Warnings</div>
            </div>
            
            <div className="text-center p-4 bg-secondary-50 rounded-lg">
              <div className="text-2xl font-bold text-secondary-600">{stats.info}</div>
              <div className="text-sm text-gray-600">Info</div>
            </div>
          </div>
        )}
      </div>

      {/* Category Filter */}
      {issues.length > 0 && (
        <div className="card mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter by Category</h3>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                selectedCategory === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Issues ({issues.length})
            </button>
            
            {['keyboard', 'screen-reader', 'color-contrast', 'aria', 'structure'].map(category => {
              const count = issues.filter(i => i.category === category).length
              const CategoryIcon = getCategoryIcon(category)
              
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    selectedCategory === category
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <CategoryIcon className="w-4 h-4" />
                  <span className="capitalize">{category.replace('-', ' ')} ({count})</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Issues List */}
      {isScanning ? (
        <div className="card text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Scanning for Accessibility Issues
          </h3>
          <p className="text-gray-600">
            Analyzing page structure, ARIA attributes, color contrast, and keyboard navigation...
          </p>
        </div>
      ) : issues.length > 0 ? (
        <div className="space-y-4">
          {filteredIssues.map(issue => {
            const IssueIcon = getIssueIcon(issue.type)
            const CategoryIcon = getCategoryIcon(issue.category)
            
            return (
              <div
                key={issue.id}
                className={`border rounded-lg p-6 ${getIssueColor(issue.type)}`}
              >
                <div className="flex items-start space-x-4">
                  <IssueIcon className="w-6 h-6 flex-shrink-0 mt-1" />
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-gray-900">
                        {issue.description}
                      </h3>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        issue.type === 'error' ? 'bg-error-200 text-error-800' :
                        issue.type === 'warning' ? 'bg-warning-200 text-warning-800' :
                        'bg-secondary-200 text-secondary-800'
                      }`}>
                        WCAG {issue.wcagLevel}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2 mb-3">
                      <CategoryIcon className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-600 capitalize">
                        {issue.category.replace('-', ' ')}
                      </span>
                      <span className="text-sm text-gray-400">•</span>
                      <code className="text-sm bg-gray-200 px-2 py-1 rounded">
                        {issue.element}
                      </code>
                    </div>
                    
                    <div className="bg-white bg-opacity-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">Suggested Fix:</h4>
                      <p className="text-gray-700">{issue.suggestion}</p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="card text-center py-12">
          <Eye className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Accessibility Issues Found
          </h3>
          <p className="text-gray-600 mb-6">
            Run an accessibility check to scan for WCAG compliance issues and accessibility barriers.
          </p>
          <button
            onClick={runAccessibilityCheck}
            className="btn-primary flex items-center space-x-2 mx-auto"
          >
            <Eye className="w-5 h-5" />
            <span>Start Accessibility Check</span>
          </button>
        </div>
      )}

      {/* Accessibility Guidelines */}
      <div className="card mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Accessibility Best Practices
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
              <Keyboard className="w-5 h-5 text-primary-600" />
              <span>Keyboard Navigation</span>
            </h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• All interactive elements must be keyboard accessible</li>
              <li>• Provide visible focus indicators</li>
              <li>• Implement logical tab order</li>
              <li>• Support standard keyboard shortcuts</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
              <Volume2 className="w-5 h-5 text-secondary-600" />
              <span>Screen Reader Support</span>
            </h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Use semantic HTML elements</li>
              <li>• Provide alternative text for images</li>
              <li>• Use ARIA labels and descriptions</li>
              <li>• Structure content with proper headings</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
              <Palette className="w-5 h-5 text-warning-600" />
              <span>Color & Contrast</span>
            </h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Maintain 4.5:1 contrast ratio for normal text</li>
              <li>• Use 3:1 ratio for large text and UI elements</li>
              <li>• Don't rely solely on color to convey information</li>
              <li>• Test with color blindness simulators</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
              <Users className="w-5 h-5 text-success-600" />
              <span>Inclusive Design</span>
            </h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Design for diverse abilities and contexts</li>
              <li>• Provide multiple ways to access content</li>
              <li>• Use clear and simple language</li>
              <li>• Allow users to customize their experience</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AccessibilityChecker