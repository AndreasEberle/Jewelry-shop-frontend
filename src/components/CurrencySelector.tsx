'use client'

import React, { useState } from 'react'
import { ChevronDown, Globe } from 'lucide-react'
import { useCurrency } from '@/contexts/CurrencyContext'

interface CurrencySelectorProps {
  className?: string
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({ className = '' }) => {
  const { currentCurrency, setCurrency, supportedCurrencies, isLoading } = useCurrency()
  const [isOpen, setIsOpen] = useState(false)

  const currencyNames: Record<string, string> = {
    'CHF': 'Swiss Franc',
    'EUR': 'Euro',
    'JPY': 'Japanese Yen'
  }

  const currencyFlags: Record<string, string> = {
    'CHF': '🇨🇭',
    'EUR': '🇪🇺',
    'JPY': '🇯🇵'
  }

  const handleCurrencyChange = async (currency: string) => {
    await setCurrency(currency)
    setIsOpen(false)
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading || !currentCurrency}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50"
      >
        <Globe className="h-4 w-4" />
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
        <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-300 rounded-md shadow-lg z-50">
          <div className="py-1">
            {supportedCurrencies.map((currency) => (
              <button
                key={currency}
                onClick={() => handleCurrencyChange(currency)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-3 ${
                  currentCurrency === currency ? 'bg-primary-50 text-primary-700' : 'text-gray-700'
                }`}
              >
                <span className="text-lg">{currencyFlags[currency]}</span>
                <div>
                  <div className="font-medium">{currency}</div>
                  <div className="text-xs text-gray-500">{currencyNames[currency]}</div>
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
