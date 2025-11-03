'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function AdminAccountPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || !user || !user.roles?.includes('ADMIN')) {
        router.push('/')
      } else {
        router.push('/account/profile')
      }
    }
  }, [isAuthenticated, isLoading, user, router])

  return null
}
