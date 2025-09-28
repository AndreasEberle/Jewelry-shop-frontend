'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ShoppingCart, User, Search, Menu, X } from 'lucide-react'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

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
            <button className="p-2 text-gray-700 hover:text-primary-600 transition-colors">
              <Search className="h-5 w-5" />
            </button>
            <button className="p-2 text-gray-700 hover:text-primary-600 transition-colors">
              <User className="h-5 w-5" />
            </button>
            <button className="p-2 text-gray-700 hover:text-primary-600 transition-colors relative">
              <ShoppingCart className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                0
              </span>
            </button>
            
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
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
