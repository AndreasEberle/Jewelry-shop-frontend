'use client'

import { useState, useEffect, useRef } from 'react'
import { CheckoutHeader } from '@/components/layout/CheckoutHeader'
import { Footer } from '@/components/layout/Footer'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { useFreeShippingConfig } from '@/hooks/useFreeShippingConfig'
import { userService } from '@/services/userService'
import { productService } from '@/services/productService'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import api from '@/services/api'
import { CountryCodePicker } from '@/components/auth/CountryCodePicker'
import { useRouter } from 'next/navigation'
import { loadStripe, Stripe, StripeElements, StripeCardElement } from '@stripe/stripe-js'
import { useTranslation } from '@/hooks/useTranslation'
import { X } from 'lucide-react'

// Shipping Info Tooltip Component
function ShippingInfoTooltip() {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="text-gray-400 hover:text-gray-600 transition-colors"
        aria-label={t('checkout.shippingInfoTitle')}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
      
      {isOpen && (
        <div
          ref={tooltipRef}
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
          className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-300 rounded-lg shadow-xl z-[9999] p-4 pointer-events-auto"
          style={{ maxWidth: 'calc(100vw - 2rem)' }}
        >
          <h4 className="text-sm font-semibold text-gray-900 mb-2">{t('checkout.shippingInfoTitle')}</h4>
          <p className="text-xs text-gray-600 leading-relaxed">
            {t('checkout.shippingInfoDescription')}
          </p>
        </div>
      )}
    </div>
  )
}

export default function CheckoutPage() {
  const { cart, isLoading, addToCart, clearCart } = useCart()
  const { isAuthenticated, user } = useAuth()
  const { formatPrice } = useCurrency()
  const { config: freeShippingConfig } = useFreeShippingConfig()
  const { t } = useTranslation()
  // Track if we've completed initial cart load to prevent flash of empty cart
  const [hasInitialLoadCompleted, setHasInitialLoadCompleted] = useState(false)
  const [mounted, setMounted] = useState(false)
  // Delivery is always shipping (no pickup option)
  const [shippingCountries, setShippingCountries] = useState<string[]>(['Switzerland', 'Liechtenstein'])
  const [defaultCountry, setDefaultCountry] = useState<string>('')
  
  // Contact form
  const [email, setEmail] = useState('')
  const [marketingOptIn, setMarketingOptIn] = useState(false)
  
  // Shipping address form
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [address1, setAddress1] = useState('')
  const [address2, setAddress2] = useState('')
  const [city, setCity] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [country, setCountry] = useState('')
  const [phoneCountryCode, setPhoneCountryCode] = useState('CH')
  const [phone, setPhone] = useState('')
  
  // Billing address form (separate from shipping)
  const [billingFirstName, setBillingFirstName] = useState('')
  const [billingLastName, setBillingLastName] = useState('')
  const [billingAddress1, setBillingAddress1] = useState('')
  const [billingAddress2, setBillingAddress2] = useState('')
  const [billingCity, setBillingCity] = useState('')
  const [billingPostalCode, setBillingPostalCode] = useState('')
  const [billingCountry, setBillingCountry] = useState('')
  
  // Payment - only Credit Card and PostFinance/Twint
  const [paymentMethod, setPaymentMethod] = useState<'creditCards' | 'postfinance'>('creditCards')
  const [cardNumber, setCardNumber] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [cvv, setCvv] = useState('')
  const [nameOnCard, setNameOnCard] = useState('')
  const [useShippingAsBilling, setUseShippingAsBilling] = useState(true)
  const [rememberMe, setRememberMe] = useState(false)
  
  // Packaging - Standard and Premium
  const [packagingOption, setPackagingOption] = useState<'STANDARD' | 'PREMIUM'>('STANDARD')
  const [shippingMethod, setShippingMethod] = useState<'STANDARD' | 'PREMIUM'>('STANDARD')
  const [packagingImageStandard, setPackagingImageStandard] = useState<string>('')
  const [packagingImagePremium, setPackagingImagePremium] = useState<string>('')
  const [youMayAlsoLike, setYouMayAlsoLike] = useState<any[]>([])
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [discountCode, setDiscountCode] = useState('')
  const [discountCodeApplied, setDiscountCodeApplied] = useState(false)
  const [discountAmount, setDiscountAmount] = useState<number>(0)
  const [discountError, setDiscountError] = useState<string | null>(null)
  const [isValidatingDiscount, setIsValidatingDiscount] = useState(false)
  
  // Form validation errors
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [cardType, setCardType] = useState<string>('')
  const [showCvvTooltip, setShowCvvTooltip] = useState(false)
  
  // Stripe Elements state
  const [stripe, setStripe] = useState<Stripe | null>(null)
  const [elements, setElements] = useState<StripeElements | null>(null)
  const [cardElement, setCardElement] = useState<StripeCardElement | null>(null)
  const [stripeError, setStripeError] = useState<string | null>(null)
  const cardElementRef = useRef<HTMLDivElement>(null)
  
  const router = useRouter()
  
  const fetchShippingCountries = async () => {
    try {
      const response = await api.get('/api/public/shipping-countries')
      if (response.data) {
        if (response.data.countries) {
          setShippingCountries(response.data.countries)
        }
        if (response.data.default) {
          setDefaultCountry(response.data.default)
          setCountry(response.data.default)
        }
      }
    } catch (error) {
      console.error('Failed to load shipping countries:', error)
    }
  }

  // Helper function to convert phone code (e.g., "+423") to country code (e.g., "LI")
  const phoneCodeToCountryCode = (value: string | undefined): string => {
    if (!value) return 'CH'
    
    // If it's already a country code (2 letters), return it
    if (value.length === 2 && /^[A-Z]{2}$/i.test(value)) {
      return value.toUpperCase()
    }
    
    // Remove leading + if present
    const cleanCode = value.replace(/^\+/, '')
    
    // Comprehensive countries list matching CountryCodePicker
    const countries = [
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
    const country = countries.find(c => c.phoneCode.replace('+', '') === cleanCode)
    return country?.code || 'CH'
  }

  const loadUserData = async () => {
    try {
      // Load user profile
      const profile = await userService.getProfile()
      if (profile) {
        setFirstName(profile.firstName || '')
        setLastName(profile.lastName || '')
        setEmail(profile.email || '')
        setPhone(profile.phoneNumber || '')
        
        // Convert phone country code from phone code to country code
        const rawPhoneCountryCode = profile.phoneCountryCode || (profile as any)?.phone_country_code
        const countryCode = phoneCodeToCountryCode(rawPhoneCountryCode)
        setPhoneCountryCode(countryCode)
        
        // Set billing names from profile
        setBillingFirstName(profile.firstName || '')
        setBillingLastName(profile.lastName || '')
      }
      
      // Load default address
      const addresses = await userService.getAddresses()
      const defaultAddress = addresses.find(addr => addr.isDefault) || addresses[0]
      if (defaultAddress) {
        setAddress1(defaultAddress.street || '')
        setAddress2(defaultAddress.apartment || '')
        setCity(defaultAddress.city || '')
        setPostalCode(defaultAddress.postalCode || '')
        setCountry(defaultAddress.country || '')
        // Also set billing address to same values by default
        setBillingFirstName(profile.firstName || '')
        setBillingLastName(profile.lastName || '')
        setBillingAddress1(defaultAddress.street || '')
        setBillingAddress2(defaultAddress.apartment || '')
        setBillingCity(defaultAddress.city || '')
        setBillingPostalCode(defaultAddress.postalCode || '')
        setBillingCountry(defaultAddress.country || '')
      } else {
        // If no saved address, still set billing names from profile
        setBillingFirstName(profile.firstName || '')
        setBillingLastName(profile.lastName || '')
      }
    } catch (error) {
      console.error('Failed to load user data:', error)
    }
  }

  const loadYouMayAlsoLike = async () => {
    try {
      const products = await productService.getProducts({ limit: 5 })
      const cartProductIds = cart?.items.map(item => item.product.id) || []
      const filtered = products.filter(product => !cartProductIds.includes(product.id))
      setYouMayAlsoLike(filtered.slice(0, 5))
    } catch (error) {
      console.error('Failed to load recommended products:', error)
    }
  }

  const loadPackagingImages = async () => {
    try {
      // Load packaging images from system config
      const standardRes = await api.get('/api/public/system-config/packaging.standard.image')
      const premiumRes = await api.get('/api/public/system-config/packaging.premium.image')
      if (standardRes.data?.value) setPackagingImageStandard(standardRes.data.value)
      if (premiumRes.data?.value) setPackagingImagePremium(premiumRes.data.value)
    } catch (error) {
      console.error('Failed to load packaging images:', error)
    }
  }

  // Card brand icon component
  const CardIcon = ({ cardType }: { cardType: string }) => {
    if (!cardType) return null
    
    const iconStyles = "w-10 h-6 inline-block align-middle"
    
    switch (cardType) {
      case 'Visa':
        return (
          <svg className={iconStyles} viewBox="0 0 48 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="48" height="16" rx="2" fill="#1434CB"/>
            <path d="M20.28 5.76h2.46l-1.94 4.48h-2.46l1.94-4.48zm5.04 2.92c0-.84-1.13-.89-1.13-1.27 0-.15.11-.23.34-.27.11-.02.43-.03.78.14l.14-1.1c-.18-.06-.42-.12-.71-.12-.84 0-1.44.36-1.44.87 0 .38.37.59.65.71.28.13.39.24.39.32 0 .2-.23.26-.45.26-.38 0-.61-.06-.79-.12l-.14 1.12c.19.06.54.12.88.12.88 0 1.5-.35 1.5-.89zm4.43 1.56h-1.91c-.3 0-.52-.15-.62-.38l-2.17-1.96h1.3c.17 0 .33.11.38.28l.52 1.28 1.28-3.17h1.24l-2.19 4.95z" fill="#FFFFFF"/>
          </svg>
        )
      case 'Mastercard':
        return (
          <svg className={iconStyles} viewBox="0 0 48 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="48" height="16" rx="2" fill="#EB001B"/>
            <circle cx="17" cy="8" r="5.5" fill="#F79E1B"/>
            <circle cx="31" cy="8" r="5.5" fill="#FF5F00"/>
            <path d="M24 3.5a5.5 5.5 0 1 0 0 9 5.5 5.5 0 0 0 0-9z" fill="#F79E1B" opacity="0.7"/>
          </svg>
        )
      case 'American Express':
        return (
          <svg className={iconStyles} viewBox="0 0 48 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="48" height="16" rx="2" fill="#006FCF"/>
            <path d="M6 6h1.25l.5 1 .5-1h1.25v4h-.75v-2.5l-.5 1h-.5l-.5-1v2.5H6V6zm4.25 0h3c.75 0 1.25.5 1.25 1.25v1.5c0 .75-.5 1.25-1.25 1.25h-3V6zm1.5 1.5v2h1.5c.25 0 .5-.25.5-.5v-1c0-.25-.25-.5-.5-.5h-1.5zm5 0h2.75v1h-2v.5h2v1h-2.75v-2.5zm-8 2.5l1.5 1.5-1.5 1.5h1l1-1 1 1h1l-1.5-1.5 1.5-1.5h-1l-1 1-1-1h-1z" fill="#FFFFFF" fontSize="10"/>
          </svg>
        )
      case 'Discover':
        return (
          <svg className={iconStyles} viewBox="0 0 48 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="48" height="16" rx="2" fill="#FF6000"/>
            <rect x="9" y="5" width="18" height="6" rx="0.5" fill="#FFFFFF"/>
            <circle cx="13" cy="8" r="1.5" fill="#FF6000"/>
          </svg>
        )
      default:
        return null
    }
  }

  // Detect card type from card number
  const detectCardType = (number: string): string => {
    const cleaned = number.replace(/\s/g, '')
    if (/^4/.test(cleaned)) return 'Visa'
    if (/^5[1-5]/.test(cleaned)) return 'Mastercard'
    if (/^3[47]/.test(cleaned)) return 'American Express'
    if (/^6/.test(cleaned)) return 'Discover'
    return ''
  }

  // Format card number with spaces
  const formatCardNumber = (value: string): string => {
    const cleaned = value.replace(/\s/g, '')
    const chunks = cleaned.match(/.{1,4}/g)
    return chunks ? chunks.join(' ').substring(0, 19) : cleaned.substring(0, 16)
  }

  // Format expiry date MM/YY
  const formatExpiryDate = (value: string): string => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4)
    }
    return cleaned
  }

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Contact validation
    if (!isAuthenticated && !email) {
      newErrors.email = 'Enter an email'
    } else if (!isAuthenticated && email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Enter a valid email'
    }

    // Delivery validation
    if (!firstName) newErrors.firstName = t('checkout.enterFirstName')
    if (!lastName) newErrors.lastName = t('checkout.enterLastName')
    if (!address1) newErrors.address1 = t('checkout.enterAddress')
    if (!city) newErrors.city = t('checkout.enterCity')
    if (!country) newErrors.country = t('checkout.selectACountry')
    if (!phone) newErrors.phone = t('checkout.enterPhoneNumber')
    
    // Billing address validation (only if not using shipping address)
    if (!useShippingAsBilling) {
      if (!billingFirstName) newErrors.billingFirstName = t('checkout.enterFirstName')
      if (!billingLastName) newErrors.billingLastName = t('checkout.enterLastName')
      if (!billingAddress1) newErrors.billingAddress1 = t('checkout.enterAddress')
      if (!billingCity) newErrors.billingCity = t('checkout.enterCity')
      if (!billingCountry) newErrors.billingCountry = t('checkout.selectACountry')
    }

    // Payment validation (only if credit card selected)
    if (paymentMethod === 'creditCards') {
      // Validate Stripe Elements card element
      if (!cardElement) {
        newErrors.cardNumber = 'Card details are required'
      } else {
        // Check if card element has errors
        if (stripeError) {
          newErrors.cardNumber = stripeError
        }
      }
      if (!nameOnCard) {
        newErrors.nameOnCard = 'Enter the name on card'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle Pay Now button click
  const handlePayNow = async (e: React.MouseEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}

    // Contact validation
    if (!isAuthenticated && !email) {
      newErrors.email = 'Enter an email'
    } else if (!isAuthenticated && email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Enter a valid email'
    }

    // Delivery validation
    if (!firstName) newErrors.firstName = t('checkout.enterFirstName')
    if (!lastName) newErrors.lastName = t('checkout.enterLastName')
    if (!address1) newErrors.address1 = t('checkout.enterAddress')
    if (!city) newErrors.city = t('checkout.enterCity')
    if (!country) newErrors.country = t('checkout.selectACountry')
    if (!phone) newErrors.phone = t('checkout.enterPhoneNumber')
    
    // Billing address validation (only if not using shipping address)
    if (!useShippingAsBilling) {
      if (!billingFirstName) newErrors.billingFirstName = t('checkout.enterFirstName')
      if (!billingLastName) newErrors.billingLastName = t('checkout.enterLastName')
      if (!billingAddress1) newErrors.billingAddress1 = t('checkout.enterAddress')
      if (!billingCity) newErrors.billingCity = t('checkout.enterCity')
      if (!billingCountry) newErrors.billingCountry = t('checkout.selectACountry')
    }

    // Payment validation (only if credit card selected)
    if (paymentMethod === 'creditCards') {
      // Validate Stripe Elements card element
      if (!cardElement) {
        newErrors.cardNumber = 'Card details are required'
      } else {
        // Check if card element has errors
        if (stripeError) {
          newErrors.cardNumber = stripeError
        }
      }
      if (!nameOnCard) {
        newErrors.nameOnCard = 'Enter the name on card'
      }
    }

    setErrors(newErrors)
    
    if (Object.keys(newErrors).length > 0) {
      // Scroll to first error after state update
      setTimeout(() => {
        const firstErrorField = Object.keys(newErrors)[0]
        if (firstErrorField) {
          const element = document.getElementById(firstErrorField)
          element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
      return
    }

    // Form is valid, proceed with payment
    try {
      setIsProcessingPayment(true)
      console.log('Form is valid, creating order and processing payment...')

      // Create order first
      const orderRequest = {
        items: cart?.items.map(item => ({
          productId: item.product.id,
          quantity: item.quantity
        })) || [],
        shippingAddress: {
          street: address1,
          apartment: address2 || '',
          city: city,
          state: '', // Not required in Switzerland
          postalCode: postalCode || '',
          country: country
        },
        billingAddress: useShippingAsBilling ? {
          street: address1,
          apartment: address2 || '',
          city: city,
          state: '',
          postalCode: postalCode || '',
          country: country
        } : {
          street: billingAddress1,
          apartment: billingAddress2 || '',
          city: billingCity,
          state: '',
          postalCode: billingPostalCode || '',
          country: billingCountry
        },
        notes: `Packaging: ${packagingOption}, Shipping: ${shippingMethod}`,
        discountCode: discountCodeApplied ? discountCode : null
      }

      console.log('Creating order with request:', orderRequest)
      const orderResponse = await api.post('/api/orders', orderRequest)
      const order = orderResponse.data
      console.log('Order created:', order)

      // Create Stripe payment intent
      if (paymentMethod === 'creditCards') {
        const currency = 'CHF' // TODO: Get from currency context
        console.log('Creating Stripe payment intent for order:', order.id, 'currency:', currency)
        const paymentIntentResponse = await api.post(`/api/stripe/create-payment-intent?orderId=${order.id}&currency=${currency}`)
        const paymentIntent = paymentIntentResponse.data
        console.log('Payment intent created:', paymentIntent)

        // Process Stripe payment
        await processStripePayment(paymentIntent, order.id)
      } else {
        // PostFinance/Twint - redirect to payment gateway
        console.log('PostFinance/Twint payment - redirecting...')
        // TODO: Implement PostFinance/Twint redirect
        alert('PostFinance/Twint payment will be implemented soon')
        setIsProcessingPayment(false)
      }
    } catch (error: any) {
      console.error('Payment error:', error)
      alert(error.response?.data?.message || error.message || 'Failed to process payment. Please try again.')
      setIsProcessingPayment(false)
    }
  }

  const processStripePayment = async (paymentIntent: any, orderId: string) => {
    try {
      console.log('Processing Stripe payment with PaymentIntent:', paymentIntent.paymentIntentId)
      console.log('Client secret:', paymentIntent.clientSecret)
      
      // Get Stripe publishable key
      const configResponse = await api.get('/api/stripe/config')
      const { publishableKey } = configResponse.data
      
      if (!publishableKey) {
        throw new Error('Stripe is not configured. Please configure Stripe keys in admin settings.')
      }

      // Load Stripe.js dynamically
      let Stripe: any
      if (typeof window !== 'undefined') {
        if (!(window as any).Stripe) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script')
            script.src = 'https://js.stripe.com/v3/'
            script.onload = () => resolve(undefined)
            script.onerror = reject
            document.head.appendChild(script)
          })
        }
        Stripe = (window as any).Stripe
      }

      // Use Stripe Elements if available, otherwise fall back to direct confirmation
      if (!stripe || !cardElement) {
        // Fallback: Load Stripe if not already loaded
        let Stripe: any
        if (typeof window !== 'undefined') {
          if (!(window as any).Stripe) {
            await new Promise((resolve, reject) => {
              const script = document.createElement('script')
              script.src = 'https://js.stripe.com/v3/'
              script.onload = () => resolve(undefined)
              script.onerror = reject
              document.head.appendChild(script)
            })
          }
          Stripe = (window as any).Stripe
        }

        const stripeInstance = Stripe(publishableKey)
        
        // Use confirmCardPayment directly with card details
        const { error: confirmError, paymentIntent: confirmedPaymentIntent } = await stripeInstance.confirmCardPayment(
          paymentIntent.clientSecret,
          {
            payment_method: {
              card: {
                number: cardNumber.replace(/\s/g, ''),
                exp_month: parseInt(expiryDate.split('/')[0]),
                exp_year: 2000 + parseInt(expiryDate.split('/')[1]),
                cvc: cvv,
              },
              billing_details: {
                name: nameOnCard,
              },
            },
          }
        )

        if (confirmError) {
          console.error('Stripe payment confirmation error:', confirmError)
          throw new Error(confirmError.message || 'Payment failed')
        }

        if (confirmedPaymentIntent.status === 'succeeded') {
          console.log('Payment succeeded, confirming on backend...')
          try {
            const confirmResponse = await api.post(`/api/payments/stripe/confirm?orderId=${orderId}&paymentIntentId=${paymentIntent.paymentIntentId}`)
            console.log('Payment confirmed on backend:', confirmResponse.data)
            // Clear cart before redirecting
            try {
              await clearCart()
              console.log('Cart cleared after successful payment')
            } catch (cartError) {
              console.error('Failed to clear cart:', cartError)
              // Continue to success page even if cart clearing fails
            }
            // Update newsletter subscription if opted in
            if (marketingOptIn && user) {
              try {
                await api.put('/api/user/profile', {
                  newsletterSubscribed: true
                })
                console.log('Newsletter subscription updated')
              } catch (newsletterError) {
                console.error('Failed to update newsletter subscription:', newsletterError)
                // Don't fail the order if newsletter update fails
              }
            }
            
            router.push(`/checkout/success?orderId=${orderId}`)
          } catch (confirmError: any) {
            console.error('Failed to confirm payment on backend:', confirmError)
            // Even if backend confirmation fails, payment succeeded on Stripe side
            // Still redirect to success page but show a warning
            alert('Payment succeeded but there was an issue confirming it. Please contact support with your order ID.')
            router.push(`/checkout/success?orderId=${orderId}`)
          }
        } else {
          throw new Error(`Payment status: ${confirmedPaymentIntent.status}`)
        }
      } else {
        // Use Stripe Elements (preferred method)
        // Create payment method from card element
        const { error: createError, paymentMethod } = await stripe.createPaymentMethod({
          type: 'card',
          card: cardElement,
          billing_details: {
            name: nameOnCard,
          },
        })

        if (createError) {
          throw new Error(createError.message)
        }

        // Confirm payment with the payment method
        const { error: confirmError, paymentIntent: confirmedPaymentIntent } = await stripe.confirmCardPayment(
          paymentIntent.clientSecret,
          {
            payment_method: paymentMethod.id,
          }
        )

        if (confirmError) {
          console.error('Stripe payment confirmation error:', confirmError)
          throw new Error(confirmError.message || 'Payment failed')
        }

        if (confirmedPaymentIntent.status === 'succeeded') {
          console.log('Payment succeeded, confirming on backend...')
          try {
            const confirmResponse = await api.post(`/api/payments/stripe/confirm?orderId=${orderId}&paymentIntentId=${paymentIntent.paymentIntentId}`)
            console.log('Payment confirmed on backend:', confirmResponse.data)
            // Clear cart before redirecting
            try {
              await clearCart()
              console.log('Cart cleared after successful payment')
            } catch (cartError) {
              console.error('Failed to clear cart:', cartError)
              // Continue to success page even if cart clearing fails
            }
            // Update newsletter subscription if opted in
            if (marketingOptIn && user) {
              try {
                await api.put('/api/user/profile', {
                  newsletterSubscribed: true
                })
                console.log('Newsletter subscription updated')
              } catch (newsletterError) {
                console.error('Failed to update newsletter subscription:', newsletterError)
                // Don't fail the order if newsletter update fails
              }
            }
            router.push(`/checkout/success?orderId=${orderId}`)
          } catch (confirmError: any) {
            console.error('Failed to confirm payment on backend:', confirmError)
            // Even if backend confirmation fails, payment succeeded on Stripe side
            // Still redirect to success page but show a warning
            alert('Payment succeeded but there was an issue confirming it. Please contact support with your order ID.')
            router.push(`/checkout/success?orderId=${orderId}`)
          }
        } else {
          throw new Error(`Payment status: ${confirmedPaymentIntent.status}`)
        }
      }
    } catch (error: any) {
      console.error('Stripe payment processing error:', error)
      alert(error.message || error.response?.data?.message || 'Payment failed. Please try again.')
      setIsProcessingPayment(false)
    }
  }

  const currentTotal = cart?.total || 0
  const subtotal = currentTotal
  const isFreeShipping = freeShippingConfig.enabled && subtotal >= freeShippingConfig.threshold
  const shippingCost = isFreeShipping ? 0 : 15
  const subtotalWithShipping = subtotal + shippingCost
  const estimatedTotal = discountAmount > 0 ? subtotalWithShipping - discountAmount : subtotalWithShipping
  
  // Calculate total savings from special offers
  const specialOfferSavings = cart?.items.reduce((total, item) => {
    if (item.product.specialOfferPrice && item.product.specialOfferPrice < item.product.price) {
      const savingsPerItem = item.product.price - item.product.specialOfferPrice
      return total + (savingsPerItem * item.quantity)
    }
    return total
  }, 0) || 0
  
  const totalSavings = specialOfferSavings + (isFreeShipping ? shippingCost : 0) + discountAmount
  
  // Validate and apply discount code
  const handleApplyDiscountCode = async () => {
    if (!discountCode.trim()) {
      setDiscountError(t('checkout.pleaseEnterDiscountCode'))
      return
    }
    
    setIsValidatingDiscount(true)
    setDiscountError(null)
    
    try {
      const response = await api.post('/api/public/discount-codes/validate', null, {
        params: {
          code: discountCode.trim(),
          orderAmount: subtotalWithShipping
        }
      })
      
      if (response.data.valid) {
        setDiscountCodeApplied(true)
        setDiscountAmount(parseFloat(response.data.discountAmount) || 0)
        setDiscountError(null)
      } else {
        setDiscountCodeApplied(false)
        setDiscountAmount(0)
        // Always use translated error message, ignore backend message if it's generic
        const backendMessage = response.data.message || ''
        if (backendMessage.toLowerCase().includes('invalid') || backendMessage.toLowerCase().includes('not found')) {
          setDiscountError(t('checkout.invalidDiscountCode'))
        } else {
          setDiscountError(backendMessage || t('checkout.invalidDiscountCode'))
        }
      }
    } catch (error: any) {
      setDiscountCodeApplied(false)
      setDiscountAmount(0)
      setDiscountError(error.response?.data?.message || t('checkout.failedToValidateDiscount'))
    } finally {
      setIsValidatingDiscount(false)
    }
  }
  
  const handleRemoveDiscountCode = () => {
    setDiscountCode('')
    setDiscountCodeApplied(false)
    setDiscountAmount(0)
    setDiscountError(null)
  }

  useEffect(() => {
    fetchShippingCountries()
    if (isAuthenticated && user) {
      loadUserData()
    }
    loadPackagingImages()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user])

  useEffect(() => {
    if (cart && cart.items.length >= 0) {
      loadYouMayAlsoLike()
    }
  }, [cart?.items?.length])

  // Initialize Stripe Elements when payment method is credit card
  useEffect(() => {
    // Only initialize if credit card is selected
    if (paymentMethod !== 'creditCards') {
      // Cleanup if switching away from credit card
      if (cardElement) {
        cardElement.unmount()
        setCardElement(null)
        setStripeError(null)
      }
      return
    }

    // Don't re-initialize if already initialized
    if (cardElement) {
      return
    }

    const initializeStripe = async () => {
      // Check if ref is available
      if (!cardElementRef.current) {
        console.warn('Card element ref not available yet, retrying...')
        // Retry after a short delay
        setTimeout(initializeStripe, 100)
        return
      }

      try {
        // Get Stripe publishable key
        const configResponse = await api.get('/api/stripe/config')
        const { publishableKey } = configResponse.data
        
        if (!publishableKey) {
          console.error('Stripe publishable key not found')
          return
        }

        // Load Stripe
        const stripeInstance = await loadStripe(publishableKey)
        if (!stripeInstance) {
          console.error('Failed to load Stripe')
          return
        }

        setStripe(stripeInstance)

        // Create Elements
        const elementsInstance = stripeInstance.elements({
          appearance: {
            theme: 'stripe',
            variables: {
              colorPrimary: '#000000',
              colorBackground: '#ffffff',
              colorText: '#424770',
              colorDanger: '#df1b41',
              fontFamily: 'system-ui, sans-serif',
              spacingUnit: '4px',
              borderRadius: '4px',
            },
          },
        })

        setElements(elementsInstance)

        // Double-check ref is still available
        if (!cardElementRef.current) {
          console.error('Card element ref is no longer available')
          return
        }

        // Create and mount Card Element
        const card = elementsInstance.create('card', {
          style: {
            base: {
              fontSize: '16px',
              color: '#424770',
              '::placeholder': {
                color: '#aab7c4',
              },
            },
            invalid: {
              color: '#df1b41',
              iconColor: '#df1b41',
            },
          },
          hidePostalCode: true, // We collect this separately
        })

        card.mount(cardElementRef.current)
        setCardElement(card)

        // Listen for card element changes
        card.on('change', (event) => {
          if (event.error) {
            setStripeError(event.error.message)
          } else {
            setStripeError(null)
            // Detect card type from brand
            if (event.brand) {
              const brandMap: Record<string, string> = {
                visa: 'Visa',
                mastercard: 'Mastercard',
                amex: 'American Express',
                discover: 'Discover',
              }
              setCardType(brandMap[event.brand] || '')
            }
          }
        })
      } catch (error) {
        console.error('Failed to initialize Stripe Elements:', error)
      }
    }

    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      // Small delay to ensure ref is attached
      setTimeout(initializeStripe, 50)
    })

    // Cleanup
    return () => {
      if (cardElement) {
        cardElement.unmount()
        setCardElement(null)
      }
    }
  }, [paymentMethod])

  // Mark component as mounted
  useEffect(() => {
    setMounted(true)
  }, [])

  // Removed redirect rule - users can stay on checkout page even with empty cart

  // Track when initial cart load is complete
  // We need to wait a bit after component mount to ensure cart state has fully initialized
  useEffect(() => {
    if (!mounted) return
    
    // Set a minimum delay to prevent flash, even if cart loads instantly from localStorage
    // This ensures skeleton always shows for at least 300ms to prevent flash
    const minDelayTimer = setTimeout(() => {
      // Once loading is complete, mark as completed
      // This ensures we don't show empty cart message until we've actually loaded the cart
      if (!isLoading) {
        setHasInitialLoadCompleted(true)
      }
    }, 300) // Minimum 300ms delay to prevent flash
    
    return () => clearTimeout(minDelayTimer)
  }, [isLoading, mounted])

  // Show skeleton loading state while cart is being fetched OR until initial load is confirmed
  // Also show skeleton if component hasn't mounted yet (prevents flash on initial render)
  if (!mounted || isLoading || !hasInitialLoadCompleted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CheckoutHeader />
        <main className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="h-8 bg-gray-200 rounded w-32 mb-8 animate-pulse"></div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Form Skeleton */}
              <div className="space-y-8">
                {/* Contact Section Skeleton */}
                <section className="bg-white rounded-lg shadow-sm p-6">
                  <div className="h-6 bg-gray-200 rounded w-24 mb-4 animate-pulse"></div>
                  <div className="h-10 bg-gray-200 rounded w-full mb-4 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                </section>

                {/* Delivery Section Skeleton */}
                <section className="bg-white rounded-lg shadow-sm p-6">
                  <div className="h-6 bg-gray-200 rounded w-24 mb-4 animate-pulse"></div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                </section>

                {/* Payment Section Skeleton */}
                <section className="bg-white rounded-lg shadow-sm p-6">
                  <div className="h-6 bg-gray-200 rounded w-32 mb-4 animate-pulse"></div>
                  <div className="h-10 bg-gray-200 rounded w-full mb-4 animate-pulse"></div>
                  <div className="h-10 bg-gray-200 rounded w-full animate-pulse"></div>
                </section>
              </div>

              {/* Right Sidebar - Order Summary Skeleton */}
              <aside className="lg:sticky lg:top-8 h-fit">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="h-6 bg-gray-200 rounded w-32 mb-6 animate-pulse"></div>
                  <div className="space-y-4">
                    <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Only show empty cart message if we're sure the cart is empty AND initial load is complete
  // This prevents showing empty cart message during initial load or before cart state is confirmed
  // Don't render empty cart message - redirect will happen via useEffect
  if (hasInitialLoadCompleted && (!cart || cart.items.length === 0)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CheckoutHeader />
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
          <div className="text-center">
            <p className="text-gray-600">{t('checkout.redirectingToHome')}</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  // Legacy code - keeping for reference but won't be reached
  if (false && hasInitialLoadCompleted && (!cart || cart.items.length === 0)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CheckoutHeader />
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
            <Link href="/products" className="btn btn-primary">
              Continue Shopping
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CheckoutHeader />
      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">{t('checkout.title')}</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Form */}
            <div className="space-y-8">
              {/* Contact Section */}
              <section className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('checkout.contact')}</h2>

                {/* Email */}
                <div className="mb-4">
                  {isAuthenticated ? (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="text-sm font-medium">{t('checkout.email')}</span>
                      <span className="text-sm">{email || 'user@example.com'}</span>
                    </div>
                  ) : (
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        {t('checkout.email')}
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                          errors.email
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-300 focus:ring-black'
                        }`}
                        placeholder="Email"
                        required
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Marketing Opt-in */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="marketing_opt_in"
                    checked={marketingOptIn}
                    onChange={(e) => setMarketingOptIn(e.target.checked)}
                    className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                  />
                  <label htmlFor="marketing_opt_in" className="text-sm text-gray-700">
                    {t('checkout.emailMeWithNews')}
                  </label>
                </div>
              </section>

              {/* Delivery Section */}
              <section className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('checkout.delivery')}</h2>
                
                {/* Shipping Address Form */}
                <div className="space-y-4 mb-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                            {t('checkout.firstName')}
                          </label>
                          <input
                            type="text"
                            id="firstName"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                              errors.firstName
                                ? 'border-red-500 focus:ring-red-500'
                                : 'border-gray-300 focus:ring-black'
                            }`}
                            required
                          />
                          {errors.firstName && (
                            <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                          )}
                        </div>
                        <div>
                          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                            {t('checkout.lastName')}
                          </label>
                          <input
                            type="text"
                            id="lastName"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                              errors.lastName
                                ? 'border-red-500 focus:ring-red-500'
                                : 'border-gray-300 focus:ring-black'
                            }`}
                            required
                          />
                          {errors.lastName && (
                            <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label htmlFor="address1" className="block text-sm font-medium text-gray-700 mb-2">
                          {t('checkout.address')}
                        </label>
                        <input
                          type="text"
                          id="address1"
                          value={address1}
                          onChange={(e) => setAddress1(e.target.value)}
                          className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                            errors.address1
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-gray-300 focus:ring-black'
                          }`}
                          required
                        />
                        {errors.address1 && (
                          <p className="mt-1 text-sm text-red-600">{errors.address1}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="address2" className="block text-sm font-medium text-gray-700 mb-2">
                          {t('checkout.apartment')}
                        </label>
                        <input
                          type="text"
                          id="address2"
                          value={address2}
                          onChange={(e) => setAddress2(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                            {t('checkout.city')}
                          </label>
                          <input
                            type="text"
                            id="city"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                              errors.city
                                ? 'border-red-500 focus:ring-red-500'
                                : 'border-gray-300 focus:ring-black'
                            }`}
                            required
                          />
                          {errors.city && (
                            <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                          )}
                        </div>
                        <div>
                          <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-2">
                            {t('checkout.postalCode')}
                          </label>
                          <input
                            type="text"
                            id="postalCode"
                            value={postalCode}
                            onChange={(e) => setPostalCode(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                          {t('checkout.country')}
                        </label>
                        <select
                          id="country"
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                            errors.country
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-gray-300 focus:ring-black'
                          }`}
                          required
                        >
                          <option value="">{t('checkout.selectCountry')}</option>
                          {shippingCountries.map((countryName) => {
                            const countryKey = countryName.toLowerCase() as 'switzerland' | 'liechtenstein'
                            return (
                              <option key={countryName} value={countryName}>
                                {t(`checkout.${countryKey}`) || countryName}
                              </option>
                            )
                          })}
                        </select>
                        {errors.country && (
                          <p className="mt-1 text-sm text-red-600">{errors.country}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                          {t('checkout.phone')}
                        </label>
                        <div className="flex">
                          <CountryCodePicker
                            value={phoneCountryCode}
                            onChange={(code, phoneCode) => setPhoneCountryCode(code)}
                          />
                          <input
                            type="tel"
                            id="phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                            className={`flex-1 ml-2 px-4 py-2 border rounded-r-md focus:outline-none focus:ring-2 ${
                              errors.phone
                                ? 'border-red-500 focus:ring-red-500'
                                : 'border-gray-300 focus:ring-black'
                            }`}
                            placeholder="123456789"
                            required
                          />
                        </div>
                        {errors.phone && (
                          <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                        )}
                      </div>
                </div>

                {/* Shipping Method - Radio button style */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-3">{t('checkout.shippingMethod')}</h3>
                  <div className="space-y-3">
                    <label className="flex items-start gap-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="shippingMethod"
                        value="STANDARD"
                        checked={shippingMethod === 'STANDARD'}
                        onChange={(e) => setShippingMethod(e.target.value as 'STANDARD' | 'PREMIUM')}
                        className="mt-1 w-4 h-4 text-black border-gray-300 focus:ring-black"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{t('checkout.standard')}</p>
                        <p className="text-sm text-gray-600">3 - 7 {t('checkout.businessDays')}</p>
                      </div>
                      <span className="font-medium">{formatPrice(15)}</span>
                    </label>
                    <label className="flex items-start gap-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="shippingMethod"
                        value="PREMIUM"
                        checked={shippingMethod === 'PREMIUM'}
                        onChange={(e) => setShippingMethod(e.target.value as 'STANDARD' | 'PREMIUM')}
                        className="mt-1 w-4 h-4 text-black border-gray-300 focus:ring-black"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{t('checkout.premium')} - TBD - TO CHECK</p>
                        <p className="text-sm text-gray-600">1 - 3 {t('checkout.businessDays')}</p>
                      </div>
                      <span className="font-medium">{formatPrice(25)}</span>
                    </label>
                  </div>
                </div>

                {/* Packaging Options - Radio button style */}
                <div className="mt-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('checkout.packaging')}</h2>
                  <div className="space-y-3">
                    <label className="flex items-start gap-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="packagingOption"
                        value="STANDARD"
                        checked={packagingOption === 'STANDARD'}
                        onChange={(e) => setPackagingOption(e.target.value as 'STANDARD' | 'PREMIUM')}
                        className="mt-1 w-4 h-4 text-black border-gray-300 focus:ring-black"
                      />
                      <div className="flex-1">
                        <p className="font-medium mb-1">{t('checkout.standard')}</p>
                        <p className="text-sm text-gray-600">Includes a reusable, jewelry-safe velvet pouch and a branded jewelry storage box.</p>
                      </div>
                      <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                        {packagingImageStandard ? (
                          <img src={packagingImageStandard} alt="Standard Packaging" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs text-gray-400 text-center px-1">Image</span>
                        )}
                      </div>
                    </label>
                    <label className="flex items-start gap-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="packagingOption"
                        value="PREMIUM"
                        checked={packagingOption === 'PREMIUM'}
                        onChange={(e) => setPackagingOption(e.target.value as 'STANDARD' | 'PREMIUM')}
                        className="mt-1 w-4 h-4 text-black border-gray-300 focus:ring-black"
                      />
                      <div className="flex-1">
                        <p className="font-medium mb-1">Premium - Packaging</p>
                        <p className="text-sm text-gray-600">Premium packaging with enhanced presentation and protection.</p>
                      </div>
                      <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                        {packagingImagePremium ? (
                          <img src={packagingImagePremium} alt="Premium Packaging" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs text-gray-400 text-center px-1">Image</span>
                        )}
                      </div>
                    </label>
                  </div>
                </div>
              </section>

              {/* Payment Section */}
              <section className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">{t('checkout.payment')}</h2>
                  <p className="text-sm text-gray-600">{t('checkout.allTransactionsSecure')}</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="payment-credit"
                          name="payment"
                          value="creditCards"
                          checked={paymentMethod === 'creditCards'}
                          onChange={(e) => setPaymentMethod(e.target.value as any)}
                          className="mr-2"
                        />
                        <label htmlFor="payment-credit" className="font-medium">
                          Credit card
                        </label>
                      </div>
                      <div className="flex items-center gap-1">
                        {/* Always show Visa and Mastercard icons */}
                        <svg className="w-8 h-5" viewBox="0 0 48 16" fill="none" xmlns="http://www.w3.org/2000/svg" title="Visa">
                          <rect width="48" height="16" rx="2" fill="#1434CB"/>
                          <path d="M20.28 5.76h2.46l-1.94 4.48h-2.46l1.94-4.48zm5.04 2.92c0-.84-1.13-.89-1.13-1.27 0-.15.11-.23.34-.27.11-.02.43-.03.78.14l.14-1.1c-.18-.06-.42-.12-.71-.12-.84 0-1.44.36-1.44.87 0 .38.37.59.65.71.28.13.39.24.39.32 0 .2-.23.26-.45.26-.38 0-.61-.06-.79-.12l-.14 1.12c.19.06.54.12.88.12.88 0 1.5-.35 1.5-.89zm4.43 1.56h-1.91c-.3 0-.52-.15-.62-.38l-2.17-1.96h1.3c.17 0 .33.11.38.28l.52 1.28 1.28-3.17h1.24l-2.19 4.95z" fill="#FFFFFF"/>
                        </svg>
                        <svg className="w-8 h-5" viewBox="0 0 48 16" fill="none" xmlns="http://www.w3.org/2000/svg" title="Mastercard">
                          <rect width="48" height="16" rx="2" fill="#EB001B"/>
                          <circle cx="17" cy="8" r="5.5" fill="#F79E1B"/>
                          <circle cx="31" cy="8" r="5.5" fill="#FF5F00"/>
                          <path d="M24 3.5a5.5 5.5 0 1 0 0 9 5.5 5.5 0 0 0 0-9z" fill="#F79E1B" opacity="0.7"/>
                        </svg>
                      </div>
                    </div>
                    {paymentMethod === 'creditCards' && (
                      <div className="mt-4 space-y-4 ml-6">
                        {/* Stripe Card Element - replaces manual card inputs */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('checkout.cardDetails')}
                          </label>
                          <div className="relative">
                            <div 
                              ref={cardElementRef}
                              id="stripe-card-element"
                              className={`w-full px-4 py-3 border rounded-md min-h-[48px] ${
                                errors.cardNumber || stripeError
                                  ? 'border-red-500'
                                  : 'border-gray-300'
                              }`}
                              style={{ 
                                minHeight: '48px'
                              }}
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14" focusable="false" aria-hidden="true" className="w-4 h-4 text-gray-400">
                                <path d="M2.5 7c0-.966.784-1.75 1.75-1.75h5.5c.966 0 1.75.784 1.75 1.75v3.5a1.75 1.75 0 0 1-1.75 1.75h-5.5A1.75 1.75 0 0 1 2.5 10.5zm7-1.75V4.22c0-1.364-1.12-2.47-2.5-2.47S4.5 2.856 4.5 4.22v1.03" fill="white" stroke="currentColor" strokeWidth="0.5"/>
                              </svg>
                            </div>
                          </div>
                          {(errors.cardNumber || stripeError) && (
                            <p className="mt-1 text-sm text-red-600">{errors.cardNumber || stripeError}</p>
                          )}
                          <p className="mt-1 text-xs text-gray-500">{t('checkout.cardDetailsSecure')}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('checkout.nameOnCard')}
                          </label>
                          <input
                            type="text"
                            id="nameOnCard"
                            value={nameOnCard}
                            onChange={(e) => setNameOnCard(e.target.value)}
                            className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                              errors.nameOnCard
                                ? 'border-red-500 focus:ring-red-500'
                                : 'border-gray-300 focus:ring-black'
                            }`}
                            placeholder={t('checkout.nameOnCard')}
                          />
                          {errors.nameOnCard && (
                            <p className="mt-1 text-sm text-red-600">{errors.nameOnCard}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <input
                      type="radio"
                      id="payment-postfinance"
                      name="payment"
                      value="postfinance"
                      checked={paymentMethod === 'postfinance'}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="mr-2"
                    />
                    <label htmlFor="payment-postfinance" className="font-medium flex items-center gap-2">
                      <span>PostFinance</span>
                      <svg className="w-6 h-4" viewBox="0 0 24 16" fill="none" xmlns="http://www.w3.org/2000/svg" title="PostFinance">
                        <rect width="24" height="16" rx="2" fill="#FFCC00"/>
                        <path d="M12 4C9.79 4 8 5.79 8 8s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 5.5 12 5.5s2.5 1.12 2.5 2.5S13.38 10.5 12 10.5z" fill="#000"/>
                        <circle cx="12" cy="8" r="1.5" fill="#000"/>
                      </svg>
                      <span>/</span>
                      <svg className="w-8 h-5" viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg" title="Twint">
                        <rect width="40" height="24" rx="2" fill="#FF6B00"/>
                        <path d="M20 6C16.69 6 14 8.69 14 12s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" fill="#FFFFFF"/>
                        <circle cx="20" cy="12" r="2" fill="#FFFFFF"/>
                      </svg>
                    </label>
                    {paymentMethod === 'postfinance' && (
                      <div className="mt-2 ml-6 text-sm text-gray-600">
                        {t('checkout.youWillBeRedirected')}
                      </div>
                    )}
                  </div>
                  
                  {/* Billing Address Section */}
                  <div className="mt-6 pt-6 border-t border-gray-300">
                    <div className="flex items-center gap-2 mb-4">
                      <input
                        type="checkbox"
                        id="useShippingBilling"
                        checked={useShippingAsBilling}
                        onChange={(e) => setUseShippingAsBilling(e.target.checked)}
                        className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                      />
                      <label htmlFor="useShippingBilling" className="text-sm font-medium text-gray-700">
                        {t('checkout.useShippingAsBilling')}
                      </label>
                    </div>
                    
                    {!useShippingAsBilling && (
                      <div className="mt-4 space-y-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-3">{t('checkout.billingAddress')}</h3>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="billingFirstName" className="block text-sm font-medium text-gray-700 mb-2">
                              {t('checkout.firstName')}
                            </label>
                            <input
                              type="text"
                              id="billingFirstName"
                              value={billingFirstName}
                              onChange={(e) => setBillingFirstName(e.target.value)}
                              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                                errors.billingFirstName
                                  ? 'border-red-500 focus:ring-red-500'
                                  : 'border-gray-300 focus:ring-black'
                              }`}
                              required
                            />
                            {errors.billingFirstName && (
                              <p className="mt-1 text-sm text-red-600">{errors.billingFirstName}</p>
                            )}
                          </div>
                          <div>
                            <label htmlFor="billingLastName" className="block text-sm font-medium text-gray-700 mb-2">
                              {t('checkout.lastName')}
                            </label>
                            <input
                              type="text"
                              id="billingLastName"
                              value={billingLastName}
                              onChange={(e) => setBillingLastName(e.target.value)}
                              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                                errors.billingLastName
                                  ? 'border-red-500 focus:ring-red-500'
                                  : 'border-gray-300 focus:ring-black'
                              }`}
                              required
                            />
                            {errors.billingLastName && (
                              <p className="mt-1 text-sm text-red-600">{errors.billingLastName}</p>
                            )}
                          </div>
                        </div>

                        <div>
                          <label htmlFor="billingAddress1" className="block text-sm font-medium text-gray-700 mb-2">
                            {t('checkout.address')}
                          </label>
                          <input
                            type="text"
                            id="billingAddress1"
                            value={billingAddress1}
                            onChange={(e) => setBillingAddress1(e.target.value)}
                            className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                              errors.billingAddress1
                                ? 'border-red-500 focus:ring-red-500'
                                : 'border-gray-300 focus:ring-black'
                            }`}
                            required
                          />
                          {errors.billingAddress1 && (
                            <p className="mt-1 text-sm text-red-600">{errors.billingAddress1}</p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="billingAddress2" className="block text-sm font-medium text-gray-700 mb-2">
                            {t('checkout.apartment')}
                          </label>
                          <input
                            type="text"
                            id="billingAddress2"
                            value={billingAddress2}
                            onChange={(e) => setBillingAddress2(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="billingCity" className="block text-sm font-medium text-gray-700 mb-2">
                              {t('checkout.city')}
                            </label>
                            <input
                              type="text"
                              id="billingCity"
                              value={billingCity}
                              onChange={(e) => setBillingCity(e.target.value)}
                              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                                errors.billingCity
                                  ? 'border-red-500 focus:ring-red-500'
                                  : 'border-gray-300 focus:ring-black'
                              }`}
                              required
                            />
                            {errors.billingCity && (
                              <p className="mt-1 text-sm text-red-600">{errors.billingCity}</p>
                            )}
                          </div>
                          <div>
                            <label htmlFor="billingPostalCode" className="block text-sm font-medium text-gray-700 mb-2">
                              {t('checkout.postalCode')}
                            </label>
                            <input
                              type="text"
                              id="billingPostalCode"
                              value={billingPostalCode}
                              onChange={(e) => setBillingPostalCode(e.target.value)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                            />
                          </div>
                        </div>

                        <div>
                          <label htmlFor="billingCountry" className="block text-sm font-medium text-gray-700 mb-2">
                            {t('checkout.country')}
                          </label>
                          <select
                            id="billingCountry"
                            value={billingCountry}
                            onChange={(e) => setBillingCountry(e.target.value)}
                            className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                              errors.billingCountry
                                ? 'border-red-500 focus:ring-red-500'
                                : 'border-gray-300 focus:ring-black'
                            }`}
                            required
                          >
                            <option value="">{t('checkout.selectCountry')}</option>
                            {shippingCountries.map((countryName) => {
                              const countryKey = countryName.toLowerCase() as 'switzerland' | 'liechtenstein'
                              return (
                                <option key={countryName} value={countryName}>
                                  {t(`checkout.${countryKey}`) || countryName}
                                </option>
                              )
                            })}
                          </select>
                          {errors.billingCountry && (
                            <p className="mt-1 text-sm text-red-600">{errors.billingCountry}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Remember Me - Currently not implemented */}
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-3">{t('checkout.rememberMe')}</h3>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="rememberMe"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                        disabled
                        title="Payment method saving will be implemented with Stripe Payment Methods API"
                      />
                      <label htmlFor="rememberMe" className="text-sm text-gray-700 opacity-60">
                        {t('checkout.savePaymentInfo')}
                        <span className="text-xs text-gray-500 ml-2">({t('checkout.comingSoon')})</span>
                      </label>
                    </div>
                    
                    {/* Pay Now Button - Under Remember Me */}
                    <button
                      type="button"
                      onClick={handlePayNow}
                      className="w-full mt-6 px-6 py-3 bg-black text-white rounded-md hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      disabled={!isAuthenticated || isProcessingPayment}
                    >
                      {isProcessingPayment ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          {t('checkout.processing')}
                        </>
                      ) : (
                        t('checkout.payNow')
                      )}
                    </button>
                  </div>
                </div>
              </section>
            </div>

            {/* Right Sidebar - Order Summary */}
            <aside className="lg:sticky lg:top-8 h-fit">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('checkout.orderSummary')}</h2>
                
                {/* Shopping Cart */}
                <section className="mb-6">
                  <h3 className="text-lg font-medium mb-4">{t('checkout.shoppingCart')}</h3>
                  <div className={`space-y-4 ${cart.items.length > 3 ? 'max-h-[400px] overflow-y-auto pr-2' : ''}`}>
                    {cart.items.map((item) => {
                      const primaryImage = item.product.images?.[0]
                      const hasSpecialOffer = item.product.specialOfferPrice && item.product.specialOfferPrice < item.product.price
                      const displayPrice = hasSpecialOffer ? item.product.specialOfferPrice! : item.product.price
                      const savingsPerItem = hasSpecialOffer ? item.product.price - item.product.specialOfferPrice! : 0
                      const totalSavingsForItem = savingsPerItem * item.quantity

                      return (
                        <div key={item.product.id} className="flex gap-4">
                          <div className="relative w-24 h-24 flex-shrink-0">
                            {primaryImage ? (
                              <Image
                                src={primaryImage.url}
                                alt={primaryImage.altText || item.product.name}
                                width={96}
                                height={96}
                                className="w-full h-full object-cover rounded"
                                sizes="96px"
                                unoptimized
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 rounded" />
                            )}
                            <div className="absolute -bottom-1 -right-1 bg-black text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                              {item.quantity}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{item.product.name}</p>
                            <p className="text-sm text-gray-600">{item.product.material || 'N/A'}</p>
                            <div className="mt-2 space-y-1">
                              <div className="flex items-center gap-2">
                                {hasSpecialOffer ? (
                                  <>
                                    <span className="text-sm font-medium text-red-600">{formatPrice(displayPrice)}</span>
                                    <span className="text-sm line-through text-gray-400">{formatPrice(item.product.price)}</span>
                                  </>
                                ) : (
                                  <span className="text-sm font-medium">{formatPrice(displayPrice)}</span>
                                )}
                              </div>
                              {hasSpecialOffer && totalSavingsForItem > 0 && (
                                <div className="text-xs text-green-600 font-medium">
                                  {t('checkout.save')} {formatPrice(totalSavingsForItem)} ({(item.quantity > 1 ? `${item.quantity} × ` : '')}{formatPrice(savingsPerItem)})
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>

                {/* Discount Code */}
                <section className="mb-6">
                  <h3 className="text-lg font-medium mb-3">{t('checkout.discountCodeOrGiftCard')}</h3>
                  {!discountCodeApplied ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder={t('checkout.enterDiscountCode')}
                          value={discountCode}
                          onChange={(e) => {
                            setDiscountCode(e.target.value.toUpperCase())
                            setDiscountError(null)
                          }}
                          className={`flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                            discountError
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-gray-300 focus:ring-black'
                          }`}
                          disabled={isValidatingDiscount}
                        />
                        <button
                          onClick={handleApplyDiscountCode}
                          disabled={isValidatingDiscount || !discountCode.trim()}
                          className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isValidatingDiscount ? t('checkout.applying') : t('checkout.apply')}
                        </button>
                      </div>
                      {discountError && (
                        <p className="text-sm text-red-600">{discountError}</p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-green-800">
                          {t('checkout.codeApplied')}: {discountCode}
                        </span>
                        <span className="text-sm text-green-600">
                          -{formatPrice(discountAmount)}
                        </span>
                      </div>
                      <button
                        onClick={handleRemoveDiscountCode}
                        className="text-sm text-red-600 hover:text-red-800 underline"
                      >
                        {t('checkout.remove')}
                      </button>
                    </div>
                  )}
                </section>

                {/* Cost Summary */}
                <section>
                  <h3 className="text-lg font-medium mb-4">{t('checkout.costSummary')}</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-700">{t('cart.subtotal')} · {cart.items.length} {cart.items.length === 1 ? t('checkout.item') : t('checkout.items')}</span>
                      <span className="text-sm font-medium">{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-700">{t('cart.shipping')}</span>
                        <ShippingInfoTooltip />
                      </div>
                      <span className="text-sm font-medium">
                        {isFreeShipping ? (
                          <>
                            <span className="line-through text-gray-400 mr-2">{formatPrice(15)}</span>
                            <span className="text-green-600">{t('checkout.free')}</span>
                          </>
                        ) : (
                          formatPrice(15)
                        )}
                      </span>
                    </div>
                    <div className="border-t border-gray-300 pt-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold">{t('checkout.total')}</span>
                        <div className="text-right">
                          <span className="text-lg font-bold">{formatPrice(estimatedTotal)}</span>
                        </div>
                      </div>
                    </div>
                    {totalSavings > 0 && (
                      <div className="flex flex-col items-end pt-2 border-t border-gray-200">
                        <div className="flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14" focusable="false" aria-hidden="true" className="w-4 h-4 text-green-600">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 3.25v2.844a2.5 2.5 0 0 1-.708 1.743L7.75 12.25m1-10.5H6.699a2 2 0 0 0-1.414.586L1.737 5.883a1.75 1.75 0 0 0 0 2.475l2.332 2.331a1.5 1.5 0 0 0 2.121 0l3.724-3.724a2 2 0 0 0 .586-1.414V3.5a1.75 1.75 0 0 0-1.75-1.75"></path>
                            <circle cx="7.75" cy="4.5" r="0.563" strokeLinecap="round" strokeLinejoin="round"></circle>
                            <path strokeLinejoin="round" d="M7.74 4.49h.02v.02h-.02z"></path>
                          </svg>
                          <strong className="text-sm font-semibold text-gray-900 uppercase">{t('checkout.totalSavings')}</strong>
                        </div>
                        <strong className="text-sm font-semibold text-green-600">{formatPrice(totalSavings)}</strong>
                      </div>
                    )}
                  </div>
                </section>

                {/* You May Also Like */}
                {youMayAlsoLike.length > 0 && (
                  <section className="mt-8">
                    <h3 className="text-lg font-medium mb-4">{t('cart.youMayAlsoLike')}</h3>
                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                      {youMayAlsoLike.map((product) => {
                        const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0]
                        const hasSpecialOffer = product.specialOfferPrice && product.specialOfferPrice < product.price
                        const displayPrice = hasSpecialOffer ? product.specialOfferPrice! : product.price

                        return (
                          <div key={product.id} className="flex-shrink-0 w-[180px]">
                            <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2">
                              {primaryImage ? (
                                <Image
                                  src={primaryImage.url}
                                  alt={primaryImage.altText || product.name}
                                  width={180}
                                  height={180}
                                  className="w-full h-full object-cover"
                                  sizes="180px"
                                  unoptimized
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-200" />
                              )}
                            </div>
                            <p className="font-medium text-sm mb-1 line-clamp-2">{product.name}</p>
                            <p className="text-xs text-gray-600 mb-2">{product.material || product.color || 'N/A'}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{formatPrice(displayPrice)}</span>
                              <button
                                onClick={async (e) => {
                                  e.preventDefault()
                                  try {
                                    await addToCart(product, 1)
                                    // Filter out added product without page refresh
                                    setYouMayAlsoLike(prev => prev.filter(p => p.id !== product.id))
                                  } catch (error) {
                                    console.error('Failed to add to cart:', error)
                                  }
                                }}
                                className="px-3 py-1 text-xs bg-black text-white rounded hover:bg-gray-800"
                              >
                                {t('common.add')}
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </section>
                )}
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

