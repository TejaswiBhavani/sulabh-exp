import React from 'react'

// Rangoli-inspired decorative border component
export const RangoliBorder: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`relative ${className}`}>
    <div className="absolute inset-0 bg-gradient-to-r from-primary-200 via-warning-200 to-success-200 opacity-20 rounded-lg"></div>
    <div className="absolute inset-0 border-2 border-dashed border-primary-300 rounded-lg"></div>
    <div className="absolute top-2 left-2 w-3 h-3 bg-primary-500 rounded-full opacity-60"></div>
    <div className="absolute top-2 right-2 w-3 h-3 bg-warning-500 rounded-full opacity-60"></div>
    <div className="absolute bottom-2 left-2 w-3 h-3 bg-success-500 rounded-full opacity-60"></div>
    <div className="absolute bottom-2 right-2 w-3 h-3 bg-secondary-500 rounded-full opacity-60"></div>
  </div>
)

// Lotus-inspired icon component
export const LotusIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C12 2 8 6 8 10C8 12 10 14 12 14C14 14 16 12 16 10C16 6 12 2 12 2Z" opacity="0.8"/>
    <path d="M12 14C12 14 6 12 4 16C4 18 6 20 8 20C10 20 12 18 12 16C12 16 12 14 12 14Z" opacity="0.6"/>
    <path d="M12 14C12 14 18 12 20 16C20 18 18 20 16 20C14 20 12 18 12 16C12 16 12 14 12 14Z" opacity="0.6"/>
    <path d="M12 14C12 14 10 18 6 20C4 20 2 18 2 16C2 14 4 12 6 12C8 12 12 14 12 14Z" opacity="0.4"/>
    <path d="M12 14C12 14 14 18 18 20C20 20 22 18 22 16C22 14 20 12 18 12C16 12 12 14 12 14Z" opacity="0.4"/>
  </svg>
)

// Traditional pattern background
export const TraditionalPattern: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`absolute inset-0 opacity-5 ${className}`}>
    <svg width="100%" height="100%" viewBox="0 0 100 100" className="text-primary-600">
      <defs>
        <pattern id="traditional-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="10" cy="10" r="2" fill="currentColor"/>
          <circle cx="5" cy="5" r="1" fill="currentColor"/>
          <circle cx="15" cy="5" r="1" fill="currentColor"/>
          <circle cx="5" cy="15" r="1" fill="currentColor"/>
          <circle cx="15" cy="15" r="1" fill="currentColor"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#traditional-pattern)"/>
    </svg>
  </div>
)

// Cultural color palette helper
export const culturalColors = {
  saffron: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316',
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
  },
  emerald: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
  }
}