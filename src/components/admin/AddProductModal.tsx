'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { X, Upload, Image as ImageIcon, Plus, Trash2, AlertCircle, Check } from 'lucide-react'
import { Product } from '@/types'
import { CreateProductRequest } from '@/services/productService'
import { productService } from '@/services/productService'
import { tagService, Tag } from '@/services/tagService'
import { specialOfferDescriptionService, SpecialOfferDescription } from '@/services/specialOfferDescriptionService'
import { api } from '@/services/api'
import { handleNumericChange, validateNumericInput } from '@/utils/inputValidation'

interface AddProductModalProps {
  isOpen: boolean
  onClose: () => void
  onProductAdded: (product: Product) => void
  product?: Product // Optional product for editing
  isEditing?: boolean // Flag to indicate if we're editing
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
  active: boolean
}

interface UploadedImage {
  id: string
  file: File
  preview: string
  altText: string
  isPrimary: boolean
  sortOrder?: number
}

export function AddProductModal({ isOpen, onClose, onProductAdded, product, isEditing = false }: AddProductModalProps) {
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
    specialOfferDescriptions: [],
    active: true
  })

  const [images, setImages] = useState<UploadedImage[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState<'basic' | 'images'>('basic')
  const [newTag, setNewTag] = useState('')
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [tagSearchQuery, setTagSearchQuery] = useState('')
  const [showTagSuggestions, setShowTagSuggestions] = useState(false)
  const [newSpecialOfferDescription, setNewSpecialOfferDescription] = useState('')
  const [availableSpecialOfferDescriptions, setAvailableSpecialOfferDescriptions] = useState<SpecialOfferDescription[]>([])
  const [specialOfferDescriptionSearchQuery, setSpecialOfferDescriptionSearchQuery] = useState('')
  const [showSpecialOfferDescriptionSuggestions, setShowSpecialOfferDescriptionSuggestions] = useState(false)
  const [defaultSpecialOfferDescription, setDefaultSpecialOfferDescription] = useState<string>('')
  const [priceError, setPriceError] = useState<string>('')
  const [specialOfferPriceError, setSpecialOfferPriceError] = useState<string>('')
  const [validationMessage, setValidationMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  const categories = [
    'Rings', 'Necklaces', 'Earrings', 'Bracelets', 'Watches', 
    'Pendants', 'Chains', 'Bangles', 'Brooches', 'Cufflinks'
  ]

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

  // Load available tags on component mount
  useEffect(() => {
    loadTags()
  }, [])

  // Load available special offer descriptions on component mount
  useEffect(() => {
    loadSpecialOfferDescriptions()
  }, [])

  // Load default special offer description from system config
  useEffect(() => {
    const loadDefaultSpecialOfferDescription = async () => {
      try {
        const response = await api.get('/api/admin/system-config')
        const configs = response.data
        const defaultConfig = configs.find((config: any) => config.configKey === 'default_special_offer_description')
        if (defaultConfig) {
          setDefaultSpecialOfferDescription(defaultConfig.configValue)
        }
      } catch (error) {
        console.error('Failed to load default special offer description:', error)
      }
    }
    loadDefaultSpecialOfferDescription()
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

  // Auto-scroll to show dropdown when it opens
  useEffect(() => {
    if (showTagSuggestions && availableTags.length > 0) {
      // Small delay to ensure dropdown is rendered
      setTimeout(() => {
        const dropdown = document.querySelector('[data-tag-dropdown]')
        if (dropdown) {
          dropdown.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'nearest',
            inline: 'nearest'
          })
        }
      }, 100)
    }
  }, [showTagSuggestions, availableTags.length])

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
        // Load all special offer descriptions when query is empty
        try {
          const descriptions = await specialOfferDescriptionService.getAllSpecialOfferDescriptions()
          setAvailableSpecialOfferDescriptions(descriptions)
        } catch (error) {
          console.error('Failed to load special offer descriptions:', error)
        }
      }
    }

    const timeoutId = setTimeout(searchSpecialOfferDescriptions, 300) // Debounce search
    return () => clearTimeout(timeoutId)
  }, [specialOfferDescriptionSearchQuery])

  // Auto-scroll to show special offer descriptions dropdown when it opens
  useEffect(() => {
    if (showSpecialOfferDescriptionSuggestions && availableSpecialOfferDescriptions.length > 0) {
      // Small delay to ensure dropdown is rendered
      setTimeout(() => {
        const dropdown = document.querySelector('[data-special-offer-dropdown]')
        if (dropdown) {
          dropdown.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'nearest',
            inline: 'nearest'
          })
        }
      }, 100)
    }
  }, [showSpecialOfferDescriptionSuggestions, availableSpecialOfferDescriptions.length])

  // Reset form when modal opens or populate when editing
  useEffect(() => {
    if (isOpen) {
      setCurrentPage('basic')
      
      if (isEditing && product) {
        // Populate form with existing product data
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
          specialOfferDescriptions: product.specialOfferDescription ? product.specialOfferDescription.split(', ') : [],
          active: product.active !== false
        })
        
        // Set images if they exist
        if (product.images && product.images.length > 0) {
          setImages(product.images.map((img, index) => ({
            id: img.id || `existing-${index}`,
            file: new File([], 'existing-image'), // Dummy file for existing images
            preview: img.url || '',
            altText: img.altText || '',
            isPrimary: img.isPrimary || false
          })))
        }
      } else {
        // Reset form for new product
        setFormData({
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
          specialOfferDescriptions: [],
          active: true
        })
        setImages([])
      }
    }
  }, [isOpen, isEditing, product])

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

    const handleClickOutsideDropdowns = (e: MouseEvent) => {
      // Check if click is inside dropdown containers or input fields
      const target = e.target as Element
      const isInsideTagDropdown = target.closest('[data-tag-dropdown]')
      const isInsideSpecialOfferDropdown = target.closest('[data-special-offer-dropdown]')
      const isInsideTagInput = target.closest('input[placeholder*="tags"]')
      const isInsideSpecialOfferInput = target.closest('input[placeholder*="descriptions"]')
      
      // Close tag suggestions only if not clicking inside tag dropdown or input
      if (showTagSuggestions && !isInsideTagDropdown && !isInsideTagInput) {
        setShowTagSuggestions(false)
      }
      // Close special offer description suggestions only if not clicking inside special offer dropdown or input
      if (showSpecialOfferDescriptionSuggestions && !isInsideSpecialOfferDropdown && !isInsideSpecialOfferInput) {
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

  const handleInputChange = (field: keyof ProductFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const validatePrice = (value: string): string => {
    if (!value.trim()) return 'Price is required'
    const numValue = parseFloat(value)
    if (isNaN(numValue)) return 'Price must be a valid number'
    if (numValue < 0) return 'Price must be positive'
    if (numValue > 999999.99) return 'Price must be less than 1,000,000'
    return ''
  }

  // Helper function to determine if ring size should be shown
  const shouldShowRingSize = () => {
    return formData.category && formData.category.toLowerCase() === 'rings'
  }

  // Helper function to determine if chain length should be shown
  const shouldShowChainLength = () => {
    return formData.category && formData.category.toLowerCase() === 'chains'
  }

  // Validation function to check if basic information is complete
  const isBasicInfoComplete = () => {
    const requiredFields = [
      formData.name,
      formData.sku,
      formData.category,
      formData.price,
      formData.quantity,
      formData.description
    ]
    
    // Check basic required fields first
    const basicFieldsValid = requiredFields.every(field => field && field.toString().trim() !== '')
    
    // Check tags are selected
    const tagsValid = formData.tags.length > 0
    
    // Check if special offer is enabled, then special offer fields are required
    if (formData.specialOffer) {
      const specialOfferPriceValid = formData.specialOfferPrice && formData.specialOfferPrice.toString().trim() !== ''
      const specialOfferDescriptionsValid = formData.specialOfferDescriptions.length > 0
      
      // Check if special offer price is less than base price
      let priceComparisonValid = true
      if (specialOfferPriceValid && formData.price) {
        const specialPrice = parseFloat(formData.specialOfferPrice)
        const basePrice = parseFloat(formData.price)
        if (!isNaN(specialPrice) && !isNaN(basePrice)) {
          priceComparisonValid = specialPrice < basePrice
        }
      }
      
      console.log('🔍 Validation Debug:', {
        specialOffer: formData.specialOffer,
        specialOfferPrice: formData.specialOfferPrice,
        specialOfferPriceValid,
        specialOfferDescriptions: formData.specialOfferDescriptions,
        specialOfferDescriptionsValid,
        priceComparisonValid,
        basePrice: formData.price,
        basicFieldsValid,
        tagsValid,
        tags: formData.tags,
        finalResult: basicFieldsValid && tagsValid && specialOfferPriceValid && specialOfferDescriptionsValid && priceComparisonValid
      })
      
      if (!specialOfferPriceValid || !specialOfferDescriptionsValid || !priceComparisonValid) {
        return false
      }
    }
    
    const finalResult = basicFieldsValid && tagsValid
    console.log('🔍 Final Validation Result:', finalResult, { basicFieldsValid, tagsValid })
    return finalResult
  }

  // Function to focus on the first error field
  const focusOnFirstErrorField = () => {
    // Check basic required fields
    if (!formData.name || formData.name.trim() === '') {
      const nameInput = document.querySelector('input[name="name"]') as HTMLInputElement
      if (nameInput) {
        nameInput.focus()
        nameInput.scrollIntoView({ behavior: 'smooth', block: 'center' })
        return
      }
    }
    
    if (!formData.sku || formData.sku.trim() === '') {
      const skuInput = document.querySelector('input[name="sku"]') as HTMLInputElement
      if (skuInput) {
        skuInput.focus()
        skuInput.scrollIntoView({ behavior: 'smooth', block: 'center' })
        return
      }
    }
    
    if (!formData.category) {
      const categorySelect = document.querySelector('select[name="category"]') as HTMLSelectElement
      if (categorySelect) {
        categorySelect.focus()
        categorySelect.scrollIntoView({ behavior: 'smooth', block: 'center' })
        return
      }
    }
    
    if (!formData.price || formData.price.trim() === '') {
      const priceInput = document.querySelector('input[name="price"]') as HTMLInputElement
      if (priceInput) {
        priceInput.focus()
        priceInput.scrollIntoView({ behavior: 'smooth', block: 'center' })
        return
      }
    }
    
    if (!formData.quantity || formData.quantity.trim() === '') {
      const quantityInput = document.querySelector('input[name="quantity"]') as HTMLInputElement
      if (quantityInput) {
        quantityInput.focus()
        quantityInput.scrollIntoView({ behavior: 'smooth', block: 'center' })
        return
      }
    }
    
    if (!formData.description || formData.description.trim() === '') {
      const descriptionTextarea = document.querySelector('textarea[name="description"]') as HTMLTextAreaElement
      if (descriptionTextarea) {
        descriptionTextarea.focus()
        descriptionTextarea.scrollIntoView({ behavior: 'smooth', block: 'center' })
        return
      }
    }
    
    // Check tags
    if (formData.tags.length === 0) {
      const tagsInput = document.querySelector('input[placeholder*="Add tag"]') as HTMLInputElement
      if (tagsInput) {
        tagsInput.focus()
        tagsInput.scrollIntoView({ behavior: 'smooth', block: 'center' })
        return
      }
    }
    
    // Check special offer fields
    if (formData.specialOffer) {
      if (!formData.specialOfferPrice || formData.specialOfferPrice.trim() === '') {
        const specialPriceInput = document.querySelector('input[name="specialOfferPrice"]') as HTMLInputElement
        if (specialPriceInput) {
          specialPriceInput.focus()
          specialPriceInput.scrollIntoView({ behavior: 'smooth', block: 'center' })
          return
        }
      }
      
      if (formData.specialOfferDescriptions.length === 0) {
        const specialDescInput = document.querySelector('input[placeholder*="special offer description"]') as HTMLInputElement
        if (specialDescInput) {
          specialDescInput.focus()
          specialDescInput.scrollIntoView({ behavior: 'smooth', block: 'center' })
          return
        }
      }
      
      // Check price comparison
      if (formData.specialOfferPrice && formData.price) {
        const specialPrice = parseFloat(formData.specialOfferPrice)
        const basePrice = parseFloat(formData.price)
        if (!isNaN(specialPrice) && !isNaN(basePrice) && specialPrice >= basePrice) {
          const specialPriceInput = document.querySelector('input[name="specialOfferPrice"]') as HTMLInputElement
          if (specialPriceInput) {
            specialPriceInput.focus()
            specialPriceInput.scrollIntoView({ behavior: 'smooth', block: 'center' })
            return
          }
        }
      }
    }
  }

  // Keyboard navigation handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft' && currentPage === 'images') {
      e.preventDefault()
      setCurrentPage('basic')
      setValidationMessage('')
    } else if (e.key === 'ArrowRight' && currentPage === 'basic') {
      e.preventDefault()
      
      console.log('🔍 Keyboard Navigation - Validation Check:', isBasicInfoComplete())
      
      // ONLY change page if validation passes
      if (isBasicInfoComplete()) {
        console.log('✅ Validation passed - changing to Images tab')
        setCurrentPage('images')
        setValidationMessage('')
      } else {
        console.log('❌ Validation failed - staying on Basic tab')
        setValidationMessage('Please fill in all required fields before continuing to Images tab')
        setTimeout(() => setValidationMessage(''), 5000)
        focusOnFirstErrorField()
        // DO NOT change currentPage - stay on 'basic'
      }
    }
  }

  const handlePriceChange = (value: string) => {
    setFormData(prev => ({ ...prev, price: value }))
    const error = validatePrice(value)
    setPriceError(error)
    
    // If normal price changes, re-validate special offer price
    if (formData.specialOfferPrice && !error && value) {
      const specialOfferPrice = parseFloat(formData.specialOfferPrice)
      const normalPrice = parseFloat(value)
      
      if (!isNaN(specialOfferPrice) && !isNaN(normalPrice)) {
        if (specialOfferPrice >= normalPrice) {
          setSpecialOfferPriceError('Special offer price must be less than the normal price')
        } else {
          setSpecialOfferPriceError('')
        }
      }
    }
  }

  const handleSpecialOfferPriceChange = (value: string) => {
    setFormData(prev => ({ ...prev, specialOfferPrice: value }))
    
    // First validate the basic price format
    let error = validatePrice(value)
    
    // If basic validation passes, check if special offer price is less than normal price
    if (!error && value && formData.price) {
      const specialOfferPrice = parseFloat(value)
      const normalPrice = parseFloat(formData.price)
      
      if (!isNaN(specialOfferPrice) && !isNaN(normalPrice)) {
        if (specialOfferPrice >= normalPrice) {
          error = 'Special offer price must be less than the normal price'
        }
      }
    }
    
    setSpecialOfferPriceError(error)
  }

  // Set default special offer description when special offer is enabled
  useEffect(() => {
    if (formData.specialOffer && defaultSpecialOfferDescription && formData.specialOfferDescriptions.length === 0) {
      setFormData(prev => ({
        ...prev,
        specialOfferDescriptions: [defaultSpecialOfferDescription]
      }))
    }
  }, [formData.specialOffer, defaultSpecialOfferDescription])

  // Focus modal for keyboard navigation
  useEffect(() => {
    if (isOpen) {
      const modalElement = document.querySelector('[data-modal="add-product"]')
      if (modalElement) {
        (modalElement as HTMLElement).focus()
      }
    }
  }, [isOpen])

  // Clear validation message when form becomes valid
  useEffect(() => {
    if (validationMessage && isBasicInfoComplete()) {
      setValidationMessage('')
    }
  }, [formData, validationMessage])

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
      // Keep dropdown open for multiple selections
      // setShowTagSuggestions(false)
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
    // Keep dropdown open for multiple selections
    // setShowTagSuggestions(false)
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) }))
  }

  const handleAddSpecialOfferDescription = async () => {
    const trimmedDescription = newSpecialOfferDescription.trim()
    console.log('Adding description:', trimmedDescription)
    console.log('Current descriptions:', formData.specialOfferDescriptions)
    
    if (trimmedDescription && !formData.specialOfferDescriptions.includes(trimmedDescription)) {
      // Check if special offer description already exists in available descriptions
      const existingDescription = availableSpecialOfferDescriptions.find(desc => desc.name.toLowerCase() === trimmedDescription.toLowerCase())
      
      if (existingDescription) {
        // Add existing special offer description
        setFormData(prev => ({
          ...prev,
          specialOfferDescriptions: [...prev.specialOfferDescriptions, existingDescription.name]
        }))
      } else {
        // Create new special offer description
        try {
          const createdDescription = await specialOfferDescriptionService.createSpecialOfferDescription({ 
            name: trimmedDescription 
          })
          setFormData(prev => ({
            ...prev,
            specialOfferDescriptions: [...prev.specialOfferDescriptions, createdDescription.name]
          }))
          // Add to available descriptions
          setAvailableSpecialOfferDescriptions(prev => [...prev, createdDescription])
        } catch (error) {
          console.error('Failed to create special offer description:', error)
          // Fallback: add as string without creating in DB
          setFormData(prev => ({
            ...prev,
            specialOfferDescriptions: [...prev.specialOfferDescriptions, trimmedDescription]
          }))
        }
      }
      // Clear input but keep dropdown open for multiple selections
      setNewSpecialOfferDescription('')
      setSpecialOfferDescriptionSearchQuery('')
      // setShowSpecialOfferDescriptionSuggestions(false)
    }
  }

  const handleSelectSpecialOfferDescription = (description: SpecialOfferDescription) => {
    console.log('=== SELECTING DESCRIPTION ===')
    console.log('Description:', description)
    console.log('Current descriptions:', formData.specialOfferDescriptions)
    console.log('Already includes?', formData.specialOfferDescriptions.includes(description.name))
    
    if (!formData.specialOfferDescriptions.includes(description.name)) {
      console.log('Adding description to form data...')
      setFormData(prev => {
        const newDescriptions = [...prev.specialOfferDescriptions, description.name]
        console.log('New descriptions array:', newDescriptions)
        return {
          ...prev,
          specialOfferDescriptions: newDescriptions
        }
      })
      console.log('Description added successfully!')
    } else {
      console.log('Description already exists, not adding')
    }
    
    setNewSpecialOfferDescription('')
    setSpecialOfferDescriptionSearchQuery('')
    // Keep dropdown open for multiple selections
    // setShowSpecialOfferDescriptionSuggestions(false)
    console.log('=== SELECTION COMPLETE ===')
  }

  const handleRemoveSpecialOfferDescription = (descriptionToRemove: string) => {
    setFormData(prev => ({ 
      ...prev, 
      specialOfferDescriptions: prev.specialOfferDescriptions.filter(desc => desc !== descriptionToRemove) 
    }))
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
      isPrimary: images.length === 0 && index === 0,
      sortOrder: images.length + index + 1
    }))

    // If this is the first batch and we're setting the first image as primary, update sort orders
    const updatedImages = images.length === 0 ? 
      newImages.map((img, index) => ({
        ...img,
        sortOrder: img.isPrimary ? 1 : index + 1
      })) : 
      newImages

    setImages(prev => [...prev, ...updatedImages])
  }

  const removeImage = (imageId: string) => {
    setImages(prev => {
      const filtered = prev.filter(img => img.id !== imageId)
      // If we removed the primary image, make the first remaining one primary
      if (filtered.length > 0 && !filtered.some(img => img.isPrimary)) {
        // Set first image as primary with sortOrder 1, others get sequential order
        return filtered.map((img, index) => ({
          ...img,
          isPrimary: index === 0,
          sortOrder: index + 1
        }))
      }
      // If we didn't remove the primary image, just reorder the remaining images
      return filtered.map((img, index) => ({
        ...img,
        sortOrder: img.isPrimary ? 1 : index + 1
      }))
    })
  }

  const setPrimaryImage = (imageId: string) => {
    setImages(prev => {
      // Find the image to set as primary
      const primaryImage = prev.find(img => img.id === imageId)
      if (!primaryImage) return prev
      
      // Update all images: set primary image to sortOrder 1, others get sequential order
      return prev.map((img, index) => {
        if (img.id === imageId) {
          // This is the primary image - set sortOrder to 1
          return { ...img, isPrimary: true, sortOrder: 1 }
        } else {
          // Other images - set isPrimary to false and assign sequential sortOrder starting from 2
          const newIndex = index < prev.findIndex(i => i.id === imageId) ? index : index - 1
          return { ...img, isPrimary: false, sortOrder: newIndex + 2 }
        }
      }).sort((a, b) => {
        // Sort by isPrimary first (true comes first), then by sortOrder
        if (a.isPrimary && !b.isPrimary) return -1
        if (!a.isPrimary && b.isPrimary) return 1
        return (a.sortOrder || 0) - (b.sortOrder || 0)
      })
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Prevent submission if it's coming from dropdown interactions
    const target = e.target as Element
    if (target.closest('[data-tag-dropdown]') || target.closest('[data-special-offer-dropdown]')) {
      console.log('Preventing form submission from dropdown interaction')
      return
    }

    // Validate all required fields before submission
    if (!isBasicInfoComplete()) {
      setValidationMessage('Please fill in all required fields before creating the product')
      setTimeout(() => setValidationMessage(''), 5000)
      focusOnFirstErrorField()
      return
    }
    
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

    // Validate prices
    const priceValidationError = validatePrice(formData.price)
    if (priceValidationError) {
      setError(priceValidationError)
      setUploading(false)
      return
    }

    if (formData.specialOffer) {
      const specialOfferPriceValidationError = validatePrice(formData.specialOfferPrice)
      if (specialOfferPriceValidationError) {
        setError(specialOfferPriceValidationError)
        setUploading(false)
        return
      }
      
      // Validate that special offer price is less than normal price
      const specialOfferPrice = parseFloat(formData.specialOfferPrice)
      const normalPrice = parseFloat(formData.price)
      
      if (!isNaN(specialOfferPrice) && !isNaN(normalPrice) && specialOfferPrice >= normalPrice) {
        setError('Special offer price must be less than the normal price')
        setUploading(false)
        return
      }
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
        material: formData.material || undefined,
        gemstone: formData.gemstone || undefined,
        ringSize: formData.ringSize || undefined,
        chainLength: formData.chainLength || undefined,
        color: formData.color || undefined,
        finish: formData.finish || undefined,
        specialOffer: formData.specialOffer,
        specialOfferPrice: formData.specialOffer ? parseFloat(formData.specialOfferPrice) : undefined,
        specialOfferDescription: formData.specialOfferDescriptions.join(', '),
        active: formData.active
      }

      // Create or update product using the service
      let createdProduct: Product
      if (isEditing && product) {
        // Update existing product
        createdProduct = await productService.updateProduct(product.id, productData)
        console.log('Product updated successfully:', createdProduct)
      } else {
        // Create new product
        createdProduct = await productService.createProduct(productData)
        console.log('Product created successfully:', createdProduct)
      }

      // Upload images if any
      if (images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          const image = images[i]
          const formData = new FormData()
          formData.append('file', image.file)
          formData.append('altText', image.altText)
          formData.append('isPrimary', image.isPrimary.toString())
          formData.append('sortOrder', (image.sortOrder || i + 1).toString()) // Use the sortOrder from state

          const imageResponse = await api.post(`/api/admin/upload-product-image/${createdProduct.id}`, formData, {
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

      setSuccess(isEditing ? 'Product updated successfully!' : 'Product created successfully!')
      onProductAdded(createdProduct)
      
      if (!isEditing) {
        // Only reset form for new products
        setFormData({
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
          specialOfferDescriptions: [],
          active: true
        })
        setImages([])
      }
      
      setPriceError('')
      setSpecialOfferPriceError('')
      setCurrentPage('basic')
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose()
      }, 1500)

    } catch (err: any) {
      console.error('Error creating product:', err)
      
      let errorMessage = 'Unknown error occurred'
      
      // Handle Axios error with response data
      if (err.response?.data) {
        const responseData = err.response.data
        
        // Check for specific validation errors
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
      
      // Clean up common error prefixes and improve user-friendly messages
      if (errorMessage.includes('Request failed with status code')) {
        errorMessage = 'Server error occurred. Please try again.'
      } else if (errorMessage.includes('Product name already exists')) {
        errorMessage = 'A product with this name already exists. Please choose a different name.'
      } else if (errorMessage.includes('Product SKU already exists')) {
        errorMessage = 'A product with this SKU already exists. Please choose a different SKU.'
      } else if (errorMessage.includes('Product name is required')) {
        errorMessage = 'Product name is required.'
      } else if (errorMessage.includes('SKU is required')) {
        errorMessage = 'SKU is required.'
      } else if (errorMessage.includes('Price is required')) {
        errorMessage = 'Price is required.'
      } else if (errorMessage.includes('Price must be positive')) {
        errorMessage = 'Price must be a positive number.'
      } else if (errorMessage.includes('Quantity is required')) {
        errorMessage = 'Quantity is required.'
      } else if (errorMessage.includes('Quantity must be positive')) {
        errorMessage = 'Quantity must be a positive number.'
      }
      
      setError(`Failed to ${isEditing ? 'update' : 'create'} product: ${errorMessage}`)
    } finally {
      setUploading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      data-modal="add-product"
    >
      <div ref={modalRef} className="bg-white rounded-lg max-w-7xl w-full max-h-[95vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit Product' : 'Add New Product'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Page Navigation - Only show for add mode, not edit mode */}
          {!isEditing && (
            <div className="flex justify-center mb-6">
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setCurrentPage('basic')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentPage === 'basic'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Basic Information
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (isBasicInfoComplete()) {
                      setCurrentPage('images')
                    } else {
                      setValidationMessage('Please fill in all required fields before proceeding to images')
                      focusOnFirstErrorField()
                    }
                  }}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentPage === 'images'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Images
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information Page */}
            {currentPage === 'basic' && (
              <>
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

            {/* Price and Special Offer */}
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
                  placeholder="99.99"
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
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

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
                    <option value="">Select ring size</option>
                    <option value="4">4</option>
                    <option value="4.5">4.5</option>
                    <option value="5">5</option>
                    <option value="5.5">5.5</option>
                    <option value="6">6</option>
                    <option value="6.5">6.5</option>
                    <option value="7">7</option>
                    <option value="7.5">7.5</option>
                    <option value="8">8</option>
                    <option value="8.5">8.5</option>
                    <option value="9">9</option>
                    <option value="9.5">9.5</option>
                    <option value="10">10</option>
                    <option value="10.5">10.5</option>
                    <option value="11">11</option>
                    <option value="11.5">11.5</option>
                    <option value="12">12</option>
                    <option value="Adjustable">Adjustable</option>
                    <option value="N/A">N/A</option>
                  </select>
                </div>
              )}

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
                    <option value="">Select chain length</option>
                    <option value="35">35cm (14")</option>
                    <option value="40">40cm (16")</option>
                    <option value="45">45cm (18")</option>
                    <option value="50">50cm (20")</option>
                    <option value="55">55cm (22")</option>
                    <option value="60">60cm (24")</option>
                    <option value="65">65cm (26")</option>
                    <option value="70">70cm (28")</option>
                    <option value="75">75cm (30")</option>
                    <option value="80">80cm (32")</option>
                    <option value="Adjustable">Adjustable</option>
                    <option value="N/A">N/A</option>
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
                          onChange={(e) => {
                            setNewSpecialOfferDescription(e.target.value)
                            setSpecialOfferDescriptionSearchQuery(e.target.value)
                            setShowSpecialOfferDescriptionSuggestions(true)
                          }}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSpecialOfferDescription())}
                          onFocus={() => {
                            setShowSpecialOfferDescriptionSuggestions(true)
                            // Clear search query to show all available descriptions
                            setSpecialOfferDescriptionSearchQuery('')
                            // Ensure we show all available descriptions when focusing
                            if (availableSpecialOfferDescriptions.length === 0) {
                              loadSpecialOfferDescriptions()
                            }
                          }}
                          className="flex-1 min-w-[200px] border-none outline-none bg-transparent"
                          placeholder={formData.specialOfferDescriptions.length === 0 ? "Type to search existing descriptions or create new ones" : ""}
                        />
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={handleAddSpecialOfferDescription}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                            title="Add description"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          {formData.specialOfferDescriptions.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, specialOfferDescriptions: [] }))}
                              className="p-1 text-red-400 hover:text-red-600"
                              title="Clear all descriptions"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* Special Offer Description Suggestions Dropdown */}
                      {showSpecialOfferDescriptionSuggestions && availableSpecialOfferDescriptions.length > 0 && (
                        <div 
                          className="absolute z-[9999] w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto"
                          data-special-offer-dropdown
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex justify-between items-center p-2 border-b border-gray-200 bg-gray-50">
                            <span className="text-sm font-medium text-gray-700">Select descriptions</span>
                            <button
                              type="button"
                              onClick={() => setShowSpecialOfferDescriptionSuggestions(false)}
                              className="text-gray-400 hover:text-gray-600"
                              title="Close dropdown"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div onClick={(e) => e.stopPropagation()}>
                            {availableSpecialOfferDescriptions
                              .filter(desc => !formData.specialOfferDescriptions.includes(desc.name))
                              .map(desc => (
                                <button
                                  key={desc.id}
                                  type="button"
                                  onClick={(e) => {
                                    console.log('=== BUTTON CLICKED ===')
                                    console.log('Event:', e)
                                    console.log('Description:', desc)
                                    e.preventDefault()
                                    e.stopPropagation()
                                    e.nativeEvent.stopImmediatePropagation()
                                    console.log('About to call handleSelectSpecialOfferDescription...')
                                    handleSelectSpecialOfferDescription(desc)
                                  }}
                                  className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
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
                    onFocus={() => {
                      setShowTagSuggestions(true)
                      // Clear search query to show all available tags
                      setTagSearchQuery('')
                      // Ensure we show all available tags when focusing
                      if (availableTags.length === 0) {
                        loadTags()
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Type to search existing tags or create new ones"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                      title="Add tag"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    {formData.tags.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, tags: [] }))}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                        title="Clear all tags"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                
                      {/* Tag Suggestions Dropdown */}
                      {showTagSuggestions && availableTags.length > 0 && (
                        <div 
                          className="absolute z-[9999] w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto"
                          data-tag-dropdown
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex justify-between items-center p-2 border-b border-gray-200 bg-gray-50">
                            <span className="text-sm font-medium text-gray-700">Select tags</span>
                            <button
                              type="button"
                              onClick={() => setShowTagSuggestions(false)}
                              className="text-gray-400 hover:text-gray-600"
                              title="Close dropdown"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div onClick={(e) => e.stopPropagation()}>
                            {availableTags
                              .filter(tag => !formData.tags.includes(tag.name))
                              .map(tag => (
                                <button
                                  key={tag.id}
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    e.nativeEvent.stopImmediatePropagation()
                                    handleSelectTag(tag)
                                  }}
                                  className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                                >
                                  {tag.name}
                                </button>
                              ))}
                          </div>
                        </div>
                      )}
              </div>
              {formData.tags.length === 0 && (
                <p className="text-sm text-red-500 mt-1">At least one tag is required</p>
              )}
            </div>
              </>
            )}

            {/* Images Page */}
            {currentPage === 'images' && (
              <>
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
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
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

            {validationMessage && (
              <div className="flex items-center space-x-2 p-3 bg-orange-50 border border-orange-200 rounded-md">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                <span className="text-sm text-orange-700">{validationMessage}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-md">
                <Check className="w-5 h-5 text-green-500" />
                <span className="text-sm text-green-700">{success}</span>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-between items-center pt-6 border-t">
              <div className="flex space-x-3">
                {currentPage === 'images' && (
                  <button
                    type="button"
                    onClick={() => setCurrentPage('basic')}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    ← Back to Basic Info
                  </button>
                )}
                {(currentPage as string) === 'basic' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      
                      console.log('🔍 Button Click - Validation Check:', isBasicInfoComplete())
                      
                      // ONLY change page if validation passes
                      if (isBasicInfoComplete()) {
                        console.log('✅ Validation passed - changing to Images tab')
                        setCurrentPage('images')
                        setValidationMessage('')
                      } else {
                        console.log('❌ Validation failed - staying on Basic tab')
                        setValidationMessage('Please fill in all required fields before continuing to Images tab')
                        setTimeout(() => setValidationMessage(''), 5000)
                        focusOnFirstErrorField()
                        // DO NOT change currentPage - stay on 'basic'
                      }
                    }}
                    disabled={!isBasicInfoComplete()}
                    className={`px-4 py-2 rounded-md transition-colors ${
                      isBasicInfoComplete()
                        ? 'text-white bg-primary-600 hover:bg-primary-700'
                        : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                    }`}
                    title={!isBasicInfoComplete() ? 'Please fill in all required fields first' : ''}
                  >
                    Continue to Images →
                  </button>
                )}
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || (isEditing && !isBasicInfoComplete())}
                  className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                >
                  {uploading ? (isEditing ? 'Saving...' : 'Creating...') : (isEditing ? 'Save Changes' : 'Create Product')}
                </button>
              </div>
            </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
