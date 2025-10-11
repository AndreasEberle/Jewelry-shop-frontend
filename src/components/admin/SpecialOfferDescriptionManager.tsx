'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Search, X } from 'lucide-react'
import { specialOfferDescriptionService, SpecialOfferDescription } from '@/services/specialOfferDescriptionService'

export function SpecialOfferDescriptionManager() {
  const [descriptions, setDescriptions] = useState<SpecialOfferDescription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingDescription, setEditingDescription] = useState<SpecialOfferDescription | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })
  const [defaultDescription, setDefaultDescription] = useState<string>('')
  const [isUpdatingDefault, setIsUpdatingDefault] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      const defaultDesc = await specialOfferDescriptionService.getDefaultSpecialOfferDescription()
      setDefaultDescription(defaultDesc)
      await loadDescriptions(defaultDesc)
    }
    loadData()
  }, [])

  const loadDefaultDescription = async () => {
    try {
      const defaultDesc = await specialOfferDescriptionService.getDefaultSpecialOfferDescription()
      setDefaultDescription(defaultDesc)
    } catch (err) {
      console.error('Failed to load default description:', err)
    }
  }

  const sortDescriptions = (data: SpecialOfferDescription[], defaultDesc: string) => {
    return data.sort((a, b) => {
      if (a.name === defaultDesc) return -1
      if (b.name === defaultDesc) return 1
      return a.name.localeCompare(b.name)
    })
  }

  const loadDescriptions = async (currentDefaultDesc?: string) => {
    try {
      setLoading(true)
      const data = await specialOfferDescriptionService.getAllSpecialOfferDescriptions()
      // Sort descriptions: default first, then alphabetically
      const defaultDesc = currentDefaultDesc || defaultDescription
      const sortedData = sortDescriptions(data, defaultDesc)
      setDescriptions(sortedData)
    } catch (err) {
      setError('Failed to load special offer descriptions')
      console.error('Error loading descriptions:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    try {
      setLoading(true)
      const data = await specialOfferDescriptionService.searchSpecialOfferDescriptions(searchQuery)
      // Sort search results: default first, then alphabetically
      const sortedData = sortDescriptions(data, defaultDescription)
      setDescriptions(sortedData)
    } catch (err) {
      setError('Failed to search special offer descriptions')
      console.error('Error searching descriptions:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await specialOfferDescriptionService.createSpecialOfferDescription(formData)
      setFormData({ name: '', description: '' })
      setShowAddForm(false)
      loadDescriptions()
    } catch (err) {
      setError('Failed to create special offer description')
      console.error('Error creating description:', err)
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingDescription) return
    
    try {
      await specialOfferDescriptionService.updateSpecialOfferDescription(editingDescription.id, formData)
      setFormData({ name: '', description: '' })
      setEditingDescription(null)
      loadDescriptions()
    } catch (err) {
      setError('Failed to update special offer description')
      console.error('Error updating description:', err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this special offer description?')) return
    
    try {
      await specialOfferDescriptionService.deleteSpecialOfferDescription(id)
      loadDescriptions()
    } catch (err) {
      setError('Failed to delete special offer description')
      console.error('Error deleting description:', err)
    }
  }

  const startEdit = (description: SpecialOfferDescription) => {
    setEditingDescription(description)
    setFormData({
      name: description.name,
      description: description.description || ''
    })
    setShowAddForm(true)
    // Scroll to top of the form
    setTimeout(() => {
      const formElement = document.querySelector('[data-edit-form]')
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
  }

  const cancelEdit = () => {
    setEditingDescription(null)
    setFormData({ name: '', description: '' })
    setShowAddForm(false)
  }

  const handleSetDefault = async (descriptionName: string) => {
    try {
      setIsUpdatingDefault(true)
      await specialOfferDescriptionService.updateDefaultSpecialOfferDescription(descriptionName)
      setDefaultDescription(descriptionName)
      // Re-sort current descriptions with new default
      const sortedData = sortDescriptions([...descriptions], descriptionName)
      setDescriptions(sortedData)
    } catch (err) {
      setError('Failed to update default special offer description')
      console.error('Error updating default description:', err)
    } finally {
      setIsUpdatingDefault(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Special Offer Descriptions</h2>
          <p className="text-gray-600 mt-1">Manage special offer descriptions that can be used when creating products</p>
          {defaultDescription && (
            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">
                <span className="font-medium">Default:</span> {defaultDescription}
              </p>
            </div>
          )}
        </div>
        <button
          onClick={() => {
            setShowAddForm(true)
            // Scroll to top of the form
            setTimeout(() => {
              const formElement = document.querySelector('[data-edit-form]')
              if (formElement) {
                formElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }
            }, 100)
          }}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Description</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Search */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search special offer descriptions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          Search
        </button>
        <button
          onClick={() => {
            setSearchQuery('')
            loadDescriptions()
          }}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
        >
          Clear
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6" data-edit-form>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingDescription ? 'Edit Description' : 'Add New Description'}
            </h3>
            <button
              onClick={cancelEdit}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <form onSubmit={editingDescription ? handleEdit : handleAdd} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., Limited Time Offer"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Optional description..."
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                {editingDescription ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Descriptions List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {descriptions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No special offer descriptions found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {descriptions.map((description) => (
              <div key={description.id} className={`p-6 hover:bg-gray-50 ${defaultDescription === description.name ? 'bg-green-50 border-l-4 border-green-400' : ''}`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-lg font-semibold text-gray-900">{description.name}</h4>
                      {defaultDescription === description.name && (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                    {description.description && (
                      <p className="text-gray-600 mt-1">{description.description}</p>
                    )}
                    <p className="text-sm text-gray-500 mt-2">
                      Created: {new Date(description.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    {defaultDescription !== description.name && (
                      <button
                        onClick={() => handleSetDefault(description.name)}
                        disabled={isUpdatingDefault}
                        className="px-3 py-1 text-xs font-medium bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        {isUpdatingDefault ? 'Setting...' : 'Set as Default'}
                      </button>
                    )}
                    <button
                      onClick={() => startEdit(description)}
                      className="p-2 text-gray-400 hover:text-blue-600"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(description.id)}
                      className="p-2 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
