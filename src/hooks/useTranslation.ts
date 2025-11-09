'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { useMemo, useEffect, useState } from 'react'

// Import translation files
import enUS from '@/locales/en-US.json'
import deDE from '@/locales/de-DE.json'
import jaJP from '@/locales/ja-JP.json'

type TranslationKey = string
type TranslationObject = Record<string, any>

const translations: Record<string, TranslationObject> = {
  'en-US': enUS,
  'de-DE': deDE,
  'ja-JP': jaJP,
}

/**
 * Hook to get translations based on current language
 * Usage: const t = useTranslation(); t('common.search') => "Search" or "Suchen"
 */
export function useTranslation() {
  const { currentLanguage, isLoading } = useLanguage()
  const [updateKey, setUpdateKey] = useState(0)
  
  // Listen for language changes to force re-render
  useEffect(() => {
    const handleLanguageChange = () => {
      setUpdateKey(prev => prev + 1)
    }
    
    window.addEventListener('languageChanged', handleLanguageChange)
    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange)
    }
  }, [])
  
  const t = useMemo(() => {
    const lang = currentLanguage || 'en-US'
    const translation = translations[lang] || translations['en-US']
    
    return (key: TranslationKey): string => {
      const keys = key.split('.')
      let value: any = translation
      
      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k]
        } else {
          // Fallback to English if translation not found
          const fallback = translations['en-US']
          let fallbackValue: any = fallback
          for (const fk of keys) {
            if (fallbackValue && typeof fallbackValue === 'object' && fk in fallbackValue) {
              fallbackValue = fallbackValue[fk]
            } else {
              return key // Return key if not found in fallback either
            }
          }
          return typeof fallbackValue === 'string' ? fallbackValue : key
        }
      }
      
      return typeof value === 'string' ? value : key
    }
  }, [currentLanguage, updateKey])
  
  return { t, currentLanguage, isLoading }
}

