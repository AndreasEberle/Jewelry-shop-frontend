import api from './api'

export interface Product {
  id: string
  name: string
  description: string
  price: number
  sku: string
  category: {
    id: string
    name: string
  }
  tags: Array<{
    id: string
    name: string
  }>
  images: Array<{
    id: string
    url: string
    altText?: string
    isPrimary: boolean
  }>
  inventory: {
    quantity: number
    lowStockThreshold: number
  }
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ProductFilters {
  category?: string
  minPrice?: number
  maxPrice?: number
  tags?: string[]
  search?: string
  page?: number
  limit?: number
}

export interface ProductResponse {
  content: Product[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

export const productService = {
  // Get all products with optional filters
  async getProducts(filters: ProductFilters = {}): Promise<ProductResponse> {
    const params = new URLSearchParams()
    
    if (filters.category) params.append('category', filters.category)
    if (filters.minPrice) params.append('minPrice', filters.minPrice.toString())
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString())
    if (filters.tags) filters.tags.forEach(tag => params.append('tags', tag))
    if (filters.search) params.append('search', filters.search)
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())

    const response = await api.get(`/api/products?${params.toString()}`)
    return response.data
  },

  // Get a single product by ID
  async getProduct(id: string): Promise<Product> {
    const response = await api.get(`/api/products/${id}`)
    return response.data
  },

  // Get featured products
  async getFeaturedProducts(limit: number = 8): Promise<Product[]> {
    const response = await api.get(`/api/products/featured?limit=${limit}`)
    return response.data
  },

  // Get products by category
  async getProductsByCategory(categoryId: string, filters: Omit<ProductFilters, 'category'> = {}): Promise<ProductResponse> {
    return this.getProducts({ ...filters, category: categoryId })
  },

  // Search products
  async searchProducts(query: string, filters: Omit<ProductFilters, 'search'> = {}): Promise<ProductResponse> {
    return this.getProducts({ ...filters, search: query })
  }
}
