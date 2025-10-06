'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import api from '@/services/api'
import { Settings, Database, Cloud, Shield, Globe, DollarSign } from 'lucide-react'

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

  useEffect(() => {
    loadSystemConfigs()
  }, [])

  const loadSystemConfigs = async () => {
    try {
      setLoading(true)
      const response = await api.get('/api/admin/config/all')
      const allConfigs = response.data.content || response.data
      
      // Group configs by key and detect dropdowns
      const configMap = new Map<string, SystemConfig[]>()
      allConfigs.forEach((config: SystemConfig) => {
        if (!configMap.has(config.configKey)) {
          configMap.set(config.configKey, [])
        }
        configMap.get(config.configKey)!.push(config)
      })
      
      // Convert to ConfigWithOptions, using the active config as the main config
      // and adding options for dropdowns
      const processedConfigs: ConfigWithOptions[] = []
      configMap.forEach((configs, key) => {
        // Find the active config, or use the first one if none is active
        const activeConfig = configs.find(config => config.isActive) || configs[0]
        const isDropdown = configs.length > 1
        
        processedConfigs.push({
          ...activeConfig,
          isDropdown,
          options: isDropdown ? configs : undefined
        })
      })
      
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
      // For dropdown configs, we need to find the correct config entry with the selected value
      let configToUpdate = editingConfig
      if (editingConfig.isDropdown && editingConfig.options) {
        const selectedOption = editingConfig.options.find(option => option.configValue === editValue)
        if (selectedOption) {
          configToUpdate = selectedOption
        }
      }

      await api.put(`/api/admin/config/${configToUpdate.id}`, { configValue: editValue })

      setConfigs(prev => prev.map(config => 
        config.id === editingConfig.id 
          ? { ...config, configValue: editValue, updatedAt: new Date().toISOString() }
          : config
      ))

      setEditingConfig(null)
      setEditValue('')
    } catch (err) {
      setError('Failed to update configuration')
      console.error('Error updating config:', err)
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
    config.description.toLowerCase().includes(searchQuery.toLowerCase())
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
          <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
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
                {configs.map((config) => (
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
                              <select
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                              >
                                {config.options.map((option) => (
                                  <option key={option.id} value={option.configValue}>
                                    {option.configValue} - {option.description}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                              />
                            )}
                            <button
                              onClick={handleSave}
                              className="px-3 py-1 bg-primary-600 text-white text-sm rounded-md hover:bg-primary-700"
                            >
                              Save
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
                              <span className="text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">
                                {config.configValue}
                              </span>
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
                          {config.options.map((option) => (
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
                              {!option.isActive && (
                                <button
                                  onClick={() => handleActivate(option)}
                                  className="px-2 py-1 bg-primary-600 text-white text-xs rounded hover:bg-primary-700"
                                >
                                  Activate
                                </button>
                              )}
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
      </div>
    </AdminLayout>
  )
}
