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
  autoRotateInterval = 5000
}: EnhancedFeaturedProductsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
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

  // Only allow scrolling if we have more than itemsPerView products
  const canScroll = products.length > itemsPerView
  const totalProducts = products.length
  
  // Initialize starting position to middle set for seamless infinite scroll
  useEffect(() => {
    if (products.length > 0) {
      if (canScroll) {
        // Start at the beginning of the middle set (second copy)
        // This allows us to scroll left or right seamlessly
        setCurrentIndex(totalProducts)
      }
      setIsInitialized(true) // Always set initialized if we have products
    }
  }, [products.length, canScroll, totalProducts])
  
  // Auto-rotation effect - smooth infinite loop left to right (only if > itemsPerView products)
  useEffect(() => {
    if (!isAutoRotating || !canScroll || !isInitialized) return

    const interval = setInterval(() => {
      setCurrentIndex(prev => {
        // We're working with the middle set (indices totalProducts to totalProducts*2-1)
        // When we finish the middle set (reach totalProducts * 2), jump back to start of middle set (totalProducts)
        let nextIndex = prev + 1
        if (nextIndex >= totalProducts * 2) {
          // Disable transition, reset to start of middle set instantly, then re-enable
          setIsTransitioning(false)
          // Use requestAnimationFrame for smooth reset
          requestAnimationFrame(() => {
            setCurrentIndex(totalProducts)
            setTimeout(() => setIsTransitioning(true), 10)
          })
          return totalProducts
        }
        return nextIndex
      })
    }, autoRotateInterval)

    return () => clearInterval(interval)
  }, [isAutoRotating, products.length, autoRotateInterval, canScroll, totalProducts, isInitialized])

  // Pause auto-rotation on hover
  const handleMouseEnter = useCallback(() => {
    setIsAutoRotating(false)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsAutoRotating(true)
  }, [])

  const handleToggleFavorite = async (productId: string) => {
    if (!isAuthenticated) {
      window.dispatchEvent(new CustomEvent('openAuthModal', { detail: { mode: 'login' } }))
      return
    }

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
      
      // Dispatch event to update header favorite count
      window.dispatchEvent(new Event('favoriteChanged'))
      
      onToggleFavorite?.(productId)
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    } finally {
      setTogglingFavorite(null)
    }
  }


  const scrollToNext = useCallback(() => {
    if (!canScroll || !isInitialized) return
    setCurrentIndex(prev => {
      const nextIndex = prev + 1
      // If we reach the end of middle set (totalProducts * 2), reset to start of middle set seamlessly
      if (nextIndex >= totalProducts * 2) {
        setIsTransitioning(false)
        requestAnimationFrame(() => {
          setCurrentIndex(totalProducts)
          setTimeout(() => setIsTransitioning(true), 10)
        })
        return totalProducts
      }
      return nextIndex
    })
  }, [totalProducts, canScroll, isInitialized])
  
  const scrollToPrevious = useCallback(() => {
    if (!canScroll || !isInitialized) return
    setCurrentIndex(prev => {
      const prevIndex = prev - 1
      // If we go before the start of middle set (totalProducts), reset to end of middle set seamlessly
      if (prevIndex < totalProducts) {
        setIsTransitioning(false)
        requestAnimationFrame(() => {
          setCurrentIndex(totalProducts * 2 - 1)
          setTimeout(() => setIsTransitioning(true), 10)
        })
        return totalProducts * 2 - 1
      }
      return prevIndex
    })
  }, [totalProducts, canScroll, isInitialized])

  // Handle seamless reset when reaching boundaries
  useEffect(() => {
    if (!canScroll || !isInitialized) return
    
    // If we've scrolled past the end of second set, reset to start of middle set without transition
    if (currentIndex >= totalProducts * 2) {
      setIsTransitioning(false)
      requestAnimationFrame(() => {
        setCurrentIndex(totalProducts)
        setTimeout(() => setIsTransitioning(true), 10)
      })
    }
    
    // If we've scrolled before the start of middle set, reset to end of middle set seamlessly
    if (currentIndex < totalProducts && currentIndex !== totalProducts) {
      setIsTransitioning(false)
      requestAnimationFrame(() => {
        setCurrentIndex(totalProducts * 2 - 1)
        setTimeout(() => setIsTransitioning(true), 10)
      })
    }
  }, [currentIndex, totalProducts, canScroll, isInitialized])

  // For infinite scroll: duplicate products to create seamless loop
  // If we have <= itemsPerView products, don't duplicate (no scrolling needed)
  const getInfiniteProducts = () => {
    if (products.length === 0) return []
    if (!canScroll) {
      // If <= itemsPerView, just return products once
      return products
    }
    // Duplicate products 3 times for seamless infinite scroll
    return [...products, ...products, ...products]
  }

  const infiniteProducts = getInfiniteProducts()
  
  // Calculate item width - always use itemsPerView for consistent sizing
  const itemWidth = 100 / itemsPerView
  
  // Calculate translateX position - for seamless infinite loop
  // currentIndex is already positioned at the middle set (totalProducts + offset)
  // So we just multiply by itemWidth to get the translate position
  const translateX = currentIndex * itemWidth

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No featured products available</p>
      </div>
    )
  }

  // Don't render until initialized (prevents white screen)
  if (!isInitialized && canScroll) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <div 
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Navigation Arrows - only show if we can scroll (more than itemsPerView products) */}
      {canScroll && (
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
          className="flex"
          style={{
            transform: `translateX(-${translateX}%)`,
            willChange: 'transform',
            transition: isTransitioning ? 'transform 800ms ease-in-out' : 'none'
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

                  {/* Stock Status - Subtle indicator */}
                  {(product.quantity || 0) <= 0 ? (
                    <div className="mb-2">
                      <span className="text-xs text-red-600 font-medium">Out of Stock</span>
                    </div>
                  ) : (product.quantity || 0) < 5 ? (
                    <div className="mb-2">
                      <span className="text-xs text-orange-600 font-medium">
                        Only {product.quantity} left
                      </span>
                    </div>
                  ) : null}

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
                  {product.averageRating && product.totalReviews ? (
                    <div className="flex items-center space-x-1 mt-2">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.round(product.averageRating || 0)
                                ? 'fill-current' 
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-500 ml-1">
                        ({product.totalReviews})
                      </span>
                    </div>
                  ) : null}
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
