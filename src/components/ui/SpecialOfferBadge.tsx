'use client'

import React, { useState, useEffect } from 'react'

interface SpecialOfferBadgeProps {
  originalPrice: number
  specialPrice: number
  currency?: string
  className?: string
  showPercentage?: boolean
  discountColor?: string
  originalPriceColor?: string
}

export function SpecialOfferBadge({ 
  originalPrice, 
  specialPrice, 
  currency = 'CHF',
  className = '',
  showPercentage = true,
  discountColor = '#ef4444',
  originalPriceColor = '#f97316'
}: SpecialOfferBadgeProps) {
  const [colors, setColors] = useState({
    discount: discountColor,
    original: originalPriceColor
  })

  // Load colors from system config
  useEffect(() => {
    const loadColors = async () => {
      try {
        const response = await fetch('/api/public/system-config')
        if (response.ok) {
          const configs = await response.json()
          const discountConfig = configs.find((config: any) => config.configKey === 'discount_color')
          const originalConfig = configs.find((config: any) => config.configKey === 'original_price_color')
          
          setColors({
            discount: discountConfig?.configValue || discountColor,
            original: originalConfig?.configValue || originalPriceColor
          })
        }
      } catch (error) {
        console.error('Failed to load discount colors:', error)
      }
    }

    loadColors()
  }, [discountColor, originalPriceColor])

  const discountPercentage = Math.round(((originalPrice - specialPrice) / originalPrice) * 100)

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Discount Badge */}
      <span 
        className="px-2 py-1 text-xs font-bold text-white rounded-full"
        style={{ backgroundColor: colors.discount }}
      >
        -{discountPercentage}%
      </span>
      
      {/* Price Display */}
      <div className="flex items-center space-x-2">
        {/* Special Price */}
        <span 
          className="text-lg font-bold"
          style={{ color: colors.discount }}
        >
          {currency} {specialPrice.toFixed(2)}
        </span>
        
        {/* Original Price */}
        <span 
          className="text-sm line-through"
          style={{ color: colors.original }}
        >
          {currency} {originalPrice.toFixed(2)}
        </span>
      </div>
    </div>
  )
}



