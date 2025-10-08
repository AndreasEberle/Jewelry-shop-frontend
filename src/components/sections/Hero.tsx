import Link from 'next/link'
import { ArrowRight, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useSectionStyles } from '@/hooks/useSectionStyles'

interface HeroProps {
  backgroundImages?: string[]
  sliderConfig?: {
    isEnabled: boolean
    autoPlay: boolean
    slideDurationSeconds: number
    showIndicators: boolean
    showArrows: boolean
    transitionEffect: string
  }
}

export function Hero({ backgroundImages, sliderConfig }: HeroProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPlaying, setIsPlaying] = useState(sliderConfig?.autoPlay ?? true)
  const { getBackgroundStyle, getTextStyle, getOverlayStyle } = useSectionStyles()

  // Debug logging
  console.log('Hero component props:', {
    backgroundImages,
    sliderConfig,
    backgroundImagesLength: backgroundImages?.length,
    isSliderEnabled: sliderConfig?.isEnabled,
    imageUrls: backgroundImages?.map(img => img.s3Url || img.localUrl)
  })

  // Auto-play functionality
  useEffect(() => {
    if (!sliderConfig?.isEnabled || !sliderConfig?.autoPlay || !backgroundImages || backgroundImages.length <= 1) {
      return
    }

    const interval = setInterval(() => {
      if (isPlaying) {
        setCurrentSlide((prev) => (prev + 1) % backgroundImages.length)
      }
    }, (sliderConfig.slideDurationSeconds || 5) * 1000)

    return () => clearInterval(interval)
  }, [sliderConfig, backgroundImages, isPlaying])

  // Handle single image (non-slider mode) or when no images
  if (!sliderConfig?.isEnabled || !backgroundImages || backgroundImages.length === 0) {
    const firstImageUrl = backgroundImages && backgroundImages.length > 0 ? 
      (backgroundImages[0].storageType === 's3' && backgroundImages[0].s3Url ? backgroundImages[0].s3Url :
       backgroundImages[0].storageType === 'hybrid' && backgroundImages[0].s3Url ? backgroundImages[0].s3Url :
       backgroundImages[0].localUrl) : null
    console.log('Using single image mode, backgroundImage:', firstImageUrl)
    return <HeroSingleImage backgroundImage={firstImageUrl} />
  }

  // Handle slider mode
  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + backgroundImages.length) % backgroundImages.length)
  }

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % backgroundImages.length)
  }

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  // Get section styling for hero
  const heroBackgroundStyle = getBackgroundStyle('hero')
  const heroTextStyle = getTextStyle('hero')
  const heroOverlayStyle = getOverlayStyle('hero')

  return (
    <section 
      className="relative py-20 overflow-hidden"
      style={heroBackgroundStyle}
    >
      {/* Slider Container */}
      <div className="relative w-full h-full">
        {backgroundImages.map((image, index) => {
          const imageUrl = image.storageType === 's3' && image.s3Url ? image.s3Url :
                          image.storageType === 'hybrid' && image.s3Url ? image.s3Url :
                          image.localUrl
          return (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                // Ensure GIFs can animate
                animationPlayState: 'running'
              }}
            >
              {/* Overlay for better text readability */}
              <div 
                className="absolute inset-0"
                style={heroOverlayStyle}
              ></div>
            </div>
          )
        })}
      </div>

      {/* Navigation Arrows */}
      {sliderConfig.showArrows && backgroundImages.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-all"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-all"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Play/Pause Button */}
      {sliderConfig.autoPlay && backgroundImages.length > 1 && (
        <button
          onClick={togglePlayPause}
          className="absolute top-4 right-4 z-20 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-all"
          aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
        >
          {isPlaying ? (
            <div className="w-4 h-4 flex items-center justify-center">
              <div className="w-1 h-4 bg-white mr-1"></div>
              <div className="w-1 h-4 bg-white"></div>
            </div>
          ) : (
            <div className="w-0 h-0 border-l-[6px] border-l-white border-y-[4px] border-y-transparent ml-1"></div>
          )}
        </button>
      )}

      {/* Slide Indicators */}
      {sliderConfig.showIndicators && backgroundImages.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex space-x-2">
          {backgroundImages.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentSlide
                  ? 'bg-white'
                  : 'bg-white bg-opacity-50 hover:bg-opacity-75'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center px-4 py-2 bg-primary-100 text-primary-800 rounded-full text-sm font-medium">
              <Sparkles className="h-4 w-4 mr-2" />
              Premium Jewelry Collection
            </div>
          </div>
          
          <h1 
            className="text-4xl md:text-6xl font-bold mb-6"
            style={heroTextStyle}
          >
            Discover
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-300 to-secondary-300">
              {' '}Exquisite{' '}
            </span>
            Jewelry
          </h1>
          
          <p 
            className="text-xl mb-8 max-w-3xl mx-auto"
            style={heroTextStyle}
          >
            From elegant rings to stunning necklaces, explore our curated collection of premium jewelry 
            crafted with the finest materials and attention to detail.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/products" 
              className="btn btn-primary text-lg px-8 py-3 inline-flex items-center"
            >
              Shop Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link 
              href="/categories" 
              className="btn btn-outline text-lg px-8 py-3"
            >
              Browse Categories
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

// Single image component (fallback)
function HeroSingleImage({ backgroundImage }: { backgroundImage?: string | null }) {
  console.log('HeroSingleImage received backgroundImage:', backgroundImage)
  const { getBackgroundStyle, getTextStyle, getOverlayStyle } = useSectionStyles()
  
  // Get section styling for hero
  const heroBackgroundStyle = getBackgroundStyle('hero')
  const heroTextStyle = getTextStyle('hero')
  const heroOverlayStyle = getOverlayStyle('hero')
  
  // Combine background image with section styling
  const combinedBackgroundStyle = {
    ...heroBackgroundStyle,
    ...(backgroundImage && {
      backgroundImage: `url(${backgroundImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      // Ensure GIFs can animate
      animationPlayState: 'running'
    })
  }
  
  return (
    <section 
      className="relative py-20"
      style={combinedBackgroundStyle}
    >
      {/* Overlay for better text readability */}
      {(backgroundImage || heroOverlayStyle.backgroundColor) && (
        <div 
          className="absolute inset-0"
          style={heroOverlayStyle}
        ></div>
      )}
      
      {/* Fallback gradient background */}
      {!backgroundImage && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-secondary-50"></div>
      )}
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center px-4 py-2 bg-primary-100 text-primary-800 rounded-full text-sm font-medium">
              <Sparkles className="h-4 w-4 mr-2" />
              Premium Jewelry Collection
            </div>
          </div>
          
          <h1 
            className="text-4xl md:text-6xl font-bold mb-6"
            style={heroTextStyle}
          >
            Discover
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600">
              {' '}Exquisite{' '}
            </span>
            Jewelry
          </h1>
          
          <p 
            className="text-xl mb-8 max-w-3xl mx-auto"
            style={heroTextStyle}
          >
            From elegant rings to stunning necklaces, explore our curated collection of premium jewelry 
            crafted with the finest materials and attention to detail.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/products" 
              className="btn btn-primary text-lg px-8 py-3 inline-flex items-center"
            >
              Shop Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link 
              href="/categories" 
              className="btn btn-outline text-lg px-8 py-3"
            >
              Browse Categories
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}