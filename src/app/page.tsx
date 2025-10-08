'use client'

import { Header } from '@/components/layout/Header'
import { Hero } from '@/components/sections/Hero'
import { FeaturedProducts } from '@/components/sections/FeaturedProducts'
import { Footer } from '@/components/layout/Footer'
import { useBackgroundImages } from '@/hooks/useBackgroundImages'
import { useHeroSlider } from '@/hooks/useHeroSlider'

export default function Home() {
  const { getBackgroundUrlForSection } = useBackgroundImages()
  const { sliderConfig, heroImages, imageUrls, loading: heroLoading } = useHeroSlider()

  // Get background URLs for different sections
  const navigationBackground = getBackgroundUrlForSection('navigation')
  const featuredProductsBackground = getBackgroundUrlForSection('featured_products')
  const footerBackground = getBackgroundUrlForSection('footer')

  return (
    <div className="min-h-screen bg-gray-50">
      <Header backgroundImage={navigationBackground} />
      <main>
        {heroLoading ? (
          <div className="py-20 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <Hero 
            backgroundImages={heroImages}
            sliderConfig={sliderConfig}
          />
        )}
        <FeaturedProducts backgroundImage={featuredProductsBackground} />
      </main>
      <Footer backgroundImage={footerBackground} />
    </div>
  )
}



