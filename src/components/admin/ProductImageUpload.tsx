'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, X, Image as ImageIcon, Check, AlertCircle, Loader2 } from 'lucide-react'
import { Product } from '@/types'

interface ProductImageUploadProps {
  product: Product
  onImagesUploaded?: (images: any[]) => void
}

interface UploadedImage {
  id: string
  url: string
  altText: string
  isPrimary: boolean
  sortOrder: number
}

export function ProductImageUpload({ product, onImagesUploaded }: ProductImageUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleFiles = async (files: File[]) => {
    setError(null)
    setSuccess(null)
    setUploading(true)

    try {
      // Validate files
      const validFiles = files.filter(file => {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
        const maxSize = 10 * 1024 * 1024 // 10MB
        
        if (!validTypes.includes(file.type)) {
          setError(`Invalid file type: ${file.name}. Only JPG, PNG, WEBP, and GIF are allowed. WebP is recommended for best performance.`)
          return false
        }
        
        if (file.size > maxSize) {
          setError(`File too large: ${file.name}. Maximum size is 10MB.`)
          return false
        }
        
        return true
      })

      if (validFiles.length === 0) {
        setUploading(false)
        return
      }

      // Upload files one by one
      const uploadedImages: UploadedImage[] = []
      
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i]
        const formData = new FormData()
        formData.append('file', file)
        formData.append('altText', `${product.name} - Image ${i + 1}`)
        formData.append('isPrimary', i === 0 ? 'true' : 'false')

        const response = await fetch(`/api/admin/upload-product-image/${product.id}`, {
          method: 'POST',
          body: formData,
          credentials: 'include'
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Upload failed: ${response.status} ${errorText}`)
        }

        const result = await response.json()
        
        if (result.success) {
          uploadedImages.push(result.image)
        } else {
          throw new Error(result.message || 'Upload failed')
        }
      }

      setUploadedImages(prev => [...prev, ...uploadedImages])
      setSuccess(`Successfully uploaded ${uploadedImages.length} image(s)`)
      onImagesUploaded?.(uploadedImages)
    } catch (err) {
      setError('Upload failed: ' + (err as Error).message)
    } finally {
      setUploading(false)
    }
  }

  const uploadSingleImage = async (file: File, altText: string, isPrimary: boolean = false) => {
    setError(null)
    setSuccess(null)
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('altText', altText)
      formData.append('isPrimary', isPrimary.toString())

      const response = await fetch(`/api/admin/upload-product-image/${product.id}`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })

      const result = await response.json()

      if (result.success) {
        setUploadedImages(prev => [...prev, result.image])
        setSuccess('Image uploaded successfully')
        onImagesUploaded?.([result.image])
      } else {
        setError(result.message || 'Upload failed')
      }
    } catch (err) {
      setError('Upload failed: ' + (err as Error).message)
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (imageId: string) => {
    setUploadedImages(prev => prev.filter(img => img.id !== imageId))
  }

  const setPrimaryImage = (imageId: string) => {
    setUploadedImages(prev => 
      prev.map(img => ({ ...img, isPrimary: img.id === imageId }))
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Product Images</h3>
        <p className="text-sm text-gray-600">
          Upload high-quality images for {product.name}. Drag and drop multiple files or click to select.
        </p>
      </div>

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
            {uploading ? (
              <Loader2 className="w-full h-full animate-spin" />
            ) : (
              <Upload className="w-full h-full" />
            )}
          </div>
          
          <div>
            <p className="text-lg font-medium text-gray-900">
              {uploading ? 'Uploading...' : 'Drop images here or click to upload'}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              WebP, JPG, PNG, GIF up to 10MB each
            </p>
            <p className="text-xs text-blue-600 mt-1">
              💡 WebP recommended for best compression and performance
            </p>
          </div>
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="btn btn-primary disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Choose Files'}
          </button>
        </div>
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

      {/* Uploaded Images Preview */}
      {uploadedImages.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900">Uploaded Images</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {uploadedImages.map((image, index) => (
              <div key={image.id} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={image.url}
                    alt={image.altText}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Image Actions */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => removeImage(image.id)}
                    className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
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

      {/* Storage Info */}
      <div className="text-xs text-gray-500">
        Images are stored in AWS S3 and will be automatically optimized for web display.
      </div>
    </div>
  )
}
