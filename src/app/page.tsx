'use client'

import { Header } from '@/components/layout/Header'
import { JapaneseHero } from '@/components/sections/JapaneseHero'
import { StorySections } from '@/components/sections/StorySections'
import { HomeProductGrid } from '@/components/sections/HomeProductGrid'
import { Footer } from '@/components/layout/Footer'
import { useBackgroundImages } from '@/hooks/useBackgroundImages'
import { useWebsiteStatus } from '@/hooks/useWebsiteStatus'
import { useSmoothScrollSnap } from '@/hooks/useSmoothScrollSnap'
import ConstructionPage from '@/components/ConstructionPage'
import VacationPage from '@/components/VacationPage'

export default function Home() {
  const { getBackgroundUrlForSection } = useBackgroundImages()
  const { websiteStatus, loading: statusLoading, isConstruction, isVacation } = useWebsiteStatus()
  useSmoothScrollSnap() // Enable smooth scroll snapping

  // Get background URLs for different sections
  const navigationBackground = getBackgroundUrlForSection('navigation')
  const featuredProductsBackground = getBackgroundUrlForSection('featured_products')
  const footerBackground = getBackgroundUrlForSection('footer')

  // Show loading state while checking website status
  if (statusLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  // Show construction page if under construction
  if (isConstruction) {
    return <ConstructionPage status={websiteStatus} />
  }

  // Show vacation page if on vacation
  if (isVacation) {
    return <VacationPage status={websiteStatus} />
  }

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <Header backgroundImage={navigationBackground} />
      <main className="snap-y snap-mandatory" style={{ scrollBehavior: 'smooth', scrollPaddingTop: '0px' }}>
        {/* Japanese Hero Section */}
        <JapaneseHero />
        
        {/* Story Sections - Alternating Image + Text */}
        <StorySections />
        
        {/* Home Product Grid - Configurable 2-4 items */}
        <HomeProductGrid />
      </main>
      <Footer backgroundImage={footerBackground} />
    </div>
  )
}



