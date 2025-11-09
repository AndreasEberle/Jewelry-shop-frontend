'use client'

import React, { useState, useEffect, useRef } from 'react'
import { ChevronDown } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

interface LanguageSelectorCompactProps {
  className?: string
}

export const LanguageSelectorCompact: React.FC<LanguageSelectorCompactProps> = ({ className = '' }) => {
  const { 
    currentLanguage, 
    setLanguage, 
    supportedLanguages, 
    isLoading, 
    getLanguageName, 
    getLanguageFlag 
  } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleLanguageChange = async (language: string) => {
    await setLanguage(language)
    setIsOpen(false)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Show skeleton until language is loaded
  if (isLoading || !currentLanguage) {
    return (
      <div className={`relative ${className}`}>
        <div className="flex items-center space-x-2 px-2 py-1.5 text-xs font-medium bg-white border border-gray-300 rounded-md animate-pulse" style={{ fontSize: '0.75em' }}>
          <div className="w-5 h-5 bg-gray-200 rounded"></div>
          <div className="w-6 h-4 bg-gray-200 rounded"></div>
          <div className="w-4 h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-2 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        style={{ fontSize: '0.75em' }}
      >
        <span className="flex items-center space-x-1">
          <span className={`fi fi-${getLanguageFlag(currentLanguage)}`} style={{ fontSize: '1.25rem', width: '1.25rem', height: '1.25rem', display: 'inline-block' }}></span>
          <span>{currentLanguage.split('-')[0].toUpperCase()}</span>
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div 
          className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-300 rounded-md shadow-lg z-[9999]"
        >
          <div className="py-1">
            {supportedLanguages.map((language) => (
              <button
                key={language}
                onClick={() => handleLanguageChange(language)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-3 ${
                  currentLanguage === language ? 'bg-primary-50 text-primary-700' : 'text-gray-700'
                }`}
              >
                <span className={`fi fi-${getLanguageFlag(language)}`} style={{ fontSize: '1.25rem', width: '1.25rem', height: '1.25rem', display: 'inline-block' }}></span>
                <div>
                  <div className="font-medium">{getLanguageName(language)}</div>
                  <div className="text-xs text-gray-500">{language.toUpperCase()}</div>
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


