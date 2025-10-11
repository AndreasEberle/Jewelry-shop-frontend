import api from './api'
import { Product } from './productService'

export interface FavoriteResponse {
  isFavorite: boolean
}

export const favoriteService = {
  // Get user's favorite products
  async getFavorites(): Promise<Product[]> {
    const response = await api.get('/api/user/favorites')
    return response.data
  },

  // Get user's favorite product IDs
  async getFavoriteIds(): Promise<string[]> {
    const response = await api.get('/api/user/favorites/ids')
    return response.data
  },

  // Add product to favorites
  async addToFavorites(productId: string): Promise<void> {
    await api.post(`/api/user/favorites/${productId}`)
  },

  // Remove product from favorites
  async removeFromFavorites(productId: string): Promise<void> {
    await api.delete(`/api/user/favorites/${productId}`)
  },

  // Toggle favorite status
  async toggleFavorite(productId: string): Promise<boolean> {
    const response = await api.post(`/api/user/favorites/${productId}/toggle`)
    return response.data
  },

  // Check if product is in favorites
  async isFavorite(productId: string): Promise<boolean> {
    const response = await api.get(`/api/user/favorites/${productId}/status`)
    return response.data
  }
}
