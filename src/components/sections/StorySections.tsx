'use client'

import { useEffect, useRef } from 'react'
import { useBackgroundImages } from '@/hooks/useBackgroundImages'
import { useTranslation } from '@/hooks/useTranslation'
import Image from 'next/image'

interface StorySection {
  key: string
  imageKey: string
  titleKey: string
  textKey: string
  layout: 'left' | 'right'
}

const storySections: StorySection[] = [
  {
    key: 'craftsmanship',
    imageKey: 'story_craftsmanship',
    titleKey: 'craftsmanshipTitle',
    textKey: 'craftsmanshipText',
    layout: 'left'
  },
  {
    key: 'materials',
    imageKey: 'story_materials',
    titleKey: 'materialsTitle',
    textKey: 'materialsText',
    layout: 'right'
  },
  {
    key: 'personal',
    imageKey: 'story_personal',
    titleKey: 'personalTitle',
    textKey: 'personalText',
    layout: 'left'
  },
  {
    key: 'explore',
    imageKey: 'story_explore',
    titleKey: 'exploreTitle',
    textKey: 'exploreText',
    layout: 'right'
  }
]

export function StorySections() {
  const { getBackgroundUrlForSection } = useBackgroundImages()
  const { t } = useTranslation()
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([])
  const titleRefs = useRef<(HTMLHeadingElement | null)[]>([])
  const textRefs = useRef<(HTMLParagraphElement | null)[]>([])
  const imageRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const observers: IntersectionObserver[] = []

    // Observe each section container
    sectionRefs.current.forEach((ref, index) => {
      if (!ref) return

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              // Get title, text, and image for this section
              const title = titleRefs.current[index]
              const text = textRefs.current[index]
              const image = imageRefs.current[index]
              
              // Start image and title animations together
              if (image) {
                image.style.removeProperty('opacity')
                requestAnimationFrame(() => {
                  image.classList.add('fade-in-on-scroll')
                })
              }
              
              if (title) {
                // Remove inline opacity first, then add animation class
                title.style.removeProperty('opacity')
                // Use requestAnimationFrame to ensure the style is removed before animation starts
                requestAnimationFrame(() => {
                  title.classList.add('fade-in-on-scroll')
                  
                  // Only start text animation after title animation completes (1.5s animation)
                  // Wait until title is fully visible (opacity = 1) before starting text animation
                  if (text) {
                    // Keep text invisible until title animation completes
                    // Check periodically until title reaches opacity 1
                    const checkTitleOpacity = () => {
                      const titleComputed = window.getComputedStyle(title)
                      const titleOpacity = parseFloat(titleComputed.opacity)
                      
                      // Only start text animation if title is fully visible (opacity >= 0.99)
                      if (titleOpacity >= 0.99) {
                        text.style.removeProperty('opacity')
                        requestAnimationFrame(() => {
                          text.classList.add('fade-in-on-scroll')
                        })
                      } else {
                        // If title isn't fully visible yet, check again in 50ms
                        setTimeout(checkTitleOpacity, 50)
                      }
                    }
                    
                    // Start checking after a short delay to allow animation to begin
                    setTimeout(checkTitleOpacity, 100)
                  }
                })
              }
              
              // Unobserve after animation starts
              observer.unobserve(entry.target)
            }
          })
        },
        {
          threshold: 0.1, // Trigger when 10% of section is visible
          rootMargin: '0px 0px -50px 0px', // Trigger slightly before fully in view
        }
      )

      observer.observe(ref)
      observers.push(observer)
    })

    return () => {
      observers.forEach((observer) => observer.disconnect())
    }
  }, [])

  return (
    <div className="w-full bg-[#f5e8e0]">
      {storySections.map((section, index) => {
        const imageUrl = getBackgroundUrlForSection(section.imageKey)
        const isLeft = section.layout === 'left'

        return (
          <section 
            key={section.key}
            className={`h-screen flex items-center justify-center snap-start relative overflow-hidden ${index > 0 ? 'border-t border-[#e8e5e0]' : ''}`}
          >
            {/* Background Image */}
            {getBackgroundUrlForSection(section.imageKey + '_bg') && (
              <div 
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                  backgroundImage: `url(${getBackgroundUrlForSection(section.imageKey + '_bg')})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                }}
              />
            )}
            
            <div className="max-w-[95%] md:max-w-[90%] lg:max-w-[85%] mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
              <div 
                ref={(el) => {
                  sectionRefs.current[index] = el
                }}
                className={`flex flex-col ${isLeft ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-8 md:gap-12`}
              >
                {/* Image */}
                <div className="w-full md:w-1/2">
                  {imageUrl ? (
                    <div 
                      ref={(el) => {
                        imageRefs.current[index] = el
                      }}
                      className="relative aspect-[4/3] overflow-hidden rounded-sm"
                      style={{ opacity: 0 }}
                    >
                      <Image
                        src={imageUrl}
                        alt={t(`home.${section.titleKey}`) || section.titleKey}
                        fill
                        className="object-contain"
                        style={{
                          filter: 'brightness(0.98) contrast(1.02)',
                        }}
                      />
                      {/* Subtle overlay for depth */}
                      <div 
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, transparent 50%)',
                        }}
                      />
                    </div>
                  ) : (
                    <div className="relative aspect-[4/3] bg-[#e8e5e0] rounded-sm flex items-center justify-center">
                      <p className="text-[#5a5247] text-sm" style={{ fontFamily: '"SimonMono", "Courier New", Courier, monospace' }}>
                        {t('home.imagePlaceholder') || 'Image placeholder'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Text Content */}
                <div className="w-full md:w-1/2 space-y-6">
                  <h2 
                    ref={(el) => {
                      titleRefs.current[index] = el
                    }}
                    className="text-3xl md:text-4xl lg:text-5xl font-serif"
                    style={{
                      color: '#2c2416',
                      fontFamily: '"Noto Serif JP", Georgia, "Times New Roman", serif',
                      fontWeight: 300,
                      letterSpacing: '0.02em',
                      lineHeight: '1.2',
                      opacity: 0,
                    }}
                  >
                    {t(`home.${section.titleKey}`) || section.titleKey}
                  </h2>
                  
                  <p 
                    ref={(el) => {
                      textRefs.current[index] = el
                    }}
                    className="text-lg md:text-xl leading-relaxed italic"
                    style={{
                      color: '#5a5247',
                      fontFamily: '"SimonMono", "Courier New", Courier, monospace',
                      fontWeight: 300,
                      letterSpacing: '0.01em',
                      fontStyle: 'italic',
                      opacity: 0,
                    }}
                  >
                    {t(`home.${section.textKey}`) || `Placeholder text for ${section.titleKey}. This section describes the story and philosophy behind our jewelry collection.`}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )
      })}
    </div>
  )
}
