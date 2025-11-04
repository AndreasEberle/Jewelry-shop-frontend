'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { authService } from '@/services/authService'
import { Loader2 } from 'lucide-react'

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Please request a new password reset.')
    }
  }, [token])

  const validateForm = () => {
    const errors: { [key: string]: string } = {}

    if (!password.trim()) {
      errors.password = 'Password is required'
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters'
    }

    if (!confirmPassword.trim()) {
      errors.confirmPassword = 'Please confirm your password'
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

    if (!validateForm()) {
      return
    }

    if (!token) {
      setError('Invalid reset link. Please request a new password reset.')
      return
    }

    setIsLoading(true)

    try {
      await authService.resetPassword(token, password)
      setSuccess(true)
      setTimeout(() => {
        router.push('/')
      }, 3000)
    } catch (err: any) {
      let errorMessage = 'Failed to reset password'
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error
      } else if (err.message) {
        errorMessage = err.message
      }
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const ErrorIcon = () => (
    <svg className="size-[12px]" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M6.0007 2.61011C5.91403 2.61141 5.82846 2.62978 5.74888 2.66415C5.6693 2.69853 5.59728 2.74825 5.53692 2.81047C5.47656 2.87268 5.42905 2.94618 5.3971 3.02676C5.36514 3.10735 5.34938 3.19343 5.3507 3.28011V6.28011C5.3393 6.37155 5.34746 6.46438 5.37466 6.55242C5.40186 6.64047 5.44747 6.72173 5.50846 6.7908C5.56946 6.85988 5.64445 6.9152 5.72845 6.95309C5.81245 6.99098 5.90355 7.01058 5.9957 7.01058C6.08786 7.01058 6.17896 6.99098 6.26296 6.95309C6.34696 6.9152 6.42195 6.85988 6.48294 6.7908C6.54394 6.72173 6.58955 6.64047 6.61675 6.55242C6.64395 6.46438 6.65211 6.37155 6.6407 6.28011V3.28011C6.64341 3.10675 6.57779 2.93929 6.45804 2.81392C6.33828 2.68855 6.174 2.61534 6.0007 2.61011Z" fill="currentColor"></path>
      <path fillRule="evenodd" clipRule="evenodd" d="M6.00014 7.43994C5.91385 7.44 5.8285 7.45778 5.74937 7.49219C5.67025 7.52659 5.59903 7.57688 5.54014 7.63994C5.41911 7.76649 5.35156 7.93484 5.35156 8.10994C5.35156 8.28504 5.41911 8.4534 5.54014 8.57994C5.59903 8.643 5.67025 8.69329 5.74937 8.7277C5.8285 8.7621 5.91385 8.77988 6.00014 8.77994C6.08492 8.77971 6.16873 8.7618 6.24621 8.72737C6.3237 8.69293 6.39315 8.64272 6.45014 8.57994C6.57116 8.4534 6.63871 8.28504 6.63871 8.10994C6.63871 7.93484 6.57116 7.76649 6.45014 7.63994C6.39315 7.57716 6.3237 7.52695 6.24621 7.49251C6.16873 7.45808 6.08492 7.44017 6.00014 7.43994Z" fill="currentColor"></path>
      <path fillRule="evenodd" clipRule="evenodd" d="M6 0C4.81331 0 3.65328 0.351894 2.66658 1.01118C1.67989 1.67047 0.910851 2.60754 0.456726 3.7039C0.00259972 4.80026 -0.11622 6.00666 0.115291 7.17054C0.346802 8.33443 0.918247 9.40353 1.75736 10.2426C2.59648 11.0818 3.66558 11.6532 4.82946 11.8847C5.99335 12.1162 7.19975 11.9974 8.2961 11.5433C9.39246 11.0892 10.3295 10.3201 10.9888 9.33342C11.6481 8.34673 12 7.18669 12 6C12 4.4087 11.3679 2.88258 10.2426 1.75736C9.11742 0.632141 7.5913 0 6 0V0ZM6.22 11C5.22719 11.0435 4.24393 10.7902 3.39573 10.2724C2.54754 9.75453 1.87289 8.99569 1.45791 8.09272C1.04293 7.18974 0.906436 6.18358 1.06586 5.20269C1.22528 4.22179 1.67338 3.31064 2.35297 2.58556C3.03255 1.86048 3.91279 1.35436 4.88132 1.1318C5.84984 0.909237 6.86272 0.980335 7.79066 1.33602C8.7186 1.6917 9.5195 2.31583 10.0911 3.12873C10.6628 3.94164 10.9792 4.90645 11 5.9C11.0275 7.20437 10.544 8.46781 9.65281 9.42066C8.76162 10.3735 7.53329 10.9403 6.23 11H6.22Z" fill="currentColor"></path>
    </svg>
  )

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded" style={{ fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400 }}>
            Password has been reset successfully! Redirecting to home page...
          </div>
        </div>
      </div>
    )
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded" style={{ fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400 }}>
            Invalid reset link. Please request a new password reset.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-6 text-center" style={{ fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400 }}>
          Reset Password
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded" style={{ fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* New Password */}
          <div className="mb-md text-content relative" style={{ minHeight: '48px', marginTop: '3px' }}>
            <input
              id="password"
              className="type-body-2 border-b placeholder-transparent peer w-full placeholder:opacity-0 bg-transparent relative px-0 border-t-0 border-l-0 border-r-0 rounded-none outline-none data-[keyboard-focus=true]:ring-2 data-[keyboard-focus=true]:ring-utility-focus data-[keyboard-focus=true]:ring-offset-4 border-current"
              placeholder="New Password*"
              data-keyboard-focus="false"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (fieldErrors.password) {
                  setFieldErrors(prev => {
                    const newErrors = { ...prev }
                    delete newErrors.password
                    return newErrors
                  })
                }
              }}
              required
              style={{ 
                color: 'rgb(0, 0, 0)', 
                borderColor: 'rgb(0, 0, 0)', 
                borderBottom: '1px solid rgb(0, 0, 0)',
                fontFamily: '"SimonMono", "Courier New", Courier, monospace', 
                fontWeight: 400,
                paddingTop: '12px',
                paddingBottom: '8px'
              }}
            />
            <label
              htmlFor="password"
              className={`type-caption text-content absolute left-0 transition-all duration-300 ease-in-out cursor-text ${
                password || 'peer-placeholder-shown:translate-y-[12px] peer-placeholder-shown:type-body-2 peer-placeholder-shown:text-content-mid'
              } ${password ? '-translate-y-[8px]' : 'peer-focus:-translate-y-[8px] peer-focus:type-caption'}`}
              style={{ fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400 }}
            >
              New Password*
            </label>
            {fieldErrors.password && (
              <span className="type-caption flex items-center gap-xxs" aria-live="polite" style={{ marginTop: '4px', color: 'rgb(239, 68, 68)' }}>
                <ErrorIcon />
                {fieldErrors.password}
              </span>
            )}
          </div>

          {/* Confirm Password */}
          <div className="mb-md text-content relative" style={{ minHeight: '48px', marginTop: '3px' }}>
            <input
              id="confirmPassword"
              className="type-body-2 border-b placeholder-transparent peer w-full placeholder:opacity-0 bg-transparent relative px-0 border-t-0 border-l-0 border-r-0 rounded-none outline-none data-[keyboard-focus=true]:ring-2 data-[keyboard-focus=true]:ring-utility-focus data-[keyboard-focus=true]:ring-offset-4 border-current"
              placeholder="Confirm Password*"
              data-keyboard-focus="false"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                if (fieldErrors.confirmPassword) {
                  setFieldErrors(prev => {
                    const newErrors = { ...prev }
                    delete newErrors.confirmPassword
                    return newErrors
                  })
                }
              }}
              required
              style={{ 
                color: 'rgb(0, 0, 0)', 
                borderColor: 'rgb(0, 0, 0)', 
                borderBottom: '1px solid rgb(0, 0, 0)',
                fontFamily: '"SimonMono", "Courier New", Courier, monospace', 
                fontWeight: 400,
                paddingTop: '12px',
                paddingBottom: '8px'
              }}
            />
            <label
              htmlFor="confirmPassword"
              className={`type-caption text-content absolute left-0 transition-all duration-300 ease-in-out cursor-text ${
                confirmPassword || 'peer-placeholder-shown:translate-y-[12px] peer-placeholder-shown:type-body-2 peer-placeholder-shown:text-content-mid'
              } ${confirmPassword ? '-translate-y-[8px]' : 'peer-focus:-translate-y-[8px] peer-focus:type-caption'}`}
              style={{ fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400 }}
            >
              Confirm Password*
            </label>
            {fieldErrors.confirmPassword && (
              <span className="type-caption flex items-center gap-xxs" aria-live="polite" style={{ marginTop: '4px', color: 'rgb(239, 68, 68)' }}>
                <ErrorIcon />
                {fieldErrors.confirmPassword}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="relative pointer-events-auto inline-block uppercase text-center outline-none hover:border-utility-hover disabled:text-utility-disabled focus-visible:ring-2 ring-utility-focus ring-offset-2 transition-colors duration-300 ease-ease type-utility-1 tracking-px leading-5 hover:bg-utility-hover disabled:bg-utility-disabled-background disabled:border-utility-disabled-background w-full"
            style={{ 
              fontFamily: '"SimonMono", "Courier New", Courier, monospace', 
              fontWeight: 400,
              border: '1px solid rgb(0, 0, 0)',
              paddingTop: '12px',
              paddingBottom: '12px',
              paddingLeft: '24px',
              paddingRight: '24px',
              backgroundColor: 'rgb(0, 0, 0)',
              color: 'rgb(255, 255, 255)',
              marginTop: '16px',
              marginBottom: '16px'
            }}
          >
            <span className="flex justify-center items-center gap-xxs preserve-line-height" style={{ fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400, color: 'rgb(255, 255, 255)' }}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Resetting...</span>
                </>
              ) : (
                'Reset Password'
              )}
            </span>
          </button>
        </form>
      </div>
    </div>
  )
}

