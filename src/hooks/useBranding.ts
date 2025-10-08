import { useState, useEffect } from 'react'
import api from '@/services/api'

interface BrandingConfig {
  id: string
  logoUrl?: string
  logoAltText?: string
  logoWidth?: number
  logoHeight?: number
  faviconUrl?: string
  faviconType?: string
  faviconSize?: number
  shopName: string
  shopNameFontFamily?: string
  shopNameFontSize?: number
  shopNameFontWeight?: string
  shopNameFontStyle?: string
  shopNameTextColor?: string
  shopNameTextDecoration?: string
  shopNameLetterSpacing?: number
  shopNameLineHeight?: number
  tagline?: string
  taglineFontSize?: number
  taglineTextColor?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export const useBranding = () => {
  const [brandingConfig, setBrandingConfig] = useState<BrandingConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        setLoading(true)
        const response = await api.get('/api/public/branding/config')
        setBrandingConfig(response.data)
      } catch (err) {
        console.error('Failed to fetch branding config:', err)
        setError('Failed to load branding configuration.')
      } finally {
        setLoading(false)
      }
    }

    fetchBranding()
  }, [])

  const getShopNameStyle = () => {
    if (!brandingConfig) return {}
    
    return {
      fontFamily: brandingConfig.shopNameFontFamily || 'Inter',
      fontSize: `${brandingConfig.shopNameFontSize || 24}px`,
      fontWeight: brandingConfig.shopNameFontWeight || 'bold',
      fontStyle: brandingConfig.shopNameFontStyle || 'normal',
      color: brandingConfig.shopNameTextColor || '#2563eb',
      textDecoration: brandingConfig.shopNameTextDecoration || 'none',
      letterSpacing: `${brandingConfig.shopNameLetterSpacing || 0}px`,
      lineHeight: brandingConfig.shopNameLineHeight || 1.2,
    }
  }

  const getTaglineStyle = () => {
    if (!brandingConfig) return {}
    
    return {
      fontSize: `${brandingConfig.taglineFontSize || 14}px`,
      color: brandingConfig.taglineTextColor || '#6b7280',
    }
  }

  const getLogoStyle = () => {
    if (!brandingConfig) return {}
    
    return {
      width: brandingConfig.logoWidth ? `${brandingConfig.logoWidth}px` : 'auto',
      height: brandingConfig.logoHeight ? `${brandingConfig.logoHeight}px` : 'auto',
    }
  }

  const getFaviconUrl = () => {
    if (!brandingConfig?.faviconUrl) return '/favicon.ico' // Fallback to default
    return brandingConfig.faviconUrl
  }

  const getFaviconType = () => {
    if (!brandingConfig?.faviconType) return 'image/x-icon'
    return `image/${brandingConfig.faviconType}`
  }

  return {
    brandingConfig,
    loading,
    error,
    getShopNameStyle,
    getTaglineStyle,
    getLogoStyle,
    getFaviconUrl,
    getFaviconType,
  }
}
