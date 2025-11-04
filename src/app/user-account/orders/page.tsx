'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { AccountLayout } from '@/components/account/AccountLayout'
import api from '@/services/api'
import { Package, Calendar, DollarSign, Download } from 'lucide-react'
import Link from 'next/link'

interface Order {
  id: string
  orderNumber: string
  status: string
  totalAmount: number
  currency: string
  createdAt?: string | OffsetDateTime
  orderDate?: string | LocalDateTime | any
  items: OrderItem[]
}

interface OrderItem {
  id: string
  productId: string
  productName: string
  productSlug?: string
  productImageUrl?: string
  quantity: number
  price: number
  unitPrice?: number
  totalPrice?: number
}

export default function OrdersPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/')
      return
    }
    if (isAuthenticated) {
      loadOrders()
    }
  }, [isAuthenticated, authLoading, router])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const response = await api.get('/api/orders', {
        params: {
          page: 0,
          size: 50,
          sortBy: 'orderDate',
          sortDir: 'desc'
        }
      })
      
      const ordersData = response.data.content || response.data || []
      setOrders(Array.isArray(ordersData) ? ordersData : [])
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load orders')
      console.error('Error loading orders:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string | null | undefined | any) => {
    console.log('[formatDate DEBUG] Input:', dateString, 'Type:', typeof dateString, 'Is array?', Array.isArray(dateString))
    if (!dateString && dateString !== 0) {
      console.log('[formatDate DEBUG] No dateString provided, returning N/A')
      return 'N/A'
    }
    try {
      let date: Date
      // Handle array format like [2025, 11, 4, 21, 18, 15, 152971000]
      if (Array.isArray(dateString)) {
        console.log('[formatDate DEBUG] Array input:', dateString)
        if (dateString.length >= 3) {
          const year = dateString[0]
          const month = dateString[1] - 1 // JavaScript months are 0-indexed
          const day = dateString[2]
          const hour = dateString[3] || 0
          const minute = dateString[4] || 0
          const second = dateString[5] || 0
          date = new Date(year, month, day, hour, minute, second)
          console.log('[formatDate DEBUG] Created Date from array:', date, 'Valid?', !isNaN(date.getTime()))
        } else {
          console.log('[formatDate DEBUG] Array too short, returning N/A')
          return 'N/A'
        }
      } else if (typeof dateString === 'number') {
        // Handle Unix timestamp (seconds or milliseconds)
        console.log('[formatDate DEBUG] Number input (timestamp):', dateString)
        // Check if it's in seconds (less than year 2000 in milliseconds) or milliseconds
        // Year 2000 in milliseconds: 946684800000
        // If less than 1e12, it's likely seconds
        if (dateString < 1000000000000) {
          // Likely in seconds, convert to milliseconds
          date = new Date(dateString * 1000)
          console.log('[formatDate DEBUG] Converted seconds to milliseconds, created Date:', date, 'Valid?', !isNaN(date.getTime()))
        } else {
          // Likely already in milliseconds
          date = new Date(dateString)
          console.log('[formatDate DEBUG] Created Date from milliseconds:', date, 'Valid?', !isNaN(date.getTime()))
        }
      } else if (typeof dateString === 'string') {
        console.log('[formatDate DEBUG] String input:', dateString)
        // Check if it's a numeric string (timestamp)
        const numericValue = parseFloat(dateString)
        if (!isNaN(numericValue) && dateString.trim().match(/^\d+\.?\d*$/)) {
          // It's a numeric string representing a timestamp
          console.log('[formatDate DEBUG] Detected numeric string timestamp:', numericValue)
          if (numericValue < 1000000000000) {
            // Likely in seconds
            date = new Date(numericValue * 1000)
            console.log('[formatDate DEBUG] Converted string seconds to milliseconds, created Date:', date)
          } else {
            // Likely in milliseconds
            date = new Date(numericValue)
            console.log('[formatDate DEBUG] Created Date from string milliseconds:', date)
          }
        } else if (dateString.includes(',') && dateString.match(/^\d+,\d+,\d+/)) {
          // Handle comma-separated format like "2025,11,4,21,18,15,152971000"
          console.log('[formatDate DEBUG] Detected comma-separated date format')
          const parts = dateString.split(',').map(p => parseInt(p.trim(), 10))
          if (parts.length >= 3) {
            // year, month, day, hour, minute, second, nano
            const year = parts[0]
            const month = parts[1] - 1 // JavaScript months are 0-indexed
            const day = parts[2]
            const hour = parts[3] || 0
            const minute = parts[4] || 0
            const second = parts[5] || 0
            date = new Date(year, month, day, hour, minute, second)
            console.log('[formatDate DEBUG] Created Date from comma-separated format:', date, 'Valid?', !isNaN(date.getTime()))
          } else {
            console.log('[formatDate DEBUG] Invalid comma-separated format, not enough parts')
            return 'N/A'
          }
        } else {
          // Handle format like "2025-11-04 15:02:08.807" (space-separated)
          if (dateString.includes(' ') && !dateString.includes('T')) {
            dateString = dateString.replace(' ', 'T')
            console.log('[formatDate DEBUG] Converted space to T:', dateString)
          }
          date = new Date(dateString)
          console.log('[formatDate DEBUG] Created Date from string:', date, 'Valid?', !isNaN(date.getTime()))
        }
      } else if (dateString instanceof Date) {
        console.log('[formatDate DEBUG] Already a Date object:', dateString)
        date = dateString
      } else if (dateString && typeof dateString === 'object') {
        console.log('[formatDate DEBUG] Object input:', JSON.stringify(dateString))
        // Handle object format from backend (LocalDateTime)
        if (dateString.year && dateString.month && dateString.day) {
          date = new Date(dateString.year, dateString.month - 1, dateString.day, 
            dateString.hour || 0, dateString.minute || 0, dateString.second || 0)
          console.log('[formatDate DEBUG] Created Date from object with year/month/day:', date)
        } else if (dateString.epochSecond !== undefined) {
          date = new Date(dateString.epochSecond * 1000)
          console.log('[formatDate DEBUG] Created Date from epochSecond:', date)
        } else if (dateString.toString && typeof dateString.toString === 'function') {
          const dateStr = dateString.toString()
          console.log('[formatDate DEBUG] Object toString() result:', dateStr)
          date = new Date(dateStr)
          console.log('[formatDate DEBUG] Created Date from toString():', date)
        } else {
          console.log('[formatDate DEBUG] Object format not recognized, returning N/A. Object keys:', Object.keys(dateString))
          return 'N/A'
        }
      } else {
        console.log('[formatDate DEBUG] Unknown type, returning N/A')
        return 'N/A'
      }
      
      if (isNaN(date.getTime()) || date.getTime() === 0) {
        console.log('[formatDate DEBUG] Invalid date (NaN or zero), returning N/A. Date value:', date)
        return 'N/A'
      }
      const formatted = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      console.log('[formatDate DEBUG] Formatted result:', formatted)
      return formatted
    } catch (error) {
      console.error('[formatDate DEBUG] Error formatting date:', dateString, error)
      return 'N/A'
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount)
  }

  const handleDownloadInvoice = async (orderId: string, orderNumber: string) => {
    try {
      const response = await api.get(`/api/orders/${orderId}/invoice`, {
        responseType: 'blob'
      })
      
      // Create a blob and download it
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Invoice_${orderNumber}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download invoice:', error)
      alert('Failed to download invoice. Please try again.')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PAID':
      case 'SHIPPED':
      case 'DELIVERED':
        return 'text-green-600'
      case 'CANCELLED':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <AccountLayout>
        <div className="space-y-6xl">
          <h1 className="type-heading-3 text-content mb-lg mt-6">ORDERS</h1>
          
          {loading && (
            <div className="flex items-center justify-center py-12">
              <p className="type-body-2 text-content">Loading orders...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="type-body-2 text-red-600">{error}</p>
            </div>
          )}

          {!loading && !error && orders.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="type-body-2 text-content mb-4">You haven't placed any orders yet.</p>
              <Link
                href="/products"
                className="inline-block px-6 py-3 bg-black text-white hover:bg-gray-800 transition-colors"
              >
                Start Shopping
              </Link>
            </div>
          )}

          {!loading && !error && orders.length > 0 && (
            <div className="space-y-6">
              {orders.map((order) => (
                <div key={order.id} className="border-b border-black pb-6 last:border-b-0">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                    <div>
                      <h2 className="type-heading-6 text-content mb-2">
                        Order #{order.orderNumber || order.id.substring(0, 8)}
                      </h2>
                      <div className="flex items-center gap-4 text-sm text-content">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(order.orderDate || order.createdAt)}</span>
                        </div>
                        <span className={`font-semibold ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5" />
                        <span className="type-heading-6 text-content">
                          {formatCurrency(order.totalAmount, order.currency)}
                        </span>
                      </div>
                      {order.status === 'CONFIRMED' || order.status === 'PROCESSING' || order.status === 'SHIPPED' || order.status === 'DELIVERED' ? (
                        <button
                          onClick={() => handleDownloadInvoice(order.id, order.orderNumber || order.id.substring(0, 8))}
                          className="flex items-center gap-2 px-4 py-2 border border-black text-black hover:bg-gray-100 transition-colors text-sm"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download Invoice</span>
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {order.items && order.items.length > 0 && (
                    <div className="space-y-4 mt-4">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex gap-4 items-start">
                          {item.productImageUrl ? (
                            <Link href={item.productSlug ? `/products/${item.productSlug}` : '#'} className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded overflow-hidden hover:opacity-80 transition-opacity">
                              <img
                                src={item.productImageUrl}
                                alt={item.productName}
                                className="w-full h-full object-cover"
                              />
                            </Link>
                          ) : (
                            <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                              <Package className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            {item.productSlug ? (
                              <Link href={`/products/${item.productSlug}`} className="font-medium text-content hover:text-gray-600 transition-colors block">
                                {item.productName}
                              </Link>
                            ) : (
                              <p className="font-medium text-content">{item.productName}</p>
                            )}
                            <p className="text-sm text-content opacity-75">Quantity: {item.quantity}</p>
                            <p className="text-sm font-medium text-content mt-1">
                              {formatCurrency((item.totalPrice || item.unitPrice || item.price) * item.quantity, order.currency)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </AccountLayout>
      <Footer />
    </div>
  )
}

