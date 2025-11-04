'use client'

import { useState, useEffect } from 'react'
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

export default function ProductsPage() {
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const { user } = useAuth()
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 })
  const [showFilters, setShowFilters] = useState(false)
  const [addingToCart, setAddingToCart] = useState<string | null>(null)
  const [stockUpdates, setStockUpdates] = useState<Record<string, number>>({})
  const [productsPerRow, setProductsPerRow] = useState(2) // Default x2

  const { getBackgroundUrlForSection } = useBackgroundImages()
  const { formatPrice } = useCurrency()
  const { addToCart, cart } = useCart()
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

  // Extract unique categories from products
  const categories = ['all', ...Array.from(new Set(products.flatMap(p => p.categories || [])))]
  
  const featuredParam = searchParams.get('featured')
  
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (product.tags || []).some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         product.sku.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || 
                          (product.categories || []).includes(selectedCategory)
    const matchesFeatured = featuredParam !== 'true' || product.showInFeatured === true
    const productPrice = product.displayPrice || product.price
    const matchesPrice = productPrice >= priceRange.min && productPrice <= priceRange.max
    return matchesSearch && matchesCategory && matchesFeatured && matchesPrice
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
                  <div className="absolute top-0 left-0 w-full h-full flex md:grid relative">
                    {/* Primary Image */}
                    {primaryImage && (
                      <div 
                        className={`relative overflow-hidden z-[1] flex-shrink-0 snap-start mx-px md:mx-0 w-full h-full object-cover ${secondaryImage ? 'transition-opacity duration-500 ease-in-out group-hover/product-card:opacity-0' : ''}`}
                        data-testid="product-card-primary-image"
                        style={{ backgroundColor: '#f8f8f8' }}
                      >
                        <img 
                          alt={primaryImage.altText || product.name} 
                          decoding="async" 
                          loading="eager" 
                          sizes="(min-width: 1024px) 25vw, 50vw" 
                          src={primaryImage.url}
                          className="relative object-cover z-[1] h-full w-full" 
                          fetchPriority="high"
                          style={{ width: '100%' }}
                        />
                      </div>
                    )}
                    
                    {/* Secondary/Hover Image */}
                    {secondaryImage && (
                      <div 
                        className="absolute inset-0 overflow-hidden z-[2] flex-shrink-0 snap-start mx-px md:mx-0 w-full h-full object-cover opacity-0 transition-opacity duration-500 ease-in-out group-hover/product-card:opacity-100" 
                        data-testid="product-card-secondary-image"
                      >
                        <img 
                          alt={secondaryImage.altText || `${product.name} - Hover`} 
                          decoding="async" 
                          loading="lazy" 
                          sizes="(min-width: 1024px) 25vw, 50vw" 
                          src={secondaryImage.url}
                          className="relative object-cover z-[1] h-full w-full"
                          style={{ width: '100%' }}
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
                      OUT OF STOCK
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
                          {availableQty} {availableQty === 1 ? 'item' : 'items'} available
                        </div>
                      )}
                      {(!inStock || availableQty === 0) && (
                        <div className="text-xs font-medium" style={{ fontFamily: 'SimonMono, "Courier New", Courier, monospace', fontWeight: 400, color: 'rgba(121,120,108,var(--tw-text-opacity, 1))' }}>
                          Request when available
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
                          + ADD
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
                          REQUEST
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
              <div className="flex items-center gap-xxs md:gap-xs" style={{ fontFamily: 'SimonMono, "Courier New", Courier, monospace', fontWeight: 400, color: 'rgba(121,120,108,var(--tw-text-opacity, 1))' }}>
                <div className="flex flex-shrink-0 type-utility-2 !text-xxs md:!text-xs !font-normal type-body-2 items-end">
                  <div className="flex flex-wrap gap-x-xs">
                    <div className="flex gap-xxs md:gap-xs">
                      {hasSpecialOffer && product.specialOfferPrice ? (
                        <>
                          <span className="text-red-600" style={{ fontFamily: 'SimonMono, "Courier New", Courier, monospace', fontWeight: 900, textRendering: 'optimizeLegibility', WebkitFontSmoothing: 'antialiased', color: '#000000' }}>{formatPrice(product.specialOfferPrice, product.baseCurrency)}</span>
                          <span className="line-through text-gray-400" style={{ fontFamily: 'SimonMono, "Courier New", Courier, monospace', fontWeight: 900, textRendering: 'optimizeLegibility', WebkitFontSmoothing: 'antialiased' }}>{formatPrice(productPrice, product.baseCurrency)}</span>
                        </>
                      ) : (
                        <span style={{ fontFamily: 'SimonMono, "Courier New", Courier, monospace', fontWeight: 900, textRendering: 'optimizeLegibility', WebkitFontSmoothing: 'antialiased', color: '#000000' }}>{formatPrice(displayPrice, product.baseCurrency)}</span>
                      )}
                    </div>
                  </div>
                </div>
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
        <main className="py-12">
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
      
      <main className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Search and Filters - Improved */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all"
                  style={{ fontFamily: 'SimonMono, "Courier New", Courier, monospace' }}
                />
              </div>

              {/* Filters and Controls */}
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-4 py-2.5 border rounded-md transition-colors ${
                    showFilters 
                      ? 'bg-gray-100 border-gray-400 text-gray-900' 
                      : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                  }`}
                  style={{ fontFamily: 'SimonMono, "Courier New", Courier, monospace' }}
                >
                  <Filter className="w-4 h-4" />
                  <span>Filters</span>
                </button>

                <div className="flex items-center gap-1 border border-gray-300 rounded-md p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded transition-colors ${
                      viewMode === 'grid' 
                        ? 'bg-gray-900 text-white' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                    aria-label="Grid view"
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded transition-colors ${
                      viewMode === 'list' 
                        ? 'bg-gray-900 text-white' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                    aria-label="List view"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white transition-all"
                  style={{ fontFamily: 'SimonMono, "Courier New", Courier, monospace' }}
                >
                  <option value="name">Sort by Name</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                  <option value="newest">Newest First</option>
                </select>

                {/* Products Per Row Selector */}
                {viewMode === 'grid' && (
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600" style={{ fontFamily: 'SimonMono, "Courier New", Courier, monospace' }}>
                      Per Row:
                    </label>
                    <select
                      value={productsPerRow}
                      onChange={(e) => setProductsPerRow(parseInt(e.target.value))}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white text-sm"
                      style={{ fontFamily: 'SimonMono, "Courier New", Courier, monospace' }}
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
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Category Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>
                          {category === 'all' ? 'All Categories' : category}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Price Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={priceRange.min}
                        onChange={(e) => setPriceRange({...priceRange, min: parseInt(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        value={priceRange.max}
                        onChange={(e) => setPriceRange({...priceRange, max: parseInt(e.target.value) || 10000})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  {/* Results Count */}
                  <div className="flex items-end">
                    <p className="text-sm text-gray-600">
                      Showing {sortedProducts.length} of {products.length} products
                    </p>
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
