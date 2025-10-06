'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Star, ShoppingCart, Heart, Loader2 } from 'lucide-react'
import { Product } from '@/types'
import { productService } from '@/services/productService'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { useCurrency } from '@/contexts/CurrencyContext'

export function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [addingToCart, setAddingToCart] = useState<string | null>(null)
  const { addToCart } = useCart()
  const { isAuthenticated } = useAuth()
  const { currentCurrency, formatPrice } = useCurrency()

  // Fetch featured products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const featuredProducts = await productService.getFeaturedProducts(8, currentCurrency)
        setProducts(featuredProducts)
      } catch (error) {
        console.error('Failed to fetch featured products:', error)
        // No fallback data - show empty state if API fails
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [currentCurrency])

  const handleAddToCart = async (product: Product) => {
    setAddingToCart(product.id)
    try {
      await addToCart(product, 1)
      // You could add a toast notification here
    } catch (error: any) {
      alert(error.message || 'Failed to add item to cart')
    } finally {
      setAddingToCart(null)
    }
  }

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Featured Products</h2>
            <p className="text-gray-600 mt-4">Loading our finest collection...</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card p-6 animate-pulse">
                <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">Featured Products</h2>
          <p className="text-gray-600 mt-4">Discover our most popular jewelry pieces</p>
        </div>
        
        {products.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products available</h3>
            <p className="text-gray-600">Check back later for our latest jewelry collection.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product) => (
            <div key={product.id} className="card group hover:shadow-lg transition-shadow duration-300">
              <div className="relative">
                {product.images && product.images.length > 0 ? (
                  <img
                    src={product.images[0].url}
                    alt={product.images[0].altText || product.name}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-200 rounded-t-lg flex items-center justify-center">
                    <div className="text-gray-400 text-center">
                      <svg className="mx-auto h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm">No image</p>
                    </div>
                  </div>
                )}
                <button className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Heart className="h-4 w-4 text-gray-600" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="flex items-center mb-2">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < 4 ? 'fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600 ml-2">(4.5)</span>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
                <div className="text-sm text-gray-600 mb-4 space-y-1">
                  {product.categories && product.categories.length > 0 && (
                    <p>{product.categories[0]}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    Quantity: {product.quantity}
                  </p>
                  {product.weightGrams && (
                    <p className="text-xs text-gray-500">
                      Weight: {product.weightGrams}g
                    </p>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-primary-600">
                    {formatPrice(product.displayPrice || product.price, product.displayCurrency || product.baseCurrency)}
                  </span>
                  <button 
                    onClick={() => handleAddToCart(product)}
                    disabled={addingToCart === product.id}
                    className="btn btn-primary flex items-center disabled:opacity-50"
                  >
                    {addingToCart === product.id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <ShoppingCart className="h-4 w-4 mr-2" />
                    )}
                    {addingToCart === product.id ? 'Adding...' : 'Add to Cart'}
                  </button>
                </div>
              </div>
            </div>
            ))}
          </div>
        )}
        
        <div className="text-center mt-12">
          <Link href="/products" className="btn btn-outline text-lg px-8 py-3">
            View All Products
          </Link>
        </div>
      </div>
    </section>
  )
}

