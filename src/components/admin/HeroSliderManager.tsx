'use client'

import { useState, useEffect } from 'react'
import { Play, Pause, Settings, ToggleLeft, ToggleRight } from 'lucide-react'
import api from '@/services/api'

interface HeroSliderConfig {
  id: string
  isEnabled: boolean
  autoPlay: boolean
  slideDurationSeconds: number
  showIndicators: boolean
  showArrows: boolean
  transitionEffect: string
  createdAt: string
  updatedAt: string
}

export function HeroSliderManager() {
  const [config, setConfig] = useState<HeroSliderConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      setLoading(true)
      const response = await api.get('/api/admin/hero-slider/config')
      setConfig(response.data)
    } catch (error) {
      console.error('Error loading hero slider config:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateConfig = async (updates: Partial<HeroSliderConfig>) => {
    if (!config) return

    try {
      setSaving(true)
      const updatedConfig = { ...config, ...updates }
      const response = await api.put('/api/admin/hero-slider/config', updatedConfig)
      
      if (response.data.success) {
        setConfig(response.data.config)
        alert('Hero slider configuration updated successfully!')
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

  const toggleSlider = async () => {
    try {
      setSaving(true)
      const response = await api.post('/api/admin/hero-slider/toggle')
      
      if (response.data.success) {
        setConfig(response.data.config)
        alert(`Hero slider ${response.data.config.isEnabled ? 'enabled' : 'disabled'}!`)
      } else {
        throw new Error(response.data.message || 'Toggle failed')
      }
    } catch (error: any) {
      console.error('Error toggling slider:', error)
      alert(`Failed to toggle slider: ${error.message}`)
    } finally {
      setSaving(false)
    }
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
          <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">Configuration Not Found</h4>
          <p className="text-gray-600">Unable to load hero slider configuration</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Main Toggle */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Hero Slider</h3>
            <p className="text-sm text-gray-600">
              {config.isEnabled ? 'Slider is currently enabled' : 'Slider is currently disabled'}
            </p>
          </div>
          <button
            onClick={toggleSlider}
            disabled={saving}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors ${
              config.isEnabled
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {config.isEnabled ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Disable Slider</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Enable Slider</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Configuration Settings */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Slider Settings</h3>
        
        <div className="space-y-4">
          {/* Auto Play */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Auto Play</label>
              <p className="text-xs text-gray-500">Automatically advance slides</p>
            </div>
            <button
              onClick={() => updateConfig({ autoPlay: !config.autoPlay })}
              disabled={saving || !config.isEnabled}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                config.autoPlay ? 'bg-primary-600' : 'bg-gray-200'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config.autoPlay ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Slide Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Slide Duration (seconds)
            </label>
            <input
              type="number"
              min="1"
              max="30"
              value={config.slideDurationSeconds}
              onChange={(e) => updateConfig({ slideDurationSeconds: parseInt(e.target.value) })}
              disabled={saving || !config.isEnabled}
              className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Show Indicators */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Show Indicators</label>
              <p className="text-xs text-gray-500">Display dots at the bottom</p>
            </div>
            <button
              onClick={() => updateConfig({ showIndicators: !config.showIndicators })}
              disabled={saving || !config.isEnabled}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                config.showIndicators ? 'bg-primary-600' : 'bg-gray-200'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config.showIndicators ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Show Arrows */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Show Arrows</label>
              <p className="text-xs text-gray-500">Display navigation arrows</p>
            </div>
            <button
              onClick={() => updateConfig({ showArrows: !config.showArrows })}
              disabled={saving || !config.isEnabled}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                config.showArrows ? 'bg-primary-600' : 'bg-gray-200'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config.showArrows ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Transition Effect */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transition Effect
            </label>
            <select
              value={config.transitionEffect}
              onChange={(e) => updateConfig({ transitionEffect: e.target.value })}
              disabled={saving || !config.isEnabled}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="fade">Fade</option>
              <option value="slide">Slide</option>
              <option value="none">None</option>
            </select>
          </div>
        </div>

        {saving && (
          <div className="mt-4 flex items-center text-sm text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary-500 mr-2"></div>
            Saving configuration...
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">How to Use Hero Slider</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Upload multiple images to the "Hero" section in the Styling tab</li>
          <li>• Enable the slider above to activate the carousel functionality</li>
          <li>• Configure auto-play, duration, and navigation options</li>
          <li>• Only active images in the Hero section will be used in the slider</li>
        </ul>
      </div>
    </div>
  )
}
