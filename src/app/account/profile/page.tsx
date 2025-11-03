'use client'

import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { AccountLayout } from '@/components/account/AccountLayout'

export default function AdminProfilePage() {
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

