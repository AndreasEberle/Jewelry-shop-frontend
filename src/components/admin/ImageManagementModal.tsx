'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Upload, Trash2, Star, StarOff, ArrowUp, ArrowDown, Image as ImageIcon } from 'lucide-react'
import { Product } from '@/types'
import { api } from '@/services/api'

interface ImageManagementModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product | null
  onImageUpdated: () => void
}

interface ProductImage {
  id: string
  url: string
  altText?: string
  isPrimary: boolean
  sortOrder?: number
  width?: number
  height?: number
  mimeType?: string
  createdAt: string
}

export function ImageManagementModal({ isOpen, onClose, product, onImageUpdated }: ImageManagementModalProps) {
  const [images, setImages] = useState<ProductImage[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [lastActionTime, setLastActionTime] = useState(0)
  const [isDebounced, setIsDebounced] = useState(false)
  const [pendingOperations, setPendingOperations] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && product) {
      loadImages()
    }
  }, [isOpen, product])


  // Click outside to close
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node) && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  const loadImages = async () => {
    if (!product) return
    
    try {
      setLoading(true)
      const response = await api.get(`/api/admin/products/${product.id}/images`)
      // Backend already sorts by isPrimary DESC, sortOrder ASC
      setImages(response.data || [])
    } catch (err) {
      setError('Failed to load images')
      console.error('Error loading images:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || !product) return

    setUploading(true)
    setError(null)

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const formData = new FormData()
        formData.append('file', file)
        formData.append('altText', file.name.split('.')[0]) // Use filename as alt text
        formData.append('isPrimary', 'false') // New images are not primary by default
        formData.append('sortOrder', (images.length + i + 1).toString()) // Set sort order based on current image count

        await api.post(`/api/admin/upload-product-image/${product.id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
      }

      setSuccess(`Successfully uploaded ${files.length} image(s)`)
      loadImages() // Reload images
      onImageUpdated() // Notify parent component
    } catch (err) {
      setError('Failed to upload images')
      console.error('Error uploading images:', err)
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteImage = async (imageId: string) => {
    if (!product) return

    try {
      setLoading(true)
      await api.delete(`/api/admin/products/${product.id}/images/${imageId}`)
      setSuccess('Image deleted successfully')
      loadImages() // Reload images
      onImageUpdated() // Notify parent component
    } catch (err) {
      setError('Failed to delete image')
      console.error('Error deleting image:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSetFeatured = async (imageId: string) => {
    if (!product || isUpdating) return

    // Debounce: prevent rapid clicking (minimum 2 seconds between actions)
    const now = Date.now()
    if (now - lastActionTime < 2000) {
      setIsDebounced(true)
      setSuccess('Please wait a moment before trying again...')
      setError(null)
      // Clear debounce state after showing message
      setTimeout(() => setIsDebounced(false), 2000)
      return
    }
    setLastActionTime(now)
    setIsDebounced(false)

    // Find the image to check if it's already featured
    const image = images.find(img => img.id === imageId)
    if (image && image.isPrimary) {
      // Don't make any API calls - just show a friendly message
      setSuccess('This image is already featured!')
      // Clear any previous errors
      setError(null)
      return
    }

    try {
      setIsUpdating(true)
      setLoading(true)
      console.log('Setting image as featured:', imageId)
      await api.put(`/api/admin/products/${product.id}/images/${imageId}/featured`)
      setSuccess('Featured image updated')
      
      // Add 1-second delay before reloading to prevent UI conflicts
      setTimeout(async () => {
        await loadImages() // Reload images
        onImageUpdated() // Notify parent component
        setIsUpdating(false)
      }, 1000)
    } catch (err: any) {
      const errorMessage = err.response?.data || 'Failed to set featured image'
      setError(errorMessage)
      console.error('Error setting featured image:', err)
      setIsUpdating(false)
    } finally {
      setLoading(false)
    }
  }

  const handleMoveImage = async (imageId: string, direction: 'up' | 'down') => {
    if (!product || isUpdating || pendingOperations > 0) return

    // Debounce: prevent rapid clicking (minimum 2 seconds between actions)
    const now = Date.now()
    if (now - lastActionTime < 2000) {
      setIsDebounced(true)
      setSuccess('Please wait a moment before trying again...')
      setError(null)
      // Clear debounce state after showing message
      setTimeout(() => setIsDebounced(false), 2000)
      return
    }
    setLastActionTime(now)
    setIsDebounced(false)

    // Find the current image and its position
    const currentIndex = images.findIndex(img => img.id === imageId)
    if (currentIndex === -1) return

    const currentImage = images[currentIndex]

    // Special validation: featured image cannot move up (must stay at top)
    if (currentImage.isPrimary && direction === 'up') {
      setSuccess('Featured image must stay at the top!')
      setError(null)
      return
    }

    // Validate move direction based on current position
    if (direction === 'up' && currentIndex === 0) {
      setSuccess('Already at the top!')
      setError(null)
      return
    }
    if (direction === 'down' && currentIndex === images.length - 1) {
      setSuccess('Already at the bottom!')
      setError(null)
      return
    }

    try {
      setIsUpdating(true)
      setLoading(true)
      setPendingOperations(prev => prev + 1)
      console.log('Moving image:', imageId, 'direction:', direction)
      const response = await api.put(`/api/admin/products/${product.id}/images/${imageId}/move`, {
        direction
      })
      console.log('Move response:', response.data)
      setSuccess('Image order updated')
      
      // Add 1-second delay before reloading to prevent UI conflicts
      setTimeout(async () => {
        await loadImages() // Reload images
        onImageUpdated() // Notify parent component
        setIsUpdating(false)
      }, 1000)
    } catch (err: any) {
      const errorMessage = err.response?.data || 'Failed to move image'
      setError(errorMessage)
      console.error('Error moving image:', err)
      setIsUpdating(false)
    } finally {
      setLoading(false)
      setPendingOperations(prev => Math.max(0, prev - 1))
    }
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    // Add a slight delay to allow the drag image to be set
    setTimeout(() => {
      if (e.dataTransfer) {
        e.dataTransfer.setDragImage(e.target as Element, 0, 0)
      }
    }, 0)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    setDragOverIndex(null)
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      return
    }

    // Debounce: prevent rapid drag & drop operations
    const now = Date.now()
    if (now - lastActionTime < 2000) {
      setIsDebounced(true)
      setSuccess('Please wait a moment before trying again...')
      setError(null)
      setDraggedIndex(null)
      setTimeout(() => setIsDebounced(false), 2000)
      return
    }
    setLastActionTime(now)
    setIsDebounced(false)

    // Prevent dropping on featured image if dragging a non-featured image
    if (dropIndex === 0 && !images[draggedIndex].isPrimary) {
      setError('Cannot place image above the featured image')
      setDraggedIndex(null)
      return
    }

    try {
      setIsUpdating(true)
      setLoading(true)
      setPendingOperations(prev => prev + 1)
      
      // Create new order array
      const newOrder = [...images]
      const [draggedItem] = newOrder.splice(draggedIndex, 1)
      newOrder.splice(dropIndex, 0, draggedItem)
      
      // Send new order to backend
      await api.put(`/api/admin/products/${product.id}/images/reorder`, {
        imageIds: newOrder.map(img => img.id)
      })
      
      setSuccess('Image order updated')
      
      // Add 1-second delay before reloading
      setTimeout(async () => {
        await loadImages()
        onImageUpdated()
        setIsUpdating(false)
      }, 1000)
      
    } catch (err: any) {
      const errorMessage = err.response?.data || 'Failed to reorder images'
      setError(errorMessage)
      console.error('Error reordering images:', err)
      setIsUpdating(false)
    } finally {
      setDraggedIndex(null)
      setLoading(false)
      setPendingOperations(prev => Math.max(0, prev - 1))
    }
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  if (!isOpen || !product) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
      <div ref={modalRef} className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Manage Images - {product.name}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Upload Section */}
          <div className="mb-6 p-4 border-2 border-dashed border-gray-300 rounded-lg">
            <div className="text-center">
              <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Upload new images for this product</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 flex items-center mx-auto"
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? 'Uploading...' : 'Choose Images'}
              </button>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
              {success}
            </div>
          )}

          {/* Images Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {loading ? (
              <div className="col-span-full text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading images...</p>
              </div>
            ) : isUpdating ? (
              <div className="col-span-full text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto"></div>
                <p className="mt-2 text-gray-600">Updating image order...</p>
              </div>
            ) : isDebounced ? (
              <div className="col-span-full text-center py-8">
                <div className="animate-pulse rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                <p className="mt-2 text-orange-600">Please wait before trying again...</p>
              </div>
            ) : images.length === 0 ? (
              <div className="col-span-full text-center py-8 text-gray-500">
                <ImageIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No images found for this product</p>
              </div>
            ) : (
              images.map((image, index) => (
                <div
                  key={image.id}
                  draggable={!image.isPrimary} // Only non-featured images can be dragged
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`relative group bg-gray-100 rounded-lg overflow-hidden transition-all duration-200 ${
                    draggedIndex === index ? 'opacity-50 scale-95' : ''
                  } ${image.isPrimary ? 'ring-2 ring-yellow-400' : ''} ${
                    dragOverIndex === index && draggedIndex !== index ? 'ring-2 ring-blue-400 bg-blue-50' : ''
                  } ${image.isPrimary ? 'cursor-default' : 'cursor-move'}`}
                >
                  {/* Drop Indicator */}
                  {dragOverIndex === index && draggedIndex !== index && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center">
                      <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                        Drop here
                      </div>
                    </div>
                  )}
                  
                  {/* Image */}
                  <div className="aspect-square">
                    <img
                      src={image.url}
                      alt={image.altText || product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Featured Badge */}
                  {image.isPrimary && (
                    <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                      <Star className="w-3 h-3 inline mr-1" />
                      Featured
                    </div>
                  )}
                  
                  {/* Drag Disabled Indicator for Featured */}
                  {image.isPrimary && (
                    <div className="absolute top-2 right-2 bg-gray-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                      Fixed
                    </div>
                  )}

                  {/* Actions Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
                      {/* Set as Featured */}
                      <button
                        onClick={() => handleSetFeatured(image.id)}
                        disabled={loading || isUpdating || image.isPrimary}
                        className="p-2 bg-yellow-500 text-white rounded-full hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={image.isPrimary ? 'Already featured' : 'Set as featured'}
                      >
                        {image.isPrimary ? <Star className="w-4 h-4" /> : <StarOff className="w-4 h-4" />}
                      </button>

                      {/* Move Up */}
                      <button
                        onClick={() => handleMoveImage(image.id, 'up')}
                        disabled={loading || isUpdating || pendingOperations > 0 || index === 0 || image.isPrimary}
                        className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={image.isPrimary ? 'Featured image must stay at top' : index === 0 ? 'Already at top' : pendingOperations > 0 ? 'Operation in progress...' : 'Move up'}
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>

                      {/* Move Down */}
                      <button
                        onClick={() => handleMoveImage(image.id, 'down')}
                        disabled={loading || isUpdating || pendingOperations > 0 || index === images.length - 1}
                        className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={index === images.length - 1 ? 'Already at bottom' : pendingOperations > 0 ? 'Operation in progress...' : 'Move down'}
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteImage(image.id)}
                        disabled={loading || isUpdating}
                        className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:opacity-50"
                        title="Delete image"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Image Info */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-2">
                    <p className="truncate">{image.altText || 'No description'}</p>
                    <p className="text-gray-300">
                      {image.width && image.height ? `${image.width}x${image.height}` : 'Unknown size'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
