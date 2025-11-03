import api from './api'

export interface Product {
  id: string
  name: string
  description: string
  price: number
  sku: string
  slug?: string
  material?: string
  gemstone?: string
  weightGrams?: number
  ringSize?: string
  chainLength?: string
  color?: string
  finish?: string
  quantity: number
  availableQuantity?: number // Available after considering cart reservations
  baseCurrency: string
  displayCurrency?: string
  displayPrice?: number
  categories: string[]
  tags: string[]
  images: Array<{
    id: string
    url: string
    altText?: string
    isPrimary: boolean
    sortOrder?: number
    width?: number
    height?: number
    mimeType?: string
    createdAt: string
  }>
  active: boolean
  showInFeatured: boolean
  sortOrder?: number
  specialOffer?: boolean
  specialOfferPrice?: number
  specialOfferDescription?: string
  createdAt: string
  updatedAt: string
  // Review statistics
  averageRating?: number
  totalReviews?: number
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
  // Admin: Get all products
  async getAdminProducts(): Promise<Product[]> {
    const response = await api.get('/api/admin/products')
    return response.data
  },

  // Admin: Create a new product
  async createProduct(productData: CreateProductRequest): Promise<Product> {
    const response = await api.post('/api/admin/products', productData)
    return response.data
  },

  // Admin: Update a product
  async updateProduct(id: string, productData: UpdateProductRequest): Promise<Product> {
    const response = await api.put(`/api/admin/products/${id}`, productData)
    return response.data
  },

  // Admin: Delete a product
  async deleteProduct(id: string): Promise<void> {
    await api.delete(`/api/admin/products/${id}`)
  },

  // Public: Get all active products
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

  // Public: Get a single product by ID
  async getProduct(id: string): Promise<Product> {
    const response = await api.get(`/api/products/${id}`)
    return response.data
  },

  // Public: Get a single product by SKU
  async getProductBySku(sku: string): Promise<Product> {
    const response = await api.get(`/api/products/sku/${sku}`)
    return response.data
  },

  // Public: Get a single product by slug
  async getProductBySlug(slug: string): Promise<Product> {
    // Use the catch-all endpoint that handles both slugs and IDs
    const response = await api.get(`/api/products/${slug}`)
    return response.data
  },

  // Public: Get featured products
  async getFeaturedProducts(limit: number = 8, currency?: string): Promise<Product[]> {
    const headers = currency ? { 'X-Currency': currency } : {}
    const response = await api.get(`/api/products/featured?limit=${limit}`, { headers })
    return response.data
  },

  // Public: Get products by category
  async getProductsByCategory(categoryId: string, filters: Omit<ProductFilters, 'category'> = {}): Promise<ProductResponse> {
    return this.getProducts({ ...filters, category: categoryId })
  },

  // Public: Search products
  async searchProducts(query: string, filters: Omit<ProductFilters, 'search'> = {}): Promise<ProductResponse> {
    return this.getProducts({ ...filters, search: query })
  },

  // Admin: Generate SKU from product name
  async generateSku(productName: string): Promise<string> {
    const response = await api.get(`/api/admin/products/generate-sku?name=${encodeURIComponent(productName)}`)
    return response.data
  },

  // Admin: Toggle featured status
  async toggleFeaturedStatus(productId: string): Promise<void> {
    await api.put(`/api/admin/products/${productId}/toggle-featured`)
  },

  // Get real-time availability for a product
  async getProductAvailability(productId: string): Promise<number> {
    const response = await api.get(`/api/products/${productId}/availability`)
    return response.data.availableQuantity
  },

  // Get real-time availability for multiple products
  async getMultipleProductAvailability(productIds: string[]): Promise<Record<string, number>> {
    const params = new URLSearchParams()
    productIds.forEach(id => params.append('productIds', id))
    const response = await api.get(`/api/products/availability?${params.toString()}`)
    return response.data
  }
}

// Admin-specific types
export interface CreateProductRequest {
  name: string
  sku: string
  description?: string
  price: number
  baseCurrency?: string
  material?: string
  gemstone?: string
  weightGrams?: number
  ringSize?: string
  chainLength?: string
  color?: string
  finish?: string
  quantity: number
  active?: boolean
  specialOffer?: boolean
  specialOfferPrice?: number
  specialOfferDescription?: string
  categories?: string[]
  tags?: string[]
}

export interface UpdateProductRequest {
  name?: string
  sku?: string
  description?: string
  price?: number
  baseCurrency?: string
  material?: string
  gemstone?: string
  weightGrams?: number
  quantity?: number
  active?: boolean
  specialOffer?: boolean
  specialOfferPrice?: number
  specialOfferDescription?: string
  categories?: string[]
  tags?: string[]
}

