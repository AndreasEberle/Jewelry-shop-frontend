'use client'

import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
}

export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  children, 
  className = '' 
}) => {
  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey)
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return createPortal(
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-[999999] flex justify-center items-center backdrop-blur-sm"
      style={{ zIndex: 999999 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div 
        className={`relative p-8 border w-full max-w-md md:max-w-2xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto z-[1000000] ${className}`}
        style={{ zIndex: 1000000 }}
      >
        {children}
      </div>
    </div>,
    document.body
  )
}
