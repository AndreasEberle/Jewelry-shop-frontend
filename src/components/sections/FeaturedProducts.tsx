'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Star, ShoppingCart, Heart, Loader2 } from 'lucide-react'
import { Product } from '@/types'
import { productService } from '@/services/productService'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { EnhancedFeaturedProductsCarousel } from './EnhancedFeaturedProductsCarousel'
import api from '@/services/api'

export function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [addingToCart, setAddingToCart] = useState<string | null>(null)
  const [leftBackgroundImage, setLeftBackgroundImage] = useState<string | null>(null)
  const [rightBackgroundImage, setRightBackgroundImage] = useState<string | null>(null)
  const { addToCart } = useCart()
  const { isAuthenticated } = useAuth()
  const { currentCurrency, formatPrice } = useCurrency()

  // Fetch background images from config
  useEffect(() => {
    const fetchBackgroundImages = async () => {
      try {
        const [leftRes, rightRes] = await Promise.all([
          api.get('/api/public/system-config/featured_products.left_background_image').catch(() => ({ data: { value: null } })),
          api.get('/api/public/system-config/featured_products.right_background_image').catch(() => ({ data: { value: null } }))
        ])
        setLeftBackgroundImage(leftRes.data?.value || null)
        setRightBackgroundImage(rightRes.data?.value || null)
      } catch (error) {
        console.error('Failed to fetch background images:', error)
      }
    }
    fetchBackgroundImages()
  }, [])

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


  const handleProductClick = (product: Product) => {
    // Navigate to product detail page using slug (fallback to SKU)
    window.location.href = `/products/${product.slug || product.sku}`
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
    <section className="py-16 bg-white relative">
      {/* Left Background Image */}
      {leftBackgroundImage && (
        <div 
          className="absolute left-0 top-0 bottom-0 w-1/4 bg-cover bg-center bg-no-repeat z-0"
          style={{ backgroundImage: `url(${leftBackgroundImage})` }}
        />
      )}
      
      {/* Right Background Image */}
      {rightBackgroundImage && (
        <div 
          className="absolute right-0 top-0 bottom-0 w-1/4 bg-cover bg-center bg-no-repeat z-0"
          style={{ backgroundImage: `url(${rightBackgroundImage})` }}
        />
      )}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
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
          <EnhancedFeaturedProductsCarousel
            products={products}
            onProductClick={handleProductClick}
            itemsPerView={4}
            autoRotateInterval={3000}
          />
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

