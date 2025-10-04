'use client'

import { useState, useEffect } from 'react'
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
        // Fallback to mock data if API fails
        const mockProducts: Product[] = [
          {
            id: '1',
            name: 'Diamond Engagement Ring',
            price: 2999.99,
            sku: 'RING-001',
            description: 'Beautiful diamond engagement ring',
            category: { id: '1', name: 'Rings' },
            tags: [{ id: '1', name: 'Diamond' }],
            images: [{ id: '1', url: '/api/products/1/images/1', altText: 'Diamond Ring', isPrimary: true }],
            inventory: { quantity: 5, lowStockThreshold: 2 },
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: '2',
            name: 'Pearl Necklace',
            price: 1299.99,
            sku: 'NECK-001',
            description: 'Elegant pearl necklace',
            category: { id: '2', name: 'Necklaces' },
            tags: [{ id: '2', name: 'Pearl' }],
            images: [{ id: '2', url: '/api/products/2/images/1', altText: 'Pearl Necklace', isPrimary: true }],
            inventory: { quantity: 8, lowStockThreshold: 3 },
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]
        setProducts(mockProducts)
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((product) => (
            <div key={product.id} className="card group hover:shadow-lg transition-shadow duration-300">
              <div className="relative">
                <img
                  src={product.images?.[0]?.url || '/placeholder-jewelry.jpg'}
                  alt={product.images?.[0]?.altText || product.name}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
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
                <p className="text-sm text-gray-600 mb-4">
                  {product.categories && product.categories.length > 0 
                    ? product.categories[0].name 
                    : 'Jewelry'}
                </p>
                
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
        
        <div className="text-center mt-12">
          <Link href="/products" className="btn btn-outline text-lg px-8 py-3">
            View All Products
          </Link>
        </div>
      </div>
    </section>
  )
}

