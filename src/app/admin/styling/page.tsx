'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { BackgroundImageManager } from '@/components/admin/BackgroundImageManager'
import { HeroSliderManager } from '@/components/admin/HeroSliderManager'
import { PackagingImageUploader } from '@/components/admin/PackagingImageUploader'
import { Palette, Image, Upload, Eye, Trash2, Check, Trash, Settings, Paintbrush, Package } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'
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

interface SectionStyle {
  id: string
  sectionName: string
  backgroundImageUrl?: string
  backgroundColor?: string
  textColor?: string
  overlayColor?: string
  overlayOpacity?: number
  backgroundSize?: string
  backgroundPosition?: string
  backgroundRepeat?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

const SECTIONS: SectionInfo[] = [
  {
    name: 'hero',
    displayName: 'Hero Banner',
    description: 'Main banner at the top of the homepage',
    recommendedSize: '1920x1080px',
    supportsGif: true,
    previewComponent: 'hero'
  },
  {
    name: 'navigation',
    displayName: 'Navigation Bar',
    description: 'Background for the main navigation',
    recommendedSize: '1920x80px',
    supportsGif: false,
    previewComponent: 'navigation'
  },
  {
    name: 'featured_products',
    displayName: 'Featured Products',
    description: 'Background for the featured products section',
    recommendedSize: '1920x600px',
    supportsGif: true,
    previewComponent: 'featured_products'
  },
  {
    name: 'testimonials',
    displayName: 'Testimonials',
    description: 'Background for customer testimonials',
    recommendedSize: '1920x500px',
    supportsGif: false,
    previewComponent: 'testimonials'
  },
  {
    name: 'footer',
    displayName: 'Footer',
    description: 'Background for the footer section',
    recommendedSize: '1920x300px',
    supportsGif: false,
    previewComponent: 'footer'
  },
  {
    name: 'about',
    displayName: 'About Section',
    description: 'Background for the about us section',
    recommendedSize: '1920x700px',
    supportsGif: true,
    previewComponent: 'about'
  },
  {
    name: 'contact',
    displayName: 'Contact Section',
    description: 'Background for the contact section',
    recommendedSize: '1920x600px',
    supportsGif: false,
    previewComponent: 'contact'
  },
  {
    name: 'story_craftsmanship',
    displayName: 'Story: Craftsmanship',
    description: 'Image for the craftsmanship story section (alternating layout)',
    recommendedSize: '1200x900px',
    supportsGif: false,
    previewComponent: 'story'
  },
  {
    name: 'story_materials',
    displayName: 'Story: Materials & Inspiration',
    description: 'Image for the materials and inspiration story section (alternating layout)',
    recommendedSize: '1200x900px',
    supportsGif: false,
    previewComponent: 'story'
  },
  {
    name: 'story_personal',
    displayName: 'Story: Personal Connection',
    description: 'Image for the personal connection story section (alternating layout)',
    recommendedSize: '1200x900px',
    supportsGif: false,
    previewComponent: 'story'
  },
  {
    name: 'story_explore',
    displayName: 'Story: Explore Collection',
    description: 'Image for the explore collection story section and visual carousel',
    recommendedSize: '1920x1080px',
    supportsGif: false,
    previewComponent: 'story'
  },
  {
    name: 'story_craftsmanship_bg',
    displayName: 'Story: Craftsmanship Background',
    description: 'Light background image for the craftsmanship story section',
    recommendedSize: '1920x1080px',
    supportsGif: false,
    previewComponent: 'background'
  },
  {
    name: 'story_materials_bg',
    displayName: 'Story: Materials Background',
    description: 'Light background image for the materials story section',
    recommendedSize: '1920x1080px',
    supportsGif: false,
    previewComponent: 'background'
  },
  {
    name: 'story_personal_bg',
    displayName: 'Story: Personal Connection Background',
    description: 'Light background image for the personal connection story section',
    recommendedSize: '1920x1080px',
    supportsGif: false,
    previewComponent: 'background'
  },
  {
    name: 'story_explore_bg',
    displayName: 'Story: Explore Collection Background',
    description: 'Light background image for the explore collection story section',
    recommendedSize: '1920x1080px',
    supportsGif: false,
    previewComponent: 'background'
  },
  {
    name: 'washi_texture',
    displayName: 'Washi Paper Texture',
    description: 'Background texture image for the hero section (washi paper texture overlay)',
    recommendedSize: '400x400px',
    supportsGif: false,
    previewComponent: 'texture'
  }
]

export default function AdminStylingPage() {
  const { t } = useTranslation()
  const [selectedSection, setSelectedSection] = useState<string>('hero')
  const [backgroundImages, setBackgroundImages] = useState<BackgroundImage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [activeTab, setActiveTab] = useState<'images' | 'slider' | 'styles' | 'packaging'>('images')
  const [fontFamily, setFontFamily] = useState<string>('')

  useEffect(() => {
    loadBackgroundImages()
    loadFontFamily()
  }, [])
  
  const loadFontFamily = async () => {
    try {
      const response = await api.get('/api/public/system-config/app.typography.fontFamily')
      if (response.data?.value) {
        setFontFamily(response.data.value)
      }
    } catch (error) {
      console.error('Failed to load font family:', error)
    }
  }

  const loadBackgroundImages = async () => {
    try {
      setLoading(true)
      console.log('Loading background images...')
      const response = await api.get('/api/admin/background-images')
      console.log('Background images response:', response.data)
      setBackgroundImages(response.data)
    } catch (err) {
      setError('Failed to load background images')
      console.error('Error loading background images:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleClearAllImages = async () => {
    try {
      setIsClearing(true)
      const response = await api.delete('/api/admin/storage/clear/backgrounds')
      
      if (response.data.success) {
        alert(`Successfully cleared all background images!\n\n${response.data.result.message}`)
        // Reload background images
        await loadBackgroundImages()
      } else {
        alert(`Failed to clear images: ${response.data.message}`)
      }
    } catch (error) {
      console.error('Error clearing background images:', error)
      alert('Failed to clear background images')
    } finally {
      setIsClearing(false)
      setShowClearConfirm(false)
    }
  }

  const selectedSectionInfo = SECTIONS.find(s => s.name === selectedSection)

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <Palette className="w-8 h-8 text-primary-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t('admin.styling.title') || 'Shop Styling'}</h1>
              <p className="text-gray-600">{t('admin.styling.description') || 'Customize your shop\'s visual appearance with background images'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setShowClearConfirm(true)}
              className="btn btn-danger flex items-center space-x-2"
              disabled={isClearing}
            >
              <Trash className="w-5 h-5" />
              <span>{isClearing ? 'Clearing...' : 'Clear All Images'}</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('images')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'images'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Image className="w-4 h-4" />
                  <span>Background Images</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('slider')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'slider'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Settings className="w-4 h-4" />
                  <span>Hero Slider</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('styles')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'styles'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Paintbrush className="w-4 h-4" />
                  <span>Section Styles</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('packaging')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'packaging'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Package className="w-4 h-4" />
                  <span>Packaging</span>
                </div>
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'images' ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Section Selector */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sections</h3>
                <div className="space-y-2">
                  {SECTIONS.map((section) => (
                    <button
                      key={section.name}
                      onClick={() => setSelectedSection(section.name)}
                      className={`w-full text-left p-3 rounded-md transition-colors ${
                        selectedSection === section.name
                          ? 'bg-primary-100 text-primary-700 border-2 border-primary-300'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-2 border-transparent'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Image className="w-4 h-4" />
                        <span className="font-medium">{section.displayName}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{section.description}</p>
                      {section.supportsGif && (
                        <span className="inline-block text-xs bg-green-100 text-green-700 px-2 py-1 rounded mt-1">
                          Supports GIF
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {selectedSectionInfo && (
                <div className="space-y-6">
                  {/* Section Info */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                          {selectedSectionInfo.displayName}
                        </h2>
                        <p className="text-gray-600">{selectedSectionInfo.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Recommended Size</p>
                        <p className="font-medium text-gray-900">{selectedSectionInfo.recommendedSize}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Image className="w-4 h-4" />
                        <span>JPG, PNG, WebP</span>
                      </div>
                      {selectedSectionInfo.supportsGif && (
                        <div className="flex items-center space-x-1">
                          <Check className="w-4 h-4 text-green-600" />
                          <span className="text-green-600">GIF supported</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Background Image Manager */}
                  <BackgroundImageManager
                    sectionName={selectedSection}
                    sectionInfo={selectedSectionInfo}
                    onImagesChange={setBackgroundImages}
                  />
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'slider' ? (
          /* Hero Slider Configuration */
          <HeroSliderManager />
        ) : activeTab === 'packaging' ? (
          /* Packaging Images Configuration */
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Packaging Images</h3>
            <p className="text-gray-600 mb-6">
              Upload images for Standard and Premium packaging options displayed in checkout.
            </p>
            
            <div className="space-y-8">
              {/* Standard Packaging */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">Standard Packaging</h4>
                <PackagingImageUploader 
                  configKey="packaging.standard.image" 
                  label="Standard Packaging Image"
                  recommendedSize="200x200px"
                />
              </div>
              
              {/* Premium Packaging */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">Premium Packaging</h4>
                <PackagingImageUploader 
                  configKey="packaging.premium.image" 
                  label="Premium Packaging Image"
                  recommendedSize="200x200px"
                />
              </div>
            </div>
          </div>
        ) : (
          /* Section Styles Configuration */
          <div className="space-y-6">
            {/* Global Typography Settings */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Global Typography</h3>
              <p className="text-gray-600 mb-6">
                Configure global font family settings that apply across the entire shop.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Font Family
                  </label>
                  <input
                    type="text"
                    id="fontFamily"
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    onBlur={async (e) => {
                      try {
                        await api.post('/api/admin/config', {
                          configKey: 'app.typography.fontFamily',
                          configValue: e.target.value,
                          description: 'Global font family for the entire shop',
                          isActive: true
                        })
                        alert('Font family updated successfully!')
                      } catch (error) {
                        console.error('Error saving font family:', error)
                        alert('Failed to save font family')
                      }
                    }}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Enter CSS font-family values (e.g., "SyndicatGrotesk", Arial, Helvetica, sans-serif)
                  </p>
                </div>
              </div>
            </div>

            {/* Section Styles Configuration */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Section Styles</h3>
              <p className="text-gray-600 mb-6">
                Configure colors, opacity, and styling for different sections of your shop.
              </p>
            
              <div className="space-y-6">
              {SECTIONS.map((section) => (
                <div key={section.name} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-md font-medium text-gray-900 mb-3">{section.displayName}</h4>
                  <p className="text-sm text-gray-600 mb-4">{section.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Background Color */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Background Color
                      </label>
                      <input
                        type="color"
                        className="w-full h-10 border border-gray-300 rounded-md"
                        defaultValue="#ffffff"
                      />
                    </div>
                    
                    {/* Text Color */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Text Color
                      </label>
                      <input
                        type="color"
                        className="w-full h-10 border border-gray-300 rounded-md"
                        defaultValue="#000000"
                      />
                    </div>
                    
                    {/* Overlay Color */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Overlay Color
                      </label>
                      <input
                        type="color"
                        className="w-full h-10 border border-gray-300 rounded-md"
                        defaultValue="#000000"
                      />
                    </div>
                    
                    {/* Overlay Opacity */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Overlay Opacity
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        className="w-full"
                        defaultValue="0.3"
                      />
                      <div className="text-xs text-gray-500 mt-1">0.3</div>
                    </div>
                    
                    {/* Background Size */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Background Size
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                        <option value="cover">Cover</option>
                        <option value="contain">Contain</option>
                        <option value="auto">Auto</option>
                      </select>
                    </div>
                    
                    {/* Background Position */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Background Position
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                        <option value="center">Center</option>
                        <option value="top">Top</option>
                        <option value="bottom">Bottom</option>
                        <option value="left">Left</option>
                        <option value="right">Right</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-end">
                    <button className="btn btn-primary">
                      Save Changes
                    </button>
                  </div>
                </div>
              ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Clear All Images Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <Trash className="w-6 h-6 text-red-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Clear All Background Images</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to clear ALL background images from storage? This action cannot be undone and will permanently delete all images from the backgrounds folder in your S3 bucket or local storage.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                  disabled={isClearing}
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearAllImages}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                  disabled={isClearing}
                >
                  {isClearing ? 'Clearing...' : 'Clear All Images'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
