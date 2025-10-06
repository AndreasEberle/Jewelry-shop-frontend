'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { LoginCredentials, RegisterData } from '@/types'
import { CountryCodePicker } from './CountryCodePicker'
import { Modal } from '@/components/ui/Modal'
import { Eye, EyeOff } from 'lucide-react'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: 'login' | 'register'
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  initialMode = 'login' 
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  // Update mode when initialMode changes
  useEffect(() => {
    setMode(initialMode)
  }, [initialMode])

  // Reset mode to initialMode when modal closes
  useEffect(() => {
    if (!isOpen) {
      setMode(initialMode)
      // Reset form data when modal closes
      setFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phone: '',
        countryCode: 'US',
        phoneCode: '+1',
        dateOfBirth: '',
        gender: '',
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: ''
        }
      })
      setError(null)
    }
  }, [isOpen, initialMode])
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    countryCode: 'CH', // Default to Switzerland
    phoneCode: '+41', // Default to Switzerland
    dateOfBirth: '',
    gender: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Switzerland' // Default to Switzerland
    }
  })

  const { login, register, oauth2Login } = useAuth()

  // Detect user's country based on browser locale
  const detectCountry = () => {
    const locale = navigator.language || navigator.languages?.[0] || 'en-US'
    const country = locale.split('-')[1] || 'US'
    
    // Map country codes to phone codes and country names
    const countryMap: { [key: string]: { phoneCode: string, countryName: string } } = {
      'CH': { phoneCode: '+41', countryName: 'Switzerland' },
      'LI': { phoneCode: '+423', countryName: 'Liechtenstein' },
      'DE': { phoneCode: '+49', countryName: 'Germany' },
      'FR': { phoneCode: '+33', countryName: 'France' },
      'IT': { phoneCode: '+39', countryName: 'Italy' },
      'AT': { phoneCode: '+43', countryName: 'Austria' },
      'US': { phoneCode: '+1', countryName: 'United States' },
      'GB': { phoneCode: '+44', countryName: 'United Kingdom' },
      'CA': { phoneCode: '+1', countryName: 'Canada' }
    }
    
    return countryMap[country] || countryMap['CH'] // Default to Switzerland
  }

  // Set default country on component mount
  React.useEffect(() => {
    const detectedCountry = detectCountry()
    setFormData(prev => ({
      ...prev,
      countryCode: detectedCountry.phoneCode.includes('+41') ? 'CH' : 
                  detectedCountry.phoneCode.includes('+423') ? 'LI' : 'CH',
      phoneCode: detectedCountry.phoneCode,
      address: {
        ...prev.address,
        country: detectedCountry.countryName
      }
    }))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (mode === 'login') {
        const credentials: LoginCredentials = {
          email: formData.email,
          password: formData.password
        }
        await login(credentials)
      } else {
        const userData: RegisterData = {
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone || undefined,
          countryCode: formData.phoneCode, // Use phoneCode (+41, +423, etc.)
          phoneNumber: formData.phone || undefined,
          dateOfBirth: formData.dateOfBirth && formData.dateOfBirth.trim() !== '' ? formData.dateOfBirth : undefined,
          gender: formData.gender && formData.gender.trim() !== '' ? formData.gender : undefined,
          address: formData.address.street ? formData.address : undefined
        }
        await register(userData)
      }
      onClose()
    } catch (err: any) {
      // Make error messages more human-friendly
      let errorMessage = 'An error occurred'
      
      // Debug logging
      console.log('Login error:', err)
      console.log('Error response:', err.response)
      console.log('Error response data:', err.response?.data)
      
      if (err.response?.data?.message) {
        // Handle ErrorResponse format (from global exception handler)
        const backendMessage = err.response.data.message
        if (backendMessage.includes('Invalid credentials')) {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.'
        } else if (backendMessage.includes('User not found')) {
          errorMessage = 'No account found with this email address. Please check your email or create a new account.'
        } else {
          errorMessage = backendMessage
        }
      } else if (err.response?.data?.error) {
        // Handle specific error messages from backend
        const backendError = err.response.data.error
        if (backendError.includes('No account found with this email address')) {
          errorMessage = 'No account found with this email address. Please check your email or create a new account.'
        } else if (backendError.includes('Invalid email or password')) {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.'
        } else if (backendError.includes('This account was created with Google')) {
          errorMessage = 'This account was created with Google. Please use Google to sign in.'
        } else {
          errorMessage = backendError
        }
      } else if (err.response?.data?.errors) {
        // Handle validation errors
        const validationErrors = err.response.data.errors
        if (Array.isArray(validationErrors) && validationErrors.length > 0) {
          errorMessage = validationErrors.map((error: any) => {
            const message = error.defaultMessage || error.message
            // Convert technical validation messages to human-friendly ones
            if (message.includes('Password must contain at least one uppercase letter, one lowercase letter, and one number')) {
              return 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
            }
            if (message.includes('Password must be at least 8 characters')) {
              return 'Password must be at least 8 characters long'
            }
            if (message.includes('Email should be valid')) {
              return 'Please enter a valid email address'
            }
            if (message.includes('is required')) {
              return 'This field is required'
            }
            if (message.includes('Validation failed')) {
              return 'Please check your information and try again'
            }
            if (message.includes('Password') && message.includes('Pattern')) {
              return 'Password does not meet requirements. Must be at least 8 characters with uppercase, lowercase, and number'
            }
            return message
          }).join('. ')
        } else {
          errorMessage = 'Please check your input and try again.'
        }
        } else if (err.message) {
          // Handle specific error types
          if (err.message.includes('Bad credentials')) {
            errorMessage = 'Invalid email or password. Please check your credentials and try again.'
          } else if (err.message.includes('No account found with this email address')) {
            errorMessage = 'No account found with this email address. Please check your email or create a new account.'
          } else if (err.message.includes('User not found')) {
            errorMessage = 'No account found with this email address. Please check your email or create a new account.'
          } else if (err.message.includes('Network Error')) {
            errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.'
          } else if (err.message.includes('Request failed with status code 400')) {
            // For 400 errors, try to get more specific error from response
            if (err.response?.data?.error) {
              const backendError = err.response.data.error
              if (backendError.includes('No account found with this email address')) {
                errorMessage = 'No account found with this email address. Please check your email or create a new account.'
              } else if (backendError.includes('Invalid email or password')) {
                errorMessage = 'Invalid email or password. Please check your credentials and try again.'
              } else if (backendError.includes('This account was created with Google')) {
                errorMessage = 'This account was created with Google. Please use Google to sign in.'
              } else {
                errorMessage = backendError
              }
            } else {
              errorMessage = 'Please check your information and try again.'
            }
          } else if (err.message.includes('Request failed with status code 401')) {
            errorMessage = 'Invalid email or password. Please check your credentials and try again.'
          } else if (err.message.includes('Request failed with status code 500')) {
            errorMessage = 'Server error. Please try again later.'
          } else if (err.message.includes('Password') && err.message.includes('Pattern')) {
            errorMessage = 'Password does not meet requirements. Must be at least 8 characters with uppercase, lowercase, and number'
          } else {
            errorMessage = err.message
          }
        }
      
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    oauth2Login('google')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const switchMode = () => {
    setMode(prev => prev === 'login' ? 'register' : 'login')
    setError(null)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
        <button
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 text-2xl"
          onClick={onClose}
        >
          &times;
        </button>
        
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
          {mode === 'login' ? 'Sign In' : 'Create Account'}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Required Fields Section */}
          <div className="space-y-4">
            
            {mode === 'register' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  minLength={8}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {mode === 'register' && (
                <div className="mt-2 text-xs text-gray-600">
                  <p className="mb-1">Password must contain:</p>
                  <ul className="list-disc list-inside ml-2 space-y-1">
                    <li className={formData.password.length >= 8 ? 'text-green-600' : 'text-gray-500'}>
                      At least 8 characters
                    </li>
                    <li className={/[a-z]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}>
                      One lowercase letter
                    </li>
                    <li className={/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}>
                      One uppercase letter
                    </li>
                    <li className={/\d/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}>
                      One number
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Optional Fields Section - Only for Registration */}
          {mode === 'register' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                Optional Information
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <div className="flex">
                  <CountryCodePicker
                    value={formData.countryCode}
                    onChange={(countryCode, phoneCode) => {
                      setFormData(prev => ({
                        ...prev,
                        countryCode, // Keep country code for the picker
                        phoneCode   // Store phone code for backend
                      }))
                    }}
                  />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="1234567890"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-md font-medium text-gray-700 mb-4">Address Information</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Street Address
                    </label>
                    <input
                      type="text"
                      name="address.street"
                      value={formData.address.street}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        address: { ...prev.address, street: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        name="address.city"
                        value={formData.address.city}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          address: { ...prev.address, city: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State/Province
                      </label>
                      <input
                        type="text"
                        name="address.state"
                        value={formData.address.state}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          address: { ...prev.address, state: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ZIP/Postal Code
                      </label>
                      <input
                        type="text"
                        name="address.zipCode"
                        value={formData.address.zipCode}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          address: { ...prev.address, zipCode: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Country
                      </label>
                      <input
                        type="text"
                        name="address.country"
                        value={formData.address.country}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          address: { ...prev.address, country: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 transition-colors flex items-center justify-center disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading && <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>}
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="text-sm text-primary-600 hover:underline"
          >
            {mode === 'login' ? 'Need an account? Create one' : 'Already have an account? Sign in'}
          </button>
        </div>

        <div className="mt-6">
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3">
            <button
              onClick={() => oauth2Login('google')}
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <img className="h-5 w-5 mr-2" src="https://www.svgrepo.com/show/355037/google.svg" alt="Google" />
              Google
            </button>
          </div>
        </div>
    </Modal>
  )
}
