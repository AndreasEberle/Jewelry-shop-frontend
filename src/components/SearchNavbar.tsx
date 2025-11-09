'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { productService, Product } from '@/services/productService'
import { useCurrency } from '@/contexts/CurrencyContext'
import { useTranslation } from '@/hooks/useTranslation'
import { useLanguage } from '@/contexts/LanguageContext'
import api from '@/services/api'
import Link from 'next/link'

interface SearchNavbarProps {
  isOpen: boolean
  onClose: () => void
}

// Translation mapping for search terms (e.g., German "halskette" -> "necklace")
const SEARCH_TRANSLATION_MAP: Record<string, string[]> = {
  'halskette': ['necklace', 'halskette'],
  'halsketten': ['necklace', 'necklaces'],
  'ring': ['ring', 'rings'],
  'ringe': ['ring', 'rings'],
  'ohrringe': ['earrings', 'earring'],
  'ohrring': ['earrings', 'earring'],
  'armband': ['bracelet', 'bracelets'],
  'armbänder': ['bracelet', 'bracelets'],
  'gold': ['gold'],
  'silber': ['silver'],
  'platinum': ['platinum'],
  'ネックレス': ['necklace', 'necklaces'],
  'リング': ['ring', 'rings'],
  'イヤリング': ['earrings', 'earring'],
  'ブレスレット': ['bracelet', 'bracelets'],
  'ゴールド': ['gold'],
  'シルバー': ['silver'],
}

// Expand search query with translations
function expandSearchQuery(query: string): string {
  const lowerQuery = query.toLowerCase().trim()
  const translations: string[] = [lowerQuery] // Always include original query
  
  // Check if query matches any translation key
  for (const [key, values] of Object.entries(SEARCH_TRANSLATION_MAP)) {
    if (lowerQuery.includes(key) || key.includes(lowerQuery)) {
      translations.push(...values)
    }
  }
  
  // Remove duplicates and return as space-separated string for backend
  const uniqueTerms = Array.from(new Set(translations))
  return uniqueTerms.join(' ')
}

const RECENT_SEARCHES_KEY = 'jewelry_shop_recent_searches'
const MAX_RECENT_SEARCHES = 5

export function SearchNavbar({ isOpen, onClose }: SearchNavbarProps) {
  const [hasScrolled, setHasScrolled] = useState(false)
  const pathname = usePathname()
  const isHomepage = pathname === '/'
  
  // Hide search navbar on homepage until user scrolls
  useEffect(() => {
    if (!isHomepage) {
      setHasScrolled(true) // Always show on other pages
      return
    }
    
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setHasScrolled(true)
      }
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isHomepage])
  const { t } = useTranslation()
  const { currentLanguage } = useLanguage()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [popularSearches, setPopularSearches] = useState<string[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const { formatPrice } = useCurrency()
  
  // Load recent searches from localStorage
  useEffect(() => {
    if (isOpen) {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY)
      if (stored) {
        try {
          setRecentSearches(JSON.parse(stored))
        } catch (e) {
          setRecentSearches([])
        }
      }
    }
  }, [isOpen])
  
  // Save search to recent searches
  const addToRecentSearches = (searchTerm: string) => {
    if (!searchTerm || searchTerm.trim().length < 2) return
    
    const trimmed = searchTerm.trim()
    setRecentSearches(prev => {
      const updated = [trimmed, ...prev.filter(s => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, MAX_RECENT_SEARCHES)
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
      return updated
    })
  }
  
  // Clear recent searches
  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem(RECENT_SEARCHES_KEY)
  }
  
  // Load popular searches from backend based on current language
  useEffect(() => {
    const fetchPopularSearches = async () => {
      try {
        const response = await api.get('/api/public/popular-searches', {
          params: { lang: currentLanguage },
          headers: {
            'Accept-Language': currentLanguage
          }
        })
        if (response.data?.searches && Array.isArray(response.data.searches)) {
          setPopularSearches(response.data.searches)
        }
      } catch (error) {
        console.error('Failed to load popular searches:', error)
        // Fallback to default
        setPopularSearches(['Necklace', 'Ring', 'Earrings', 'Bracelet', 'Gold', 'Silver'])
      }
    }
    
    if (isOpen) {
      fetchPopularSearches()
    }
  }, [isOpen, currentLanguage])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
    if (!isOpen) {
      setQuery('')
      setResults([])
    }
  }, [isOpen])

  useEffect(() => {
    const searchProducts = async () => {
      if (query.trim().length < 2) {
        setResults([])
        return
      }

      setLoading(true)
      try {
        // Use original query - backend will search in name, description, SKU, and material
        // For translation mapping, we'll search multiple times if needed
        const lowerQuery = query.toLowerCase().trim()
        let searchQuery = query
        
        // Check if query matches any translation key and use the English equivalent
        for (const [key, values] of Object.entries(SEARCH_TRANSLATION_MAP)) {
          if (lowerQuery.includes(key) || key.includes(lowerQuery)) {
            // Use the first English translation value
            searchQuery = values[0] || query
            break
          }
        }
        
        const response = await productService.searchProducts(searchQuery)
        const products = Array.isArray(response) ? response : response?.content || []
        setResults(products)
        
        // Add to recent searches if we got results
        if (products.length > 0) {
          addToRecentSearches(query)
        }
      } catch (error) {
        console.error('Search error:', error)
        setResults([])
      } finally {
        setLoading(false)
      }
    }

    const debounceTimer = setTimeout(searchProducts, 300)
    return () => clearTimeout(debounceTimer)
  }, [query])

  const handlePopularSearch = (searchTerm: string) => {
    setQuery(searchTerm)
  }

  const handleClear = () => {
    setQuery('')
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!isOpen) return null
  
  // Don't show search navbar on homepage until scrolled
  if (!hasScrolled && isHomepage) {
    return null
  }

  const hasQuery = query.trim().length >= 2
  const showPopularSearches = !hasQuery && results.length === 0 && !loading
  const showRecentAndPopular = !hasQuery && results.length === 0 && !loading

  return (
    <>
      {/* Backdrop - grey out other elements */}
      <div 
        className="fixed inset-0 bg-black/50 z-[45]"
        onClick={onClose}
        style={{ top: '20px' }} // Start below top banner
      />
      
      {/* Search Navbar - covers normal navbar */}
      <div 
        className="fixed z-50 w-full bg-white shadow-lg"
        style={{ top: '20px', paddingTop: '56px', paddingBottom: '24px', paddingLeft: '80px', paddingRight: '80px' }} // Position below top banner (20px height)
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Section - only width of input */}
        <div className="flex items-center justify-between pb-4 mb-4 w-full">
          <div className="flex items-center w-1/3 relative">
            <Search className="w-6 h-6 text-gray-400 mr-4 flex-shrink-0 absolute left-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('common.searchPlaceholderFull')}
              className="w-full pl-10 pr-20 outline-none text-lg text-gray-900 placeholder-gray-400 bg-transparent border-0 border-b border-gray-300 py-2 focus:border-gray-900 focus:ring-0"
              style={{ fontFamily: 'SimonMono, "Courier New", Courier, monospace', fontSize: '0.875rem' }}
            />
            {query && (
              <button
                onClick={handleClear}
                className="absolute right-2 px-2 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                aria-label="Clear search"
              >
                {t('common.clear')}
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            aria-label="Close search"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

      {/* Content Section - extends to top */}
      <div className="flex max-h-[60vh] overflow-y-auto -mt-4">
        {loading ? (
          <div className="px-6 py-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-4 text-gray-600">{t('common.searching')}</p>
          </div>
        ) : showRecentAndPopular ? (
          <div className="flex gap-8 w-full">
            {/* Recent Searches - Left Column */}
            {recentSearches.length > 0 && (
              <div className="flex flex-col">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4" style={{ fontFamily: 'SimonMono, "Courier New", Courier, monospace' }}>
                  {t('common.recentSearches')}
                </h3>
                <div className="flex flex-col gap-2">
                  {recentSearches.map((term) => (
                    <button
                      key={term}
                      onClick={() => handlePopularSearch(term)}
                      className="px-4 py-2 text-left hover:bg-gray-50 transition-colors text-sm font-normal rounded"
                      style={{ fontFamily: 'SimonMono, "Courier New", Courier, monospace' }}
                    >
                      {term}
                    </button>
                  ))}
                  <button
                    onClick={clearRecentSearches}
                    className="text-xs text-gray-500 hover:text-gray-900 underline mt-2 self-start"
                    style={{ fontFamily: 'SimonMono, "Courier New", Courier, monospace' }}
                  >
                    {t('common.clearRecentSearches')}
                  </button>
                </div>
              </div>
            )}
            
            {/* Popular Searches - Right next to Recent Searches */}
            <div className="flex flex-col ml-24">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4" style={{ fontFamily: 'SimonMono, "Courier New", Courier, monospace' }}>
                {t('common.popularSearches')}
              </h3>
              <div className="flex flex-col gap-2">
                {popularSearches.map((term) => (
                  <button
                    key={term}
                    onClick={() => handlePopularSearch(term)}
                    className="px-4 py-2 text-left hover:bg-gray-50 transition-colors text-sm font-normal rounded"
                    style={{ fontFamily: 'SimonMono, "Courier New", Courier, monospace' }}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : hasQuery && results.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-600 text-lg">{t('common.noProductsFound')}</p>
            <p className="text-gray-400 text-sm mt-2">{t('common.tryDifferentSearch')}</p>
          </div>
        ) : hasQuery && results.length > 0 ? (
          <div className="flex w-full -mt-4">
            {/* Right side - Search Results */}
            <div className="w-full overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {results.map((product) => {
                  const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0]
                  // Get secondary image - the 2nd image in order (index 1) if available, similar to products page
                  const secondaryImage = product.images?.length > 1 && product.images[1]?.url 
                    ? product.images[1] 
                    : null
                  const productUrl = `/products/${product.slug || product.sku}`
                  const displayPrice = product.displayPrice || product.price
                  const productPrice = product.price
                  const hasSpecialOffer = product.specialOffer && product.specialOfferPrice
                  
                  return (
                    <Link
                      key={product.id}
                      href={productUrl}
                      onClick={onClose}
                      className="group/product-card"
                    >
                      <div className="relative flex flex-col h-full bg-white text-black">
                        {/* Product Image Container - matches products page */}
                        <div 
                          className="bg-utility-loading md:grid flex flex-nowrap overflow-hidden overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar relative w-full aspect-square z-base" 
                          data-testid="product-card-images"
                        >
                          <div className="absolute top-0 left-0 w-full h-full flex md:grid relative group/product-card">
                            {/* Primary Image */}
                            {primaryImage && (
                              <div 
                                className={`relative overflow-hidden z-[1] flex-shrink-0 snap-start mx-px md:mx-0 w-full h-full ${secondaryImage ? 'transition-opacity duration-300 ease-in-out group-hover/product-card:opacity-0' : ''}`}
                                data-testid="product-card-primary-image"
                                style={{ backgroundColor: '#f8f8f8' }}
                              >
                                <img 
                                  alt={primaryImage.altText || product.name} 
                                  decoding="async" 
                                  loading="eager" 
                                  sizes="(min-width: 1024px) 25vw, 50vw" 
                                  src={primaryImage.url}
                                  className="absolute inset-0 w-full h-full object-contain z-[1]" 
                                  fetchPriority="high"
                                />
                              </div>
                            )}
                            
                            {/* Secondary/Hover Image */}
                            {secondaryImage && (
                              <div 
                                className="absolute inset-0 overflow-hidden z-[2] flex-shrink-0 snap-start mx-px md:mx-0 w-full h-full opacity-0 transition-opacity duration-300 ease-in-out group-hover/product-card:opacity-100" 
                                data-testid="product-card-secondary-image"
                              >
                                <img 
                                  alt={secondaryImage.altText || `${product.name} - Hover`} 
                                  decoding="async" 
                                  loading="lazy" 
                                  sizes="(min-width: 1024px) 25vw, 50vw" 
                                  src={secondaryImage.url}
                                  className="absolute inset-0 w-full h-full object-contain z-[1]"
                                />
                              </div>
                            )}
                            
                            {!primaryImage && (
                              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                <span className="text-gray-400 text-xs">{t('common.noImage')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Product Info */}
                        <div className="flex flex-col pl-2 py-3 gap-xxs bg-[#F8F8F8]">
                          <p className="type-utility-2 !text-xxs md:!text-xs uppercase truncate" style={{ fontFamily: 'SimonMono, "Courier New", Courier, monospace', fontWeight: 400, color: 'rgba(121,120,108,var(--tw-text-opacity, 1))' }}>
                            {product.name}
                          </p>
                          <div className="flex items-center justify-between gap-xxs md:gap-xs" style={{ fontFamily: 'SimonMono, "Courier New", Courier, monospace', fontWeight: 400 }}>
                            {hasSpecialOffer && product.specialOfferPrice ? (
                              <>
                                <span className="text-red-600 !text-xxs md:!text-xs font-bold">{formatPrice(product.specialOfferPrice, product.baseCurrency)}</span>
                                <span className="line-through text-gray-400 !text-xxs md:!text-xs font-bold">{formatPrice(productPrice, product.baseCurrency)}</span>
                              </>
                            ) : (
                              <span className="!text-xxs md:!text-xs font-bold" style={{ color: '#000000' }}>{formatPrice(displayPrice, product.baseCurrency)}</span>
                            )}
                          </div>
                          {product.material && (
                            <div className="type-caption !text-xxs md:!text-xs" style={{ fontFamily: 'SimonMono, "Courier New", Courier, monospace', fontWeight: 400, color: 'rgba(121,120,108,var(--tw-text-opacity, 1))' }}>
                              {product.material}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        ) : null}
      </div>
      </div>
    </>
  )
}

