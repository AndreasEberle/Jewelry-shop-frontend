'use client'

import Link from 'next/link'
import { usePageTitle } from '@/hooks/usePageTitle'

export function CheckoutHeader() {
  const { navbarName } = usePageTitle()

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16">
          <Link 
            href="/" 
            className="hover:opacity-80 transition-opacity"
            title="Go to main shop"
          >
            <span className="text-lg font-semibold text-gray-900">
              {navbarName || 'Jewelry Shop'}
            </span>
          </Link>
        </div>
      </div>
    </header>
  )
}

