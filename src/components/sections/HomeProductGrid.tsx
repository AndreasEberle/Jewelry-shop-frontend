'use client'

import { useState, useEffect, useRef } from 'react'
import { Product } from '@/types'
import { productService } from '@/services/productService'
import { useCurrency } from '@/contexts/CurrencyContext'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { useTranslation } from '@/hooks/useTranslation'
import Link from 'next/link'
import api from '@/services/api'

export function HomeProductGrid() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [itemsCount, setItemsCount] = useState(4) // Default to 4
  const [addingToCart, setAddingToCart] = useState<string | null>(null)
  const [favoriteProductIds, setFavoriteProductIds] = useState<Set<string>>(new Set())
  const [imagesLoaded, setImagesLoaded] = useState<Set<string>>(new Set())
  const sectionRef = useRef<HTMLElement>(null)
  const { formatPrice } = useCurrency()
  const { addToCart, cart } = useCart()
  const { user, isAuthenticated } = useAuth()
  const { t } = useTranslation()

  // Load items count from system config
  useEffect(() => {
    const loadItemsCount = async () => {
      try {
        const response = await api.get('/api/public/system-config/HOME_PRODUCTS_COUNT')
        const configValue = response.data?.value || response.data?.configValue
        if (configValue) {
          const count = parseInt(configValue)
          if (!isNaN(count) && count >= 2 && count <= 4) {
            setItemsCount(count)
          }
        }
      } catch (error) {
        console.error('Failed to load home products count config:', error)
      }
    }
    loadItemsCount()
  }, [])

  // Fetch featured products - only available ones
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        const allProducts = await productService.getProducts()
        // Filter for active products with available quantity > 0
        const availableProducts = allProducts.filter(p => {
          const availableQty = p.availableQuantity !== undefined && p.availableQuantity !== null && p.availableQuantity > 0
            ? p.availableQuantity 
            : (p.quantity !== undefined && p.quantity !== null ? p.quantity : 0)
          return p.active && availableQty > 0
        })
        
        // Filter for featured products first, or take first N available products
        const featured = availableProducts
          .filter(p => p.showInFeatured || false)
          .slice(0, itemsCount)
        
        // If not enough featured, fill with regular available products
        let finalProducts: Product[]
        if (featured.length < itemsCount) {
          const regular = availableProducts
            .filter(p => !p.showInFeatured)
            .slice(0, itemsCount - featured.length)
          finalProducts = [...featured, ...regular]
        } else {
          finalProducts = featured
        }
        
        setProducts(finalProducts)
        
        // Preload images immediately after products are loaded
        finalProducts.forEach((product) => {
          const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0]
          const secondaryImage = product.images?.find(img => !img.isPrimary && img !== primaryImage)
          
          if (primaryImage?.url) {
            const img = new Image()
            img.src = primaryImage.url
            img.onload = () => {
              setImagesLoaded(prev => new Set(prev).add(primaryImage.url))
            }
          }
          
          if (secondaryImage?.url) {
            const img = new Image()
            img.src = secondaryImage.url
            img.onload = () => {
              setImagesLoaded(prev => new Set(prev).add(secondaryImage.url))
            }
          }
        })
      } catch (error) {
        console.error('Failed to fetch products:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [itemsCount])

  // Load favorites
  useEffect(() => {
    if (isAuthenticated && user) {
      const loadFavorites = async () => {
        try {
          const response = await api.get('/api/user/favorites')
          const favorites = response.data || []
          setFavoriteProductIds(new Set(favorites.map((f: any) => f.productId || f.product?.id)))
        } catch (error) {
          console.error('Failed to load favorites:', error)
        }
      }
      loadFavorites()
    }
  }, [isAuthenticated, user])

  // Preload images when section is about to come into view
  useEffect(() => {
    if (!sectionRef.current || products.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Preload all product images
            products.forEach((product) => {
              const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0]
              const secondaryImage = product.images?.find(img => !img.isPrimary && img !== primaryImage)
              
              if (primaryImage?.url) {
                const img = new Image()
                img.src = primaryImage.url
                img.onload = () => {
                  setImagesLoaded(prev => new Set(prev).add(primaryImage.url))
                }
              }
              
              if (secondaryImage?.url) {
                const img = new Image()
                img.src = secondaryImage.url
                img.onload = () => {
                  setImagesLoaded(prev => new Set(prev).add(secondaryImage.url))
                }
              }
            })
            
            observer.unobserve(entry.target)
          }
        })
      },
      { 
        threshold: 0.1,
        rootMargin: '400px' // Start loading 400px before section is visible for smoother experience
      }
    )

    observer.observe(sectionRef.current)

    return () => observer.disconnect()
  }, [products])

  const handleToggleFavorite = async (productId: string) => {
    if (!isAuthenticated) return

    try {
      const isFavorite = favoriteProductIds.has(productId)
      if (isFavorite) {
        await api.delete(`/api/user/favorites/${productId}`)
        setFavoriteProductIds(prev => {
          const next = new Set(prev)
          next.delete(productId)
          return next
        })
      } else {
        await api.post(`/api/user/favorites/${productId}`)
        setFavoriteProductIds(prev => new Set(prev).add(productId))
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    }
  }

  const handleAddToCart = async (product: Product) => {
    const availableQty = product.availableQuantity !== undefined && product.availableQuantity !== null && product.availableQuantity > 0
      ? product.availableQuantity 
      : (product.quantity !== undefined && product.quantity !== null ? product.quantity : 0)
    
    if (availableQty <= 0) {
      alert(t('common.outOfStock') || 'This item is out of stock')
      return
    }
    
    setAddingToCart(product.id)
    try {
      await addToCart(product, 1)
    } catch (err: any) {
      alert(err.message || 'Failed to add item to cart')
    } finally {
      setAddingToCart(null)
    }
  }

  if (loading) {
    return (
      <section className="py-20 md:py-32 bg-[#faf8f5] border-t border-[#e8e5e0]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(itemsCount)].map((_, i) => (
              <div key={i} className="aspect-square bg-gray-200 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (products.length === 0) {
    return null
  }

  // Determine grid columns based on items count
  const gridCols = itemsCount === 2 ? 'grid-cols-2' : itemsCount === 3 ? 'grid-cols-3' : 'grid-cols-4'

  return (
    <section 
      ref={sectionRef}
      className="h-screen bg-[#faf8f5] border-t border-[#e8e5e0] snap-start flex flex-col items-center justify-center overflow-hidden"
    >
      <div className="max-w-[95%] md:max-w-[90%] lg:max-w-[85%] mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Section Title */}
        <div className="text-center mb-12 md:mb-16">
          <h2 
            className="text-4xl md:text-6xl lg:text-7xl"
            ref={(el) => {
              if (el) {
                // Use Intersection Observer for fade-in
                const observer = new IntersectionObserver(
                  (entries) => {
                    entries.forEach((entry) => {
                      if (entry.isIntersecting) {
                        entry.target.classList.add('fade-in-on-scroll')
                        entry.target.style.removeProperty('opacity')
                        observer.unobserve(entry.target)
                      }
                    })
                  },
                  { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
                )
                observer.observe(el)
              }
            }}
            style={{
              color: '#2c2416',
              fontFamily: '"Noto Serif JP", Georgia, "Times New Roman", serif',
              fontWeight: 300,
              letterSpacing: '0.02em',
              lineHeight: '1.2',
              opacity: 0,
            }}
          >
            {t('home.productGridTitle') || 'Discover Our Collection'}
          </h2>
        </div>
        
        <div className={`grid ${gridCols} gap-8 md:gap-12 lg:gap-16 w-full`}>
          {products.map((product) => {
            const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0]
            const secondaryImage = product.images?.find(img => !img.isPrimary && img !== primaryImage)
            const productSlug = product.slug || product.name.toLowerCase().replace(/\s+/g, '-')
            const productUrl = `/products/${productSlug}`
            const isFavorite = favoriteProductIds.has(product.id)
            const inStock = (product.availableQuantity ?? product.quantity ?? 0) > 0
            const productPrice = product.specialOfferPrice || product.displayPrice || product.price

            return (
              <div key={product.id} className="relative flex flex-col h-full bg-white text-black w-full">
                <div className="relative group/product-card w-full">
                  <Link 
                    className="block w-full" 
                    href={productUrl}
                  >
                    <div className="relative w-full aspect-square bg-gray-100 overflow-hidden" style={{ minHeight: '500px', width: '100%' }}>
                      {/* Primary Image */}
                      {primaryImage && (
                        <div className={`absolute inset-0 ${secondaryImage ? 'transition-opacity duration-300 ease-in-out group-hover/product-card:opacity-0' : ''}`}>
                          <img 
                            alt={primaryImage.altText || product.name} 
                            src={primaryImage.url}
                            className="absolute inset-0 w-full h-full object-cover"
                            loading="eager"
                            onLoad={() => setImagesLoaded(prev => new Set(prev).add(primaryImage.url))}
                          />
                        </div>
                      )}
                      
                      {/* Secondary/Hover Image - Only show if exists */}
                      {secondaryImage && (
                        <div className="absolute inset-0 opacity-0 transition-opacity duration-300 ease-in-out group-hover/product-card:opacity-100">
                          <img 
                            alt={secondaryImage.altText || `${product.name} - Hover`} 
                            src={secondaryImage.url}
                            className="absolute inset-0 w-full h-full object-cover"
                            loading="eager"
                            onLoad={() => setImagesLoaded(prev => new Set(prev).add(secondaryImage.url))}
                          />
                        </div>
                      )}

                      {!primaryImage && (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <span className="text-gray-400 text-xs">{t('common.noImage')}</span>
                        </div>
                      )}
                    </div>
                  </Link>


                  {/* Stock Badge */}
                  {!inStock && (
                    <div className="absolute top-2 left-2 z-10 bg-black/80 text-white px-2 py-1 text-xs uppercase">
                      {t('common.outOfStock')}
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex flex-col pl-2 py-3 gap-1 bg-[#F8F8F8] flex-1">
                  <Link href={productUrl}>
                    <p className="font-medium text-sm" style={{ fontFamily: 'SimonMono, "Courier New", Courier, monospace' }}>
                      {product.name}
                    </p>
                  </Link>
                  
                  {product.material && (
                    <p className="text-xs text-gray-600" style={{ fontFamily: 'SimonMono, "Courier New", Courier, monospace' }}>
                      {t('product.material')}: {product.material}
                    </p>
                  )}

                  <div className="flex items-center gap-2 mt-auto">
                    {product.specialOfferPrice && product.specialOfferPrice < product.price ? (
                      <>
                        <span className="text-red-600 font-medium" style={{ fontFamily: 'SimonMono, "Courier New", Courier, monospace' }}>
                          {formatPrice(product.specialOfferPrice)}
                        </span>
                        <span className="text-gray-400 line-through text-sm" style={{ fontFamily: 'SimonMono, "Courier New", Courier, monospace' }}>
                          {formatPrice(product.price)}
                        </span>
                      </>
                    ) : (
                      <span className="font-medium" style={{ fontFamily: 'SimonMono, "Courier New", Courier, monospace' }}>
                        {formatPrice(productPrice)}
                      </span>
                    )}
                  </div>

                  {/* Add to Cart Button */}
                  {inStock ? (
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={addingToCart === product.id}
                      className="mt-2 px-4 py-2 bg-black text-white text-xs uppercase hover:bg-gray-800 transition-colors disabled:opacity-50"
                      style={{ fontFamily: 'SimonMono, "Courier New", Courier, monospace' }}
                    >
                      {addingToCart === product.id ? t('common.loading') : t('common.add')}
                    </button>
                  ) : (
                    <button
                      className="mt-2 px-4 py-2 bg-gray-300 text-gray-600 text-xs uppercase cursor-not-allowed"
                      style={{ fontFamily: 'SimonMono, "Courier New", Courier, monospace' }}
                      disabled
                    >
                      {t('common.request')}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

