'use client'

import { WebsiteStatus } from '@/services/websiteStatusService'
import { Wrench, Clock, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface ConstructionPageProps {
  status: WebsiteStatus
}

export default function ConstructionPage({ status }: ConstructionPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* Construction Icon */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-orange-100 rounded-full mb-4">
            <Wrench className="w-12 h-12 text-orange-600" />
          </div>
        </div>

        {/* Main Message */}
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          Under Construction
        </h1>
        
        <p className="text-xl text-gray-600 mb-8 leading-relaxed">
          {status.message || 'We are currently working on improving our website. Please check back soon!'}
        </p>

        {/* Construction Image */}
        {status.imageUrl && (
          <div className="mb-8">
            <img 
              src={status.imageUrl} 
              alt="Under Construction" 
              className="max-w-full h-auto rounded-lg shadow-lg mx-auto"
            />
          </div>
        )}

        {/* Status Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-center space-x-2 text-gray-600 mb-4">
            <Clock className="w-5 h-5" />
            <span className="font-medium">Expected Completion</span>
          </div>
          <p className="text-sm text-gray-500">
            We're working hard to bring you an improved experience. Thank you for your patience!
          </p>
        </div>

        {/* Contact Info */}
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            Need immediate assistance? Contact us at:
          </p>
          <div className="space-y-2">
            <p className="text-lg font-semibold text-gray-900">
              📧 info@jewelry-shop.com
            </p>
            <p className="text-lg font-semibold text-gray-900">
              📞 +41 123 456 789
            </p>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-8">
          <Link 
            href="/"
            className="inline-flex items-center px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors duration-200"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
