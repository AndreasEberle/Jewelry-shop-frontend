'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { useBackgroundImages } from '@/hooks/useBackgroundImages'
import { useCurrency } from '@/contexts/CurrencyContext'
import { useCart } from '@/contexts/CartContext'
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
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 })
  const [showFilters, setShowFilters] = useState(false)
  const [addingToCart, setAddingToCart] = useState<string | null>(null)
  const [stockUpdates, setStockUpdates] = useState<Record<string, number>>({})

  const { getBackgroundUrlForSection } = useBackgroundImages()
  const { formatPrice } = useCurrency()
  const { addToCart } = useCart()
  const navigationBackground = getBackgroundUrlForSection('navigation')
  const footerBackground = getBackgroundUrlForSection('footer')

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
    // Calculate available quantity with proper fallback logic:
    // 1. Use stockUpdates if it exists AND is a positive number (real-time availability)
    // 2. Otherwise, fall back to product.availableQuantity or product.quantity
    // This ensures we don't show out of stock if stockUpdates returns 0 but product.quantity > 0
    const stockUpdateValue = stockUpdates[product.id]
    const hasValidStockUpdate = stockUpdateValue !== undefined && stockUpdateValue !== null && stockUpdateValue > 0
    
    const availableQty = hasValidStockUpdate
      ? stockUpdateValue
      : (product.availableQuantity !== undefined && product.availableQuantity !== null && product.availableQuantity > 0
          ? product.availableQuantity 
          : (product.quantity !== undefined && product.quantity !== null ? product.quantity : 0))
    
    // Debug: Log stock information for products with quantity
    console.log(`Product ${product.name}: quantity=${product.quantity}, availableQuantity=${product.availableQuantity}, stockUpdates[${product.id}]=${stockUpdates[product.id]}, calculated availableQty=${availableQty}, active=${product.active}`)
    
    // Fix: Check quantity first, then active status - if quantity > 0, it should be in stock regardless of active status
    // (active status might be a separate concern)
    const inStock = availableQty > 0
    const wasOutOfStock = availableQty === 0
    
    // Get primary image or first image with a valid URL
    const primaryImage = product.images?.find(img => img.isPrimary && img.url) 
      || product.images?.find(img => img.url) 
      || null
    
    // Get secondary/hover image (first non-primary image, or second image if available)
    const secondaryImage = product.images?.filter(img => !img.isPrimary && img.url)?.[0]
      || (product.images?.length > 1 && product.images[1]?.url ? product.images[1] : null)
    
    const productPrice = product.displayPrice || product.price
    const hasSpecialOffer = !!(product.specialOffer && product.specialOfferPrice && product.specialOfferPrice < productPrice)
    const displayPrice = hasSpecialOffer && product.specialOfferPrice ? product.specialOfferPrice : productPrice
    
    const productSlug = product.slug || product.sku
    const productUrl = `/products/${productSlug}${product.material ? `?Material=${encodeURIComponent(product.material)}` : ''}`
    
    // Get material color for variant selector
    const getMaterialColor = (material: string) => {
      if (material?.toLowerCase().includes('yellow gold') || material?.toLowerCase().includes('14k yellow')) {
        return '#E9D590'
      } else if (material?.toLowerCase().includes('white gold') || material?.toLowerCase().includes('14k white')) {
        return '#d1d1d1'
      }
      return '#C0C0C0'
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
                  className="group/product-card-images bg-utility-loading md:grid flex flex-nowrap overflow-hidden overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar relative w-full pb-[118.9%] z-base h-full" 
                  data-testid="product-card-images"
                >
                  <div className="absolute top-0 left-0 w-full h-full flex md:grid">
                    {/* Primary Image */}
                    {primaryImage && (
                      <div 
                        className="relative overflow-hidden z-base flex-shrink-0 snap-start mx-px md:mx-0 md:col-start-1 md:row-start-1 w-full h-full object-cover" 
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
                        className="relative overflow-hidden z-base flex-shrink-0 snap-start mx-px md:mx-0 md:col-start-1 md:row-start-1 w-full h-full object-cover md:opacity-0 md:blur-[2px] md:transition-[opacity,filter] md:duration-300 md:ease-ease md:group-hover/product-card-images:opacity-100 md:group-hover/product-card-images:blur-0" 
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
                  <div className="absolute flex justify-start flex-wrap gap-1 max-w-[calc(100%-2rem)] right-0 top-0 bg-background-xlight px-xs py-xxs">
                    <div 
                      style={{ backgroundColor: 'transparent', color: '#79786C' }} 
                      className="bg-content-inv text-content p-xxs md:px-xs md:py-xxs type-caption flex justify-between items-center !p-0 text-nowrap type-utility-2 uppercase font-normal !text-xxs md:!text-xs"
                    >
                      Back in Stock
                    </div>
                  </div>
                )}
                {!inStock && (
                  <div className="absolute flex justify-start flex-wrap gap-1 max-w-[calc(100%-2rem)] right-0 top-0 bg-background-xlight px-xs py-xxs">
                    <div 
                      style={{ backgroundColor: 'transparent', color: '#79786C' }} 
                      className="bg-content-inv text-content p-xxs md:px-xs md:py-xxs type-caption flex justify-between items-center !p-0 text-nowrap type-utility-2 uppercase font-normal !text-xxs md:!text-xs"
                    >
                      Out of Stock
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
              
              {/* Quick Add/Request Button - Outside Link to prevent click interference */}
              {inStock ? (
                <button 
                  className="pointer-events-auto text-center outline-none hover:border-utility-hover disabled:text-utility-disabled focus-visible:ring-2 ring-utility-focus ring-offset-2 ease-ease border-none capitalize p-0 tracking-utility absolute bottom-sm right-1/2 translate-x-1/2 md:bottom-sm md:group-hover/product-card:opacity-100 transition-[opacity,colors] duration-300 ease-in-out border border-content-xlight text-content hover:text-content-mid focus:text-content-mid focus:opacity-100 z-[20] mt-0 flex justify-center items-center gap-xxs bg-background-xlight px-xs py-[2px]" 
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
                    <p className="type-utility-2 !text-xxs md:!text-xs font-normal uppercase text-content-mid" aria-label={`${product.name} Add`}>
                      Add
                    </p>
                    <svg className="w-xs h-xs" xmlns="http://www.w3.org/2000/svg" role="graphics-symbol" viewBox="0 0 10 11" fill="none" strokeLinecap="round" stroke="#79786C" strokeWidth="1">
                      <title>Plus</title>
                      <path d="M5 0.399902V10.3999" />
                      <path d="M0 5.3999L10 5.3999" />
                    </svg>
                  </span>
                </button>
              ) : (
                <button 
                  className="pointer-events-auto text-center outline-none hover:border-utility-hover focus-visible:ring-2 ring-utility-focus ring-offset-2 ease-ease border-none capitalize p-0 tracking-utility absolute bottom-sm right-1/2 translate-x-1/2 md:bottom-sm md:group-hover/product-card:opacity-100 transition-[opacity,colors] duration-300 ease-in-out border border-content-xlight text-content hover:text-content-mid focus:text-content-mid focus:opacity-100 z-[20] mt-0 flex justify-center items-center gap-xxs bg-gray-600 px-xs py-[2px]" 
                  data-title="Request Product" 
                  data-testid="product-card-request-button" 
                  role="button" 
                  aria-label="request when available" 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    alert('This item is currently out of stock. We can notify you when it\'s back in stock. Please contact us or check back later.')
                  }}
                  style={{ pointerEvents: 'auto' }}
                >
                  <span className="flex justify-center items-center gap-xxs preserve-line-height">
                    <p className="type-utility-2 !text-xxs md:!text-xs font-normal uppercase text-white" aria-label={`${product.name} Request`}>
                      Request
                    </p>
                  </span>
                </button>
              )}
            </div>
            
            {/* Product Info Under Images - Special Offers & Quantity */}
            <div className="px-xs py-sm bg-white border-b border-gray-200">
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
              
              {/* Available Quantity */}
              {inStock && (
                <div className="text-xs text-gray-600">
                  {availableQty > 0 && (
                    <span>
                      {availableQty} {availableQty === 1 ? 'item' : 'items'} available
                    </span>
                  )}
                </div>
              )}
              {!inStock && (
                <div className="text-xs text-red-600 font-medium">
                  Out of Stock
                </div>
              )}
            </div>
            
            {/* Product Card Content */}
            <div className="flex flex-col px-xs py-sm gap-xxs h-full bg-[#F8F8F8]" data-testid="product-card-content">
              {/* Product Name */}
              <div className="flex gap-sm items-center text-nowrap overflow-hidden">
                <p className="type-utility-2 leading-normal flex-1 min-w-0 text-content-mid !text-xxs md:!text-xs">
                  <Link
                    className="pointer-events-auto transition-[color] ease-ease duration-300 focus-visible:ring-1 ring-utility-focus ring-offset-4 outline-none hover:text-utility-hover leading-normal block truncate uppercase font-normal" 
                    data-testid="internal-link" 
                    href={productUrl}
                    aria-label={product.name}
                  >
                    {product.name}
                  </Link>
                </p>
              </div>
              
              {/* Price */}
              <div className="flex items-center gap-xxs md:gap-xs">
                <div className="flex flex-shrink-0 type-utility-2 !text-xxs md:!text-xs !font-normal type-body-2 font-bold items-end">
                  <div className="flex flex-wrap gap-x-xs">
                    <div className="flex gap-xxs md:gap-xs">
                      {hasSpecialOffer && product.specialOfferPrice ? (
                        <>
                          <span className="text-red-600">{formatPrice(product.specialOfferPrice, product.baseCurrency)}</span>
                          <span className="line-through text-gray-400">{formatPrice(productPrice, product.baseCurrency)}</span>
                        </>
                      ) : (
                        <span>{formatPrice(displayPrice, product.baseCurrency)}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Variant Selector */}
              {product.material && (
                <div data-testid="product-card-variant-selector">
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
                        className="!text-xxs md:!text-xs block truncate text-content-mid"
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
          {/* Search and Filters - Simplified */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Filters */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <Filter className="w-4 h-4" />
                  <span>Filters</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-gray-400'}`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-400'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="name">Sort by Name</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                  <option value="newest">Newest First</option>
                </select>
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
          <ul className="grid grid-cols-2 lg:grid-cols-2 list-none border-t border-gray-300 grid-flow-row-dense *:border-b *:border-r *:border-gray-300">
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
