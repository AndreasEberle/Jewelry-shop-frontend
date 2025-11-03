'use client'

import { useFontFamily } from '@/hooks/useFontFamily'

export function FontFamilyProvider({ children }: { children: React.ReactNode }) {
  useFontFamily() // This hook applies the font family to document.documentElement
  
  return <>{children}</>
}


