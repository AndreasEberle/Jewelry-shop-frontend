'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { AccountLayout } from '@/components/account/AccountLayout'
import api from '@/services/api'
import { Package, Calendar, DollarSign, CheckCircle2, Circle, Truck, Clock } from 'lucide-react'
import Link from 'next/link'

interface Order {
  id: string
  orderNumber: string
  status: string
  totalAmount: number
  currency?: string
  orderDate?: string | null
  createdAt?: string | OffsetDateTime | null
  updatedAt?: string | null
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
      // Log first order to debug structure
      if (ordersData.length > 0) {
        console.log('First order structure:', JSON.stringify(ordersData[0], null, 2))
        console.log('First order createdAt:', ordersData[0].createdAt)
        console.log('First order items:', ordersData[0].items)
        if (ordersData[0].items && ordersData[0].items.length > 0) {
          console.log('First item:', ordersData[0].items[0])
        }
      }
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

  const formatDate = (dateString: string | null | undefined | any) => {
    if (!dateString) return 'N/A'
    try {
      let date: Date
      if (typeof dateString === 'string') {
        // Handle OffsetDateTime format (e.g., "2024-01-15T10:30:00+01:00" or "2024-01-15T10:30:00Z")
        // Also handle LocalDateTime format (e.g., "2024-01-15T10:30:00")
        date = new Date(dateString)
      } else if (dateString instanceof Date) {
        date = dateString
      } else if (dateString && typeof dateString === 'object') {
        // Handle OffsetDateTime/LocalDateTime object from backend (Jackson serialization)
        // Try common object formats
        if (dateString.year && dateString.month && dateString.day) {
          date = new Date(dateString.year, dateString.month - 1, dateString.day, 
            dateString.hour || 0, dateString.minute || 0, dateString.second || 0)
        } else if (dateString.toString && typeof dateString.toString === 'function') {
          // Try toString method if available
          try {
            date = new Date(dateString.toString())
          } catch {
            return 'N/A'
          }
        } else if (dateString.epochSecond !== undefined) {
          // Handle Java Instant format
          date = new Date(dateString.epochSecond * 1000)
        } else {
          return 'N/A'
        }
      } else {
        return 'N/A'
      }
      
      if (isNaN(date.getTime()) || date.getTime() === 0) return 'N/A'
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      console.error('Error formatting date:', dateString, error)
      return 'N/A'
    }
  }

  const getOrderStatusSteps = (status: string) => {
    const steps = [
      { key: 'CONFIRMED', label: 'Confirmed', icon: CheckCircle2 },
      { key: 'PROCESSING', label: 'Processing', icon: Clock },
      { key: 'SHIPPED', label: 'Shipped', icon: Truck },
      { key: 'DELIVERED', label: 'Delivered', icon: CheckCircle2 }
    ]
    
    const currentStatusIndex = steps.findIndex(s => s.key === status.toUpperCase())
    return steps.map((step, index) => ({
      ...step,
      completed: currentStatusIndex >= index,
      current: currentStatusIndex === index
    }))
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
          <h1 className="type-heading-3 text-content mt-6" style={{ paddingBottom: '24px', fontSize: '1.5rem', fontWeight: 'bold' }}>ORDERS</h1>
          
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
                      <h2 className="type-heading-6 text-content mb-2" style={{ fontWeight: 'bold' }}>
                        Order #{order.orderNumber || order.id.substring(0, 8)}
                      </h2>
                      <div className="flex items-center gap-4 text-sm text-content">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(order.createdAt || order.orderDate)}</span>
                        </div>
                        <span className={`font-semibold ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="type-heading-6 text-content" style={{ fontWeight: 'bold' }}>
                        {formatCurrency(order.totalAmount, order.currency || 'CHF')}
                      </span>
                    </div>
                  </div>

                  {/* Order Status Tracking */}
                  {(order.status === 'CONFIRMED' || order.status === 'PROCESSING' || order.status === 'SHIPPED' || order.status === 'DELIVERED') && (
                    <div className="mt-6 mb-6">
                      <div className="flex items-center justify-between relative">
                        {getOrderStatusSteps(order.status).map((step, index) => {
                          const Icon = step.icon
                          const isLast = index === getOrderStatusSteps(order.status).length - 1
                          return (
                            <div key={step.key} className="flex items-center flex-1">
                              <div className="flex flex-col items-center relative z-10">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                                  step.completed 
                                    ? 'bg-green-500 border-green-500 text-white' 
                                    : step.current
                                    ? 'bg-blue-500 border-blue-500 text-white'
                                    : 'bg-white border-gray-300 text-gray-400'
                                }`}>
                                  <Icon className="w-5 h-5" />
                                </div>
                                <span className={`mt-2 text-xs font-medium ${
                                  step.completed || step.current ? 'text-gray-900' : 'text-gray-400'
                                }`}>
                                  {step.label}
                                </span>
                              </div>
                              {!isLast && (
                                <div className={`flex-1 h-0.5 mx-2 ${
                                  step.completed ? 'bg-green-500' : 'bg-gray-300'
                                }`} />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {order.items && order.items.length > 0 && (
                    <div className="space-y-4 mt-6">
                      {order.items.map((item) => {
                        const productLink = item.productSlug ? `/products/${item.productSlug}` : null
                        return (
                          <div key={item.id} className={`flex gap-6 items-start ${productLink ? 'cursor-pointer' : ''}`}>
                            {productLink ? (
                              <Link href={productLink} className="w-32 h-32 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden hover:opacity-90 transition-opacity shadow-sm">
                                {item.productImageUrl ? (
                                  <img
                                    src={item.productImageUrl}
                                    alt={item.productName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Package className="w-12 h-12 text-gray-400" />
                                  </div>
                                )}
                              </Link>
                            ) : (
                              <div className="w-32 h-32 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center shadow-sm">
                                {item.productImageUrl ? (
                                  <img
                                    src={item.productImageUrl}
                                    alt={item.productName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Package className="w-12 h-12 text-gray-400" />
                                )}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              {productLink ? (
                                <Link href={productLink} className="font-medium text-lg text-content hover:text-gray-600 transition-colors block mb-2">
                                  {item.productName}
                                </Link>
                              ) : (
                                <p className="font-medium text-lg text-content mb-2">{item.productName}</p>
                              )}
                              <p className="text-sm text-content opacity-75 mb-1">Quantity: {item.quantity}</p>
                              <p className="text-base font-semibold text-content">
                                {formatCurrency(item.totalPrice || (item.unitPrice * item.quantity), order.currency || 'CHF')}
                              </p>
                            </div>
                          </div>
                        )
                      })}
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
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h3 className="font-semibold text-content mb-3">Shipping Information</h3>
                      {order.trackingLink ? (
                        <div className="space-y-2">
                          <a 
                            href={order.trackingLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-base text-blue-600 hover:text-blue-800 underline font-medium"
                          >
                            Track Your Order →
                          </a>
                          {order.trackingNumber && (
                            <p className="text-sm text-content">
                              <span className="font-medium">Tracking Number:</span> <span className="font-mono">{order.trackingNumber}</span>
                              {order.carrier && (
                                <span className="ml-2 opacity-75">({order.carrier})</span>
                              )}
                            </p>
                          )}
                        </div>
                      ) : order.trackingNumber ? (
                        <p className="text-sm text-content">
                          <span className="font-medium">Tracking Number:</span> <span className="font-mono">{order.trackingNumber}</span>
                          {order.carrier && (
                            <span className="ml-2 opacity-75">({order.carrier})</span>
                          )}
                        </p>
                      ) : null}
                      {order.estimatedDeliveryDays && (
                        <p className="text-sm text-content mt-3">
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

