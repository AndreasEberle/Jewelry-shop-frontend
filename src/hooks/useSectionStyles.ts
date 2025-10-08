import { useState, useEffect } from 'react'
import api from '@/services/api'

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

  useEffect(() => {
    const fetchSectionStyles = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await api.get('/api/public/section-styles/active')
        setSectionStyles(response.data)
      } catch (err) {
        console.error('Failed to fetch section styles:', err)
        setError('Failed to load section styles.')
      } finally {
        setLoading(false)
      }
    }

    fetchSectionStyles()
  }, [])

  const getStyleForSection = (sectionName: string): SectionStyle | null => {
    return sectionStyles.find(style => style.sectionName === sectionName) || null
  }

  const getBackgroundStyle = (sectionName: string): React.CSSProperties => {
    const style = getStyleForSection(sectionName)
    if (!style) return {}

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
