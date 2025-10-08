'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { AuthProvider } from '@/contexts/AuthContext'
import { CartProvider } from '@/contexts/CartContext'
import { CurrencyProvider } from '@/contexts/CurrencyContext'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { TableConfigProvider } from '@/contexts/TableConfigContext'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        retry: 1,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <CurrencyProvider>
            <LanguageProvider>
              <TableConfigProvider>
                {children}
              </TableConfigProvider>
            </LanguageProvider>
          </CurrencyProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

