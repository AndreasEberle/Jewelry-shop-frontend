import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers/Providers'
import { FaviconUpdater } from '@/components/FaviconUpdater'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Jewelry Shop - Premium Jewelry Collection',
  description: 'Discover our exquisite collection of premium jewelry including rings, necklaces, earrings, and more.',
  keywords: 'jewelry, rings, necklaces, earrings, premium, luxury, gold, silver, diamonds',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <FaviconUpdater />
          {children}
        </Providers>
      </body>
    </html>
  )
}



