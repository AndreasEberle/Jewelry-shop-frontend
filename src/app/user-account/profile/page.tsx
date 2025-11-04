'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { AccountLayout } from '@/components/account/AccountLayout'

export default function ProfilePage() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, isLoading, router])
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <AccountLayout>
        {/* Profile content is already in AccountLayout */}
        <div></div>
      </AccountLayout>
      <Footer />
    </div>
  )
}

