'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronDown } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'

interface Country {
  code: string
  name: string
  flag: string
  phoneCode: string
}

// Helper function to get flag icon class for country code
const getFlagClass = (code: string): string => {
  // Map special cases
  const flagMap: Record<string, string> = {
    'GB': 'gb', // United Kingdom
    'XK': 'xk' // Kosovo (may not be supported in all flag-icon versions)
  }
  
  const flagCode = flagMap[code] || code.toLowerCase()
  return `fi fi-${flagCode}`
}

const countries: Country[] = [
  { code: 'US', name: 'United States', flag: 'us', phoneCode: '+1' },
  { code: 'CA', name: 'Canada', flag: 'ca', phoneCode: '+1' },
  { code: 'GB', name: 'United Kingdom', flag: 'gb', phoneCode: '+44' },
  { code: 'DE', name: 'Germany', flag: 'de', phoneCode: '+49' },
  { code: 'FR', name: 'France', flag: 'fr', phoneCode: '+33' },
  { code: 'IT', name: 'Italy', flag: 'it', phoneCode: '+39' },
  { code: 'ES', name: 'Spain', flag: 'es', phoneCode: '+34' },
  { code: 'AU', name: 'Australia', flag: 'au', phoneCode: '+61' },
  { code: 'JP', name: 'Japan', flag: 'jp', phoneCode: '+81' },
  { code: 'CN', name: 'China', flag: 'cn', phoneCode: '+86' },
  { code: 'IN', name: 'India', flag: 'in', phoneCode: '+91' },
  { code: 'BR', name: 'Brazil', flag: 'br', phoneCode: '+55' },
  { code: 'MX', name: 'Mexico', flag: 'mx', phoneCode: '+52' },
  { code: 'RU', name: 'Russia', flag: 'ru', phoneCode: '+7' },
  { code: 'KR', name: 'South Korea', flag: 'kr', phoneCode: '+82' },
  { code: 'NL', name: 'Netherlands', flag: 'nl', phoneCode: '+31' },
  { code: 'SE', name: 'Sweden', flag: 'se', phoneCode: '+46' },
  { code: 'NO', name: 'Norway', flag: 'no', phoneCode: '+47' },
  { code: 'DK', name: 'Denmark', flag: 'dk', phoneCode: '+45' },
  { code: 'FI', name: 'Finland', flag: 'fi', phoneCode: '+358' },
  { code: 'CH', name: 'Switzerland', flag: 'ch', phoneCode: '+41' },
  { code: 'LI', name: 'Liechtenstein', flag: 'li', phoneCode: '+423' },
  { code: 'AT', name: 'Austria', flag: 'at', phoneCode: '+43' },
  { code: 'BE', name: 'Belgium', flag: 'be', phoneCode: '+32' },
  { code: 'PL', name: 'Poland', flag: 'pl', phoneCode: '+48' },
  { code: 'CZ', name: 'Czech Republic', flag: 'cz', phoneCode: '+420' },
  { code: 'HU', name: 'Hungary', flag: 'hu', phoneCode: '+36' },
  { code: 'RO', name: 'Romania', flag: 'ro', phoneCode: '+40' },
  { code: 'BG', name: 'Bulgaria', flag: 'bg', phoneCode: '+359' },
  { code: 'GR', name: 'Greece', flag: 'gr', phoneCode: '+30' },
  { code: 'PT', name: 'Portugal', flag: 'pt', phoneCode: '+351' },
  { code: 'IE', name: 'Ireland', flag: 'ie', phoneCode: '+353' },
  { code: 'LU', name: 'Luxembourg', flag: 'lu', phoneCode: '+352' },
  { code: 'MT', name: 'Malta', flag: 'mt', phoneCode: '+356' },
  { code: 'CY', name: 'Cyprus', flag: 'cy', phoneCode: '+357' },
  { code: 'EE', name: 'Estonia', flag: 'ee', phoneCode: '+372' },
  { code: 'LV', name: 'Latvia', flag: 'lv', phoneCode: '+371' },
  { code: 'LT', name: 'Lithuania', flag: 'lt', phoneCode: '+370' },
  { code: 'SI', name: 'Slovenia', flag: 'si', phoneCode: '+386' },
  { code: 'SK', name: 'Slovakia', flag: 'sk', phoneCode: '+421' },
  { code: 'HR', name: 'Croatia', flag: 'hr', phoneCode: '+385' },
  { code: 'RS', name: 'Serbia', flag: 'rs', phoneCode: '+381' },
  { code: 'BA', name: 'Bosnia and Herzegovina', flag: 'ba', phoneCode: '+387' },
  { code: 'ME', name: 'Montenegro', flag: 'me', phoneCode: '+382' },
  { code: 'MK', name: 'North Macedonia', flag: 'mk', phoneCode: '+389' },
  { code: 'AL', name: 'Albania', flag: 'al', phoneCode: '+355' },
  { code: 'XK', name: 'Kosovo', flag: 'xk', phoneCode: '+383' },
]

interface CountryCodePickerProps {
  value: string
  onChange: (countryCode: string, phoneCode: string) => void
  disabled?: boolean
}

export const CountryCodePicker: React.FC<CountryCodePickerProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  // Helper function to get translated country name
  const getCountryName = (countryCode: string, defaultName: string): string => {
    const countryKey = countryCode.toLowerCase().replace(/\s+/g, '_')
    const translationKey = `checkout.country.${countryKey}`
    const translated = t(translationKey)
    // If translation exists and is different from the key, use it
    if (translated && translated !== translationKey) {
      return translated
    }
    return defaultName
  }

  const selectedCountry = countries.find(c => c.code === value) || countries[0]
  const filteredCountries = countries.filter(country => {
    const translatedName = getCountryName(country.code, country.name)
    return (
      translatedName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      country.phoneCode.includes(searchTerm)
    )
  })

  const handleSelect = (country: Country) => {
    onChange(country.code, country.phoneCode)
    setIsOpen(false)
    setSearchTerm('')
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
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
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-l-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="flex items-center space-x-2">
          <span className={getFlagClass(selectedCountry.code)} style={{ fontSize: '1.5rem', width: '1.5rem', height: '1.5rem', display: 'inline-block', flexShrink: 0 }}></span>
          <span className="text-sm font-medium">{selectedCountry.phoneCode}</span>
        </div>
        <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-80 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b border-gray-200">
            <input
              type="text"
              placeholder={t('checkout.searchCountries') || 'Search countries...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filteredCountries.map((country) => (
              <button
                key={country.code}
                type="button"
                onClick={() => handleSelect(country)}
                className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
              >
                <span className={getFlagClass(country.code)} style={{ fontSize: '1.5rem', width: '1.5rem', height: '1.5rem', flexShrink: 0 }}></span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">
                    {getCountryName(country.code, country.name)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {country.phoneCode}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
