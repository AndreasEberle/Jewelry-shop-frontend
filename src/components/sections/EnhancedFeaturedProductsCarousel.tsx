'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Heart, Star } from 'lucide-react'
import { Product } from '@/services/productService'
import { useCurrency } from '@/contexts/CurrencyContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { favoriteService } from '@/services/favoriteService'
import { useAuth } from '@/contexts/AuthContext'
import { SpecialOfferBadge } from '@/components/ui/SpecialOfferBadge'

interface EnhancedFeaturedProductsCarouselProps {
  products: Product[]
  onProductClick?: (product: Product) => void
  onToggleFavorite?: (productId: string) => void
  favoriteProductIds?: string[]
  itemsPerView?: number
  autoRotateInterval?: number
}

export function EnhancedFeaturedProductsCarousel({ 
  products, 
  onProductClick, 
  onToggleFavorite,
  favoriteProductIds = [],
  itemsPerView = 4,
  autoRotateInterval = 3000
}: EnhancedFeaturedProductsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [favoriteIds, setFavoriteIds] = useState<string[]>(favoriteProductIds)
  const [togglingFavorite, setTogglingFavorite] = useState<string | null>(null)
  const [isAutoRotating, setIsAutoRotating] = useState(true)
  const { formatPrice } = useCurrency()
  const { isAuthenticated } = useAuth()

  // Load user's favorites on mount
  useEffect(() => {
    if (isAuthenticated) {
      favoriteService.getFavoriteIds()
        .then(ids => setFavoriteIds(ids))
        .catch(error => console.error('Failed to load favorites:', error))
    }
  }, [isAuthenticated])

  // Auto-rotation effect - only for 5+ products
  useEffect(() => {
    if (!isAutoRotating || products.length < 5) return

    const interval = setInterval(() => {
      setCurrentIndex(prev => {
        const nextIndex = prev + 1
        // Loop back to the beginning when reaching the end
        if (nextIndex >= products.length) {
          return 0
        }
        return nextIndex
      })
    }, autoRotateInterval)

    return () => clearInterval(interval)
  }, [isAutoRotating, products.length, autoRotateInterval])

  // Pause auto-rotation on hover
  const handleMouseEnter = useCallback(() => {
    setIsAutoRotating(false)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsAutoRotating(true)
  }, [])

  const handleToggleFavorite = async (productId: string) => {
    if (!isAuthenticated) return

    setTogglingFavorite(productId)
    try {
      const isCurrentlyFavorite = favoriteIds.includes(productId)
      
      if (isCurrentlyFavorite) {
        await favoriteService.removeFromFavorites(productId)
        setFavoriteIds(prev => prev.filter(id => id !== productId))
      } else {
        await favoriteService.addToFavorites(productId)
        setFavoriteIds(prev => [...prev, productId])
      }
      
      onToggleFavorite?.(productId)
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    } finally {
      setTogglingFavorite(null)
    }
  }

  const scrollToPrevious = useCallback(() => {
    setCurrentIndex(prev => prev === 0 ? products.length - 1 : prev - 1)
  }, [products.length])

  const scrollToNext = useCallback(() => {
    setCurrentIndex(prev => {
      const nextIndex = prev + 1
      // If we reach the end, loop back to the beginning
      if (nextIndex >= products.length) {
        return 0
      }
      return nextIndex
    })
  }, [products.length])


  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No featured products available</p>
      </div>
    )
  }

  // Create infinite loop by duplicating products - only for 5+ products
  const getInfiniteProducts = () => {
    // Only duplicate if we have 5+ products for carousel functionality
    if (products.length < 5) {
      return products
    }
    
    // Duplicate products to create seamless loop for carousel
    const duplicatedProducts = [...products, ...products, ...products]
    return duplicatedProducts
  }

  const infiniteProducts = getInfiniteProducts()
  const totalProducts = products.length
  
  // Calculate item width - always use itemsPerView for consistent sizing
  const itemWidth = 100 / itemsPerView
  
  // Calculate offset to center products when there are fewer than itemsPerView
  const centeringOffset = totalProducts < itemsPerView ? (itemsPerView - totalProducts) / 2 : 0

  return (
    <div 
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Navigation Arrows - only for 5+ products */}
      {products.length >= 5 && (
        <>
          <button
            onClick={scrollToPrevious}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110 bg-white/90 hover:bg-white text-gray-600 hover:text-gray-900"
            aria-label="Previous products"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <button
            onClick={scrollToNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110 bg-white/90 hover:bg-white text-gray-600 hover:text-gray-900"
            aria-label="Next products"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Carousel Container */}
      <div className="overflow-hidden">
        <div 
          className={`flex ${products.length >= 5 ? 'transition-transform duration-[2000ms] ease-in-out' : ''}`}
          style={{
            transform: products.length >= 5 
              ? `translateX(-${(currentIndex * itemWidth) + (centeringOffset * itemWidth)}%)`
              : `translateX(${centeringOffset * itemWidth}%)`  // Center the products
          }}
        >
          {infiniteProducts.map((product, index) => (
            <div 
              key={`${product.id}-${index}`}
              className="flex-shrink-0 px-3"
              style={{ width: `${itemWidth}%` }}
            >
              <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105 h-full flex flex-col">
                {/* Product Image */}
                <div 
                  className="relative aspect-square bg-gray-100 cursor-pointer group overflow-hidden"
                  onClick={() => onProductClick?.(product)}
                >
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images.find(img => img.isPrimary)?.url || product.images[0].url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <span>No Image</span>
                    </div>
                  )}
                  
                  {/* Favorite Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggleFavorite(product.id)
                    }}
                    disabled={togglingFavorite === product.id}
                    className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-200 disabled:opacity-50 hover:scale-110 ${
                      favoriteIds.includes(product.id)
                        ? 'bg-red-500 text-white shadow-lg'
                        : 'bg-white/80 text-gray-600 hover:bg-red-500 hover:text-white'
                    }`}
                  >
                    <Heart 
                      className={`w-5 h-5 ${
                        favoriteIds.includes(product.id) ? 'fill-current' : ''
                      }`} 
                    />
                  </button>

                </div>

                {/* Product Info */}
                <div className="p-4 flex-1 flex flex-col">
                  <h3 
                    className="text-lg font-semibold text-gray-900 mb-2 cursor-pointer hover:text-primary-600 transition-colors line-clamp-2"
                    onClick={() => onProductClick?.(product)}
                  >
                    {product.name}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-1">
                    {product.description}
                  </p>

                  {/* Price */}
                  <div className="mt-auto">
                    {product.specialOffer && product.specialOfferPrice ? (
                      <SpecialOfferBadge
                        originalPrice={product.price}
                        specialPrice={product.specialOfferPrice}
                        currency={product.baseCurrency || 'CHF'}
                        className="flex-col items-start space-y-1"
                      />
                    ) : (
                      <span className="text-xl font-bold text-gray-900">
                        {formatPrice(product.price, product.baseCurrency || 'CHF')}
                      </span>
                    )}
                  </div>
                  
                  {/* Rating */}
                  <div className="flex items-center space-x-1 mt-2">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < (product.averageRating || 0) 
                              ? 'fill-current' 
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500 ml-1">
                      (0)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dots Indicator - only for 5+ products */}
      {totalProducts >= 5 && (
        <div className="flex justify-center mt-6 space-x-2">
          {Array.from({ length: totalProducts }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                currentIndex === index
                  ? 'bg-primary-600 w-8'
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

    </div>
  )
}
