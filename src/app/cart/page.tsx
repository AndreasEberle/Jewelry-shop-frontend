'use client'

import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ShoppingCart, Minus, Plus, Trash2, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function CartPage() {
  const { cart, isLoading, updateQuantity, removeFromCart, clearCart } = useCart()
  const { isAuthenticated } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading your cart...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
          <div className="text-center">
            <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-4">Add some beautiful jewelry to get started</p>
            <Link href="/" className="btn btn-primary">
              Continue Shopping
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
            <p className="text-gray-600">{cart.itemCount} item(s) in your cart</p>
          </div>

          <div className="divide-y divide-gray-200">
            {cart.items.map((item) => (
              <div key={item.product.id} className="p-6 flex items-center space-x-4">
                {item.product.images && item.product.images.length > 0 ? (
                  <img
                    src={item.product.images[0].url}
                    alt={item.product.name}
                    className="h-20 w-20 object-cover rounded-lg"
                  />
                ) : (
                  <div className="h-20 w-20 bg-gray-200 rounded-lg flex items-center justify-center">
                    <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {item.product.name}
                  </h3>
                  <p className="text-gray-600">{item.product.category.name}</p>
                  <p className="text-sm text-gray-500">SKU: {item.product.sku}</p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    className="p-1 rounded-full hover:bg-gray-100"
                    disabled={item.quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  
                  <span className="w-8 text-center font-medium">
                    {item.quantity}
                  </span>
                  
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    className="p-1 rounded-full hover:bg-gray-100"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900">
                    ${(item.product.price * item.quantity).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">
                    ${item.product.price.toLocaleString()} each
                  </p>
                </div>

                <button
                  onClick={() => removeFromCart(item.product.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <button
                  onClick={clearCart}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  Clear Cart
                </button>
              </div>
              
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">
                  Total: ${cart.total.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">
                  {cart.itemCount} item(s)
                </p>
              </div>
            </div>
            
            <div className="mt-4 flex space-x-4">
              <Link href="/" className="btn btn-outline flex-1">
                Continue Shopping
              </Link>
              {isAuthenticated ? (
                <button className="btn btn-primary flex-1">
                  Proceed to Checkout
                </button>
              ) : (
                <div className="flex-1 text-center">
                  <p className="text-sm text-gray-600 mb-2">
                    Please log in to proceed with checkout
                  </p>
                  <Link href="/" className="btn btn-primary">
                    Login / Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
