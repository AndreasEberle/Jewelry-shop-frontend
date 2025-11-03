'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { X } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface AccountDropdownProps {
  isOpen: boolean
  onClose: () => void
}

export function AccountDropdown({ isOpen, onClose }: AccountDropdownProps) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      // Prevent body scroll when dropdown is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  const handleSignOut = async () => {
    await logout()
    onClose()
    router.push('/')
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-20 z-[100]"
        onClick={onClose}
      />
      
      {/* Dropdown Panel */}
      <div
        ref={dropdownRef}
        className="fixed right-0 top-0 h-full w-full md:w-[450px] bg-white shadow-2xl z-[101] overflow-y-auto"
        style={{ 
          animation: 'slideIn 0.3s ease-out',
          background: 'linear-gradient(to bottom, #ffffff 0%, #fafafa 100%)'
        }}
      >
        <style jsx>{`
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}</style>
        
        <div className="h-full flex flex-col px-lg py-xl relative">
          {/* Elegant Header with Border */}
          <div className="border-b border-gray-200 pb-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-sm">
                <h2 className="type-heading-5 text-content uppercase tracking-wide">My Account</h2>
                <svg 
                  className="w-md h-md rotate-0 transform transition-transform duration-300 text-gray-400" 
                  width="16" 
                  height="16" 
                  viewBox="0 0 16 16" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <title>Arrow</title>
                  <path 
                    d="M9.00794 11.6204C8.79828 11.8001 8.77399 12.1157 8.95371 12.3254C9.13342 12.5351 9.44907 12.5593 9.65873 12.3796L9.00794 11.6204ZM14.3254 8.37963C14.5351 8.19992 14.5593 7.88427 14.3796 7.6746C14.1999 7.46494 13.8843 7.44066 13.6746 7.62037L14.3254 8.37963ZM13.6746 8.37963C13.8843 8.55934 14.1999 8.53506 14.3796 8.3254C14.5593 8.11573 14.5351 7.80008 14.3254 7.62037L13.6746 8.37963ZM9.65873 3.62037C9.44907 3.44066 9.13342 3.46494 8.95371 3.6746C8.774 3.88427 8.79828 4.19992 9.00794 4.37963L9.65873 3.62037ZM14 8.5C14.2761 8.5 14.5 8.27614 14.5 8C14.5 7.72386 14.2761 7.5 14 7.5L14 8.5ZM2 7.5C1.72386 7.5 1.5 7.72386 1.5 8C1.5 8.27614 1.72386 8.5 2 8.5L2 7.5ZM9.33333 12L9.65873 12.3796L14.3254 8.37963L14 8L13.6746 7.62037L9.00794 11.6204L9.33333 12ZM14 8L14.3254 7.62037L9.65873 3.62037L9.33333 4L9.00794 4.37963L13.6746 8.37963L14 8ZM14 8L14 7.5L2 7.5L2 8L2 8.5L14 8.5L14 8Z" 
                    fill="currentColor"
                  />
                </svg>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors group"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-500 group-hover:text-gray-700 transition-colors" />
              </button>
            </div>
            
            {/* User Info */}
            {user && (
              <div className="mt-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 font-semibold">
                  {user.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email}
                  </p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </div>
            )}
          </div>

          {/* Menu Items */}
          <div className="flex flex-col gap-1">
            <Link
              href={user?.roles?.includes('ADMIN') ? '/account/profile' : '/user-account/profile'}
              onClick={onClose}
              className="group relative pointer-events-auto ease-ease duration-300 focus-visible:ring-1 ring-utility-focus ring-offset-4 outline-none w-full px-4 py-3 rounded-lg hover:bg-gray-50 transition-all"
              data-testid="internal-link"
              aria-label="My Profile"
            >
              <div className="flex items-center justify-between">
                <p className="type-utility-1 text-content !normal-case !font-normal">My Profile</p>
                <svg className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
            
            <Link
              href={user?.roles?.includes('ADMIN') ? '/account/store-credit-and-gift-cards' : '/user-account/store-credit-and-gift-cards'}
              onClick={onClose}
              className="group relative pointer-events-auto ease-ease duration-300 focus-visible:ring-1 ring-utility-focus ring-offset-4 outline-none w-full px-4 py-3 rounded-lg hover:bg-gray-50 transition-all"
              data-testid="internal-link"
              aria-label="Store Credits"
            >
              <div className="flex items-center justify-between">
                <p className="type-utility-1 text-content !normal-case !font-normal">Store Credits</p>
                <svg className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
            
            <Link
              href={user?.roles?.includes('ADMIN') ? '/account/orders' : '/user-account/orders'}
              onClick={onClose}
              className="group relative pointer-events-auto ease-ease duration-300 focus-visible:ring-1 ring-utility-focus ring-offset-4 outline-none w-full px-4 py-3 rounded-lg hover:bg-gray-50 transition-all"
              data-testid="internal-link"
              aria-label="My Orders"
            >
              <div className="flex items-center justify-between">
                <p className="type-utility-1 text-content !normal-case !font-normal">My Orders</p>
                <svg className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
            
            <Link
              href={user?.roles?.includes('ADMIN') ? '/account/returns' : '/user-account/returns'}
              onClick={onClose}
              className="group relative pointer-events-auto ease-ease duration-300 focus-visible:ring-1 ring-utility-focus ring-offset-4 outline-none w-full px-4 py-3 rounded-lg hover:bg-gray-50 transition-all"
              data-testid="internal-link"
              aria-label="Returns"
            >
              <div className="flex items-center justify-between">
                <p className="type-utility-1 text-content !normal-case !font-normal">Returns</p>
                <svg className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>

            {/* Admin Section Separator */}
            {user?.roles?.includes('ADMIN') && (
              <>
                <div className="my-2 h-px bg-gray-200"></div>
                <Link
                  href="/admin"
                  onClick={onClose}
                  className="group relative pointer-events-auto ease-ease duration-300 focus-visible:ring-1 ring-utility-focus ring-offset-4 outline-none w-full px-4 py-3 rounded-lg hover:bg-blue-50 transition-all border-l-2 border-transparent hover:border-blue-500"
                  data-testid="internal-link"
                  aria-label="Admin Dashboard"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <p className="type-utility-1 text-blue-600 !normal-case !font-normal">Admin Dashboard</p>
                    </div>
                    <svg className="w-4 h-4 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              </>
            )}
          </div>

          {/* Sign Out Button */}
          <div className="mt-auto pt-6 border-t border-gray-200">
            <form method="post" className="w-full" onSubmit={(e) => { e.preventDefault(); handleSignOut(); }}>
              <button
                type="submit"
                className="relative pointer-events-auto inline-block outline-none w-full px-4 py-3 rounded-lg hover:bg-red-50 transition-colors text-left group"
                data-title="Sign Out"
                accessibility-role="button"
                accessibility-label="sign out"
                data-testid="sign-out-button"
              >
                <span className="flex items-center gap-xxs preserve-line-height justify-start">
                  <p className="type-utility-3 text-red-600 group-hover:text-red-700 !font-normal !uppercase tracking-wide">Sign Out</p>
                </span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}

