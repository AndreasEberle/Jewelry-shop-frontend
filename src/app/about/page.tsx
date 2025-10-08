'use client'

import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { useBackgroundImages } from '@/hooks/useBackgroundImages'
import { Award, Users, Heart, Shield, Star, CheckCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function AboutPage() {
  const { getBackgroundUrlForSection } = useBackgroundImages()
  const navigationBackground = getBackgroundUrlForSection('navigation')
  const aboutBackground = getBackgroundUrlForSection('about')
  const footerBackground = getBackgroundUrlForSection('footer')

  const stats = [
    { number: '25+', label: 'Years of Experience', icon: Award },
    { number: '10K+', label: 'Happy Customers', icon: Users },
    { number: '50K+', label: 'Jewelry Pieces Sold', icon: Heart },
    { number: '100%', label: 'Satisfaction Guarantee', icon: Shield }
  ]

  const values = [
    {
      title: 'Craftsmanship Excellence',
      description: 'Every piece is meticulously crafted by master jewelers with decades of experience, ensuring the highest quality and attention to detail.',
      icon: Award
    },
    {
      title: 'Ethical Sourcing',
      description: 'We source our materials responsibly, working only with certified suppliers who share our commitment to ethical practices.',
      icon: Shield
    },
    {
      title: 'Customer First',
      description: 'Your satisfaction is our priority. We provide personalized service and support throughout your jewelry journey.',
      icon: Heart
    },
    {
      title: 'Innovation & Tradition',
      description: 'We blend traditional craftsmanship with modern design, creating timeless pieces that reflect contemporary style.',
      icon: Star
    }
  ]

  const team = [
    {
      name: 'Sarah Johnson',
      role: 'Master Jeweler & Founder',
      image: '/api/placeholder/300/300',
      bio: 'With over 25 years of experience, Sarah founded our company with a vision to create exceptional jewelry that tells a story.',
      specialties: ['Diamond Setting', 'Custom Design', 'Restoration']
    },
    {
      name: 'Michael Chen',
      role: 'Head of Design',
      image: '/api/placeholder/300/300',
      bio: 'Michael brings contemporary flair to traditional jewelry design, creating pieces that are both timeless and modern.',
      specialties: ['Contemporary Design', '3D Modeling', 'Trend Analysis']
    },
    {
      name: 'Emma Rodriguez',
      role: 'Gemologist',
      image: '/api/placeholder/300/300',
      bio: 'Emma ensures every gemstone meets our exacting standards, bringing scientific precision to our selection process.',
      specialties: ['Gemstone Certification', 'Quality Control', 'Appraisal']
    }
  ]

  const certifications = [
    'GIA Certified Gemologist',
    'Responsible Jewelry Council Member',
    'ISO 9001 Quality Management',
    'Conflict-Free Diamond Certification',
    'Fair Trade Gold Certified'
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header backgroundImage={navigationBackground} />
      
      <main>
        {/* Hero Section */}
        <section 
          className="relative py-20 overflow-hidden"
          style={{
            backgroundImage: aboutBackground ? `url(${aboutBackground})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          {/* Overlay */}
          {aboutBackground && (
            <div className="absolute inset-0 bg-black bg-opacity-40"></div>
          )}
          
          {/* Fallback gradient */}
          {!aboutBackground && (
            <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-secondary-50"></div>
          )}
          
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                About
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600">
                  {' '}Our Story
                </span>
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
                For over two decades, we've been crafting exceptional jewelry that celebrates life's most precious moments. 
                Our passion for quality, craftsmanship, and customer satisfaction has made us a trusted name in fine jewelry.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href="/products" 
                  className="btn btn-primary text-lg px-8 py-3 inline-flex items-center"
                >
                  Explore Our Collection
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link 
                  href="/contact" 
                  className="btn btn-outline text-lg px-8 py-3"
                >
                  Get in Touch
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                    <stat.icon className="w-8 h-8 text-primary-600" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">{stat.number}</div>
                  <div className="text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Our Story Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
                <div className="space-y-4 text-gray-600">
                  <p>
                    Founded in 1998 by master jeweler Sarah Johnson, our company began as a small workshop with a simple mission: 
                    to create jewelry that tells a story and celebrates life's most meaningful moments.
                  </p>
                  <p>
                    What started as a passion project has grown into a trusted name in fine jewelry, serving customers worldwide 
                    while maintaining our commitment to exceptional craftsmanship and personalized service.
                  </p>
                  <p>
                    Today, we continue to honor our founder's vision by combining traditional techniques with modern innovation, 
                    ensuring every piece we create meets the highest standards of quality and beauty.
                  </p>
                </div>
              </div>
              <div className="relative">
                <img
                  src="/api/placeholder/600/400"
                  alt="Our workshop"
                  className="rounded-lg shadow-lg"
                />
                <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-lg shadow-lg">
                  <div className="text-2xl font-bold text-primary-600 mb-1">25+</div>
                  <div className="text-gray-600">Years of Excellence</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Values</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                These core principles guide everything we do, from sourcing materials to crafting your perfect piece.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {values.map((value, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                      <value.icon className="w-6 h-6 text-primary-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{value.title}</h3>
                    <p className="text-gray-600">{value.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Meet Our Team</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Our talented team of jewelers, designers, and gemologists work together to bring you exceptional jewelry.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {team.map((member, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-64 object-cover"
                  />
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">{member.name}</h3>
                    <p className="text-primary-600 font-medium mb-3">{member.role}</p>
                    <p className="text-gray-600 mb-4">{member.bio}</p>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Specialties:</h4>
                      <div className="flex flex-wrap gap-2">
                        {member.specialties.map((specialty, specIndex) => (
                          <span
                            key={specIndex}
                            className="px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded-full"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Certifications Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Certifications</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                We're proud to hold industry-leading certifications that ensure the highest standards of quality and ethics.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {certifications.map((cert, index) => (
                <div key={index} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                  <span className="text-gray-900 font-medium">{cert}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-primary-600 to-secondary-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Find Your Perfect Piece?</h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Let our expert team help you discover jewelry that perfectly matches your style and celebrates your special moments.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/products"
                className="inline-flex items-center px-8 py-3 bg-white text-primary-600 rounded-md hover:bg-gray-100 font-medium text-lg transition-colors"
              >
                Browse Collection
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center px-8 py-3 border-2 border-white text-white rounded-md hover:bg-white hover:text-primary-600 font-medium text-lg transition-colors"
              >
                Schedule Consultation
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer backgroundImage={footerBackground} />
    </div>
  )
}
