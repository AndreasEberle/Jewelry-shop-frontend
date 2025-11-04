'use client'

import { useState, useEffect } from 'react'
import api from '@/services/api'

interface MarqueeProps {
  className?: string
}

// Default fallback items
const DEFAULT_MARQUEE_ITEMS = [
  'Free Shipping Every Monday',
  'Birthday Perks',
  'Exclusive Product Access',
  'Priority Sale Access'
]

export function Marquee({ className = '' }: MarqueeProps) {
  const [items, setItems] = useState<string[]>(DEFAULT_MARQUEE_ITEMS)

  useEffect(() => {
    const loadMarqueeItems = async () => {
      try {
        const response = await api.get('/api/public/system-config/auth.modal.marquee.items')
        const value = response.data?.value
        
        if (value && typeof value === 'string' && value.trim().length > 0) {
          // Parse comma-separated or newline-separated items
          const parsedItems = value.split(/[,\n]/).map(item => item.trim()).filter(item => item.length > 0)
          if (parsedItems.length > 0) {
            setItems(parsedItems)
            return
          }
        }
        // If no valid value, use defaults
        setItems(DEFAULT_MARQUEE_ITEMS)
      } catch (error) {
        console.error('Failed to load marquee items from system config, using defaults:', error)
        // Use default items on error
        setItems(DEFAULT_MARQUEE_ITEMS)
      }
    }

    loadMarqueeItems()
  }, [])

  return (
    <div 
      role="marquee" 
      className={`w-full relative flex py-xs pr-xs md:py pl-2xl overflow-hidden focus-visible:ring-4 focus-visible:border-blue max-w-[100vw] border-y h-auto ${className}`}
      style={{ borderColor: 'rgb(0, 0, 0)' }}
      data-testid="marquee"
    >
      {[...Array(6)].map((_, repetitionIndex) => (
        <div
          key={repetitionIndex}
          data-testid="marquee-repetition"
          className="flex items-center justify-around shrink-0 overflow-hidden motion-safe:animate-marquee"
          style={{ animationDuration: '30s', animationPlayState: 'running' }}
        >
          {items.map((item, itemIndex) => (
            <div key={`${repetitionIndex}-${itemIndex}`} className="flex" style={{ color: 'rgb(0, 0, 0)', marginLeft: '48px' }}>
              <div data-testid={`marquee-item-text-${repetitionIndex}-${item}`}>
                <p className="type-body-1 text-content-inherit" style={{ fontFamily: '"SimonMono", "Courier New", Courier, monospace', fontWeight: 400 }}>
                  {item}
                </p>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

