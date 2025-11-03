'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function FavoritesPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    if (isLoading) return // Wait for auth to load
    
    if (!isAuthenticated) {
      // Redirect to login or home if not authenticated
      router.push('/')
      return
    }

    // Redirect to appropriate wishlist page based on user role
    if (user?.roles?.includes('ADMIN')) {
      router.push('/account/wishlist')
    } else {
      router.push('/user-account/wishlist')
    }
  }, [isAuthenticated, isLoading, user, router])

  // Show loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500"></div>
    </div>
  )
}



