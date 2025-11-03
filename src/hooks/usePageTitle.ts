'use client'

import { useState, useEffect } from 'react'
import api from '@/services/api'

export function usePageTitle() {
  const [pageTitle, setPageTitle] = useState<string>('JewelryShop - Premium Jewelry Collection')
  const [navbarName, setNavbarName] = useState<string>('JewelryShop')

  useEffect(() => {
    const fetchPageConfig = async () => {
      try {
        const response = await api.get('/api/public/site-config')
        const config = response.data
        
        if (config.pageTitle) {
          setPageTitle(config.pageTitle)
          document.title = config.pageTitle
        }
        if (config.navbarName) {
          setNavbarName(config.navbarName)
        }
      } catch (error) {
        console.error('Failed to load site configuration:', error)
        // Set defaults
        document.title = pageTitle
      }
    }

    fetchPageConfig()
  }, [])

  return { pageTitle, navbarName }
}

