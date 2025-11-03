'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin, Linkedin, Youtube, Pinterest } from 'lucide-react'
import api from '@/services/api'

interface FooterConfig {
  companyName?: string
  companyDescription?: string
  quickLinks?: {
    enabled: boolean
    links?: {
      products?: { enabled: boolean; label?: string }
      categories?: { enabled: boolean; label?: string }
      about?: { enabled: boolean; label?: string }
      contact?: { enabled: boolean; label?: string }
    }
  }
  contact?: {
    enabled: boolean
    details?: {
      address?: { enabled: boolean; value?: string }
      phone?: { enabled: boolean; value?: string }
      email?: { enabled: boolean; value?: string }
    }
  }
  social?: {
    enabled: boolean
    links?: {
      facebook?: { enabled: boolean; url?: string }
      instagram?: { enabled: boolean; url?: string }
      twitter?: { enabled: boolean; url?: string }
      linkedin?: { enabled: boolean; url?: string }
      youtube?: { enabled: boolean; url?: string }
      pinterest?: { enabled: boolean; url?: string }
    }
  }
  bottom?: {
    copyright?: { enabled: boolean; text?: string }
    privacyPolicy?: { enabled: boolean; label?: string; url?: string }
    termsOfService?: { enabled: boolean; label?: string; url?: string }
  }
  newsletter?: {
    enabled: boolean
    title?: string
    description?: string
    buttonText?: string
  }
}

export function Footer() {
  const [config, setConfig] = useState<FooterConfig | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFooterConfig = async () => {
      try {
        const response = await api.get('/api/public/footer-config')
        setConfig(response.data)
      } catch (error) {
        console.error('Failed to load footer configuration:', error)
        // Use default values if API fails
        setConfig(null)
      } finally {
        setLoading(false)
      }
    }

    fetchFooterConfig()
  }, [])

  // Default values fallback
  const companyName = config?.companyName || 'JewelryShop'
  const companyDescription = config?.companyDescription || 'Discover our exquisite collection of premium jewelry. From elegant rings to stunning necklaces, we offer the finest pieces for every occasion.'
  
  const quickLinksEnabled = config?.quickLinks?.enabled !== false
  const quickLinks = config?.quickLinks?.links || {}
  
  const contactEnabled = config?.contact?.enabled !== false
  const contactDetails = config?.contact?.details || {}
  
  const socialEnabled = config?.social?.enabled !== false
  const socialLinks = config?.social?.links || {}
  
  const bottom = config?.bottom || {}
  const newsletter = config?.newsletter || {}

  if (loading) {
    return (
      <footer className="bg-white text-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-8"></div>
          </div>
        </div>
      </footer>
    )
  }

  return (
    <footer className="bg-white text-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold text-black mb-4">{companyName}</h3>
            <p className="text-black mb-4">{companyDescription}</p>
            
            {/* Social Media Links */}
            {socialEnabled && (
              <div className="flex space-x-4">
                {socialLinks.facebook?.enabled && socialLinks.facebook.url && (
                  <a 
                    href={socialLinks.facebook.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-black hover:text-gray-600 transition-colors"
                    aria-label="Facebook"
                  >
                    <Facebook className="h-5 w-5" />
                  </a>
                )}
                {socialLinks.instagram?.enabled && socialLinks.instagram.url && (
                  <a 
                    href={socialLinks.instagram.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-black hover:text-gray-600 transition-colors"
                    aria-label="Instagram"
                  >
                    <Instagram className="h-5 w-5" />
                  </a>
                )}
                {socialLinks.twitter?.enabled && socialLinks.twitter.url && (
                  <a 
                    href={socialLinks.twitter.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-black hover:text-gray-600 transition-colors"
                    aria-label="Twitter"
                  >
                    <Twitter className="h-5 w-5" />
                  </a>
                )}
                {socialLinks.linkedin?.enabled && socialLinks.linkedin.url && (
                  <a 
                    href={socialLinks.linkedin.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-black hover:text-gray-600 transition-colors"
                    aria-label="LinkedIn"
                  >
                    <Linkedin className="h-5 w-5" />
                  </a>
                )}
                {socialLinks.youtube?.enabled && socialLinks.youtube.url && (
                  <a 
                    href={socialLinks.youtube.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-black hover:text-gray-600 transition-colors"
                    aria-label="YouTube"
                  >
                    <Youtube className="h-5 w-5" />
                  </a>
                )}
                {socialLinks.pinterest?.enabled && socialLinks.pinterest.url && (
                  <a 
                    href={socialLinks.pinterest.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-black hover:text-gray-600 transition-colors"
                    aria-label="Pinterest"
                  >
                    <Pinterest className="h-5 w-5" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Quick Links */}
          {quickLinksEnabled && (
            <div>
              <h4 className="text-lg font-semibold mb-4 text-black">Quick Links</h4>
              <ul className="space-y-3">
                {quickLinks.products?.enabled && (
                  <li>
                    <Link 
                      href="/products" 
                      className="block px-3 py-2 text-black hover:text-gray-600 hover:bg-gray-100 rounded-md transition-all duration-200 transform hover:translate-x-1 border-l-2 border-transparent hover:border-black"
                    >
                      {quickLinks.products.label || 'All Products'}
                    </Link>
                  </li>
                )}
                {quickLinks.categories?.enabled && (
                  <li>
                    <Link 
                      href="/categories" 
                      className="block px-3 py-2 text-black hover:text-gray-600 hover:bg-gray-100 rounded-md transition-all duration-200 transform hover:translate-x-1 border-l-2 border-transparent hover:border-black"
                    >
                      {quickLinks.categories.label || 'Categories'}
                    </Link>
                  </li>
                )}
                {quickLinks.about?.enabled && (
                  <li>
                    <Link 
                      href="/about" 
                      className="block px-3 py-2 text-black hover:text-gray-600 hover:bg-gray-100 rounded-md transition-all duration-200 transform hover:translate-x-1 border-l-2 border-transparent hover:border-black"
                    >
                      {quickLinks.about.label || 'About Us'}
                    </Link>
                  </li>
                )}
                {quickLinks.contact?.enabled && (
                  <li>
                    <Link 
                      href="/contact" 
                      className="block px-3 py-2 text-black hover:text-gray-600 hover:bg-gray-100 rounded-md transition-all duration-200 transform hover:translate-x-1 border-l-2 border-transparent hover:border-black"
                    >
                      {quickLinks.contact.label || 'Contact'}
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Contact Info */}
          {contactEnabled && (
            <div>
              <h4 className="text-lg font-semibold mb-4 text-black">Contact Info</h4>
              <div className="space-y-2">
                {contactDetails.address?.enabled && contactDetails.address.value && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-black" />
                    <span className="text-black">{contactDetails.address.value}</span>
                  </div>
                )}
                {contactDetails.phone?.enabled && contactDetails.phone.value && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-black" />
                    <span className="text-black">{contactDetails.phone.value}</span>
                  </div>
                )}
                {contactDetails.email?.enabled && contactDetails.email.value && (
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-black" />
                    <a 
                      href={`mailto:${contactDetails.email.value}`}
                      className="text-black hover:text-gray-600 transition-colors"
                    >
                      {contactDetails.email.value}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Newsletter Subscription */}
        {newsletter.enabled && (
          <div className="border-t border-black mt-8 pt-8">
            <div className="max-w-md mx-auto text-center">
              <h4 className="text-xl font-semibold mb-2 text-black">
                {newsletter.title || 'Subscribe to Our Newsletter'}
              </h4>
              <p className="text-black mb-4">
                {newsletter.description || 'Get the latest updates on new products and upcoming sales.'}
              </p>
              <form className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-2 rounded-md border border-black text-black focus:outline-none focus:ring-2 focus:ring-black"
                  required
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors font-medium"
                >
                  {newsletter.buttonText || 'Subscribe'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Footer Bottom */}
        <div className="border-t border-black mt-8 pt-8 text-center">
          <p className="text-black">
            {bottom.copyright?.enabled && bottom.copyright.text && (
              <span>{bottom.copyright.text}</span>
            )}
            {bottom.privacyPolicy?.enabled && bottom.privacyPolicy.url && (
              <>
                {bottom.copyright?.enabled && <span> | </span>}
                <Link href={bottom.privacyPolicy.url} className="text-black hover:text-gray-600 transition-colors">
                  {bottom.privacyPolicy.label || 'Privacy Policy'}
                </Link>
              </>
            )}
            {bottom.termsOfService?.enabled && bottom.termsOfService.url && (
              <>
                {(bottom.copyright?.enabled || bottom.privacyPolicy?.enabled) && <span> | </span>}
                <Link href={bottom.termsOfService.url} className="text-black hover:text-gray-600 transition-colors">
                  {bottom.termsOfService.label || 'Terms of Service'}
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </footer>
  )
}
