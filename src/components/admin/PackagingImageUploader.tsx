'use client'

import { useState, useRef, useEffect } from 'react'
import { Upload, X, Check } from 'lucide-react'
import api from '@/services/api'

interface PackagingImageUploaderProps {
  configKey: string
  label: string
  recommendedSize: string
}

export function PackagingImageUploader({ configKey, label, recommendedSize }: PackagingImageUploaderProps) {
  const [currentImageUrl, setCurrentImageUrl] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load current image URL from system config
  useEffect(() => {
    const loadCurrentImage = async () => {
      try {
        const response = await api.get(`/api/public/system-config/${configKey}`)
        console.log('Loaded packaging image config:', configKey, response.data)
        if (response.data?.value && response.data.value.trim() !== '') {
          setCurrentImageUrl(response.data.value)
        } else {
          setCurrentImageUrl('')
        }
      } catch (error) {
        console.error('Failed to load current image:', error)
        setCurrentImageUrl('')
      }
    }
    loadCurrentImage()
  }, [configKey])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      return
    }

    setUploading(true)
    setError(null)
    setSuccess(false)

    try {
      // Upload file to S3 in packaging folder
      const formData = new FormData()
      formData.append('file', file)
      formData.append('configKey', configKey)
      
      // Upload to packaging folder
      const uploadResponse = await api.post('/api/admin/upload/packaging', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      const imageUrl = uploadResponse.data.url || uploadResponse.data.s3Url

      if (!imageUrl) {
        throw new Error('Upload succeeded but no URL returned')
      }

      // Backend automatically saves to system config, so just update local state
      setCurrentImageUrl(imageUrl)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      
      // Reload from system config to ensure it's saved
      setTimeout(async () => {
        try {
          const response = await api.get(`/api/public/system-config/${configKey}`)
          if (response.data?.value && response.data.value.trim() !== '') {
            setCurrentImageUrl(response.data.value)
          }
        } catch (error) {
          console.error('Failed to reload image after upload:', error)
        }
      }, 500)
    } catch (err: any) {
      console.error('Failed to upload packaging image:', err)
      setError(err.response?.data?.message || err.message || 'Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = async () => {
    if (!currentImageUrl) return
    
    try {
      setError(null)
      // Delete from S3 and clear config
      await api.delete('/api/admin/upload/packaging', {
        params: { configKey }
      })

      setCurrentImageUrl('')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      console.error('Failed to remove image:', err)
      setError(err.response?.data?.message || err.message || 'Failed to remove image')
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
        <p className="text-xs text-gray-500 mb-4">Recommended size: {recommendedSize}</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md flex items-center gap-2">
          <Check className="w-4 h-4 text-green-600" />
          <p className="text-sm text-green-700">Image updated successfully!</p>
        </div>
      )}

      {/* Current Image Preview */}
      <div className="relative">
        {currentImageUrl ? (
          <>
            <div className="relative w-48 h-48 border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-100 shadow-md">
              <img
                src={currentImageUrl}
                alt={label}
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error('Failed to load image:', currentImageUrl)
                  setError('Failed to load image. URL might be invalid. Please re-upload.')
                  setCurrentImageUrl('')
                }}
                onLoad={() => {
                  setError(null)
                }}
                unoptimized
              />
              <button
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-md z-10"
                aria-label="Remove image"
                title="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500 break-all max-w-md">{currentImageUrl}</p>
          </>
        ) : (
          <div className="w-48 h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-gray-50">
            <Upload className="w-8 h-8 text-gray-400 mb-2" />
            <span className="text-sm text-gray-400 text-center px-2">No image uploaded</span>
          </div>
        )}
      </div>

      {/* Upload Section */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileUpload}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Upload className="w-4 h-4" />
          <span>{uploading ? 'Uploading...' : currentImageUrl ? 'Change Image' : 'Upload Image'}</span>
        </button>
        <p className="text-xs text-gray-500 mt-2">Supported: JPG, PNG, WebP. Max 10MB</p>
      </div>
    </div>
  )
}

