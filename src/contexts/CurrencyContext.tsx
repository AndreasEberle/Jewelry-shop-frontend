'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { api } from '@/services/api'

interface CurrencyContextType {
  currentCurrency: string
  setCurrency: (currency: string) => void
  convertPrice: (priceCents: number, fromCurrency: string) => number
  formatPrice: (price: number, currency: string) => string
  isLoading: boolean
  supportedCurrencies: string[]
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

interface CurrencyProviderProps {
  children: ReactNode
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
  const [currentCurrency, setCurrentCurrency] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [supportedCurrencies, setSupportedCurrencies] = useState<string[]>(['CHF', 'EUR', 'JPY'])

  // Load user's preferred currency on mount
  useEffect(() => {
    loadUserCurrencyPreference()
    loadSupportedCurrencies()
  }, [])

  // Listen for login events to load user preferences
  useEffect(() => {
    const handleLogin = async () => {
      console.log('CurrencyContext: User logged in, loading currency preference')
      await loadUserCurrencyPreference()
    }

    const handleLogout = () => {
      console.log('CurrencyContext: User logged out, resetting currency')
      setCurrentCurrency('')
      setIsLoading(true)
    }

    window.addEventListener('userLoggedIn', handleLogin)
    window.addEventListener('userLoggedOut', handleLogout)
    return () => {
      window.removeEventListener('userLoggedIn', handleLogin)
      window.removeEventListener('userLoggedOut', handleLogout)
    }
  }, [])

  const loadUserCurrencyPreference = async () => {
    try {
      const response = await api.get('/api/currency/preference')
      setCurrentCurrency(response.data.currency)
    } catch (error) {
      console.error('Failed to load currency preference:', error)
      // Fallback to detected currency or default
      const detectedCurrency = detectUserCurrency()
      setCurrentCurrency(detectedCurrency)
    } finally {
      setIsLoading(false)
    }
  }

  const loadSupportedCurrencies = async () => {
    try {
      const response = await api.get('/api/currency/supported')
      setSupportedCurrencies(response.data)
    } catch (error) {
      console.error('Failed to load supported currencies:', error)
    }
  }

  const detectUserCurrency = (): string => {
    // Check localStorage first
    const savedCurrency = localStorage.getItem('preferredCurrency')
    if (savedCurrency && supportedCurrencies.includes(savedCurrency)) {
      return savedCurrency
    }

    // Try to detect from browser locale
    const locale = navigator.language || navigator.languages?.[0] || 'en-US'
    const country = locale.split('-')[1] || locale.split('_')[1]
    
    const currencyMap: Record<string, string> = {
      // Switzerland and Liechtenstein -> CHF
      'CH': 'CHF', 'LI': 'CHF',
      
      // European Union countries -> EUR
      'DE': 'EUR', 'FR': 'EUR', 'IT': 'EUR', 'ES': 'EUR', 'AT': 'EUR', 'BE': 'EUR', 'NL': 'EUR', 'FI': 'EUR',
      'PT': 'EUR', 'GR': 'EUR', 'PL': 'EUR', 'CZ': 'EUR', 'HU': 'EUR', 'SK': 'EUR', 'SI': 'EUR',
      'EE': 'EUR', 'LV': 'EUR', 'LT': 'EUR', 'MT': 'EUR', 'CY': 'EUR', 'BG': 'EUR', 'RO': 'EUR', 'HR': 'EUR',
      
      // Japan -> JPY
      'JP': 'JPY'
    }

    const detectedCurrency = currencyMap[country] || 'CHF'
    return supportedCurrencies.includes(detectedCurrency) ? detectedCurrency : 'CHF'
  }

  const setCurrency = async (currency: string) => {
    if (!supportedCurrencies.includes(currency)) {
      console.error('Unsupported currency:', currency)
      return
    }

    setIsLoading(true)
    
    // Fixed 1-second loading delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    try {
      // Try to save to backend if user is authenticated
      try {
        await api.post('/api/currency/preference', { currency })
      } catch (error) {
        // If user is not authenticated, this is expected - just continue
        console.log('User not authenticated, saving currency locally only')
      }
      
      // Always save to localStorage as fallback
      localStorage.setItem('preferredCurrency', currency)
      setCurrentCurrency(currency)
    } catch (error) {
      console.error('Failed to set currency preference:', error)
      // Still update locally
      localStorage.setItem('preferredCurrency', currency)
      setCurrentCurrency(currency)
    } finally {
      setIsLoading(false)
    }
  }

  const convertPrice = async (priceCents: number, fromCurrency: string): Promise<number> => {
    if (fromCurrency === currentCurrency) {
      return priceCents / 100 // Convert cents to decimal
    }

    try {
      const response = await api.get('/api/currency/convert', {
        params: {
          price: priceCents / 100,
          fromCurrency,
          toCurrency: currentCurrency
        }
      })
      return response.data.convertedPrice
    } catch (error) {
      console.error('Failed to convert price:', error)
      return priceCents / 100 // Fallback to original price
    }
  }

  const formatPrice = (price: number, currency: string): string => {
    const formatters: Record<string, Intl.NumberFormat> = {
      'CHF': new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }),
      'EUR': new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }),
      'USD': new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
      'JPY': new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }),
      'GBP': new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }),
      'CAD': new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }),
      'AUD': new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' })
    }

    const formatter = formatters[currency] || formatters['CHF']
    return formatter.format(price)
  }

  const value: CurrencyContextType = {
    currentCurrency,
    setCurrency,
    convertPrice,
    formatPrice,
    isLoading,
    supportedCurrencies
  }

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
}

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext)
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider')
  }
  return context
}
