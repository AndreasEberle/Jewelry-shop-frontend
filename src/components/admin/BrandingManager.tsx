'use client'

import { useState, useEffect } from 'react'
import { Upload, Image as ImageIcon, Type, Palette, RotateCcw, Save } from 'lucide-react'
import api from '@/services/api'

interface BrandingConfig {
  id: string
  logoUrl?: string
  logoAltText?: string
  logoWidth?: number
  logoHeight?: number
  faviconUrl?: string
  faviconType?: string
  faviconSize?: number
  shopName: string
  shopNameFontFamily?: string
  shopNameFontSize?: number
  shopNameFontWeight?: string
  shopNameFontStyle?: string
  shopNameTextColor?: string
  shopNameTextDecoration?: string
  shopNameLetterSpacing?: number
  shopNameLineHeight?: number
  tagline?: string
  taglineFontSize?: number
  taglineTextColor?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export function BrandingManager() {
  const [config, setConfig] = useState<BrandingConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'logo' | 'favicon' | 'text' | 'preview'>('logo')

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      setLoading(true)
      const response = await api.get('/api/admin/branding/config')
      setConfig(response.data)
    } catch (error) {
      console.error('Error loading branding config:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateConfig = async (updates: Partial<BrandingConfig>) => {
    if (!config) return

    try {
      setSaving(true)
      const updatedConfig = { ...config, ...updates }
      const response = await api.put('/api/admin/branding/config', updatedConfig)
      
      if (response.data.success) {
        setConfig(response.data.config)
        alert('Branding configuration updated successfully!')
      } else {
        throw new Error(response.data.message || 'Update failed')
      }
    } catch (error: any) {
      console.error('Error updating config:', error)
      alert(`Failed to update configuration: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const resetToDefault = async () => {
    if (!confirm('Are you sure you want to reset all branding settings to default?')) return

    try {
      setSaving(true)
      const response = await api.post('/api/admin/branding/reset')
      
      if (response.data.success) {
        setConfig(response.data.config)
        alert('Branding configuration reset to default!')
      } else {
        throw new Error(response.data.message || 'Reset failed')
      }
    } catch (error: any) {
      console.error('Error resetting config:', error)
      alert(`Failed to reset configuration: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // For now, we'll just use a placeholder URL
    // In a real implementation, you'd upload to your storage service
    const logoUrl = URL.createObjectURL(file)
    await updateConfig({ 
      logoUrl,
      logoAltText: file.name.split('.')[0],
      logoWidth: 120,
      logoHeight: 40
    })
  }

  const handleFaviconUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // For now, we'll just use a placeholder URL
    // In a real implementation, you'd upload to your storage service
    const faviconUrl = URL.createObjectURL(file)
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'ico'
    const faviconType = fileExtension === 'ico' ? 'ico' : fileExtension
    
    await updateConfig({ 
      faviconUrl,
      faviconType,
      faviconSize: 32
    })
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
          <span className="ml-2 text-gray-600">Loading configuration...</span>
        </div>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12">
          <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">Configuration Not Found</h4>
          <p className="text-gray-600">Unable to load branding configuration</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('logo')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'logo'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <ImageIcon className="w-4 h-4" />
              <span>Logo</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('favicon')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'favicon'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <ImageIcon className="w-4 h-4" />
              <span>Favicon</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('text')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'text'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Type className="w-4 h-4" />
              <span>Text & Typography</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'preview'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Palette className="w-4 h-4" />
              <span>Preview</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Logo Configuration */}
      {activeTab === 'logo' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Logo Configuration</h3>
            
            <div className="space-y-4">
              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo Image
                </label>
                <div className="flex items-center space-x-4">
                  {config.logoUrl ? (
                    <img
                      src={config.logoUrl}
                      alt={config.logoAltText || 'Logo'}
                      className="w-24 h-8 object-contain border border-gray-200 rounded"
                    />
                  ) : (
                    <div className="w-24 h-8 border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
                      <ImageIcon className="w-4 h-4 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label
                      htmlFor="logo-upload"
                      className="cursor-pointer inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {config.logoUrl ? 'Change Logo' : 'Upload Logo'}
                    </label>
                  </div>
                </div>
              </div>

              {/* Logo Alt Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alt Text
                </label>
                <input
                  type="text"
                  value={config.logoAltText || ''}
                  onChange={(e) => updateConfig({ logoAltText: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Logo description for accessibility"
                />
              </div>

              {/* Logo Dimensions */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Width (px)
                  </label>
                  <input
                    type="number"
                    value={config.logoWidth || ''}
                    onChange={(e) => updateConfig({ logoWidth: parseInt(e.target.value) || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="120"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Height (px)
                  </label>
                  <input
                    type="number"
                    value={config.logoHeight || ''}
                    onChange={(e) => updateConfig({ logoHeight: parseInt(e.target.value) || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="40"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Favicon Configuration */}
      {activeTab === 'favicon' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Favicon Configuration</h3>
            <p className="text-sm text-gray-600 mb-6">
              The favicon appears in browser tabs, bookmarks, and browser history. 
              Recommended formats: ICO (16x16, 32x32), PNG (16x16, 32x32), or SVG.
            </p>
            
            <div className="space-y-4">
              {/* Favicon Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Favicon Image
                </label>
                <div className="flex items-center space-x-4">
                  {config.faviconUrl ? (
                    <div className="flex items-center space-x-2">
                      <img
                        src={config.faviconUrl}
                        alt="Favicon"
                        className="w-8 h-8 object-contain border border-gray-200 rounded"
                      />
                      <span className="text-sm text-gray-500">
                        {config.faviconType?.toUpperCase()} • {config.faviconSize}x{config.faviconSize}px
                      </span>
                    </div>
                  ) : (
                    <div className="w-8 h-8 border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
                      <ImageIcon className="w-4 h-4 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <input
                      type="file"
                      accept=".ico,.png,.svg,.jpg,.jpeg"
                      onChange={handleFaviconUpload}
                      className="hidden"
                      id="favicon-upload"
                    />
                    <label
                      htmlFor="favicon-upload"
                      className="cursor-pointer inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {config.faviconUrl ? 'Change Favicon' : 'Upload Favicon'}
                    </label>
                  </div>
                </div>
              </div>

              {/* Favicon Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Favicon Type
                </label>
                <select
                  value={config.faviconType || 'ico'}
                  onChange={(e) => updateConfig({ faviconType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="ico">ICO (Icon)</option>
                  <option value="png">PNG</option>
                  <option value="svg">SVG</option>
                  <option value="jpg">JPG</option>
                  <option value="jpeg">JPEG</option>
                </select>
              </div>

              {/* Favicon Size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Favicon Size (px)
                </label>
                <select
                  value={config.faviconSize || 32}
                  onChange={(e) => updateConfig({ faviconSize: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value={16}>16x16 (Standard)</option>
                  <option value={32}>32x32 (High DPI)</option>
                  <option value={48}>48x48 (Large)</option>
                  <option value={64}>64x64 (Extra Large)</option>
                </select>
              </div>

              {/* Current Favicon Preview */}
              {config.faviconUrl && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Current Favicon Preview</h4>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <img
                        src={config.faviconUrl}
                        alt="Favicon preview"
                        className="w-4 h-4 object-contain"
                      />
                      <span className="text-sm text-gray-600">16x16</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <img
                        src={config.faviconUrl}
                        alt="Favicon preview"
                        className="w-6 h-6 object-contain"
                      />
                      <span className="text-sm text-gray-600">24x24</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <img
                        src={config.faviconUrl}
                        alt="Favicon preview"
                        className="w-8 h-8 object-contain"
                      />
                      <span className="text-sm text-gray-600">32x32</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    This is how your favicon will appear in different contexts
                  </p>
                </div>
              )}

              {/* Favicon Information */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Favicon Best Practices</h4>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• Use ICO format for maximum browser compatibility</li>
                  <li>• Include multiple sizes (16x16, 32x32) in ICO files</li>
                  <li>• Keep designs simple and recognizable at small sizes</li>
                  <li>• Use high contrast colors for better visibility</li>
                  <li>• Test in different browsers and devices</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Text Configuration */}
      {activeTab === 'text' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Shop Name & Typography</h3>
            
            <div className="space-y-4">
              {/* Shop Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shop Name
                </label>
                <input
                  type="text"
                  value={config.shopName}
                  onChange={(e) => updateConfig({ shopName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="JewelryShop"
                />
              </div>

              {/* Font Family */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Font Family
                </label>
                <select
                  value={config.shopNameFontFamily || 'Inter'}
                  onChange={(e) => updateConfig({ shopNameFontFamily: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="Inter">Inter</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Open Sans">Open Sans</option>
                  <option value="Lato">Lato</option>
                  <option value="Montserrat">Montserrat</option>
                  <option value="Poppins">Poppins</option>
                  <option value="Arial">Arial</option>
                  <option value="Helvetica">Helvetica</option>
                </select>
              </div>

              {/* Font Size and Weight */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Font Size (px)
                  </label>
                  <input
                    type="number"
                    value={config.shopNameFontSize || 24}
                    onChange={(e) => updateConfig({ shopNameFontSize: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    min="12"
                    max="72"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Font Weight
                  </label>
                  <select
                    value={config.shopNameFontWeight || 'bold'}
                    onChange={(e) => updateConfig({ shopNameFontWeight: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="normal">Normal</option>
                    <option value="bold">Bold</option>
                    <option value="100">100</option>
                    <option value="200">200</option>
                    <option value="300">300</option>
                    <option value="400">400</option>
                    <option value="500">500</option>
                    <option value="600">600</option>
                    <option value="700">700</option>
                    <option value="800">800</option>
                    <option value="900">900</option>
                  </select>
                </div>
              </div>

              {/* Font Style and Color */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Font Style
                  </label>
                  <select
                    value={config.shopNameFontStyle || 'normal'}
                    onChange={(e) => updateConfig({ shopNameFontStyle: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="normal">Normal</option>
                    <option value="italic">Italic</option>
                    <option value="oblique">Oblique</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Text Color
                  </label>
                  <input
                    type="color"
                    value={config.shopNameTextColor || '#2563eb'}
                    onChange={(e) => updateConfig({ shopNameTextColor: e.target.value })}
                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Text Decoration and Spacing */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Text Decoration
                  </label>
                  <select
                    value={config.shopNameTextDecoration || 'none'}
                    onChange={(e) => updateConfig({ shopNameTextDecoration: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="none">None</option>
                    <option value="underline">Underline</option>
                    <option value="overline">Overline</option>
                    <option value="line-through">Line Through</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Letter Spacing (px)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={config.shopNameLetterSpacing || 0}
                    onChange={(e) => updateConfig({ shopNameLetterSpacing: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Line Height
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={config.shopNameLineHeight || 1.2}
                    onChange={(e) => updateConfig({ shopNameLineHeight: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Tagline */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tagline
                </label>
                <input
                  type="text"
                  value={config.tagline || ''}
                  onChange={(e) => updateConfig({ tagline: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Premium Jewelry Collection"
                />
              </div>

              {/* Tagline Styling */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tagline Font Size (px)
                  </label>
                  <input
                    type="number"
                    value={config.taglineFontSize || 14}
                    onChange={(e) => updateConfig({ taglineFontSize: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    min="10"
                    max="24"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tagline Color
                  </label>
                  <input
                    type="color"
                    value={config.taglineTextColor || '#6b7280'}
                    onChange={(e) => updateConfig({ taglineTextColor: e.target.value })}
                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview */}
      {activeTab === 'preview' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Preview</h3>
            
            <div className="space-y-6">
              {/* Header Preview */}
              <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                <h4 className="text-sm font-medium text-gray-700 mb-4">Header Preview</h4>
                <div className="flex items-center space-x-4">
                  {/* Logo Preview */}
                  {config.logoUrl ? (
                    <img
                      src={config.logoUrl}
                      alt={config.logoAltText || 'Logo'}
                      style={{
                        width: config.logoWidth ? `${config.logoWidth}px` : 'auto',
                        height: config.logoHeight ? `${config.logoHeight}px` : 'auto',
                      }}
                      className="object-contain"
                    />
                  ) : (
                    <div className="flex items-center">
                      <span
                        style={{
                          fontFamily: config.shopNameFontFamily || 'Inter',
                          fontSize: `${config.shopNameFontSize || 24}px`,
                          fontWeight: config.shopNameFontWeight || 'bold',
                          fontStyle: config.shopNameFontStyle || 'normal',
                          color: config.shopNameTextColor || '#2563eb',
                          textDecoration: config.shopNameTextDecoration || 'none',
                          letterSpacing: `${config.shopNameLetterSpacing || 0}px`,
                          lineHeight: config.shopNameLineHeight || 1.2,
                        }}
                      >
                        {config.shopName}
                      </span>
                    </div>
                  )}
                  
                  {/* Tagline Preview */}
                  {config.tagline && (
                    <div className="flex flex-col">
                      <span
                        style={{
                          fontSize: `${config.taglineFontSize || 14}px`,
                          color: config.taglineTextColor || '#6b7280',
                        }}
                      >
                        {config.tagline}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Favicon Preview */}
              {config.faviconUrl && (
                <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                  <h4 className="text-sm font-medium text-gray-700 mb-4">Favicon Preview</h4>
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <img
                        src={config.faviconUrl}
                        alt="Favicon preview"
                        className="w-4 h-4 object-contain"
                      />
                      <span className="text-sm text-gray-600">Browser Tab (16x16)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <img
                        src={config.faviconUrl}
                        alt="Favicon preview"
                        className="w-6 h-6 object-contain"
                      />
                      <span className="text-sm text-gray-600">Bookmarks (24x24)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <img
                        src={config.faviconUrl}
                        alt="Favicon preview"
                        className="w-8 h-8 object-contain"
                      />
                      <span className="text-sm text-gray-600">High DPI (32x32)</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Type: {config.faviconType?.toUpperCase()} • Size: {config.faviconSize}x{config.faviconSize}px
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <button
          onClick={resetToDefault}
          disabled={saving}
          className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset to Default</span>
        </button>

        {saving && (
          <div className="flex items-center text-sm text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary-500 mr-2"></div>
            Saving configuration...
          </div>
        )}
      </div>
    </div>
  )
}
