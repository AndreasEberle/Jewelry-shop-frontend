'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import api from '@/services/api'
import { useLanguage } from '@/contexts/LanguageContext'

interface Slide {
  text: string
  link?: string
  linkText?: string
}

interface TopBannerConfig {
  enabled: boolean
  backgroundColor?: string
  fontSize?: string
  text?: string
  slides?: Slide[]
}

export function TopBanner() {
  const { currentLanguage } = useLanguage()
  const [config, setConfig] = useState<TopBannerConfig | null>(null)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const fetchBannerConfig = async () => {
      try {
        // Send current language to backend so it can return the appropriate translation
        const response = await api.get('/api/public/top-banner-config', {
          params: { lang: currentLanguage },
          headers: {
            'Accept-Language': currentLanguage
          }
        })
        setConfig(response.data)
      } catch (error) {
        console.error('Failed to load top banner configuration:', error)
        setConfig({ enabled: false, text: '', slides: [] })
      }
    }

    fetchBannerConfig()
  }, [currentLanguage]) // Refetch when language changes

  // Filter slides BEFORE using them for calculations (before any conditional returns)
  const allSlides = config?.enabled && config
    ? (config.slides && config.slides.length > 0 
        ? config.slides
        : (config.text ? [{ text: config.text, link: '', linkText: '' }] : []))
    : []
  
  const slides = allSlides.filter(slide => (slide.text && slide.text.trim()) || (slide.linkText && slide.linkText.trim()))
  
  // Initialize to middle set for seamless infinite loop
  useEffect(() => {
    if (slides.length > 1 && !isInitialized) {
      setCurrentSlide(slides.length)
      setIsInitialized(true)
    }
  }, [slides.length, isInitialized])

  // Auto-rotate slides every 5 seconds if there are multiple slides - infinite loop
  useEffect(() => {
    if (config?.enabled && slides.length > 1 && isInitialized) {
      intervalRef.current = setInterval(() => {
        setCurrentSlide((prev) => {
          const next = prev + 1
          // When reaching end of second set, reset to middle set for seamless loop
          if (next >= slides.length * 2) {
            return slides.length // Reset to start of middle set
          }
          return next
        })
      }, 5000)

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      }
    }
  }, [config, slides.length, isInitialized])
  
  // Reset to middle set when reaching boundaries for seamless loop
  useEffect(() => {
    if (slides.length > 1 && config?.enabled) {
      if (currentSlide >= slides.length * 2) {
        // Reset to middle set when reaching end
        const timeout = setTimeout(() => {
          setCurrentSlide(slides.length + (currentSlide % slides.length))
        }, 50)
        return () => clearTimeout(timeout)
      } else if (currentSlide < slides.length && currentSlide > 0) {
        // If somehow we're in first set, move to middle set
        const timeout = setTimeout(() => {
          setCurrentSlide(slides.length + currentSlide)
        }, 50)
        return () => clearTimeout(timeout)
      }
    }
  }, [currentSlide, slides.length, config])

  if (!config?.enabled || !isVisible) {
    return null
  }

  if (slides.length === 0) {
    return null
  }

  const handlePrevious = () => {
    setCurrentSlide((prev) => {
      const newPrev = prev - 1
      if (newPrev < slides.length) {
        return slides.length * 2 - 1 // Jump to end of second set
      }
      return newPrev
    })
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = setInterval(() => {
        setCurrentSlide((p) => {
          const next = p + 1
          if (next >= slides.length * 2) {
            return slides.length
          }
          return next
        })
      }, 5000)
    }
  }

  const handleNext = () => {
    setCurrentSlide((prev) => {
      const next = prev + 1
      if (next >= slides.length * 2) {
        return slides.length // Reset to start of middle set
      }
      return next
    })
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = setInterval(() => {
        setCurrentSlide((p) => {
          const next = p + 1
          if (next >= slides.length * 2) {
            return slides.length
          }
          return next
        })
      }, 5000)
    }
  }

  // Calculate translateX for infinite loop - use middle set (slides.length to slides.length * 2)
  const actualSlideIndex = currentSlide % slides.length
  const baseOffset = slides.length // Start from middle set
  const translateX = -((baseOffset + actualSlideIndex) * (100 / (slides.length * 3)))
  const backgroundColor = config.backgroundColor || '#000000'

  return (
    <div 
      className="bg-backgroundTheme-inv text-contentTheme-inv border-contentTheme-inv flex h-full items-center relative justify-between overflow-x-hidden md:[overflow-x:initial] border border-none !h-[20px] px-md md:px-xl z-40"
      style={{ backgroundColor }}
      data-testid="notification-bar"
    >
      <div className="relative max-w-full w-full" data-testid="notification-bar-carousel">
        <div className="carousel flex relative items-center w-full">
          <div className="flex items-center w-full md:block md:relative md:flex">
            {slides.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="previous"
                  onClick={handlePrevious}
                  className="buttonBack___1mlaL carousel__back-button absolute md:relative top-1/2 -translate-y-1/2 md:top-auto md:translate-y-0"
                  accessibility-role="button"
                  accessibility-label="carousel previous"
                >
                  <svg 
                    className="transform transition-transform duration-300 w-md h-md rotate-180" 
                    xmlns="http://www.w3.org/2000/svg" 
                    role="graphics-symbol" 
                    viewBox="0 0 24 24" 
                    fill="currentColor"
                  >
                    <title>Caret</title>
                    <path d="M8.59175 20C8.47866 19.9947 8.36933 19.9555 8.27647 19.8871C8.18361 19.8187 8.11104 19.7238 8.06721 19.6135C8.02338 19.5031 8.01008 19.3819 8.02886 19.2639C8.04765 19.146 8.09774 19.036 8.17332 18.9469L14.7188 12.0179L8.17332 5.06776C8.06235 4.95046 8 4.79137 8 4.62548C8 4.45959 8.06235 4.3005 8.17332 4.1832C8.28429 4.0659 8.43481 4 8.59175 4C8.74869 4 8.89921 4.0659 9.01018 4.1832L15.7051 11.2492C15.7985 11.3471 15.8726 11.4635 15.9231 11.5918C15.9737 11.7202 15.9998 11.8578 15.9998 11.9968C15.9998 12.1358 15.9737 12.2735 15.9231 12.4018C15.8726 12.5301 15.7985 12.6466 15.7051 12.7445L9.01018 19.8105C8.95621 19.8703 8.8913 19.918 8.81937 19.9506C8.74744 19.9832 8.67 20 8.59175 20Z" fill="currentColor"></path>
                  </svg>
                </button>
                <button
                  type="button"
                  aria-label="next"
                  onClick={handleNext}
                  className="buttonNext___2mOCa carousel__next-button absolute md:relative top-1/2 -translate-y-1/2 md:top-auto md:translate-y-0 right-0 md:right-auto md:left-0"
                  accessibility-role="button"
                  accessibility-label="carousel next"
                >
                  <svg 
                    className="transform transition-transform duration-300 w-md h-md rotate-0" 
                    xmlns="http://www.w3.org/2000/svg" 
                    role="graphics-symbol" 
                    viewBox="0 0 24 24" 
                    fill="currentColor"
                  >
                    <title>Caret</title>
                    <path d="M8.59175 20C8.47866 19.9947 8.36933 19.9555 8.27647 19.8871C8.18361 19.8187 8.11104 19.7238 8.06721 19.6135C8.02338 19.5031 8.01008 19.3819 8.02886 19.2639C8.04765 19.146 8.09774 19.036 8.17332 18.9469L14.7188 12.0179L8.17332 5.06776C8.06235 4.95046 8 4.79137 8 4.62548C8 4.45959 8.06235 4.3005 8.17332 4.1832C8.28429 4.0659 8.43481 4 8.59175 4C8.74869 4 8.89921 4.0659 9.01018 4.1832L15.7051 11.2492C15.7985 11.3471 15.8726 11.4635 15.9231 11.5918C15.9737 11.7202 15.9998 11.8578 15.9998 11.9968C15.9998 12.1358 15.9737 12.2735 15.9231 12.4018C15.8726 12.5301 15.7985 12.6466 15.7051 12.7445L9.01018 19.8105C8.95621 19.8703 8.8913 19.918 8.81937 19.9506C8.74744 19.9832 8.67 20 8.59175 20Z" fill="currentColor"></path>
                  </svg>
                </button>
              </>
            )}
            <div 
              className="horizontalSlider___281Ls carousel__slider carousel__slider--horizontal flex-1 overflow-hidden md:flex md:items-center md:order-1 md:overflow-hidden md:w-full"
              aria-live="polite"
              aria-label="Announcement bar slider"
              role="region"
              aria-roledescription="carousel"
            >
              <div className="carousel__slider-tray-wrapper carousel__slider-tray-wrap--horizontal max-w-full w-full overflow-hidden">
                <div 
                  className="sliderTray___-vHFQ sliderAnimation___300FY carousel__slider-tray carousel__slider-tray--horizontal"
                  style={{ 
                    display: 'flex',
                    alignItems: 'stretch',
                    width: `${slides.length * 3 * 100}%`, // Triple the slides for infinite loop
                    transform: `translateX(${translateX}%)`,
                    flexDirection: 'row',
                    transition: 'transform 800ms ease-in-out',
                    willChange: 'transform'
                  }}
                >
                  {/* Render slides 3 times for seamless infinite loop */}
                  {[...slides, ...slides, ...slides].map((slide, index) => {
                    const actualIndex = index % slides.length
                    const currentActualIndex = currentSlide % slides.length
                    const isVisible = actualIndex === currentActualIndex
                    
                    return (
                      <div
                        key={`${actualIndex}-${Math.floor(index / slides.length)}`}
                        aria-label="slide"
                        className={`slide___3-Nqo slideHorizontal___1NzNV carousel__slide carousel__slide--${isVisible ? 'visible' : 'hidden'} p-xs text-center md:text-left flex items-center md:justify-start !p-4 justify-center ${isVisible ? 'opacity-100' : 'opacity-0'}`}
                        style={{ width: `${100 / (slides.length * 3)}%`, paddingBottom: 'unset', height: 'unset', transition: 'opacity 300ms ease-in-out' }}
                        aria-selected={isVisible}
                      >
                        <div className="slideInner___2mfX9 carousel__inner-slide flex gap-xs text-balance justify-center items-center flex-wrap px-xl px-0 w-full" style={{ position: 'unset' }}>
                          <div className="flex gap-xs text-balance justify-center items-center flex-wrap">
                            {slide.text && slide.text.trim() && (
                              <span 
                                className="type-caption overflow-visible"
                                style={{
                                  fontSize: config?.fontSize || '0.875rem',
                                  fontFamily: 'var(--font-body, "SimonMono", "Courier New", Courier, monospace)',
                                  color: 'inherit', // Keep text color from parent
                                  textDecoration: 'underline',
                                  textDecorationColor: 'white', // White underline
                                  textDecorationThickness: '1px',
                                  textUnderlineOffset: '2px',
                                  textDecorationStyle: 'solid'
                                }}
                              >
                                {slide.text}
                              </span>
                            )}
                            {slide.link && slide.linkText && slide.linkText.trim() && (
                              <div className="-mt-[4px]">
                                <Link
                                  href={slide.link}
                                  className="pointer-events-auto transition-[color] ease-ease duration-300 focus-visible:ring-1 ring-utility-focus ring-offset-4 outline-none capitalize w-fit type-caption"
                                  data-testid="notification-bar-link"
                                  aria-label={slide.linkText}
                                  style={{
                                    fontSize: config?.fontSize || '0.875rem',
                                    fontFamily: 'var(--font-body, "SimonMono", "Courier New", Courier, monospace)',
                                    color: 'inherit'
                                  }}
                                >
                                  {slide.linkText}
                                </Link>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
