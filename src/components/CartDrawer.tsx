'use client'

import { useState, useEffect } from 'react'
import { X, Heart, Plus, Minus, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { favoriteService } from '@/services/favoriteService'
import { productService } from '@/services/productService'
import { useCurrency } from '@/contexts/CurrencyContext'
import { useFreeShippingConfig } from '@/hooks/useFreeShippingConfig'
import { useCartAlertConfig } from '@/hooks/useCartAlertConfig'
import { useTranslation } from '@/hooks/useTranslation'
import Link from 'next/link'
import Image from 'next/image'

interface CartDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const [activeTab, setActiveTab] = useState<'bag' | 'wishlist'>('bag')
  const { cart, updateQuantity, removeFromCart, addToCart } = useCart()
  const { isAuthenticated } = useAuth()
  const { formatPrice } = useCurrency()
  const { config: freeShippingConfig } = useFreeShippingConfig()
  const { config: cartAlertConfig } = useCartAlertConfig()
  const { t } = useTranslation()
  const [wishlistItems, setWishlistItems] = useState<any[]>([])
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())
  const [loadingWishlist, setLoadingWishlist] = useState(false)
  const [youMayAlsoLike, setYouMayAlsoLike] = useState<any[]>([])
  const [youMayAlsoLikeIndex, setYouMayAlsoLikeIndex] = useState(0)
  const [removingItems, setRemovingItems] = useState<Set<string>>(new Set())
  const [productAvailability, setProductAvailability] = useState<Record<string, number>>({})

  const FREE_SHIPPING_THRESHOLD = freeShippingConfig.threshold || 150
  const currentTotal = cart?.total || 0
  const amountNeeded = Math.max(0, FREE_SHIPPING_THRESHOLD - currentTotal)
  const progressPercentage = FREE_SHIPPING_THRESHOLD > 0 ? Math.min(100, (currentTotal / FREE_SHIPPING_THRESHOLD) * 100) : 0

  // Load favorite IDs to check if cart items are favorited
  useEffect(() => {
    if (isAuthenticated && isOpen && cart && cart.items.length > 0) {
      // Load favorite IDs to check if cart items are favorited
      favoriteService.getFavoriteIds()
        .then(ids => {
          setFavoriteIds(new Set(ids))
        })
        .catch(error => {
          console.error('Error loading favorite IDs:', error)
          setFavoriteIds(new Set())
        })
    } else {
      setFavoriteIds(new Set())
    }
  }, [isAuthenticated, isOpen, cart?.items.length])

  // Load wishlist count on mount and when authenticated/changes
  useEffect(() => {
    if (isAuthenticated && isOpen) {
      // Always load wishlist count, regardless of active tab
      favoriteService.getFavorites()
        .then(favorites => {
          setWishlistItems(Array.isArray(favorites) ? favorites : [])
        })
        .catch(error => {
          console.error('Error loading wishlist count:', error)
          setWishlistItems([])
        })
    } else {
      setWishlistItems([])
    }
  }, [isAuthenticated, isOpen])

  // Load wishlist details when tab is active
  useEffect(() => {
    if (activeTab === 'wishlist' && isAuthenticated && isOpen) {
      loadWishlist()
    }
  }, [activeTab, isAuthenticated, isOpen])

  // Load "You May Also Like" products
  useEffect(() => {
    if (isOpen && cart && cart.items.length > 0) {
      loadYouMayAlsoLike()
    }
  }, [isOpen, cart])

  // Load product availability for cart items
  useEffect(() => {
    if (isOpen && cart && cart.items.length > 0) {
      const loadAvailability = async () => {
        try {
          const productIds = cart.items.map(item => item.product.id)
          const availability = await productService.getMultipleProductAvailability(productIds)
          setProductAvailability(availability)
        } catch (error) {
          console.error('Failed to load product availability:', error)
        }
      }
      loadAvailability()
      // Refresh every 5 seconds
      const interval = setInterval(loadAvailability, 5000)
      return () => clearInterval(interval)
    }
  }, [isOpen, cart])

  // Reset index when products change
  useEffect(() => {
    setYouMayAlsoLikeIndex(0)
  }, [youMayAlsoLike.length])

  const handlePrevProduct = () => {
    setYouMayAlsoLikeIndex((prev) => (prev > 0 ? prev - 1 : youMayAlsoLike.length - 1))
  }

  const handleNextProduct = () => {
    setYouMayAlsoLikeIndex((prev) => (prev < youMayAlsoLike.length - 1 ? prev + 1 : 0))
  }

  const currentProduct = youMayAlsoLike[youMayAlsoLikeIndex]

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      // Save current scroll position and disable body scroll
      const scrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
      document.body.style.overflow = 'hidden'
      
      return () => {
        // Restore scroll when drawer closes
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.width = ''
        document.body.style.overflow = ''
        window.scrollTo(0, scrollY)
      }
    }
  }, [isOpen])

  const loadWishlist = async () => {
    try {
      setLoadingWishlist(true)
      const favorites = await favoriteService.getFavorites()
      setWishlistItems(Array.isArray(favorites) ? favorites : [])
    } catch (error) {
      console.error('Error loading wishlist:', error)
      setWishlistItems([])
    } finally {
      setLoadingWishlist(false)
    }
  }

  const loadYouMayAlsoLike = async () => {
    try {
      const products = await productService.getProducts({ limit: 30 }) // Fetch more to ensure we have enough after filtering
      // Filter out products that are already in the cart
      const cartProductIds = cart?.items.map(item => item.product.id) || []
      let filteredProducts = products.filter(product => !cartProductIds.includes(product.id))
      
      // Filter to only show products with available quantity
      filteredProducts = filteredProducts.filter(product => {
        const quantity = product.quantity || 0
        const availableQuantity = product.availableQuantity !== undefined && product.availableQuantity !== null 
          ? product.availableQuantity 
          : quantity
        return availableQuantity > 0
      })
      
      // Limit to 5 after filtering
      setYouMayAlsoLike(filteredProducts.slice(0, 5))
    } catch (error) {
      console.error('Error loading recommended products:', error)
    }
  }
  
  // Filter "You May Also Like" when cart changes
  useEffect(() => {
    if (youMayAlsoLike.length > 0 && cart && cart.items.length > 0) {
      const cartProductIds = cart.items.map(item => item.product.id)
      const filtered = youMayAlsoLike.filter(product => !cartProductIds.includes(product.id))
      if (filtered.length < youMayAlsoLike.length) {
        setYouMayAlsoLike(filtered)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart?.items.length])

  const handleRemoveFromWishlist = async (productId: string) => {
    try {
      await favoriteService.removeFromFavorites(productId)
      setWishlistItems(wishlistItems.filter(item => item.id !== productId))
      // Dispatch event to update header favorite count
      window.dispatchEvent(new Event('favoriteChanged'))
    } catch (error) {
      console.error('Error removing from wishlist:', error)
    }
  }

  const handleAddFromWishlist = async (product: any) => {
    try {
      // Check availability before adding to cart
      const availability = await productService.getProductAvailability(product.id)
      
      if (availability <= 0) {
        alert('This item is currently out of stock and cannot be added to your cart.')
        return
      }
      
      // Add to cart
      await addToCart(product, 1)
      
      // Remove from wishlist
      await favoriteService.removeFromFavorites(product.id)
      setWishlistItems(wishlistItems.filter(item => item.id !== product.id))
      setFavoriteIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(product.id)
        return newSet
      })
      
      // Dispatch event to update header favorite count
      window.dispatchEvent(new Event('favoriteChanged'))
      window.dispatchEvent(new CustomEvent('productUnfavorited', { detail: { productId: product.id } }))
    } catch (error: any) {
      console.error('Error adding to cart:', error)
      const errorMsg = error.response?.data?.message || error.message || 'Failed to add item to cart'
      if (errorMsg.includes('stock') || errorMsg.includes('available')) {
        alert('This item is no longer available in the requested quantity.')
      } else {
        alert('Failed to add item to cart. Please try again.')
      }
    }
  }

  const handleAddRecommended = async (product: any) => {
    try {
      await addToCart(product, 1)
      // Immediately filter out the added product from "You May Also Like"
      setYouMayAlsoLike(prev => prev.filter(p => p.id !== product.id))
    } catch (error) {
      console.error('Error adding to cart:', error)
    }
  }

  const bagItemCount = cart?.itemCount || 0
  const wishlistCount = wishlistItems.length

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black z-50 transition-opacity duration-500 ease-in-out ${
          isOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div 
        className={`fixed right-0 top-0 h-full w-full max-w-lg bg-white z-50 flex flex-col shadow-xl transition-transform duration-500 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="h-[55px] flex items-center justify-end px-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded"
            aria-label="Close cart"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <ul className="flex border-b border-black" role="tablist">
          <li className={`flex-1 text-center pb-3 ${activeTab === 'bag' ? 'border-b-2 border-black' : ''}`}>
            <button
              role="tab"
              aria-selected={activeTab === 'bag'}
              aria-controls="bag-panel"
              id="bag-tab"
              onClick={() => setActiveTab('bag')}
              className="w-full"
            >
              <p className={`type-utility-1 text-content ${activeTab === 'bag' ? 'font-bold' : 'font-medium'} uppercase`}>{t('cart.bag')} ({bagItemCount})</p>
            </button>
          </li>
          <li className={`flex-1 text-center pb-3 ${activeTab === 'wishlist' ? 'border-b-2 border-black' : ''}`}>
            <button
              role="tab"
              aria-selected={activeTab === 'wishlist'}
              aria-controls="wishlist-panel"
              id="wishlist-tab"
              onClick={() => setActiveTab('wishlist')}
              className="w-full"
            >
              <p className={`type-utility-1 text-content ${activeTab === 'wishlist' ? 'font-bold' : 'font-medium'} uppercase`}>{t('cart.wishlist')} ({wishlistCount})</p>
            </button>
          </li>
        </ul>


        {/* Content */}
        <div className="flex-1 overflow-auto bg-white">
          {activeTab === 'bag' && (
            <div id="bag-panel" role="tabpanel" aria-labelledby="bag-tab" className="h-full flex flex-col">
              {!cart || cart.items.length === 0 ? (
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="text-center">
                    <p className="type-body-2 text-content mb-4">{t('cart.empty')}</p>
                    <Link
                      href="/products"
                      onClick={onClose}
                      className="inline-block px-6 py-3 bg-black text-white hover:bg-gray-800 transition-colors"
                    >
                      {t('cart.startShopping')}
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  {/* Free Shipping Progress Bar - FIRST element in bag panel */}
                  {activeTab === 'bag' && freeShippingConfig.enabled && (
                    <div className="py-xs px-md md:px-lg font-bold bg-black text-white">
                      {amountNeeded > 0 ? (
                        <p className="type-body-3 text-white">
                          You are {formatPrice(amountNeeded)} away from free shipping
                        </p>
                      ) : (
                        <p className="type-body-3 text-white">
                          Enjoy free expedited shipping!
                        </p>
                      )}
                      <div className="w-full h-xxs rounded-full relative mt-xs">
                        <div
                          className="h-full rounded-full bg-white"
                          style={{ width: `${Math.min(100, progressPercentage)}%` }}
                        />
                        <div className="h-full w-full rounded-full absolute top-0 left-0 bg-white" style={{ opacity: 0.2 }} />
                      </div>
                    </div>
                  )}

                  <ul className="flex flex-col px-4 md:px-6">
                    {cart.items.map((item) => {
                      // Find primary image or fallback to first image
                      const primaryImage = item.product.images?.find(img => img.isPrimary) || item.product.images?.[0] || null
                      const hasSpecialOffer = item.product.specialOfferPrice && item.product.specialOfferPrice < item.product.price
                      const displayPrice = hasSpecialOffer ? item.product.specialOfferPrice! : item.product.price
                      // Check if product is in wishlist using favorite IDs
                      const isInWishlist = favoriteIds.has(item.product.id)

                      const isRemoving = removingItems.has(item.product.id)
                      
                      return (
                        <li
                          key={item.product.id}
                          className={`pb-4 border-b border-gray-200 pt-4 grid gap-2 md:gap-4 grid-cols-[140px_1fr_100px] transition-all duration-700 ease-in-out ${
                            isRemoving ? 'opacity-0 scale-95 -translate-x-4' : 'opacity-100 scale-100 translate-x-0'
                          }`}
                          data-testid="cart-line-item"
                        >
                          {/* Image */}
                          <div className="w-full aspect-square relative overflow-hidden">
                            <Link href={`/products/${item.product.slug || item.product.sku}`} onClick={onClose} className="block w-full h-full">
                              {primaryImage?.url ? (
                                <Image
                                  src={primaryImage.url}
                                  alt={primaryImage.altText || item.product.name}
                                  width={140}
                                  height={140}
                                  className="w-full h-full object-contain"
                                  sizes="140px"
                                  unoptimized
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                  <span className="text-gray-400 text-xs">No Image</span>
                                </div>
                              )}
                            </Link>
                          </div>

                          {/* Product Info */}
                          <div className="flex flex-col justify-between min-w-0 text-[0.875rem]">
                            <div className="flex flex-col justify-start h-full">
                              <Link
                                href={`/products/${item.product.slug || item.product.sku}`}
                                onClick={onClose}
                                className="pointer-events-auto transition-colors duration-300 hover:text-gray-600"
                              >
                                <span className="type-heading-6 text-content font-bold">{item.product.name}</span>
                              </Link>
                              <div className="text-[0.750rem] space-y-0.5 mt-1" style={{ fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400 }}>
                                {item.product.material && (
                                  <p className="text-content">
                                    {item.product.material}
                                  </p>
                                )}
                                {item.product.ringSize && (
                                  <p className="text-content">
                                    {t('product.size')}: {item.product.ringSize}
                                  </p>
                                )}
                                {item.product.chainLength && (
                                  <p className="text-content">
                                    {t('product.length')}: {item.product.chainLength}
                                    </p>
                                )}
                                <p className="text-content">
                                    {t('cart.inStock')}
                                  </p>
                              </div>
                            </div>

                            {/* Quantity Selector */}
                            <div className="flex justify-between gap-2 items-center mt-2">
                              <div className="border border-gray-300 rounded flex items-center justify-between w-[100px] h-[36px] text-sm bg-white">
                                <button
                                  onClick={async () => {
                                    const itemId = item.id || item.product.id
                                    if (item.quantity <= 1) {
                                      // Remove item if quantity would be 0
                                      setRemovingItems(prev => new Set(prev).add(item.product.id))
                                      setTimeout(async () => {
                                        await removeFromCart(itemId)
                                        setRemovingItems(prev => {
                                          const newSet = new Set(prev)
                                          newSet.delete(item.product.id)
                                          return newSet
                                        })
                                      }, 700)
                                    } else {
                                      updateQuantity(itemId, item.quantity - 1)
                                    }
                                  }}
                                  className="px-2 h-full flex items-center justify-center hover:bg-gray-100 rounded-l"
                                >
                                  —
                                </button>
                                <span className="flex-1 text-center font-medium text-gray-900 min-w-[30px]" style={{ fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400 }}>
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => {
                                    const itemId = item.id || item.product.id
                                    updateQuantity(itemId, item.quantity + 1)
                                  }}
                                  disabled={(() => {
                                    // Get available quantity for this product
                                    // productAvailability excludes our cart reservations, so it shows what's available to others
                                    // To know what we can add, we need: availableQty (what's left excluding our cart) + item.quantity (what we have) = total available
                                    // Then we can add up to: total available - item.quantity = availableQty
                                    const availableQty = productAvailability[item.product.id] ?? 
                                      (item.product.availableQuantity !== undefined && item.product.availableQuantity !== null && item.product.availableQuantity > 0
                                        ? item.product.availableQuantity 
                                        : (item.product.quantity !== undefined && item.product.quantity !== null ? item.product.quantity : 0))
                                    // availableQty excludes our cart, so if we have item.quantity and availableQty is what's left,
                                    // we can add up to availableQty more (total would be item.quantity + availableQty)
                                    // Disable if we can't add any more (availableQty is 0 or less)
                                    return availableQty <= 0
                                  })()}
                                  className={`px-2 h-full flex items-center justify-center rounded-r ${
                                    (() => {
                                      // productAvailability excludes our cart reservations
                                      const availableQty = productAvailability[item.product.id] ?? 
                                        (item.product.availableQuantity !== undefined && item.product.availableQuantity !== null && item.product.availableQuantity > 0
                                          ? item.product.availableQuantity 
                                          : (item.product.quantity !== undefined && item.product.quantity !== null ? item.product.quantity : 0))
                                      // availableQty is what's left excluding our cart, so disable if we can't add any more
                                      return availableQty <= 0
                                    })()
                                      ? 'opacity-50 cursor-not-allowed text-gray-400'
                                      : 'hover:bg-gray-100 text-gray-900'
                                  }`}
                                >
                                  ＋
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Price & Actions */}
                          <div className="flex flex-col justify-between items-end">
                            <div className="flex flex-col items-end mb-2">
                              {hasSpecialOffer ? (
                                <>
                                  <span className="type-body-3 text-content font-medium" style={{ fontSize: '0.875rem', fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400 }}>
                                    {formatPrice(displayPrice * item.quantity)}
                                  </span>
                                  <span className="type-body-3 text-content line-through text-gray-400 mt-1" style={{ fontSize: '0.875rem', fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400 }}>
                                    {formatPrice(item.product.price * item.quantity)}
                                  </span>
                                </>
                              ) : (
                                <span className="type-body-3 text-content font-medium" style={{ fontSize: '0.875rem', fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400 }}>
                                  {formatPrice(displayPrice * item.quantity)}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-row gap-3 items-center w-full justify-end">
                              {isAuthenticated && (
                                <button
                                  onClick={async () => {
                                    try {
                                      // Add to wishlist
                                      await favoriteService.addToFavorites(item.product.id)
                                      // Update local state
                                      setFavoriteIds(prev => new Set(prev).add(item.product.id))
                                      const favorites = await favoriteService.getFavorites()
                                      setWishlistItems(Array.isArray(favorites) ? favorites : [])
                                      
                                      // Remove from cart
                                      const itemId = item.id || item.product.id
                                      setRemovingItems(prev => new Set(prev).add(item.product.id))
                                      setTimeout(async () => {
                                        await removeFromCart(itemId)
                                        setRemovingItems(prev => {
                                          const newSet = new Set(prev)
                                          newSet.delete(item.product.id)
                                          return newSet
                                        })
                                      }, 700)
                                      
                                      // Dispatch events to update header favorite count and product page wishlist icon
                                      window.dispatchEvent(new Event('favoriteChanged'))
                                      window.dispatchEvent(new CustomEvent('productFavorited', { detail: { productId: item.product.id } }))
                                    } catch (error) {
                                      console.error('Error moving to wishlist:', error)
                                      setRemovingItems(prev => {
                                        const newSet = new Set(prev)
                                        newSet.delete(item.product.id)
                                        return newSet
                                      })
                                      alert('Failed to move to wishlist. Please try again.')
                                    }
                                  }}
                                  className="type-utility-1 mixed-case font-normal text-gray-600 hover:text-black transition-colors underline text-xs whitespace-nowrap"
                                  style={{ fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400 }}
                                >
                                  {t('cart.moveToWishlist')}
                                </button>
                              )}
                              <button
                                onClick={async () => {
                                  const itemId = item.id || item.product.id
                                  setRemovingItems(prev => new Set(prev).add(item.product.id))
                                  // Wait for animation to complete before removing
                                  setTimeout(async () => {
                                    await removeFromCart(itemId)
                                    setRemovingItems(prev => {
                                      const newSet = new Set(prev)
                                      newSet.delete(item.product.id)
                                      return newSet
                                    })
                                  }, 700) // Match animation duration
                                }}
                                className="p-2 hover:bg-gray-100 rounded transition-colors"
                                aria-label={t('cart.remove')}
                              >
                                <Trash2 className="w-5 h-5 text-gray-600 hover:text-black transition-colors" />
                              </button>
                            </div>
                          </div>
                        </li>
                      )
                    })}
                  </ul>

                  {/* You May Also Like */}
                  {youMayAlsoLike.length > 0 && (
                    <>
                      {cartAlertConfig.enabled && (
                        <div className="px-4 my-6 md:px-6">
                          <div className="min-w-[343px] py-3 px-2.5 type-body-3 flex items-center bg-yellow-50 text-yellow-800">
                            {cartAlertConfig.message}
                          </div>
                        </div>
                      )}

                      <div className="my-4">
                        <h1 className="type-heading-5 mb-4 uppercase text-black px-4 md:px-6">
                          {t('cart.youMayAlsoLike')}
                        </h1>
                        {currentProduct && (() => {
                          // Only show if product has available quantity
                          const quantity = currentProduct.quantity || 0
                          const availableQuantity = currentProduct.availableQuantity !== undefined && currentProduct.availableQuantity !== null 
                            ? currentProduct.availableQuantity 
                            : quantity
                          if (availableQuantity <= 0) return null
                          
                          return (
                            <div className="px-4 md:px-6">
                              <div className="border border-gray-300 w-full h-[160px] relative">
                                <div 
                                  key={currentProduct.id}
                                  className="grid gap-3 grid-cols-[120px_1fr] h-full p-2 animate-fade-in"
                                >
                                <div className="h-full w-full relative overflow-hidden">
                                  {(() => {
                                    const primaryImage = currentProduct.images?.find(img => img.isPrimary) || currentProduct.images?.[0] || null
                                    return primaryImage?.url ? (
                                      <Image
                                        src={primaryImage.url}
                                        alt={primaryImage.altText || currentProduct.name}
                                        width={120}
                                        height={160}
                                        className="w-full h-full object-cover"
                                        sizes="120px"
                                        unoptimized
                                      />
                                    ) : (
                                      <div className="w-full h-full bg-gray-100" />
                                    )
                                  })()}
                                </div>
                                <div className="flex flex-col justify-between ml-0 h-full text-[0.875rem]">
                                  <div>
                                    <Link
                                      href={`/products/${currentProduct.slug || currentProduct.sku}`}
                                      onClick={onClose}
                                      className="type-heading-6 uppercase tracking-normal hover:text-gray-600 mb-1 block line-clamp-2 font-bold"
                                    >
                                      {currentProduct.name}
                                    </Link>
                                    <div className="text-[0.750rem] space-y-0.5">
                                      {currentProduct.material && (
                                        <p className="text-content">
                                          {t('product.material')}: {currentProduct.material}
                                        </p>
                                      )}
                                      {currentProduct.ringSize && (
                                        <p className="text-content">
                                          {t('product.size')}: {currentProduct.ringSize}
                                        </p>
                                      )}
                                      {currentProduct.chainLength && (
                                        <p className="text-content">
                                          {t('product.length')}: {currentProduct.chainLength}
                                      </p>
                                    )}
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end mt-auto">
                                    <span className="type-body-3 text-content mb-2">
                                      {(() => {
                                        const hasSpecialOffer = currentProduct.specialOfferPrice && currentProduct.specialOfferPrice < currentProduct.price
                                        const displayPrice = hasSpecialOffer ? currentProduct.specialOfferPrice! : currentProduct.price
                                        return formatPrice(displayPrice)
                                      })()}
                                    </span>
                                    <button
                                      onClick={() => handleAddRecommended(currentProduct)}
                                      className="relative inline-block text-center outline-none border border-black hover:bg-black hover:text-white transition-colors px-3 py-1.5 text-xs font-normal normal-case bg-white w-full"
                                    >
                                      {t('cart.addItem')}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                            {/* Navigation Buttons */}
                            <div className="flex flex-row gap-x-xs justify-end mt-xs mx-md md:mx-lg mb-lg">
                              <button
                                onClick={handlePrevProduct}
                                disabled={youMayAlsoLike.length <= 1}
                                className="relative pointer-events-auto inline-block text-center outline-none border border-content hover:border-utility-hover focus-visible:ring-2 ring-utility-focus ring-offset-2 transition-colors duration-300 ease-ease border-none capitalize p-0 tracking-utility z-above w-[25px] h-[30px] disabled:opacity-50 bg-gray-100 text-gray-900 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400"
                                aria-label="Go to previous item"
                                data-testid="slick-prev-button"
                              >
                                <span className="flex justify-center items-center gap-xxs preserve-line-height">
                                  <ChevronLeft className="w-md h-md" />
                                </span>
                              </button>
                              <button
                                onClick={handleNextProduct}
                                disabled={youMayAlsoLike.length <= 1}
                                className="relative pointer-events-auto inline-block text-center outline-none border border-content hover:border-utility-hover focus-visible:ring-2 ring-utility-focus ring-offset-2 transition-colors duration-300 ease-ease border-none capitalize p-0 tracking-utility z-above w-[25px] h-[30px] disabled:opacity-50 bg-gray-100 text-gray-900 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400"
                                aria-label="Go to next item"
                                data-testid="slick-next-button"
                              >
                                <span className="flex justify-center items-center gap-xxs preserve-line-height">
                                  <ChevronRight className="w-md h-md" />
                                </span>
                              </button>
                            </div>
                          </div>
                          )
                        })()}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'wishlist' && (
            <div id="wishlist-panel" role="tabpanel" aria-labelledby="wishlist-tab" className="h-full flex flex-col">
              {!isAuthenticated ? (
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="text-center">
                    <p className="type-body-2 text-content mb-4">Please log in to view your wishlist</p>
                    <Link
                      href="/"
                      onClick={onClose}
                      className="inline-block px-6 py-3 bg-black text-white hover:bg-gray-800 transition-colors"
                    >
                      Log In
                    </Link>
                  </div>
                </div>
              ) : loadingWishlist ? (
                <div className="flex-1 flex items-center justify-center p-8">
                  <p className="type-body-2 text-content">Loading wishlist...</p>
                </div>
              ) : wishlistItems.length === 0 ? (
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="text-center">
                    <p className="type-body-2 text-content mb-4">{t('cart.wishlistEmpty')}</p>
                    <Link
                      href="/products"
                      onClick={onClose}
                      className="inline-block px-6 py-3 bg-black text-white hover:bg-gray-800 transition-colors"
                    >
                      {t('cart.startShopping')}
                    </Link>
                  </div>
                </div>
              ) : (
                <ul className="flex flex-col px-4 md:px-6">
                  {wishlistItems.map((item) => {
                    const primaryImage = item.images?.[0]
                    const hasSpecialOffer = item.specialOfferPrice && item.specialOfferPrice < item.price
                    const displayPrice = hasSpecialOffer ? item.specialOfferPrice! : item.price

                    return (
                      <li
                        key={item.id}
                        className="pb-4 border-b border-gray-200 pt-4 grid gap-2 md:gap-4 grid-cols-[140px_1fr_100px] transition-all duration-700 ease-in-out opacity-100 scale-100 translate-x-0"
                        data-testid="wishlist-line-item"
                      >
                        {/* Image */}
                        <div className="w-full aspect-square relative overflow-hidden">
                          <Link href={`/products/${item.slug || item.sku}`} onClick={onClose} className="block w-full h-full">
                            {primaryImage ? (
                              <Image
                                src={primaryImage.url}
                                alt={primaryImage.altText || item.name}
                                width={140}
                                height={140}
                                className="w-full h-full object-contain"
                                sizes="140px"
                                unoptimized
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                <span className="text-gray-400 text-xs">No Image</span>
                              </div>
                            )}
                          </Link>
                        </div>

                        {/* Product Info */}
                        <div className="flex flex-col justify-between min-w-0 text-[0.875rem]">
                          <div className="flex flex-col justify-start h-full">
                            <Link
                              href={`/products/${item.slug || item.sku}`}
                              onClick={onClose}
                              className="pointer-events-auto transition-colors duration-300 hover:text-gray-600"
                            >
                              <span className="type-heading-6 text-content font-bold">{item.name}</span>
                            </Link>
                            <div className="text-[0.750rem] space-y-0.5 mt-1" style={{ fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400 }}>
                              {item.material && (
                                <p className="text-content">
                                  {item.material}
                                </p>
                              )}
                              {item.ringSize && (
                                <p className="text-content">
                                  {t('product.size')}: {item.ringSize}
                                </p>
                              )}
                              {item.chainLength && (
                                <p className="text-content">
                                  {t('product.length')}: {item.chainLength}
                                </p>
                              )}
                              <p className="text-content">
                                {t('cart.inStock')}
                              </p>
                            </div>

                            {/* Add to bag button */}
                            <div className="flex justify-between gap-2 items-center mt-auto">
                              <button
                                onClick={() => handleAddFromWishlist(item)}
                                className="pointer-events-auto ease-ease inline-block uppercase text-center outline-none disabled:text-utility-disabled focus-visible:ring-2 ring-utility-focus ring-offset-2 transition-all duration-300 ease-ease shrink-0 py-2 px-6 border border-black bg-gray-100 text-black hover:bg-[#8a9a8a] hover:text-white"
                                style={{ fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400, borderWidth: '1px' }}
                              >
                                Add to bag
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Price & Actions */}
                        <div className="flex flex-col justify-between items-end">
                          <div className="flex flex-col items-end mb-2">
                            <span className="type-body-3 text-content font-medium" style={{ fontSize: '0.875rem', fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400 }}>
                              {formatPrice(displayPrice)}
                            </span>
                          </div>
                          <div className="flex justify-end items-center w-full">
                            <button
                              onClick={() => handleRemoveFromWishlist(item.id)}
                              className="p-2 hover:bg-gray-100 rounded transition-colors"
                              aria-label={t('cart.remove')}
                            >
                              <Trash2 className="w-5 h-5 text-gray-600 hover:text-black transition-colors" />
                            </button>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Summary & Checkout */}
        {activeTab === 'bag' && cart && cart.items.length > 0 && (
          <>
            <div className="bg-gray-100 p-6 flex flex-col gap-2 mt-auto border-t border-black">
              <dl className="flex gap-2 justify-between">
                <dt>
                  <p className="type-body-2 text-content">{t('cart.subtotal')}</p>
                </dt>
                <dd>
                  <div className="type-body-2 text-content">{formatPrice(cart.total)}</div>
                </dd>
              </dl>
              <dl className="flex gap-2 justify-between">
                <dt>
                  <p className="type-body-2 text-content">{t('checkout.taxes')}</p>
                </dt>
                <dd>
                  <p className="type-body-2 text-content" data-testid="no-taxes">-</p>
                </dd>
              </dl>
              <dl className="flex gap-2 justify-between">
                <dt>
                  <p className="type-body-2 text-content">{t('checkout.estimatedShipping')}</p>
                </dt>
                <dd>
                  <div className="type-body-2 text-content">
                    {freeShippingConfig.enabled && currentTotal >= FREE_SHIPPING_THRESHOLD ? (
                      <span className="text-green-600">{t('checkout.free')}</span>
                    ) : (
                      <div>{formatPrice(15)}</div>
                    )}
                  </div>
                </dd>
              </dl>
            </div>
            <div className="flex flex-col gap-2 px-6 py-4 shadow-lg sticky bottom-0 z-[1] bg-gray-100">
              <dl className="flex gap-2 justify-between">
                <dt>
                  <p className="type-body-2 text-content font-bold">{t('checkout.estimatedTotal')}</p>
                </dt>
                <dd>
                  <div className="type-body-2 text-content">
                    {formatPrice(cart.total + (freeShippingConfig.enabled && currentTotal >= FREE_SHIPPING_THRESHOLD ? 0 : 15))}
                  </div>
                </dd>
              </dl>
              <Link
                href="/checkout"
                onClick={onClose}
                className="relative inline-block uppercase px-6 text-center outline-none border focus-visible:ring-2 ring-utility-focus ring-offset-2 transition-colors duration-300 ease-ease type-utility-1 tracking-px leading-5 py-3 bg-black text-white border-black hover:bg-gray-800 disabled:bg-gray-400 disabled:text-gray-200 disabled:border-gray-400 w-full mb-0"
              >
                <span className="flex justify-center items-center gap-2 preserve-line-height">
                  {t('cart.checkout')}
                </span>
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  )
}

