'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import api from '@/services/api'

interface AskQuestionModalProps {
  isOpen: boolean
  onClose: () => void
  productId: string
  productName: string
}

export function AskQuestionModal({ isOpen, onClose, productId, productName }: AskQuestionModalProps) {
  const [question, setQuestion] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim()) {
      alert('Please enter your question')
      return
    }

    setSubmitting(true)
    try {
      // TODO: Implement question submission endpoint
      // For now, just show an alert
      alert('Question submission feature coming soon!')
      setQuestion('')
      onClose()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to submit question')
    } finally {
      setSubmitting(false)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Ask a Question</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Your Question <span className="text-red-500">*</span>
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ask a question about this product"
              rows={6}
              required
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting || !question.trim()}
              className="flex-1 bg-black text-white py-3 px-6 rounded-md font-medium hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Submitting...' : 'Submit Question'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-md font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

