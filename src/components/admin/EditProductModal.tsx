'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { X, Upload, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { Product, UpdateProductRequest } from '@/services/productService'
import api from '@/services/api'

interface EditProductModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product | null
  onSave: (productId: string, data: UpdateProductRequest) => Promise<void>
}

export function EditProductModal({ isOpen, onClose, product, onSave }: EditProductModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    material: '',
    gemstone: '',
    weightGrams: '',
    quantity: '',
    active: true,
    specialOffer: false,
    specialOfferPrice: '',
    specialOfferStartDate: '',
    specialOfferEndDate: '',
    tags: [] as string[],
    categories: [] as string[]
  })
  
  const [images, setImages] = useState<Array<{file: File, altText: string, isPrimary: boolean}>>([])
  const [existingImages, setExistingImages] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [allTags, setAllTags] = useState<any[]>([])
  const [allCategories, setAllCategories] = useState<any[]>([])
  const [tagSearchQuery, setTagSearchQuery] = useState('')
  const [filteredTags, setFilteredTags] = useState<any[]>([])
  const [showTagDropdown, setShowTagDropdown] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [deletingImages, setDeletingImages] = useState<Set<string>>(new Set())
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price?.toString() || '',
        material: product.material || '',
        gemstone: product.gemstone || '',
        weightGrams: product.weightGrams?.toString() || '',
        quantity: product.quantity?.toString() || '',
        active: product.active ?? true,
        specialOffer: product.specialOffer || false,
        specialOfferPrice: product.specialOfferPrice?.toString() || '',
        specialOfferStartDate: product.specialOfferStartDate ? new Date(product.specialOfferStartDate).toISOString().split('T')[0] : '',
        specialOfferEndDate: product.specialOfferEndDate ? new Date(product.specialOfferEndDate).toISOString().split('T')[0] : '',
        tags: product.tags || [],
        categories: product.categories || []
      })
      setExistingImages(product.images || [])
    }
  }, [product])

  // Load tags and categories
  useEffect(() => {
    const loadTagsAndCategories = async () => {
      try {
        const [tagsResponse, categoriesResponse] = await Promise.all([
          fetch('http://localhost:8080/api/tags'),
          fetch('http://localhost:8080/api/categories')
        ])
        
        if (tagsResponse.ok) {
          const tags = await tagsResponse.json()
          setAllTags(tags)
        }
        
        if (categoriesResponse.ok) {
          const categories = await categoriesResponse.json()
          setAllCategories(categories)
        }
      } catch (err) {
        console.error('Error loading tags and categories:', err)
      }
    }
    
    if (isOpen) {
      loadTagsAndCategories()
    }
  }, [isOpen])

  // Filter tags based on search query
  useEffect(() => {
    if (tagSearchQuery.trim()) {
      const filtered = allTags.filter(tag => 
        tag.name.toLowerCase().includes(tagSearchQuery.toLowerCase())
      )
      setFilteredTags(filtered)
    } else {
      setFilteredTags(allTags)
    }
  }, [tagSearchQuery, allTags])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose()
      }
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node) && isOpen && !loading) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.addEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'hidden'
    } else {
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose, loading])

  // Cleanup effect for pending deletions
  useEffect(() => {
    return () => {
      // Clear any pending deletion timeouts when component unmounts
      setDeletingImages(new Set())
    }
  }, [])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const newImages = files.map(file => ({
      file,
      altText: `${formData.name} - Image`,
      isPrimary: images.length === 0
    }))
    setImages(prev => [...prev, ...newImages])
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const setPrimaryImage = (index: number) => {
    setImages(prev => prev.map((img, i) => ({ ...img, isPrimary: i === index })))
  }

  // Tag management
  const addTag = (tag: any) => {
    if (!formData.tags.includes(tag.name)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag.name]
      }))
    }
    setTagSearchQuery('')
    setShowTagDropdown(false)
  }

  const removeTag = (tagName: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tagName)
    }))
  }

  const createNewTag = async () => {
    if (newTagName.trim() && !allTags.find(tag => tag.name.toLowerCase() === newTagName.toLowerCase())) {
      try {
        const response = await fetch('http://localhost:8080/api/tags', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
          },
          body: JSON.stringify({ name: newTagName.trim() })
        })
        
        if (response.ok) {
          const newTag = await response.json()
          setAllTags(prev => [...prev, newTag])
          addTag(newTag)
          setNewTagName('')
        }
      } catch (err) {
        console.error('Error creating tag:', err)
      }
    }
  }

  // Category management
  const toggleCategory = (categoryName: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryName)
        ? prev.categories.filter(c => c !== categoryName)
        : [...prev.categories, categoryName]
    }))
  }

  // Image management
  const deleteExistingImage = useCallback(async (imageId: string) => {
    // Prevent multiple simultaneous deletions of the same image
    if (deletingImages.has(imageId)) {
      console.log('Image deletion already in progress for:', imageId)
      return
    }

    try {
      setDeletingImages(prev => new Set(prev).add(imageId))
      
      const response = await api.delete(`/api/admin/product-images/${imageId}`)
      
      if (response.data.success) {
        setExistingImages(prev => prev.filter(img => img.id !== imageId))
      } else {
        console.error('Failed to delete image:', response.data.message)
      }
    } catch (err) {
      console.error('Error deleting image:', err)
    } finally {
      setDeletingImages(prev => {
        const newSet = new Set(prev)
        newSet.delete(imageId)
        return newSet
      })
    }
  }, [deletingImages])

  // Debounced delete function to prevent rapid clicks
  const debouncedDeleteImage = useCallback((imageId: string) => {
    const timeoutId = setTimeout(() => {
      deleteExistingImage(imageId)
    }, 100) // 100ms debounce

    return () => clearTimeout(timeoutId)
  }, [deleteExistingImage])


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product) return

    // Check if there are any changes
    const hasChanges = 
      formData.name !== product.name ||
      formData.description !== (product.description || '') ||
      parseFloat(formData.price) !== product.price ||
      formData.material !== (product.material || '') ||
      formData.gemstone !== (product.gemstone || '') ||
      (formData.weightGrams ? parseFloat(formData.weightGrams) : null) !== product.weightGrams ||
      parseInt(formData.quantity) !== product.quantity ||
      formData.active !== product.active ||
      formData.specialOffer !== (product.specialOffer || false) ||
      (formData.specialOfferPrice ? parseFloat(formData.specialOfferPrice) : null) !== product.specialOfferPrice ||
      formData.specialOfferStartDate !== (product.specialOfferStartDate ? new Date(product.specialOfferStartDate).toISOString().split('T')[0] : '') ||
      formData.specialOfferEndDate !== (product.specialOfferEndDate ? new Date(product.specialOfferEndDate).toISOString().split('T')[0] : '') ||
      JSON.stringify(formData.tags.sort()) !== JSON.stringify((product.tags || []).sort()) ||
      JSON.stringify(formData.categories.sort()) !== JSON.stringify((product.categories || []).sort()) ||
      images.length > 0

    if (!hasChanges) {
      setError('No changes detected. Please make some changes before saving.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const updateData: UpdateProductRequest = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        material: formData.material || undefined,
        gemstone: formData.gemstone || undefined,
        weightGrams: formData.weightGrams ? parseFloat(formData.weightGrams) : undefined,
        quantity: parseInt(formData.quantity),
        active: formData.active,
        specialOffer: formData.specialOffer,
        specialOfferPrice: formData.specialOfferPrice ? parseFloat(formData.specialOfferPrice) : undefined,
        specialOfferStartDate: formData.specialOfferStartDate ? new Date(formData.specialOfferStartDate).toISOString() : undefined,
        specialOfferEndDate: formData.specialOfferEndDate ? new Date(formData.specialOfferEndDate).toISOString() : undefined,
        tags: formData.tags,
        categories: formData.categories
      }

      await onSave(product.id, updateData)
      onClose()
    } catch (err) {
      setError('Failed to update product')
      console.error('Error updating product:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !product) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto m-4"
      >
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Edit Product</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price *
              </label>
              <input
                type="number"
                required
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Material
              </label>
              <input
                type="text"
                value={formData.material}
                onChange={(e) => handleInputChange('material', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gemstone
              </label>
              <input
                type="text"
                value={formData.gemstone}
                onChange={(e) => handleInputChange('gemstone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
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
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => handleInputChange('active', e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="active" className="ml-2 block text-sm text-gray-900">
                Active
              </label>
            </div>
          </div>

          {/* Special Offer Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Special Offer</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="specialOffer"
                  checked={formData.specialOffer}
                  onChange={(e) => handleInputChange('specialOffer', e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="specialOffer" className="ml-2 block text-sm text-gray-900">
                  Enable Special Offer
                </label>
              </div>

              {formData.specialOffer && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Special Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.specialOfferPrice}
                      onChange={(e) => handleInputChange('specialOfferPrice', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.specialOfferStartDate}
                      onChange={(e) => handleInputChange('specialOfferStartDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={formData.specialOfferEndDate}
                      onChange={(e) => handleInputChange('specialOfferEndDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tags Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Tags</h3>
            <div className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search or create tags..."
                  value={tagSearchQuery}
                  onChange={(e) => {
                    setTagSearchQuery(e.target.value)
                    setShowTagDropdown(true)
                  }}
                  onFocus={() => setShowTagDropdown(true)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {showTagDropdown && filteredTags.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                    {filteredTags.map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => addTag(tag)}
                        className="w-full px-3 py-2 text-left hover:bg-gray-100"
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Create new tag..."
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="button"
                  onClick={createNewTag}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  Create
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-2 text-primary-600 hover:text-primary-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Categories Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Categories</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {allCategories.map((category) => (
                <label key={category.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.categories.includes(category.name)}
                    onChange={() => toggleCategory(category.name)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-900">{category.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Existing Images Gallery */}
          {existingImages.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Images ({existingImages.length})
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {existingImages.map((image, index) => (
                  <div key={image.id || index} className="relative group">
                    <img
                      src={image.url}
                      alt={image.altText}
                      className="w-full h-24 object-cover rounded"
                    />
                    {image.isPrimary && (
                      <div className="absolute top-1 left-1 bg-primary-500 text-white text-xs px-2 py-1 rounded">
                        Primary
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => debouncedDeleteImage(image.id)}
                      disabled={deletingImages.has(image.id)}
                      className={`absolute top-1 right-1 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity ${
                        deletingImages.has(image.id) 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-red-500 hover:bg-red-600'
                      }`}
                    >
                      {deletingImages.has(image.id) ? (
                        <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <X className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Images Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add New Images
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">
                  Click to upload images or drag and drop
                </span>
              </label>
            </div>

            {images.length > 0 && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(image.file)}
                      alt={image.altText}
                      className="w-full h-24 object-cover rounded"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    {image.isPrimary && (
                      <div className="absolute bottom-1 left-1 bg-primary-500 text-white text-xs px-2 py-1 rounded">
                        Primary
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
