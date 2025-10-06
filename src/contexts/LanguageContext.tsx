'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { api } from '@/services/api'

interface LanguageContextType {
  currentLanguage: string
  setLanguage: (language: string) => void
  isLoading: boolean
  supportedLanguages: string[]
  getLanguageName: (languageCode: string) => string
  getLanguageFlag: (languageCode: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

interface LanguageProviderProps {
  children: ReactNode
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<string>('de-DE')
  const [isLoading, setIsLoading] = useState(false)
  const [supportedLanguages, setSupportedLanguages] = useState<string[]>(['de-DE', 'en-US', 'ja-JP', 'fr-FR', 'it-IT'])

  // Load user's preferred language on mount
  useEffect(() => {
    loadUserLanguagePreference()
    loadSupportedLanguages()
  }, [])

  // Listen for login events to load user preferences
  useEffect(() => {
    const handleLogin = async () => {
      console.log('LanguageContext: User logged in, loading language preference')
      await loadUserLanguagePreference()
    }

    const handleLogout = () => {
      console.log('LanguageContext: User logged out, resetting language')
      setCurrentLanguage('de-DE')
      setIsLoading(true)
    }

    window.addEventListener('userLoggedIn', handleLogin)
    window.addEventListener('userLoggedOut', handleLogout)
    return () => {
      window.removeEventListener('userLoggedIn', handleLogin)
      window.removeEventListener('userLoggedOut', handleLogout)
    }
  }, [])

  const loadUserLanguagePreference = async () => {
    try {
      const response = await api.get('/api/language/preference')
      setCurrentLanguage(response.data.language)
    } catch (error) {
      console.error('Failed to load language preference:', error)
      // Fallback to detected language or default
      const detectedLanguage = detectUserLanguage()
      setCurrentLanguage(detectedLanguage)
    }
  }

  const loadSupportedLanguages = async () => {
    try {
      const response = await api.get('/api/language/supported')
      setSupportedLanguages(response.data)
    } catch (error) {
      console.error('Failed to load supported languages:', error)
    }
  }

  const detectUserLanguage = (): string => {
    // Check localStorage first
    const savedLanguage = localStorage.getItem('preferredLanguage')
    if (savedLanguage && supportedLanguages.includes(savedLanguage)) {
      return savedLanguage
    }

    // Try to detect from browser locale
    const locale = navigator.language || navigator.languages?.[0] || 'de-DE'
    
    // Map common locales to our supported languages
    const languageMap: Record<string, string> = {
      'de': 'de-DE',
      'de-DE': 'de-DE',
      'en': 'en-US',
      'en-US': 'en-US',
      'ja': 'ja-JP',
      'ja-JP': 'ja-JP',
      'fr': 'fr-FR',
      'fr-FR': 'fr-FR',
      'it': 'it-IT',
      'it-IT': 'it-IT'
    }

    const detectedLanguage = languageMap[locale] || 'de-DE'
    return supportedLanguages.includes(detectedLanguage) ? detectedLanguage : 'de-DE'
  }

  const setLanguage = async (language: string) => {
    if (!supportedLanguages.includes(language)) {
      console.error('Unsupported language:', language)
      return
    }

    setIsLoading(true)
    try {
      // Try to save to backend if user is authenticated
      try {
        await api.post('/api/language/preference', { language })
      } catch (error) {
        // If user is not authenticated, this is expected - just continue
        console.log('User not authenticated, saving language locally only')
      }
      
      // Always save to localStorage as fallback
      localStorage.setItem('preferredLanguage', language)
      setCurrentLanguage(language)
      
      // Trigger a custom event to notify components of language change
      window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language } }))
    } catch (error) {
      console.error('Failed to set language preference:', error)
      // Still update locally
      localStorage.setItem('preferredLanguage', language)
      setCurrentLanguage(language)
      
      // Trigger a custom event to notify components of language change
      window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language } }))
    } finally {
      setIsLoading(false)
    }
  }

  const getLanguageName = (languageCode: string): string => {
    const languageNames: Record<string, string> = {
      'de-DE': 'Deutsch',
      'en-US': 'English',
      'ja-JP': '日本語',
      'fr-FR': 'Français',
      'it-IT': 'Italiano'
    }
    return languageNames[languageCode] || languageCode
  }

  const getLanguageFlag = (languageCode: string): string => {
    const languageFlags: Record<string, string> = {
      'de-DE': '🇩🇪',
      'en-US': '🇺🇸',
      'ja-JP': '🇯🇵',
      'fr-FR': '🇫🇷',
      'it-IT': '🇮🇹'
    }
    return languageFlags[languageCode] || '🇩🇪'
  }

  const value: LanguageContextType = {
    currentLanguage,
    setLanguage,
    isLoading,
    supportedLanguages,
    getLanguageName,
    getLanguageFlag
  }

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
