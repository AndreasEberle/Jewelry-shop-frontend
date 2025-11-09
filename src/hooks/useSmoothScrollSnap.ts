'use client'

import { useEffect, useRef } from 'react'

export function useSmoothScrollSnap() {
  const isScrolling = useRef(false)
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (isScrolling.current) {
        e.preventDefault()
        return
      }

      const sections = document.querySelectorAll('.snap-start')
      if (sections.length === 0) return

      const currentScroll = window.scrollY
      const viewportHeight = window.innerHeight
      const deltaY = e.deltaY
      const scrollDown = deltaY > 0
      const scrollUp = deltaY < 0

      // Find current section
      let currentIndex = -1
      sections.forEach((section, index) => {
        const rect = section.getBoundingClientRect()
        const sectionTop = rect.top + currentScroll
        const sectionBottom = sectionTop + rect.height

        // Check if section is in viewport (with some tolerance)
        if (rect.top <= viewportHeight / 2 && rect.bottom >= viewportHeight / 2) {
          currentIndex = index
        }
      })

      // If we couldn't find current section, find the closest one
      if (currentIndex === -1) {
        let closestIndex = -1
        let closestDistance = Infinity
        sections.forEach((section, index) => {
          const rect = section.getBoundingClientRect()
          const distance = Math.abs(rect.top)
          if (distance < closestDistance) {
            closestDistance = distance
            closestIndex = index
          }
        })
        
        // If we're scrolling down and past all sections, allow normal scroll
        if (closestIndex === -1 || (scrollDown && closestIndex === sections.length - 1 && closestDistance > viewportHeight)) {
          return // Allow normal scroll to footer
        }
        
        currentIndex = closestIndex
      }

      // Only snap if scroll is significant enough
      if (Math.abs(deltaY) < 30) return

      // Calculate next section
      let nextIndex = currentIndex
      if (scrollDown && currentIndex < sections.length - 1) {
        nextIndex = currentIndex + 1
      } else if (scrollUp && currentIndex > 0) {
        nextIndex = currentIndex - 1
      }

      // If we're at the boundaries, allow normal scroll to footer
      if (nextIndex === currentIndex) {
        // If scrolling down at the last section, allow normal scroll
        if (scrollDown && currentIndex === sections.length - 1) {
          return // Don't prevent default, allow normal scroll
        }
        // If scrolling up at the first section, allow normal scroll
        if (scrollUp && currentIndex === 0) {
          return // Don't prevent default, allow normal scroll
        }
        return
      }

      // Prevent default scroll only if we're going to snap to another section
      e.preventDefault()

      // Set scrolling flag
      isScrolling.current = true

      // Scroll to next section
      const nextSection = sections[nextIndex] as HTMLElement
      if (nextSection) {
        // Get the exact top position of the section relative to the document
        const rect = nextSection.getBoundingClientRect()
        
        // Calculate navbar height (header + top banner if visible)
        const header = document.querySelector('header[data-testid="header"]') as HTMLElement
        const topBanner = document.querySelector('[data-testid="top-banner"]') as HTMLElement
        const navbarHeight = (header?.offsetHeight || 0) + (topBanner?.offsetHeight || 0)
        
        // For the first section (hero), scroll to top (0)
        // For sections after the first one (index > 0), account for navbar height
        // This ensures sections start right after the navbar
        let targetScroll
        if (nextIndex === 0) {
          // Hero section should start at the very top
          targetScroll = 0
        } else {
          // Other sections account for navbar
          targetScroll = Math.round(window.scrollY + rect.top - navbarHeight)
        }

        window.scrollTo({
          top: targetScroll,
          behavior: 'smooth'
        })

        // Reset scrolling flag after animation (reduced for faster response)
        if (scrollTimeout.current) {
          clearTimeout(scrollTimeout.current)
        }
        scrollTimeout.current = setTimeout(() => {
          isScrolling.current = false
        }, 800) // Faster response time (800ms instead of 1500ms)
      }
    }

    // Use passive: false to allow preventDefault
    window.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      window.removeEventListener('wheel', handleWheel)
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current)
      }
    }
  }, [])

  return null
}

