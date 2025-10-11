'use client'

import React, { useState, useEffect, useRef } from 'react'
import { X, Check } from 'lucide-react'
import { Product } from '@/services/productService'
import { productService } from '@/services/productService'
import { tagService } from '@/services/tagService'
import { specialOfferDescriptionService } from '@/services/specialOfferDescriptionService'
import { handleNumericChange, validateNumericInput } from '@/utils/inputValidation'

interface EditProductModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product | null
  onProductUpdated: (product: Product) => void
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
  material: string
  gemstone: string
  ringSize: string
  chainLength: string
  color: string
  finish: string
  specialOffer: boolean
  specialOfferPrice: string
  specialOfferDescriptions: string[]
}

export function EditProductModal({ isOpen, onClose, product, onProductUpdated }: EditProductModalProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: '',
    sku: '',
    category: '',
    tags: [],
    quantity: '1',
    weightGrams: '',
    material: '',
    gemstone: '',
    ringSize: '',
    chainLength: '',
    color: '',
    finish: '',
    specialOffer: false,
    specialOfferPrice: '',
    specialOfferDescriptions: []
  })

  const [availableTags, setAvailableTags] = useState<any[]>([])
  const [availableSpecialOfferDescriptions, setAvailableSpecialOfferDescriptions] = useState<any[]>([])
  const [newTag, setNewTag] = useState('')
  const [newSpecialOfferDescription, setNewSpecialOfferDescription] = useState('')
  const [tagSearchQuery, setTagSearchQuery] = useState('')
  const [specialOfferDescriptionSearchQuery, setSpecialOfferDescriptionSearchQuery] = useState('')
  const [showTagSuggestions, setShowTagSuggestions] = useState(false)
  const [showSpecialOfferDescriptionSuggestions, setShowSpecialOfferDescriptionSuggestions] = useState(false)
  const [priceError, setPriceError] = useState('')
  const [specialOfferPriceError, setSpecialOfferPriceError] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  // Load available tags
  const loadTags = async () => {
    try {
      const tags = await tagService.getAllTags()
      setAvailableTags(tags)
    } catch (error) {
      console.error('Failed to load tags:', error)
    }
  }

  // Load available special offer descriptions
  const loadSpecialOfferDescriptions = async () => {
    try {
      const descriptions = await specialOfferDescriptionService.getAllSpecialOfferDescriptions()
      setAvailableSpecialOfferDescriptions(descriptions)
    } catch (error) {
      console.error('Failed to load special offer descriptions:', error)
    }
  }

  // Load data on mount
  useEffect(() => {
    loadTags()
    loadSpecialOfferDescriptions()
  }, [])

  // Populate form when product changes
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price?.toString() || '',
        sku: product.sku || '',
        category: product.categories?.[0] || '',
        tags: product.tags || [],
        quantity: product.quantity?.toString() || '1',
        weightGrams: product.weightGrams?.toString() || '',
        material: product.material || '',
        gemstone: product.gemstone || '',
        ringSize: product.ringSize || '',
        chainLength: product.chainLength || '',
        color: product.color || '',
        finish: product.finish || '',
        specialOffer: product.specialOffer || false,
        specialOfferPrice: product.specialOfferPrice?.toString() || '',
        specialOfferDescriptions: product.specialOfferDescription ? product.specialOfferDescription.split(', ') : []
      })
    }
  }, [product])

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
        loadTags()
      }
    }

    const timeoutId = setTimeout(searchTags, 300)
    return () => clearTimeout(timeoutId)
  }, [tagSearchQuery])

  // Search special offer descriptions when query changes
  useEffect(() => {
    const searchSpecialOfferDescriptions = async () => {
      if (specialOfferDescriptionSearchQuery.trim().length > 0) {
        try {
          const descriptions = await specialOfferDescriptionService.searchSpecialOfferDescriptions(specialOfferDescriptionSearchQuery)
          setAvailableSpecialOfferDescriptions(descriptions)
        } catch (error) {
          console.error('Failed to search special offer descriptions:', error)
        }
      } else {
        loadSpecialOfferDescriptions()
      }
    }

    const timeoutId = setTimeout(searchSpecialOfferDescriptions, 300)
    return () => clearTimeout(timeoutId)
  }, [specialOfferDescriptionSearchQuery])


  // Close modal when clicking outside and handle dropdowns
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

    const handleClickOutsideDropdowns = (e: MouseEvent) => {
      // Check if click is inside dropdown containers or input fields
      const target = e.target as Element
      const isInsideTagDropdown = target.closest('[data-tag-dropdown]')
      const isInsideSpecialOfferDropdown = target.closest('[data-special-offer-dropdown]')
      const isInsideTagInput = target.closest('input[placeholder*="tags"]')
      const isInsideSpecialOfferInput = target.closest('input[placeholder*="special offer"]')

      if (!isInsideTagDropdown && !isInsideSpecialOfferDropdown && !isInsideTagInput && !isInsideSpecialOfferInput) {
        setShowTagSuggestions(false)
        setShowSpecialOfferDescriptionSuggestions(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.addEventListener('mousedown', handleOutsideClick)
      document.addEventListener('mousedown', handleClickOutsideDropdowns)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('mousedown', handleClickOutsideDropdowns)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose, showTagSuggestions, showSpecialOfferDescriptionSuggestions])

  const handleInputChange = (field: keyof ProductFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const validatePrice = (price: string): string => {
    if (!price.trim()) return 'Price is required'
    const numPrice = parseFloat(price)
    if (isNaN(numPrice)) return 'Price must be a valid number'
    if (numPrice <= 0) return 'Price must be positive'
    if (numPrice > 999999) return 'Price is too high'
    return ''
  }

  const handlePriceChange = (value: string) => {
    setFormData(prev => ({ ...prev, price: value }))
    const error = validatePrice(value)
    setPriceError(error)
    
    // Also validate special offer price if it exists
    if (formData.specialOfferPrice) {
      const specialOfferError = validatePrice(formData.specialOfferPrice)
      setSpecialOfferPriceError(specialOfferError)
      
      if (!specialOfferError && !error) {
        const specialPrice = parseFloat(formData.specialOfferPrice)
        const normalPrice = parseFloat(value)
        if (specialPrice >= normalPrice) {
          setSpecialOfferPriceError('Special offer price must be less than normal price')
        }
      }
    }
  }

  const handleSpecialOfferPriceChange = (value: string) => {
    setFormData(prev => ({ ...prev, specialOfferPrice: value }))
    const error = validatePrice(value)
    setSpecialOfferPriceError(error)
    
    // Also check if it's less than normal price
    if (!error && formData.price) {
      const specialPrice = parseFloat(value)
      const normalPrice = parseFloat(formData.price)
      if (specialPrice >= normalPrice) {
        setSpecialOfferPriceError('Special offer price must be less than normal price')
      }
    }
  }

  const shouldShowRingSize = () => {
    return formData.category?.toLowerCase().includes('ring')
  }

  const shouldShowChainLength = () => {
    return formData.category?.toLowerCase().includes('chain')
  }

  const handleAddTag = async () => {
    const trimmedTag = newTag.trim()
    if (trimmedTag && !formData.tags.includes(trimmedTag)) {
      try {
        const createdTag = await tagService.createTag({ name: trimmedTag })
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, createdTag.name]
        }))
        setAvailableTags(prev => [...prev, createdTag])
      } catch (error) {
        console.error('Failed to create tag:', error)
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, trimmedTag]
        }))
      }
      setNewTag('')
    }
  }

  const handleSelectTag = (tagName: string) => {
    if (!formData.tags.includes(tagName)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagName]
      }))
    }
    setTagSearchQuery('')
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleAddSpecialOfferDescription = async () => {
    const trimmedDescription = newSpecialOfferDescription.trim()
    if (trimmedDescription && !formData.specialOfferDescriptions.includes(trimmedDescription)) {
      try {
        const createdDescription = await specialOfferDescriptionService.createSpecialOfferDescription({
          name: trimmedDescription,
          description: trimmedDescription
        })
        setFormData(prev => ({
          ...prev,
          specialOfferDescriptions: [...prev.specialOfferDescriptions, createdDescription.name]
        }))
        setAvailableSpecialOfferDescriptions(prev => [...prev, createdDescription])
      } catch (error) {
        console.error('Failed to create special offer description:', error)
        setFormData(prev => ({
          ...prev,
          specialOfferDescriptions: [...prev.specialOfferDescriptions, trimmedDescription]
        }))
      }
      setNewSpecialOfferDescription('')
    }
  }

  const handleSelectSpecialOfferDescription = (descriptionName: string) => {
    if (!formData.specialOfferDescriptions.includes(descriptionName)) {
      setFormData(prev => ({
        ...prev,
        specialOfferDescriptions: [...prev.specialOfferDescriptions, descriptionName]
      }))
    }
    setSpecialOfferDescriptionSearchQuery('')
  }

  const handleRemoveSpecialOfferDescription = (descriptionToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      specialOfferDescriptions: prev.specialOfferDescriptions.filter(desc => desc !== descriptionToRemove)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!product) return

    // Validate required fields
    if (!formData.name.trim() || !formData.sku.trim() || !formData.price.trim() || !formData.quantity.trim()) {
      setError('Please fill in all required fields')
      return
    }

    // Validate prices
    const priceError = validatePrice(formData.price)
    if (priceError) {
      setPriceError(priceError)
      setError(priceError)
      return
    }

    if (formData.specialOffer && formData.specialOfferPrice) {
      const specialOfferPriceError = validatePrice(formData.specialOfferPrice)
      if (specialOfferPriceError) {
        setSpecialOfferPriceError(specialOfferPriceError)
        setError(specialOfferPriceError)
        return
      }

      const specialPrice = parseFloat(formData.specialOfferPrice)
      const normalPrice = parseFloat(formData.price)
      if (specialPrice >= normalPrice) {
        setSpecialOfferPriceError('Special offer price must be less than normal price')
        setError('Special offer price must be less than normal price')
        return
      }
    }

    setUpdating(true)
    setError(null)
    setSuccess(null)

    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        sku: formData.sku,
        categories: formData.category ? [formData.category] : [],
        tags: formData.tags,
        quantity: parseInt(formData.quantity),
        weightGrams: formData.weightGrams ? parseFloat(formData.weightGrams) : undefined,
        material: formData.material || undefined,
        gemstone: formData.gemstone || undefined,
        ringSize: formData.ringSize || undefined,
        chainLength: formData.chainLength || undefined,
        color: formData.color || undefined,
        finish: formData.finish || undefined,
        specialOffer: formData.specialOffer,
        specialOfferPrice: formData.specialOffer ? parseFloat(formData.specialOfferPrice) : undefined,
        specialOfferDescription: formData.specialOfferDescriptions.join(', ')
      }

      const updatedProduct = await productService.updateProduct(product.id, productData)
      setSuccess('Product updated successfully!')
      onProductUpdated(updatedProduct)

      // Close modal immediately after successful save
      onClose()

    } catch (err: any) {
      console.error('Error updating product:', err)
      
      let errorMessage = 'Unknown error occurred'
      
      if (err.response?.data) {
        const responseData = err.response.data
        if (responseData.message) {
          errorMessage = responseData.message
        } else if (responseData.error) {
          errorMessage = responseData.error
        } else if (typeof responseData === 'string') {
          errorMessage = responseData
        }
      } else if (err.message) {
        errorMessage = err.message
      }
      
      if (errorMessage.includes('Product name already exists')) {
        errorMessage = 'A product with this name already exists. Please choose a different name.'
      } else if (errorMessage.includes('Product SKU already exists')) {
        errorMessage = 'A product with this SKU already exists. Please choose a different SKU.'
      }
      
      setError(`Failed to update product: ${errorMessage}`)
    } finally {
      setUpdating(false)
    }
  }

  if (!isOpen || !product) return null

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50"
      data-modal="edit-product"
    >
      <div ref={modalRef} className="bg-white rounded-lg max-w-7xl w-full max-h-[95vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Edit Product</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center">
                <Check className="w-5 h-5 text-green-500" />
                <span className="text-sm text-green-700 ml-2">{success}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  name="name"
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
                  name="sku"
                  value={formData.sku}
                  onChange={(e) => handleInputChange('sku', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., RING-GOLD-001"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity *
                </label>
                <input
                  type="text"
                  required
                  name="quantity"
                  value={formData.quantity}
                  onChange={(e) => handleNumericChange(e.target.value, (value) => handleInputChange('quantity', value), 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., 10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weight (grams) <span className="text-gray-500 font-normal">(e.g., 5.5)</span>
                </label>
                <input
                  type="text"
                  value={formData.weightGrams}
                  onChange={(e) => handleNumericChange(e.target.value, (value) => handleInputChange('weightGrams', value), 3)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., 5.5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Finish
                </label>
                <select
                  value={formData.finish}
                  onChange={(e) => handleInputChange('finish', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select finish</option>
                  <option value="Polished">Polished</option>
                  <option value="Matte">Matte</option>
                  <option value="Brushed">Brushed</option>
                  <option value="Satin">Satin</option>
                  <option value="High Polish">High Polish</option>
                  <option value="Antique">Antique</option>
                  <option value="Hammered">Hammered</option>
                  <option value="Textured">Textured</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Jewelry Specific Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Material
                </label>
                <select
                  value={formData.material}
                  onChange={(e) => handleInputChange('material', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select material</option>
                  <option value="Gold">Gold</option>
                  <option value="Silver">Silver</option>
                  <option value="Platinum">Platinum</option>
                  <option value="Rose Gold">Rose Gold</option>
                  <option value="White Gold">White Gold</option>
                  <option value="Yellow Gold">Yellow Gold</option>
                  <option value="Sterling Silver">Sterling Silver</option>
                  <option value="Titanium">Titanium</option>
                  <option value="Stainless Steel">Stainless Steel</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gemstone
                </label>
                <select
                  value={formData.gemstone}
                  onChange={(e) => handleInputChange('gemstone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select gemstone</option>
                  <option value="Diamond">Diamond</option>
                  <option value="Ruby">Ruby</option>
                  <option value="Sapphire">Sapphire</option>
                  <option value="Emerald">Emerald</option>
                  <option value="Pearl">Pearl</option>
                  <option value="Amethyst">Amethyst</option>
                  <option value="Topaz">Topaz</option>
                  <option value="Garnet">Garnet</option>
                  <option value="Opal">Opal</option>
                  <option value="Aquamarine">Aquamarine</option>
                  <option value="Citrine">Citrine</option>
                  <option value="Peridot">Peridot</option>
                  <option value="Tourmaline">Tourmaline</option>
                  <option value="Zircon">Zircon</option>
                  <option value="None">None</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <select
                  value={formData.color}
                  onChange={(e) => handleInputChange('color', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select color</option>
                  <option value="Gold">Gold</option>
                  <option value="Silver">Silver</option>
                  <option value="Rose Gold">Rose Gold</option>
                  <option value="White">White</option>
                  <option value="Black">Black</option>
                  <option value="Blue">Blue</option>
                  <option value="Red">Red</option>
                  <option value="Green">Green</option>
                  <option value="Purple">Purple</option>
                  <option value="Pink">Pink</option>
                  <option value="Yellow">Yellow</option>
                  <option value="Multi-color">Multi-color</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                required
                name="description"
                rows={3}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Describe your product..."
              />
            </div>

            {/* Price */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (CHF) *
                  <span className="text-gray-500 font-normal ml-2">(e.g., 90.00 or 90)</span>
                </label>
                <input
                  type="text"
                  required
                  name="price"
                  value={formData.price}
                  onChange={(e) => handleNumericChange(e.target.value, (value) => handlePriceChange(value), 2)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    priceError ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 99.99"
                />
                {priceError && (
                  <p className="mt-1 text-sm text-red-600">{priceError}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  required
                  name="category"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select category</option>
                  <option value="Rings">Rings</option>
                  <option value="Necklaces">Necklaces</option>
                  <option value="Earrings">Earrings</option>
                  <option value="Bracelets">Bracelets</option>
                  <option value="Chains">Chains</option>
                  <option value="Pendants">Pendants</option>
                  <option value="Watches">Watches</option>
                  <option value="Brooches">Brooches</option>
                  <option value="Cufflinks">Cufflinks</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Ring Size - Only show for rings */}
              {shouldShowRingSize() && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ring Size
                  </label>
                  <select
                    value={formData.ringSize}
                    onChange={(e) => handleInputChange('ringSize', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select size</option>
                    {Array.from({ length: 20 }, (_, i) => {
                      const size = (i + 1) * 0.5
                      return (
                        <option key={size} value={size.toString()}>
                          {size}
                        </option>
                      )
                    })}
                    <option value="Adjustable">Adjustable</option>
                  </select>
                </div>
              )}

              {/* Chain Length - Only show for chains */}
              {shouldShowChainLength() && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chain Length (cm)
                  </label>
                  <select
                    value={formData.chainLength}
                    onChange={(e) => handleInputChange('chainLength', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select length</option>
                    {Array.from({ length: 20 }, (_, i) => {
                      const length = (i + 1) * 5
                      return (
                        <option key={length} value={length.toString()}>
                          {length} cm
                        </option>
                      )
                    })}
                    <option value="Adjustable">Adjustable</option>
                  </select>
                </div>
              )}
            </div>

            {/* Special Offer */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="relative">
                  <input
                    type="checkbox"
                    id="specialOffer"
                    checked={formData.specialOffer}
                    onChange={(e) => handleInputChange('specialOffer', e.target.checked)}
                    className="sr-only"
                  />
                  <label 
                    htmlFor="specialOffer" 
                    className={`flex items-center justify-center w-5 h-5 border-2 rounded cursor-pointer transition-all duration-200 ${
                      formData.specialOffer 
                        ? 'bg-orange-500 border-orange-500 text-white' 
                        : 'bg-white border-gray-300 hover:border-orange-400'
                    }`}
                  >
                    {formData.specialOffer && (
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </label>
                </div>
                <label htmlFor="specialOffer" className="text-sm font-medium text-gray-700 cursor-pointer">
                  This product has a special offer
                </label>
              </div>

              {formData.specialOffer && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Special Offer Price (CHF)
                      <span className="text-gray-500 font-normal ml-2">(e.g., 79.99 or 79)</span>
                      <span className="text-xs text-orange-600 font-normal ml-2">Must be less than normal price</span>
                    </label>
                    <input
                      type="text"
                      required={formData.specialOffer}
                      name="specialOfferPrice"
                      value={formData.specialOfferPrice}
                      onChange={(e) => handleNumericChange(e.target.value, (value) => handleSpecialOfferPriceChange(value), 2)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        specialOfferPriceError ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="79.99"
                    />
                    {specialOfferPriceError && (
                      <p className="mt-1 text-sm text-red-600">{specialOfferPriceError}</p>
                    )}
                    
                    {/* Percentage Discount Buttons */}
                    {formData.price && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600 mb-2">Quick discount options:</p>
                        <div className="flex flex-wrap gap-2">
                          {[10, 15, 20, 25, 30, 40, 50].map((percentage) => {
                            const normalPrice = parseFloat(formData.price)
                            const discountPrice = normalPrice * (1 - percentage / 100)
                            return (
                              <button
                                key={percentage}
                                type="button"
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, specialOfferPrice: discountPrice.toFixed(2) }))
                                  setSpecialOfferPriceError('')
                                }}
                                className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md border border-gray-300"
                              >
                                -{percentage}% ({discountPrice.toFixed(2)})
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Special Offer Descriptions
                      {formData.specialOffer && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <div className="relative">
                      <div className="w-full px-3 py-2 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500 min-h-[42px] flex flex-wrap items-center gap-1">
                        {formData.specialOfferDescriptions.map(description => (
                          <span
                            key={description}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800"
                          >
                            {description}
                            <button
                              type="button"
                              onClick={() => handleRemoveSpecialOfferDescription(description)}
                              className="ml-1 text-orange-600 hover:text-orange-800"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                        <input
                          type="text"
                          value={newSpecialOfferDescription}
                          onChange={(e) => setNewSpecialOfferDescription(e.target.value)}
                          onFocus={() => {
                            setShowSpecialOfferDescriptionSuggestions(true)
                            setSpecialOfferDescriptionSearchQuery('')
                          }}
                          className="flex-1 min-w-[200px] border-none outline-none bg-transparent"
                          placeholder="Add special offer descriptions..."
                        />
                      </div>
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={handleAddSpecialOfferDescription}
                          className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                        >
                          Add
                        </button>
                      </div>
                      {showSpecialOfferDescriptionSuggestions && availableSpecialOfferDescriptions.length > 0 && (
                        <div className="absolute z-[9999] w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                          <div className="p-2 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-700">Available Descriptions</span>
                              <button
                                type="button"
                                onClick={() => setShowSpecialOfferDescriptionSuggestions(false)}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div onClick={(e) => e.stopPropagation()}>
                            {availableSpecialOfferDescriptions
                              .filter(desc => !formData.specialOfferDescriptions.includes(desc.name))
                              .map((desc) => (
                                <button
                                  key={desc.id}
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    e.nativeEvent.stopImmediatePropagation()
                                    handleSelectSpecialOfferDescription(desc.name)
                                  }}
                                  className="w-full px-3 py-2 text-left hover:bg-gray-100"
                                >
                                  {desc.name}
                                </button>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="relative" data-tag-dropdown>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onFocus={() => {
                      setShowTagSuggestions(true)
                      setTagSearchQuery('')
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Add tags..."
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
                {showTagSuggestions && availableTags.length > 0 && (
                  <div className="absolute z-[9999] w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                    <div className="p-2 border-b border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Available Tags</span>
                        <button
                          type="button"
                          onClick={() => setShowTagSuggestions(false)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      {availableTags
                        .filter(tag => !formData.tags.includes(tag.name))
                        .map((tag) => (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              e.nativeEvent.stopImmediatePropagation()
                              handleSelectTag(tag.name)
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-gray-100"
                          >
                            {tag.name}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

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
                disabled={updating}
                className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                {updating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}