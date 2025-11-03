import { useState, useEffect } from 'react'
import api from '@/services/api'

interface CurrencyConfig {
  enabled: boolean
}

export function useCurrencyConfig() {
  const [config, setConfig] = useState<CurrencyConfig>({ enabled: false })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await api.get('/api/public/system-config/navbar.currency.enabled')
        const value = response.data?.value
        // Default to disabled (false) if not set or not "true"
        setConfig({ enabled: value === 'true' || value === true })
      } catch (error) {
        console.error('Failed to load currency config:', error)
        setConfig({ enabled: false }) // Default to disabled
      } finally {
        setLoading(false)
      }
    }
    
    loadConfig()
  }, [])

  return { config, loading }
}



