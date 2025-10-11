import { useState, useEffect } from 'react'
import api from '@/services/api'

// Cache for section styles to prevent excessive API calls
let sectionStylesCache: { data: SectionStyle[], timestamp: number } | null = null
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

interface SectionStyle {
  id: string
  sectionName: string
  backgroundImageUrl?: string
  backgroundColor?: string
  textColor?: string
  overlayColor?: string
  overlayOpacity?: number
  backgroundSize?: string
  backgroundPosition?: string
  backgroundRepeat?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export const useSectionStyles = () => {
  const [sectionStyles, setSectionStyles] = useState<SectionStyle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    const fetchSectionStyles = async (retryAttempt = 0) => {
      try {
        setLoading(true)
        setError(null)
        
        // Check cache first
        const now = Date.now()
        if (sectionStylesCache && (now - sectionStylesCache.timestamp) < CACHE_DURATION) {
          console.log('Using cached section styles')
          setSectionStyles(sectionStylesCache.data)
          setLoading(false)
          return
        }
        
        console.log(`Fetching section styles... (attempt ${retryAttempt + 1})`)
        
        // Test if the API is accessible
        const response = await api.get('/api/public/section-styles/active')
        console.log('Section styles response:', response.data)
        console.log('Response status:', response.status)
        
        if (response.data && Array.isArray(response.data)) {
          setSectionStyles(response.data)
          // Update cache
          sectionStylesCache = { data: response.data, timestamp: now }
          setRetryCount(0) // Reset retry count on success
        } else {
          console.warn('Section styles response is not an array:', response.data)
          setSectionStyles([])
        }
      } catch (err: any) {
        console.error('Failed to fetch section styles:', err)
        console.error('Error details:', err.response?.data || err.message)
        console.error('Error status:', err.response?.status)
        
        // Handle rate limiting (429) with exponential backoff
        if (err.response?.status === 429 && retryAttempt < 3) {
          const delay = Math.pow(2, retryAttempt) * 1000 // 1s, 2s, 4s
          console.log(`Rate limited. Retrying in ${delay}ms...`)
          setRetryCount(retryAttempt + 1)
          setTimeout(() => {
            fetchSectionStyles(retryAttempt + 1)
          }, delay)
          return
        }
        
        setError('Failed to load section styles.')
        // Set empty array on error to prevent infinite loading
        setSectionStyles([])
      } finally {
        if (retryCount === 0) { // Only set loading false if not retrying
          setLoading(false)
        }
      }
    }

    fetchSectionStyles()
  }, [])

  const getStyleForSection = (sectionName: string): SectionStyle | null => {
    return sectionStyles.find(style => style.sectionName === sectionName) || null
  }

  const getBackgroundStyle = (sectionName: string): React.CSSProperties => {
    const style = getStyleForSection(sectionName)
    console.log(`Getting background style for ${sectionName}:`, style)
    if (!style) {
      console.log(`No style found for ${sectionName}, returning empty object`)
      return {}
    }

    const cssStyle: React.CSSProperties = {}

    if (style.backgroundImageUrl) {
      cssStyle.backgroundImage = `url(${style.backgroundImageUrl})`
    }

    if (style.backgroundColor) {
      cssStyle.backgroundColor = style.backgroundColor
    }

    if (style.backgroundSize) {
      cssStyle.backgroundSize = style.backgroundSize
    }

    if (style.backgroundPosition) {
      cssStyle.backgroundPosition = style.backgroundPosition
    }

    if (style.backgroundRepeat) {
      cssStyle.backgroundRepeat = style.backgroundRepeat as any
    }

    console.log(`Final background style for ${sectionName}:`, cssStyle)
    return cssStyle
  }

  const getTextStyle = (sectionName: string): React.CSSProperties => {
    const style = getStyleForSection(sectionName)
    if (!style || !style.textColor) return {}

    return {
      color: style.textColor
    }
  }

  const getOverlayStyle = (sectionName: string): React.CSSProperties => {
    const style = getStyleForSection(sectionName)
    if (!style || !style.overlayColor || style.overlayOpacity === undefined) return {}

    return {
      backgroundColor: style.overlayColor,
      opacity: style.overlayOpacity
    }
  }

  const getSectionClasses = (sectionName: string): string => {
    const style = getStyleForSection(sectionName)
    if (!style) return ''

    let classes = ''
    
    // Add text color classes if needed
    if (style.textColor) {
      // You can add custom classes based on text color
      classes += ' '
    }

    return classes.trim()
  }

  return {
    sectionStyles,
    loading,
    error,
    getStyleForSection,
    getBackgroundStyle,
    getTextStyle,
    getOverlayStyle,
    getSectionClasses
  }
}
