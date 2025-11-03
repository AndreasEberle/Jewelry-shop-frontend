// Re-export all types from services
export type { Product, ProductFilters, ProductResponse } from '@/services/productService'
export type { User, AuthResponse, LoginCredentials, RegisterData } from '@/services/authService'

// Additional common types
export interface ApiError {
  message: string
  status: number
  details?: any
}

export interface PaginationParams {
  page: number
  limit: number
  total?: number
}

export interface SelectOption {
  value: string
  label: string
}

// Cart types
export interface CartItem {
  id?: string // Cart item ID (for authenticated users)
  product: Product
  quantity: number
}

export interface Cart {
  items: CartItem[]
  total: number
  itemCount: number
}

// Order types
export interface OrderItem {
  productId: string
  quantity: number
  price: number
}

export interface Order {
  id: string
  userId: string
  items: OrderItem[]
  total: number
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
  shippingAddress: Address
  billingAddress: Address
  createdAt: string
  updatedAt: string
}

export interface Address {
  id?: string
  street: string
  city: string
  state: string
  zipCode: string
  country: string
  isDefault?: boolean
}

// Category types
export interface Category {
  id: string
  name: string
  description?: string
  slug: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Tag types
export interface Tag {
  id: string
  name: string
  slug: string
  createdAt: string
  updatedAt: string
}






