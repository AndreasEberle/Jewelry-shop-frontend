'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { userService, UpdateProfileRequest } from '@/services/userService'
import { CountryCodePicker } from '@/components/auth/CountryCodePicker'
import { useAuth } from '@/contexts/AuthContext'

interface EditNameModalProps {
  isOpen: boolean
  onClose: () => void
  currentFirstName: string
  currentLastName: string
  onSave: () => void
}

export function EditNameModal({ isOpen, onClose, currentFirstName, currentLastName, onSave }: EditNameModalProps) {
  const [firstName, setFirstName] = useState(currentFirstName)
  const [lastName, setLastName] = useState(currentLastName)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setFirstName(currentFirstName)
      setLastName(currentLastName)
      setError(null)
    }
  }, [isOpen, currentFirstName, currentLastName])

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      setError('First name and last name are required')
      return
    }

    setLoading(true)
    setError(null)
    try {
      await userService.updateProfile({ firstName, lastName })
      onSave()
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update name')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Edit Preferred Name</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

interface EditPhoneModalProps {
  isOpen: boolean
  onClose: () => void
  currentPhoneCountryCode?: string
  currentPhoneNumber?: string
  onSave: () => void
}

const COUNTRIES = [
  { code: 'US', phoneCode: '+1' },
  { code: 'CH', phoneCode: '+41' },
  { code: 'DE', phoneCode: '+49' },
  { code: 'FR', phoneCode: '+33' },
  { code: 'IT', phoneCode: '+39' },
  { code: 'GB', phoneCode: '+44' },
  { code: 'AT', phoneCode: '+43' },
  { code: 'LI', phoneCode: '+423' },
]

export function EditPhoneModal({ isOpen, onClose, currentPhoneCountryCode, currentPhoneNumber, onSave }: EditPhoneModalProps) {
  const getPhoneCode = (code: string) => {
    const country = COUNTRIES.find(c => c.code === code)
    return country?.phoneCode || '+41'
  }
  
  const [countryCode, setCountryCode] = useState(currentPhoneCountryCode || 'CH')
  const [phoneCode, setPhoneCode] = useState(getPhoneCode(currentPhoneCountryCode || 'CH'))
  const [phoneNumber, setPhoneNumber] = useState(currentPhoneNumber || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      const code = currentPhoneCountryCode || 'CH'
      setCountryCode(code)
      setPhoneCode(getPhoneCode(code))
      setPhoneNumber(currentPhoneNumber || '')
      setError(null)
    }
  }, [isOpen, currentPhoneCountryCode, currentPhoneNumber])

  const handleCountryChange = (code: string, codePrefix: string) => {
    setCountryCode(code)
    setPhoneCode(codePrefix)
  }

  const handleSave = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }

    if (!phoneNumber.trim()) {
      setError('Phone number is required')
      return
    }

    setLoading(true)
    setError(null)
    
    console.log('Starting phone save...', { 
      countryCode, 
      phoneNumber: phoneNumber.trim(),
      currentPhoneCountryCode,
      currentPhoneNumber
    })
    
    try {
      const updateData = { 
        phoneCountryCode: countryCode,
        phoneNumber: phoneNumber.trim()
      }
      console.log('Calling userService.updateProfile with:', updateData)
      
      const updatedProfile = await userService.updateProfile(updateData)
      console.log('Phone saved successfully. Response:', updatedProfile)
      
      // Verify the response contains the phone data
      if (updatedProfile.phoneNumber !== phoneNumber.trim()) {
        console.warn('Warning: Phone number in response does not match sent value', {
          sent: phoneNumber.trim(),
          received: updatedProfile.phoneNumber
        })
      }
      
      setLoading(false)
      
      // Call onSave to refresh the parent component BEFORE closing
      console.log('Calling onSave callback...')
      await onSave()
      
      // Close modal after a short delay to ensure UI updates
      setTimeout(() => {
        console.log('Closing modal...')
        onClose()
      }, 300)
    } catch (err: any) {
      console.error('Error saving phone - Full error:', err)
      console.error('Error response:', err.response)
      console.error('Error message:', err.message)
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update phone number'
      setError(errorMessage)
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{currentPhoneNumber ? 'Edit Phone' : 'Add Phone'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSave}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <div className="flex">
                <CountryCodePicker
                  value={countryCode}
                  onChange={handleCountryChange}
                />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456789"
                  className="flex-1 ml-2 px-4 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-black"
                  required
                />
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface EditPasswordModalProps {
  isOpen: boolean
  onClose: () => void
}

export function EditPasswordModal({ isOpen, onClose }: EditPasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setError(null)
    }
  }, [isOpen])

  const handleSave = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    setError(null)
    try {
      // TODO: Implement password update endpoint
      // await userService.updatePassword({ currentPassword, newPassword })
      setError('Password update not yet implemented')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Edit Password</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

