'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { useBackgroundImages } from '@/hooks/useBackgroundImages'
import { ArrowRight, Star, ShoppingCart, Heart, Eye } from 'lucide-react'
import Link from 'next/link'

interface Category {
  id: string
  name: string
  description: string
  image: string
  productCount: number
  featured: boolean
  slug: string
}

interface FeaturedProduct {
  id: string
  name: string
  price: number
  originalPrice?: number
  currency: string
  image: string
  rating: number
  reviewCount: number
  category: string
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [featuredProducts, setFeaturedProducts] = useState<FeaturedProduct[]>([])
  const [loading, setLoading] = useState(true)

  const { getBackgroundUrlForSection } = useBackgroundImages()
  const navigationBackground = getBackgroundUrlForSection('navigation')
  const footerBackground = getBackgroundUrlForSection('footer')

  useEffect(() => {
    // Mock data - replace with actual API calls
    const mockCategories: Category[] = [
      {
        id: '1',
        name: 'Rings',
        description: 'Exquisite rings for every occasion, from engagement rings to statement pieces',
        image: '/api/placeholder/600/400',
        productCount: 45,
        featured: true,
        slug: 'rings'
      },
      {
        id: '2',
        name: 'Necklaces',
        description: 'Elegant necklaces and pendants to complement your style',
        image: '/api/placeholder/600/400',
        productCount: 32,
        featured: true,
        slug: 'necklaces'
      },
      {
        id: '3',
        name: 'Earrings',
        description: 'Beautiful earrings from studs to chandeliers',
        image: '/api/placeholder/600/400',
        productCount: 28,
        featured: true,
        slug: 'earrings'
      },
      {
        id: '4',
        name: 'Bracelets',
        description: 'Charming bracelets and bangles for your wrist',
        image: '/api/placeholder/600/400',
        productCount: 19,
        featured: false,
        slug: 'bracelets'
      },
      {
        id: '5',
        name: 'Pendants',
        description: 'Stunning pendants and charms to personalize your jewelry',
        image: '/api/placeholder/600/400',
        productCount: 24,
        featured: false,
        slug: 'pendants'
      },
      {
        id: '6',
        name: 'Watches',
        description: 'Luxury timepieces that combine style and functionality',
        image: '/api/placeholder/600/400',
        productCount: 15,
        featured: false,
        slug: 'watches'
      }
    ]

    const mockFeaturedProducts: FeaturedProduct[] = [
      {
        id: '1',
        name: 'Diamond Solitaire Ring',
        price: 2999,
        originalPrice: 3499,
        currency: 'USD',
        image: '/api/placeholder/300/300',
        rating: 4.8,
        reviewCount: 127,
        category: 'Rings'
      },
      {
        id: '2',
        name: 'Pearl Drop Earrings',
        price: 599,
        currency: 'USD',
        image: '/api/placeholder/300/300',
        rating: 4.6,
        reviewCount: 89,
        category: 'Earrings'
      },
      {
        id: '3',
        name: 'Gold Chain Necklace',
        price: 899,
        currency: 'USD',
        image: '/api/placeholder/300/300',
        rating: 4.7,
        reviewCount: 156,
        category: 'Necklaces'
      }
    ]

    setTimeout(() => {
      setCategories(mockCategories)
      setFeaturedProducts(mockFeaturedProducts)
      setLoading(false)
    }, 1000)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header backgroundImage={navigationBackground} />
        <main className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow p-6">
                    <div className="h-48 bg-gray-200 rounded mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
        <Footer backgroundImage={footerBackground} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header backgroundImage={navigationBackground} />
      
      <main className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Jewelry Categories</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Explore our carefully curated collection of jewelry categories, each offering unique pieces 
              crafted with the finest materials and attention to detail.
            </p>
          </div>

          {/* Featured Categories */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Featured Categories</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {categories.filter(cat => cat.featured).map(category => (
                <div key={category.id} className="group relative bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                  <div className="relative overflow-hidden">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <h3 className="text-2xl font-bold mb-2">{category.name}</h3>
                      <p className="text-sm opacity-90 mb-3">{category.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{category.productCount} products</span>
                        <Link
                          href={`/products?category=${category.slug}`}
                          className="inline-flex items-center text-sm font-medium text-white hover:text-yellow-300 transition-colors"
                        >
                          Shop Now
                          <ArrowRight className="ml-1 w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* All Categories */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">All Categories</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map(category => (
                <div key={category.id} className="group bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                  <div className="relative overflow-hidden rounded-t-lg">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full">
                      <span className="text-xs font-medium text-gray-700">{category.productCount} items</span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{category.name}</h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{category.description}</p>
                    <Link
                      href={`/products?category=${category.slug}`}
                      className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium text-sm group-hover:translate-x-1 transition-transform duration-200"
                    >
                      View Collection
                      <ArrowRight className="ml-1 w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Featured Products */}
          <div className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
              <Link
                href="/products"
                className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
              >
                View All Products
                <ArrowRight className="ml-1 w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProducts.map(product => (
                <div key={product.id} className="group bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                  <div className="relative overflow-hidden rounded-t-lg">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
                      Featured
                    </div>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50">
                        <Heart className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex space-x-2">
                        <button className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50">
                          <Eye className="w-4 h-4 text-gray-600" />
                        </button>
                        <button className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50">
                          <ShoppingCart className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-500">{product.category}</span>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600 ml-1">{product.rating}</span>
                        <span className="text-sm text-gray-400 ml-1">({product.reviewCount})</span>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl font-bold text-gray-900">${product.price}</span>
                        {product.originalPrice && (
                          <span className="text-sm text-gray-500 line-through">${product.originalPrice}</span>
                        )}
                      </div>
                      <button className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm font-medium">
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Call to Action */}
          <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-lg p-8 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">Can't Find What You're Looking For?</h2>
            <p className="text-xl mb-6 opacity-90">
              Our expert jewelers can create custom pieces just for you
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center px-6 py-3 bg-white text-primary-600 rounded-md hover:bg-gray-100 font-medium transition-colors"
              >
                Contact Us
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
              <Link
                href="/products"
                className="inline-flex items-center px-6 py-3 border-2 border-white text-white rounded-md hover:bg-white hover:text-primary-600 font-medium transition-colors"
              >
                Browse All Products
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer backgroundImage={footerBackground} />
    </div>
  )
}
