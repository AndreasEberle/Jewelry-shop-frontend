import { useEffect } from 'react'
import { useBranding } from './useBranding'

export const useFavicon = () => {
  const { getFaviconUrl, getFaviconType, loading } = useBranding()

  useEffect(() => {
    if (loading) return

    const faviconUrl = getFaviconUrl()
    const faviconType = getFaviconType()

    // Update the favicon link in the document head
    const updateFavicon = () => {
      // Remove existing favicon links
      const existingFavicons = document.querySelectorAll('link[rel*="icon"]')
      existingFavicons.forEach(link => link.remove())

      // Add new favicon link
      const link = document.createElement('link')
      link.rel = 'icon'
      link.type = faviconType
      link.href = faviconUrl
      document.head.appendChild(link)

      // Also add apple-touch-icon for better mobile support
      const appleLink = document.createElement('link')
      appleLink.rel = 'apple-touch-icon'
      appleLink.href = faviconUrl
      document.head.appendChild(appleLink)
    }

    updateFavicon()
  }, [getFaviconUrl, getFaviconType, loading])
}
