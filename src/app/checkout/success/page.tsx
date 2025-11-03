'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckoutHeader } from '@/components/layout/CheckoutHeader'
import { Footer } from '@/components/layout/Footer'
import { useCart } from '@/contexts/CartContext'
import { CheckCircle, Package, Mail, ArrowRight } from 'lucide-react'
import api from '@/services/api'

interface Order {
  id: string
  orderNumber: string
  status: string
  totalAmount: number
  currency: string
  createdAt: string
  items: Array<{
    product: {
      id: string
      name: string
      images?: Array<{ url: string; altText?: string }>
    }
    quantity: number
    price: number
  }>
  shippingAddress?: {
    street: string
    apartment?: string
    city: string
    postalCode?: string
    country: string
  }
  payment?: {
    status: string
    transactionId?: string
  }
}

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderId = searchParams.get('orderId')
  const { clearCart } = useCart()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Clear cart after successful payment
    const clearCartAfterPayment = async () => {
      try {
        await clearCart()
        console.log('Cart cleared after successful payment')
      } catch (error) {
        console.error('Failed to clear cart:', error)
        // Don't fail the success page if cart clearing fails
      }
    }

    clearCartAfterPayment()
  }, [clearCart])

  useEffect(() => {
    if (!orderId) {
      setError('Order ID is missing')
      setLoading(false)
      return
    }

    const fetchOrder = async () => {
      try {
        const response = await api.get(`/api/orders/${orderId}`)
        setOrder(response.data)
      } catch (err: any) {
        console.error('Failed to fetch order:', err)
        setError(err.response?.data?.message || 'Failed to load order details')
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CheckoutHeader />
        <main className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading order details...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CheckoutHeader />
        <main className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h1>
              <p className="text-gray-600 mb-6">{error || 'Unable to load order details'}</p>
              <Link href="/account/orders" className="btn btn-primary">
                View My Orders
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CheckoutHeader />
      <main className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Success Header */}
          <div className="text-center mb-12">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
            <p className="text-lg text-gray-600">
              Thank you for your purchase. We've received your order and will send you a confirmation email shortly.
            </p>
          </div>

          {/* Order Details */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-6 pb-6 border-b">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Order Number</h2>
                <p className="text-gray-600">{order.orderNumber}</p>
              </div>
              <div className="text-right">
                <h2 className="text-lg font-semibold text-gray-900">Total</h2>
                <p className="text-xl font-bold text-gray-900">
                  {order.currency} {order.totalAmount.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Order Items */}
            <div className="mb-6">
              <h3 className="text-md font-semibold text-gray-900 mb-4">Order Items</h3>
              <div className="space-y-4">
                {order.items.map((item, index) => {
                  const primaryImage = item.product.images?.[0]
                  return (
                    <div key={index} className="flex gap-4">
                      {primaryImage && (
                        <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                          <img
                            src={primaryImage.url}
                            alt={primaryImage.altText || item.product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.product.name}</p>
                        <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                        <p className="text-sm font-medium text-gray-900 mt-1">
                          {order.currency} {(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Shipping Address */}
            {order.shippingAddress && (
              <div className="mb-6 pb-6 border-b">
                <h3 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Shipping Address
                </h3>
                <p className="text-gray-700">
                  {order.shippingAddress.street}
                  {order.shippingAddress.apartment && `, ${order.shippingAddress.apartment}`}
                </p>
                <p className="text-gray-700">
                  {order.shippingAddress.city}
                  {order.shippingAddress.postalCode && `, ${order.shippingAddress.postalCode}`}
                </p>
                <p className="text-gray-700">{order.shippingAddress.country}</p>
              </div>
            )}

            {/* Payment Status */}
            {order.payment && (
              <div className="mb-6">
                <h3 className="text-md font-semibold text-gray-900 mb-2">Payment Status</h3>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    order.payment.status === 'COMPLETED'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.payment.status}
                  </span>
                  {order.payment.transactionId && (
                    <span className="text-sm text-gray-600">
                      Transaction: {order.payment.transactionId.substring(0, 20)}...
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Email Confirmation Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
              <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">Confirmation Email Sent</p>
                <p className="text-sm text-blue-700 mt-1">
                  We've sent a confirmation email with your order details and tracking information.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/account/orders"
              className="btn btn-primary flex items-center justify-center gap-2"
            >
              View My Orders
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/products"
              className="btn btn-outline flex items-center justify-center gap-2"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

