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
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleLanguageChange = async (language: string) => {
    await setLanguage(language)
    setIsOpen(false)
  }

  const updateDropdownPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX
      })
    }
  }

  // Update dropdown position when opening
  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition()
    }
  }, [isOpen])

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

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading || !currentLanguage}
        className="flex items-center space-x-2 px-2 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50"
        style={{ fontSize: '0.75em' }}
      >
        <span className="flex items-center space-x-1">
          {isLoading ? (
            <span className="animate-pulse">Loading...</span>
          ) : currentLanguage ? (
            <>
              <span className={`fi fi-${getLanguageFlag(currentLanguage)}`} style={{ fontSize: '1.25rem', width: '1.25rem', height: '1.25rem', display: 'inline-block' }}></span>
              <span>{currentLanguage.split('-')[0].toUpperCase()}</span>
            </>
          ) : (
            <span className="animate-pulse">Loading...</span>
          )}
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div 
          className="fixed w-48 bg-white border border-gray-300 rounded-md shadow-lg z-[9999]"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`
          }}
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


