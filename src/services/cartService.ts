import api from './api'
import { Cart, CartItem, Product } from '@/types'

export interface CartResponse {
  id: string
  userId: string
  items: Array<{
    id: string
    product: Product
    quantity: number
    createdAt: string
    updatedAt: string
  }>
  total: number
  itemCount: number
  createdAt: string
  updatedAt: string
}

export interface AddToCartRequest {
  productId: string
  quantity: number
}

export interface UpdateCartItemRequest {
  itemId: string
  quantity: number
}

export const cartService = {
  // Get current user's cart
  async getCart(): Promise<CartResponse> {
    const response = await api.get('/api/cart')
    return response.data
  },

  // Add item to cart
  async addToCart(data: AddToCartRequest): Promise<CartResponse> {
    const response = await api.post('/api/cart/items', data)
    return response.data
  },

  // Update cart item quantity
  async updateCartItem(data: UpdateCartItemRequest): Promise<CartResponse> {
    const response = await api.put(`/api/cart/items/${data.itemId}`, {
      quantity: data.quantity
    })
    return response.data
  },

  // Remove item from cart
  async removeFromCart(itemId: string): Promise<CartResponse> {
    const response = await api.delete(`/api/cart/items/${itemId}`)
    return response.data
  },

  // Clear entire cart
  async clearCart(): Promise<void> {
    await api.delete('/api/cart')
  },

  // Get cart item count (for header badge)
  async getCartItemCount(): Promise<number> {
    try {
      const cart = await this.getCart()
      return cart.itemCount
    } catch (error) {
      return 0
    }
  }
}
