'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { X, User, MapPin, Package, Heart, LogOut, AlertCircle, XCircle, Ban, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useOrderStats } from '@/hooks/useOrderStats'
import { useTranslation } from '@/hooks/useTranslation'

interface AccountDropdownProps {
  isOpen: boolean
  onClose: () => void
}

export function AccountDropdown({ isOpen, onClose }: AccountDropdownProps) {
  const { user, logout } = useAuth()
  const { t } = useTranslation()
  const router = useRouter()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const isAdmin = user?.roles?.includes('ADMIN')
  const { getStatusCount, getNonDeliveredCount, loading: statsLoading } = useOrderStats()
  
  // Get counts for different statuses
  const nonDeliveredCount = isAdmin ? getNonDeliveredCount() : 0
  const cancelledCount = isAdmin ? getStatusCount('CANCELLED') : 0
  const refundedCount = isAdmin ? getStatusCount('REFUNDED') : 0
  
  // Debug logging
  useEffect(() => {
    if (isAdmin) {
      console.log('[AccountDropdown] Admin user detected:', user?.roles)
      console.log('[AccountDropdown] Non-delivered:', nonDeliveredCount, 'Cancelled:', cancelledCount, 'Refunded:', refundedCount)
      console.log('[AccountDropdown] Stats loading:', statsLoading)
    }
  }, [isAdmin, nonDeliveredCount, cancelledCount, refundedCount, statsLoading, user?.roles])

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

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black z-[100] transition-opacity duration-500 ease-in-out ${
          isOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* Dropdown Panel */}
      <div
        ref={dropdownRef}
        className={`fixed right-0 top-0 h-full w-full md:w-[450px] bg-white shadow-2xl z-[101] overflow-y-auto transition-transform duration-500 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col px-lg py-xl relative bg-white">
          {/* Elegant Header with Border */}
          <div className="border-b border-gray-200 pb-6 mb-6">
            <div className="flex items-center justify-end">
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
              <div className="mt-4 flex items-center gap-3 ml-8 md:ml-12">
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
              className="group relative pointer-events-auto ease-ease duration-300 focus-visible:ring-1 ring-utility-focus ring-offset-4 outline-none w-full px-4 py-3 transition-all"
              data-testid="internal-link"
              aria-label="My Profile"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-content" />
                  <p className="type-utility-1 text-content uppercase tracking-normal !font-normal bg-link-underline bg-[length:0%_1px] hover:bg-[length:100%_1px] transition-[background-size] duration-300 ease-ease">{t('account.myProfile')}</p>
                </div>
                <svg className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
            
            <Link
              href={user?.roles?.includes('ADMIN') ? '/account/addresses' : '/user-account/addresses'}
              onClick={onClose}
              className="group relative pointer-events-auto ease-ease duration-300 focus-visible:ring-1 ring-utility-focus ring-offset-4 outline-none w-full px-4 py-3 transition-all"
              data-testid="internal-link"
              aria-label="Addresses"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-content" />
                  <p className="type-utility-1 text-content uppercase tracking-normal !font-normal bg-link-underline bg-[length:0%_1px] hover:bg-[length:100%_1px] transition-[background-size] duration-300 ease-ease">{t('account.addresses')}</p>
                </div>
                <svg className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
            
            <Link
              href={user?.roles?.includes('ADMIN') ? '/account/orders' : '/user-account/orders'}
              onClick={onClose}
              className="group relative pointer-events-auto ease-ease duration-300 focus-visible:ring-1 ring-utility-focus ring-offset-4 outline-none w-full px-4 py-3 transition-all"
              data-testid="internal-link"
              aria-label="My Orders"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-content" />
                  <p className="type-utility-1 text-content uppercase tracking-normal !font-normal bg-link-underline bg-[length:0%_1px] hover:bg-[length:100%_1px] transition-[background-size] duration-300 ease-ease">{t('account.myOrders')}</p>
                </div>
                <svg className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
            
            <Link
              href={user?.roles?.includes('ADMIN') ? '/account/wishlist' : '/user-account/wishlist'}
              onClick={onClose}
              className="group relative pointer-events-auto ease-ease duration-300 focus-visible:ring-1 ring-utility-focus ring-offset-4 outline-none w-full px-4 py-3 transition-all"
              data-testid="internal-link"
              aria-label="Wishlist"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Heart className="w-5 h-5 text-content" />
                  <p className="type-utility-1 text-content uppercase tracking-normal !font-normal bg-link-underline bg-[length:0%_1px] hover:bg-[length:100%_1px] transition-[background-size] duration-300 ease-ease">{t('account.wishlist')}</p>
                </div>
                <svg className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
            
            {/* Sign Out Button */}
            <form method="post" className="w-full" onSubmit={(e) => { e.preventDefault(); handleSignOut(); }}>
              <button
                type="submit"
                className="group relative pointer-events-auto ease-ease duration-300 focus-visible:ring-1 ring-utility-focus ring-offset-4 outline-none w-full px-4 py-3 transition-all text-left"
                data-title="Sign Out"
                accessibility-role="button"
                accessibility-label="sign out"
                data-testid="sign-out-button"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <LogOut className="w-5 h-5 text-content" />
                    <p className="type-utility-1 text-content uppercase tracking-normal !font-normal bg-link-underline bg-[length:0%_1px] hover:bg-[length:100%_1px] transition-[background-size] duration-300 ease-ease">{t('account.signOut')}</p>
                  </div>
                  <svg className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            </form>

            {/* Admin Section Separator */}
            {isAdmin && (
              <>
                <div className="my-2 h-px bg-gray-200"></div>
                <Link
                  href="/admin"
                  onClick={onClose}
                  className="group relative pointer-events-auto ease-ease duration-300 focus-visible:ring-1 ring-utility-focus ring-offset-4 outline-none w-full px-4 py-3 transition-all"
                  data-testid="internal-link"
                  aria-label="Admin Dashboard"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <p className="type-utility-1 text-blue-600 uppercase tracking-normal !font-normal bg-link-underline bg-[length:0%_1px] hover:bg-[length:100%_1px] transition-[background-size] duration-300 ease-ease">{t('account.adminDashboard')}</p>
                    </div>
                    <svg className="w-4 h-4 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
                
                {/* Order Status Counts */}
                <div className="mt-2 space-y-1">
                  <Link
                    href="/admin/orders?status=all"
                    onClick={onClose}
                    className="flex items-center justify-between px-4 py-2 hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-4 h-4 text-orange-500" />
                      <span className="text-sm text-gray-700">{t('account.notDelivered')}</span>
                    </div>
                    <span className="bg-orange-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                      {nonDeliveredCount || 0}
                    </span>
                  </Link>
                  <Link
                    href="/admin/orders?status=CANCELLED"
                    onClick={onClose}
                    className="flex items-center justify-between px-4 py-2 hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <XCircle className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-gray-700">{t('account.cancelled')}</span>
                    </div>
                    <span className="bg-red-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                      {cancelledCount || 0}
                    </span>
                  </Link>
                  <Link
                    href="/admin/orders?status=REFUNDED"
                    onClick={onClose}
                    className="flex items-center justify-between px-4 py-2 hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <RefreshCw className="w-4 h-4 text-purple-500" />
                      <span className="text-sm text-gray-700">{t('account.refunded')}</span>
                    </div>
                    <span className="bg-purple-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                      {refundedCount || 0}
                    </span>
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

