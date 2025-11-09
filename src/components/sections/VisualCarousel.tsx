'use client'

import { useState, useEffect } from 'react'
import { useBackgroundImages } from '@/hooks/useBackgroundImages'
import Image from 'next/image'

export function VisualCarousel() {
  const { getBackgroundUrlForSection } = useBackgroundImages()
  const [currentIndex, setCurrentIndex] = useState(0)

  // Get carousel images - using story_explore as the main image, but we can add more
  const carouselImages = [
    getBackgroundUrlForSection('story_explore'),
    getBackgroundUrlForSection('story_craftsmanship'),
    getBackgroundUrlForSection('story_materials'),
    getBackgroundUrlForSection('story_personal'),
  ].filter(Boolean) // Remove null/undefined

  // Auto-advance carousel (very slow, non-intrusive)
  useEffect(() => {
    if (carouselImages.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % carouselImages.length)
    }, 8000) // Change every 8 seconds

    return () => clearInterval(interval)
  }, [carouselImages.length])

  if (carouselImages.length === 0) {
    return null
  }

  return (
    <section className="py-20 md:py-32 bg-[#faf8f5] border-t border-[#e8e5e0]">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="relative aspect-[16/9] overflow-hidden rounded-sm">
          {carouselImages.map((imageUrl, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-2000 ${
                index === currentIndex ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <Image
                src={imageUrl}
                alt={`Carousel image ${index + 1}`}
                fill
                className="object-cover"
                style={{
                  filter: 'brightness(0.98) contrast(1.02)',
                }}
              />
              {/* Subtle overlay */}
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, transparent 50%)',
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

