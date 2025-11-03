import api from './api'

export interface ProductReview {
  id: string
  userId: string
  userName: string
  userEmail: string
  productId: string
  productName: string
  rating: number
  title: string
  content: string
  isVerifiedPurchase: boolean
  isApproved: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateProductReviewRequest {
  rating: number
  title: string
  content: string
  isVerifiedPurchase?: boolean
}

export interface ProductReviewStats {
  averageRating: number
  totalReviews: number
  rating1Count: number
  rating2Count: number
  rating3Count: number
  rating4Count: number
  rating5Count: number
  verifiedPurchaseCount: number
}

export const reviewService = {
  // Get reviews for a product
  async getProductReviews(productId: string): Promise<ProductReview[]> {
    const response = await api.get(`/api/products/${productId}/reviews`)
    return response.data
  },

  // Get paginated reviews for a product
  async getProductReviewsPaginated(productId: string, page: number = 0, size: number = 10): Promise<{ content: ProductReview[], totalElements: number, totalPages: number }> {
    const response = await api.get(`/api/products/${productId}/reviews/paginated?page=${page}&size=${size}`)
    return response.data
  },

  // Get review statistics for a product
  async getProductReviewStats(productId: string): Promise<ProductReviewStats> {
    const response = await api.get(`/api/products/${productId}/reviews/stats`)
    return response.data
  },

  // Create a new review
  async createReview(productId: string, reviewData: CreateProductReviewRequest): Promise<ProductReview> {
    const response = await api.post(`/api/products/${productId}/reviews`, reviewData)
    return response.data
  },

  // Update a review
  async updateReview(reviewId: string, reviewData: CreateProductReviewRequest): Promise<ProductReview> {
    const response = await api.put(`/api/products/reviews/${reviewId}`, reviewData)
    return response.data
  },

  // Delete a review
  async deleteReview(reviewId: string): Promise<void> {
    await api.delete(`/api/products/reviews/${reviewId}`)
  },

  // Get user's reviews
  async getUserReviews(): Promise<ProductReview[]> {
    const response = await api.get('/api/products/user/reviews')
    return response.data
  },

  // Get paginated user reviews
  async getUserReviewsPaginated(page: number = 0, size: number = 10): Promise<{ content: ProductReview[], totalElements: number, totalPages: number }> {
    const response = await api.get(`/api/products/user/reviews/paginated?page=${page}&size=${size}`)
    return response.data
  }
}



