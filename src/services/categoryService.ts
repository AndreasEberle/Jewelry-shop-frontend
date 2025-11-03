import api from './api'

export interface Category {
  id: string
  name: string
  description?: string
  slug: string
  active: boolean
  productCount: number
  featured: boolean
}

export const categoryService = {
  async getAllCategories(): Promise<Category[]> {
    const response = await api.get('/api/public/categories')
    return response.data
  }
}


