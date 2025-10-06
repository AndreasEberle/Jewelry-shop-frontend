'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, LoginCredentials, RegisterData } from '@/types'
import { authService } from '@/services/authService'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  register: (userData: RegisterData) => Promise<void>
  oauth2Login: (provider?: 'google') => void
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  setUser: (user: User | null) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)  // Start as loading to prevent flash
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false)

  // Check authentication status on mount with a small delay
  useEffect(() => {
    console.log('AuthContext: Mount effect - user:', user, 'hasCheckedAuth:', hasCheckedAuth)
    // Add a small delay to give backend time to start up
    const timer = setTimeout(() => {
      console.log('AuthContext: Starting delayed auth check...')
      checkAuthStatus()
    }, 50) // Minimal delay for faster authentication

    return () => clearTimeout(timer)
  }, [])

  // Listen for OAuth callback events
  useEffect(() => {
    const handleAuthChecked = (event: CustomEvent) => {
      console.log('AuthContext: Received authChecked event:', event.detail)
      if (event.detail?.user) {
        setUser(event.detail.user)
        setHasCheckedAuth(true)
      }
    }

    window.addEventListener('authChecked', handleAuthChecked as EventListener)
    return () => window.removeEventListener('authChecked', handleAuthChecked as EventListener)
  }, [])

  const checkAuthStatus = async (retryCount = 0) => {
    console.log('AuthContext: Checking auth status... (attempt', retryCount + 1, ')')
    console.log('AuthContext: Current user before check:', user ? `${user.email} (${user.roles?.join(', ')})` : 'null')
    const token = localStorage.getItem('jwt_token')
    console.log('AuthContext: JWT token in localStorage:', token ? `Present (${token.substring(0, 20)}...)` : 'Missing')
    console.log('AuthContext: All localStorage keys:', Object.keys(localStorage))
    setIsLoading(true)
    
    try {
      console.log('AuthContext: Calling authService.getCurrentUser()...')
      const userData = await authService.getCurrentUser()
      console.log('AuthContext: Got user data from API:', userData)
      console.log('AuthContext: User data type:', typeof userData)
      console.log('AuthContext: User data keys:', Object.keys(userData || {}))
      setUser(userData)
      console.log('AuthContext: User set successfully')
    } catch (error) {
      console.error('AuthContext: Auth check failed:', error)
      console.error('AuthContext: Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        code: error.code,
        name: error.name
      })
      
      // Handle different types of errors
      if (error.response?.status === 401) {
        // 401 = Unauthorized - token is invalid/expired
        console.log('AuthContext: 401 error - token invalid, clearing user')
        setUser(null)
        localStorage.removeItem('jwt_token')
      } else if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        // Network error - retry a few times before giving up
        console.log('AuthContext: Network error - retrying...')
        if (retryCount < 2) {
          console.log('AuthContext: Retrying in 1 second...')
          setTimeout(() => checkAuthStatus(retryCount + 1), 1000)
          return
        } else {
          console.log('AuthContext: Max retries reached, keeping existing user if any')
          // Don't clear user on network errors - they might just be temporary
        }
      } else {
        // Other errors - keep existing user
        console.log('AuthContext: Other error - keeping existing user if any')
        console.log('AuthContext: Error type:', typeof error, 'Error name:', error.name)
      }
    } finally {
      setIsLoading(false)
      setHasCheckedAuth(true)
    }
  }

  const login = async (credentials: LoginCredentials) => {
    console.log('AuthContext: Starting login process...')
    setIsLoading(true)
    try {
      console.log('AuthContext: Calling authService.login...')
      const response = await authService.login(credentials)
      console.log('AuthContext: Login successful, setting user:', response.user)
      console.log('AuthContext: JWT token after login:', localStorage.getItem('jwt_token') ? 'Present' : 'Missing')
      setUser(response.user)
      
      // Trigger cart migration and preference loading after successful login
      window.dispatchEvent(new CustomEvent('userLoggedIn'))
      
      // Add a small delay to ensure preferences are loaded before login completes
      console.log('AuthContext: Waiting for preferences to load...')
      await new Promise(resolve => setTimeout(resolve, 500))
      
      console.log('AuthContext: Login process completed successfully')
    } catch (error: any) {
      console.error('AuthContext: Login failed:', error)
      // Handle OAuth-only user error specifically
      if (error.response?.data?.error?.includes('Google')) {
        throw new Error('This account was created with Google. Please use the "Continue with Google" button to sign in.')
      }
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (userData: RegisterData) => {
    setIsLoading(true)
    try {
      const response = await authService.register(userData)
      setUser(response.user)
      // Trigger cart migration after successful registration
      window.dispatchEvent(new CustomEvent('userLoggedIn'))
    } catch (error) {
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const oauth2Login = (provider: 'google' = 'google') => {
    authService.oauth2Login(provider)
  }

  const logout = async () => {
    setIsLoading(true)
    try {
      await authService.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear user state
      setUser(null)
      setHasCheckedAuth(false)
      
      // Clear any cached data
      localStorage.removeItem('preferredCurrency')
      localStorage.removeItem('preferredLanguage')
      localStorage.removeItem('oauth_redirect_url')
      
      // Clear any JWT tokens from localStorage (for email/password users)
      localStorage.removeItem('jwt_token')
      localStorage.removeItem('jwt_refresh_token')
      
      // Dispatch logout event for other components
      window.dispatchEvent(new CustomEvent('userLoggedOut'))
      
      setIsLoading(false)
      console.log('AuthContext: Logout completed, all data cleared')
      
      // Redirect to home page after logout
      window.location.href = '/'
    }
  }

  const refreshUser = async () => {
    if (!authService.isAuthenticated()) {
      setUser(null)
      return
    }

    try {
      const userData = await authService.getCurrentUser()
      setUser(userData)
    } catch (error) {
      console.error('User refresh failed:', error)
      setUser(null)
    }
  }

  const setUserWithLogging = (newUser: User | null) => {
    console.log('AuthContext: setUser called with:', newUser)
    console.log('AuthContext: Current user before setting:', user ? `${user.email} (${user.roles?.join(', ')})` : 'null')
    setUser(newUser)
    // If we're setting a user (e.g., from OAuth), mark auth as checked
    if (newUser) {
      setHasCheckedAuth(true)
      console.log('AuthContext: User set, hasCheckedAuth:', true)
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    oauth2Login,
    logout,
    refreshUser,
    setUser: setUserWithLogging
  }

  // Debug logging for authentication state - DISABLED
  // console.log('AuthContext: Current state:', { 
  //   user: user ? `${user.email} (${user.roles?.join(', ')})` : 'null', 
  //   isLoading, 
  //   isAuthenticated: !!user 
  // })

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
