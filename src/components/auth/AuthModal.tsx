'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { LoginCredentials, RegisterData } from '@/types'
import { X, Loader2 } from 'lucide-react'
import { Marquee } from '@/components/ui/Marquee'
import { createPortal } from 'react-dom'
import { authService } from '@/services/authService'

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
  const [mounted, setMounted] = useState(false)
  const [newsletterEmail, setNewsletterEmail] = useState(false)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('')
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: ''
  })

  const { login, register, oauth2Login } = useAuth()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setMode(initialMode)
  }, [initialMode])

  useEffect(() => {
    if (!isOpen) {
      setFormData({ email: '', password: '', firstName: '', lastName: '' })
      setError(null)
      setNewsletterEmail(false)
      setShowForgotPassword(false)
      setForgotPasswordEmail('')
      setForgotPasswordSuccess(false)
      setFieldErrors({})
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    
    if (mode === 'register') {
      if (!formData.firstName.trim()) {
        errors.firstName = 'First name is required'
      }
      if (!formData.lastName.trim()) {
        errors.lastName = 'Last name is required'
      }
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email'
    }
    
    if (!formData.password.trim()) {
      errors.password = 'Password is required'
    } else if (mode === 'register' && formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long'
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

    setIsLoading(true)

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
          newsletterSubscribed: newsletterEmail
        }
        await register(userData)
      }
      onClose()
    } catch (err: any) {
      let errorMessage = 'An error occurred'
      if (err.response?.data?.message) {
        const backendMessage = err.response.data.message
        if (backendMessage.includes('Invalid credentials')) {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.'
        } else if (backendMessage.includes('User not found')) {
          errorMessage = 'No account found with this email address. Please check your email or create a new account.'
        } else {
          errorMessage = backendMessage
        }
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error
      } else if (err.message) {
        errorMessage = err.message
      }
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthLogin = (provider: 'google' | 'apple' | 'facebook') => {
    // Currently only Google is supported, but we'll handle all for future expansion
    if (provider === 'google') {
      oauth2Login('google')
    } else {
      // Placeholder for future OAuth providers
      console.log(`${provider} OAuth not yet implemented`)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error for this field when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const ErrorIcon = () => (
    <svg className="size-[12px]" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M6.0007 2.61011C5.91403 2.61141 5.82846 2.62978 5.74888 2.66415C5.6693 2.69853 5.59728 2.74825 5.53692 2.81047C5.47656 2.87268 5.42905 2.94618 5.3971 3.02676C5.36514 3.10735 5.34938 3.19343 5.3507 3.28011V6.28011C5.3393 6.37155 5.34746 6.46438 5.37466 6.55242C5.40186 6.64047 5.44747 6.72173 5.50846 6.7908C5.56946 6.85988 5.64445 6.9152 5.72845 6.95309C5.81245 6.99098 5.90355 7.01058 5.9957 7.01058C6.08786 7.01058 6.17896 6.99098 6.26296 6.95309C6.34696 6.9152 6.42195 6.85988 6.48294 6.7908C6.54394 6.72173 6.58955 6.64047 6.61675 6.55242C6.64395 6.46438 6.65211 6.37155 6.6407 6.28011V3.28011C6.64341 3.10675 6.57779 2.93929 6.45804 2.81392C6.33828 2.68855 6.174 2.61534 6.0007 2.61011Z" fill="currentColor"></path>
      <path fillRule="evenodd" clipRule="evenodd" d="M6.00014 7.43994C5.91385 7.44 5.8285 7.45778 5.74937 7.49219C5.67025 7.52659 5.59903 7.57688 5.54014 7.63994C5.41911 7.76649 5.35156 7.93484 5.35156 8.10994C5.35156 8.28504 5.41911 8.4534 5.54014 8.57994C5.59903 8.643 5.67025 8.69329 5.74937 8.7277C5.8285 8.7621 5.91385 8.77988 6.00014 8.77994C6.08492 8.77971 6.16873 8.7618 6.24621 8.72737C6.3237 8.69293 6.39315 8.64272 6.45014 8.57994C6.57116 8.4534 6.63871 8.28504 6.63871 8.10994C6.63871 7.93484 6.57116 7.76649 6.45014 7.63994C6.39315 7.57716 6.3237 7.52695 6.24621 7.49251C6.16873 7.45808 6.08492 7.44017 6.00014 7.43994Z" fill="currentColor"></path>
      <path fillRule="evenodd" clipRule="evenodd" d="M6 0C4.81331 0 3.65328 0.351894 2.66658 1.01118C1.67989 1.67047 0.910851 2.60754 0.456726 3.7039C0.00259972 4.80026 -0.11622 6.00666 0.115291 7.17054C0.346802 8.33443 0.918247 9.40353 1.75736 10.2426C2.59648 11.0818 3.66558 11.6532 4.82946 11.8847C5.99335 12.1162 7.19975 11.9974 8.2961 11.5433C9.39246 11.0892 10.3295 10.3201 10.9888 9.33342C11.6481 8.34673 12 7.18669 12 6C12 4.4087 11.3679 2.88258 10.2426 1.75736C9.11742 0.632141 7.5913 0 6 0V0ZM6.22 11C5.22719 11.0435 4.24393 10.7902 3.39573 10.2724C2.54754 9.75453 1.87289 8.99569 1.45791 8.09272C1.04293 7.18974 0.906436 6.18358 1.06586 5.20269C1.22528 4.22179 1.67338 3.31064 2.35297 2.58556C3.03255 1.86048 3.91279 1.35436 4.88132 1.1318C5.84984 0.909237 6.86272 0.980335 7.79066 1.33602C8.7186 1.6917 9.5195 2.31583 10.0911 3.12873C10.6628 3.94164 10.9792 4.90645 11 5.9C11.0275 7.20437 10.544 8.46781 9.65281 9.42066C8.76162 10.3735 7.53329 10.9403 6.23 11H6.22Z" fill="currentColor"></path>
    </svg>
  )

  const switchMode = () => {
    setMode(prev => prev === 'login' ? 'register' : 'login')
    setError(null)
    setShowForgotPassword(false)
    setForgotPasswordSuccess(false)
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setForgotPasswordSuccess(false)
    setFieldErrors({})

    const email = forgotPasswordEmail || formData.email
    if (!email.trim()) {
      setFieldErrors({ email: 'Email is required' })
      setIsLoading(false)
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldErrors({ email: 'Please enter a valid email' })
      setIsLoading(false)
      return
    }

    try {
      await authService.forgotPassword(email)
      setForgotPasswordSuccess(true)
    } catch (err: any) {
      let errorMessage = 'Failed to send password reset email'
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      } else if (err.message) {
        errorMessage = err.message
      }
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  if (!mounted || !isOpen) {
    return null
  }

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 999998 }}>
      {/* Backdrop */}
      <div
        className="fixed inset-0 transition-opacity duration-300"
        style={{ 
          backgroundColor: 'rgba(0, 0, 0, 0.15)',
          zIndex: 999998,
          pointerEvents: isOpen ? 'auto' : 'none' 
        }}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div
        role="dialog"
        aria-labelledby="modal-title"
        data-state={isOpen ? "open" : "closed"}
        data-testid="modal-content"
        className="fixed bg-white bottom-0 w-dvw h-[100dvh] rounded-t-lg md:rounded-none data-[state=open]:animate-contentShowBottom data-[state=closed]:animate-contentHideBottom md:data-[state=open]:animate-contentShowInset md:top-1/2 md:left-1/2 md:min-h-[10vh] md:max-h-[85vh] md:w-[90vw] md:max-w-[450px] md:-translate-x-1/2 md:-translate-y-1/2 md:h-fit md:min-w-[33rem] overflow-y-auto"
        style={{ 
          zIndex: 999999,
          pointerEvents: 'auto',
          position: 'fixed'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="modal-title" style={{ position: 'absolute', border: '0px', width: '1px', height: '1px', padding: '0px', margin: '-1px', overflow: 'hidden', clip: 'rect(0px, 0px, 0px, 0px)', whiteSpace: 'nowrap', overflowWrap: 'normal' }}>
          {mode === 'login' ? 'sign-in' : 'sign-up'}
        </h2>

        <div>
          {/* Header Section - Black Background */}
          <div className="pt-2xl pb-lg px-md md:p-xl" style={{ backgroundColor: 'rgb(0, 0, 0)', color: 'rgb(255, 255, 255)', padding: '32px' }}>
            <div>
              <div className="flex flex-col gap-sm">
                <h4 className="type-heading-4 text-inherit" style={{ fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400 }}>
                  {showForgotPassword ? 'Forgot password' : (mode === 'login' ? 'Welcome Back' : 'GET MORE AS A MEMBER')}
                </h4>
              </div>
              <div className="mt-xs">
                <p className="type-body-2 text-inherit" style={{ fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400 }}>
                  {showForgotPassword 
                    ? "We'll send instructions to reset your password to the email below."
                    : (mode === 'login' 
                      ? "Enjoy the fine life with early sale access and birthday treats when you're a member. Sign in to see your perks."
                      : "Join for free and get 10% off your first purchase of $150 or more. Your promotion will automatically be applied on the checkout.")}
                </p>
              </div>
            </div>
          </div>

          {/* Marquee Section - Hide when forgot password */}
          {!showForgotPassword && <Marquee />}

          {/* Form Section */}
          <div className="py-lg px-md md:p-xl w-full" style={{ padding: '32px' }}>
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded" style={{ fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400 }}>
                {error}
              </div>
            )}

            {forgotPasswordSuccess && (
              <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded" style={{ fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400 }}>
                Password reset email sent! Please check your inbox for instructions.
              </div>
            )}

            {showForgotPassword && mode === 'login' ? (
              <form onSubmit={handleForgotPassword} noValidate>
                <div className="mb-md text-content relative" style={{ minHeight: '48px', marginTop: '3px' }}>
                  <input
                    id="forgot-email"
                    className="type-body-2 border-b placeholder-transparent peer w-full placeholder:opacity-0 bg-transparent relative px-0 border-t-0 border-l-0 border-r-0 rounded-none outline-none data-[keyboard-focus=true]:ring-2 data-[keyboard-focus=true]:ring-utility-focus data-[keyboard-focus=true]:ring-offset-4 border-current"
                    placeholder="Email*"
                    data-keyboard-focus="false"
                    type="email"
                    value={forgotPasswordEmail || formData.email}
                    onChange={(e) => {
                      setForgotPasswordEmail(e.target.value)
                      if (fieldErrors.email) {
                        setFieldErrors(prev => {
                          const newErrors = { ...prev }
                          delete newErrors.email
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
                    htmlFor="forgot-email"
                    className={`type-caption text-content absolute left-0 transition-all duration-300 ease-in-out cursor-text ${
                      (forgotPasswordEmail || formData.email) || 'peer-placeholder-shown:translate-y-[12px] peer-placeholder-shown:type-body-2 peer-placeholder-shown:text-content-mid'
                    } ${(forgotPasswordEmail || formData.email) ? '-translate-y-[8px]' : 'peer-focus:-translate-y-[8px] peer-focus:type-caption'}`}
                    style={{ fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400 }}
                  >
                    Email*
                  </label>
                  {fieldErrors.email && (
                    <span className="type-caption flex items-center gap-xxs" aria-live="polite" style={{ marginTop: '4px', color: 'rgb(239, 68, 68)' }}>
                      <ErrorIcon />
                      {fieldErrors.email}
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
                        <span>Sending...</span>
                      </>
                    ) : (
                      'Send Reset Link'
                    )}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false)
                    setForgotPasswordEmail('')
                    setForgotPasswordSuccess(false)
                    setError(null)
                  }}
                  className="relative pointer-events-auto inline-block text-center outline-none border border-content hover:border-utility-hover disabled:text-utility-disabled focus-visible:ring-2 ring-utility-focus ring-offset-2 transition-colors duration-300 ease-ease bg-transparent border-none p-0 tracking-utility underline capitalize text-content [&_span]:type-body-2 underline-offset-2 w-full text-center mt-md"
                  style={{ fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400 }}
                >
                  <span className="flex justify-center items-center gap-xxs preserve-line-height" style={{ fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400 }}>
                    Back to Sign In
                  </span>
                </button>
              </form>
            ) : (
            <form onSubmit={handleSubmit} noValidate>
              {/* Hidden input for autofill prevention */}
              <input className="opacity-0 h-0 w-0" type="text" />

              {/* OAuth Buttons */}
              <button
                type="button"
                onClick={() => handleOAuthLogin('google')}
                className="pointer-events-auto inline-block uppercase text-center outline-none hover:border-utility-hover disabled:text-utility-disabled focus-visible:ring-2 ring-utility-focus ring-offset-2 transition-colors duration-300 ease-ease bg-transparent text-content hover:bg-background-light disabled:border-utility-disabled disabled:bg-transparent w-full"
                data-title="Google Sign Up"
                style={{ 
                  fontFamily: '"SimonMono", "Courier New", Courier, monospace',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  padding: '16px',
                  border: '1px solid rgb(0, 0, 0)',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" role="graphics-symbol" viewBox="0 0 22 22" fill="none">
                  <title>Google</title>
                  <path d="M20.68 11.2291C20.68 10.5141 20.6158 9.82663 20.4967 9.16663H11V13.0716H16.4267C16.1883 14.3275 15.4733 15.3908 14.4008 16.1058V18.645H17.6733C19.58 16.885 20.68 14.3 20.68 11.2291Z" fill="#4285F4"></path>
                  <path d="M11.0002 21.0834C13.7227 21.0834 16.0052 20.185 17.6735 18.645L14.401 16.1059C13.5027 16.7109 12.3569 17.0775 11.0002 17.0775C8.37854 17.0775 6.15104 15.3084 5.35354 12.925H1.99854V15.5284C3.6577 18.8192 7.05853 21.0834 11.0002 21.0834Z" fill="#34A853"></path>
                  <path d="M5.35317 12.9158C5.1515 12.3108 5.03234 11.6692 5.03234 11C5.03234 10.3308 5.1515 9.68917 5.35317 9.08417V6.48083H1.99817C1.31067 7.8375 0.916504 9.36834 0.916504 11C0.916504 12.6317 1.31067 14.1625 1.99817 15.5192L4.61067 13.4842L5.35317 12.9158Z" fill="#FBBC05"></path>
                  <path d="M11.0002 4.93163C12.4852 4.93163 13.8052 5.44496 14.8594 6.43496L17.7469 3.54746C15.996 1.91579 13.7227 0.916626 11.0002 0.916626C7.05854 0.916626 3.6577 3.18079 1.99854 6.48079L5.35354 9.08413C6.15104 6.70079 8.37854 4.93163 11.0002 4.93163Z" fill="#EA4335"></path>
                </svg>
                <span style={{ fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 700 }}>
                  CONTINUE WITH GOOGLE
                </span>
              </button>

              {/* Divider */}
              <div className="flex items-center mb-md">
                <div className="flex-grow bg-background-light h-0.5"></div>
                <p className="type-body-2 flex-grow-0 mx-5 text-content" style={{ fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400 }}>
                  or
                </p>
                <div className="flex-grow bg-background-light h-0.5"></div>
              </div>

              {/* First Name & Last Name (Register only) */}
              {mode === 'register' && (
                <>
                    <div className="mb-md text-content relative" style={{ minHeight: '48px', marginTop: '3px' }}>
                    <input
                      id="firstName"
                      className="type-body-2 border-b placeholder-transparent peer w-full placeholder:opacity-0 bg-transparent relative px-0 border-t-0 border-l-0 border-r-0 rounded-none outline-none data-[keyboard-focus=true]:ring-2 data-[keyboard-focus=true]:ring-utility-focus data-[keyboard-focus=true]:ring-offset-4 border-current"
                      placeholder="First Name*"
                      data-keyboard-focus="false"
                      type="text"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      name="firstName"
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
                      htmlFor="firstName"
                      className={`type-caption text-content absolute left-0 transition-all duration-300 ease-in-out cursor-text ${
                        formData.firstName || 'peer-placeholder-shown:translate-y-[12px] peer-placeholder-shown:type-body-2 peer-placeholder-shown:text-content-mid'
                      } ${formData.firstName ? '-translate-y-[8px]' : 'peer-focus:-translate-y-[8px] peer-focus:type-caption'}`}
                      style={{ fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400 }}
                    >
                      First Name*
                    </label>
                    {fieldErrors.firstName && (
                      <span className="type-caption flex items-center gap-xxs" aria-live="polite" style={{ marginTop: '4px', color: 'rgb(239, 68, 68)' }}>
                        <ErrorIcon />
                        {fieldErrors.firstName}
                      </span>
                    )}
                  </div>
                    <div className="mb-md text-content relative" style={{ minHeight: '48px', marginTop: '3px' }}>
                    <input
                      id="lastName"
                      className="type-body-2 border-b placeholder-transparent peer w-full placeholder:opacity-0 bg-transparent relative px-0 border-t-0 border-l-0 border-r-0 rounded-none outline-none data-[keyboard-focus=true]:ring-2 data-[keyboard-focus=true]:ring-utility-focus data-[keyboard-focus=true]:ring-offset-4 border-current"
                      placeholder="Last Name*"
                      data-keyboard-focus="false"
                      type="text"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      name="lastName"
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
                      htmlFor="lastName"
                      className={`type-caption text-content absolute left-0 transition-all duration-300 ease-in-out cursor-text ${
                        formData.lastName || 'peer-placeholder-shown:translate-y-[12px] peer-placeholder-shown:type-body-2 peer-placeholder-shown:text-content-mid'
                      } ${formData.lastName ? '-translate-y-[8px]' : 'peer-focus:-translate-y-[8px] peer-focus:type-caption'}`}
                      style={{ fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400 }}
                    >
                      Last Name*
                    </label>
                    {fieldErrors.lastName && (
                      <span className="type-caption flex items-center gap-xxs" aria-live="polite" style={{ marginTop: '4px', color: 'rgb(239, 68, 68)' }}>
                        <ErrorIcon />
                        {fieldErrors.lastName}
                      </span>
                    )}
                  </div>
                </>
              )}

              {/* Email Input */}
              <div className="mb-md text-content relative" style={{ minHeight: '48px', marginTop: '3px' }}>
                <input
                  id="email"
                  className="type-body-2 border-b placeholder-transparent peer w-full placeholder:opacity-0 bg-transparent relative px-0 border-t-0 border-l-0 border-r-0 rounded-none outline-none data-[keyboard-focus=true]:ring-2 data-[keyboard-focus=true]:ring-utility-focus data-[keyboard-focus=true]:ring-offset-4 border-current"
                  placeholder="Email*"
                  data-keyboard-focus="false"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  name="email"
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
                  htmlFor="email"
                  className={`type-caption text-content absolute left-0 transition-all duration-300 ease-in-out cursor-text ${
                    formData.email || 'peer-placeholder-shown:translate-y-[12px] peer-placeholder-shown:type-body-2 peer-placeholder-shown:text-content-mid'
                  } ${formData.email ? '-translate-y-[8px]' : 'peer-focus:-translate-y-[8px] peer-focus:type-caption'}`}
                  style={{ fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400 }}
                >
                  Email*
                </label>
                {fieldErrors.email && (
                  <span className="type-caption flex items-center gap-xxs" aria-live="polite" style={{ marginTop: '4px', color: 'rgb(239, 68, 68)' }}>
                    <ErrorIcon />
                    {fieldErrors.email}
                  </span>
                )}
              </div>

              {/* Password Input */}
              <div className="mb-md text-content relative" style={{ minHeight: '48px', marginTop: '3px' }}>
                <input
                  id="password"
                  className="type-body-2 border-b placeholder-transparent peer w-full placeholder:opacity-0 bg-transparent relative px-0 border-t-0 border-l-0 border-r-0 rounded-none outline-none data-[keyboard-focus=true]:ring-2 data-[keyboard-focus=true]:ring-utility-focus data-[keyboard-focus=true]:ring-offset-4 border-current"
                  placeholder="Password*"
                  data-keyboard-focus="false"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  name="password"
                  required
                  style={{ 
                    color: 'rgb(0, 0, 0)', 
                    borderColor: 'rgb(0, 0, 0)', 
                    borderBottom: '1px solid rgb(0, 0, 0)',
                    fontFamily: '"SimonMono", "Courier New", Courier, monospace', 
                    fontWeight: 400,
                    paddingTop: '12px',
                    paddingBottom: '8px',
                    paddingRight: '60px'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 px-xxs"
                  style={{ 
                    fontFamily: '"SimonMono", "Courier New", Courier, monospace', 
                    fontWeight: 400,
                    top: '12px',
                    bottom: 'auto'
                  }}
                >
                  <span className="type-utility-2 text-content underline" style={{ fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400 }}>
                    {showPassword ? 'Hide' : 'Show'}
                  </span>
                </button>
                <label
                  htmlFor="password"
                  className={`type-caption text-content absolute left-0 transition-all duration-300 ease-in-out cursor-text ${
                    formData.password || 'peer-placeholder-shown:translate-y-[12px] peer-placeholder-shown:type-body-2 peer-placeholder-shown:text-content-mid'
                  } ${formData.password ? '-translate-y-[8px]' : 'peer-focus:-translate-y-[8px] peer-focus:type-caption'}`}
                  style={{ fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400 }}
                >
                  Password*
                </label>
                {fieldErrors.password && (
                  <span className="type-caption flex items-center gap-xxs" aria-live="polite" style={{ marginTop: '4px', color: 'rgb(239, 68, 68)' }}>
                    <ErrorIcon />
                    {fieldErrors.password}
                  </span>
                )}
              </div>

              {/* Newsletter Subscription (Register only) */}
              {mode === 'register' && (
                <div className="flex items-center gap-2 mb-lg" style={{ marginTop: '24px' }}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={newsletterEmail}
                    data-state={newsletterEmail ? "checked" : "unchecked"}
                    onClick={() => setNewsletterEmail(!newsletterEmail)}
                    className="border border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground disabled:bg-content-light disabled:border-0 disabled:cursor-not-allowed duration-300 flex hover:border-content-dark items-center justify-center peer rounded-sm shrink-0 size-4 text-primary transition-colors focus:ring-0 focus-visible:outline-utility-focus focus-visible:outline-offset-2 focus-visible:outline-2 focus-visible:outline"
                    style={{ fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400 }}
                  >
                    {newsletterEmail && <span className="text-white text-xs">✓</span>}
                  </button>
                  <p className="type-body-2 text-content" style={{ fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400 }}>
                    Get updates on perks and promotions.
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="relative pointer-events-auto inline-block uppercase text-center outline-none hover:border-utility-hover disabled:text-utility-disabled focus-visible:ring-2 ring-utility-focus ring-offset-2 transition-colors duration-300 ease-ease type-utility-1 tracking-px leading-5 hover:bg-utility-hover disabled:bg-utility-disabled-background disabled:border-utility-disabled-background w-full"
                data-title={mode === 'login' ? 'Sign In' : 'Sign Up'}
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
                <span className="flex justify-center items-center gap-xxs preserve-line-height" style={{ fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400, color: 'rgb(255, 255, 255)', paddingRight: '8px' }}>
                  {mode === 'login' ? 'Sign In' : 'JOIN NOW FOR FREE'}
                </span>
              </button>

              {/* Terms & Privacy (Register only) */}
              {mode === 'register' && (
                <p className="type-caption text-content mb-md !text-xs" style={{ fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400, marginTop: '16px' }}>
                  By creating an account, you agree to our{' '}
                  <a href="/terms" target="_blank" rel="noopener noreferrer" className="pointer-events-auto transition-[color] ease-ease duration-300 focus-visible:ring-1 ring-utility-focus ring-offset-4 outline-none w-fit bg-[size:100%_100%] bg-link-underline bg-no-repeat bg-right from-current to-current hover:text-utility-hover capitalize underline" aria-label="Terms & Conditions" style={{ fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400 }}>
                    Terms & Conditions
                  </a>{' '}
                  as well as our{' '}
                  <a href="/privacy" target="_blank" rel="noopener noreferrer" className="pointer-events-auto transition-[color] ease-ease duration-300 focus-visible:ring-1 ring-utility-focus ring-offset-4 outline-none w-fit bg-[size:100%_100%] bg-link-underline bg-no-repeat bg-right from-current to-current hover:text-utility-hover capitalize underline" aria-label="Privacy Policy" style={{ fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400 }}>
                    Privacy Policy
                  </a>.
                </p>
              )}

              {/* Footer Links */}
              <div className={mode === 'login' ? "md:flex-row flex-col flex justify-center md:justify-between" : "flex items-center justify-center text-content"} style={{ marginTop: '16px' }}>
                {mode === 'login' ? (
                  <>
                    <div className="flex md:justify-start justify-center md:mb-0 mb-sm">
                      <p className="type-body-2 text-content" style={{ fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400, marginRight: '4px' }}>
                        Not a member?
                      </p>
                      <button
                        type="button"
                        onClick={switchMode}
                        className="relative pointer-events-auto inline-block text-center outline-none border border-content hover:border-utility-hover disabled:text-utility-disabled focus-visible:ring-2 ring-utility-focus ring-offset-2 transition-colors duration-300 ease-ease bg-transparent border-none p-0 tracking-utility underline capitalize text-content [&_span]:type-body-2 underline-offset-2"
                        data-title="Modal Sign Up"
                        style={{ fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400 }}
                      >
                        <span className="flex justify-center items-center gap-xxs preserve-line-height" style={{ fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400 }}>
                          Join Now
                        </span>
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="relative pointer-events-auto inline-block text-center outline-none border border-content hover:border-utility-hover disabled:text-utility-disabled focus-visible:ring-2 ring-utility-focus ring-offset-2 transition-colors duration-300 ease-ease bg-transparent border-none p-0 tracking-utility underline capitalize text-content [&_span]:type-body-2 underline-offset-2"
                      data-title="Sign In Forgot Password"
                      style={{ fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400 }}
                    >
                      <span className="flex justify-center items-center gap-xxs preserve-line-height" style={{ fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400 }}>
                        Forgot Your Password?
                      </span>
                    </button>
                  </>
                ) : (
                  <>
                    <p className="type-caption text-content !text-xs" style={{ fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400, marginRight: '4px' }}>
                      Already have an account?
                    </p>
                    <button
                      type="button"
                      onClick={switchMode}
                      className="relative pointer-events-auto inline-block text-center outline-none border border-content hover:border-utility-hover disabled:text-utility-disabled focus-visible:ring-2 ring-utility-focus ring-offset-2 transition-colors duration-300 ease-ease bg-transparent border-none p-0 tracking-utility underline capitalize text-content [&_span]:type-body-2 underline-offset-2 text-xs"
                      data-title="Modal Sign In"
                      style={{ fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400 }}
                    >
                      <span className="flex justify-center items-center gap-xxs preserve-line-height" style={{ fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400 }}>
                        Sign In
                      </span>
                    </button>
                  </>
                )}
              </div>
            </form>
            )}
          </div>
        </div>

        {/* Close Button */}
        <button
          className="absolute top-[10px] right-[10px] z-modal outline-none focus-visible:ring-1 ring-utility-focus ring-offset-2"
          type="button"
          data-testid="modal-close"
          title="close window"
          onClick={onClose}
        >
          <X className="w-lg h-lg text-black" />
        </button>
      </div>
    </div>,
    document.body
  )
}
