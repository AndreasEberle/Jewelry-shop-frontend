'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { X, Upload, Image as ImageIcon, Plus, Trash2, AlertCircle, Check } from 'lucide-react'
import { Product, CreateProductRequest } from '@/types'
import { productService } from '@/services/productService'
import { tagService, Tag } from '@/services/tagService'
import { api } from '@/services/api'

interface AddProductModalProps {
  isOpen: boolean
  onClose: () => void
  onProductAdded: (product: Product) => void
}

interface ProductFormData {
  name: string
  description: string
  price: string
  sku: string
  category: string
  tags: string[]
  quantity: string
  weightGrams: string
  specialOffer: boolean
  specialOfferPrice: string
  specialOfferDescription: string
  active: boolean
}

interface UploadedImage {
  id: string
  file: File
  preview: string
  altText: string
  isPrimary: boolean
}

export function AddProductModal({ isOpen, onClose, onProductAdded }: AddProductModalProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: '',
    sku: '',
    category: '',
    tags: [],
    quantity: '1',
    weightGrams: '',
    specialOffer: false,
    specialOfferPrice: '',
    specialOfferDescription: '',
    active: true
  })

  const [images, setImages] = useState<UploadedImage[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [newTag, setNewTag] = useState('')
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [tagSearchQuery, setTagSearchQuery] = useState('')
  const [showTagSuggestions, setShowTagSuggestions] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  const categories = [
    'Rings', 'Necklaces', 'Earrings', 'Bracelets', 'Watches', 
    'Pendants', 'Chains', 'Bangles', 'Brooches', 'Cufflinks'
  ]

  // Load available tags on component mount
  useEffect(() => {
    const loadTags = async () => {
      try {
        const tags = await tagService.getAllTags()
        setAvailableTags(tags)
      } catch (error) {
        console.error('Failed to load tags:', error)
      }
    }
    loadTags()
  }, [])

  // Auto-generate SKU when name changes
  useEffect(() => {
    const generateSku = async () => {
      if (formData.name.trim().length > 0) {
        try {
          const sku = await productService.generateSku(formData.name)
          setFormData(prev => ({ ...prev, sku }))
        } catch (error) {
          console.error('Failed to generate SKU:', error)
        }
      }
    }

    const timeoutId = setTimeout(generateSku, 500) // Debounce SKU generation
    return () => clearTimeout(timeoutId)
  }, [formData.name])

  // Search tags when query changes
  useEffect(() => {
    const searchTags = async () => {
      if (tagSearchQuery.trim().length > 0) {
        try {
          const tags = await tagService.searchTags(tagSearchQuery)
          setAvailableTags(tags)
        } catch (error) {
          console.error('Failed to search tags:', error)
        }
      } else {
        // Load all tags when query is empty
        try {
          const tags = await tagService.getAllTags()
          setAvailableTags(tags)
        } catch (error) {
          console.error('Failed to load tags:', error)
        }
      }
    }

    const timeoutId = setTimeout(searchTags, 300) // Debounce search
    return () => clearTimeout(timeoutId)
  }, [tagSearchQuery])

  // Handle ESC key and outside click
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    const handleOutsideClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node) && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.addEventListener('mousedown', handleOutsideClick)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('mousedown', handleOutsideClick)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  const handleInputChange = (field: keyof ProductFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleAddTag = async () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      // Check if tag already exists in available tags
      const existingTag = availableTags.find(tag => tag.name.toLowerCase() === newTag.trim().toLowerCase())
      
      if (existingTag) {
        // Add existing tag
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, existingTag.name]
        }))
      } else {
        // Create new tag
        try {
          const createdTag = await tagService.createTag({ name: newTag.trim() })
          setFormData(prev => ({
            ...prev,
            tags: [...prev.tags, createdTag.name]
          }))
          // Add to available tags
          setAvailableTags(prev => [...prev, createdTag])
        } catch (error) {
          console.error('Failed to create tag:', error)
          // Fallback: add as string without creating in DB
          setFormData(prev => ({
            ...prev,
            tags: [...prev.tags, newTag.trim()]
          }))
        }
      }
      setNewTag('')
      setShowTagSuggestions(false)
    }
  }

  const handleSelectTag = (tag: Tag) => {
    if (!formData.tags.includes(tag.name)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag.name]
      }))
    }
    setTagSearchQuery('')
    setShowTagSuggestions(false)
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) }))
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files))
    }
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files))
    }
  }

  const handleFiles = (files: File[]) => {
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
      const maxSize = 50 * 1024 * 1024 // 50MB
      
      if (!validTypes.includes(file.type)) {
        setError(`Invalid file type: ${file.name}. Only JPG, PNG, WEBP, and GIF are allowed.`)
        return false
      }
      
      if (file.size > maxSize) {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1)
        setError(`File too large: ${file.name} (${fileSizeMB}MB). Maximum size is 50MB.`)
        return false
      }
      
      return true
    })

    const newImages: UploadedImage[] = validFiles.map((file, index) => ({
      id: `temp-${Date.now()}-${index}`,
      file,
      preview: URL.createObjectURL(file),
      altText: `${formData.name || 'Product'} - Image ${images.length + index + 1}`,
      isPrimary: images.length === 0 && index === 0
    }))

    setImages(prev => [...prev, ...newImages])
  }

  const removeImage = (imageId: string) => {
    setImages(prev => {
      const filtered = prev.filter(img => img.id !== imageId)
      // If we removed the primary image, make the first remaining one primary
      if (filtered.length > 0 && !filtered.some(img => img.isPrimary)) {
        filtered[0].isPrimary = true
      }
      return filtered
    })
  }

  const setPrimaryImage = (imageId: string) => {
    setImages(prev => 
      prev.map(img => ({ ...img, isPrimary: img.id === imageId }))
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setUploading(true)

    // Validation
    if (formData.tags.length === 0) {
      setError('At least one tag is required')
      setUploading(false)
      return
    }

    if (images.length === 0) {
      setError('At least one image is required')
      setUploading(false)
      return
    }

    try {
      // Create product first
      const productData: CreateProductRequest = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        sku: formData.sku,
        categories: formData.category ? [formData.category] : [],
        tags: formData.tags,
        quantity: parseInt(formData.quantity),
        weightGrams: formData.weightGrams ? parseFloat(formData.weightGrams) : undefined,
        specialOffer: formData.specialOffer,
        specialOfferPrice: formData.specialOffer ? parseFloat(formData.specialOfferPrice) : undefined,
        specialOfferDescription: formData.specialOfferDescription,
        active: formData.active
      }

      // Create product using the service
      const product = await productService.createProduct(productData)
      console.log('Product created successfully:', product)

      // Upload images if any
      if (images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          const image = images[i]
          const formData = new FormData()
          formData.append('file', image.file)
          formData.append('altText', image.altText)
          formData.append('isPrimary', image.isPrimary.toString())

          const imageResponse = await api.post(`/api/admin/upload-product-image/${product.id}`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          })

          if (!imageResponse.data.success) {
            console.error(`Failed to upload image ${i + 1}:`, imageResponse.data.message)
            setError(`Failed to upload image ${i + 1}: ${imageResponse.data.message}`)
            setUploading(false)
            return
          }
        }
      }

      setSuccess('Product created successfully!')
      onProductAdded(product)
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        price: '',
        sku: '',
        category: '',
        tags: [],
        quantity: '1',
        weightGrams: '',
        specialOffer: false,
        specialOfferPrice: '',
        specialOfferDescription: '',
        active: true
      })
      setImages([])
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose()
      }, 1500)

    } catch (err) {
      console.error('Error creating product:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError('Failed to create product: ' + errorMessage)
    } finally {
      setUploading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div ref={modalRef} className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Add New Product</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., Classic Gold Ring"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SKU *
                </label>
                <input
                  type="text"
                  required
                  value={formData.sku}
                  onChange={(e) => handleInputChange('sku', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., RING-GOLD-001"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., 10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weight (grams)
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={formData.weightGrams}
                  onChange={(e) => handleInputChange('weightGrams', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., 5.5"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                required
                rows={3}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Describe your product..."
              />
            </div>

            {/* Price and Special Offer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (CHF) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="99.99"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Special Offer */}
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="specialOffer"
                  checked={formData.specialOffer}
                  onChange={(e) => handleInputChange('specialOffer', e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="specialOffer" className="ml-2 text-sm font-medium text-gray-700">
                  This product has a special offer
                </label>
              </div>

              {formData.specialOffer && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Special Offer Price (CHF)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.specialOfferPrice}
                      onChange={(e) => handleInputChange('specialOfferPrice', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="79.99"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Special Offer Description
                    </label>
                    <input
                      type="text"
                      value={formData.specialOfferDescription}
                      onChange={(e) => handleInputChange('specialOfferDescription', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="e.g., Limited Time Offer"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-2 text-primary-600 hover:text-primary-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="relative">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => {
                      setNewTag(e.target.value)
                      setTagSearchQuery(e.target.value)
                      setShowTagSuggestions(true)
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    onFocus={() => setShowTagSuggestions(true)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Type to search existing tags or create new ones"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Tag Suggestions Dropdown */}
                {showTagSuggestions && availableTags.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                    {availableTags
                      .filter(tag => !formData.tags.includes(tag.name))
                      .map(tag => (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => handleSelectTag(tag)}
                          className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                        >
                          {tag.name}
                        </button>
                      ))}
                  </div>
                )}
              </div>
              {formData.tags.length === 0 && (
                <p className="text-sm text-red-500 mt-1">At least one tag is required</p>
              )}
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Images <span className="text-red-500">*</span>
              </label>
              
              {/* Upload Area */}
              <div
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive 
                    ? 'border-primary-500 bg-primary-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileInput}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                
                <div className="space-y-4">
                  <div className="mx-auto w-12 h-12 text-gray-400">
                    <Upload className="w-full h-full" />
                  </div>
                  
                  <div>
                    <p className="text-lg font-medium text-gray-900">
                      Drop images here or click to upload
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      WebP, JPG, PNG, GIF up to 10MB each
                    </p>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn btn-primary"
                  >
                    Choose Images
                  </button>
                </div>
              </div>

              {/* Image Preview */}
              {images.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Uploaded Images</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {images.map((image) => (
                      <div key={image.id} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                          <img
                            src={image.preview}
                            alt={image.altText}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() => removeImage(image.id)}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        
                        {/* Primary Badge */}
                        {image.isPrimary && (
                          <div className="absolute top-2 left-2">
                            <span className="px-2 py-1 text-xs font-medium bg-primary-500 text-white rounded">
                              Primary
                            </span>
                          </div>
                        )}
                        
                        {/* Set Primary Button */}
                        {!image.isPrimary && (
                          <div className="absolute bottom-2 left-2 right-2">
                            <button
                              type="button"
                              onClick={() => setPrimaryImage(image.id)}
                              className="w-full px-2 py-1 text-xs font-medium bg-white text-gray-700 rounded hover:bg-gray-50"
                            >
                              Set as Primary
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {images.length === 0 && (
                <p className="text-sm text-red-500 mt-2">At least one image is required</p>
              )}
            </div>

            {/* Status Messages */}
            {error && (
              <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-md">
                <Check className="w-5 h-5 text-green-500" />
                <span className="text-sm text-green-700">{success}</span>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                {uploading ? 'Creating...' : 'Create Product'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
