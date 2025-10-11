'use client'

import React, { useState, useEffect } from 'react'
import { GripVertical, Save, RotateCcw } from 'lucide-react'
import { productOrderService, ProductOrder } from '@/services/productOrderService'

interface ProductOrderManagerProps {
  onOrderUpdated?: () => void
}

export function ProductOrderManager({ onOrderUpdated }: ProductOrderManagerProps) {
  const [products, setProducts] = useState<ProductOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      setError(null)
      const productOrder = await productOrderService.getProductOrder()
      setProducts(productOrder)
    } catch (err) {
      setError('Failed to load product order')
      console.error('Error loading product order:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      return
    }

    const newProducts = [...products]
    const [draggedItem] = newProducts.splice(draggedIndex, 1)
    newProducts.splice(dropIndex, 0, draggedItem)

    // Update sortOrder values
    const updatedProducts = newProducts.map((product, index) => ({
      ...product,
      sortOrder: index + 1
    }))

    setProducts(updatedProducts)
    setDraggedIndex(null)
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      
      const productIds = products.map(p => p.id)
      await productOrderService.reorderProducts(productIds)
      
      setSuccess('Product order saved successfully!')
      onOrderUpdated?.()
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError('Failed to save product order')
      console.error('Error saving product order:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    loadProducts()
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
          <span className="ml-3 text-gray-600">Loading product order...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Product Order</h3>
          <p className="text-sm text-gray-600">Drag and drop to reorder products in the carousel</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleReset}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4 mr-1" />
            {saving ? 'Saving...' : 'Save Order'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-600">{success}</p>
        </div>
      )}

      <div className="space-y-2">
        {products.map((product, index) => (
          <div
            key={product.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
            className={`flex items-center p-3 bg-gray-50 rounded-lg border-2 border-dashed transition-all cursor-move hover:bg-gray-100 ${
              draggedIndex === index ? 'opacity-50' : ''
            }`}
          >
            <GripVertical className="w-5 h-5 text-gray-400 mr-3" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">{product.name}</span>
                <span className="text-sm text-gray-500">Order: {product.sortOrder}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No products found</p>
        </div>
      )}
    </div>
  )
}
