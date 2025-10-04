'use client'

import { useEffect, useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'

/**
 * Hook that triggers re-render when language changes
 * Use this in components that need to update when language changes
 */
export const useLanguageChange = () => {
  const { currentLanguage } = useLanguage()
  const [forceUpdate, setForceUpdate] = useState(0)

  useEffect(() => {
    const handleLanguageChange = () => {
      setForceUpdate(prev => prev + 1)
    }

    window.addEventListener('languageChanged', handleLanguageChange)
    
    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange)
    }
  }, [])

  return { currentLanguage, forceUpdate }
}
