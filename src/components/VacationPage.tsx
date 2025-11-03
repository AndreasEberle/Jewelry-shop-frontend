'use client'

import { WebsiteStatus } from '@/services/websiteStatusService'
import { Plane, Calendar, ArrowLeft, Mail, Phone } from 'lucide-react'
import Link from 'next/link'

interface VacationPageProps {
  status: WebsiteStatus
}

export default function VacationPage({ status }: VacationPageProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  const getReturnDate = () => {
    if (status.endDate) {
      return formatDate(status.endDate)
    }
    return 'soon'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* Vacation Icon */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-100 rounded-full mb-4">
            <Plane className="w-12 h-12 text-blue-600" />
          </div>
        </div>

        {/* Main Message */}
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          We're on Vacation!
        </h1>
        
        <p className="text-xl text-gray-600 mb-8 leading-relaxed">
          {status.message || 'We are currently on vacation and will be back soon!'}
        </p>

        {/* Vacation Image */}
        {status.imageUrl && (
          <div className="mb-8">
            <img 
              src={status.imageUrl} 
              alt="On Vacation" 
              className="max-w-full h-auto rounded-lg shadow-lg mx-auto"
            />
          </div>
        )}

        {/* Return Date Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-center space-x-2 text-gray-600 mb-4">
            <Calendar className="w-5 h-5" />
            <span className="font-medium">We'll be back</span>
          </div>
          <p className="text-2xl font-bold text-blue-600 mb-2">
            {getReturnDate()}
          </p>
          {status.startDate && status.endDate && (
            <p className="text-sm text-gray-500">
              Vacation period: {formatDate(status.startDate)} - {formatDate(status.endDate)}
            </p>
          )}
        </div>

        {/* Contact Info */}
        <div className="text-center mb-8">
          <p className="text-gray-600 mb-4">
            Need to reach us during our vacation?
          </p>
          <div className="space-y-3">
            <div className="flex items-center justify-center space-x-2">
              <Mail className="w-5 h-5 text-gray-500" />
              <span className="text-lg font-semibold text-gray-900">
                info@jewelry-shop.com
              </span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <Phone className="w-5 h-5 text-gray-500" />
              <span className="text-lg font-semibold text-gray-900">
                +41 123 456 789
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              We'll respond to urgent inquiries within 24 hours
            </p>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-8">
          <Link 
            href="/"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}



