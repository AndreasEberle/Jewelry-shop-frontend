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
  const [isLoading, setIsLoading] = useState(true)

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    console.log('AuthContext: Checking auth status...')
    // For OAuth users, we can't check localStorage, so we'll try to get user data
    // If it fails, we'll know the user is not authenticated
    try {
      const userData = await authService.getCurrentUser()
      console.log('AuthContext: Got user data from API:', userData)
      setUser(userData)
    } catch (error) {
      console.error('AuthContext: Auth check failed:', error)
      // Clear any invalid tokens
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true)
    try {
      const response = await authService.login(credentials)
      setUser(response.user)
      // Trigger cart migration after successful login
      window.dispatchEvent(new CustomEvent('userLoggedIn'))
    } catch (error: any) {
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
      setUser(null)
      setIsLoading(false)
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
    setUser(newUser)
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

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
