'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Cart, CartItem, Product } from '@/types'
import { cartService } from '@/services/cartService'
import { authService } from '@/services/authService'

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

  // Load cart when user is authenticated or load guest cart
  useEffect(() => {
    if (authService.isAuthenticated()) {
      refreshCart()
    } else {
      loadGuestCart()
    }
  }, [])

  // Listen for user login events to migrate guest cart
  useEffect(() => {
    const handleUserLogin = () => {
      if (authService.isAuthenticated()) {
        migrateGuestCartToBackend()
      }
    }

    window.addEventListener('userLoggedIn', handleUserLogin)
    return () => window.removeEventListener('userLoggedIn', handleUserLogin)
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
    
    if (guestCart.items.length > 0) {
      try {
        // Add each guest cart item to backend cart
        for (const item of guestCart.items) {
          await cartService.addToCart({
            productId: item.product.id,
            quantity: item.quantity
          })
        }
        
        // Clear guest cart after successful migration
        localStorage.removeItem(guestCartKey)
        
        // Refresh backend cart
        await refreshCart()
      } catch (error) {
        console.error('Failed to migrate guest cart:', error)
        // Keep guest cart if migration fails
      }
    }
  }

  const refreshCart = async () => {
    if (!authService.isAuthenticated()) {
      setCart(null)
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      const cartData = await cartService.getCart()
      setCart({
        items: cartData.items.map(item => ({
          product: item.product,
          quantity: item.quantity
        })),
        total: cartData.total,
        itemCount: cartData.itemCount
      })
    } catch (err: any) {
      setError(err.message || 'Failed to load cart')
      console.error('Cart loading error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const addToCart = async (product: Product, quantity: number = 1) => {
    setIsLoading(true)
    setError(null)

    try {
      if (authService.isAuthenticated()) {
        // User is logged in - use backend cart
        await cartService.addToCart({
          productId: product.id,
          quantity
        })
        await refreshCart()
      } else {
        // Guest user - use local storage cart
        addToGuestCart(product, quantity)
      }
    } catch (err: any) {
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
  }

  const updateQuantity = async (itemId: string, quantity: number) => {
    setIsLoading(true)
    setError(null)

    try {
      if (authService.isAuthenticated()) {
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
      if (authService.isAuthenticated()) {
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
      if (authService.isAuthenticated()) {
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
