'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X, ArrowRight } from 'lucide-react'
import { productService, Product } from '@/services/productService'
import { useCurrency } from '@/contexts/CurrencyContext'
import { useTranslation } from '@/hooks/useTranslation'
import { useLanguage } from '@/contexts/LanguageContext'
import api from '@/services/api'
import Link from 'next/link'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const { t } = useTranslation()
  const { currentLanguage } = useLanguage()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [popularSearches, setPopularSearches] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const { formatPrice } = useCurrency()
  
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
        const response = await productService.searchProducts(query)
        const products = Array.isArray(response) ? response : response?.content || []
        setResults(products)
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!isOpen) return null

  const hasQuery = query.trim().length >= 2
  const showPopularSearches = !hasQuery && results.length === 0 && !loading

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Section */}
        <div className="flex items-center border-b border-gray-200 px-6 py-4">
          <div className="flex items-center flex-1">
            <Search className="w-6 h-6 text-gray-400 mr-4 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('common.searchPlaceholder')}
              className="flex-1 outline-none text-lg text-gray-900 placeholder-gray-400 bg-transparent"
            />
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-2 hover:bg-gray-100 rounded transition-colors"
            aria-label="Close search"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content Section */}
        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="px-6 py-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-4 text-gray-600">{t('common.searching')}</p>
            </div>
          ) : showPopularSearches ? (
            <div className="px-6 py-8">
              {/* Popular Searches */}
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
                  {t('common.popularSearches')}
                </h3>
                <div className="flex flex-wrap gap-3">
                  {popularSearches.map((term) => (
                    <button
                      key={term}
                      onClick={() => handlePopularSearch(term)}
                      className="px-4 py-2 border border-gray-300 rounded hover:border-gray-900 hover:bg-gray-50 transition-colors text-sm font-normal"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Suggestions - Show product names/categories that might be searched */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
                  {t('common.suggestions')}
                </h3>
                <div className="space-y-2">
                  {popularSearches.slice(0, 5).map((term) => (
                    <button
                      key={`suggestion-${term}`}
                      onClick={() => handlePopularSearch(term)}
                      className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors text-left group"
                    >
                      <span className="text-gray-700 group-hover:text-gray-900">{term}</span>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
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
            <div className="divide-y divide-gray-100">
              <div className="px-6 py-3 bg-gray-50">
                <p className="text-sm text-gray-600">
                  {results.length} {results.length === 1 ? t('common.result') : t('common.results')} {t('common.found')}
                </p>
              </div>
              {results.map((product) => {
                const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0]
                return (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug || product.sku}`}
                    onClick={onClose}
                    className="flex items-center p-4 hover:bg-gray-50 transition-colors group"
                  >
                    {primaryImage?.url ? (
                      <div className="w-20 h-20 flex-shrink-0 mr-4 rounded overflow-hidden bg-gray-100">
                        <img
                          src={primaryImage.url}
                          alt={primaryImage.altText || product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 flex-shrink-0 mr-4 rounded bg-gray-100 flex items-center justify-center">
                        <span className="text-gray-400 text-xs">{t('common.noImage')}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 group-hover:text-gray-700 truncate">
                        {product.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">{product.sku}</p>
                      {product.material && (
                        <p className="text-xs text-gray-400 mt-1">{product.material}</p>
                      )}
                    </div>
                    <div className="text-right ml-4 flex-shrink-0">
                      <p className="font-semibold text-gray-900">
                        {formatPrice(product.displayPrice || product.price, product.baseCurrency)}
                      </p>
                      {product.quantity === 0 && (
                        <p className="text-xs text-red-600 mt-1">{t('common.outOfStock')}</p>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}