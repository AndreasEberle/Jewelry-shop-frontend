'use client'

import { useState, useEffect } from 'react'
import { Save, AlertCircle, Wrench, Plane, CheckCircle } from 'lucide-react'
import { api } from '@/services/api'

interface WebsiteStatusConfig {
  website_status: string
  construction_message: string
  vacation_message: string
  vacation_start_date: string
  vacation_end_date: string
  construction_image_url: string
  vacation_image_url: string
}

export default function WebsiteStatusManager() {
  const [config, setConfig] = useState<WebsiteStatusConfig>({
    website_status: 'normal',
    construction_message: '',
    vacation_message: '',
    vacation_start_date: '',
    vacation_end_date: '',
    construction_image_url: '',
    vacation_image_url: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      setLoading(true)
      const response = await api.get('/api/admin/system-config')
      const configs = response.data

      const newConfig: WebsiteStatusConfig = {
        website_status: 'normal',
        construction_message: '',
        vacation_message: '',
        vacation_start_date: '',
        vacation_end_date: '',
        construction_image_url: '',
        vacation_image_url: ''
      }

      configs.forEach((item: any) => {
        if (item.configKey in newConfig) {
          (newConfig as any)[item.configKey] = item.configValue || ''
        }
      })

      setConfig(newConfig)
    } catch (error) {
      console.error('Error loading config:', error)
      setMessage({ type: 'error', text: 'Failed to load configuration' })
    } finally {
      setLoading(false)
    }
  }

  const saveConfig = async () => {
    try {
      setSaving(true)
      setMessage(null)

      // Save each configuration
      const configsToSave = Object.entries(config).map(([key, value]) => ({
        configKey: key,
        configValue: value,
        description: getDescriptionForKey(key)
      }))

      for (const configItem of configsToSave) {
        await api.put(`/api/admin/system-config/${configItem.configKey}`, {
          configValue: configItem.configValue
        })
      }

      setMessage({ type: 'success', text: 'Website status configuration saved successfully!' })
    } catch (error) {
      console.error('Error saving config:', error)
      setMessage({ type: 'error', text: 'Failed to save configuration' })
    } finally {
      setSaving(false)
    }
  }

  const getDescriptionForKey = (key: string): string => {
    const descriptions: Record<string, string> = {
      website_status: 'Current website status: normal, construction, vacation',
      construction_message: 'Message shown when website is under construction',
      vacation_message: 'Message shown when website is on vacation',
      vacation_start_date: 'Start date of vacation period (YYYY-MM-DD format)',
      vacation_end_date: 'End date of vacation period (YYYY-MM-DD format)',
      construction_image_url: 'URL of image to show during construction mode',
      vacation_image_url: 'URL of image to show during vacation mode'
    }
    return descriptions[key] || ''
  }

  const handleInputChange = (key: keyof WebsiteStatusConfig, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Website Status Management</h2>
        <button
          onClick={saveConfig}
          disabled={saving}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Save className="w-5 h-5" />
          <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center space-x-2 ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Website Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Wrench className="w-5 h-5 mr-2" />
            Website Status
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Status
              </label>
              <select
                value={config.website_status}
                onChange={(e) => handleInputChange('website_status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="normal">Normal Operation</option>
                <option value="construction">Under Construction</option>
                <option value="vacation">On Vacation</option>
              </select>
            </div>
          </div>
        </div>

        {/* Construction Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Wrench className="w-5 h-5 mr-2" />
            Construction Settings
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Construction Message
              </label>
              <textarea
                value={config.construction_message}
                onChange={(e) => handleInputChange('construction_message', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={3}
                placeholder="We are currently working on improving our website..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Construction Image URL
              </label>
              <input
                type="url"
                value={config.construction_image_url}
                onChange={(e) => handleInputChange('construction_image_url', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="https://example.com/construction-image.jpg"
              />
            </div>
          </div>
        </div>

        {/* Vacation Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Plane className="w-5 h-5 mr-2" />
            Vacation Settings
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vacation Message
              </label>
              <textarea
                value={config.vacation_message}
                onChange={(e) => handleInputChange('vacation_message', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={3}
                placeholder="We are currently on vacation and will be back soon!"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={config.vacation_start_date}
                  onChange={(e) => handleInputChange('vacation_start_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={config.vacation_end_date}
                  onChange={(e) => handleInputChange('vacation_end_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vacation Image URL
              </label>
              <input
                type="url"
                value={config.vacation_image_url}
                onChange={(e) => handleInputChange('vacation_image_url', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="https://example.com/vacation-image.jpg"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}



