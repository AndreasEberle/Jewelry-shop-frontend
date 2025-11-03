'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { AccountLayout } from '@/components/account/AccountLayout'
import { favoriteService } from '@/services/favoriteService'
import { Heart, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  currency: string
  images?: Array<{ url: string; altText?: string }>
  specialOfferPrice?: number
}

export default function AdminWishlistPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadWishlist()
  }, [])

  const loadWishlist = async () => {
    try {
      setLoading(true)
      setError(null)
      const favorites = await favoriteService.getFavorites()
      // Handle both array and single item responses
      const favoritesArray = Array.isArray(favorites) ? favorites : (favorites ? [favorites] : [])
      setProducts(favoritesArray)
    } catch (err: any) {
      console.error('Error loading wishlist:', err)
      // Handle 500 errors gracefully - might be a backend issue
      if (err.response?.status === 500) {
        setError('Unable to load wishlist at the moment. Please try again later.')
      } else if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Please log in to view your wishlist.')
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to load wishlist')
      }
      // Set empty array on error so UI doesn't break
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveFavorite = async (productId: string) => {
    try {
      await favoriteService.removeFromFavorites(productId)
      // Dispatch event to update header favorite count
      window.dispatchEvent(new Event('favoriteChanged'))
      setProducts(products.filter(p => p.id !== productId))
    } catch (err: any) {
      alert(err.message || 'Failed to remove from wishlist')
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <AccountLayout>
        <div className="space-y-6xl">
          <h1 className="type-heading-3 text-content" style={{ paddingBottom: '24px', fontSize: '1.5rem', fontWeight: 'bold' }}>WISHLIST</h1>
          
          {loading && (
            <div className="flex items-center justify-center py-12">
              <p className="type-body-2 text-content">Loading wishlist...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="type-body-2 text-red-600">{error}</p>
            </div>
          )}

          {!loading && !error && products.length === 0 && (
            <div className="text-center py-12">
              <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="type-body-2 text-content mb-4">Your wishlist is empty.</p>
              <Link
                href="/products"
                className="inline-block px-6 py-3 bg-black text-white hover:bg-gray-800 transition-colors"
              >
                Start Shopping
              </Link>
            </div>
          )}

          {!loading && !error && products.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => {
                const primaryImage = product.images?.[0]
                const hasSpecialOffer = product.specialOfferPrice && product.specialOfferPrice < product.price

                return (
                  <div key={product.id} className="border border-black group">
                    <Link href={`/products/${product.slug}`} className="block">
                      <div className="relative aspect-square bg-gray-100 overflow-hidden">
                        {primaryImage ? (
                          <Image
                            src={primaryImage.url}
                            alt={primaryImage.altText || product.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="w-16 h-16 text-gray-400" />
                          </div>
                        )}
                      </div>
                    </Link>
                    
                    <div className="p-4 space-y-2">
                      <Link href={`/products/${product.slug}`}>
                        <h3 className="type-body-2 text-content font-medium hover:underline">
                          {product.name}
                        </h3>
                      </Link>
                      
                      <div className="flex items-center gap-2">
                        {hasSpecialOffer ? (
                          <>
                            <span className="type-body-2 text-red-600 font-semibold">
                              {formatCurrency(product.specialOfferPrice!, product.currency)}
                            </span>
                            <span className="type-body-3 text-content line-through opacity-75">
                              {formatCurrency(product.price, product.currency)}
                            </span>
                          </>
                        ) : (
                          <span className="type-body-2 text-content font-semibold">
                            {formatCurrency(product.price, product.currency)}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleRemoveFavorite(product.id)}
                        className="flex items-center gap-2 text-sm text-content hover:text-red-600 transition-colors pt-2"
                      >
                        <Heart className="w-4 h-4 fill-current" />
                        <span>Remove from wishlist</span>
                      </button>
                    </div>
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

