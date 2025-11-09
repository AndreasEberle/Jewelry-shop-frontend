'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingBag, User, Search, Menu, X, Heart } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'
import { useBranding } from '@/hooks/useBranding'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useSectionStyles } from '@/hooks/useSectionStyles'
import { AuthModal } from '@/components/auth/AuthModal'
import { CurrencySelector } from '@/components/CurrencySelector'
import { LanguageSelectorCompact } from '@/components/LanguageSelectorCompact'
import { SearchNavbar } from '@/components/SearchNavbar'
import { TopBanner } from './TopBanner'
import { favoriteService } from '@/services/favoriteService'
import { AccountDropdown } from '@/components/AccountDropdown'
import { CartDrawer } from '@/components/CartDrawer'
import { useCurrencyConfig } from '@/hooks/useCurrencyConfig'
import { useOrderStats } from '@/hooks/useOrderStats'
import { useTranslation } from '@/hooks/useTranslation'

interface HeaderProps {
  backgroundImage?: string | null
}

export function Header({ backgroundImage }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false)
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')

  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthMode(mode)
    setIsAuthModalOpen(true)
  }

  const closeAuthModal = () => {
    setIsAuthModalOpen(false)
    setAuthMode('login')
  }

  const { user, isAuthenticated, logout } = useAuth()
  const { itemCount } = useCart()
  const { brandingConfig, loading: brandingLoading, getShopNameStyle, getLogoStyle } = useBranding()
  const { navbarName } = usePageTitle()
  const { getBackgroundStyle, getTextStyle, getOverlayStyle } = useSectionStyles()
  const { config: currencyConfig } = useCurrencyConfig()
  const isAdmin = user?.roles?.includes('ADMIN')
  const { getNonDeliveredCount, loading: statsLoading } = useOrderStats()
  const nonDeliveredCount = isAdmin ? getNonDeliveredCount() : 0
  const { t, isLoading: isLanguageLoading } = useTranslation()
  
  // Debug logging
  useEffect(() => {
    if (isAdmin) {
      console.log('[Header] Admin user detected:', user?.roles)
      console.log('[Header] Non-delivered count:', nonDeliveredCount)
      console.log('[Header] Stats loading:', statsLoading)
    }
  }, [isAdmin, nonDeliveredCount, statsLoading, user?.roles])
  const [favoriteCount, setFavoriteCount] = useState(0)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [hasScrolled, setHasScrolled] = useState(false)
  const pathname = usePathname()
  const isHomepage = pathname === '/'
  
  // Hide navbar on homepage until user scrolls
  useEffect(() => {
    if (!isHomepage) {
      setHasScrolled(true) // Always show on other pages
      return
    }
    
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setHasScrolled(true)
      }
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isHomepage])

  // Only show skeleton on initial load until branding is ready
  useEffect(() => {
    if (!brandingLoading && brandingConfig) {
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => {
        setIsInitialLoad(false)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [brandingLoading, brandingConfig])

  const showSkeleton = isInitialLoad || brandingLoading

  // Load favorite count on mount and when authentication changes
  useEffect(() => {
    const loadFavoriteCount = () => {
      if (isAuthenticated) {
        favoriteService.getFavorites()
          .then(favorites => setFavoriteCount(favorites.length))
          .catch((err) => {
            console.error('Failed to get favorites:', err)
            setFavoriteCount(0)
          })
      } else {
        setFavoriteCount(0)
      }
    }
    
    loadFavoriteCount()
    
    // Listen for favorite changes from anywhere in the app
    const handleFavoriteChange = () => {
      loadFavoriteCount()
    }
    
    window.addEventListener('favoriteChanged', handleFavoriteChange)
    
    return () => {
      window.removeEventListener('favoriteChanged', handleFavoriteChange)
    }
  }, [isAuthenticated])
  
  // Listen for cart drawer open event
  useEffect(() => {
    const handleOpenCartDrawer = () => {
      setIsCartDrawerOpen(true)
    }
    
    window.addEventListener('openCartDrawer', handleOpenCartDrawer)
    return () => {
      window.removeEventListener('openCartDrawer', handleOpenCartDrawer)
    }
  }, [])
  
  // Debug logging
  useEffect(() => {
    console.log('Header Debug Info:', {
      brandingConfig: brandingConfig ? { shopName: brandingConfig.shopName, logoUrl: brandingConfig.logoUrl } : 'NULL',
      navbarName: navbarName || 'NULL',
      isAuthenticated,
      itemCount
    })
  }, [brandingConfig, navbarName, isAuthenticated, itemCount])

  const navBackgroundStyle = getBackgroundStyle('navigation')
  const navTextStyle = { ...getTextStyle('navigation'), color: '#000000' }
  const navOverlayStyle = getOverlayStyle('navigation')

  const combinedBackgroundStyle = {
    ...navBackgroundStyle,
    ...(backgroundImage && {
      backgroundImage: `url(${backgroundImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    })
  }

  // Don't render header on homepage until scrolled
  if (isHomepage && !hasScrolled) {
    return null
  }

  return (
    <>
      {(!isHomepage || hasScrolled) && <TopBanner />}
      <header
        className={`sticky top-0 z-50 w-full bg-white text-gray-900 min-h-[60px] transition-opacity duration-200 ${isSearchOpen ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}
        style={{ position: 'sticky', top: 0, zIndex: 50, minHeight: '60px', display: 'block' }}
        role="banner"
        data-testid="header"
      >
            <div className="relative flex flex-col lg:flex-row items-center lg:items-center lg:justify-between lg:!mr-0 w-full p-md lg:px-xl lg:py-lg min-h-[60px] gap-2 lg:gap-0">
              {/* Desktop Logo + Navigation */}
              <div className="flex items-center lg:gap-8" style={{ paddingLeft: '50px' }}>
                {/* Desktop Logo */}
                <div className="hidden lg:block lg:mr-xl flex-shrink-0">
                  {showSkeleton ? (
                    <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    <Link
                      aria-label={`${navbarName || brandingConfig?.shopName || 'Jewelry Shop'} logo - Click to return to the homepage`}
                      href="/"
                      className="pointer-events-auto transition-[color] ease-ease duration-300 focus-visible:ring-1 ring-utility-focus ring-offset-4 outline-none type-heading-6 tracking-normal block"
                      data-testid="nav-link"
                    >
                      {brandingConfig?.logoUrl ? (
                        <img
                          src={brandingConfig.logoUrl}
                          alt={brandingConfig.logoAltText || 'Logo'}
                          style={getLogoStyle()}
                          className="overflow-visible"
                        />
                      ) : (
                        <span style={{ ...getShopNameStyle(), color: '#000000' }}>
                          {navbarName || brandingConfig?.shopName || 'JewelryShop'}
                        </span>
                      )}
                    </Link>
                  )}
                </div>

                {/* Desktop Navigation Links */}
                <nav aria-label="primary menu" data-orientation="horizontal" dir="ltr" data-testid="header-nav-root" className="hidden lg:block">
                  <div tabIndex={-1} aria-hidden="true" className="hh-overlay hidden top-full z-below" data-testid="mega-menu-overlay"></div>
                  <div style={{ position: 'relative' }}>
                    {showSkeleton ? (
                      <div className="flex items-center gap-6">
                        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    ) : (
                      <ul
                        data-orientation="horizontal"
                        data-testid="header-main-menu"
                        className="flex items-center gap-6"
                        dir="ltr"
                      >
                        <li className="whitespace-nowrap">
                          <button 
                            type="button"
                            className="relative pointer-events-auto inline-block text-center outline-none border border-content hover:border-utility-hover disabled:text-utility-disabled focus-visible:ring-2 ring-utility-focus ring-offset-2 transition-colors duration-300 ease-ease bg-transparent border-none p-0 tracking-utility uppercase tracking-normal type-heading-6" 
                            data-title="Mega Menu" 
                            accessibility-role="menuitem" 
                            accessibility-label="Menu"
                          >
                            <span className="flex justify-center items-center gap-xxs preserve-line-height w-fit text-current">
                              <Link
                                href="/products"
                                aria-label="All Jewelry "
                                aria-expanded="false"
                                aria-haspopup="menu"
                                data-testid="nav-link"
                                className="relative inline-block pointer-events-auto ease-ease duration-300 focus-visible:ring-1 ring-utility-focus ring-offset-4 outline-none uppercase tracking-normal w-fit flex items-center gap-xxs font-normal text-current after:content-[''] after:absolute after:right-0 after:bottom-0 after:h-[2px] after:bg-current after:w-0 hover:after:w-full after:transition-all after:duration-300"
                                style={{ ...navTextStyle, fontSize: '0.75em' }}
                              >
                                {t('nav.allJewelry')}
                              </Link>
                            </span>
                          </button>
                        </li>
                        <li className="whitespace-nowrap">
                          <button 
                            type="button"
                            className="relative pointer-events-auto inline-block text-center outline-none border border-content hover:border-utility-hover disabled:text-utility-disabled focus-visible:ring-2 ring-utility-focus ring-offset-2 transition-colors duration-300 ease-ease bg-transparent border-none p-0 tracking-utility uppercase tracking-normal type-heading-6" 
                            data-title="Mega Menu" 
                            accessibility-role="menuitem" 
                            accessibility-label="Menu"
                          >
                            <span className="flex justify-center items-center gap-xxs preserve-line-height w-fit text-current">
                              <Link
                                href="/products?new=true"
                                aria-label="New In"
                                aria-expanded="false"
                                aria-haspopup="menu"
                                data-testid="nav-link"
                                className="relative inline-block pointer-events-auto ease-ease duration-300 focus-visible:ring-1 ring-utility-focus ring-offset-4 outline-none uppercase tracking-normal w-fit flex items-center gap-xxs font-normal text-current after:content-[''] after:absolute after:right-0 after:bottom-0 after:h-[2px] after:bg-current after:w-0 hover:after:w-full after:transition-all after:duration-300"
                                style={{ ...navTextStyle, fontSize: '0.75em' }}
                              >
                                {t('nav.newIn')}
                              </Link>
                            </span>
                          </button>
                        </li>
                        <li className="whitespace-nowrap">
                          <button 
                            type="button"
                            className="relative pointer-events-auto inline-block text-center outline-none border border-content hover:border-utility-hover disabled:text-utility-disabled focus-visible:ring-2 ring-utility-focus ring-offset-2 transition-colors duration-300 ease-ease bg-transparent border-none p-0 tracking-utility uppercase tracking-normal type-heading-6" 
                            data-title="Mega Menu" 
                            accessibility-role="menuitem" 
                            accessibility-label="Menu"
                          >
                            <span className="flex justify-center items-center gap-xxs preserve-line-height w-fit text-current">
                              <Link
                                href="/products?featured=true"
                                aria-label="Best Sellers"
                                aria-expanded="false"
                                aria-haspopup="menu"
                                data-testid="nav-link"
                                className="relative inline-block pointer-events-auto ease-ease duration-300 focus-visible:ring-1 ring-utility-focus ring-offset-4 outline-none uppercase tracking-normal w-fit flex items-center gap-xxs font-normal text-current after:content-[''] after:absolute after:right-0 after:bottom-0 after:h-[2px] after:bg-current after:w-0 hover:after:w-full after:transition-all after:duration-300"
                                style={{ ...navTextStyle, fontSize: '0.75em' }}
                              >
                                {t('nav.bestSellers')}
                              </Link>
                            </span>
                          </button>
                        </li>
                      </ul>
                    )}
                  </div>
                </nav>
              </div>

              {/* Desktop Utility Menu */}
              <div className="w-full lg:w-auto" data-testid="header-utility-menu" style={{ paddingRight: '50px' }}>
                  {/* Mobile Layout */}
                  <div className="lg:hidden flex flex-col w-full">
                    <div className="relative flex items-center justify-between w-full">
                      {/* Mobile Menu Button */}
                      <div className="shrink-0 pt-2 relative">
                        <button
                          className="relative pointer-events-auto inline-block text-center outline-none border-none capitalize p-0 mr-4 transition-colors duration-300 ease-in-out bg-transparent"
                          onClick={() => setIsMenuOpen(!isMenuOpen)}
                          aria-label="Open Menu"
                          type="button"
                          aria-haspopup="dialog"
                          aria-expanded={isMenuOpen}
                        >
                          <span className="flex justify-center items-center gap-1">
                            {isMenuOpen ? (
                              <X className="w-6 h-6" style={{ ...navTextStyle, fontSize: '0.75em' }} />
                            ) : (
                              <Menu className="w-6 h-6" style={{ ...navTextStyle, fontSize: '0.75em' }} />
                            )}
                          </span>
                        </button>
                      </div>

                      {/* Mobile Logo - Centered */}
                      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[69px]">
                        {showSkeleton ? (
                          <div className="h-6 w-[69px] bg-gray-200 rounded animate-pulse"></div>
                        ) : (
                          <Link
                            aria-label={`${navbarName || brandingConfig?.shopName || 'Jewelry Shop'} logo - Click to return to the homepage`}
                            href="/"
                            className="pointer-events-auto transition-colors ease-in-out duration-300 focus-visible:ring-1 focus-visible:ring-offset-4 outline-none tracking-normal block"
                          >
                            {brandingConfig?.logoUrl ? (
                              <img
                                src={brandingConfig.logoUrl}
                                alt={brandingConfig.logoAltText || 'Logo'}
                                style={getLogoStyle()}
                                className="object-contain max-h-6"
                              />
                            ) : (
                              <span style={{ ...getShopNameStyle(), color: '#000000' }} className="text-base font-semibold">
                                {navbarName || brandingConfig?.shopName || 'JS'}
                              </span>
                            )}
                          </Link>
                        )}
                      </div>

                      {/* Mobile Search/Account */}
                      <div className="shrink-0 flex items-center gap-3">
                        {showSkeleton ? (
                          <>
                            <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                            <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setIsSearchOpen(true)}
                              className="p-1"
                              aria-label="Search"
                            >
                              <Search className="w-5 h-5" style={{ ...navTextStyle, fontSize: '0.75em' }} />
                            </button>
                            {isAuthenticated ? (
                              <Link
                                href={user?.roles?.includes('ADMIN') ? '/account' : '/user-account'}
                                className="p-1"
                                aria-label={t('nav.myAccount')}
                              >
                                  <User className="w-5 h-5" style={{ ...navTextStyle, fontSize: '0.75em' }} />
                              </Link>
                            ) : (
                              <button
                                onClick={() => openAuthModal('login')}
                                className="p-1"
                                aria-label="Login"
                              >
                                  <User className="w-5 h-5" style={{ ...navTextStyle, fontSize: '0.75em' }} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Mobile Navigation Menu */}
                    {isMenuOpen && (
                      <div className="flex items-center justify-between w-full mt-2 pt-2 border-t border-gray-300 border-opacity-30">
                        <div>
                          <button
                            type="button"
                            onClick={() => setIsSearchOpen(true)}
                            className="flex items-center justify-start w-full min-w-[120px] border-b border-current pb-1"
                          >
                            <Search className="w-5 h-5 mr-2" style={{ ...navTextStyle, fontSize: '0.75em' }} />
                            <p className="text-sm" style={{ ...navTextStyle, fontSize: '0.75em' }}>{t('nav.search')}</p>
                          </button>
                        </div>
                        <div className="flex items-start gap-4">
                          <nav aria-label="Main">
                            <ul className="flex gap-4 items-center">
                              <li>
                                <Link
                                  href="/favorites"
                                  className="pointer-events-auto transition-colors ease-in-out duration-300 focus-visible:ring-1 focus-visible:ring-offset-4 outline-none"
                                  aria-label="Go to your wishlist"
                                >
                                  <Heart className="w-5 h-5" style={{ ...navTextStyle, fontSize: '0.75em' }} />
                                  <span className="sr-only">Go to your wishlist</span>
                                </Link>
                              </li>
                            </ul>
                          </nav>
                          <div>
                            <button
                              onClick={() => setIsCartDrawerOpen(true)}
                              className="relative pointer-events-auto inline-block text-center outline-none border-none capitalize p-0 transition-colors duration-300 ease-in-out bg-transparent"
                              aria-label={t('nav.openBag')}
                            >
                              <span className="flex justify-center items-center gap-1">
                                <div className="relative">
                                  <ShoppingBag className="w-5 h-5" style={{ ...navTextStyle, fontSize: '0.75em' }} />
                                  {itemCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center text-[10px]">
                                      {itemCount > 9 ? '9+' : itemCount}
                                    </span>
                                  )}
                                  <span className="sr-only">Open Bag</span>
                                </div>
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Desktop Utility Menu */}
                  <div style={{ position: 'relative' }}>
                    <ul className="hidden lg:flex items-center gap-4" dir="ltr">
                      {/* Search */}
                      <li className="flex items-center" data-testid="search-modal-desktop">
                        <button
                          type="button"
                          aria-haspopup="dialog"
                          aria-expanded={isSearchOpen}
                          data-state={isSearchOpen ? 'open' : 'closed'}
                          data-testid="search-modal-trigger"
                          onClick={() => setIsSearchOpen(true)}
                          className="relative pointer-events-auto inline-block text-center outline-none border border-content hover:border-utility-hover disabled:text-utility-disabled focus-visible:ring-2 ring-utility-focus ring-offset-2 transition-colors duration-300 ease-ease bg-transparent border-none capitalize p-0 tracking-utility"
                        >
                          <div className="flex items-center justify-start lg:justify-between w-[120px] lg:w-[223px] min-[1280px]:w-[160px] min-[1360px]:w-[223px] border-b border-current">
                            <Search className="w-lg h-lg" aria-label="open search" style={{ ...navTextStyle, fontSize: '0.75em' }} />
                            <p className="text-content-inherit ml-xs" style={{ ...navTextStyle, fontSize: '0.75em' }}>
                              {!isLanguageLoading ? t('nav.search') : (
                                <span className="h-4 w-16 bg-gray-200 rounded animate-pulse inline-block"></span>
                              )}
                            </p>
                          </div>
                        </button>
                      </li>

                      {/* Language */}
                      <li className="flex items-center">
                        {showSkeleton ? (
                          <div className="w-lg h-lg bg-gray-200 rounded animate-pulse" style={{ width: '0.75em', height: '0.75em' }}></div>
                        ) : (
                          <LanguageSelectorCompact />
                        )}
                      </li>

                      {/* Currency - Only show if enabled */}
                      {currencyConfig.enabled && (
                        <li className="flex items-center">
                          <CurrencySelector />
                        </li>
                      )}

                      {/* Account */}
                      <li className="flex" data-testid="account-dropdown">
                        {showSkeleton ? (
                          <div className="w-lg h-lg bg-gray-200 rounded animate-pulse" style={{ width: '0.75em', height: '0.75em' }}></div>
                        ) : (
                          isAuthenticated ? (
                            <button
                              onClick={() => setIsAccountDropdownOpen(true)}
                              className="relative pointer-events-auto inline-block text-center outline-none border border-content hover:border-utility-hover disabled:text-utility-disabled focus-visible:ring-2 ring-utility-focus ring-offset-2 transition-colors duration-300 ease-ease bg-transparent border-none capitalize p-0 tracking-utility"
                              title={user?.roles?.includes('ADMIN') ? 'Admin Dashboard' : t('nav.myAccount')}
                            >
                              <span className="flex justify-center items-center gap-xxs preserve-line-height relative">
                                <User className="w-lg h-lg" style={{ ...navTextStyle, fontSize: '0.75em' }} aria-label="My Account" />
                                {isAdmin && (
                                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center min-w-[16px] leading-none" style={{ fontSize: '0.6em', padding: '2px' }}>
                                    {nonDeliveredCount > 99 ? '99+' : (nonDeliveredCount || 0)}
                                  </span>
                                )}
                                <span className="sr-only">My Account</span>
                              </span>
                            </button>
                          ) : (
                            <button
                              onClick={() => openAuthModal('login')}
                              className="relative pointer-events-auto inline-block text-center outline-none border border-content hover:border-utility-hover disabled:text-utility-disabled focus-visible:ring-2 ring-utility-focus ring-offset-2 transition-colors duration-300 ease-ease bg-transparent border-none capitalize p-0 tracking-utility"
                              title="Login"
                            >
                              <span className="flex justify-center items-center gap-xxs preserve-line-height">
                                <User className="w-lg h-lg" style={{ ...navTextStyle, fontSize: '0.75em' }} aria-label="log in" />
                                <span className="sr-only">My Account</span>
                              </span>
                            </button>
                          )
                        )}
                      </li>

                      {/* Favorites/Wishlist */}
                      <li className="flex">
                        {showSkeleton ? (
                          <div className="w-lg h-lg bg-gray-200 rounded animate-pulse" style={{ width: '0.75em', height: '0.75em' }}></div>
                        ) : (
                          <button
                            onClick={() => {
                              if (!isAuthenticated) {
                                openAuthModal('login')
                              }
                            }}
                            className="relative pointer-events-auto transition-[color] ease-ease duration-300 focus-visible:ring-1 ring-utility-focus ring-offset-4 outline-none type-heading-6 uppercase tracking-normal bg-transparent border-none p-0"
                            data-testid="link-to-wishlist"
                            aria-label={isAuthenticated ? "Go to your wishlist" : "Sign in to view wishlist"}
                          >
                            {isAuthenticated ? (
                              <Link
                                href="/favorites"
                                className="relative pointer-events-auto transition-[color] ease-ease duration-300 focus-visible:ring-1 ring-utility-focus ring-offset-4 outline-none type-heading-6 uppercase tracking-normal"
                              >
                                <Heart className={`w-lg h-lg transition-all duration-300 ease-in-out ${favoriteCount > 0 ? 'fill-red-500 text-red-500' : ''}`} style={{ ...navTextStyle, fontSize: '0.75em', strokeWidth: favoriteCount > 0 ? 0 : 1.5 }} aria-label="Go to your wishlist" />
                                {favoriteCount > 0 && (
                                  <span key={favoriteCount} className="absolute top-0 right-[-8px] rounded-full flex items-center justify-center h-[13px] w-[13px] text-xxxs font-display bg-backgroundTheme-dark text-contentTheme-inv transition-all duration-300 ease-in-out">
                                    {favoriteCount > 9 ? '9+' : favoriteCount}
                                    <span className="sr-only">Items in wishlist</span>
                                  </span>
                                )}
                                <span className="sr-only">Go to your wishlist</span>
                              </Link>
                            ) : (
                              <Heart className="w-lg h-lg transition-all duration-300 ease-in-out" style={{ ...navTextStyle, fontSize: '0.75em', strokeWidth: 1.5 }} aria-label="Sign in to view wishlist" />
                            )}
                          </button>
                        )}
                      </li>

                      {/* Cart */}
                      <li className="flex" data-testid="cart-modal-desktop">
                        {showSkeleton ? (
                          <div className="w-lg h-lg bg-gray-200 rounded animate-pulse" style={{ width: '0.75em', height: '0.75em' }}></div>
                        ) : (
                          <button
                            onClick={() => setIsCartDrawerOpen(true)}
                            className="relative pointer-events-auto inline-block text-center outline-none border border-content hover:border-utility-hover disabled:text-utility-disabled focus-visible:ring-2 ring-utility-focus ring-offset-2 transition-colors duration-300 ease-ease bg-transparent border-none capitalize p-0 tracking-utility"
                            aria-label="Open Bag"
                          >
                            <span className="flex justify-center items-center gap-xxs preserve-line-height">
                              <div className="relative">
                                <ShoppingBag className="w-lg h-lg transition-all duration-300 ease-in-out" style={{ ...navTextStyle, fontSize: '0.75em' }} data-testid="icon-bag-2" viewBox="0 0 24 24" role="graphics-symbol" />
                                {itemCount > 0 && (
                                  <span key={itemCount} className="absolute top-0 right-[-8px] rounded-full flex items-center justify-center h-[13px] w-[13px] text-xxxs font-display bg-backgroundTheme-dark text-contentTheme-inv transition-all duration-300 ease-in-out">
                                    {itemCount > 9 ? '9+' : itemCount}
                                    <span className="sr-only">Item in Bag</span>
                                  </span>
                                )}
                                <span className="sr-only">Open Bag</span>
                              </div>
                            </span>
                          </button>
                        )}
                      </li>
                    </ul>
                  </div>
                </div>
            </div>
          </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        initialMode={authMode}
      />

      {/* Search Navbar */}
      <SearchNavbar
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartDrawerOpen}
        onClose={() => setIsCartDrawerOpen(false)}
      />

      {/* Account Dropdown */}
      {isAuthenticated && (
        <AccountDropdown
          isOpen={isAccountDropdownOpen}
          onClose={() => setIsAccountDropdownOpen(false)}
        />
      )}
    </>
  )
}
