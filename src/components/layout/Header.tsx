'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ShoppingCart, User, Search, Menu, X, LogOut } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { AuthModal } from '@/components/auth/AuthModal'
import { CurrencySelector } from '@/components/CurrencySelector'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')

  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthMode(mode)
    setIsAuthModalOpen(true)
  }

  const closeAuthModal = () => {
    setIsAuthModalOpen(false)
    // Reset to login mode when closing
    setAuthMode('login')
  }
  const { user, isAuthenticated, isLoading, logout } = useAuth()
  const { itemCount } = useCart()
  const { currentLanguage, getLanguageFlag } = useLanguage()

  // Debug logging for Header
  console.log('Header: Auth state:', { 
    user: user ? `${user.email} (${user.roles?.join(', ')})` : 'null', 
    isAuthenticated, 
    isLoading 
  })

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-2xl font-bold text-primary-600">
              JewelryShop
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link href="/" className="text-gray-700 hover:text-primary-600 transition-colors">
              Home
            </Link>
            <Link href="/products" className="text-gray-700 hover:text-primary-600 transition-colors">
              Products
            </Link>
            <Link href="/categories" className="text-gray-700 hover:text-primary-600 transition-colors">
              Categories
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-primary-600 transition-colors">
              About
            </Link>
            <Link href="/contact" className="text-gray-700 hover:text-primary-600 transition-colors">
              Contact
            </Link>
          </nav>

          {/* Right side icons */}
          <div className="flex items-center space-x-4">
            <CurrencySelector />
            <button className="p-2 text-gray-700 hover:text-primary-600 transition-colors">
              <Search className="h-5 w-5" />
            </button>
            
            {/* User Authentication */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <Link
                    href={user?.roles?.includes('ADMIN') ? '/account' : '/user-account'}
                    className="p-2 text-gray-700 hover:text-primary-600 transition-colors"
                    title={user?.roles?.includes('ADMIN') ? 'Admin Dashboard' : 'My Account'}
                  >
                    <User className="h-5 w-5" />
                  </Link>
                  <span className="text-lg" title={`Current language: ${currentLanguage}`}>
                    {getLanguageFlag(currentLanguage)}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-gray-700 hover:text-primary-600 transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <div className="p-2 text-gray-400">
                    <User className="h-5 w-5 animate-pulse" />
                  </div>
                  <span className="text-lg animate-pulse">
                    {getLanguageFlag(currentLanguage)}
                  </span>
                </div>
                <div className="text-sm text-gray-400 animate-pulse">
                  Loading...
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => openAuthModal('login')}
                    className="p-2 text-gray-700 hover:text-primary-600 transition-colors"
                    title="Login"
                  >
                    <User className="h-5 w-5" />
                  </button>
                  <span className="text-lg" title={`Current language: ${currentLanguage}`}>
                    {getLanguageFlag(currentLanguage)}
                  </span>
                </div>
                <button
                  onClick={() => openAuthModal('register')}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Sign Up
                </button>
              </div>
            )}
            
            {/* Cart */}
            <Link href="/cart" className="p-2 text-gray-700 hover:text-primary-600 transition-colors relative">
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>
            
            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-gray-700 hover:text-primary-600 transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t">
              <Link href="/" className="block px-3 py-2 text-gray-700 hover:text-primary-600 transition-colors">
                Home
              </Link>
              <Link href="/products" className="block px-3 py-2 text-gray-700 hover:text-primary-600 transition-colors">
                Products
              </Link>
              <Link href="/categories" className="block px-3 py-2 text-gray-700 hover:text-primary-600 transition-colors">
                Categories
              </Link>
              <Link href="/about" className="block px-3 py-2 text-gray-700 hover:text-primary-600 transition-colors">
                About
              </Link>
              <Link href="/contact" className="block px-3 py-2 text-gray-700 hover:text-primary-600 transition-colors">
                Contact
              </Link>
              
              {/* Mobile Auth */}
              {isLoading ? (
                <div className="space-y-1">
                  <div className="flex items-center justify-between px-3 py-2 text-gray-400 animate-pulse">
                    <span>Loading...</span>
                    <span className="text-lg">{getLanguageFlag(currentLanguage)}</span>
                  </div>
                </div>
              ) : !isAuthenticated ? (
                <div className="space-y-1">
                  <div className="flex items-center justify-between px-3 py-2">
                    <button
                      onClick={() => {
                        setAuthMode('login')
                        setIsAuthModalOpen(true)
                        setIsMenuOpen(false)
                      }}
                      className="text-gray-700 hover:text-primary-600 transition-colors"
                    >
                      Sign In
                    </button>
                    <span className="text-lg" title={`Current language: ${currentLanguage}`}>
                      {getLanguageFlag(currentLanguage)}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setAuthMode('register')
                      setIsAuthModalOpen(true)
                      setIsMenuOpen(false)
                    }}
                    className="block w-full text-left px-3 py-2 text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    Sign Up
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center justify-between px-3 py-2">
                    <Link
                      href={user?.roles?.includes('ADMIN') ? '/account' : '/user-account'}
                      onClick={() => setIsMenuOpen(false)}
                      className="text-gray-700 hover:text-primary-600 transition-colors"
                    >
                      {user?.roles?.includes('ADMIN') ? 'Admin Dashboard' : 'My Account'}
                    </Link>
                    <span className="text-lg" title={`Current language: ${currentLanguage}`}>
                      {getLanguageFlag(currentLanguage)}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      logout()
                      setIsMenuOpen(false)
                    }}
                    className="block w-full text-left px-3 py-2 text-gray-700 hover:text-primary-600 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Auth Modal */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={closeAuthModal}
          initialMode={authMode}
        />
    </header>
  )
}

