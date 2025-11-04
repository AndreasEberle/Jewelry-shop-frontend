import { useState, useEffect } from 'react'
import api from '@/services/api'
import { useAuth } from '@/contexts/AuthContext'

interface OrderStats {
  totalOrders: number
  ordersByStatus: Record<string, number>
  recentOrders: number
  totalRevenue: number
}

export function useOrderStats() {
  const [stats, setStats] = useState<OrderStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const isAdmin = user?.roles?.includes('ADMIN')

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false)
      return
    }

    const loadStats = async () => {
      try {
        setLoading(true)
        const response = await api.get('/api/admin/orders/stats')
        setStats(response.data)
        setError(null)
      } catch (err: any) {
        // Only set error if it's not a 403 (forbidden) - user might not be admin
        if (err.response?.status !== 403) {
          setError(err.response?.data?.message || 'Failed to load order statistics')
          console.error('Error loading order stats:', err)
        }
      } finally {
        setLoading(false)
      }
    }

    loadStats()
    // Refresh stats every 30 seconds
    const interval = setInterval(loadStats, 30000)
    return () => clearInterval(interval)
  }, [isAdmin])

  // Calculate counts for specific statuses
  const getNonDeliveredCount = () => {
    if (!stats?.ordersByStatus) return 0
    const delivered = stats.ordersByStatus.DELIVERED || 0
    return stats.totalOrders - delivered
  }

  const getStatusCount = (status: string) => {
    return stats?.ordersByStatus?.[status] || 0
  }

  return {
    stats,
    loading,
    error,
    getNonDeliveredCount,
    getStatusCount
  }
}

