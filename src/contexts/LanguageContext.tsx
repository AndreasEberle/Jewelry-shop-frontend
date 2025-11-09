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
  const [isLoading, setIsLoading] = useState(true)
  const [supportedLanguages, setSupportedLanguages] = useState<string[]>(['de-DE', 'en-US', 'ja-JP'])

  // Load user's preferred language on mount
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true)
      await Promise.all([
        loadUserLanguagePreference(),
        loadSupportedLanguages()
      ])
      setIsLoading(false)
    }
    loadInitialData()
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
      setCurrentLanguage(detectedLanguage || 'de-DE')
    }
  }

  const loadSupportedLanguages = async () => {
    try {
      const response = await api.get('/api/language/supported')
      const allLanguages = response.data || []
      // Filter to only include enabled languages from system_config
      // For now, we'll filter on frontend - backend should return only enabled ones
      // But as a safety measure, filter out fr-FR and it-IT if they're not in our translation files
      const enabledLanguages = allLanguages.filter((lang: string) => {
        // Only include languages we have translations for
        return ['de-DE', 'en-US', 'ja-JP'].includes(lang)
      })
      setSupportedLanguages(enabledLanguages.length > 0 ? enabledLanguages : ['de-DE', 'en-US', 'ja-JP'])
    } catch (error) {
      console.error('Failed to load supported languages:', error)
      // Fallback to default enabled languages
      setSupportedLanguages(['de-DE', 'en-US', 'ja-JP'])
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
      'ja-JP': 'ja-JP'
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
      'ja-JP': '日本語'
    }
    return languageNames[languageCode] || languageCode
  }

  const getLanguageFlag = (languageCode: string): string => {
    // Return flag-icons CSS class instead of emoji
    const languageFlags: Record<string, string> = {
      'de-DE': 'de',
      'en-US': 'us',
      'ja-JP': 'jp'
    }
    return languageFlags[languageCode] || 'de'
  }

  const getLanguageFlagComponent = (languageCode: string): JSX.Element => {
    const flagCode = getLanguageFlag(languageCode)
    return <span className={`fi fi-${flagCode}`} style={{ fontSize: '1.25rem', width: '1.25rem', height: '1.25rem', display: 'inline-block' }}></span>
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
