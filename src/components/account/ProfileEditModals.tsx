'use client'

import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { userService, UpdateProfileRequest } from '@/services/userService'
import { CountryCodePicker } from '@/components/auth/CountryCodePicker'
import { useAuth } from '@/contexts/AuthContext'
import { useTranslation } from '@/hooks/useTranslation'
import api from '@/services/api'

interface EditNameModalProps {
  isOpen: boolean
  onClose: () => void
  currentFirstName: string
  currentLastName: string
  onSave: () => void
}

export function EditNameModal({ isOpen, onClose, currentFirstName, currentLastName, onSave }: EditNameModalProps) {
  const { t } = useTranslation()
  const [firstName, setFirstName] = useState(currentFirstName)
  const [lastName, setLastName] = useState(currentLastName)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      setFirstName(currentFirstName)
      setLastName(currentLastName)
      setError(null)
    }
  }, [isOpen, currentFirstName, currentLastName])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node) && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

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
    <div className={`fixed inset-0 bg-black z-[9999] flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-60' : 'opacity-0'}`}>
      <div ref={modalRef} className="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl transform transition-all duration-300 border-2 border-black ring-4 ring-black ring-opacity-20">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">{t('account.editPreferredName')}</h2>
          <button onClick={onClose} className="text-gray-700 hover:text-gray-900 transition-colors">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('account.firstName')}</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-black bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('account.lastName')}</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-black bg-white"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            {t('account.cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {loading ? t('account.saving') : t('account.save')}
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
  const { t } = useTranslation()
  const getPhoneCode = (code: string) => {
    const country = COUNTRIES.find(c => c.code === code)
    return country?.phoneCode || '+41'
  }
  
  const [countryCode, setCountryCode] = useState<string>('CH')
  const [phoneCode, setPhoneCode] = useState<string>('+41')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      // Always update from props when modal opens
      const code = currentPhoneCountryCode || 'CH'
      const phonePrefix = getPhoneCode(code)
      setCountryCode(code)
      setPhoneCode(phonePrefix)
      setPhoneNumber(currentPhoneNumber || '')
      setError(null)
      console.log('EditPhoneModal opened with:', { code, phonePrefix, currentPhoneNumber })
    }
  }, [isOpen, currentPhoneCountryCode, currentPhoneNumber])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node) && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

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
    <div className={`fixed inset-0 bg-black z-[9999] flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-60' : 'opacity-0'}`}>
      <div ref={modalRef} className="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl transform transition-all duration-300 border-2 border-black ring-4 ring-black ring-opacity-20">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{currentPhoneNumber ? t('account.editPhone') : t('account.addPhone')}</h2>
          <button onClick={onClose} className="text-gray-700 hover:text-gray-900 transition-colors">
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
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('account.phone')}</label>
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
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              {t('account.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {loading ? t('account.saving') : t('account.save')}
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
  const { t } = useTranslation()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setError(null)
    }
  }, [isOpen])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node) && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  const handleSave = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError(t('account.allFieldsRequired'))
      return
    }

    if (newPassword !== confirmPassword) {
      setError(t('account.passwordsDoNotMatch'))
      return
    }

    if (newPassword.length < 8) {
      setError(t('account.passwordMinLength'))
      return
    }

    setLoading(true)
    setError(null)
    try {
      await api.put('/api/user/change-password', {
        currentPassword,
        newPassword
      })
      onClose()
      // Clear form
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || t('account.passwordUpdateFailed'))
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className={`fixed inset-0 bg-black z-[9999] flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-60' : 'opacity-0'}`}>
      <div ref={modalRef} className="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl transform transition-all duration-300 border-2 border-black ring-4 ring-black ring-opacity-20">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{t('account.editPassword')}</h2>
          <button onClick={onClose} className="text-gray-700 hover:text-gray-900 transition-colors">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('account.currentPassword')}</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-black bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('account.newPassword')}</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-black bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('account.confirmNewPassword')}</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-black bg-white"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            {t('account.cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {loading ? t('account.saving') : t('account.save')}
          </button>
        </div>
      </div>
    </div>
  )
}

interface EditBirthdayModalProps {
  isOpen: boolean
  onClose: () => void
  currentBirthday?: string
  onSave: () => void
}

export function EditBirthdayModal({ isOpen, onClose, currentBirthday, onSave }: EditBirthdayModalProps) {
  const { t } = useTranslation()
  const [birthday, setBirthday] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      // Format birthday for date input (YYYY-MM-DD)
      if (currentBirthday) {
        const date = new Date(currentBirthday)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        setBirthday(`${year}-${month}-${day}`)
      } else {
        setBirthday('')
      }
      setError(null)
    }
  }, [isOpen, currentBirthday])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node) && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  const handleSave = async () => {
    if (!birthday) {
      setError('Birthday is required')
      return
    }

    setLoading(true)
    setError(null)
    try {
      await userService.updateProfile({ dateOfBirth: birthday })
      onSave()
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update birthday')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className={`fixed inset-0 bg-black z-[9999] flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-60' : 'opacity-0'}`}>
      <div ref={modalRef} className="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl transform transition-all duration-300 border-2 border-black ring-4 ring-black ring-opacity-20">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{currentBirthday ? t('account.editBirthday') : t('account.addBirthdayModal')}</h2>
          <button onClick={onClose} className="text-gray-700 hover:text-gray-900 transition-colors">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('account.birthday')}</label>
            <input
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-black bg-white"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            {t('account.cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {loading ? t('account.saving') : t('account.save')}
          </button>
        </div>
      </div>
    </div>
  )
}

