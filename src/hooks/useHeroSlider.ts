import { useState, useEffect } from 'react'
import api from '@/services/api'

// Cache for hero slider data to prevent excessive API calls
let heroSliderCache: { 
  config: HeroSliderConfig | null, 
  images: BackgroundImage[], 
  timestamp: number 
} | null = null
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

interface HeroSliderConfig {
  id: string
  isEnabled: boolean
  autoPlay: boolean
  slideDurationSeconds: number
  showIndicators: boolean
  showArrows: boolean
  transitionEffect: string
  createdAt: string
  updatedAt: string
}

interface BackgroundImage {
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

export const useHeroSlider = () => {
  const [sliderConfig, setSliderConfig] = useState<HeroSliderConfig | null>(null)
  const [heroImages, setHeroImages] = useState<BackgroundImage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Check cache first
        const now = Date.now()
        if (heroSliderCache && (now - heroSliderCache.timestamp) < CACHE_DURATION) {
          console.log('Using cached hero slider data')
          setSliderConfig(heroSliderCache.config)
          setHeroImages(heroSliderCache.images)
          setLoading(false)
          return
        }
        
        // Fetch slider configuration
        const configResponse = await api.get('/api/public/hero-slider/config')
        console.log('Slider config response:', configResponse.data)
        setSliderConfig(configResponse.data)
        
        // If slider is disabled, we can still show single images
        if (configResponse.data && !configResponse.data.isEnabled) {
          console.log('Slider is disabled, will show single image mode')
        }
        
        // Fetch hero background images
        const imagesResponse = await api.get('/api/public/background-images/section/hero')
        const images = imagesResponse.data
        
        // Handle both single object and array responses
        let processedImages: BackgroundImage[] = []
        if (Array.isArray(images)) {
          processedImages = images
          setHeroImages(images)
          console.log('Loaded hero images (array):', images.length, 'images')
        } else if (images && typeof images === 'object') {
          // Single image object - wrap it in an array
          processedImages = [images]
          setHeroImages([images])
          console.log('Loaded hero images (single object):', images)
        } else {
          console.warn('Hero images response is neither array nor object:', images)
          processedImages = []
          setHeroImages([])
        }
        
        // Update cache
        heroSliderCache = { 
          config: configResponse.data, 
          images: processedImages, 
          timestamp: now 
        }
        
      } catch (err) {
        console.error('Failed to fetch hero slider data:', err)
        setError('Failed to load hero slider data.')
        // Ensure we always have an array even on error
        setHeroImages([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const getEffectiveImageUrls = (): string[] => {
    // Ensure heroImages is always an array
    if (!Array.isArray(heroImages)) {
      console.warn('heroImages is not an array:', heroImages)
      return []
    }
    
    console.log('Processing hero images:', heroImages)
    
    const urls = heroImages
      .filter(image => image && image.isActive)
      .map(image => {
        console.log('Processing image:', image)
        if (image.storageType === 's3' && image.s3Url) {
          console.log('Using S3 URL:', image.s3Url)
          return image.s3Url
        } else if (image.storageType === 'hybrid' && image.s3Url) {
          console.log('Using S3 URL (hybrid):', image.s3Url)
          return image.s3Url // Prefer S3 in hybrid mode
        } else if (image.localUrl) {
          console.log('Using local URL:', image.localUrl)
          return image.localUrl
        }
        console.log('No valid URL found for image:', image)
        return null
      })
      .filter((url): url is string => url !== null)
    
    console.log('Final image URLs:', urls)
    return urls
  }

  return {
    sliderConfig,
    heroImages,
    imageUrls: getEffectiveImageUrls(),
    loading,
    error
  }
}
