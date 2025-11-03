import { useState, useEffect } from 'react'
import api from '@/services/api'

export function useFontFamily() {
  const [fontFamily, setFontFamily] = useState<string>('SyndicatGrotesk, Arial, Helvetica, sans-serif')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadFontFamily = async () => {
      try {
        const response = await api.get('/api/public/system-config/app.typography.fontFamily')
        if (response.data?.value) {
          setFontFamily(response.data.value)
        }
      } catch (error) {
        console.error('Error loading font family:', error)
        // Keep default value
      } finally {
        setLoading(false)
      }
    }

    loadFontFamily()
  }, [])

  useEffect(() => {
    // Apply font family to document root with !important to override globals.css
    if (fontFamily && !loading) {
      document.documentElement.style.setProperty('font-family', fontFamily, 'important')
    }
  }, [fontFamily, loading])

  return { fontFamily, loading }
}

