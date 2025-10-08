'use client'

import { useState, useRef, useEffect } from 'react'
import { Upload, Eye, Trash2, Check, X, Image as ImageIcon, Play, Pause } from 'lucide-react'
import api from '@/services/api'

interface BackgroundImage {
  id: string
  sectionName: string
  imageName: string
  originalFilename: string
  localUrl?: string
  s3Url?: string
  storageType: string
  fileSize: number
  mimeType: string
  width: number
  height: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface SectionInfo {
  name: string
  displayName: string
  description: string
  recommendedSize: string
  supportsGif: boolean
  previewComponent: string
}

interface BackgroundImageManagerProps {
  sectionName: string
  sectionInfo: SectionInfo
  onImagesChange: (images: BackgroundImage[]) => void
}

export function BackgroundImageManager({ sectionName, sectionInfo, onImagesChange }: BackgroundImageManagerProps) {
  const [images, setImages] = useState<BackgroundImage[]>([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [previewImage, setPreviewImage] = useState<BackgroundImage | null>(null)
  const [isGifPlaying, setIsGifPlaying] = useState(true)
  const [storageStatus, setStorageStatus] = useState<{s3Configured: boolean, storageInfo: string, message: string} | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load images when section changes
  useEffect(() => {
    loadImagesForSection()
    loadStorageStatus()
  }, [sectionName])

  const loadImagesForSection = async () => {
    try {
      setLoading(true)
      console.log('Loading images for section:', sectionName)
      const response = await api.get(`/api/admin/background-images/section/${sectionName}`)
      console.log('Section images response:', response.data)
      setImages(response.data)
      onImagesChange(response.data)
    } catch (error) {
      console.error('Error loading images for section:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStorageStatus = async () => {
    try {
      const response = await api.get('/api/admin/background-images/storage-status')
      console.log('Storage status response:', response.data)
      setStorageStatus(response.data)
    } catch (error) {
      console.error('Error loading storage status:', error)
      setStorageStatus({
        s3Configured: false,
        storageInfo: 'Unknown',
        message: 'Failed to load storage status'
      })
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a valid image file (JPG, PNG, WebP, or GIF)')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('sectionName', sectionName)
      formData.append('file', file)

      console.log('Uploading background image for section:', sectionName)
      const response = await api.post('/api/admin/background-images/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      console.log('Upload response:', response.data)
      
      if (response.data.success) {
        alert('Image uploaded successfully!')
        // Reload images for the section
        await loadImagesForSection()
      } else {
        throw new Error(response.data.message || 'Upload failed')
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Failed to upload image')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleActivateImage = async (imageId: string) => {
    try {
      console.log('Activating background image:', imageId)
      const response = await api.post(`/api/admin/background-images/${imageId}/activate`)
      
      console.log('Activation response:', response.data)
      
      if (response.data.success) {
        alert('Image activated successfully!')
        // Reload images for the section
        await loadImagesForSection()
      } else {
        throw new Error(response.data.message || 'Activation failed')
      }
    } catch (error) {
      console.error('Error activating image:', error)
      alert('Failed to activate image')
    }
  }

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return

    try {
      console.log('Deleting background image:', imageId)
      const response = await api.delete(`/api/admin/background-images/${imageId}`)
      
      console.log('Delete response:', response.data)
      
      if (response.data.success) {
        alert('Image deleted successfully!')
        // Reload images for the section
        await loadImagesForSection()
      } else {
        throw new Error(response.data.message || 'Deletion failed')
      }
    } catch (error: any) {
      console.error('Error deleting image:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete image'
      alert(`Failed to delete image: ${errorMessage}`)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const isGif = (mimeType: string) => mimeType === 'image/gif'

  const getEffectiveUrl = (image: BackgroundImage): string | null => {
    if (image.storageType === 's3' && image.s3Url) {
      return image.s3Url
    } else if (image.storageType === 'hybrid' && image.s3Url) {
      return image.s3Url // Prefer S3 in hybrid mode
    } else if (image.localUrl) {
      return image.localUrl
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Storage Status */}
      {storageStatus && (
        <div className={`rounded-lg p-4 ${
          storageStatus.s3Configured 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-yellow-50 border border-yellow-200'
        }`}>
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-3 ${
              storageStatus.s3Configured ? 'bg-green-500' : 'bg-yellow-500'
            }`}></div>
            <div>
              <h4 className="font-medium text-gray-900">
                {storageStatus.s3Configured ? 'S3 Storage Active' : 'S3 Storage Not Configured'}
              </h4>
              <p className="text-sm text-gray-600">{storageStatus.storageInfo}</p>
              <p className="text-xs text-gray-500">{storageStatus.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Upload New Image</h3>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="w-4 h-4" />
            <span>{uploading ? 'Uploading...' : 'Upload Image'}</span>
          </button>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
          onChange={handleFileUpload}
          className="hidden"
        />
        
        <div className="text-sm text-gray-600">
          <p>Supported formats: JPG, PNG, WebP{sectionInfo.supportsGif ? ', GIF' : ''}</p>
          <p>Maximum file size: 10MB</p>
          <p>Recommended size: {sectionInfo.recommendedSize}</p>
          {storageStatus && !storageStatus.s3Configured && (
            <p className="text-yellow-600 font-medium">⚠️ S3 not configured - files will be stored locally only</p>
          )}
        </div>
      </div>

      {/* Images Grid */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Background Images</h3>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
            <span className="ml-2 text-gray-600">Loading images...</span>
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No images uploaded</h4>
            <p className="text-gray-600">Upload your first background image to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((image) => (
              <div
                key={image.id}
                className={`relative border-2 rounded-lg overflow-hidden ${
                  image.isActive ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
                }`}
              >
                {/* Image Preview */}
                <div className="aspect-video bg-gray-100 relative">
                  {getEffectiveUrl(image) ? (
                    <img
                      src={getEffectiveUrl(image)}
                      alt={image.originalFilename}
                      className="w-full h-full object-cover"
                      style={{
                        animationPlayState: isGif(image.mimeType) && isGifPlaying ? 'running' : 'paused'
                      }}
                      onError={(e) => {
                        console.error('Image failed to load:', getEffectiveUrl(image))
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Active Badge */}
                  {image.isActive && (
                    <div className="absolute top-2 left-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-600 text-white">
                        <Check className="w-3 h-3 mr-1" />
                        Active
                      </span>
                    </div>
                  )}
                  
                  {/* GIF Play/Pause Button */}
                  {isGif(image.mimeType) && (
                    <button
                      onClick={() => setIsGifPlaying(!isGifPlaying)}
                      className="absolute top-2 right-2 p-1 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75"
                    >
                      {isGifPlaying ? (
                        <Pause className="w-3 h-3" />
                      ) : (
                        <Play className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </div>
                
                {/* Image Info */}
                <div className="p-3">
                  <h4 className="font-medium text-gray-900 truncate">{image.originalFilename}</h4>
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>{image.width} × {image.height}px</p>
                    <p>{formatFileSize(image.fileSize)}</p>
                    <p className="capitalize">{image.mimeType.split('/')[1]}</p>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="absolute bottom-2 right-2 flex space-x-1">
                  <button
                    onClick={() => setPreviewImage(image)}
                    className="p-1 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75"
                    title="Preview"
                  >
                    <Eye className="w-3 h-3" />
                  </button>
                  
                  {!image.isActive && (
                    <button
                      onClick={() => handleActivateImage(image.id)}
                      className="p-1 bg-green-600 text-white rounded-full hover:bg-green-700"
                      title="Activate"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleDeleteImage(image.id)}
                    className="p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Image Preview</h3>
              <div className="flex items-center space-x-2">
                {isGif(previewImage.mimeType) && (
                  <button
                    onClick={() => setIsGifPlaying(!isGifPlaying)}
                    className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full"
                    title={isGifPlaying ? 'Pause GIF' : 'Play GIF'}
                  >
                    {isGifPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </button>
                )}
                <button
                  onClick={() => setPreviewImage(null)}
                  className="p-1 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-4">
              <img
                src={getEffectiveUrl(previewImage) || ''}
                alt={previewImage.originalFilename}
                className="max-w-full max-h-[70vh] object-contain mx-auto"
                style={{
                  animationPlayState: isGif(previewImage.mimeType) && isGifPlaying ? 'running' : 'paused'
                }}
              />
              
              <div className="mt-4 text-sm text-gray-600">
                <p><strong>Filename:</strong> {previewImage.originalFilename}</p>
                <p><strong>Size:</strong> {previewImage.width} × {previewImage.height}px</p>
                <p><strong>File Size:</strong> {formatFileSize(previewImage.fileSize)}</p>
                <p><strong>Type:</strong> {previewImage.mimeType}</p>
                <p><strong>Status:</strong> {previewImage.isActive ? 'Active' : 'Inactive'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
