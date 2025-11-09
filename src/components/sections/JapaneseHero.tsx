'use client'

import { useEffect, useState } from 'react'
import { useBackgroundImages } from '@/hooks/useBackgroundImages'
import { useTranslation } from '@/hooks/useTranslation'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function JapaneseHero() {
  const { getBackgroundUrlForSection, getBackgroundMimeTypeForSection } = useBackgroundImages()
  const { t } = useTranslation()
  const [brightness, setBrightness] = useState(1)
  const [isLoaded, setIsLoaded] = useState(false)
  const [glowOpacity, setGlowOpacity] = useState(0)

  // Get hero background image/video from admin config
  const heroBackgroundUrl = getBackgroundUrlForSection('hero')
  const heroBackgroundMimeType = getBackgroundMimeTypeForSection('hero')
  const isVideoBackground = heroBackgroundMimeType?.startsWith('video/') || false
  // Get washi texture background image from admin config
  const washiTextureUrl = getBackgroundUrlForSection('washi_texture')

  // On load animation - fade in and glow effect
  useEffect(() => {
    setIsLoaded(true)
    // Fade in glow over 2 seconds
    const glowInterval = setInterval(() => {
      setGlowOpacity(prev => {
        if (prev < 0.4) {
          return prev + 0.02
        }
        return prev
      })
    }, 50)

    const timeout = setTimeout(() => {
      clearInterval(glowInterval)
    }, 2000)

    return () => {
      clearInterval(glowInterval)
      clearTimeout(timeout)
    }
  }, [])

  // Very gentle brightness glow animation - extremely slow (30 second cycle)
  useEffect(() => {
    const interval = setInterval(() => {
      const time = Date.now() / 1000 // Current time in seconds
      const cycle = Math.sin((time / 30) * Math.PI * 2) // 30 second cycle
      // Oscillate between brightness 1.0 and 1.03 (very subtle)
      setBrightness(1 + (cycle * 0.015)) // Max 1.03, min 0.985 (averages to 1)
    }, 100) // Update every 100ms for smooth animation

    return () => clearInterval(interval)
  }, [])

  return (
    <section className={`relative w-full h-screen overflow-hidden snap-start transition-opacity duration-2000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
      {/* Background Image/Video with Washi Paper Texture Overlay */}
      {isVideoBackground && heroBackgroundUrl ? (
        <video
          className="absolute inset-0 w-full h-full object-cover"
          src={heroBackgroundUrl}
          autoPlay
          loop
          muted
          playsInline
          style={{
            filter: `brightness(${brightness})`,
            transition: 'filter 0.5s ease-in-out',
          }}
        />
      ) : (
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat hero-background"
          style={{
            backgroundImage: heroBackgroundUrl ? `url(${heroBackgroundUrl})` : undefined,
            backgroundColor: heroBackgroundUrl ? 'transparent' : '#faf8f5', // Warm beige fallback
            filter: `brightness(${brightness})`,
            transition: 'filter 0.5s ease-in-out',
          }}
        />
      )}
      <div className="absolute inset-0">
        {/* Washi Paper Texture Overlay - Configurable from admin */}
        {washiTextureUrl ? (
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `url(${washiTextureUrl})`,
              backgroundRepeat: 'repeat',
              backgroundSize: '400px 400px',
            }}
          />
        ) : (
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='400' height='400' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='washi' x='0' y='0' width='400' height='400' patternUnits='userSpaceOnUse'%3E%3Crect width='400' height='400' fill='%23faf8f5'/%3E%3Cpath d='M0 0L400 400M400 0L0 400' stroke='%23e8e5e0' stroke-width='1' opacity='0.2'/%3E%3Cpath d='M100 0L100 400M200 0L200 400M300 0L300 400' stroke='%23e8e5e0' stroke-width='0.5' opacity='0.15'/%3E%3Cpath d='M0 100L400 100M0 200L400 200M0 300L400 300' stroke='%23e8e5e0' stroke-width='0.5' opacity='0.15'/%3E%3Ccircle cx='50' cy='50' r='2' fill='%23d4d1cc' opacity='0.1'/%3E%3Ccircle cx='150' cy='150' r='1.5' fill='%23d4d1cc' opacity='0.1'/%3E%3Ccircle cx='250' cy='250' r='2' fill='%23d4d1cc' opacity='0.1'/%3E%3Ccircle cx='350' cy='350' r='1.5' fill='%23d4d1cc' opacity='0.1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='400' height='400' fill='url(%23washi)'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'repeat',
            }}
          />
        )}
      </div>

      {/* Gentle Sunlight Glow Overlay - Animated on load */}
      <div 
        className="absolute inset-0 pointer-events-none transition-opacity duration-2000"
        style={{
          background: `radial-gradient(ellipse 80% 50% at 50% 20%, rgba(255, 228, 196, ${glowOpacity}), transparent 70%)`,
          opacity: glowOpacity > 0 ? 1 : 0,
        }}
      />

      {/* Sakura Pink Accent (very subtle) */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-8"
        style={{
          background: `radial-gradient(circle at 20% 30%, rgba(255, 192, 203, 0.12), transparent 50%)`,
        }}
      />

      {/* Content Overlay */}
      <div className="relative z-10 h-full flex items-center justify-center">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
          {/* Main Heading - Japanese Font with Subtle Fade-in */}
          <h1 
            className="text-6xl md:text-8xl lg:text-9xl mb-8 leading-tight"
            ref={(el) => {
              if (el) {
                const observer = new IntersectionObserver(
                  (entries) => {
                    entries.forEach((entry) => {
                      if (entry.isIntersecting) {
                        entry.target.classList.add('fade-in-on-scroll-slow')
                        entry.target.style.removeProperty('opacity')
                        observer.unobserve(entry.target)
                      }
                    })
                  },
                  { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
                )
                observer.observe(el)
              }
            }}
            style={{
              color: '#2c2416', // Warm dark brown
              fontFamily: '"Noto Serif JP", Georgia, "Times New Roman", serif',
              fontWeight: 300,
              letterSpacing: '0.02em',
              textShadow: '0 2px 20px rgba(255, 255, 255, 0.3)',
              opacity: 0,
            }}
          >
            {t('home.heroTitle') || 'Handcrafted with Care'}
          </h1>

          {/* Subtitle - Sans-serif for Clarity */}
          <p 
            className="text-lg md:text-xl lg:text-2xl mb-12 max-w-2xl mx-auto leading-relaxed italic"
            ref={(el) => {
              if (el) {
                const observer = new IntersectionObserver(
                  (entries) => {
                    entries.forEach((entry) => {
                      if (entry.isIntersecting) {
                        entry.target.classList.add('fade-in-on-scroll-slow')
                        entry.target.style.removeProperty('opacity')
                        observer.unobserve(entry.target)
                      }
                    })
                  },
                  { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
                )
                observer.observe(el)
              }
            }}
            style={{
              color: '#5a5247', // Warm medium brown
              fontFamily: '"SimonMono", "Courier New", Courier, monospace',
              fontWeight: 300,
              letterSpacing: '0.01em',
              fontStyle: 'italic',
              opacity: 0,
            }}
          >
            {t('home.heroSubtitle') || 'Discover timeless jewelry, crafted with meticulous attention in our quiet atelier, where each piece tells a story of slow, meaningful creation.'}
          </p>

          {/* CTA Button - Elegant and Minimal */}
          <Link
            href="/products"
            ref={(el) => {
              if (el) {
                const observer = new IntersectionObserver(
                  (entries) => {
                    entries.forEach((entry) => {
                      if (entry.isIntersecting) {
                        entry.target.classList.add('fade-in-on-scroll-slow')
                        entry.target.style.removeProperty('opacity')
                        observer.unobserve(entry.target)
                      }
                    })
                  },
                  { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
                )
                observer.observe(el)
              }
            }}
            className="inline-flex items-center gap-3 px-8 py-4 bg-[#2c2416] text-[#faf8f5] rounded-sm hover:bg-[#3d3325] transition-all duration-300 group"
            style={{
              fontFamily: '"SimonMono", "Courier New", Courier, monospace',
              fontSize: '0.95rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              opacity: 0,
            }}
          >
            <span>{t('home.exploreCollection') || 'Explore Collection'}</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>

      {/* Bottom Fade Gradient */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, transparent, rgba(250, 248, 245, 0.8))',
        }}
      />
    </section>
  )
}
