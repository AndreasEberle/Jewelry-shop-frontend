'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { useBackgroundImages } from '@/hooks/useBackgroundImages'
import { useCurrency } from '@/contexts/CurrencyContext'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/services/api'
import { Search, Filter, Grid, List, Star, Heart, ShoppingCart, Eye } from 'lucide-react'
import Link from 'next/link'
import { Product } from '@/types'
import { productService } from '@/services/productService'
import { useTranslation } from '@/hooks/useTranslation'

export default function ProductsPage() {
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const { user } = useAuth()
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedMaterial, setSelectedMaterial] = useState('all')
  const [onlyAvailable, setOnlyAvailable] = useState(false)
  const [sortBy, setSortBy] = useState('name')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 })
  const [showFilters, setShowFilters] = useState(false)
  const [addingToCart, setAddingToCart] = useState<string | null>(null)
  const [stockUpdates, setStockUpdates] = useState<Record<string, number>>({})
  const [productsPerRow, setProductsPerRow] = useState(2) // Default x2
  const [isFiltersSticky, setIsFiltersSticky] = useState(false)
  const [navbarHeight, setNavbarHeight] = useState(60)
  const filtersRef = useRef<HTMLDivElement>(null)
  const filterButtonRef = useRef<HTMLButtonElement>(null)
  const [preloadedImages, setPreloadedImages] = useState<Set<string>>(new Set())

  const { getBackgroundUrlForSection } = useBackgroundImages()
  const { formatPrice } = useCurrency()
  const { addToCart, cart } = useCart()
  const { t } = useTranslation()
  const navigationBackground = getBackgroundUrlForSection('navigation')
  const footerBackground = getBackgroundUrlForSection('footer')

  // Load products per row from system config (from database)
  useEffect(() => {
    const loadProductsPerRow = async () => {
      try {
        // Use public endpoint to get the config value from database
        const response = await api.get('/api/public/system-config/PRODUCTS_PER_ROW')
        // The endpoint returns { key, value } format
        const configValue = response.data?.value || response.data?.configValue
        if (configValue) {
          const value = parseInt(configValue)
          // Validate value is between 1-6
          if (!isNaN(value) && value >= 1 && value <= 6) {
            setProductsPerRow(value)
            return
          }
        }
        // If no valid value found, keep default of 2
      } catch (error) {
        console.error('Failed to load products per row config from database:', error)
        // Keep default value of 2 if API call fails or config doesn't exist
      }
    }
    loadProductsPerRow()
  }, [])

  // Poll for stock updates every 5 seconds
  useEffect(() => {
    if (products.length === 0) return
    
    const updateStock = async () => {
      try {
        const productIds = products.map(p => p.id)
        const availability = await productService.getMultipleProductAvailability(productIds)
        console.log('Stock updates from API:', availability)
        console.log('Products with quantities:', products.map(p => ({ id: p.id, name: p.name, quantity: p.quantity, availableQuantity: p.availableQuantity })))
        setStockUpdates(availability)
      } catch (err) {
        console.error('Failed to update stock:', err)
      }
    }
    
    updateStock() // Initial update
    const interval = setInterval(updateStock, 5000) // Poll every 5 seconds
    
    return () => clearInterval(interval)
  }, [products])

  // Fetch real products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        setError(null)
        // Get products - handle the response correctly
        const response: any = await productService.getProducts()
        // Handle both array (direct backend response) and ProductResponse (paginated response)
        let productsList: Product[] = []
        if (Array.isArray(response)) {
          productsList = response
        } else if (response?.content && Array.isArray(response.content)) {
          productsList = response.content
        } else if (response?.data && Array.isArray(response.data)) {
          productsList = response.data
        }
        setProducts(productsList)
        
        // Preload all secondary images immediately using link preload tags
        const loadedUrls = new Set<string>()
        const imageLoadPromises: Promise<void>[] = []
        
        productsList.forEach((p: Product) => {
          if (p.images && p.images.length > 1 && p.images[1]?.url) {
            const url = p.images[1].url
            if (!loadedUrls.has(url)) {
              loadedUrls.add(url)
              
              // Add link preload tag to head for aggressive preloading
              const link = document.createElement('link')
              link.rel = 'preload'
              link.as = 'image'
              link.href = url
              document.head.appendChild(link)
              
              // Also preload with Image object
              const promise = new Promise<void>((resolve) => {
                const img = new Image()
                img.onload = () => resolve()
                img.onerror = () => resolve() // Still resolve on error to not block
                img.src = url
              })
              imageLoadPromises.push(promise)
            }
          }
        })
        
        // Wait for all images to load, then set preloaded state
        Promise.all(imageLoadPromises).then(() => {
          setPreloadedImages(loadedUrls)
        })
        
        // Debug: Log product images
        productsList.forEach((p: Product) => {
          if (p.images && p.images.length > 0) {
            console.log(`Product ${p.name} (${p.sku}): ${p.images.length} images`, p.images.map(img => ({ url: img.url, isPrimary: img.isPrimary })))
          } else {
            console.warn(`Product ${p.name} (${p.sku}): No images`)
          }
        })
      } catch (err) {
        console.error('Error fetching products:', err)
        setError('Failed to load products. Please try again later.')
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  // Read category and featured from URL params on mount
  useEffect(() => {
    const categoryParam = searchParams.get('category')
    const featuredParam = searchParams.get('featured')
    
    if (categoryParam) {
      setSelectedCategory(categoryParam)
    } else {
      setSelectedCategory('all')
    }
    
    // If featured=true, filter to show only featured products
    if (featuredParam === 'true') {
      setSelectedCategory('all') // Reset category filter
      // Filter will be applied in filteredProducts
    }
  }, [searchParams])

  // Get navbar height on mount and resize
  useEffect(() => {
    const updateNavbarHeight = () => {
      const header = document.querySelector('header[data-testid="header"]')
      if (header) {
        setNavbarHeight(header.getBoundingClientRect().height)
      }
    }
    
    updateNavbarHeight()
    window.addEventListener('resize', updateNavbarHeight)
    
    return () => {
      window.removeEventListener('resize', updateNavbarHeight)
    }
  }, [])

  // Handle scroll to make filters sticky (accounting for navbar height)
  useEffect(() => {
    const handleScroll = () => {
      if (filtersRef.current) {
        const rect = filtersRef.current.getBoundingClientRect()
        setIsFiltersSticky(rect.top <= navbarHeight)
      }
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // Check initial state
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [navbarHeight])

  // Handle click outside to close filter dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showFilters && 
          filterButtonRef.current && 
          filtersRef.current &&
          !filterButtonRef.current.contains(event.target as Node) &&
          !filtersRef.current.contains(event.target as Node)) {
        setShowFilters(false)
      }
    }

    if (showFilters) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showFilters])

  // Extract unique categories, materials, and tags from products
  const categories = ['all', ...Array.from(new Set(products.flatMap(p => p.categories || [])))]
  const materials = Array.from(new Set(products.flatMap(p => p.material ? [p.material] : [])))
  const tags = Array.from(new Set(products.flatMap(p => p.tags || [])))
  
  const featuredParam = searchParams.get('featured')
  
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (product.tags || []).some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         product.sku.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || 
                          (product.categories || []).includes(selectedCategory)
    const matchesMaterial = selectedMaterial === 'all' || product.material === selectedMaterial
    const matchesFeatured = featuredParam !== 'true' || product.showInFeatured === true
    const productPrice = product.displayPrice || product.price
    const matchesPrice = productPrice >= priceRange.min && productPrice <= priceRange.max
    
    // Check availability if filter is enabled
    let matchesAvailability = true
    if (onlyAvailable) {
      const stockUpdateValue = stockUpdates[product.id]
      const hasValidStockUpdate = stockUpdateValue !== undefined && stockUpdateValue !== null
      let availableQty: number
      if (hasValidStockUpdate) {
        availableQty = stockUpdateValue
      } else {
        const cartItem = cart?.items?.find(item => item.product?.id === product.id || (item as any).productId === product.id)
        const cartQuantity = cartItem?.quantity || 0
        availableQty = product.availableQuantity !== undefined && product.availableQuantity !== null && product.availableQuantity > 0
          ? product.availableQuantity 
          : (product.quantity !== undefined && product.quantity !== null ? product.quantity : 0)
        availableQty = Math.max(0, availableQty - cartQuantity)
      }
      matchesAvailability = availableQty > 0
    }
    
    return matchesSearch && matchesCategory && matchesMaterial && matchesFeatured && matchesPrice && matchesAvailability
  })

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return (a.displayPrice || a.price) - (b.displayPrice || b.price)
      case 'price-high':
        return (b.displayPrice || b.price) - (a.displayPrice || a.price)
      case 'rating':
        return (b.averageRating || 0) - (a.averageRating || 0)
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      default:
        return a.name.localeCompare(b.name)
    }
  })

  const handleAddToCart = async (product: Product) => {
    // Use the same logic as ProductCard component
    const stockUpdateValue = stockUpdates[product.id]
    const hasValidStockUpdate = stockUpdateValue !== undefined && stockUpdateValue !== null && stockUpdateValue > 0
    
    const availableQty = hasValidStockUpdate
      ? stockUpdateValue
      : (product.availableQuantity !== undefined && product.availableQuantity !== null && product.availableQuantity > 0
          ? product.availableQuantity 
          : (product.quantity !== undefined && product.quantity !== null ? product.quantity : 0))
    
    console.log('handleAddToCart - Product:', product.name, 'availableQty:', availableQty, 'stockUpdates:', stockUpdates[product.id], 'product.quantity:', product.quantity, 'hasValidStockUpdate:', hasValidStockUpdate)
    
    if (availableQty <= 0) {
      alert('This item is no longer available. Please remove it from your cart if already added.')
      // Refresh stock
      try {
        const availability = await productService.getMultipleProductAvailability([product.id])
        setStockUpdates(prev => ({ ...prev, ...availability }))
      } catch (err) {
        console.error('Failed to refresh stock:', err)
      }
      return
    }
    
    setAddingToCart(product.id)
    try {
      await addToCart(product, 1)
      // Update stock after adding to cart
      try {
        const availability = await productService.getMultipleProductAvailability([product.id])
        setStockUpdates(prev => ({ ...prev, ...availability }))
      } catch (err) {
        console.error('Failed to update stock:', err)
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to add item to cart'
      if (errorMsg.includes('stock') || errorMsg.includes('available')) {
        alert('Sorry, this item is no longer available in the requested quantity. Please adjust your cart.')
        // Refresh stock
        try {
          const availability = await productService.getMultipleProductAvailability([product.id])
          setStockUpdates(prev => ({ ...prev, ...availability }))
        } catch (refreshErr) {
          console.error('Failed to refresh stock:', refreshErr)
        }
      } else {
        alert(errorMsg)
      }
    } finally {
      setAddingToCart(null)
    }
  }

  const ProductCard = ({ product, index }: { product: Product; index: number }) => {
    // Get cart quantity for this product - CartItem has product: Product, not productId
    const cartItem = cart?.items?.find(item => item.product?.id === product.id || (item as any).productId === product.id)
    const cartQuantity = cartItem?.quantity || 0
    
    // Secondary image is always rendered, no need for complex preload checks
    
    // Check if we have stock updates loaded (to show skeleton until ready)
    const hasStockUpdate = stockUpdates[product.id] !== undefined
    const stockUpdateValue = stockUpdates[product.id]
    
    // Calculate available quantity with proper fallback logic:
    // 1. Use stockUpdates if it exists (even if 0) - this is real-time availability that already excludes user's cart
    // 2. Otherwise, fall back to product.availableQuantity or product.quantity and subtract cart quantity
    // Show skeleton/loading state until stock updates are loaded
    const hasValidStockUpdate = stockUpdateValue !== undefined && stockUpdateValue !== null
    
    let availableQty: number
    if (hasValidStockUpdate) {
      // stockUpdateValue already excludes user's cart reservations, so use it directly
      availableQty = stockUpdateValue
    } else {
      // No stock update yet, use product data and subtract cart quantity
      availableQty = product.availableQuantity !== undefined && product.availableQuantity !== null && product.availableQuantity > 0
        ? product.availableQuantity 
        : (product.quantity !== undefined && product.quantity !== null ? product.quantity : 0)
      
      // Subtract cart quantity from available quantity
      availableQty = Math.max(0, availableQty - cartQuantity)
    }
    
    // Debug: Log stock information for products with quantity
    console.log(`Product ${product.name}: quantity=${product.quantity}, availableQuantity=${product.availableQuantity}, stockUpdates[${product.id}]=${stockUpdates[product.id]}, calculated availableQty=${availableQty}, active=${product.active}`)
    
    // Fix: Check quantity first, then active status - if quantity > 0, it should be in stock regardless of active status
    // (active status might be a separate concern)
    // Show skeleton until stock updates are loaded (to prevent showing wrong info)
    const isLoadingStock = !hasStockUpdate && stockUpdateValue === undefined
    const inStock = availableQty > 0
    const wasOutOfStock = availableQty === 0
    
    // Get primary image or first image with a valid URL
    const primaryImage = product.images?.find(img => img.isPrimary && img.url) 
      || product.images?.find(img => img.url) 
      || null
    
    // Get secondary/hover image - the 2nd image in order (index 1) if available
    const secondaryImage = product.images?.length > 1 && product.images[1]?.url 
      ? product.images[1] 
      : null
    
    // Debug: Log images for troubleshooting
    if (product.images && product.images.length > 1) {
      console.log(`Product ${product.name}:`, {
        totalImages: product.images.length,
        primaryImage: primaryImage?.url,
        secondaryImage: secondaryImage?.url,
        allImages: product.images.map((img, idx) => ({ index: idx, isPrimary: img.isPrimary, url: img.url }))
      })
    }
    
    const productPrice = product.displayPrice || product.price
    const hasSpecialOffer = !!(product.specialOffer && product.specialOfferPrice && product.specialOfferPrice < productPrice)
    const displayPrice = hasSpecialOffer && product.specialOfferPrice ? product.specialOfferPrice : productPrice
    
    const productSlug = product.slug || product.sku
    const productUrl = `/products/${productSlug}${product.material ? `?Material=${encodeURIComponent(product.material)}` : ''}`
    
    // Get material color for variant selector
    const getMaterialColor = (material: string) => {
      const mat = material?.toLowerCase() || ''
      if (mat.includes('yellow gold') || mat.includes('14k yellow') || mat === 'gold' || mat.includes('yellow')) {
        return '#E9D590' // Yellow gold
      } else if (mat.includes('white gold') || mat.includes('14k white') || mat.includes('white')) {
        return '#d1d1d1' // White gold
      } else if (mat.includes('rose gold') || mat.includes('pink gold')) {
        return '#E8B4B8' // Rose gold
      } else if (mat.includes('platinum')) {
        return '#E5E4E2' // Platinum
      } else if (mat.includes('silver')) {
        return '#C0C0C0' // Silver
      }
      return '#E9D590' // Default to gold
    }
    
    return (
      <li data-testid={`page-0-product-card-in-grid-${index}`}>
        <div className="h-full">
          <div 
            className="relative flex flex-col h-full bg-white text-black" 
            data-testid="product-card" 
            data-handle={productSlug}
            data-object-id={product.id}
            data-featured-variant={product.material || ''}
          >
            <div data-testid="product-card-hover-quick-add" className="relative group/product-card">
              <Link 
                className="pointer-events-auto transition-[color] ease-ease duration-300 focus-visible:ring-1 ring-utility-focus ring-offset-4 outline-none capitalize hover:text-content block" 
                data-testid="internal-link" 
                aria-label={product.name} 
                href={productUrl}
              >
                {/* Product Images Container */}
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
                          className="absolute inset-0 w-full h-full object-cover z-[1]" 
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
                          className="absolute inset-0 w-full h-full object-cover z-[1]"
                        />
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Stock Status Badge - Top Right */}
                {inStock && wasOutOfStock && (
                  <div className="absolute flex justify-start flex-wrap gap-1 max-w-[calc(100%-2rem)] right-0 top-0 z-[10] bg-background-xlight px-xs py-xxs">
                    <div 
                      style={{ backgroundColor: 'transparent', color: '#79786C' }} 
                      className="bg-content-inv text-content p-xxs md:px-xs md:py-xxs type-caption flex justify-between items-center !p-0 text-nowrap type-utility-2 uppercase font-normal !text-xxs md:!text-xs"
                    >
                      Back in Stock
                    </div>
                  </div>
                )}
                {!inStock && (
                  <div className="absolute flex justify-start flex-wrap gap-1 max-w-[calc(100%-2rem)] right-0 top-0 z-[10] px-xs py-xxs" style={{ backgroundColor: 'rgba(243, 243, 243, var(--tw-bg-opacity, 1))' }}>
                    <div 
                      style={{ fontFamily: 'SimonMono, "Courier New", Courier, monospace', fontWeight: 400, color: 'rgba(121,120,108,var(--tw-text-opacity, 1))' }} 
                      className="p-xxs md:px-xs md:py-xxs type-caption flex justify-between items-center !p-0 text-nowrap type-utility-2 uppercase !text-xxs md:!text-xs"
                    >
                      {t('common.outOfStock')}
                    </div>
                  </div>
                )}
                
                {/* Mobile indicator dots */}
                {product.images && product.images.length > 1 && (
                  <div className="absolute left-0 top-0 md:hidden z-base p-2">
                    <div className="flex gap-1">
                      {product.images.slice(0, 2).map((_, idx) => (
                        <span 
                          key={idx}
                          className="block rounded-full" 
                          style={{ width: '2px', height: '2px', backgroundColor: idx === 0 ? '#000000' : '#B2B0A1' }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </Link>
              
            </div>
            
            {/* Product Info Under Images - Special Offers & Quantity */}
            <div className="pl-2 py-3 bg-white border-b border-gray-200">
              {/* Special Offer Display */}
              {hasSpecialOffer && product.specialOfferPrice && (
                <div className="flex items-center gap-xxs mb-1">
                  <span className="text-sm font-semibold text-red-600">
                    {formatPrice(product.specialOfferPrice, product.baseCurrency)}
                  </span>
                  <span className="text-xs line-through text-gray-400">
                    {formatPrice(productPrice, product.baseCurrency)}
                  </span>
                  {product.specialOfferDescription && (
                    <span className="text-xs text-red-600 font-medium ml-1">
                      {product.specialOfferDescription}
                    </span>
                  )}
                </div>
              )}
              
              {/* Available Quantity and Add/Request Button */}
              <div className="flex items-center gap-2 relative">
                {/* Left-aligned text */}
                <div className="flex-1">
                  {isLoadingStock ? (
                    <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    <>
                      {inStock && availableQty > 0 && (
                        <div className="text-xs" style={{ fontFamily: 'SimonMono, "Courier New", Courier, monospace', fontWeight: 400, color: 'rgba(121,120,108,var(--tw-text-opacity, 1))' }}>
                          {availableQty} {availableQty === 1 ? t('common.itemAvailable') : t('common.itemsAvailable')}
                        </div>
                      )}
                      {(!inStock || availableQty === 0) && (
                        <div className="text-xs font-medium" style={{ fontFamily: 'SimonMono, "Courier New", Courier, monospace', fontWeight: 400, color: 'rgba(121,120,108,var(--tw-text-opacity, 1))' }}>
                          {t('common.requestWhenAvailable')}
                        </div>
                      )}
                    </>
                  )}
                </div>
                
                {/* Add/Request Button - Centered */}
                <div className="absolute left-1/2 transform -translate-x-1/2 flex-shrink-0">
                  {inStock ? (
                    <button 
                      className="pointer-events-auto text-center outline-none hover:border-utility-hover disabled:text-utility-disabled focus-visible:ring-2 ring-utility-focus ring-offset-2 ease-ease border-none capitalize p-0 tracking-utility transition-[opacity,colors] duration-300 ease-in-out border border-content-xlight text-content hover:text-content-mid focus:text-content-mid z-[20] flex justify-center items-center gap-xxs bg-background-xlight px-xs py-[2px]" 
                      data-title="Quick Add Product Card" 
                      data-testid="product-card-quick-add-button" 
                      role="button" 
                      aria-label="add to bag" 
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        if (inStock) {
                          handleAddToCart(product)
                        }
                      }}
                      disabled={addingToCart === product.id}
                      style={{ pointerEvents: 'auto' }}
                    >
                      <span className="flex justify-center items-center gap-xxs preserve-line-height">
                        <p className="type-utility-2 !text-xxs md:!text-xs font-normal uppercase text-content-mid" aria-label={`${product.name} Add`} style={{ fontFamily: 'SimonMono, "Courier New", Courier, monospace', fontWeight: 400 }}>
                          {t('common.add')}
                        </p>
                      </span>
                    </button>
                  ) : (
                    <button 
                      className="pointer-events-auto text-center outline-none hover:border-utility-hover disabled:text-utility-disabled focus-visible:ring-2 ring-utility-focus ring-offset-2 ease-ease border-none capitalize p-0 tracking-utility transition-[opacity,colors] duration-300 ease-in-out border border-content-xlight text-content hover:text-content-mid focus:text-content-mid z-[20] flex justify-center items-center gap-xxs bg-background-xlight px-xs py-[2px]" 
                      data-title="Request Product" 
                      data-testid="product-card-request-button" 
                      role="button" 
                      aria-label="request when available" 
                      type="button"
                      onClick={async (e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        
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
                      style={{ pointerEvents: 'auto' }}
                    >
                      <span className="flex justify-center items-center gap-xxs preserve-line-height">
                        <p className="type-utility-2 !text-xxs md:!text-xs font-normal uppercase text-content-mid" aria-label={`${product.name} Request`} style={{ fontFamily: 'SimonMono, "Courier New", Courier, monospace', fontWeight: 400 }}>
                          {t('common.request')}
                        </p>
                      </span>
                    </button>
                  )}
                </div>
                
                {/* Right spacer to balance layout */}
                <div className="flex-1"></div>
              </div>
            </div>
            
            {/* Product Card Content */}
            <div className="flex flex-col pl-2 py-3 gap-xxs h-full bg-[#F8F8F8]" data-testid="product-card-content">
              {/* Product Name */}
              <div className="flex gap-sm items-center text-nowrap overflow-hidden">
                <p className="type-utility-2 leading-normal flex-1 min-w-0 !text-xxs md:!text-xs" style={{ fontFamily: 'SimonMono, "Courier New", Courier, monospace', fontWeight: 400, color: 'rgba(121,120,108,var(--tw-text-opacity, 1))' }}>
                  <Link
                    className="pointer-events-auto transition-[color] ease-ease duration-300 focus-visible:ring-1 ring-utility-focus ring-offset-4 outline-none hover:text-utility-hover leading-normal block truncate uppercase font-normal" 
                    data-testid="internal-link" 
                    href={productUrl}
                    aria-label={product.name}
                    style={{ fontFamily: 'SimonMono, "Courier New", Courier, monospace', fontWeight: 400, color: 'rgba(121,120,108,var(--tw-text-opacity, 1))' }}
                  >
                    {product.name}
                  </Link>
                </p>
              </div>
              
              {/* Price */}
              <div className="flex items-center justify-between gap-xxs md:gap-xs w-full" style={{ fontFamily: 'SimonMono, "Courier New", Courier, monospace', fontWeight: 400, color: 'rgba(121,120,108,var(--tw-text-opacity, 1))' }}>
                <div className="flex flex-shrink-0 type-utility-2 !text-xxs md:!text-xs !font-normal type-body-2 items-end">
                  {hasSpecialOffer && product.specialOfferPrice ? (
                    <span className="text-red-600" style={{ fontFamily: 'SimonMono, "Courier New", Courier, monospace', fontWeight: 900, textRendering: 'optimizeLegibility', WebkitFontSmoothing: 'antialiased', color: '#000000' }}>{formatPrice(product.specialOfferPrice, product.baseCurrency)}</span>
                  ) : (
                    <span style={{ fontFamily: 'SimonMono, "Courier New", Courier, monospace', fontWeight: 900, textRendering: 'optimizeLegibility', WebkitFontSmoothing: 'antialiased', color: '#000000' }}>{formatPrice(displayPrice, product.baseCurrency)}</span>
                  )}
                </div>
                {hasSpecialOffer && product.specialOfferPrice && (
                  <span className="line-through text-gray-400" style={{ fontFamily: 'SimonMono, "Courier New", Courier, monospace', fontWeight: 900, textRendering: 'optimizeLegibility', WebkitFontSmoothing: 'antialiased' }}>{formatPrice(productPrice, product.baseCurrency)}</span>
                )}
              </div>
              
              {/* Variant Selector */}
              {product.material && (
                <div data-testid="product-card-variant-selector" style={{ fontFamily: 'SimonMono, "Courier New", Courier, monospace', fontWeight: 400 }}>
                  <div className="flex flex-row items-center gap-4" data-testid="variant-selector">
                    <div className="flex items-center">
                      <div 
                        role="radiogroup" 
                        aria-required="false" 
                        dir="ltr" 
                        className="flex gap-xs items-center flex-shrink-0" 
                        aria-label={`${product.name} Options`}
                        aria-labelledby={`variant-selector-label-${productSlug}`}
                        tabIndex={0}
                        style={{ outline: 'none' }}
                      >
                        <button
                          type="button"
                          role="radio"
                          aria-checked="true"
                          data-state="checked"
                          value={product.material}
                          className="relative flex items-center justify-center border p-0 rounded-none overflow-visible w-3 h-3 data-[state=checked]:border-transparent border-content"
                          aria-label={product.material}
                          tabIndex={-1}
                        >
                          <div 
                            className="size-full relative flex items-center justify-center before:absolute before:top-full before:mt-1 before:left-0 before:w-full before:h-[1px] before:bg-content before:z-10 before:content-['']" 
                            style={{ backgroundColor: getMaterialColor(product.material) }}
                          />
                        </button>
                      </div>
                    </div>
                    <div className="type-caption flex-1 min-w-0 type-body-2 !text-xxs md:!text-xs mt-[2px]">
                      <span 
                        id={`variant-selector-label-${productSlug}`}
                        data-testid="variant-selector-label" 
                        className="!text-xxs md:!text-xs block truncate"
                        style={{ fontFamily: 'SimonMono, "Courier New", Courier, monospace', fontWeight: 400, color: 'rgba(121,120,108,var(--tw-text-opacity, 1))' }}
                      >
                        {product.material}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Hidden form for cart (if needed) */}
            <div className="hidden">
              <form action="/cart" method="post">
                <input type="hidden" name="cartFormInput" value={JSON.stringify({ action: 'LinesAdd', inputs: { lines: [{ merchandiseId: product.id, quantity: 1 }] } })} />
                <span className="hidden"></span>
                <button className="relative pointer-events-auto uppercase px-lg text-center outline-none border border-content hover:border-utility-hover disabled:text-utility-disabled focus-visible:ring-2 ring-utility-focus ring-offset-2 transition-colors duration-300 ease-ease type-utility-1 tracking-px leading-5 bg-content text-content-inv hover:bg-utility-hover disabled:bg-utility-disabled-background disabled:border-utility-disabled-background py-sm hidden">
                  <span className="flex justify-center items-center gap-xxs preserve-line-height">hidden</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </li>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header backgroundImage={navigationBackground} />
        <main className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow p-4">
                    <div className="h-64 bg-gray-200 rounded mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
        <Footer backgroundImage={footerBackground} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header backgroundImage={navigationBackground} />
      
      <main className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Search and Filters - Improved */}
          <div 
            ref={filtersRef}
            className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8 transition-all ${
              isFiltersSticky ? 'sticky z-40 rounded-t-none border-t-0' : ''
            }`}
            style={isFiltersSticky ? {
              top: `${navbarHeight}px`,
              borderBottom: '1px solid #e5e7eb',
              marginLeft: 'calc(-50vw + 50%)',
              marginRight: 'calc(-50vw + 50%)',
              width: '100vw',
              maxWidth: '100vw',
              paddingLeft: 'max(1rem, calc((100vw - 80rem) / 2 + 1rem))',
              paddingRight: 'max(1rem, calc((100vw - 80rem) / 2 + 1rem))'
            } : {}}
          >
            <div className="flex flex-col gap-4 mb-4">
              {/* Filters and Controls - All aligned to left */}
              <div className="flex items-center gap-3 flex-wrap">
                {/* Only Available Filter - Always visible */}
                <label className="flex items-center gap-2 cursor-pointer group px-3 py-2 border border-gray-300 hover:border-gray-900 transition-all bg-white">
                  <input
                    type="checkbox"
                    checked={onlyAvailable}
                    onChange={(e) => setOnlyAvailable(e.target.checked)}
                    className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-black text-black cursor-pointer"
                  />
                  <span className="text-xs text-gray-900 group-hover:text-black transition-colors uppercase tracking-wider" style={{ fontFamily: 'SimonMono, "Courier New", Courier, monospace', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                    {t('common.onlyAvailable')}
                  </span>
                </label>
                
                <button
                  ref={filterButtonRef}
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-4 py-2 border transition-all ${
                    showFilters 
                      ? 'bg-black text-white border-black' 
                      : 'bg-white text-gray-900 border-gray-300 hover:border-gray-900'
                  }`}
                  style={{ fontFamily: 'SimonMono, "Courier New", Courier, monospace', fontSize: '0.75rem', letterSpacing: '0.05em' }}
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span className="uppercase tracking-wider">{t('common.filters')}</span>
                </button>

                <div className="flex items-center gap-1 border border-gray-300 p-0.5">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 transition-colors ${
                      viewMode === 'grid' 
                        ? 'bg-black text-white' 
                        : 'text-gray-400 hover:text-gray-900'
                    }`}
                    aria-label="Grid view"
                  >
                    <Grid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 transition-colors ${
                      viewMode === 'list' 
                        ? 'bg-black text-white' 
                        : 'text-gray-400 hover:text-gray-900'
                    }`}
                    aria-label="List view"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-black focus:border-black bg-white transition-all"
                  style={{ fontFamily: 'SimonMono, "Courier New", Courier, monospace', fontSize: '0.75rem' }}
                >
                  <option value="name">{t('common.sortByName')}</option>
                  <option value="price-low">{t('common.sortByPriceLow')}</option>
                  <option value="price-high">{t('common.sortByPriceHigh')}</option>
                  <option value="rating">{t('common.sortByRating')}</option>
                  <option value="newest">{t('common.sortByNewest')}</option>
                </select>

                {/* Products Per Row Selector */}
                {viewMode === 'grid' && (
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-600 uppercase tracking-wider" style={{ fontFamily: 'SimonMono, "Courier New", Courier, monospace' }}>
                      {t('common.perRow')}:
                    </label>
                    <select
                      value={productsPerRow}
                      onChange={(e) => setProductsPerRow(parseInt(e.target.value))}
                      className="px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-black focus:border-black bg-white"
                      style={{ fontFamily: 'SimonMono, "Courier New", Courier, monospace', fontSize: '0.75rem' }}
                    >
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                      <option value={3}>3</option>
                      <option value={4}>4</option>
                      <option value={5}>5</option>
                      <option value={6}>6</option>
                    </select>
                  </div>
                )}
              </div>
              
              {/* Active Filters Display */}
              {(selectedCategory !== 'all' || selectedMaterial !== 'all' || priceRange.min > 0 || priceRange.max < 10000 || searchQuery || onlyAvailable) && (
                <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-gray-200">
                  <span className="text-xs text-gray-500 uppercase tracking-wider" style={{ fontFamily: 'SimonMono, "Courier New", Courier, monospace' }}>
                    {t('common.active')}:
                  </span>
                  <button
                    onClick={() => {
                      setSelectedCategory('all')
                      setSelectedMaterial('all')
                      setPriceRange({ min: 0, max: 10000 })
                      setSearchQuery('')
                      setOnlyAvailable(false)
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-gray-200 text-gray-900 border border-gray-300 hover:bg-gray-300 transition-colors"
                    style={{ fontFamily: 'SimonMono, "Courier New", Courier, monospace' }}
                  >
                    {t('common.clearAll')}
                  </button>
                  {selectedCategory !== 'all' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-gray-100 text-gray-900 border border-gray-300" style={{ fontFamily: 'SimonMono, "Courier New", Courier, monospace' }}>
                      {(() => {
                        const categoryKey = selectedCategory.toLowerCase() as 'necklaces' | 'bracelets' | 'rings' | 'earrings'
                        return t(`common.${categoryKey}`) || selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)
                      })()}
                      <button
                        onClick={() => setSelectedCategory('all')}
                        className="hover:text-gray-600 transition-colors"
                        aria-label="Remove category filter"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {selectedMaterial !== 'all' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-gray-100 text-gray-900 border border-gray-300" style={{ fontFamily: 'SimonMono, "Courier New", Courier, monospace' }}>
                      {(() => {
                        const materialKey = selectedMaterial.toLowerCase() as 'silver' | 'gold' | 'platinum'
                        return t(`common.${materialKey}`) || selectedMaterial
                      })()}
                      <button
                        onClick={() => setSelectedMaterial('all')}
                        className="hover:text-gray-600 transition-colors"
                        aria-label="Remove material filter"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {(priceRange.min > 0 || priceRange.max < 10000) && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-gray-100 text-gray-900 border border-gray-300" style={{ fontFamily: 'SimonMono, "Courier New", Courier, monospace' }}>
                      {formatPrice(priceRange.min, 'CHF')} - {formatPrice(priceRange.max, 'CHF')}
                      <button
                        onClick={() => setPriceRange({ min: 0, max: 10000 })}
                        className="hover:text-gray-600 transition-colors"
                        aria-label="Remove price filter"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {searchQuery && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-gray-100 text-gray-900 border border-gray-300" style={{ fontFamily: 'SimonMono, "Courier New", Courier, monospace' }}>
                      "{searchQuery}"
                      <button
                        onClick={() => setSearchQuery('')}
                        className="hover:text-gray-600 transition-colors"
                        aria-label="Clear search"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {onlyAvailable && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-gray-100 text-gray-900 border border-gray-300" style={{ fontFamily: 'SimonMono, "Courier New", Courier, monospace' }}>
                      {t('common.onlyAvailable')}
                      <button
                        onClick={() => setOnlyAvailable(false)}
                        className="hover:text-gray-600 transition-colors"
                        aria-label="Remove availability filter"
                      >
                        ×
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div ref={filtersRef} className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Category Filter */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-900 mb-2 uppercase tracking-wider" style={{ fontFamily: 'SimonMono, "Courier New", Courier, monospace' }}>
                      {t('common.category')}
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 bg-white transition-all"
                      style={{ fontFamily: 'SimonMono, "Courier New", Courier, monospace', fontSize: '0.875rem' }}
                    >
                      {categories.map(category => {
                        const categoryKey = category.toLowerCase() as 'necklaces' | 'bracelets' | 'rings' | 'earrings'
                        return (
                          <option key={category} value={category}>
                            {category === 'all' ? t('common.allCategories') : t(`common.${categoryKey}`) || category.charAt(0).toUpperCase() + category.slice(1)}
                          </option>
                        )
                      })}
                    </select>
                  </div>

                  {/* Material Filter */}
                  {materials.length > 0 && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-900 mb-2 uppercase tracking-wider" style={{ fontFamily: 'SimonMono, "Courier New", Courier, monospace' }}>
                        {t('common.material')}
                      </label>
                      <select
                        value={selectedMaterial}
                        onChange={(e) => setSelectedMaterial(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 bg-white transition-all"
                        style={{ fontFamily: 'SimonMono, "Courier New", Courier, monospace', fontSize: '0.875rem' }}
                      >
                        <option value="all">{t('common.allMaterials')}</option>
                        {materials.map(material => {
                          const materialKey = material.toLowerCase() as 'silver' | 'gold' | 'platinum'
                          return (
                            <option key={material} value={material}>
                              {t(`common.${materialKey}`) || material}
                            </option>
                          )
                        })}
                      </select>
                    </div>
                  )}

                  {/* Price Range */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-900 mb-2 uppercase tracking-wider" style={{ fontFamily: 'SimonMono, "Courier New", Courier, monospace' }}>
                      {t('common.priceRange')}
                    </label>
                    {/* Range Slider */}
                    <div className="mb-3">
                      <div className="relative h-2">
                        {/* Background track */}
                        <div className="absolute w-full h-2 bg-gray-200 rounded-lg" />
                        {/* Active range track */}
                        <div 
                          className="absolute h-2 bg-black rounded-lg"
                          style={{
                            left: `${(priceRange.min / 10000) * 100}%`,
                            width: `${((priceRange.max - priceRange.min) / 10000) * 100}%`
                          }}
                        />
                        {/* Min slider */}
                        <input
                          type="range"
                          min="0"
                          max="10000"
                          step="100"
                          value={priceRange.min}
                          onChange={(e) => {
                            const newMin = parseInt(e.target.value)
                            setPriceRange({...priceRange, min: Math.min(newMin, priceRange.max)})
                          }}
                          className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer"
                          style={{
                            zIndex: priceRange.min > priceRange.max - 200 ? 20 : 10,
                            pointerEvents: 'auto',
                            WebkitAppearance: 'none',
                            appearance: 'none'
                          }}
                        />
                        {/* Max slider */}
                        <input
                          type="range"
                          min="0"
                          max="10000"
                          step="100"
                          value={priceRange.max}
                          onChange={(e) => {
                            const newMax = parseInt(e.target.value)
                            setPriceRange({...priceRange, max: Math.max(newMax, priceRange.min)})
                          }}
                          className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer"
                          style={{
                            zIndex: 10,
                            pointerEvents: 'auto',
                            WebkitAppearance: 'none',
                            appearance: 'none'
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{formatPrice(0, 'CHF')}</span>
                        <span>{formatPrice(10000, 'CHF')}</span>
                      </div>
                    </div>
                    {/* Input Fields */}
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={priceRange.min}
                        onChange={(e) => setPriceRange({...priceRange, min: Math.max(0, Math.min(parseInt(e.target.value) || 0, priceRange.max))})}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all"
                        style={{ fontFamily: 'SimonMono, "Courier New", Courier, monospace', fontSize: '0.875rem' }}
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        value={priceRange.max}
                        onChange={(e) => setPriceRange({...priceRange, max: Math.min(10000, Math.max(parseInt(e.target.value) || 10000, priceRange.min))})}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all"
                        style={{ fontFamily: 'SimonMono, "Courier New", Courier, monospace', fontSize: '0.875rem' }}
                      />
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>

          {/* Products Grid */}
          <ul 
            className={`grid list-none border-t border-gray-300 grid-flow-row-dense *:border-b *:border-r *:border-gray-300 ${
              viewMode === 'grid' 
                ? `grid-cols-1 md:grid-cols-${Math.min(productsPerRow, 2)} lg:grid-cols-${productsPerRow} xl:grid-cols-${productsPerRow}` 
                : 'grid-cols-1'
            }`}
            style={viewMode === 'grid' ? {
              gridTemplateColumns: `repeat(${productsPerRow}, minmax(0, 1fr))`
            } : undefined}
          >
            {sortedProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </ul>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* No Results */}
          {!loading && sortedProducts.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Search className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {error ? 'Failed to load products' : 'No products found'}
              </h3>
              <p className="text-gray-600">
                {error 
                  ? 'Please try refreshing the page or contact support if the issue persists.'
                  : products.length === 0
                    ? 'No products are available at the moment. Please check back later.'
                    : 'Try adjusting your search or filter criteria'}
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer backgroundImage={footerBackground} />
    </div>
  )
}
