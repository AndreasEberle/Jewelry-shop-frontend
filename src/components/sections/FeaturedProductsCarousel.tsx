'use client'

import React, { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight, Heart } from 'lucide-react'
import { Product } from '@/services/productService'
import { useCurrency } from '@/contexts/CurrencyContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { favoriteService } from '@/services/favoriteService'
import { useAuth } from '@/contexts/AuthContext'
import { SpecialOfferBadge } from '@/components/ui/SpecialOfferBadge'

interface FeaturedProductsCarouselProps {
  products: Product[]
  onProductClick?: (product: Product) => void
  onToggleFavorite?: (productId: string) => void
  favoriteProductIds?: string[]
}

export function FeaturedProductsCarousel({ 
  products, 
  onProductClick, 
  onToggleFavorite,
  favoriteProductIds = []
}: FeaturedProductsCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true,
    align: 'start',
    slidesToScroll: 1
  })
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([])
  const [favoriteIds, setFavoriteIds] = useState<string[]>(favoriteProductIds)
  const [togglingFavorite, setTogglingFavorite] = useState<string | null>(null)
  const { formatPrice } = useCurrency()
  const { t } = useLanguage()
  const { isAuthenticated } = useAuth()

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

  const scrollTo = useCallback((index: number) => {
    if (emblaApi) emblaApi.scrollTo(index)
  }, [emblaApi])

  const onInit = useCallback((emblaApi: any) => {
    setScrollSnaps(emblaApi.scrollSnapList())
  }, [])

  const onSelect = useCallback((emblaApi: any) => {
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [])

  useEffect(() => {
    if (emblaApi) {
      onInit(emblaApi)
      onSelect(emblaApi)
      emblaApi.on('reInit', onInit)
      emblaApi.on('select', onSelect)
    }
  }, [emblaApi, onInit, onSelect])

  // Load user's favorites on mount
  useEffect(() => {
    if (isAuthenticated) {
      favoriteService.getFavoriteIds()
        .then(ids => setFavoriteIds(ids))
        .catch(error => console.error('Failed to load favorites:', error))
    }
  }, [isAuthenticated])

  const handleToggleFavorite = async (productId: string) => {
    if (!isAuthenticated) {
      // Redirect to login or show login modal
      return
    }

    setTogglingFavorite(productId)
    try {
      const isFavorite = await favoriteService.toggleFavorite(productId)
      setFavoriteIds(prev => 
        isFavorite 
          ? [...prev, productId]
          : prev.filter(id => id !== productId)
      )
      onToggleFavorite?.(productId)
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    } finally {
      setTogglingFavorite(null)
    }
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No featured products available</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Carousel Container */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {products.map((product) => (
            <div key={product.id} className="flex-[0_0_100%] min-w-0 px-4">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                {/* Product Image */}
                <div 
                  className="relative aspect-square bg-gray-100 cursor-pointer group"
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
                    className={`absolute top-3 right-3 p-2 rounded-full transition-colors disabled:opacity-50 ${
                      favoriteIds.includes(product.id)
                        ? 'bg-red-500 text-white'
                        : 'bg-white/80 text-gray-600 hover:bg-red-500 hover:text-white'
                    }`}
                  >
                    <Heart 
                      className={`w-5 h-5 ${
                        favoriteIds.includes(product.id) ? 'fill-current' : ''
                      }`} 
                    />
                  </button>

                  {/* Special Offer Badge */}
                  {product.specialOffer && product.specialOfferPrice && (
                    <div className="absolute top-3 left-3 text-white px-2 py-1 rounded-full text-sm font-medium">
                      -{Math.round(((product.price - product.specialOfferPrice) / product.price) * 100)}%
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-6">
                  <h3 
                    className="text-xl font-semibold text-gray-900 mb-2 cursor-pointer hover:text-primary-600 transition-colors"
                    onClick={() => onProductClick?.(product)}
                  >
                    {product.name}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {product.description}
                  </p>

                  {/* Price */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {product.specialOffer && product.specialOfferPrice ? (
                        <SpecialOfferBadge
                          originalPrice={product.price}
                          specialPrice={product.specialOfferPrice}
                          currency={product.baseCurrency}
                          className="flex-col items-start space-y-1"
                        />
                      ) : (
                        <span className="text-2xl font-bold text-gray-900">
                          {formatPrice(product.price)}
                        </span>
                      )}
                    </div>
                    
                    {/* Rating */}
                    <div className="flex items-center space-x-1">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-4 h-4 ${i < (product.averageRating || 0) ? 'fill-current' : 'text-gray-300'}`}
                            viewBox="0 0 20 20"
                          >
                            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">
                        {product.averageRating ? product.averageRating.toFixed(1) : '0.0'}
                        {product.totalReviews && ` (${product.totalReviews})`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      {products.length > 1 && (
        <>
          <button
            onClick={scrollPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white/90 hover:bg-white text-gray-600 hover:text-gray-900 rounded-full p-2 shadow-lg transition-all duration-200"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <button
            onClick={scrollNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white/90 hover:bg-white text-gray-600 hover:text-gray-900 rounded-full p-2 shadow-lg transition-all duration-200"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {products.length > 1 && (
        <div className="flex justify-center mt-6 space-x-2">
          {scrollSnaps.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                index === selectedIndex
                  ? 'bg-primary-600 scale-125'
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
