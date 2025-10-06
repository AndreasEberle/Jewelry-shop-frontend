'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  Package, 
  Image, 
  Users, 
  Settings, 
  Menu, 
  X,
  LogOut,
  User,
  ShoppingCart,
  Globe,
  CreditCard
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { CurrencySelector } from '@/components/CurrencySelector'

interface AdminLayoutProps {
  children: React.ReactNode
}

const navigation = [
  { name: 'Analytics Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { name: 'Payments', href: '/admin/payments', icon: CreditCard },
  { name: 'Products', href: '/admin/products', icon: Package },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
]

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout, isAuthenticated, isLoading } = useAuth()
  const { currentLanguage, setLanguage, getLanguageFlag, getLanguageName, supportedLanguages } = useLanguage()
  const { currentCurrency } = useCurrency()

  const isActive = (href: string) => pathname === href

  // Check authentication and admin role
  useEffect(() => {
    const checkAuth = async () => {
      // Wait for auth to finish loading
      if (isLoading) return
      
      setIsCheckingAuth(false)
      
      // Check if user is authenticated and has admin role
      if (!isAuthenticated || !user) {
        router.push('/')
        return
      }
      
      if (!user.roles?.includes('ADMIN')) {
        router.push('/')
        return
      }
    }

    checkAuth()
  }, [isAuthenticated, user, isLoading, router])

  // Show loading spinner while checking auth
  if (isCheckingAuth || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  // Don't render anything if not authenticated or not admin
  if (!isAuthenticated || !user || !user.roles?.includes('ADMIN')) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex w-64 flex-col bg-white shadow-xl">
          <div className="flex h-16 items-center justify-between px-4">
            <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive(item.href)
                      ? 'bg-primary-100 text-primary-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
          
          {/* Language Switcher - Mobile */}
          <div className="border-t border-gray-200 p-4">
            <div className="mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-sm font-medium text-gray-700">Language</span>
              </div>
              <div className="grid grid-cols-2 gap-1">
                {supportedLanguages.map((langCode) => (
                  <button
                    key={langCode}
                    onClick={() => {
                      setLanguage(langCode)
                      setSidebarOpen(false)
                    }}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                      currentLanguage === langCode
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    title={getLanguageName(langCode)}
                  >
                    <span className="mr-1">{getLanguageFlag(langCode)}</span>
                    {langCode.split('-')[0].toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Currency Selector - Mobile */}
            <div className="mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-sm font-medium text-gray-700">Currency</span>
              </div>
              <CurrencySelector />
            </div>
          </div>
          
          {/* User info at bottom */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <User className="h-8 w-8 text-gray-400" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-700">
                  {user?.firstName && user?.lastName 
                    ? `${user.firstName} ${user.lastName}` 
                    : user?.email}
                </p>
                <p className="text-xs text-gray-500">
                  {user?.roles?.includes('ADMIN') ? 'Administrator' : 'User'}
                </p>
              </div>
              <button
                onClick={logout}
                className="ml-2 text-gray-400 hover:text-gray-600"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-4">
            <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive(item.href)
                      ? 'bg-primary-100 text-primary-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
          
          {/* Language Switcher - Desktop */}
          <div className="border-t border-gray-200 p-4">
            <div className="mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-sm font-medium text-gray-700">Language</span>
              </div>
              <div className="grid grid-cols-2 gap-1">
                {supportedLanguages.map((langCode) => (
                  <button
                    key={langCode}
                    onClick={() => setLanguage(langCode)}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                      currentLanguage === langCode
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    title={getLanguageName(langCode)}
                  >
                    <span className="mr-1">{getLanguageFlag(langCode)}</span>
                    {langCode.split('-')[0].toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Currency Selector - Desktop */}
            <div className="mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-sm font-medium text-gray-700">Currency</span>
              </div>
              <CurrencySelector />
            </div>
          </div>
          
          {/* User info at bottom */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <User className="h-8 w-8 text-gray-400" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-700">
                  {user?.firstName && user?.lastName 
                    ? `${user.firstName} ${user.lastName}` 
                    : user?.email}
                </p>
                <p className="text-xs text-gray-500">
                  {user?.roles?.includes('ADMIN') ? 'Administrator' : 'User'}
                </p>
              </div>
              <button
                onClick={logout}
                className="ml-2 text-gray-400 hover:text-gray-600"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1"></div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" />
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
