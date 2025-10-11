import { api } from './api'

export interface WebsiteStatus {
  status: 'normal' | 'construction' | 'vacation'
  message?: string
  imageUrl?: string
  startDate?: string
  endDate?: string
}

export const websiteStatusService = {
  /**
   * Get current website status
   */
  async getWebsiteStatus(): Promise<WebsiteStatus> {
    try {
      const response = await api.get('/api/public/website-status')
      return response.data
    } catch (error) {
      console.error('Error fetching website status:', error)
      // Return normal status as fallback
      return { status: 'normal' }
    }
  }
}
