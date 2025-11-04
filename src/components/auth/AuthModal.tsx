'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { LoginCredentials, RegisterData } from '@/types'
import { Eye, EyeOff, X } from 'lucide-react'
import { Marquee } from '@/components/ui/Marquee'
import { createPortal } from 'react-dom'

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

  useEffect(() => {
    setMounted(true)
  }, [])

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
      setNewsletterEmail(false)
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

  // Handle ESC key to close modal
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
        countryCode: formData.phoneCode,
        phoneNumber: formData.phone || undefined,
        dateOfBirth: formData.dateOfBirth && formData.dateOfBirth.trim() !== '' ? formData.dateOfBirth : undefined,
        gender: formData.gender && formData.gender.trim() !== '' ? formData.gender : undefined,
        address: formData.address.street ? formData.address : undefined,
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

  if (!mounted || !isOpen) return null

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black z-[999998] transition-opacity duration-300"
        style={{ opacity: 0.6, pointerEvents: isOpen ? 'auto' : 'none' }}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        role="dialog"
        aria-labelledby="modal-title"
        data-state={isOpen ? "open" : "closed"}
        data-testid="modal-content"
        className="fixed bg-white z-[999999] bottom-0 w-dvw h-[100dvh] rounded-t-lg md:rounded-none md:top-1/2 md:left-1/2 md:min-h-[10vh] md:max-h-[85vh] md:w-[90vw] md:max-w-[450px] md:-translate-x-1/2 md:-translate-y-1/2 md:h-fit md:min-w-[33rem] overflow-y-auto"
        style={{ 
          pointerEvents: 'auto',
          animation: isOpen ? 'contentShowBottom 0.3s ease-out' : 'contentHideBottom 0.3s ease-in'
        }}
        onClick={(e) => {
          e.stopPropagation()
        }}
      >
      <h2 id="modal-title" style={{ position: 'absolute', border: '0px', width: '1px', height: '1px', padding: '0px', margin: '-1px', overflow: 'hidden', clip: 'rect(0px, 0px, 0px, 0px)', whiteSpace: 'nowrap', overflowWrap: 'normal' }}>
        sign-in
      </h2>
      
      <div>
        {/* Header Section - Black Background */}
        <div className="pt-2xl pb-lg px-md md:p-xl" style={{ backgroundColor: 'rgb(0, 0, 0)', color: 'rgb(255, 255, 255)', padding: '32px' }}>
          <div>
            <div className="flex flex-col gap-sm">
              <h4 className="type-heading-4 text-inherit" style={{ fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400 }}>
                {mode === 'login' ? 'Welcome Back' : 'Join Now'}
              </h4>
            </div>
            <div className="mt-xs">
              <p className="type-body-2 text-inherit" style={{ fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400 }}>
                {mode === 'login' 
                  ? "Enjoy the fine life with early sale access and birthday treats when you're a member. Sign in to see your perks."
                  : "Create an account to enjoy the fine life with early sale access and birthday treats."}
              </p>
            </div>
          </div>
        </div>

        {/* Marquee Section */}
        <Marquee />

        {/* Form Section */}
        <div className="py-lg px-md md:p-xl w-full" style={{ padding: '32px' }}>
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded" style={{ fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {mode === 'login' ? (
              <>
                {/* Login Form */}
                {/* Google Sign In */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="pointer-events-auto inline-block uppercase text-center outline-none border border-content hover:border-utility-hover disabled:text-utility-disabled focus-visible:ring-2 ring-utility-focus ring-offset-2 transition-colors duration-300 ease-ease type-utility-1 tracking-px leading-5 bg-transparent text-content hover:bg-background-light disabled:border-utility-disabled disabled:bg-transparent w-full relative py-sm md:py-md mb-sm px-md"
                  data-title="Google Sign Up"
                  style={{ fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400 }}
                >
                  <span className="flex justify-center items-center gap-xxs preserve-line-height relative">
                    <div className="absolute left-[18px] flex items-center justify-center">
                      <svg className="hidden md:flex w-xl h-xl" xmlns="http://www.w3.org/2000/svg" role="graphics-symbol" viewBox="0 0 22 22" fill="none">
                        <title>Google</title>
                        <path d="M20.68 11.2291C20.68 10.5141 20.6158 9.82663 20.4967 9.16663H11V13.0716H16.4267C16.1883 14.3275 15.4733 15.3908 14.4008 16.1058V18.645H17.6733C19.58 16.885 20.68 14.3 20.68 11.2291Z" fill="#4285F4"></path>
                        <path d="M11.0002 21.0834C13.7227 21.0834 16.0052 20.185 17.6735 18.645L14.401 16.1059C13.5027 16.7109 12.3569 17.0775 11.0002 17.0775C8.37854 17.0775 6.15104 15.3084 5.35354 12.925H1.99854V15.5284C3.6577 18.8192 7.05853 21.0834 11.0002 21.0834Z" fill="#34A853"></path>
                        <path d="M5.35317 12.9158C5.1515 12.3108 5.03234 11.6692 5.03234 11C5.03234 10.3308 5.1515 9.68917 5.35317 9.08417V6.48083H1.99817C1.31067 7.8375 0.916504 9.36834 0.916504 11C0.916504 12.6317 1.31067 14.1625 1.99817 15.5192L4.61067 13.4842L5.35317 12.9158Z" fill="#FBBC05"></path>
                        <path d="M11.0002 4.93163C12.4852 4.93163 13.8052 5.44496 14.8594 6.43496L17.7469 3.54746C15.996 1.91579 13.7227 0.916626 11.0002 0.916626C7.05854 0.916626 3.6577 3.18079 1.99854 6.48079L5.35354 9.08413C6.15104 6.70079 8.37854 4.93163 11.0002 4.93163Z" fill="#EA4335"></path>
                      </svg>
                      <svg className="flex md:hidden w-lg h-lg" xmlns="http://www.w3.org/2000/svg" role="graphics-symbol" viewBox="0 0 22 22" fill="none">
                        <title>Google</title>
                        <path d="M20.68 11.2291C20.68 10.5141 20.6158 9.82663 20.4967 9.16663H11V13.0716H16.4267C16.1883 14.3275 15.4733 15.3908 14.4008 16.1058V18.645H17.6733C19.58 16.885 20.68 14.3 20.68 11.2291Z" fill="#4285F4"></path>
                        <path d="M11.0002 21.0834C13.7227 21.0834 16.0052 20.185 17.6735 18.645L14.401 16.1059C13.5027 16.7109 12.3569 17.0775 11.0002 17.0775C8.37854 17.0775 6.15104 15.3084 5.35354 12.925H1.99854V15.5284C3.6577 18.8192 7.05853 21.0834 11.0002 21.0834Z" fill="#34A853"></path>
                        <path d="M5.35317 12.9158C5.1515 12.3108 5.03234 11.6692 5.03234 11C5.03234 10.3308 5.1515 9.68917 5.35317 9.08417V6.48083H1.99817C1.31067 7.8375 0.916504 9.36834 0.916504 11C0.916504 12.6317 1.31067 14.1625 1.99817 15.5192L4.61067 13.4842L5.35317 12.9158Z" fill="#FBBC05"></path>
                        <path d="M11.0002 4.93163C12.4852 4.93163 13.8052 5.44496 14.8594 6.43496L17.7469 3.54746C15.996 1.91579 13.7227 0.916626 11.0002 0.916626C7.05854 0.916626 3.6577 3.18079 1.99854 6.48079L5.35354 9.08413C6.15104 6.70079 8.37854 4.93163 11.0002 4.93163Z" fill="#EA4335"></path>
                      </svg>
                    </div>
                    Continue With Google
                  </span>
                </button>

                {/* Divider */}
                <div style={{ padding: '16px', border: '1px solid', borderColor: 'rgb(0, 0, 0)', marginBottom: '24px' }}>
                  <div className="flex items-center">
                    <div className="flex-grow bg-background-light h-0.5"></div>
                    <p className="type-body-2 flex-grow-0 mx-5 text-content" style={{ fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400 }}>
                      or
                    </p>
                    <div className="flex-grow bg-background-light h-0.5"></div>
                  </div>
                </div>

                  {/* Email Input */}
                  <div className="mb-md text-content relative">
                    <input
                      id="email"
                      className="type-body-2 border-b placeholder-transparent peer w-full placeholder:opacity-0 bg-transparent relative px-0 pt-sm border-t-0 border-l-0 border-r-0 rounded-none pb-xs outline-none data-[keyboard-focus=true]:ring-2 data-[keyboard-focus=true]:ring-utility-focus data-[keyboard-focus=true]:ring-offset-4 border-current"
                      placeholder="Email*"
                      data-keyboard-focus="false"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      name="email"
                      required
                      style={{ color: 'rgb(0, 0, 0)', borderColor: 'rgb(0, 0, 0)', fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400 }}
                    />
                    <label
                      htmlFor="email"
                      className="type-caption text-content absolute left-0 -translate-y-xs transition-all ease-in-out peer-placeholder-shown:translate-y-sm peer-placeholder-shown:type-body-2 peer-focus:-translate-y-xs peer-focus:type-caption cursor-text peer-placeholder-shown:text-content-mid"
                      style={{ fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400 }}
                    >
                      Email*
                    </label>
                  </div>

                  {/* Password Input */}
                  <div className="mb-md text-content relative">
                    <input
                      id="password"
                      className="type-body-2 border-b placeholder-transparent peer w-full placeholder:opacity-0 bg-transparent relative px-0 pt-sm border-t-0 border-l-0 border-r-0 rounded-none pb-xs outline-none data-[keyboard-focus=true]:ring-2 data-[keyboard-focus=true]:ring-utility-focus data-[keyboard-focus=true]:ring-offset-4 border-current"
                      placeholder="Password*"
                      data-keyboard-focus="false"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleInputChange}
                      name="password"
                      required
                      style={{ color: 'rgb(0, 0, 0)', borderColor: 'rgb(0, 0, 0)', fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 bottom-xxs px-xxs"
                      style={{ fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400 }}
                    >
                      <span className="type-utility-2 text-content underline">
                        {showPassword ? 'Hide' : 'Show'}
                      </span>
                    </button>
                    <label
                      htmlFor="password"
                      className="type-caption text-content absolute left-0 -translate-y-xs transition-all ease-in-out peer-placeholder-shown:translate-y-sm peer-placeholder-shown:type-body-2 peer-focus:-translate-y-xs peer-focus:type-caption cursor-text peer-placeholder-shown:text-content-mid"
                      style={{ fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400 }}
                    >
                      Password*
                    </label>
                  </div>

                  {/* Sign In Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="relative pointer-events-auto inline-block uppercase px-lg text-center outline-none border border-content hover:border-utility-hover disabled:text-utility-disabled focus-visible:ring-2 ring-utility-focus ring-offset-2 transition-colors duration-300 ease-ease type-utility-1 tracking-px leading-5 bg-content text-content-inv hover:bg-utility-hover disabled:bg-utility-disabled-background disabled:border-utility-disabled-background py-sm w-full"
                    data-title="Sign In"
                    style={{ fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400 }}
                  >
                    <span className="flex justify-center items-center gap-xxs preserve-line-height">
                      Sign In
                    </span>
                  </button>

                  {/* Footer Links */}
                  <div className="md:flex-row flex-col flex justify-center md:justify-between mt-md">
                    <div className="flex md:justify-start justify-center md:mb-0 mb-sm">
                      <p className="type-body-2 text-content mr-xxs" style={{ fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400 }}>
                        Not a member?
                      </p>
                      <button
                        type="button"
                        onClick={switchMode}
                        className="relative pointer-events-auto inline-block text-center outline-none border border-content hover:border-utility-hover disabled:text-utility-disabled focus-visible:ring-2 ring-utility-focus ring-offset-2 transition-colors duration-300 ease-ease bg-transparent border-none p-0 tracking-utility underline capitalize text-content [&_span]:type-body-2 underline-offset-2"
                        data-title="Modal Sign Up"
                        style={{ fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400 }}
                      >
                        <span className="flex justify-center items-center gap-xxs preserve-line-height">
                          Join Now
                        </span>
                      </button>
                    </div>
                    <button
                      type="button"
                      className="relative pointer-events-auto inline-block text-center outline-none border border-content hover:border-utility-hover disabled:text-utility-disabled focus-visible:ring-2 ring-utility-focus ring-offset-2 transition-colors duration-300 ease-ease bg-transparent border-none p-0 tracking-utility underline capitalize text-content [&_span]:type-body-2 underline-offset-2"
                      data-title="Sign In Forgot Password"
                      style={{ fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400 }}
                    >
                      <span className="flex justify-center items-center gap-xxs preserve-line-height">
                        Forgot Your Password?
                      </span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Sign Up Form */}
                {/* Hidden input for autofill prevention */}
                <input className="opacity-0 h-0 w-0" type="text" />
                
                {/* Google Sign Up */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="pointer-events-auto inline-block uppercase text-center outline-none border border-content hover:border-utility-hover disabled:text-utility-disabled focus-visible:ring-2 ring-utility-focus ring-offset-2 transition-colors duration-300 ease-ease type-utility-1 tracking-px leading-5 bg-transparent text-content hover:bg-background-light disabled:border-utility-disabled disabled:bg-transparent w-full relative py-sm md:py-md mb-lg px-md"
                  data-title="Google Sign Up"
                  style={{ fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400 }}
                >
                  <span className="flex justify-center items-center gap-xxs preserve-line-height relative">
                    <div className="absolute left-[18px] flex items-center justify-center">
                      <svg className="hidden md:flex w-xl h-xl" xmlns="http://www.w3.org/2000/svg" role="graphics-symbol" viewBox="0 0 22 22" fill="none">
                        <title>Google</title>
                        <path d="M20.68 11.2291C20.68 10.5141 20.6158 9.82663 20.4967 9.16663H11V13.0716H16.4267C16.1883 14.3275 15.4733 15.3908 14.4008 16.1058V18.645H17.6733C19.58 16.885 20.68 14.3 20.68 11.2291Z" fill="#4285F4"></path>
                        <path d="M11.0002 21.0834C13.7227 21.0834 16.0052 20.185 17.6735 18.645L14.401 16.1059C13.5027 16.7109 12.3569 17.0775 11.0002 17.0775C8.37854 17.0775 6.15104 15.3084 5.35354 12.925H1.99854V15.5284C3.6577 18.8192 7.05853 21.0834 11.0002 21.0834Z" fill="#34A853"></path>
                        <path d="M5.35317 12.9158C5.1515 12.3108 5.03234 11.6692 5.03234 11C5.03234 10.3308 5.1515 9.68917 5.35317 9.08417V6.48083H1.99817C1.31067 7.8375 0.916504 9.36834 0.916504 11C0.916504 12.6317 1.31067 14.1625 1.99817 15.5192L4.61067 13.4842L5.35317 12.9158Z" fill="#FBBC05"></path>
                        <path d="M11.0002 4.93163C12.4852 4.93163 13.8052 5.44496 14.8594 6.43496L17.7469 3.54746C15.996 1.91579 13.7227 0.916626 11.0002 0.916626C7.05854 0.916626 3.6577 3.18079 1.99854 6.48079L5.35354 9.08413C6.15104 6.70079 8.37854 4.93163 11.0002 4.93163Z" fill="#EA4335"></path>
                      </svg>
                      <svg className="flex md:hidden w-lg h-lg" xmlns="http://www.w3.org/2000/svg" role="graphics-symbol" viewBox="0 0 22 22" fill="none">
                        <title>Google</title>
                        <path d="M20.68 11.2291C20.68 10.5141 20.6158 9.82663 20.4967 9.16663H11V13.0716H16.4267C16.1883 14.3275 15.4733 15.3908 14.4008 16.1058V18.645H17.6733C19.58 16.885 20.68 14.3 20.68 11.2291Z" fill="#4285F4"></path>
                        <path d="M11.0002 21.0834C13.7227 21.0834 16.0052 20.185 17.6735 18.645L14.401 16.1059C13.5027 16.7109 12.3569 17.0775 11.0002 17.0775C8.37854 17.0775 6.15104 15.3084 5.35354 12.925H1.99854V15.5284C3.6577 18.8192 7.05853 21.0834 11.0002 21.0834Z" fill="#34A853"></path>
                        <path d="M5.35317 12.9158C5.1515 12.3108 5.03234 11.6692 5.03234 11C5.03234 10.3308 5.1515 9.68917 5.35317 9.08417V6.48083H1.99817C1.31067 7.8375 0.916504 9.36834 0.916504 11C0.916504 12.6317 1.31067 14.1625 1.99817 15.5192L4.61067 13.4842L5.35317 12.9158Z" fill="#FBBC05"></path>
                        <path d="M11.0002 4.93163C12.4852 4.93163 13.8052 5.44496 14.8594 6.43496L17.7469 3.54746C15.996 1.91579 13.7227 0.916626 11.0002 0.916626C7.05854 0.916626 3.6577 3.18079 1.99854 6.48079L5.35354 9.08413C6.15104 6.70079 8.37854 4.93163 11.0002 4.93163Z" fill="#EA4335"></path>
                      </svg>
                    </div>
                    Continue With Google
                  </span>
                </button>


                {/* Divider */}
                <div style={{ padding: '16px', border: '1px solid', borderColor: 'rgb(0, 0, 0)', marginBottom: '24px' }}>
                  <div className="flex items-center">
                    <div className="flex-grow bg-background-light h-0.5"></div>
                    <p className="type-body-2 flex-grow-0 mx-5 text-content" style={{ fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400 }}>
                      or
                    </p>
                    <div className="flex-grow bg-background-light h-0.5"></div>
                  </div>
                </div>

                  {/* First Name Input */}
                  <div className="mb-md text-content relative">
                    <input
                      id="firstName"
                      className="type-body-2 border-b placeholder-transparent peer w-full placeholder:opacity-0 bg-transparent relative px-0 pt-sm border-t-0 border-l-0 border-r-0 rounded-none pb-xs outline-none data-[keyboard-focus=true]:ring-2 data-[keyboard-focus=true]:ring-utility-focus data-[keyboard-focus=true]:ring-offset-4 border-current"
                      placeholder="First Name*"
                      data-keyboard-focus="false"
                      type="text"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      name="firstName"
                      required
                      style={{ color: 'rgb(0, 0, 0)', borderColor: 'rgb(0, 0, 0)', fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400 }}
                    />
                    <label
                      htmlFor="firstName"
                      className="type-caption text-content absolute left-0 -translate-y-xs transition-all ease-in-out peer-placeholder-shown:translate-y-sm peer-placeholder-shown:type-body-2 peer-focus:-translate-y-xs peer-focus:type-caption cursor-text peer-placeholder-shown:text-content-mid"
                      style={{ fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400 }}
                    >
                      First Name*
                    </label>
                  </div>

                  {/* Last Name Input */}
                  <div className="mb-md text-content relative">
                    <input
                      id="lastName"
                      className="type-body-2 border-b placeholder-transparent peer w-full placeholder:opacity-0 bg-transparent relative px-0 pt-sm border-t-0 border-l-0 border-r-0 rounded-none pb-xs outline-none data-[keyboard-focus=true]:ring-2 data-[keyboard-focus=true]:ring-utility-focus data-[keyboard-focus=true]:ring-offset-4 border-current"
                      placeholder="Last Name*"
                      data-keyboard-focus="false"
                      type="text"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      name="lastName"
                      required
                      style={{ color: 'rgb(0, 0, 0)', borderColor: 'rgb(0, 0, 0)', fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400 }}
                    />
                    <label
                      htmlFor="lastName"
                      className="type-caption text-content absolute left-0 -translate-y-xs transition-all ease-in-out peer-placeholder-shown:translate-y-sm peer-placeholder-shown:type-body-2 peer-focus:-translate-y-xs peer-focus:type-caption cursor-text peer-placeholder-shown:text-content-mid"
                      style={{ fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400 }}
                    >
                      Last Name*
                    </label>
                  </div>

                  {/* Email Input */}
                  <div className="mb-md text-content relative">
                    <input
                      id="email"
                      className="type-body-2 border-b placeholder-transparent peer w-full placeholder:opacity-0 bg-transparent relative px-0 pt-sm border-t-0 border-l-0 border-r-0 rounded-none pb-xs outline-none data-[keyboard-focus=true]:ring-2 data-[keyboard-focus=true]:ring-utility-focus data-[keyboard-focus=true]:ring-offset-4 border-current"
                      placeholder="Email*"
                      data-keyboard-focus="false"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      name="email"
                      required
                      style={{ color: 'rgb(0, 0, 0)', borderColor: 'rgb(0, 0, 0)', fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400 }}
                    />
                    <label
                      htmlFor="email"
                      className="type-caption text-content absolute left-0 -translate-y-xs transition-all ease-in-out peer-placeholder-shown:translate-y-sm peer-placeholder-shown:type-body-2 peer-focus:-translate-y-xs peer-focus:type-caption cursor-text peer-placeholder-shown:text-content-mid"
                      style={{ fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400 }}
                    >
                      Email*
                    </label>
                  </div>

                  {/* Password Input */}
                  <div className="mb-md text-content relative">
                    <input
                      id="password"
                      className="type-body-2 border-b placeholder-transparent peer w-full placeholder:opacity-0 bg-transparent relative px-0 pt-sm border-t-0 border-l-0 border-r-0 rounded-none pb-xs outline-none data-[keyboard-focus=true]:ring-2 data-[keyboard-focus=true]:ring-utility-focus data-[keyboard-focus=true]:ring-offset-4 border-current"
                      placeholder="Password*"
                      data-keyboard-focus="false"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleInputChange}
                      name="password"
                      required
                      style={{ color: 'rgb(0, 0, 0)', borderColor: 'rgb(0, 0, 0)', fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 bottom-xxs px-xxs"
                      style={{ fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400 }}
                    >
                      <span className="type-utility-2 text-content underline">
                        {showPassword ? 'Hide' : 'Show'}
                      </span>
                    </button>
                    <label
                      htmlFor="password"
                      className="type-caption text-content absolute left-0 -translate-y-xs transition-all ease-in-out peer-placeholder-shown:translate-y-sm peer-placeholder-shown:type-body-2 peer-focus:-translate-y-xs peer-focus:type-caption cursor-text peer-placeholder-shown:text-content-mid"
                      style={{ fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400 }}
                    >
                      Password*
                    </label>
                  </div>

                  {/* Newsletter Subscription */}
                  <p className="type-body-2 text-content mt-lg" style={{ fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400 }}>
                    Get updates on perks and promotions.
                  </p>
                  <fieldset>
                    <legend className="sr-only">communication</legend>
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-start mt-xs mb-lg">
                        <label className="flex items-center">
                          <button
                            type="button"
                            role="checkbox"
                            aria-checked={newsletterEmail}
                            data-state={newsletterEmail ? "checked" : "unchecked"}
                            onClick={() => setNewsletterEmail(!newsletterEmail)}
                            className="border border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground disabled:bg-content-light disabled:border-0 disabled:cursor-not-allowed duration-300 flex hover:border-content-dark items-center justify-center peer rounded-sm shrink-0 size-4 text-primary transition-colors focus:ring-0 focus-visible:outline-utility-focus focus-visible:outline-offset-2 focus-visible:outline-2 focus-visible:outline"
                            id="communication.email"
                          >
                            {newsletterEmail && <span className="text-white text-xs">✓</span>}
                          </button>
                          <span className="pl-sm cursor-pointer flex-1 flex items-center gap-sm peer-disabled:text-content-light peer-disabled:cursor-not-allowed" style={{ fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400 }}>
                            Email
                          </span>
                        </label>
                      </div>
                    </div>
                  </fieldset>

                  {/* Sign Up Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="relative pointer-events-auto inline-block uppercase px-lg text-center outline-none border border-content hover:border-utility-hover disabled:text-utility-disabled focus-visible:ring-2 ring-utility-focus ring-offset-2 transition-colors duration-300 ease-ease type-utility-1 tracking-px leading-5 bg-content text-content-inv hover:bg-utility-hover disabled:bg-utility-disabled-background disabled:border-utility-disabled-background py-sm w-full"
                    data-title="Sign Up"
                    style={{ fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400 }}
                  >
                    <span className="flex justify-center items-center gap-xxs preserve-line-height">
                      JOIN NOW FOR FREE
                    </span>
                  </button>

                  {/* Terms & Privacy */}
                  <p className="type-caption text-content mb-md !text-xs mt-md" style={{ fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400 }}>
                    By creating an account, you agree to our{' '}
                    <a href="/terms" target="_blank" rel="noopener noreferrer" className="pointer-events-auto transition-[color] ease-ease duration-300 focus-visible:ring-1 ring-utility-focus ring-offset-4 outline-none w-fit bg-[size:100%_100%] bg-link-underline bg-no-repeat bg-right from-current to-current hover:text-utility-hover capitalize underline" aria-label="Terms & Conditions">
                      Terms & Conditions
                    </a>{' '}
                    as well as our{' '}
                    <a href="/privacy" target="_blank" rel="noopener noreferrer" className="pointer-events-auto transition-[color] ease-ease duration-300 focus-visible:ring-1 ring-utility-focus ring-offset-4 outline-none w-fit bg-[size:100%_100%] bg-link-underline bg-no-repeat bg-right from-current to-current hover:text-utility-hover capitalize underline" aria-label="Privacy Policy">
                      Privacy Policy
                    </a>.
                  </p>

                  {/* Already have account */}
                  <div className="flex items-center justify-center text-content">
                    <p className="type-caption text-content mr-xxs !text-xs" style={{ fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400 }}>
                      Already have an account?
                    </p>
                    <button
                      type="button"
                      onClick={switchMode}
                      className="relative pointer-events-auto inline-block text-center outline-none border border-content hover:border-utility-hover disabled:text-utility-disabled focus-visible:ring-2 ring-utility-focus ring-offset-2 transition-colors duration-300 ease-ease bg-transparent border-none p-0 tracking-utility underline capitalize text-content [&_span]:type-body-2 underline-offset-2 text-xs"
                      data-title="Modal Sign In"
                      style={{ fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400 }}
                    >
                      <span className="flex justify-center items-center gap-xxs preserve-line-height">
                        Sign In
                      </span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </form>
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
    </>,
    document.body
  )
}
