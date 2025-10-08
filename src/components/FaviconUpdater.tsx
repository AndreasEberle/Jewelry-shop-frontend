'use client'

import { useFavicon } from '@/hooks/useFavicon'

export function FaviconUpdater() {
  useFavicon()
  return null // This component doesn't render anything
}
