'use client'

import React, { useState, useEffect, useRef } from 'react'
import { ChevronDown, Globe } from 'lucide-react'
import { useCurrency } from '@/contexts/CurrencyContext'

interface CurrencySelectorProps {
  className?: string
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({ className = '' }) => {
  const { currentCurrency, setCurrency, supportedCurrencies, isLoading } = useCurrency()
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const currencyNames: Record<string, string> = {
    'CHF': 'Swiss Franc',
    'EUR': 'Euro',
    'USD': 'US Dollar',
    'JPY': 'Japanese Yen',
    'GBP': 'British Pound',
    'CAD': 'Canadian Dollar',
    'AUD': 'Australian Dollar'
  }

  const currencyFlags: Record<string, string> = {
    'CHF': '🇨🇭',
    'EUR': '🇪🇺',
    'USD': '🇺🇸',
    'JPY': '🇯🇵',
    'GBP': '🇬🇧',
    'CAD': '🇨🇦',
    'AUD': '🇦🇺'
  }

  const handleCurrencyChange = async (currency: string) => {
    await setCurrency(currency)
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
        disabled={isLoading || !currentCurrency}
        className="flex items-center space-x-2 px-2 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50"
      >
        <Globe className="h-3 w-3" />
        <span>
          {isLoading ? (
            <span className="animate-pulse">Loading...</span>
          ) : currentCurrency ? (
            `${currencyFlags[currentCurrency]} ${currentCurrency}`
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
            {supportedCurrencies.map((currency) => (
              <button
                key={currency}
                onClick={() => handleCurrencyChange(currency)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-3 ${
                  currentCurrency === currency ? 'bg-primary-50 text-primary-700' : 'text-gray-700'
                }`}
              >
                <span className="text-lg">{currencyFlags[currency] || '🌍'}</span>
                <div>
                  <div className="font-medium">{currency}</div>
                  <div className="text-xs text-gray-500">{currencyNames[currency] || 'Currency'}</div>
                </div>
                {currentCurrency === currency && (
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
