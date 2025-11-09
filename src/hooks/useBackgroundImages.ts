import { useState, useEffect } from 'react'
import { backgroundImageService, BackgroundImage } from '@/services/backgroundImageService'

export function useBackgroundImages() {
  const [backgroundImages, setBackgroundImages] = useState<BackgroundImage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadBackgroundImages()
  }, [])

  const loadBackgroundImages = async () => {
    try {
      setLoading(true)
      setError(null)
      const images = await backgroundImageService.getActiveBackgroundImages()
      setBackgroundImages(images)
    } catch (err) {
      setError('Failed to load background images')
      console.error('Error loading background images:', err)
    } finally {
      setLoading(false)
    }
  }

  const getBackgroundImageForSection = (sectionName: string): BackgroundImage | null => {
    return backgroundImages.find(img => img.sectionName === sectionName) || null
  }

  const getBackgroundUrlForSection = (sectionName: string): string | null => {
    const image = getBackgroundImageForSection(sectionName)
    return image ? backgroundImageService.getEffectiveUrl(image) : null
  }

  const getBackgroundMimeTypeForSection = (sectionName: string): string | null => {
    const image = getBackgroundImageForSection(sectionName)
    return image ? image.mimeType : null
  }

  return {
    backgroundImages,
    loading,
    error,
    getBackgroundImageForSection,
    getBackgroundUrlForSection,
    getBackgroundMimeTypeForSection,
    refresh: loadBackgroundImages
  }
}
