'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Image as ImageIcon, Eye, X } from 'lucide-react'
import { Product } from '@/types'
import { productService } from '@/services/productService'
import { ProductImageUpload } from '@/components/admin/ProductImageUpload'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { AddProductModal } from '@/components/admin/AddProductModal'
import { useLanguage } from '@/contexts/LanguageContext'

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showImageUpload, setShowImageUpload] = useState(false)
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { currentLanguage, setLanguage, getLanguageFlag, getLanguageName, supportedLanguages } = useLanguage()

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const response = await productService.getProducts({ limit: 50 })
      setProducts(response.content)
    } catch (err) {
      setError('Failed to load products')
      console.error('Error loading products:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = (images: any[]) => {
    console.log('Images uploaded:', images)
    // Refresh the product data to show new images
    loadProducts()
    setShowImageUpload(false)
  }

  const openImageUpload = (product: Product) => {
    setSelectedProduct(product)
    setShowImageUpload(true)
  }

  const handleAddProduct = () => {
    setShowAddProduct(true)
  }

  const handleProductAdded = (product: Product) => {
    // Refresh the products list
    loadProducts()
    setShowAddProduct(false)
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6">
                <div className="h-48 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
            <p className="text-gray-600 mt-2">Manage your jewelry products and images</p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Language Switcher */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Language:</span>
              <div className="flex space-x-1">
                {supportedLanguages.map((langCode) => (
                  <button
                    key={langCode}
                    onClick={() => setLanguage(langCode)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      currentLanguage === langCode
                        ? 'bg-primary-100 text-primary-700 border border-primary-300'
                        : 'text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                    title={getLanguageName(langCode)}
                  >
                    <span className="mr-1">{getLanguageFlag(langCode)}</span>
                    {langCode.split('-')[0].toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            
            <button 
              onClick={handleAddProduct}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Add Product</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
              {/* Product Image */}
              <div className="aspect-square rounded-t-lg overflow-hidden bg-gray-100">
                {product.images && product.images.length > 0 ? (
                  <img
                    src={product.images[0].url}
                    alt={product.images[0].altText || product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <ImageIcon className="w-12 h-12" />
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
                <p className="text-gray-600 text-sm mb-2">{product.description}</p>
                <p className="text-2xl font-bold text-primary-600 mb-4">
                  ${product.price.toFixed(2)}
                </p>

                {/* Image Count */}
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <ImageIcon className="w-4 h-4 mr-1" />
                  <span>{product.images?.length || 0} image(s)</span>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => openImageUpload(product)}
                    className="flex-1 btn btn-outline text-sm flex items-center justify-center space-x-1"
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>Manage Images</span>
                  </button>
                  <button className="btn btn-outline text-sm p-2">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="btn btn-outline text-sm p-2 text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

      {/* Empty State */}
      {products.length === 0 && (
        <div className="text-center py-12">
          <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-600 mb-6">Get started by adding your first product.</p>
          <button 
            onClick={handleAddProduct}
            className="btn btn-primary"
          >
            Add Product
          </button>
        </div>
      )}

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={showAddProduct}
        onClose={() => setShowAddProduct(false)}
        onProductAdded={handleProductAdded}
      />

      {/* Image Upload Modal */}
      {showImageUpload && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Upload Images for {selectedProduct.name}
                </h2>
                <button
                  onClick={() => setShowImageUpload(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <ProductImageUpload
                product={selectedProduct}
                onImagesUploaded={handleImageUpload}
              />
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
