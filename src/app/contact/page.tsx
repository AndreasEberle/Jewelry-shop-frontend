'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { useBackgroundImages } from '@/hooks/useBackgroundImages'
import { MapPin, Phone, Mail, Clock, Send, CheckCircle, MessageCircle, Star } from 'lucide-react'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    inquiryType: 'general'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const { getBackgroundUrlForSection } = useBackgroundImages()
  const navigationBackground = getBackgroundUrlForSection('navigation')
  const contactBackground = getBackgroundUrlForSection('contact')
  const footerBackground = getBackgroundUrlForSection('footer')

  const contactInfo = [
    {
      icon: MapPin,
      title: 'Visit Our Showroom',
      details: ['123 Jewelry Street', 'New York, NY 10001', 'United States'],
      description: 'Come visit our flagship showroom to see our collection in person'
    },
    {
      icon: Phone,
      title: 'Call Us',
      details: ['+1 (555) 123-4567', 'Mon-Fri: 9AM-6PM EST', 'Sat: 10AM-4PM EST'],
      description: 'Speak directly with our jewelry experts'
    },
    {
      icon: Mail,
      title: 'Email Us',
      details: ['info@jewelryshop.com', 'custom@jewelryshop.com', 'support@jewelryshop.com'],
      description: 'Send us your questions and we\'ll respond within 24 hours'
    },
    {
      icon: Clock,
      title: 'Business Hours',
      details: ['Monday - Friday: 9:00 AM - 6:00 PM', 'Saturday: 10:00 AM - 4:00 PM', 'Sunday: Closed'],
      description: 'We\'re here to help during these hours'
    }
  ]

  const inquiryTypes = [
    { value: 'general', label: 'General Inquiry' },
    { value: 'custom', label: 'Custom Jewelry' },
    { value: 'repair', label: 'Jewelry Repair' },
    { value: 'appraisal', label: 'Jewelry Appraisal' },
    { value: 'warranty', label: 'Warranty Claim' },
    { value: 'wholesale', label: 'Wholesale Inquiry' }
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false)
      setIsSubmitted(true)
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        inquiryType: 'general'
      })
    }, 2000)
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header backgroundImage={navigationBackground} />
        <main className="py-20">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Thank You!</h1>
              <p className="text-xl text-gray-600 mb-6">
                Your message has been sent successfully. We'll get back to you within 24 hours.
              </p>
              <button
                onClick={() => setIsSubmitted(false)}
                className="btn btn-primary"
              >
                Send Another Message
              </button>
            </div>
          </div>
        </main>
        <Footer backgroundImage={footerBackground} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header backgroundImage={navigationBackground} />
      
      <main>
        {/* Hero Section */}
        <section 
          className="relative py-20 overflow-hidden"
          style={{
            backgroundImage: contactBackground ? `url(${contactBackground})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          {/* Overlay */}
          {contactBackground && (
            <div className="absolute inset-0 bg-black bg-opacity-40"></div>
          )}
          
          {/* Fallback gradient */}
          {!contactBackground && (
            <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-secondary-50"></div>
          )}
          
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                Get in
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600">
                  {' '}Touch
                </span>
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                We'd love to hear from you. Whether you have questions about our jewelry, 
                need help with a custom piece, or want to schedule a consultation, we're here to help.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Info Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Contact Information</h2>
              <p className="text-xl text-gray-600">
                Choose the best way to reach us based on your needs
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {contactInfo.map((info, index) => (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                    <info.icon className="w-8 h-8 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{info.title}</h3>
                  <div className="space-y-1 mb-3">
                    {info.details.map((detail, detailIndex) => (
                      <p key={detailIndex} className="text-gray-600">{detail}</p>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500">{info.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Form Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Contact Form */}
              <div className="bg-white rounded-lg shadow-lg p-8">
                <div className="flex items-center mb-6">
                  <MessageCircle className="w-8 h-8 text-primary-600 mr-3" />
                  <h2 className="text-2xl font-bold text-gray-900">Send us a Message</h2>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Your full name"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="your.email@example.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    <div>
                      <label htmlFor="inquiryType" className="block text-sm font-medium text-gray-700 mb-2">
                        Inquiry Type
                      </label>
                      <select
                        id="inquiryType"
                        name="inquiryType"
                        value={formData.inquiryType}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        {inquiryTypes.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                      Subject *
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="What's this about?"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                      Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows={6}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Tell us more about your inquiry..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full btn btn-primary flex items-center justify-center"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Map and Additional Info */}
              <div className="space-y-8">
                {/* Map */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div className="h-64 bg-gray-200 flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">Interactive Map</p>
                      <p className="text-sm text-gray-500">123 Jewelry Street, New York, NY 10001</p>
                    </div>
                  </div>
                </div>

                {/* FAQ */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Frequently Asked Questions</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">How long does custom jewelry take?</h4>
                      <p className="text-sm text-gray-600">Custom pieces typically take 4-6 weeks from design approval to completion.</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Do you offer jewelry repair?</h4>
                      <p className="text-sm text-gray-600">Yes, we provide professional jewelry repair services for all types of pieces.</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">What is your return policy?</h4>
                      <p className="text-sm text-gray-600">We offer a 30-day return policy for all non-custom jewelry items.</p>
                    </div>
                  </div>
                </div>

                {/* Testimonial */}
                <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-lg p-6 text-white">
                  <div className="flex items-center mb-4">
                    <Star className="w-5 h-5 fill-current mr-1" />
                    <Star className="w-5 h-5 fill-current mr-1" />
                    <Star className="w-5 h-5 fill-current mr-1" />
                    <Star className="w-5 h-5 fill-current mr-1" />
                    <Star className="w-5 h-5 fill-current" />
                  </div>
                  <blockquote className="text-lg mb-4">
                    "The team at JewelryShop created the most beautiful custom engagement ring. 
                    Their attention to detail and customer service exceeded all expectations."
                  </blockquote>
                  <cite className="text-sm opacity-90">- Sarah M., New York</cite>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer backgroundImage={footerBackground} />
    </div>
  )
}
