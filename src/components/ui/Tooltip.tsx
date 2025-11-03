'use client'

import React, { useState, useRef, useEffect } from 'react'

interface TooltipProps {
  content: string
  children: React.ReactNode
  maxWidth?: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}

export function Tooltip({ 
  content, 
  children, 
  maxWidth = '300px',
  position = 'top',
  className = ''
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect()
      const tooltipRect = tooltipRef.current.getBoundingClientRect()
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft

      let top = 0
      let left = 0

      switch (position) {
        case 'top':
          top = triggerRect.top + scrollTop - tooltipRect.height - 8
          left = triggerRect.left + scrollLeft + (triggerRect.width - tooltipRect.width) / 2
          break
        case 'bottom':
          top = triggerRect.bottom + scrollTop + 8
          left = triggerRect.left + scrollLeft + (triggerRect.width - tooltipRect.width) / 2
          break
        case 'left':
          top = triggerRect.top + scrollTop + (triggerRect.height - tooltipRect.height) / 2
          left = triggerRect.left + scrollLeft - tooltipRect.width - 8
          break
        case 'right':
          top = triggerRect.top + scrollTop + (triggerRect.height - tooltipRect.height) / 2
          left = triggerRect.right + scrollLeft + 8
          break
      }

      // Ensure tooltip stays within viewport
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      if (left < 0) left = 8
      if (left + tooltipRect.width > viewportWidth) left = viewportWidth - tooltipRect.width - 8
      if (top < 0) top = 8
      if (top + tooltipRect.height > viewportHeight + scrollTop) top = viewportHeight + scrollTop - tooltipRect.height - 8

      setTooltipPosition({ top, left })
    }
  }, [isVisible, position])

  return (
    <div 
      ref={triggerRef}
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          ref={tooltipRef}
          className="fixed z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg pointer-events-none"
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
            maxWidth: maxWidth,
            wordWrap: 'break-word'
          }}
        >
          {content}
          {/* Arrow */}
          <div className={`absolute w-2 h-2 bg-gray-900 transform rotate-45 ${
            position === 'top' ? 'top-full left-1/2 -translate-x-1/2 -translate-y-1' :
            position === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 translate-y-1' :
            position === 'left' ? 'left-full top-1/2 -translate-y-1/2 -translate-x-1' :
            'right-full top-1/2 -translate-y-1/2 translate-x-1'
          }`} />
        </div>
      )}
    </div>
  )
}



