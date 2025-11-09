import { useState, useEffect } from 'react'
import api from '@/services/api'

interface CartAlertConfig {
  enabled: boolean
  message: string
}

export function useCartAlertConfig() {
  const [config, setConfig] = useState<CartAlertConfig>({ 
    enabled: true, 
    message: 'GET IT OR REGRET IT: These styles are going fast.' 
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const [enabledResponse, messageResponse] = await Promise.all([
          api.get('/api/public/system-config/cart.alert.enabled'),
          api.get('/api/public/system-config/cart.alert.message')
        ])
        
        const enabled = enabledResponse.data?.value === 'true' || enabledResponse.data?.value === true
        const message = messageResponse.data?.value || 'GET IT OR REGRET IT: These styles are going fast.'
        
        setConfig({ enabled, message })
      } catch (error) {
        console.error('Failed to load cart alert config:', error)
        // Keep defaults on error
      } finally {
        setLoading(false)
      }
    }
    
    loadConfig()
  }, [])

  return { config, loading }
}

