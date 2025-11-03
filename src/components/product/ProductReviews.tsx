'use client'

import { useState, useEffect } from 'react'
import { Star, Search, Check } from 'lucide-react'
import { reviewService, ProductReview, ProductReviewStats } from '@/services/reviewService'
import { ReviewModal } from './ReviewModal'
import { AskQuestionModal } from './AskQuestionModal'

interface ProductReviewsProps {
  productId: string
  productName: string
}

const REVIEW_FILTERS = [
  'size', 'fit', 'length', 'issues', 'color', 'quality', 'weight', 'lines', 'look', 'feel',
  'shape', 'experience', 'style', 'design', 'value', 'works', 'packaging', 'clasp', 'skin',
  'shipping', 'piece', 'service', 'wear', 'pair', 'price', 'studs', 'earrings', 'backing', 'ears', 'staple'
]

export function ProductReviews({ productId, productName }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<ProductReview[]>([])
  const [stats, setStats] = useState<ProductReviewStats | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false)
  const [sortBy, setSortBy] = useState<'rating' | 'date'>('rating')

  useEffect(() => {
    loadReviews()
    loadStats()
  }, [productId, currentPage, sortBy])

  const loadReviews = async () => {
    try {
      setLoading(true)
      const response = await reviewService.getProductReviewsPaginated(productId, currentPage, 10)
      setReviews(response.content)
      setTotalPages(response.totalPages)
    } catch (error) {
      console.error('Failed to load reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const statsData = await reviewService.getProductReviewStats(productId)
      setStats(statsData)
    } catch (error) {
      console.error('Failed to load review stats:', error)
    }
  }

  const handleReviewSubmitted = () => {
    loadReviews()
    loadStats()
  }

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-[18px] h-[18px]'
    }
    return (
      <div className="flex gap-x-[6px]" aria-label={`Rating: ${rating} out of 5 stars`} role="img">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= rating
                ? 'fill-current text-current'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  // Helper function to highlight matching text
  const highlightText = (text: string, query: string) => {
    if (!query) return text
    // Escape special regex characters
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(`(${escapedQuery})`, 'gi')
    const parts = text.split(regex)
    return parts.map((part, index) => {
      // Check if this part matches the query (case-insensitive)
      if (part.toLowerCase() === query.toLowerCase()) {
        return <mark key={index} className="bg-yellow-200 px-1">{part}</mark>
      }
      return <span key={index}>{part}</span>
    })
  }

  const filteredReviews = reviews.filter(review => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return review.title.toLowerCase().includes(query) || review.content.toLowerCase().includes(query)
    }
    if (selectedFilter) {
      // Filter by selected filter tag (if backend supports it)
      return true // For now, just return true - backend filtering can be added later
    }
    return true
  })

  return (
    <div id="reviews" className="px-4 sm:px-6 lg:px-16 py-12 sm:py-16 lg:py-20 text-center">
      <div className="flex flex-col gap-4 md:gap-0 md:flex-row justify-between items-start md:items-center mb-8">
        <div className="text-left">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Customer reviews</h2>
          {stats && (
            <div className="flex items-center gap-2">
              {renderStars(Math.round(stats.averageRating * 10) / 10, 'lg')}
              <p className="text-sm font-bold">{stats.averageRating.toFixed(1)}</p>
            </div>
          )}
        </div>
        <div className="flex flex-col md:flex-row md:w-fit w-full gap-y-4 md:gap-y-0 md:gap-x-4 justify-center">
          <button
            onClick={() => setIsReviewModalOpen(true)}
            className="relative inline-block uppercase px-6 text-center outline-none border border-gray-300 hover:bg-gray-50 disabled:border-gray-200 disabled:bg-transparent py-2 text-sm font-normal"
          >
            Write A Review
          </button>
          <button
            onClick={() => setIsQuestionModalOpen(true)}
            className="relative inline-block uppercase px-6 text-center outline-none border border-gray-300 hover:bg-gray-50 disabled:border-gray-200 disabled:bg-transparent py-2 text-sm font-normal"
          >
            Ask a question
          </button>
        </div>
      </div>

      <div role="tablist" className="border-b flex justify-start gap-x-8 items-center mb-6">
        <button role="tab" className="pb-2 mb-[-1px] border-b-2 border-black">
          <p className="text-sm">Reviews ({stats?.totalReviews || 0})</p>
        </button>
      </div>

      {/* Search and Filter */}
      <div className="relative text-left py-4 flex lg:flex-row flex-col justify-between gap-x-4 gap-y-4 lg:gap-y-0 items-center lg:border-b border-gray-200 mb-6">
        <div className="w-full lg:w-[16rem] relative">
          <input
            id="search-reviews"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Reviews"
            className="w-full px-4 pl-10 py-2 border-b border-gray-300 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-none"
          />
          <Search className="absolute left-0 bottom-3 w-5 h-5 text-gray-400" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-0 bottom-3 px-2 text-xs underline"
            >
              Clear
            </button>
          )}
        </div>

        {reviews.length > 0 && (
          <div className="w-full lg:w-[30rem] xl:w-[40rem]">
            <div className="block lg:flex items-center">
              <p className="text-sm font-bold mb-2 lg:mb-0">Filter:</p>
              <fieldset className="min-w-0 lg:ml-2 flex gap-x-4 overflow-x-auto overflow-y-hidden pb-2">
                <legend className="sr-only">Filter:</legend>
                {REVIEW_FILTERS.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setSelectedFilter(selectedFilter === filter ? null : filter)}
                    className={`px-4 py-2 h-[40px] text-sm inline-flex bg-gray-50 font-normal capitalize border-transparent ${
                      selectedFilter === filter ? 'bg-gray-200' : ''
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </fieldset>
            </div>
          </div>
        )}

        <div className="border-b flex justify-start lg:justify-end font-medium w-full lg:w-auto min-w-[188px]">
          <button
            type="button"
            className="inline-flex items-center justify-between gap-2 outline-none focus:ring-2 focus:ring-blue-500 py-2 uppercase text-sm"
            onClick={() => setSortBy(sortBy === 'rating' ? 'date' : 'rating')}
          >
            <span>Sort: {sortBy === 'rating' ? 'Highest Rating' : 'Newest First'}</span>
            <span>▼</span>
          </button>
        </div>
      </div>

      {/* Reviews List */}
      <div>
        {loading ? (
          <p>Loading reviews...</p>
        ) : filteredReviews.length === 0 ? (
          <p className="text-gray-500 py-8">No reviews yet. Be the first to review this product!</p>
        ) : (
          filteredReviews.map((review) => (
            <div
              key={review.id}
              className="border-b relative md:items-start md:justify-between flex flex-col md:flex-row py-4 md:py-8 text-left"
            >
              <div className="pr-2 flex-none">
                <div className="flex gap-4 mb-2">
                  <p className="text-sm flex-1">{review.userName?.split(' ')[0]} {review.userName?.split(' ')[1]?.[0]}.</p>
                  <p className="text-xs flex-none md:absolute right-0 top-8 text-gray-500">
                    {new Date(review.createdAt).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                  </p>
                </div>
                {review.isVerifiedPurchase && (
                  <div className="flex items-center mb-2">
                    <Check className="w-3 h-3 text-green-600 mr-1" />
                    <p className="text-xs text-gray-500">Verified buyer</p>
                  </div>
                )}
                <div className="mt-2 mb-4 md:hidden">
                  {renderStars(review.rating, 'lg')}
                </div>
              </div>
              <div className="md:basis-[65%] md:max-w-[65%]">
                <div className="mb-2 hidden md:flex">
                  {renderStars(review.rating, 'lg')}
                </div>
                <div className="text-sm mb-1 font-bold">
                  <p>{searchQuery ? highlightText(review.title, searchQuery) : review.title}</p>
                </div>
                <div className="text-sm">
                  <p>{searchQuery ? highlightText(review.content, searchQuery) : review.content}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <ul className="flex gap-x-2 text-center justify-center items-center mt-6 text-sm" role="navigation" aria-label="Pagination">
          <li className={currentPage === 0 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}>
            <button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="p-2"
              aria-label="Previous page"
            >
              ‹
            </button>
          </li>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            const pageNum = currentPage < 3 ? i : currentPage - 2 + i
            if (pageNum >= totalPages) return null
            return (
              <li
                key={pageNum}
                className={`border-b min-w-[2rem] border-transparent cursor-pointer ${
                  pageNum === currentPage ? '!border-black' : ''
                }`}
              >
                <button
                  onClick={() => setCurrentPage(pageNum)}
                  className={pageNum === currentPage ? 'font-bold' : ''}
                  aria-label={`Page ${pageNum + 1}`}
                >
                  {pageNum + 1}
                </button>
              </li>
            )
          })}
          <li className={currentPage >= totalPages - 1 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage >= totalPages - 1}
              className="p-2"
              aria-label="Next page"
            >
              ›
            </button>
          </li>
        </ul>
      )}

      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        productId={productId}
        productName={productName}
        onReviewSubmitted={handleReviewSubmitted}
      />

      <AskQuestionModal
        isOpen={isQuestionModalOpen}
        onClose={() => setIsQuestionModalOpen(false)}
        productId={productId}
        productName={productName}
      />
    </div>
  )
}

