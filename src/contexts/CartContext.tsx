'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Cart, CartItem, Product } from '@/types'
import { cartService } from '@/services/cartService'
import { authService } from '@/services/authService'
import { useAuth } from './AuthContext'
import api from '@/services/api'

interface CartContextType {
  cart: Cart | null
  isLoading: boolean
  error: string | null
  addToCart: (product: Product, quantity?: number) => Promise<void>
  updateQuantity: (itemId: string, quantity: number) => Promise<void>
  removeFromCart: (itemId: string) => Promise<void>
  clearCart: () => Promise<void>
  refreshCart: () => Promise<void>
  itemCount: number
  total: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const useCart = () => {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

interface CartProviderProps {
  children: ReactNode
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cart, setCart] = useState<Cart | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMigrated, setHasMigrated] = useState(false)
  const { user, isAuthenticated } = useAuth()

  // Load cart when user authentication state changes
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('CartContext: User authenticated, loading backend cart')
      // Load cart immediately when user is authenticated
      const loadCart = async () => {
        try {
          // Only migrate if we haven't already migrated
          if (!hasMigrated) {
            console.log('CartContext: Migrating guest cart...')
            await migrateGuestCartToBackend()
          } else {
            console.log('CartContext: Already migrated, just refreshing cart')
            await refreshCart()
          }
        } catch (error) {
          console.error('CartContext: Error during migration and refresh:', error)
          // Still try to refresh even if migration fails
          await refreshCart()
        }
      }
      
      loadCart()
    } else {
      console.log('CartContext: User not authenticated, loading guest cart')
      setHasMigrated(false) // Reset migration flag when user logs out
      loadGuestCart()
    }
  }, [isAuthenticated, user, hasMigrated])

  // Listen for user logout events to clear cart
  useEffect(() => {
    const handleUserLogout = () => {
      console.log('CartContext: User logged out, clearing cart')
      setCart({ items: [], total: 0, itemCount: 0 })
      setError(null)
      setHasMigrated(false) // Reset migration flag on logout
      // Clear guest cart from localStorage
      localStorage.removeItem('guest_cart')
    }

    window.addEventListener('userLoggedOut', handleUserLogout)
    return () => {
      window.removeEventListener('userLoggedOut', handleUserLogout)
    }
  }, [])

  const loadGuestCart = () => {
    const guestCartKey = 'guest_cart'
    const guestCart = JSON.parse(localStorage.getItem(guestCartKey) || '{"items":[],"total":0,"itemCount":0}')
    setCart(guestCart)
  }

  // Migrate guest cart to backend when user logs in
  const migrateGuestCartToBackend = async () => {
    const guestCartKey = 'guest_cart'
    const guestCart = JSON.parse(localStorage.getItem(guestCartKey) || '{"items":[],"total":0,"itemCount":0}')
    
    console.log('CartContext: migrateGuestCartToBackend called')
    console.log('CartContext: Guest cart items:', guestCart.items.length)
    console.log('CartContext: Guest cart data:', guestCart)
    console.log('CartContext: Has migrated flag:', hasMigrated)
    
    if (guestCart.items.length > 0 && !hasMigrated) {
      console.log('CartContext: Migrating guest cart items to backend...')
      try {
        // Add each guest cart item to backend cart
        for (const item of guestCart.items) {
          console.log('CartContext: Adding item to backend:', item.product.id, 'quantity:', item.quantity)
          console.log('CartContext: Product ID type:', typeof item.product.id)
          console.log('CartContext: Full product object:', item.product)
          
          // Validate that productId is a proper UUID
          if (!item.product.id || typeof item.product.id !== 'string') {
            console.error('CartContext: Invalid product ID:', item.product.id)
            continue
          }
          
          await cartService.addToCart({
            productId: item.product.id,
            quantity: item.quantity
          })
        }
        
        console.log('CartContext: Successfully migrated guest cart to backend')
        
        // Mark as migrated BEFORE clearing guest cart
        setHasMigrated(true)
        
        // Clear guest cart after successful migration
        localStorage.removeItem(guestCartKey)
        console.log('CartContext: Cleared guest cart from localStorage')
      } catch (error) {
        console.error('CartContext: Failed to migrate guest cart:', error)
        // Keep guest cart if migration fails
      }
    } else if (hasMigrated) {
      console.log('CartContext: Already migrated, skipping migration')
    } else {
      console.log('CartContext: No guest cart items to migrate')
    }
    
    // Always refresh the cart after migration attempt to load existing backend cart
    console.log('CartContext: Refreshing cart to show current state...')
    await refreshCart()
  }

  const refreshCart = async () => {
    console.log('CartContext: refreshCart called')
    console.log('CartContext: isAuthenticated:', isAuthenticated, 'user:', user ? `${user.email}` : 'null')
    
    if (!isAuthenticated || !user) {
      console.log('CartContext: User not authenticated, not refreshing cart')
      setCart(null)
      return
    }

    console.log('CartContext: Refreshing cart for authenticated user:', user.email)
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('CartContext: Calling cartService.getCart()...')
      const cartData = await cartService.getCart()
      console.log('CartContext: Cart data received from backend:', cartData)
      console.log('CartContext: Cart items count:', cartData.items.length)
      console.log('CartContext: Cart total:', cartData.total)
      console.log('CartContext: Cart itemCount:', cartData.itemCount)
      
      // Convert backend response to frontend Cart format
      // Fetch full product details for each item
      const itemsWithProducts = await Promise.all(
        cartData.items.map(async (item) => {
          try {
            // Fetch full product details
            const productResponse = await api.get(`/api/products/${item.productId}`)
            const fullProduct = productResponse.data
            
            return {
              id: item.id,
              product: fullProduct,
              quantity: item.quantity
            }
          } catch (error) {
            console.error(`Failed to fetch product ${item.productId}:`, error)
            // Fallback to basic product info
            return {
              id: item.id,
              product: {
                id: item.productId,
                name: item.productName,
                price: item.productPrice,
                description: '',
                category: '',
                images: [],
                active: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              },
              quantity: item.quantity
            }
          }
        })
      )
      
      const frontendCart = {
        items: itemsWithProducts,
        total: cartData.total,
        itemCount: cartData.itemCount
      }
      
      console.log('CartContext: Setting frontend cart state:', frontendCart)
      setCart(frontendCart)
      console.log('CartContext: Cart state updated successfully')
      
      // Dispatch event to notify other components that cart was updated
      window.dispatchEvent(new Event('cartUpdated'))
    } catch (err: any) {
      console.error('CartContext: Failed to refresh cart:', err)
      console.error('CartContext: Error details:', {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data
      })
      setError(err.message || 'Failed to load cart')
      // Don't clear cart on API failures - keep existing cart
      // This prevents cart from disappearing on temporary API failures
    } finally {
      setIsLoading(false)
    }
  }

  const addToCart = async (product: Product, quantity: number = 1) => {
    setIsLoading(true)
    setError(null)

    try {
      if (isAuthenticated && user) {
        // User is logged in - use backend cart
        // The backend will handle checking for duplicates and updating quantity
        console.log('CartContext: Adding to cart - Product ID:', product.id, 'Quantity:', quantity)
        await cartService.addToCart({
          productId: product.id,
          quantity
        })
        // Refresh cart to get updated state
        await refreshCart()
        console.log('CartContext: Cart refreshed after adding item')
        
        // Only dispatch event to open cart drawer if not on checkout page
        // Small delay to ensure cart state is fully updated and drawer opens smoothly
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/checkout')) {
          // Use requestAnimationFrame to ensure smooth animation
          requestAnimationFrame(() => {
            window.dispatchEvent(new Event('openCartDrawer'))
          })
        }
      } else {
        // Guest user - use local storage cart
        addToGuestCart(product, quantity)
        // Also dispatch event to open cart drawer for guest users
        // Small delay to ensure cart state is fully updated and drawer opens smoothly
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/checkout')) {
          // Use requestAnimationFrame to ensure smooth animation
          requestAnimationFrame(() => {
            window.dispatchEvent(new Event('openCartDrawer'))
          })
        }
      }
    } catch (err: any) {
      console.error('CartContext: Error adding to cart:', err)
      setError(err.message || 'Failed to add item to cart')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const addToGuestCart = (product: Product, quantity: number) => {
    const guestCartKey = 'guest_cart'
    const existingCart = JSON.parse(localStorage.getItem(guestCartKey) || '{"items":[],"total":0,"itemCount":0}')
    
    // Check if item already exists
    const existingItemIndex = existingCart.items.findIndex((item: any) => item.product.id === product.id)
    
    if (existingItemIndex >= 0) {
      // Update quantity
      existingCart.items[existingItemIndex].quantity += quantity
    } else {
      // Add new item
      existingCart.items.push({
        product,
        quantity
      })
    }
    
    // Recalculate totals
    existingCart.itemCount = existingCart.items.reduce((sum: number, item: any) => sum + item.quantity, 0)
    existingCart.total = existingCart.items.reduce((sum: number, item: any) => sum + (item.product.price * item.quantity), 0)
    
    // Save to localStorage
    localStorage.setItem(guestCartKey, JSON.stringify(existingCart))
    
    // Update state
    setCart(existingCart)
    
    // Only dispatch event to open cart drawer if not on checkout page
    // Use requestAnimationFrame to ensure smooth animation
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/checkout')) {
      requestAnimationFrame(() => {
        window.dispatchEvent(new Event('openCartDrawer'))
      })
    }
  }

  const updateQuantity = async (itemId: string, quantity: number) => {
    setIsLoading(true)
    setError(null)

    try {
      if (isAuthenticated && user) {
        // User is logged in - use backend cart
        await cartService.updateCartItem({
          itemId,
          quantity
        })
        await refreshCart()
      } else {
        // Guest user - use local storage cart
        updateGuestCartQuantity(itemId, quantity)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update cart item')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const removeFromCart = async (itemId: string) => {
    setIsLoading(true)
    setError(null)

    try {
      if (isAuthenticated && user) {
        // User is logged in - use backend cart
        await cartService.removeFromCart(itemId)
        await refreshCart()
      } else {
        // Guest user - use local storage cart
        removeFromGuestCart(itemId)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to remove item from cart')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const clearCart = async () => {
    setIsLoading(true)
    setError(null)

    try {
      if (isAuthenticated && user) {
        // User is logged in - use backend cart
        await cartService.clearCart()
        await refreshCart()
      } else {
        // Guest user - use local storage cart
        clearGuestCart()
      }
    } catch (err: any) {
      setError(err.message || 'Failed to clear cart')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // Guest cart helper methods
  const updateGuestCartQuantity = (productId: string, quantity: number) => {
    const guestCartKey = 'guest_cart'
    const existingCart = JSON.parse(localStorage.getItem(guestCartKey) || '{"items":[],"total":0,"itemCount":0}')
    
    const itemIndex = existingCart.items.findIndex((item: any) => item.product.id === productId)
    
    if (itemIndex >= 0) {
      if (quantity <= 0) {
        // Remove item if quantity is 0 or negative
        existingCart.items.splice(itemIndex, 1)
      } else {
        // Update quantity
        existingCart.items[itemIndex].quantity = quantity
      }
      
      // Recalculate totals
      existingCart.itemCount = existingCart.items.reduce((sum: number, item: any) => sum + item.quantity, 0)
      existingCart.total = existingCart.items.reduce((sum: number, item: any) => sum + (item.product.price * item.quantity), 0)
      
      // Save to localStorage
      localStorage.setItem(guestCartKey, JSON.stringify(existingCart))
      
      // Update state
      setCart(existingCart)
    }
  }

  const removeFromGuestCart = (productId: string) => {
    const guestCartKey = 'guest_cart'
    const existingCart = JSON.parse(localStorage.getItem(guestCartKey) || '{"items":[],"total":0,"itemCount":0}')
    
    const itemIndex = existingCart.items.findIndex((item: any) => item.product.id === productId)
    
    if (itemIndex >= 0) {
      existingCart.items.splice(itemIndex, 1)
      
      // Recalculate totals
      existingCart.itemCount = existingCart.items.reduce((sum: number, item: any) => sum + item.quantity, 0)
      existingCart.total = existingCart.items.reduce((sum: number, item: any) => sum + (item.product.price * item.quantity), 0)
      
      // Save to localStorage
      localStorage.setItem(guestCartKey, JSON.stringify(existingCart))
      
      // Update state
      setCart(existingCart)
    }
  }

  const clearGuestCart = () => {
    const guestCartKey = 'guest_cart'
    const emptyCart = { items: [], total: 0, itemCount: 0 }
    
    localStorage.setItem(guestCartKey, JSON.stringify(emptyCart))
    setCart(emptyCart)
  }

  const value: CartContextType = {
    cart,
    isLoading,
    error,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    refreshCart,
    itemCount: cart?.itemCount || 0,
    total: cart?.total || 0
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}
