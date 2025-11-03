'use client'

import { useRef, MouseEvent, useState, useEffect } from 'react'
import { Plus, Minus } from 'lucide-react'

interface ProductImageZoomProps {
  image: {
    id: string
    url: string
    altText?: string
  }
  productName: string
}

export function ProductImageZoom({ image, productName }: ProductImageZoomProps) {
  const [isZoomed, setIsZoomed] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const cursorRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  // Initialize CSS variables
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.setProperty('--zoom-x', '0px')
      containerRef.current.style.setProperty('--zoom-y', '0px')
      containerRef.current.style.setProperty('--zoom-scale', '1')
    }
  }, [])

  const handleClick = () => {
    if (!containerRef.current) return
    
    const container = containerRef.current
    if (!isZoomed) {
      setIsZoomed(true)
      container.style.setProperty('--zoom-scale', '1.5')
      container.style.setProperty('--zoom-x', '0px')
      container.style.setProperty('--zoom-y', '0px')
    } else {
      setIsZoomed(false)
      container.style.setProperty('--zoom-scale', '1')
      container.style.setProperty('--zoom-x', '0px')
      container.style.setProperty('--zoom-y', '0px')
    }
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!containerRef.current) return
    
    const container = containerRef.current
    const rect = container.getBoundingClientRect()
    
    // Calculate mouse position relative to container
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    
    // Update cursor position - always track mouse, even when not zoomed
    if (cursorRef.current) {
      cursorRef.current.style.left = `${mouseX}px`
      cursorRef.current.style.top = `${mouseY}px`
    }
    
    // If zoomed, calculate pan position with clamping
    if (isZoomed && imageRef.current) {
      const scale = 1.5
      // Max pan distance: (zoomScale - 1) / zoomScale * 50% of container size
      // For 1.5x zoom: (1.5 - 1) / 1.5 * 0.5 = 0.33 / 1.5 * 0.5 = 0.166... which is ~16.67%
      const maxPanPercent = ((scale - 1) / scale) * 0.5
      const maxPanX = rect.width * maxPanPercent
      const maxPanY = rect.height * maxPanPercent
      
      // Calculate mouse position relative to container center
      const centerX = rect.width / 2
      const centerY = rect.height / 2
      
      // Calculate offset from center (normalized -1 to 1)
      const normalizedX = (mouseX - centerX) / centerX
      const normalizedY = (mouseY - centerY) / centerY
      
      // Apply pan (image moves opposite to mouse for natural feel)
      const panX = -normalizedX * maxPanX
      const panY = -normalizedY * maxPanY
      
      // Clamp to boundaries
      const clampedX = Math.max(-maxPanX, Math.min(maxPanX, panX))
      const clampedY = Math.max(-maxPanY, Math.min(maxPanY, panY))
      
      // Update CSS variables directly (no React state, instant GPU-accelerated update)
      container.style.setProperty('--zoom-x', `${clampedX}px`)
      container.style.setProperty('--zoom-y', `${clampedY}px`)
    }
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    if (!containerRef.current) return
    
    // Smoothly reset to center and zoom out when mouse leaves
    const container = containerRef.current
    container.style.setProperty('--zoom-x', '0px')
    container.style.setProperty('--zoom-y', '0px')
    
    if (isZoomed) {
      setIsZoomed(false)
      container.style.setProperty('--zoom-scale', '1')
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-square overflow-hidden bg-gray-100 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      onClick={handleClick}
      style={{ 
        marginBottom: '0', 
        cursor: 'none',
        // Initialize CSS variables
        '--zoom-x': '0px',
        '--zoom-y': '0px',
        '--zoom-scale': '1'
      } as React.CSSProperties}
    >
      <img
        ref={imageRef}
        src={image.url}
        alt={image.altText || `${productName} - Image`}
        className="w-full h-full object-cover"
        style={{
          transform: `scale(var(--zoom-scale, 1)) translate(var(--zoom-x, 0px), var(--zoom-y, 0px))`,
          transition: isZoomed ? 'transform 0.1s ease-out' : 'transform 0.3s ease-out',
          transformOrigin: 'center center',
          willChange: 'transform',
        }}
      />
      {/* Custom cursor - circle with + or - */}
      {isHovered && (
        <div
          ref={cursorRef}
          className="absolute pointer-events-none z-10"
          style={{
            transform: 'translate(-50%, -50%)',
            left: 0,
            top: 0,
          }}
        >
          <div className="rounded-full border-2 border-black flex items-center justify-center w-10 h-10 bg-transparent">
            {isZoomed ? (
              <Minus className="w-8 h-8 text-black" strokeWidth={1.5} />
            ) : (
              <Plus className="w-8 h-8 text-black" strokeWidth={1.5} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
