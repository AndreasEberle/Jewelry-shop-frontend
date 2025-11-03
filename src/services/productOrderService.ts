import api from './api'

export interface ProductOrder {
  id: string
  name: string
  sortOrder: number
}

export const productOrderService = {
  /**
   * Get all products with their current order
   */
  async getProductOrder(): Promise<ProductOrder[]> {
    const response = await api.get('/api/admin/products/order')
    return response.data
  },

  /**
   * Reorder products
   */
  async reorderProducts(productIds: string[]): Promise<void> {
    await api.put('/api/admin/products/reorder', {
      productIds
    })
  }
}



