import { useState, useEffect } from 'react'
import { websiteStatusService, WebsiteStatus } from '@/services/websiteStatusService'

export const useWebsiteStatus = () => {
  const [websiteStatus, setWebsiteStatus] = useState<WebsiteStatus>({ status: 'normal' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchWebsiteStatus = async () => {
      try {
        setLoading(true)
        setError(null)
        const status = await websiteStatusService.getWebsiteStatus()
        setWebsiteStatus(status)
      } catch (err) {
        console.error('Error fetching website status:', err)
        setError('Failed to load website status')
        // Set fallback status
        setWebsiteStatus({ status: 'normal' })
      } finally {
        setLoading(false)
      }
    }

    fetchWebsiteStatus()
  }, [])

  return {
    websiteStatus,
    loading,
    error,
    isNormal: websiteStatus.status === 'normal',
    isConstruction: websiteStatus.status === 'construction',
    isVacation: websiteStatus.status === 'vacation'
  }
}



