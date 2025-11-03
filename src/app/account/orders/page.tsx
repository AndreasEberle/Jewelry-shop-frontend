'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { AccountLayout } from '@/components/account/AccountLayout'
import api from '@/services/api'
import { Package, Calendar, DollarSign } from 'lucide-react'
import Link from 'next/link'

interface Order {
  id: string
  orderNumber: string
  status: string
  totalAmount: number
  currency?: string
  orderDate?: string
  createdAt?: string
  updatedAt?: string
  items: OrderItem[]
  customerEmail?: string
  customerName?: string
  trackingNumber?: string
  carrier?: string
  trackingLink?: string
  estimatedDeliveryDays?: number
  discountCode?: string
  discountAmount?: number
  shippingAmount?: number
  taxAmount?: number
  payment?: {
    status: string
    transactionId?: string
  }
}

interface OrderItem {
  id: string
  productId: string
  productName: string
  productSlug?: string
  productImageUrl?: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadOrders()
  }, [])

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
      
      // Handle paginated response (Page) or direct array
      let ordersData = []
      if (response.data.content) {
        // It's a Page object
        ordersData = response.data.content
      } else if (Array.isArray(response.data)) {
        // It's a direct array
        ordersData = response.data
      }
      
      console.log('Loaded orders:', ordersData)
      setOrders(ordersData)
    } catch (err: any) {
      // If regular orders endpoint fails, try admin endpoint
      try {
        const adminResponse = await api.get('/api/admin/orders', {
          params: {
            page: 0,
            size: 50,
            sortBy: 'createdAt',
            sortOrder: 'desc'
          }
        })
        const ordersData = adminResponse.data.content || adminResponse.data || []
        setOrders(Array.isArray(ordersData) ? ordersData : [])
      } catch (adminErr: any) {
        setError(adminErr.response?.data?.message || 'Failed to load orders')
        console.error('Error loading orders:', adminErr)
      }
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'N/A'
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return 'N/A'
    }
  }

  const formatCurrency = (amount: number, currency: string = 'CHF') => {
    // Use CHF as default, not USD
    const currencyCode = currency || 'CHF'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'CONFIRMED':
      case 'PROCESSING':
      case 'SHIPPED':
      case 'DELIVERED':
        return 'text-green-600'
      case 'CANCELLED':
      case 'REFUNDED':
        return 'text-red-600'
      case 'PENDING':
        return 'text-yellow-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <AccountLayout>
        <div className="space-y-6xl">
          <h1 className="type-heading-3 text-content" style={{ paddingBottom: '24px', fontSize: '1.5rem', fontWeight: 'bold' }}>ORDERS</h1>
          
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
              <p className="type-body-2 text-content mb-4">No orders found.</p>
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
                      {order.customerName && (
                        <p className="type-body-3 text-content mb-1">
                          Customer: {order.customerName}
                        </p>
                      )}
                      {order.customerEmail && (
                        <p className="type-body-3 text-content mb-2">
                          {order.customerEmail}
                        </p>
                      )}
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
                    <div className="flex items-center gap-2">
                      <span className="type-heading-6 text-content">
                        {formatCurrency(order.totalAmount, order.currency || 'CHF')}
                      </span>
                    </div>
                  </div>

                  {order.items && order.items.length > 0 && (
                    <div className="space-y-4 mt-4">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex gap-4 items-start">
                          {item.productImageUrl && (
                            <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                              <img
                                src={item.productImageUrl}
                                alt={item.productName}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-content">{item.productName}</p>
                            <p className="text-sm text-content opacity-75">Quantity: {item.quantity}</p>
                            <p className="text-sm font-medium text-content mt-1">
                              {formatCurrency(item.totalPrice || (item.unitPrice * item.quantity), order.currency || 'CHF')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Discount Code */}
                  {order.discountCode && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                      <p className="text-sm text-content">
                        <span className="font-medium">Discount Code:</span> {order.discountCode}
                        {order.discountAmount && (
                          <span className="ml-2 text-green-600 font-medium">
                            -{formatCurrency(order.discountAmount, order.currency || 'CHF')}
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                  
                  {/* Tracking Information */}
                  {(order.trackingNumber || order.trackingLink) && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                      {order.trackingLink ? (
                        <div>
                          <a 
                            href={order.trackingLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 underline font-medium"
                          >
                            Track Your Order →
                          </a>
                          {order.trackingNumber && (
                            <p className="text-sm text-content mt-2">
                              <span className="font-medium">Tracking Number:</span> {order.trackingNumber}
                              {order.carrier && (
                                <span className="ml-2 opacity-75">({order.carrier})</span>
                              )}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-content">
                          <span className="font-medium">Tracking:</span> {order.trackingNumber}
                          {order.carrier && (
                            <span className="ml-2 opacity-75">({order.carrier})</span>
                          )}
                        </p>
                      )}
                      {order.estimatedDeliveryDays && (
                        <p className="text-sm text-content mt-2">
                          <span className="font-medium">Estimated delivery:</span> {order.estimatedDeliveryDays} {order.estimatedDeliveryDays === 1 ? 'day' : 'days'}
                        </p>
                      )}
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

