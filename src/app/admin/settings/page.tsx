'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { BrandingManager } from '@/components/admin/BrandingManager'
import { SpecialOfferDescriptionManager } from '@/components/admin/SpecialOfferDescriptionManager'
import WebsiteStatusManager from '@/components/admin/WebsiteStatusManager'
import api from '@/services/api'
import { Settings, Database, Cloud, Shield, Globe, DollarSign, Palette, Tag, Wrench, Search, Edit, Check, X, RefreshCw } from 'lucide-react'

interface SystemConfig {
  id: string
  configKey: string
  configValue: string
  description: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface ConfigWithOptions extends SystemConfig {
  options?: SystemConfig[]
  isDropdown?: boolean
}

export default function AdminSettingsPage() {
  const [configs, setConfigs] = useState<ConfigWithOptions[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingConfig, setEditingConfig] = useState<ConfigWithOptions | null>(null)
  const [editValue, setEditValue] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'system' | 'branding' | 'special-offers' | 'website-status' | 'footer'>('system')

  useEffect(() => {
    loadSystemConfigs()
  }, [])

  const loadSystemConfigs = async (forceRefresh = false) => {
    try {
      setLoading(true)
      // Add cache busting parameter to force refresh
      const url = forceRefresh ? `/api/admin/config/list?t=${Date.now()}` : '/api/admin/config/list'
      const response = await api.get(url)
      const allConfigs = response.data
      
      console.log('Loaded configs:', allConfigs)
      
      // Debug specific configs
      const s3RegionConfigs = allConfigs.filter((c: SystemConfig) => c.configKey === 'S3_REGION')
      const storageTypeConfigs = allConfigs.filter((c: SystemConfig) => c.configKey === 'STORAGE_TYPE')
      console.log('S3_REGION configs:', s3RegionConfigs)
      console.log('STORAGE_TYPE configs:', storageTypeConfigs)
      
      // Group configs by key and detect dropdowns
      const configMap = new Map<string, SystemConfig[]>()
      allConfigs.forEach((config: SystemConfig) => {
        if (!configMap.has(config.configKey)) {
          configMap.set(config.configKey, [])
        }
        configMap.get(config.configKey)!.push(config)
      })
      
      console.log('Config map:', configMap)
      
      // Convert to ConfigWithOptions, using the ACTIVE config as the main config
      // and adding options for dropdowns
      const processedConfigs: ConfigWithOptions[] = []
      configMap.forEach((configs, key) => {
        // Find the active config, or use the first one if none is active
        const activeConfig = configs.find(config => config.isActive) || configs[0]
        const isDropdown = configs.length > 1
        
        console.log(`Config ${key}:`, {
          allConfigs: configs,
          activeConfig,
          isDropdown,
          activeConfigValue: activeConfig?.configValue,
          activeConfigIsActive: activeConfig?.isActive
        })
        
        // Extra debugging for problematic configs
        if (key === 'S3_REGION' || key === 'STORAGE_TYPE') {
          console.log(`=== DEBUGGING ${key} ===`)
          console.log('All configs for this key:', configs)
          console.log('Active config found:', activeConfig)
          console.log('Is active config really active?', activeConfig?.isActive)
          console.log('Active config value:', activeConfig?.configValue)
          console.log('========================')
        }
        
        processedConfigs.push({
          ...activeConfig,
          isDropdown,
          options: isDropdown ? configs : undefined
        })
      })
      
      console.log('Processed configs:', processedConfigs)
      setConfigs(processedConfigs)
    } catch (err) {
      setError('Failed to load system configurations')
      console.error('Error loading configs:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (config: ConfigWithOptions) => {
    setEditingConfig(config)
    setEditValue(config.configValue)
  }

  const handleSave = async () => {
    if (!editingConfig) return

    try {
      setIsSaving(true)
      if (editingConfig.isDropdown && editingConfig.options) {
        // For dropdown configs, activate the selected option
        const selectedOption = editingConfig.options.find(option => option.configValue === editValue)
        if (selectedOption) {
          console.log('Activating config:', selectedOption)
          const response = await api.post(`/api/admin/config/${selectedOption.id}/activate`)
          console.log('Activation response:', response.data)
          // Small delay to ensure backend has processed the change
          await new Promise(resolve => setTimeout(resolve, 200))
          // Force refresh all configs to get the updated state
          await loadSystemConfigs(true)
        }
      } else {
        // For regular configs, update the value
        console.log('Updating config:', editingConfig.id, 'to value:', editValue)
        const response = await api.put(`/api/admin/config/${editingConfig.id}`, { configValue: editValue })
        console.log('Update response:', response.data)
        // Small delay to ensure backend has processed the change
        await new Promise(resolve => setTimeout(resolve, 200))
        // Force refresh all configs to get the updated state
        await loadSystemConfigs(true)
      }

      setEditingConfig(null)
      setEditValue('')
    } catch (err) {
      setError('Failed to update configuration')
      console.error('Error updating config:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditingConfig(null)
    setEditValue('')
  }

  const handleActivate = async (config: SystemConfig) => {
    try {
      await api.post(`/api/admin/config/${config.id}/activate`)
      
      // Reload configs to reflect the change
      await loadSystemConfigs()
    } catch (err) {
      setError('Failed to activate configuration')
      console.error('Error activating config:', err)
    }
  }

  // Filter configs based on search query
  const filteredConfigs = configs.filter(config => 
    config.configKey.toLowerCase().includes(searchQuery.toLowerCase()) ||
    config.configValue.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (config.description && config.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const getConfigIcon = (key: string) => {
    if (key.includes('S3') || key.includes('STORAGE')) return <Cloud className="w-4 h-4" />
    if (key.includes('CURRENCY') || key.includes('MARKUP')) return <DollarSign className="w-4 h-4" />
    if (key.includes('LANGUAGE') || key.includes('LOCALE')) return <Globe className="w-4 h-4" />
    if (key.includes('SECURITY') || key.includes('AUTH')) return <Shield className="w-4 h-4" />
    return <Database className="w-4 h-4" />
  }

  const getConfigCategory = (key: string) => {
    if (key.includes('S3') || key.includes('STORAGE')) return 'Storage'
    if (key.includes('CURRENCY') || key.includes('MARKUP')) return 'Currency & Pricing'
    if (key.includes('LANGUAGE') || key.includes('LOCALE')) return 'Localization'
    if (key.includes('SECURITY') || key.includes('AUTH')) return 'Security'
    return 'General'
  }

  const groupedConfigs = filteredConfigs.reduce((acc, config) => {
    const category = getConfigCategory(config.configKey)
    if (!acc[category]) acc[category] = []
    acc[category].push(config)
    return acc
  }, {} as Record<string, SystemConfig[]>)

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
        <div className="flex items-center space-x-3 mb-6">
          <Settings className="w-8 h-8 text-primary-600" />
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('system')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'system'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Settings className="w-4 h-4" />
                  <span>System Settings</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('branding')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'branding'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Palette className="w-4 h-4" />
                  <span>Branding</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('special-offers')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'special-offers'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Tag className="w-4 h-4" />
                  <span>Special Offers</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('website-status')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'website-status'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Wrench className="w-4 h-4" />
                  <span>Website Status</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('footer')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'footer'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Tag className="w-4 h-4" />
                  <span>Footer</span>
                </div>
              </button>
            </nav>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {activeTab === 'system' ? (
          <>
            {/* Search Bar and Refresh Button */}
            <div className="mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search configurations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Settings className="h-5 w-5 text-gray-400" />
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <span className="text-xl">&times;</span>
                </button>
              )}
            </div>
            <button
              onClick={() => loadSystemConfigs(true)}
              disabled={loading}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Settings className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
          {searchQuery && (
            <p className="mt-2 text-sm text-gray-600">
              Found {filteredConfigs.length} configuration{filteredConfigs.length !== 1 ? 's' : ''} matching "{searchQuery}"
            </p>
          )}
        </div>

        <div className="space-y-8">
          {Object.keys(groupedConfigs).length === 0 ? (
            <div className="text-center py-12">
              <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No configurations found</h3>
              <p className="text-gray-600">
                {searchQuery ? `No configurations match "${searchQuery}"` : 'No configurations available'}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            Object.entries(groupedConfigs).map(([category, configs]) => (
            <div key={category} className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">{category}</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {configs.map((config: ConfigWithOptions) => (
                  <div key={config.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getConfigIcon(config.configKey)}
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="text-sm font-medium text-gray-900">
                              {config.configKey}
                            </h3>
                            {config.isDropdown && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                Dropdown
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            {config.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        {editingConfig?.id === config.id ? (
                          <div className="flex items-center space-x-2">
                            {config.isDropdown && config.options ? (
                              (() => {
                                const availableOptions = config.options.filter((option: SystemConfig) => !option.isActive);
                                return availableOptions.length > 0 ? (
                                  <select
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                  >
                                    {availableOptions.map((option: SystemConfig) => (
                                      <option key={option.id} value={option.configValue}>
                                        {option.configValue} - {option.description}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <div className="text-sm text-gray-500 italic">
                                    All options are already active
                                  </div>
                                );
                              })()
                            ) : (
                              (() => {
                                // Check if this is a boolean config
                                const isBooleanConfig = config.configKey.includes('.enabled') || 
                                                       config.configKey.includes('is_active') ||
                                                       config.configValue === 'true' || 
                                                       config.configValue === 'false'
                                
                                if (isBooleanConfig) {
                                  return (
                                    <select
                                      value={editValue}
                                      onChange={(e) => setEditValue(e.target.value)}
                                      className="w-full px-4 py-3 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-[200px]"
                                    >
                                      <option value="true">Yes / Enabled</option>
                                      <option value="false">No / Disabled</option>
                                    </select>
                                  )
                                }
                                
                                return (
                                  <textarea
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                    rows={editValue.length > 100 ? 4 : 2}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-[300px] resize-y"
                              />
                                )
                              })()
                            )}
                            <button
                              onClick={handleSave}
                              disabled={isSaving}
                              className="px-3 py-1 bg-primary-600 text-white text-sm rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                            >
                              {isSaving ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-white"></div>
                                  <span>Saving...</span>
                                </>
                              ) : (
                                'Save'
                              )}
                            </button>
                            <button
                              onClick={handleCancel}
                              className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-400"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center space-x-2">
                              {((): React.ReactNode => {
                                // Display human-readable boolean values
                                const isBooleanValue = config.configValue === 'true' || config.configValue === 'false'
                                const isBooleanConfig = config.configKey.includes('.enabled') || 
                                                       config.configKey.includes('is_active') ||
                                                       config.configKey.includes('.enabled')
                                
                                if (isBooleanValue && isBooleanConfig) {
                                  return (
                                    <span className={`text-sm font-semibold px-2 py-1 rounded ${
                                      config.configValue === 'true' 
                                        ? 'text-green-700 bg-green-100' 
                                        : 'text-red-700 bg-red-100'
                                    }`}>
                                      {config.configValue === 'true' ? '✓ Yes / Enabled' : '✗ No / Disabled'}
                                    </span>
                                  )
                                }
                                
                                return (
                              <span className="text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">
                                {config.configValue}
                              </span>
                                )
                              })()}
                              {config.isActive && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                  Active
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => handleEdit(config)}
                              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                            >
                              Edit
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Show all options for dropdown configs */}
                    {config.isDropdown && config.options && config.options.length > 1 && (
                      <div className="mt-4 pl-8">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Available Options:</h4>
                        <div className="space-y-2">
                          {config.options.map((option: SystemConfig) => (
                            <div key={option.id} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-900 font-mono">
                                  {option.configValue}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {option.description}
                                </span>
                                {option.isActive && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                    Active
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => handleActivate(option)}
                                className="px-2 py-1 bg-primary-600 text-white text-xs rounded hover:bg-primary-700"
                              >
                                Activate
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
          )}
        </div>
          </>
        ) : activeTab === 'branding' ? (
          /* Branding Configuration */
          <BrandingManager />
        ) : activeTab === 'website-status' ? (
          /* Website Status Configuration */
          <WebsiteStatusManager />
        ) : activeTab === 'footer' ? (
          /* Footer Configuration */
          <>
            {/* Search Bar and Refresh Button */}
            <div className="mb-6">
              <div className="flex items-center space-x-4">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search footer configurations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
                <button
                  onClick={() => loadSystemConfigs(true)}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Footer Configs - Filter by footer.* prefix */}
            {configs
              .filter(config => config.configKey.startsWith('footer.'))
              .filter(config => 
                config.configKey.toLowerCase().includes(searchQuery.toLowerCase()) ||
                config.configValue.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (config.description || '').toLowerCase().includes(searchQuery.toLowerCase())
              )
              .length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No footer configurations found. They will be created when you run the database migration.</p>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {configs
                        .filter(config => config.configKey.startsWith('footer.'))
                        .filter(config => 
                          config.configKey.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          config.configValue.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (config.description || '').toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((config) => (
                          <tr key={config.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {config.configKey}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {editingConfig?.id === config.id ? (
                                (() => {
                                  // Check if this is a boolean config
                                  const isBooleanConfig = config.configKey.includes('.enabled') || 
                                                         config.configKey.includes('is_active') ||
                                                         config.configValue === 'true' || 
                                                         config.configValue === 'false'
                                  
                                  if (isBooleanConfig) {
                                    return (
                                      <select
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-[200px]"
                                        autoFocus
                                      >
                                        <option value="true">Yes / Enabled</option>
                                        <option value="false">No / Disabled</option>
                                      </select>
                                    )
                                  }
                                  
                                  return (
                                    <textarea
                                      value={editValue}
                                      onChange={(e) => setEditValue(e.target.value)}
                                      rows={editValue.length > 100 ? 4 : 2}
                                      className="w-full px-4 py-3 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-[400px] resize-y"
                                      autoFocus
                                    />
                                  )
                                })()
                              ) : (
                                (() => {
                                  // Display human-readable boolean values
                                  const isBooleanValue = config.configValue === 'true' || config.configValue === 'false'
                                  const isBooleanConfig = config.configKey.includes('.enabled') || 
                                                         config.configKey.includes('is_active')
                                  
                                  if (isBooleanValue && isBooleanConfig) {
                                    return (
                                      <span className="break-all text-base">
                                        {config.configValue === 'true' 
                                          ? <span className="text-green-600 font-semibold">✓ Yes / Enabled</span>
                                          : <span className="text-red-600 font-semibold">✗ No / Disabled</span>
                                        }
                                      </span>
                                    )
                                  }
                                  
                                  return <span className="break-all text-base">{config.configValue || '(empty)'}</span>
                                })()
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {config.description || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {config.isActive ? (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                  Active
                                </span>
                              ) : (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                  Inactive
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              {editingConfig?.id === config.id ? (
                                <div className="flex space-x-2">
                                  <button
                                    onClick={handleSave}
                                    className="text-green-600 hover:text-green-900"
                                  >
                                    <Check className="w-5 h-5" />
                                  </button>
                                  <button
                                    onClick={handleCancel}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    <X className="w-5 h-5" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setEditingConfig(config)
                                    setEditValue(config.configValue || '')
                                  }}
                                  className="text-primary-600 hover:text-primary-900"
                                >
                                  <Edit className="w-5 h-5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
          </>
        ) : (
          /* Special Offer Descriptions Configuration */
          <SpecialOfferDescriptionManager />
        )}
      </div>
    </AdminLayout>
  )
}
