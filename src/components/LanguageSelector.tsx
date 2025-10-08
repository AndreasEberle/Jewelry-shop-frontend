'use client'

import React, { useState } from 'react'
import { ChevronDown, Globe } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

interface LanguageSelectorProps {
  className?: string
  showLabel?: boolean
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  className = '', 
  showLabel = true 
}) => {
  const { 
    currentLanguage, 
    setLanguage, 
    supportedLanguages, 
    isLoading, 
    getLanguageName, 
    getLanguageFlag 
  } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)

  const handleLanguageChange = async (language: string) => {
    await setLanguage(language)
    setIsOpen(false)
  }

  return (
    <div className={`relative ${className}`}>
      {showLabel && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Language / Sprache
        </label>
      )}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50"
      >
        <Globe className="h-4 w-4" />
        <span>{getLanguageFlag(currentLanguage)} {getLanguageName(currentLanguage)}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-300 rounded-md shadow-lg z-50">
          <div className="py-1">
            {supportedLanguages.map((language) => (
              <button
                key={language}
                onClick={() => handleLanguageChange(language)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-3 ${
                  currentLanguage === language ? 'bg-primary-50 text-primary-700' : 'text-gray-700'
                }`}
              >
                <span className="text-lg">{getLanguageFlag(language)}</span>
                <div>
                  <div className="font-medium">{getLanguageName(language)}</div>
                  <div className="text-xs text-gray-500">{language}</div>
                </div>
                {currentLanguage === language && (
                  <div className="ml-auto text-primary-600">✓</div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}


