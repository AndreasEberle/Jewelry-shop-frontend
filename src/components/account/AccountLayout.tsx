'use client'

import { ReactNode, useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import { userService } from '@/services/userService'
import { EditNameModal, EditPhoneModal, EditPasswordModal, EditBirthdayModal } from './ProfileEditModals'
import { CountryCodePicker } from '@/components/auth/CountryCodePicker'
import { useTranslation } from '@/hooks/useTranslation'
import { User, Phone, Lock } from 'lucide-react'

const COUNTRIES = [
  { code: 'US', phoneCode: '+1' },
  { code: 'CH', phoneCode: '+41' },
  { code: 'DE', phoneCode: '+49' },
  { code: 'FR', phoneCode: '+33' },
  { code: 'IT', phoneCode: '+39' },
  { code: 'GB', phoneCode: '+44' },
  { code: 'AT', phoneCode: '+43' },
  { code: 'LI', phoneCode: '+423' },
]

// Helper function to convert phone code (e.g., "+423") to country code (e.g., "LI")
// Uses comprehensive list matching CountryCodePicker
const phoneCodeToCountryCode = (value: string | undefined): string => {
  if (!value) return 'CH'
  
  // If it's already a country code (2 letters), return it
  if (value.length === 2 && /^[A-Z]{2}$/i.test(value)) {
    return value.toUpperCase()
  }
  
  // Remove leading + if present
  const cleanCode = value.replace(/^\+/, '')
  
  // Comprehensive countries list matching CountryCodePicker
  const allCountries = [
    { code: 'US', phoneCode: '+1' },
    { code: 'CA', phoneCode: '+1' },
    { code: 'GB', phoneCode: '+44' },
    { code: 'DE', phoneCode: '+49' },
    { code: 'FR', phoneCode: '+33' },
    { code: 'IT', phoneCode: '+39' },
    { code: 'ES', phoneCode: '+34' },
    { code: 'AU', phoneCode: '+61' },
    { code: 'JP', phoneCode: '+81' },
    { code: 'CN', phoneCode: '+86' },
    { code: 'IN', phoneCode: '+91' },
    { code: 'BR', phoneCode: '+55' },
    { code: 'MX', phoneCode: '+52' },
    { code: 'RU', phoneCode: '+7' },
    { code: 'KR', phoneCode: '+82' },
    { code: 'NL', phoneCode: '+31' },
    { code: 'SE', phoneCode: '+46' },
    { code: 'NO', phoneCode: '+47' },
    { code: 'DK', phoneCode: '+45' },
    { code: 'FI', phoneCode: '+358' },
    { code: 'CH', phoneCode: '+41' },
    { code: 'LI', phoneCode: '+423' },
    { code: 'AT', phoneCode: '+43' },
    { code: 'BE', phoneCode: '+32' },
    { code: 'PL', phoneCode: '+48' },
    { code: 'CZ', phoneCode: '+420' },
    { code: 'HU', phoneCode: '+36' },
    { code: 'RO', phoneCode: '+40' },
    { code: 'BG', phoneCode: '+359' },
    { code: 'GR', phoneCode: '+30' },
    { code: 'PT', phoneCode: '+351' },
    { code: 'IE', phoneCode: '+353' },
    { code: 'LU', phoneCode: '+352' },
    { code: 'MT', phoneCode: '+356' },
    { code: 'CY', phoneCode: '+357' },
    { code: 'EE', phoneCode: '+372' },
    { code: 'LV', phoneCode: '+371' },
    { code: 'LT', phoneCode: '+370' },
    { code: 'SI', phoneCode: '+386' },
    { code: 'SK', phoneCode: '+421' },
    { code: 'HR', phoneCode: '+385' },
    { code: 'RS', phoneCode: '+381' },
    { code: 'BA', phoneCode: '+387' },
    { code: 'ME', phoneCode: '+382' },
    { code: 'MK', phoneCode: '+389' },
    { code: 'AL', phoneCode: '+355' },
    { code: 'XK', phoneCode: '+383' },
  ]
  
  // Find country by phone code
  const country = allCountries.find(c => c.phoneCode.replace('+', '') === cleanCode)
  return country?.code || 'CH'
}

interface AccountLayoutProps {
  children: ReactNode
}

export function AccountLayout({ children }: AccountLayoutProps) {
  const { user, refreshUser, isLoading } = useAuth()
  const { t, isLoading: isLanguageLoading } = useTranslation()
  const router = useRouter()
  const pathname = usePathname()
  const isAdmin = user?.roles?.includes('ADMIN')
  
  const basePath = isAdmin ? '/account' : '/user-account'
  const preferredName = user?.firstName && user?.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : user?.email?.split('@')[0] || 'User'
  
  const [profileData, setProfileData] = useState<any>(null)
  const [editNameModalOpen, setEditNameModalOpen] = useState(false)
  const [editPhoneModalOpen, setEditPhoneModalOpen] = useState(false)
  const [editPasswordModalOpen, setEditPasswordModalOpen] = useState(false)
  const [editBirthdayModalOpen, setEditBirthdayModalOpen] = useState(false)
  
  const isActive = (path: string) => {
    const fullPath = `${basePath}${path}`
    return pathname === fullPath || (path === '/profile' && (pathname === basePath || pathname === `${basePath}/`))
  }

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await userService.getProfile()
        console.log('Loaded profile data:', profile)
        console.log('Phone country code:', profile.phoneCountryCode || (profile as any).phone_country_code)
        console.log('Phone number:', profile.phoneNumber || (profile as any).phone_number)
        setProfileData(profile)
      } catch (error) {
        console.error('Failed to load profile:', error)
      }
    }
    if (isActive('/profile') || pathname === basePath || pathname === `${basePath}/`) {
      loadProfile()
    }
  }, [pathname, basePath, editPhoneModalOpen, editNameModalOpen])

  // Trigger fade-in animation for profile section on mount
  useEffect(() => {
    if (isActive('/profile') || pathname === basePath || pathname === `${basePath}/`) {
      const profileSection = document.querySelector('.fade-in-on-scroll')
      if (profileSection) {
        // Small delay to ensure DOM is ready
        setTimeout(() => {
          profileSection.classList.add('fade-in-on-scroll')
        }, 100)
      }
    }
  }, [pathname, basePath])
  
  const handleProfileUpdate = async () => {
    try {
      console.log('handleProfileUpdate called - reloading profile data')
      // Force reload profile data with a slight delay to ensure backend has saved
      await new Promise(resolve => setTimeout(resolve, 500))
      const profile = await userService.getProfile()
      console.log('Reloaded profile after update:', profile)
      console.log('Phone number in reloaded profile:', profile.phoneNumber)
      console.log('Phone country code in reloaded profile:', profile.phoneCountryCode)
      setProfileData(profile)
      // Refresh auth context user data
      await refreshUser()
      // Force another reload after auth refresh
      setTimeout(async () => {
        const finalProfile = await userService.getProfile()
        console.log('Final reload after auth refresh:', finalProfile)
        setProfileData(finalProfile)
      }, 200)
    } catch (error) {
      console.error('Failed to refresh profile:', error)
    }
  }

  return (
    <main id="maincontent" style={{ marginTop: '32px', marginBottom: '32px', paddingLeft: '80px', paddingRight: '80px' }}>
      <div>
        <div className="px-md md:px-xl lg:px-6xl py-0 mt-xl mb-xl">
          {isLoading || !user ? (
            <div className="mb-lg">
              <div className="h-[4.5rem] w-64 bg-gray-200 rounded animate-pulse" style={{ fontSize: '3rem' }}></div>
            </div>
          ) : (
            <h1 className="type-heading-2 text-content mb-lg uppercase" style={{ fontWeight: 'bold', fontSize: '3rem' }}>{t('account.hi')}, {preferredName.split(' ')[0] || t('account.user')}</h1>
          )}
          
          {/* Tab Navigation */}
          <div className="group/slick-carousel relative min-w-0 flex-1 max-w-full">
            <button 
              className="pointer-events-auto inline-block uppercase text-center outline-none border focus-visible:ring-2 ring-utility-focus ring-offset-2 ease-ease type-utility-2 rounded-4xl tracking-px bg-content-inv border-content-inv hover:bg-background-light hover:text-utility-hover hover:border-background disabled:bg-background-light disabled:text-utility-disabled ring-offset-background-inv p-xxs absolute z-above transition-opacity duration-500 ease-ease shadow-button opacity-0 [&:not(:disabled)]:lg:group-hover/slick-carousel:opacity-100 focus-visible:opacity-100 disabled:opacity-0 lg:block" 
              disabled 
              data-title="Pagination" 
              aria-label="prev" 
              accessibility-role="button" 
              style={{ left: '50px', top: '30px' }} 
              data-testid="slick-prev-button"
            >
              <span className="flex justify-center items-center gap-xxs preserve-line-height">
                <svg className="transform transition-transform duration-300 w-lg h-lg rotate-180" xmlns="http://www.w3.org/2000/svg" role="graphics-symbol" viewBox="0 0 24 24" fill="currentColor">
                  <title>Caret</title>
                  <path d="M8.59175 20C8.47866 19.9947 8.36933 19.9555 8.27647 19.8871C8.18361 19.8187 8.11104 19.7238 8.06721 19.6135C8.02338 19.5031 8.01008 19.3819 8.02886 19.2639C8.04765 19.146 8.09774 19.036 8.17332 18.9469L14.7188 12.0179L8.17332 5.06776C8.06235 4.95046 8 4.79137 8 4.62548C8 4.45959 8.06235 4.3005 8.17332 4.1832C8.28429 4.0659 8.43481 4 8.59175 4C8.74869 4 8.89921 4.0659 9.01018 4.1832L15.7051 11.2492C15.7985 11.3471 15.8726 11.4635 15.9231 11.5918C15.9737 11.7202 15.9998 11.8578 15.9998 11.9968C15.9998 12.1358 15.9737 12.2735 15.9231 12.4018C15.8726 12.5301 15.7985 12.6466 15.7051 12.7445L9.01018 19.8105C8.95621 19.8703 8.8913 19.918 8.81937 19.9506C8.74744 19.9832 8.67 20 8.59175 20Z" fill="currentColor"></path>
                </svg>
              </span>
            </button>
            
            <div 
              className="flex flex-row flex-nowrap overflow-x-auto no-scrollbar items-center transform-gpu scroll-smooth mb-6 max-md:mt-md pt-2 gap-x-4"
              style={{ willChange: 'scroll-position', WebkitOverflowScrolling: 'touch' }}
            >
              <Link
                href={`${basePath}/profile`}
                className={`pointer-events-auto ease-ease inline-block uppercase text-center outline-none disabled:text-utility-disabled focus-visible:ring-2 ring-utility-focus ring-offset-2 transition-all duration-300 ease-ease shrink-0 py-xs md:py-sm type-utility-2 px-4 border ${
                  isActive('/profile') 
                    ? 'bg-gray-100 text-black border-black border-[1px] hover:bg-[#8a9a8a] hover:text-white' 
                    : 'bg-gray-100 text-black border-transparent hover:bg-[#8a9a8a] hover:text-white'
                }`}
                data-testid="navigation-link-0"
                aria-label="profile"
              >
                {!isLanguageLoading ? t('account.profile').toLowerCase() : (
                  <span className="h-4 w-16 bg-gray-200 rounded animate-pulse inline-block"></span>
                )}
              </Link>
              <Link
                href={`${basePath}/orders`}
                className={`pointer-events-auto ease-ease inline-block uppercase text-center outline-none disabled:text-utility-disabled focus-visible:ring-2 ring-utility-focus ring-offset-2 transition-all duration-300 ease-ease shrink-0 py-xs md:py-sm type-utility-2 px-4 border ${
                  isActive('/orders') 
                    ? 'bg-gray-100 text-black border-black border-[1px] hover:bg-[#8a9a8a] hover:text-white' 
                    : 'bg-gray-100 text-black border-transparent hover:bg-[#8a9a8a] hover:text-white'
                }`}
                data-testid="navigation-link-1"
                aria-label="orders"
              >
                {!isLanguageLoading ? t('account.orders').toLowerCase() : (
                  <span className="h-4 w-16 bg-gray-200 rounded animate-pulse inline-block"></span>
                )}
              </Link>
              <Link
                href={`${basePath}/addresses`}
                className={`pointer-events-auto ease-ease inline-block uppercase text-center outline-none disabled:text-utility-disabled focus-visible:ring-2 ring-utility-focus ring-offset-2 transition-all duration-300 ease-ease shrink-0 py-xs md:py-sm type-utility-2 px-4 border ${
                  isActive('/addresses') 
                    ? 'bg-gray-100 text-black border-black border-[1px] hover:bg-[#8a9a8a] hover:text-white' 
                    : 'bg-gray-100 text-black border-transparent hover:bg-[#8a9a8a] hover:text-white'
                }`}
                data-testid="navigation-link-2"
                aria-label="addresses"
              >
                {!isLanguageLoading ? t('account.addresses').toLowerCase() : (
                  <span className="h-4 w-16 bg-gray-200 rounded animate-pulse inline-block"></span>
                )}
              </Link>
              <Link
                href={`${basePath}/wishlist`}
                className={`pointer-events-auto ease-ease inline-block uppercase text-center outline-none disabled:text-utility-disabled focus-visible:ring-2 ring-utility-focus ring-offset-2 transition-all duration-300 ease-ease shrink-0 py-xs md:py-sm type-utility-2 px-4 border ${
                  isActive('/wishlist') 
                    ? 'bg-gray-100 text-black border-black border-[1px] hover:bg-[#8a9a8a] hover:text-white' 
                    : 'bg-gray-100 text-black border-transparent hover:bg-[#8a9a8a] hover:text-white'
                }`}
                data-testid="navigation-link-3"
                aria-label="wishlist"
              >
                {!isLanguageLoading ? t('account.wishlist').toLowerCase() : (
                  <span className="h-4 w-16 bg-gray-200 rounded animate-pulse inline-block"></span>
                )}
              </Link>
            </div>
            
            <button 
              className="pointer-events-auto inline-block uppercase text-center outline-none border focus-visible:ring-2 ring-utility-focus ring-offset-2 ease-ease type-utility-2 rounded-4xl tracking-px bg-content-inv border-content-inv hover:bg-background-light hover:text-utility-hover hover:border-background disabled:bg-background-light disabled:text-utility-disabled ring-offset-background-inv p-xxs absolute z-above transition-opacity duration-500 ease-ease shadow-button opacity-0 [&:not(:disabled)]:lg:group-hover/slick-carousel:opacity-100 focus-visible:opacity-100 disabled:opacity-0 lg:block" 
              disabled 
              data-title="Pagination" 
              aria-label="next" 
              accessibility-role="button" 
              style={{ right: '50px', top: '30px' }} 
              data-testid="slick-next-button"
            >
              <span className="flex justify-center items-center gap-xxs preserve-line-height">
                <svg className="transform transition-transform duration-300 w-lg h-lg rotate-0" xmlns="http://www.w3.org/2000/svg" role="graphics-symbol" viewBox="0 0 24 24" fill="currentColor">
                  <title>Caret</title>
                  <path d="M8.59175 20C8.47866 19.9947 8.36933 19.9555 8.27647 19.8871C8.18361 19.8187 8.11104 19.7238 8.06721 19.6135C8.02338 19.5031 8.01008 19.3819 8.02886 19.2639C8.04765 19.146 8.09774 19.036 8.17332 18.9469L14.7188 12.0179L8.17332 5.06776C8.06235 4.95046 8 4.79137 8 4.62548C8 4.45959 8.06235 4.3005 8.17332 4.1832C8.28429 4.0659 8.43481 4 8.59175 4C8.74869 4 8.89921 4.0659 9.01018 4.1832L15.7051 11.2492C15.7985 11.3471 15.8726 11.4635 15.9231 11.5918C15.9737 11.7202 15.9998 11.8578 15.9998 11.9968C15.9998 12.1358 15.9737 12.2735 15.9231 12.4018C15.8726 12.5301 15.7985 12.6466 15.7051 12.7445L9.01018 19.8105C8.95621 19.8703 8.8913 19.918 8.81937 19.9506C8.74744 19.9832 8.67 20 8.59175 20Z" fill="currentColor"></path>
                </svg>
              </span>
            </button>
          </div>

          {/* Profile Section - Only show when on profile page */}
          {(isActive('/profile') || pathname === basePath || pathname === `${basePath}/`) && (
            <div className="flex max-lg:flex-col pt-lg mt-lg border-t border-black gap-6xl fade-in-on-scroll" style={{ opacity: 0 }}>
              <div className="lg:w-6/12">
                <h1 className="type-heading-3 text-content mt-6" style={{ paddingBottom: '24px', fontSize: '1.5rem', fontWeight: 'bold' }}>{t('account.profile').toUpperCase()}</h1>
                <div className="mt-3xl">
                  <h1 className="type-heading-6 text-content mb-xxs" style={{ fontWeight: 'bold' }}>
                    {!isLanguageLoading ? t('account.preferredName') : (
                      <span className="h-6 w-32 bg-gray-200 rounded animate-pulse inline-block"></span>
                    )}
                  </h1>
                  {isLoading || !user ? (
                    <div className="mb-xxs">
                      <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ) : (
                    <p className="type-body-2 text-content mb-xxs">{preferredName}</p>
                  )}
                  <div className="flex items-center">
                    <User className="ml-[-5px] w-6 h-6 stroke-[1.5] opacity-70" />
                    <button 
                      onClick={() => setEditNameModalOpen(true)}
                      className="pointer-events-auto transition-[color] ease-ease duration-300 focus-visible:ring-1 ring-utility-focus ring-offset-4 outline-none capitalize hover:text-utility-hover pt-xs underline type-body-3 bg-transparent border-none p-0"
                      type="button"
                      disabled={isLoading || !user}
                    >
                      {!isLanguageLoading ? t('account.editPreferredName') : (
                        <span className="h-4 w-24 bg-gray-200 rounded animate-pulse inline-block"></span>
                      )}
                    </button>
                  </div>
                </div>
                <div style={{ marginTop: '48px' }}>
                  <h1 className="type-heading-6 text-content mb-xxs" style={{ fontWeight: 'bold' }}>{t('account.email')}</h1>
                  {isLoading || !user ? (
                    <div className="mb-xxs">
                      <div className="h-6 w-64 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ) : (
                    <p className="type-body-2 text-content mb-xxs">{user?.email}</p>
                  )}
                  <div className="flex items-center">
                    <Lock className="ml-[-5px] w-6 h-6 stroke-[1.5] opacity-70" />
                    <button 
                      onClick={() => setEditPasswordModalOpen(true)}
                      className="pointer-events-auto transition-[color] ease-ease duration-300 focus-visible:ring-1 ring-utility-focus ring-offset-4 outline-none capitalize hover:text-utility-hover pt-xs underline type-body-3 bg-transparent border-none p-0"
                      type="button"
                    >
                      {!isLanguageLoading ? t('account.editPassword') : (
                        <span className="h-4 w-24 bg-gray-200 rounded animate-pulse inline-block"></span>
                      )}
                    </button>
                  </div>
                </div>
                <div style={{ marginTop: '48px' }}>
                  <h1 className="type-heading-6 text-content mb-xxs" style={{ fontWeight: 'bold' }}>{t('account.phone')}</h1>
                  <div className="flex items-center">
                    <Phone className="ml-[-5px] w-6 h-6 stroke-[1.5] opacity-70" />
                    <button 
                      onClick={() => setEditPhoneModalOpen(true)}
                      className="pointer-events-auto transition-[color] ease-ease duration-300 focus-visible:ring-1 ring-utility-focus ring-offset-4 outline-none capitalize hover:text-utility-hover pt-xs underline type-body-3 bg-transparent border-none p-0"
                      type="button"
                    >
                      {!isLanguageLoading ? (profileData?.phoneNumber || (profileData as any)?.phone_number ? t('account.editPhone') : t('account.addPhone')) : (
                        <span className="h-4 w-24 bg-gray-200 rounded animate-pulse inline-block"></span>
                      )}
                    </button>
                  </div>
                </div>
                <div style={{ marginTop: '48px', paddingBottom: '32px' }}>
                  <h1 className="type-heading-6 text-content mb-xxs" style={{ fontWeight: 'bold' }}>{t('account.birthday')}</h1>
                  <div className="flex items-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-[-5px] w-xl h-xl">
                      <path fillRule="evenodd" clipRule="evenodd" d="M9.97961 5.73612C9.97961 6.68722 10.7541 7.46163 11.7051 7.46163C12.6521 7.46163 13.4224 6.69547 13.4327 5.75259C13.4778 5.23699 13.2293 4.6413 12.6952 3.9819C12.3258 3.5271 11.9488 3.20096 11.9093 3.16681C11.9079 3.16564 11.907 3.16481 11.9064 3.16433L11.7113 3L11.512 3.16022C11.4484 3.2095 10.0002 4.40295 9.97961 5.73406V5.73612ZM11.7051 6.84539C11.095 6.84539 10.5959 6.34826 10.5959 5.73818L10.5959 5.73823C10.6041 4.94944 11.3415 4.15652 11.7051 3.81553C12.157 4.24895 12.878 5.085 12.8164 5.7074L12.8144 5.72177V5.73615C12.8144 6.3483 12.3173 6.84539 11.7051 6.84539ZM12.6194 8.6119V11.4692C12.359 11.469 12.0956 11.4687 11.8318 11.4684L11.7047 11.4682H11.7042C11.4025 11.4677 11.102 11.4672 10.8056 11.4672V8.6119H12.6194ZM10.1893 8.50304V11.4669L8.57253 11.4652C7.50026 11.4631 6.70531 11.4631 6.51633 11.4631C5.12771 11.4631 4 12.5929 4 13.9794C4 14.699 4.3027 15.3735 4.83389 15.851V20.2118C4.83389 20.5733 5.12763 20.867 5.48916 20.867H17.9352C18.2967 20.867 18.5905 20.5733 18.5905 20.2118V15.8481C19.118 15.3726 19.4185 14.7004 19.4185 13.9836C19.4185 12.599 18.2887 11.4713 16.9022 11.4713C16.6254 11.4713 15.0708 11.4713 13.2336 11.4695V8.50304C13.2336 8.22366 13.0056 7.99565 12.7262 7.99565H10.6967C10.4173 7.99565 10.1893 8.22367 10.1893 8.50304ZM8.56635 12.0814L10.1893 12.0831V12.0834H10.4478L10.487 12.0835C10.8855 12.0835 11.2937 12.084 11.702 12.0845H11.702H11.702C12.1103 12.085 12.5185 12.0855 12.917 12.0855H13.0095C14.4028 12.0855 15.6591 12.0866 16.3588 12.0872L16.896 12.0876C17.9436 12.0876 18.7961 12.938 18.7961 13.9836C18.7961 14.5649 18.5352 15.1051 18.0813 15.4667C17.7457 15.7351 17.3398 15.8787 16.9091 15.8815L16.902 15.8816C16.3166 15.8816 15.7722 15.6186 15.4086 15.1606L15.1683 14.8566L15.1673 14.8577L15.1664 14.8566L14.9307 15.1546L14.9259 15.1606C14.6987 15.4456 14.4016 15.6552 14.0684 15.7723C13.9148 15.8263 13.7535 15.8606 13.5878 15.8736C13.5378 15.8775 13.4874 15.8795 13.4367 15.8795C12.8533 15.8795 12.311 15.6166 11.9474 15.1585L11.7051 14.8545L11.705 14.8545L11.705 14.8545L11.7035 14.8564L11.4627 15.1565C11.0991 15.6145 10.5568 15.8775 9.97342 15.8775C9.66999 15.8775 9.37767 15.8063 9.11583 15.6736C8.87591 15.5513 8.66173 15.3771 8.48824 15.1585L8.24585 14.8545L8.24464 14.856L8.24179 14.8525L7.9994 15.1565C7.63584 15.6145 7.09352 15.8775 6.51015 15.8775C6.254 15.8775 6.00637 15.8277 5.77689 15.7316C5.61809 15.6646 5.46973 15.5757 5.33714 15.4667L5.20143 15.3553C4.82396 14.9982 4.61006 14.504 4.61006 13.9794C4.61006 12.9318 5.46252 12.0793 6.51015 12.0793L6.83089 12.0798H6.83119H6.83176C7.19745 12.0804 7.81294 12.0814 8.56635 12.0814ZM6.01088 16.4447C5.81597 16.4053 5.62764 16.3431 5.45009 16.2599V20.2119C5.45009 20.2325 5.46653 20.251 5.48912 20.251H17.9352C17.9557 20.251 17.9742 20.2345 17.9742 20.2119V16.2578C17.6394 16.416 17.2758 16.4982 16.9019 16.4982C16.8121 16.4982 16.7229 16.4935 16.6348 16.4842C16.0831 16.4267 15.5702 16.1897 15.1675 15.8087C14.7034 16.2499 14.0895 16.4961 13.4386 16.4961C13.2946 16.4961 13.1524 16.4839 13.0132 16.4602C12.5233 16.3771 12.0705 16.1508 11.7073 15.8076C11.4133 16.0867 11.0594 16.2876 10.6742 16.3974C10.4501 16.4621 10.2153 16.4958 9.97554 16.4958C9.32278 16.4958 8.71106 16.2476 8.24696 15.8066C8.0277 16.0145 7.77513 16.1795 7.50109 16.2956C7.19398 16.4263 6.85958 16.4958 6.51427 16.4958C6.34462 16.4958 6.17588 16.4784 6.01088 16.4447Z" fill="black"></path>
                    </svg>
                    <button
                      onClick={() => setEditBirthdayModalOpen(true)}
                      className="pointer-events-auto transition-[color] ease-ease duration-300 focus-visible:ring-1 ring-utility-focus ring-offset-4 outline-none capitalize hover:text-utility-hover pt-xs underline type-body-3 bg-transparent border-none p-0"
                      aria-label="Add Your Birthday"
                    >
                      {t('account.addBirthday')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Content Area */}
          <div className="flex-1 pt-lg mt-lg border-t border-black">
            {children}
          </div>
        </div>
      </div>
      
      {/* Edit Modals */}
      <EditNameModal
        isOpen={editNameModalOpen}
        onClose={() => setEditNameModalOpen(false)}
        currentFirstName={profileData?.firstName || user?.firstName || ''}
        currentLastName={profileData?.lastName || user?.lastName || ''}
        onSave={handleProfileUpdate}
      />
      <EditPhoneModal
        isOpen={editPhoneModalOpen}
        onClose={() => setEditPhoneModalOpen(false)}
        currentPhoneCountryCode={(() => {
          const rawCode = profileData?.phoneCountryCode || (profileData as any)?.phone_country_code
          return phoneCodeToCountryCode(rawCode)
        })()}
        currentPhoneNumber={profileData?.phoneNumber || (profileData as any)?.phone_number}
        onSave={handleProfileUpdate}
      />
      <EditPasswordModal
        isOpen={editPasswordModalOpen}
        onClose={() => setEditPasswordModalOpen(false)}
      />
      <EditBirthdayModal
        isOpen={editBirthdayModalOpen}
        onClose={() => setEditBirthdayModalOpen(false)}
        currentBirthday={profileData?.dateOfBirth}
        onSave={handleProfileUpdate}
      />
    </main>
  )
}

