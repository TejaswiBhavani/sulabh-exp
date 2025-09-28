import React, { useEffect, useState } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'

interface PasswordStrengthMeterProps {
  password: string
  className?: string
}

const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ 
  password,
  className = ''
}) => {
  const [strength, setStrength] = useState(0)
  const [checks, setChecks] = useState({
    length: false,
    number: false,
    special: false,
    uppercase: false
  })

  useEffect(() => {
    if (!password) {
      setStrength(0)
      setChecks({
        length: false,
        number: false,
        special: false,
        uppercase: false
      })
      return
    }

    const newChecks = {
      length: password.length >= 8,
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      uppercase: /[A-Z]/.test(password)
    }

    setChecks(newChecks)

    let newStrength = 0
    if (newChecks.length) newStrength += 1
    if (newChecks.number) newStrength += 1
    if (newChecks.special) newStrength += 1
    if (newChecks.uppercase) newStrength += 1

    setStrength(newStrength)
  }, [password])

  const getStrengthColor = () => {
    if (strength === 0) return 'bg-gray-200'
    if (strength === 1) return 'bg-error-500'
    if (strength === 2) return 'bg-warning-500'
    if (strength === 3) return 'bg-secondary-500'
    return 'bg-success-500'
  }

  const getStrengthText = () => {
    if (strength === 0) return ''
    if (strength === 1) return 'Weak'
    if (strength === 2) return 'Fair'
    if (strength === 3) return 'Good'
    return 'Strong'
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {password && (
        <>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full ${getStrengthColor()} transition-all duration-300`} 
              style={{ width: `${(strength / 4) * 100}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-600">
            Password strength: <span className="font-medium">{getStrengthText()}</span>
          </p>
          <ul className="text-xs text-gray-600 space-y-1">
            <li className="flex items-center space-x-1">
              {checks.length ? (
                <CheckCircle className="w-3 h-3 text-success-600" />
              ) : (
                <XCircle className="w-3 h-3 text-gray-400" />
              )}
              <span className={checks.length ? 'text-success-600' : ''}>
                At least 8 characters
              </span>
            </li>
            <li className="flex items-center space-x-1">
              {checks.number ? (
                <CheckCircle className="w-3 h-3 text-success-600" />
              ) : (
                <XCircle className="w-3 h-3 text-gray-400" />
              )}
              <span className={checks.number ? 'text-success-600' : ''}>
                At least one number
              </span>
            </li>
            <li className="flex items-center space-x-1">
              {checks.special ? (
                <CheckCircle className="w-3 h-3 text-success-600" />
              ) : (
                <XCircle className="w-3 h-3 text-gray-400" />
              )}
              <span className={checks.special ? 'text-success-600' : ''}>
                At least one special character
              </span>
            </li>
            <li className="flex items-center space-x-1">
              {checks.uppercase ? (
                <CheckCircle className="w-3 h-3 text-success-600" />
              ) : (
                <XCircle className="w-3 h-3 text-gray-400" />
              )}
              <span className={checks.uppercase ? 'text-success-600' : ''}>
                At least one uppercase letter (recommended)
              </span>
            </li>
          </ul>
        </>
      )}
    </div>
  )
}

export default PasswordStrengthMeter