import api from './api'

export interface BackgroundImage {
  id: string
  sectionName: string
  imageName: string
  originalFilename: string
  localUrl?: string
  s3Url?: string
  storageType: string
  fileSize: number
  mimeType: string
  width: number
  height: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export const backgroundImageService = {
  // Get all active background images
  async getActiveBackgroundImages(): Promise<BackgroundImage[]> {
    try {
      const response = await api.get('/api/public/background-images/active')
      return response.data
    } catch (error) {
      console.error('Error fetching active background images:', error)
      return []
    }
  },

  // Get active background image for a specific section
  async getActiveBackgroundImageForSection(sectionName: string): Promise<BackgroundImage | null> {
    try {
      const response = await api.get(`/api/public/background-images/section/${sectionName}`)
      return response.data
    } catch (error) {
      console.error(`Error fetching background image for section ${sectionName}:`, error)
      return null
    }
  },

  // Get the effective URL for a background image
  getEffectiveUrl(image: BackgroundImage): string | null {
    if (image.storageType === 's3' && image.s3Url) {
      return image.s3Url
    } else if (image.storageType === 'hybrid' && image.s3Url) {
      return image.s3Url // Prefer S3 in hybrid mode
    } else if (image.localUrl) {
      return image.localUrl
    }
    return null
  },

  // Check if image is a GIF
  isGif(image: BackgroundImage): boolean {
    return image.mimeType === 'image/gif'
  }
}
