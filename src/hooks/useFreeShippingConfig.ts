import { useState, useEffect } from 'react'
import api from '@/services/api'

interface FreeShippingConfig {
  enabled: boolean
  threshold: number
}

export function useFreeShippingConfig() {
  const [config, setConfig] = useState<FreeShippingConfig>({ enabled: false, threshold: 150 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await api.get('/api/public/free-shipping-config')
        setConfig({
          enabled: response.data.enabled ?? false,
          threshold: response.data.threshold ?? 150
        })
      } catch (error) {
        console.error('Failed to load free shipping configuration:', error)
        // Use default values on error
        setConfig({ enabled: false, threshold: 150 })
      } finally {
        setLoading(false)
      }
    }

    fetchConfig()
  }, [])

  return { config, loading }
}

