'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { useTranslation } from '@/hooks/useTranslation'
import api from '@/services/api'
import { Bell, Calendar, Filter, Trash2, Check, Mail, Package, User } from 'lucide-react'

interface StockNotification {
  id: string
  productId: string
  productName?: string
  userId?: string
  userEmail?: string
  email: string
  notified: boolean
  notifiedAt?: string
  createdAt: string
  updatedAt: string
}

export default function AdminStockNotificationsPage() {
  const { t } = useTranslation()
  const [notifications, setNotifications] = useState<StockNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [filterDays, setFilterDays] = useState<number | null>(null)
  const [products, setProducts] = useState<Map<string, string>>(new Map())

  useEffect(() => {
    loadNotifications()
    loadProducts()
  }, [filterDays])

  const loadProducts = async () => {
    try {
      const response = await api.get('/api/products')
      const productsList = Array.isArray(response.data) ? response.data : (response.data?.content || [])
      const productMap = new Map<string, string>()
      productsList.forEach((p: any) => {
        productMap.set(p.id, p.name)
      })
      setProducts(productMap)
    } catch (error) {
      console.error('Failed to load products:', error)
    }
  }

  const loadNotifications = async () => {
    try {
      setLoading(true)
      let url = '/api/admin/stock-notifications'
      if (filterDays !== null) {
        const since = new Date()
        since.setDate(since.getDate() - filterDays)
        url += `?since=${since.toISOString()}`
      }
      const response = await api.get(url)
      const notificationsList = response.data || []
      
      // Enrich with product names
      const enriched = notificationsList.map((n: StockNotification) => ({
        ...n,
        productName: products.get(n.productId) || t('admin.stockNotifications.unknownProduct') || 'Unknown Product'
      }))
      
      setNotifications(enriched)
    } catch (error: any) {
      console.error('Failed to load notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsNotified = async (notificationId: string) => {
    try {
      await api.put(`/api/admin/stock-notifications/${notificationId}/notify`)
      loadNotifications()
    } catch (error) {
      console.error('Failed to mark as notified:', error)
      alert(t('admin.stockNotifications.failedToMarkNotified') || 'Failed to mark notification as notified')
    }
  }

  const handleDelete = async (notificationId: string) => {
    if (!confirm(t('admin.stockNotifications.deleteConfirm') || 'Are you sure you want to delete this notification request?')) {
      return
    }
    
    try {
      await api.delete(`/api/admin/stock-notifications/${notificationId}`)
      loadNotifications()
    } catch (error) {
      console.error('Failed to delete notification:', error)
      alert(t('admin.stockNotifications.failedToDelete') || 'Failed to delete notification')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Bell className="w-8 h-8 text-primary-600" />
            <h1 className="text-3xl font-bold text-gray-900">{t('admin.stockNotifications.title') || 'Stock Notifications'}</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <select
                value={filterDays || ''}
                onChange={(e) => setFilterDays(e.target.value ? parseInt(e.target.value) : null)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">{t('admin.stockNotifications.allTime') || 'All Time'}</option>
                <option value="7">{t('admin.stockNotifications.last7Days') || 'Last 7 Days'}</option>
                <option value="30">{t('admin.stockNotifications.last30Days') || 'Last 30 Days'}</option>
                <option value="90">{t('admin.stockNotifications.last90Days') || 'Last 90 Days'}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('admin.stockNotifications.totalRequests') || 'Total Requests'}</p>
                <p className="text-2xl font-bold text-gray-900">{notifications.length}</p>
              </div>
              <Bell className="w-8 h-8 text-primary-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('admin.stockNotifications.pending') || 'Pending'}</p>
                <p className="text-2xl font-bold text-orange-600">
                  {notifications.filter(n => !n.notified).length}
                </p>
              </div>
              <Mail className="w-8 h-8 text-orange-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('admin.stockNotifications.notified') || 'Notified'}</p>
                <p className="text-2xl font-bold text-green-600">
                  {notifications.filter(n => n.notified).length}
                </p>
              </div>
              <Check className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Notifications Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.stockNotifications.product') || 'Product'}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.stockNotifications.email') || 'Email'}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.stockNotifications.user') || 'User'}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.stockNotifications.status') || 'Status'}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.stockNotifications.requested') || 'Requested'}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.stockNotifications.notifiedAt') || 'Notified'}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.stockNotifications.actions') || 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {notifications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    {t('admin.stockNotifications.noNotifications') || 'No stock notification requests found'}
                  </td>
                </tr>
              ) : (
                notifications.map((notification) => (
                  <tr key={notification.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Package className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">
                          {notification.productName || notification.productId || t('admin.stockNotifications.unknownProduct') || 'Unknown Product'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{notification.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {notification.userId ? (
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{t('admin.stockNotifications.registeredUser') || 'Registered User'}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">{t('admin.stockNotifications.guest') || 'Guest'}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {notification.notified ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <Check className="w-3 h-3 mr-1" />
                          {t('admin.stockNotifications.notified') || 'Notified'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          {t('admin.stockNotifications.pending') || 'Pending'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(notification.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {notification.notifiedAt ? formatDate(notification.notifiedAt) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        {!notification.notified && (
                          <button
                            onClick={() => handleMarkAsNotified(notification.id)}
                            className="text-green-600 hover:text-green-900"
                            title={t('admin.stockNotifications.markAsNotified') || 'Mark as notified'}
                          >
                            <Check className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notification.id)}
                          className="text-red-600 hover:text-red-900"
                          title={t('admin.stockNotifications.delete') || 'Delete'}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  )
}

