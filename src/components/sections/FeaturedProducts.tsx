'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Star, ShoppingCart, Heart } from 'lucide-react'

interface Product {
  id: string
  name: string
  price: number
  image: string
  rating: number
  category: string
}

export function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  // Mock data for now - will be replaced with API call
  useEffect(() => {
    const mockProducts: Product[] = [
      {
        id: '1',
        name: 'Diamond Engagement Ring',
        price: 2999.99,
        image: '/api/products/1/images/1',
        rating: 4.8,
        category: 'Rings'
      },
      {
        id: '2',
        name: 'Pearl Necklace',
        price: 1299.99,
        image: '/api/products/2/images/1',
        rating: 4.6,
        category: 'Necklaces'
      },
      {
        id: '3',
        name: 'Gold Earrings',
        price: 899.99,
        image: '/api/products/3/images/1',
        rating: 4.7,
        category: 'Earrings'
      },
      {
        id: '4',
        name: 'Sapphire Bracelet',
        price: 1599.99,
        image: '/api/products/4/images/1',
        rating: 4.9,
        category: 'Bracelets'
      }
    ]
    
    setTimeout(() => {
      setProducts(mockProducts)
      setLoading(false)
    }, 1000)
  }, [])

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
                  src={product.image}
                  alt={product.name}
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
                          i < Math.floor(product.rating) ? 'fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600 ml-2">({product.rating})</span>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{product.category}</p>
                
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-primary-600">
                    ${product.price.toLocaleString()}
                  </span>
                  <button className="btn btn-primary flex items-center">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart
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
