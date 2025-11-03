'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { useBackgroundImages } from '@/hooks/useBackgroundImages'
import { useCurrency } from '@/contexts/CurrencyContext'
import { useCart } from '@/contexts/CartContext'
import { Product } from '@/types'
import { productService } from '@/services/productService'
import { 
  ShoppingBag,
  Heart, 
  Star, 
  Check, 
  Package, 
  Gem, 
  Scale, 
  Tag, 
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  Minus,
  Droplet,
  Shield,
  Sparkles
} from 'lucide-react'
import Link from 'next/link'
import { FeaturedProducts } from '@/components/sections/FeaturedProducts'
import { ProductReviews } from '@/components/product/ProductReviews'
import { ProductImageZoom } from '@/components/product/ProductImageZoom'
import { useAuth } from '@/contexts/AuthContext'
import { favoriteService } from '@/services/favoriteService'
import api from '@/services/api'

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [showMaterials, setShowMaterials] = useState(false)
  const [showSpecifications, setShowSpecifications] = useState(false)
  const [hasScrolledImages, setHasScrolledImages] = useState(false)
  const [availableQuantity, setAvailableQuantity] = useState<number | null>(null)
  
  const imageColumnRef = useRef<HTMLDivElement>(null)
  const materialsRef = useRef<HTMLDivElement>(null)
  const specificationsRef = useRef<HTMLDivElement>(null)
  const reviewsRef = useRef<HTMLDivElement>(null)
  
  const { isAuthenticated, user } = useAuth()

  const { getBackgroundUrlForSection } = useBackgroundImages()
  const { formatPrice } = useCurrency()
  const { addToCart, cart } = useCart()
  
  const navigationBackground = getBackgroundUrlForSection('navigation')
  const footerBackground = getBackgroundUrlForSection('footer')

  // Poll for stock updates every 5 seconds and refresh when cart changes
  useEffect(() => {
    if (!product?.id) return
    
    const updateStock = async () => {
      try {
        const qty = await productService.getProductAvailability(product.id)
        setAvailableQuantity(qty)
      } catch (err: any) {
        // Silently handle network errors - don't spam console
        if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
          console.warn('Failed to fetch stock availability (network error - backend may be down):', err.message)
        } else {
          console.error('Failed to update stock:', err)
        }
        // Don't update availableQuantity on error - keep last known value
      }
    }
    
    updateStock() // Initial update
    const interval = setInterval(updateStock, 5000) // Poll every 5 seconds
    
    // Also refresh when window receives focus (user returns to tab)
    const handleFocus = () => updateStock()
    window.addEventListener('focus', handleFocus)
    
    // Refresh stock when cart changes
    const handleCartChange = () => {
      console.log('Cart changed event detected, refreshing stock...')
      updateStock()
    }
    window.addEventListener('cartUpdated', handleCartChange)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('cartUpdated', handleCartChange)
    }
  }, [product?.id, cart?.items.length])

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        setError(null)
        // Try slug first, then fallback to SKU for backward compatibility
        const decoded = decodeURIComponent(slug)
        console.log('Fetching product with slug/SKU:', decoded)
        let productData: Product | null = null
        
        try {
          // First try as slug (new format)
          productData = await productService.getProductBySlug(decoded)
        } catch (slugError) {
          // If slug fails, try as SKU (backward compatibility)
          try {
            productData = await productService.getProductBySku(decoded)
          } catch (skuError) {
            throw new Error('Product not found')
          }
        }
        
        if (!productData) {
          throw new Error('Product not found')
        }
        
        setProduct(productData)
      } catch (err) {
        console.error('Error fetching product:', err)
        setError('Product not found')
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      fetchProduct()
    }
  }, [slug])

  // Handle global scrolling - ALWAYS scroll images first until exhausted
  useEffect(() => {
    const imageColumn = imageColumnRef.current
    const rightColumn = document.getElementById('main-product-content')
    if (!imageColumn || !product || !rightColumn) return

    let isScrolling = false
    let scrollTarget = 0
    let rafId: number | null = null

    const smoothScrollTo = (element: HTMLElement, target: number, duration: number = 300) => {
      const start = element.scrollTop
      const distance = target - start
      const startTime = performance.now()

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)
        // Easing function for smooth animation
        const ease = progress < 0.5 
          ? 2 * progress * progress 
          : -1 + (4 - 2 * progress) * progress
        
        element.scrollTop = start + distance * ease

        if (progress < 1) {
          rafId = requestAnimationFrame(animate)
        } else {
          isScrolling = false
          rafId = null
        }
      }

      rafId = requestAnimationFrame(animate)
    }

    const isImageColumnInView = () => {
      const rect = imageColumn.getBoundingClientRect()
      return rect.top < window.innerHeight && rect.bottom > 0
    }

    const isRightColumnFullyInView = () => {
      const rect = rightColumn.getBoundingClientRect()
      return rect.top >= 0 && rect.bottom <= window.innerHeight
    }

    const handleGlobalWheel = (e: WheelEvent) => {
      // Always prioritize image scrolling when images are in view
      if (!isImageColumnInView()) return

      const { scrollTop, scrollHeight, clientHeight } = imageColumn
      const isAtTop = scrollTop <= 1
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1

      // If scrolling down and not at bottom, ALWAYS scroll images first (faster)
      if (e.deltaY > 0 && !isAtBottom) {
        e.preventDefault()
        e.stopPropagation()
        
        if (rafId) cancelAnimationFrame(rafId)
        
        scrollTarget = Math.min(scrollTop + e.deltaY * 3, scrollHeight - clientHeight)
        smoothScrollTo(imageColumn, scrollTarget, 100)
        return false
      }

      // If scrolling up and not at top, ALWAYS scroll images first (faster)
      if (e.deltaY < 0 && !isAtTop) {
        e.preventDefault()
        e.stopPropagation()
        
        if (rafId) cancelAnimationFrame(rafId)
        
        scrollTarget = Math.max(scrollTop + e.deltaY * 3, 0)
        smoothScrollTo(imageColumn, scrollTarget, 100)
        return false
      }

      // If at top and scrolling up, allow normal page scroll
      // If at bottom and scrolling down, allow normal page scroll
      return true
    }

    // Also handle scrollbar dragging on the image column
    const handleImageColumnScroll = () => {
      // This ensures scrollbar also works smoothly
    }

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = imageColumn
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10
      
      if (isAtBottom && !hasScrolledImages && specificationsRef.current) {
        setHasScrolledImages(true)
        setShowSpecifications(true)
        // Smooth scroll to specifications
        setTimeout(() => {
          specificationsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 100)
      }
    }

    // Add global wheel listener to window
    window.addEventListener('wheel', handleGlobalWheel, { passive: false })
    imageColumn.addEventListener('scroll', handleScroll)
    imageColumn.addEventListener('scroll', handleImageColumnScroll)
    
    return () => {
      window.removeEventListener('wheel', handleGlobalWheel)
      imageColumn.removeEventListener('scroll', handleScroll)
      imageColumn.removeEventListener('scroll', handleImageColumnScroll)
      if (rafId) {
        cancelAnimationFrame(rafId)
      }
    }
  }, [product, hasScrolledImages])

  // Check if product is favorited
  useEffect(() => {
    if (product && isAuthenticated) {
      favoriteService.getFavoriteIds()
        .then(ids => setIsFavorite(ids.includes(product.id)))
        .catch(() => setIsFavorite(false))
    }
  }, [product, isAuthenticated])

  const handleToggleFavorite = async () => {
    if (!product || !isAuthenticated) return
    try {
      await favoriteService.toggleFavorite(product.id)
      // Dispatch event to update header favorite count
      window.dispatchEvent(new Event('favoriteChanged'))
      setIsFavorite(!isFavorite)
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    }
  }

  const handleViewMoreDetails = () => {
    if (materialsRef.current) {
      materialsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setShowMaterials(true)
    }
  }

  const handleMaterialsToggle = () => {
    setShowMaterials(!showMaterials)
    if (!showMaterials) {
      setShowSpecifications(false)
    }
  }

  const handleSpecificationsToggle = () => {
    setShowSpecifications(!showSpecifications)
    if (!showSpecifications) {
      setShowMaterials(false)
    }
  }

  const handleAddToCart = async () => {
    if (!product) return
    
    // Check if product is already in cart
    const itemInCart = cart?.items.find(item => item.product.id === product.id)
    if (itemInCart) {
      const totalRequested = itemInCart.quantity + quantity
      console.log('Product already in cart. Current quantity:', itemInCart.quantity, 'Adding:', quantity, 'Total will be:', totalRequested)
      // Still allow adding if there's stock, but show a message
    }
    
    // Use the same logic as the display calculation
    const hasApiAvailability = availableQuantity !== null && availableQuantity !== undefined
    let currentAvailableQty = hasApiAvailability
      ? availableQuantity  // Use API value even if it's 0 (real-time stock)
      : (product.availableQuantity !== undefined && product.availableQuantity !== null && product.availableQuantity > 0
          ? product.availableQuantity 
          : (product.quantity !== undefined && product.quantity !== null ? product.quantity : 0))
    
    // If API returned null/undefined but product has quantity, use product quantity
    if (currentAvailableQty === 0 && product.quantity && product.quantity > 0) {
      currentAvailableQty = product.quantity
    }
    
    console.log('handleAddToCart - Product:', product.name, 'availableQuantity (API):', availableQuantity, 'product.quantity:', product.quantity, 'calculatedQty:', currentAvailableQty, 'itemInCart:', itemInCart)
    
    // Check available stock considering items already in cart
    const stockAfterCart = itemInCart ? currentAvailableQty - itemInCart.quantity : currentAvailableQty
    
    if (currentAvailableQty <= 0) {
      alert('This item is no longer available. Please check your cart if it was already added.')
      // Refresh stock
      try {
        const qty = await productService.getProductAvailability(product.id)
        setAvailableQuantity(qty)
      } catch (err) {
        console.error('Failed to refresh stock:', err)
      }
      return
    }
    
    if (quantity > stockAfterCart) {
      alert(`Only ${stockAfterCart} ${stockAfterCart === 1 ? 'item' : 'items'} available. You already have ${itemInCart?.quantity || 0} in your cart.`)
      return
    }

    setAddingToCart(true)
    try {
      await addToCart(product, quantity)
      // Immediately refresh stock and cart after adding to cart
      try {
        const qty = await productService.getProductAvailability(product.id)
        setAvailableQuantity(qty)
        console.log('Stock updated after adding to cart:', qty)
      } catch (err: any) {
        // Silently handle network errors
        if (err.code !== 'ERR_NETWORK' && !err.message?.includes('Network Error')) {
          console.error('Failed to refresh stock:', err)
        }
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to add item to cart'
      if (errorMsg.includes('stock') || errorMsg.includes('available')) {
        alert('Sorry, this item is no longer available in the requested quantity. Please adjust your cart.')
        // Refresh stock
        try {
          const qty = await productService.getProductAvailability(product.id)
          setAvailableQuantity(qty)
        } catch (refreshErr) {
          console.error('Failed to refresh stock:', refreshErr)
        }
      } else {
        alert(errorMsg)
      }
    } finally {
      setAddingToCart(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header backgroundImage={navigationBackground} />
        <main className="py-12 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="text-gray-600 mt-4">Loading product...</p>
          </div>
        </main>
        <Footer backgroundImage={footerBackground} />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-white">
        <Header backgroundImage={navigationBackground} />
        <main className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Product Not Found</h1>
            <p className="text-gray-600 mb-8">The product you're looking for doesn't exist.</p>
            <Link 
              href="/products"
              className="inline-flex items-center px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Products
            </Link>
          </div>
        </main>
        <Footer backgroundImage={footerBackground} />
      </div>
    )
  }

  // At this point, product is guaranteed to exist
  const currentProduct = product as Product
  
  // Calculate available quantity with proper logic:
  // 1. Use availableQuantity (from API) if it's explicitly set (even if 0) - this is real-time availability
  // 2. Only fall back to product.availableQuantity or product.quantity if API hasn't been called yet (availableQuantity is null/undefined)
  // This ensures we respect the API's real-time stock count, including when it's 0
  const hasApiAvailability = availableQuantity !== null && availableQuantity !== undefined
  
  const currentAvailableQty = hasApiAvailability
    ? availableQuantity  // Use API value even if it's 0 (real-time stock)
    : (currentProduct.availableQuantity !== undefined && currentProduct.availableQuantity !== null && currentProduct.availableQuantity > 0
        ? currentProduct.availableQuantity 
        : (currentProduct.quantity !== undefined && currentProduct.quantity !== null ? currentProduct.quantity : 0))
  
  // Debug: Log stock information
  console.log('Product stock debug:', {
    name: currentProduct.name,
    availableQuantity,
    productAvailableQuantity: currentProduct.availableQuantity,
    productQuantity: currentProduct.quantity,
    calculatedQty: currentAvailableQty,
    active: currentProduct.active,
    hasApiAvailability
  })
  
  // Only check quantity for stock status, not active flag (product might be inactive but still have stock)
  const inStock = currentAvailableQty > 0
  const allImages = currentProduct.images && currentProduct.images.length > 0
    ? currentProduct.images
        .filter((img) => img.url && img.url.trim() !== '')
        .sort((a, b) => {
          if (a.isPrimary) return -1
          if (b.isPrimary) return 1
          return (a.sortOrder || 0) - (b.sortOrder || 0)
        })
    : []
  const productPrice = currentProduct.displayPrice || currentProduct.price
  const hasSpecialOffer = !!(currentProduct.specialOffer && currentProduct.specialOfferPrice)

  return (
    <div className="min-h-screen bg-white">
      <Header backgroundImage={navigationBackground} />
      
      {/* Breadcrumb Navigation */}
      {product && product.categories && product.categories.length > 0 && (
        <nav className="px-4 sm:px-6 lg:px-8 py-4">
          <ol className="flex items-center gap-2" style={{ gap: '0.5rem', alignItems: 'center', fontSize: '0.875rem', fontFamily: '"SimonMono", "Courier New", Courier, monospace', color: 'rgba(121, 120, 108, 1)' }}>
            <li>
              <Link
                href="/products"
                className="pointer-events-auto transition-[color] ease-ease duration-300 focus-visible:ring-1 ring-utility-focus ring-offset-4 outline-none capitalize hover:text-utility-hover"
                data-testid="internal-link"
                aria-label="Shop All"
              >
                Shop All
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link
                href={`/products?category=${encodeURIComponent(product.categories[0])}`}
                className="pointer-events-auto transition-[color] ease-ease duration-300 focus-visible:ring-1 ring-utility-focus ring-offset-4 outline-none capitalize hover:text-utility-hover"
                data-testid="internal-link"
                aria-label={product.categories[0]}
              >
                {product.categories[0]}
              </Link>
            </li>
          </ol>
        </nav>
      )}
      
      <main className="relative">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left Column Container - Images + Materials/Specs */}
            <div className="flex flex-col">
              {/* Images (Scrollable Only) */}
              <div 
                ref={imageColumnRef}
                className="overflow-y-auto flex-1"
                style={{ 
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  maxHeight: 'calc(100vh - 200px)',
                  scrollBehavior: 'smooth'
                }}
              >
                <style jsx>{`
                  div::-webkit-scrollbar {
                    display: none;
                  }
                `}</style>
                <div className="flex flex-col">
                  {allImages.length > 0 ? (
                    allImages.map((image, index) => (
                      <ProductImageZoom key={image.id} image={image} productName={currentProduct.name} />
                    ))
                  ) : (
                    <div className="aspect-square rounded-lg bg-gray-100 flex items-center justify-center">
                      <Package className="w-24 h-24 text-gray-400" />
                    </div>
                  )}
                </div>
              </div>
              
              {/* Materials Section - Below images, in left column */}
              <div ref={materialsRef} className="mt-8">
                <button
                  type="button"
                  onClick={handleMaterialsToggle}
                  aria-controls="materials-content"
                  aria-expanded={showMaterials}
                  data-state={showMaterials ? 'open' : 'closed'}
                  className="group relative flex flex-col w-full cursor-pointer py-4 focus-visible:outline-none border-b border-gray-200 transition-all duration-300"
                >
                  <div className="flex items-center justify-between w-full text-left">
                    <p className="type-utility-1 text-content uppercase font-normal">Materials</p>
                    <span className={`text-lg font-normal transition-transform duration-300 ${showMaterials ? '' : ''}`}>
                      {showMaterials ? '−' : '+'}
                    </span>
                  </div>
                </button>
                
                <div 
                  id="materials-content" 
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    showMaterials ? 'max-h-[500px] opacity-100 mt-4 pb-4 border-b border-gray-200' : 'max-h-0 opacity-0'
                  }`}
                >
                  {showMaterials && (
                    <div>
                    <h3 className="text-lg font-semibold mb-2">{currentProduct.material || '14k Gold'}</h3>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {currentProduct.material?.includes('14k') || currentProduct.material?.includes('14K') 
                        ? `Our 14k gold pieces are made to last and perfect for everyday wear. Each piece is crafted from 94% recycled gold. 14k white gold pieces are finished with rhodium plating, giving them their signature color along with added shine and durability.`
                        : currentProduct.description || 'High-quality materials crafted with care.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Specifications Section - Below Materials, in left column */}
              <div ref={specificationsRef} className="mt-0">
                <button
                  type="button"
                  onClick={handleSpecificationsToggle}
                  aria-controls="specifications-content"
                  aria-expanded={showSpecifications}
                  data-state={showSpecifications ? 'open' : 'closed'}
                  className="group relative flex flex-col w-full cursor-pointer py-4 focus-visible:outline-none border-b border-gray-200 transition-all duration-300"
                >
                  <div className="flex items-center justify-between w-full text-left">
                    <p className="type-utility-1 text-content uppercase font-normal">Specifications</p>
                    <span className={`text-lg font-normal transition-transform duration-300 ${showSpecifications ? '' : ''}`}>
                      {showSpecifications ? '−' : '+'}
                    </span>
                  </div>
                </button>
                
                <div 
                  id="specifications-content" 
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    showSpecifications ? 'max-h-[500px] opacity-100 mt-4 pb-4 border-b border-gray-200' : 'max-h-0 opacity-0'
                  }`}
                >
                  {showSpecifications && (
                    <div>
                      <div className="space-y-2">
                        {currentProduct.material && (
                          <p>
                            <strong>- Material:</strong> {currentProduct.material}
                          </p>
                        )}
                        {currentProduct.weightGrams && (
                          <p>
                            <strong>- Weight:</strong> {currentProduct.weightGrams}g
                          </p>
                        )}
                        {currentProduct.color && (
                          <p>
                            <strong>- Color:</strong> {currentProduct.color}
                          </p>
                        )}
                        {currentProduct.finish && (
                          <p>
                            <strong>- Finish:</strong> {currentProduct.finish}
                          </p>
                        )}
                        {currentProduct.ringSize && (
                          <p>
                            <strong>- Ring Size:</strong> {currentProduct.ringSize}
                          </p>
                        )}
                        {currentProduct.chainLength && (
                          <p>
                            <strong>- Chain Length:</strong> {currentProduct.chainLength}
                          </p>
                        )}
                        {currentProduct.gemstone && (
                          <p>
                            <strong>- Gemstone:</strong> {currentProduct.gemstone}
                          </p>
                        )}
                        {currentProduct.material?.includes('Gold') && (
                          <p>
                            <strong>- Hollowed 14K gold</strong>
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Product Info (Sticky) */}
            <div 
              id="main-product-content"
              className="sticky top-8 h-fit"
            >
              <div className="flex flex-col flex-1 justify-between">
                <div className="flex justify-between items-start gap-2xl">
                  <h1 className="type-heading-3 text-content text-base md:text-lg font-bold">{currentProduct.name}</h1>
                  <div>
                    <div className="flex flex-row-reverse justify-center items-center gap-x-xs">
                      <div className="flex gap-x-[6px]" aria-label={`Rating: ${(currentProduct.averageRating || 0).toFixed(1)} out of 5 stars`} role="img">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <svg
                            key={i}
                            className={`!w-[16px] !h-[16px] flex justify-center items-center w-lg h-lg ${
                              i <= Math.round(currentProduct.averageRating || 0)
                                ? 'fill-[#68675E] text-[#68675E]'
                                : 'text-gray-300'
                            }`}
                            width="14"
                            height="13"
                            viewBox="0 0 14 13"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path 
                              fillRule="evenodd" 
                              clipRule="evenodd" 
                              d="M7.00013 1.43457L8.82291 4.82927L12.693 5.47289L9.94961 8.21456L10.5184 12.007L7.00013 10.3067L3.48188 12.007L4.05065 8.21456L1.30731 5.47289L5.17736 4.82912L7.00013 1.43457Z" 
                              fill={i <= Math.round(currentProduct.averageRating || 0) ? "#68675E" : "none"}
                              stroke={i <= Math.round(currentProduct.averageRating || 0) ? "#68675E" : "#E5E5E5"}
                              strokeWidth="0.758711"
                            />
                          </svg>
                        ))}
                      </div>
                      <button 
                        onClick={() => {
                          reviewsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                        }}
                        className="relative pointer-events-auto inline-block text-center outline-none border border-content hover:border-utility-hover disabled:text-utility-disabled focus-visible:ring-2 ring-utility-focus ring-offset-2 transition-colors duration-300 ease-ease bg-transparent border-none p-0 tracking-utility underline uppercase"
                        accessibility-role="button"
                      >
                        <span className="flex justify-center items-center gap-xxs preserve-line-height">
                          <p className="type-utility-2 text-content text-sm font-normal">{(currentProduct.averageRating || 0).toFixed(1)}</p>
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center mt-sm gap-md">
                  {hasSpecialOffer ? (
                    <div className="flex type-body-1 items-end">
                      <div className="flex flex-wrap gap-x-xs">
                        <div className="flex gap-xxs md:gap-xs flex-row shrink-0 flex-wrap">
                          <span className="text-base md:text-lg type-utility-1 font-bold text-red-600">
                            {formatPrice(currentProduct.specialOfferPrice || productPrice, currentProduct.baseCurrency)}
                          </span>
                          <span className="text-base md:text-lg type-utility-1 font-bold line-through text-gray-400">
                            {formatPrice(currentProduct.price, currentProduct.baseCurrency)}
                          </span>
                        </div>
                      </div>
                      {currentProduct.specialOfferDescription && (
                        <span className="text-sm text-red-600 font-medium ml-2">
                          {currentProduct.specialOfferDescription}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex type-body-1 items-end">
                      <div className="flex flex-wrap gap-x-xs">
                        <div className="flex gap-xxs md:gap-xs flex-row shrink-0 flex-wrap">
                          <span className="text-base md:text-lg type-utility-1 font-bold">
                            {formatPrice(productPrice, currentProduct.baseCurrency)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Material Selector */}
              {currentProduct.material && (
                <div className="mt-6 mb-4">
                  <h5 className="sr-only">Material</h5>
                  <div className="flex flex-col-reverse gap-y-2">
                    <div className="mb-1 flex items-center">
                      <div role="radiogroup" className="flex gap-2 items-center flex-wrap" aria-label="Material Options">
                        <button
                          type="button"
                          role="radio"
                          aria-checked="true"
                          className="relative flex items-center justify-center border border-gray-400 p-0 rounded-none overflow-visible w-4 h-4"
                          aria-label={currentProduct.material}
                        >
                          <div 
                            className="size-full relative flex items-center justify-center before:absolute before:top-full before:mt-1 before:left-0 before:w-full before:h-[1px] before:bg-current before:z-10 before:content-['']"
                            style={{ backgroundColor: currentProduct.material.includes('Gold') ? '#E9D590' : '#C0C0C0' }}
                          />
                        </button>
                      </div>
                    </div>
                    <div className="text-xs md:text-sm mt-[2px]">
                      <span className="block truncate text-black">{currentProduct.material}</span>
                    </div>
                  </div>
                </div>
              )}

                      {/* Stock Status & Quantity */}
                      {currentAvailableQty > 0 ? (
                        <div className="mt-4 flex items-center gap-2 ml-1 my-0">
                          <Check className="w-3 h-3 text-green-600" />
                          <span className="text-xs md:text-sm">
                            In stock - ready to ship
                            {currentAvailableQty > 0 && (
                              <span className="ml-2 text-gray-600">
                                ({currentAvailableQty} {currentAvailableQty === 1 ? 'item' : 'items'} left)
                              </span>
                            )}
                          </span>
                        </div>
                      ) : (
                        <div className="mt-4 flex items-center gap-2 ml-1 my-0">
                          <span className="text-xs md:text-sm text-red-600 font-medium">
                            Out of stock
                          </span>
                        </div>
                      )}

              {/* Add to Cart Form */}
              <form className="mt-6">
                <div className="flex flex-col-reverse mb-8 md:mb-12"></div>
                <div className="flex">
                  {inStock ? (
                    <button
                      onClick={handleAddToCart}
                      disabled={addingToCart || !inStock || currentAvailableQty <= 0}
                      className="relative inline-block uppercase px-6 text-center outline-none border focus-visible:ring-2 ring-offset-2 transition-colors duration-300 text-sm tracking-wide leading-5 py-3 bg-black text-white border-black hover:bg-gray-800 disabled:bg-gray-300 disabled:text-gray-500 disabled:border-gray-300 disabled:cursor-not-allowed flex-1 font-normal"
                      type="button"
                    >
                      <span className="flex justify-center items-center gap-2">
                        {addingToCart ? 'Adding...' : currentAvailableQty <= 0 ? 'Out of Stock' : 'Add to bag'}
                      </span>
                    </button>
                  ) : (
                    <button
                      onClick={async () => {
                        if (!product) return
                        
                        // Get email - use user email if authenticated, otherwise prompt
                        let email = user?.email || ''
                        if (!email) {
                          const input = prompt('Please enter your email address to be notified when this product becomes available:')
                          if (!input || !input.trim()) return
                          email = input.trim()
                        }
                        
                        try {
                          await api.post('/api/public/stock-notifications/request', null, {
                            params: {
                              productId: product.id,
                              email: email
                            }
                          })
                          alert('You will be notified when this product becomes available!')
                        } catch (error: any) {
                          const message = error.response?.data?.message || error.message || 'Failed to request notification'
                          alert(message)
                        }
                      }}
                      className="relative inline-block uppercase px-6 text-center outline-none border focus-visible:ring-2 ring-offset-2 transition-colors duration-300 text-sm tracking-wide leading-5 py-3 bg-gray-600 text-white border-gray-600 hover:bg-gray-700 flex-1 font-normal"
                      type="button"
                    >
                      <span className="flex justify-center items-center gap-2">
                        Request when available
                      </span>
                    </button>
                  )}
                  <button
                    onClick={handleToggleFavorite}
                    className="relative inline-block uppercase text-center outline-none border focus-visible:ring-2 ring-offset-2 transition-colors duration-300 text-sm tracking-wide leading-5 bg-black text-white border-black hover:bg-gray-800 disabled:bg-gray-300 disabled:text-gray-500 disabled:border-gray-300 ml-1 flex-[0_0_40px] p-3"
                    type="button"
                  >
                    <span className="flex justify-center items-center gap-2">
                      <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                    </span>
                  </button>
                </div>
                {!inStock && (
                  <p className="mt-2 text-sm text-gray-600">
                    This item is currently out of stock
                  </p>
                )}
              </form>

              {/* Product Description */}
              {currentProduct.description && (
                <div className="my-8">
                  <div className="text-xs md:text-sm">
                    <p>{currentProduct.description}</p>
                  </div>
                </div>
              )}

              {/* Features */}
              <div className="my-8">
                <div className="flex items-center mb-2">
                  <Droplet className="w-5 h-5 mr-2" />
                  <p className="text-xs md:text-sm font-normal">Water Resistant & Hypoallergenic</p>
                </div>
                <div className="flex items-center mb-2">
                  <Shield className="w-5 h-5 mr-2" />
                  <p className="text-xs md:text-sm font-normal">Made To Last in Solid Gold</p>
                </div>
                <div className="flex items-center mb-2">
                  <Sparkles className="w-5 h-5 mr-2" />
                  <p className="text-xs md:text-sm font-normal">94% Recycled 14K Gold</p>
                </div>
              </div>

              {/* View More Details Link */}
              <div className="w-full flex justify-start pb-8">
                <button
                  onClick={handleViewMoreDetails}
                  className="pointer-events-auto transition-colors ease-in-out duration-300 focus-visible:ring-1 ring-offset-4 outline-none uppercase tracking-normal w-fit hover:text-gray-700"
                  data-testid="internal-link"
                >
                  <p className="text-xs md:text-sm font-normal underline hover:[text-decoration-color:gray] transition-[text-decoration-color] duration-200">VIEW MORE DETAILS</p>
                </button>
              </div>
            </div>
          </div>


                  {/* Reviews Section */}
                  {currentProduct.id && (
                    <div ref={reviewsRef}>
                      <ProductReviews productId={currentProduct.id} productName={currentProduct.name} />
                    </div>
                  )}

          {/* Featured Products */}
          <div className="mb-16 max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">You May Also Like</h2>
            <FeaturedProducts />
          </div>
        </div>
      </main>

      <Footer backgroundImage={footerBackground} />
    </div>
  )
}


