'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { AccountLayout } from '@/components/account/AccountLayout'
import api from '@/services/api'
import { Package, Calendar, DollarSign, CheckCircle2, Circle, Truck, Clock, Download, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'

interface Order {
  id: string
  orderNumber: string
  status: string
  totalAmount: number
  currency?: string
  orderDate?: string | null
  createdAt?: string | null
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
  const [expandedShipping, setExpandedShipping] = useState<Record<string, boolean>>({})

  // Calculate estimated delivery date (working days, skip weekends)
  const calculateEstimatedDeliveryDate = (orderDate: Date | null, estimatedDays: number): Date | null => {
    if (!orderDate || !estimatedDays) return null
    
    let currentDate = new Date(orderDate)
    let workingDaysAdded = 0
    
    while (workingDaysAdded < estimatedDays) {
      currentDate.setDate(currentDate.getDate() + 1)
      const dayOfWeek = currentDate.getDay()
      // Skip weekends (Saturday = 6, Sunday = 0)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workingDaysAdded++
      }
    }
    
    return currentDate
  }

  // Helper to get order date as Date object
  const getOrderDate = (order: Order): Date | null => {
    try {
      const dateStr = order.orderDate || order.createdAt
      if (!dateStr) return null
      
      if (Array.isArray(dateStr)) {
        return new Date(dateStr[0], dateStr[1] - 1, dateStr[2], dateStr[3] || 0, dateStr[4] || 0, dateStr[5] || 0)
      } else if (typeof dateStr === 'number') {
        return new Date(dateStr < 1000000000000 ? dateStr * 1000 : dateStr)
      } else if (typeof dateStr === 'string') {
        if (dateStr.includes(',')) {
          const parts = dateStr.split(',').map(p => parseInt(p.trim(), 10))
          if (parts.length >= 3) {
            return new Date(parts[0], parts[1] - 1, parts[2], parts[3] || 0, parts[4] || 0, parts[5] || 0)
          }
        }
        const numericValue = parseFloat(dateStr)
        if (!isNaN(numericValue) && dateStr.trim().match(/^\d+\.?\d*$/)) {
          return new Date(numericValue < 1000000000000 ? numericValue * 1000 : numericValue)
        }
        return new Date(dateStr)
      }
      return null
    } catch {
      return null
    }
  }

  useEffect(() => {
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
          ordersData = response.data.content
        } else if (Array.isArray(response.data)) {
          ordersData = response.data
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
    
    loadOrders()
  }, [])

  const formatDate = (dateString: string | null | undefined | any) => {
    console.log('[formatDate DEBUG] Input:', dateString, 'Type:', typeof dateString, 'Is array?', Array.isArray(dateString), 'Is object?', typeof dateString === 'object' && dateString !== null)
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
        // Year 2000 in seconds: 946684800
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
          // Handle OffsetDateTime format (e.g., "2024-01-15T10:30:00+01:00" or "2024-01-15T10:30:00Z")
          // Also handle LocalDateTime format (e.g., "2024-01-15T10:30:00")
          date = new Date(dateString)
          console.log('[formatDate DEBUG] Created Date from string:', date, 'Valid?', !isNaN(date.getTime()))
        }
      } else if (dateString instanceof Date) {
        console.log('[formatDate DEBUG] Already a Date object:', dateString)
        date = dateString
      } else if (dateString && typeof dateString === 'object') {
        console.log('[formatDate DEBUG] Object input:', JSON.stringify(dateString))
        // Handle OffsetDateTime/LocalDateTime object from backend (Jackson serialization)
        // Try common object formats
        if (dateString.year && dateString.month && dateString.day) {
          date = new Date(dateString.year, dateString.month - 1, dateString.day, 
            dateString.hour || 0, dateString.minute || 0, dateString.second || 0)
          console.log('[formatDate DEBUG] Created Date from object with year/month/day:', date)
        } else if (dateString.epochSecond !== undefined) {
          // Handle Java Instant format
          date = new Date(dateString.epochSecond * 1000)
          console.log('[formatDate DEBUG] Created Date from epochSecond:', date)
        } else if (dateString.toString && typeof dateString.toString === 'function') {
          // Try toString method if available
          try {
            const dateStr = dateString.toString()
            console.log('[formatDate DEBUG] Object toString() result:', dateStr)
            date = new Date(dateStr)
            console.log('[formatDate DEBUG] Created Date from toString():', date)
          } catch {
            console.log('[formatDate DEBUG] toString() failed, returning N/A')
            return 'N/A'
          }
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
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
      console.log('[formatDate DEBUG] Formatted result:', formatted)
      return formatted
    } catch (error) {
      console.error('[formatDate DEBUG] Error formatting date:', dateString, error)
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
              {orders.map((order) => {
                const orderDate = getOrderDate(order)
                const estimatedDeliveryDate = orderDate ? calculateEstimatedDeliveryDate(orderDate, order.estimatedDeliveryDays || 4) : null
                const isShippingExpanded = expandedShipping[order.id] || false
                
                return (
                  <div key={order.id} className="border-b border-black pb-6 last:border-b-0">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                    <div>
                      <h2 className="type-heading-6 text-content mb-2" style={{ fontWeight: 'bold' }}>
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
                      <span className="type-heading-6 text-content" style={{ fontWeight: 'bold' }}>
                        {formatCurrency(order.totalAmount, order.currency || 'CHF')}
                      </span>
                      {(order.status === 'CONFIRMED' || order.status === 'PROCESSING' || order.status === 'SHIPPED' || order.status === 'DELIVERED') && (
                        <button
                          onClick={() => handleDownloadInvoice(order.id, order.orderNumber || order.id.substring(0, 8))}
                          className="flex items-center gap-2 px-4 py-2 border border-black text-black hover:bg-gray-100 transition-colors text-sm"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download Invoice</span>
                        </button>
                      )}
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
                  
                  {/* Tracking Information - Collapsible */}
                  {(order.trackingNumber || order.trackingLink || order.estimatedDeliveryDays) && (
                    <div className="mt-6 border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedShipping(prev => ({
                          ...prev,
                          [order.id]: !prev[order.id]
                        }))}
                        className="w-full p-4 bg-blue-50 border-b border-blue-200 flex items-center justify-between hover:bg-blue-100 transition-colors"
                      >
                        <h3 className="font-semibold text-content">Shipping Information</h3>
                        {isShippingExpanded ? (
                          <ChevronUp className="w-5 h-5 text-content" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-content" />
                        )}
                      </button>
                      {isShippingExpanded && (
                        <div className="p-4 bg-white space-y-3">
                          {order.trackingLink ? (
                            <div className="space-y-2">
                              <a 
                                href="#"
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-base text-blue-600 hover:text-blue-800 underline font-medium"
                                onClick={(e) => {
                                  e.preventDefault()
                                  if (!order.trackingLink) return
                                  const trackingUrl = order.trackingLink.startsWith('http://') || order.trackingLink.startsWith('https://') 
                                    ? order.trackingLink 
                                    : order.trackingLink.startsWith('//')
                                    ? `https:${order.trackingLink}`
                                    : `https://${order.trackingLink}`
                                  window.open(trackingUrl, '_blank', 'noopener,noreferrer')
                                }}
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
                          {estimatedDeliveryDate && (
                            <p className="text-sm text-content mt-3">
                              <span className="font-medium">Estimated delivery:</span>{' '}
                              {estimatedDeliveryDate.toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                              {order.estimatedDeliveryDays && (
                                <span className="ml-2 opacity-75">
                                  ({order.estimatedDeliveryDays} working {order.estimatedDeliveryDays === 1 ? 'day' : 'days'})
                                </span>
                              )}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </AccountLayout>
      <Footer />
    </div>
  )
}

