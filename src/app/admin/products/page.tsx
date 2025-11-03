'use client'

import { useState, useEffect } from 'react'
import { Plus, Minus, Edit, Trash2, Image as ImageIcon, Eye, X, ChevronLeft, ChevronRight, Trash, Power, PowerOff, AlertCircle, CheckCircle, GripVertical, Star } from 'lucide-react'
import { Product } from '@/types'
import { productService } from '@/services/productService'
import api from '@/services/api'
import { ProductImageUpload } from '@/components/admin/ProductImageUpload'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { AddProductModal } from '@/components/admin/AddProductModal'
import { EditProductModal } from '@/components/admin/EditProductModal'
import { ConfirmationModal } from '@/components/admin/ConfirmationModal'
import { ImageManagementModal } from '@/components/admin/ImageManagementModal'
import { ProductOrderManager } from '@/components/admin/ProductOrderManager'
import { useLanguage } from '@/contexts/LanguageContext'
import { Tooltip } from '@/components/ui/Tooltip'

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showImageUpload, setShowImageUpload] = useState(false)
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [productToEdit, setProductToEdit] = useState<Product | null>(null)
  const [showImageManagement, setShowImageManagement] = useState(false)
  const [productForImageManagement, setProductForImageManagement] = useState<Product | null>(null)
  const [showProductOrder, setShowProductOrder] = useState(false)
  const [productImageIndices, setProductImageIndices] = useState<Record<string, number>>({})
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [showSetInactiveConfirm, setShowSetInactiveConfirm] = useState(false)
  const [isSettingInactive, setIsSettingInactive] = useState(false)
  const [showSetActiveConfirm, setShowSetActiveConfirm] = useState(false)
  const [isSettingActive, setIsSettingActive] = useState(false)
  const [sortBy, setSortBy] = useState<'sortOrder' | 'name' | 'price' | 'createdAt' | 'quantity'>('sortOrder')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [totalProducts, setTotalProducts] = useState(0)
  const { currentLanguage, setLanguage, getLanguageFlag, getLanguageName, supportedLanguages } = useLanguage()

  // Helper function to get the featured image first, then fallback to first image
  const getDisplayImage = (product: Product, imageIndex: number) => {
    if (!product.images || product.images.length === 0) return null
    
    // Find featured image first
    const featuredImage = product.images.find(img => img.isPrimary)
    if (featuredImage) {
      // If we're showing the featured image (index 0), return it
      if (imageIndex === 0) return featuredImage
      
      // Otherwise, return other images excluding the featured one
      const otherImages = product.images.filter(img => !img.isPrimary)
      return otherImages[imageIndex - 1] || otherImages[0]
    }
    
    // No featured image, return by index
    return product.images[imageIndex] || product.images[0]
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const products = await productService.getAdminProducts()
      setProducts(products)
      setTotalProducts(products.length)
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

  const handleClearAllImages = async () => {
    try {
      setIsClearing(true)
      const response = await api.delete('/api/admin/storage/clear/products')
      
      if (response.data.success) {
        // Show custom notification
        if ((window as any).addNotification) {
          (window as any).addNotification({
            type: 'success',
            title: 'Products Deleted Successfully',
            message: `All products and their images have been deleted successfully. ${response.data.message}`,
            duration: 5000
          })
        }
        // Reload products to refresh the list
        await loadProducts()
      } else {
        if ((window as any).addNotification) {
          (window as any).addNotification({
            type: 'error',
            title: 'Failed to Delete Products',
            message: response.data.message || 'An error occurred while deleting products',
            duration: 5000
          })
        }
      }
    } catch (error) {
      console.error('Error deleting products:', error)
      if ((window as any).addNotification) {
        (window as any).addNotification({
          type: 'error',
          title: 'Failed to Delete Products',
          message: 'An unexpected error occurred while deleting products',
          duration: 5000
        })
      }
    } finally {
      setIsClearing(false)
      setShowClearConfirm(false)
    }
  }

  const handleSetAllProductsInactive = async () => {
    try {
      setIsSettingInactive(true)
      
      // Get all active products
      const activeProducts = products.filter(product => product.active)
      
      if (activeProducts.length === 0) {
        if ((window as any).addNotification) {
          (window as any).addNotification({
            type: 'warning',
            title: 'No Active Products',
            message: 'No active products found to set as inactive.',
            duration: 3000
          })
        }
        return
      }
      
      // Update each product to inactive
      for (const product of activeProducts) {
        await productService.updateProduct(product.id, { active: false })
      }
      
      // Show custom notification
      if ((window as any).addNotification) {
        (window as any).addNotification({
          type: 'success',
          title: 'Products Set to Inactive',
          message: `Successfully set ${activeProducts.length} products to inactive!`,
          duration: 5000
        })
      }
      // Reload products to refresh states
      await loadProducts()
    } catch (error) {
      console.error('Error setting products to inactive:', error)
      if ((window as any).addNotification) {
        (window as any).addNotification({
          type: 'error',
          title: 'Failed to Set Products Inactive',
          message: 'An unexpected error occurred while setting products to inactive',
          duration: 5000
        })
      }
    } finally {
      setIsSettingInactive(false)
      setShowSetInactiveConfirm(false)
    }
  }

  const handleSetAllProductsActive = async () => {
    try {
      setIsSettingActive(true)
      
      // Get all inactive products
      const inactiveProducts = products.filter(product => !product.active)
      
      if (inactiveProducts.length === 0) {
        if ((window as any).addNotification) {
          (window as any).addNotification({
            type: 'warning',
            title: 'No Inactive Products',
            message: 'No inactive products found to set as active.',
            duration: 3000
          })
        }
        return
      }
      
      // Update each product to active
      for (const product of inactiveProducts) {
        await productService.updateProduct(product.id, { active: true })
      }
      
      // Show custom notification
      if ((window as any).addNotification) {
        (window as any).addNotification({
          type: 'success',
          title: 'Products Set to Active',
          message: `Successfully set ${inactiveProducts.length} products to active!`,
          duration: 5000
        })
      }
      // Reload products to refresh states
      await loadProducts()
    } catch (error) {
      console.error('Error setting products to active:', error)
      if ((window as any).addNotification) {
        (window as any).addNotification({
          type: 'error',
          title: 'Failed to Set Products Active',
          message: 'An unexpected error occurred while setting products to active',
          duration: 5000
        })
      }
    } finally {
      setIsSettingActive(false)
      setShowSetActiveConfirm(false)
    }
  }

  const handleEditProduct = (product: Product) => {
    setProductToEdit(product)
  }

  const handleManageImages = (product: Product) => {
    setProductForImageManagement(product)
    setShowImageManagement(true)
  }

  const handleImageUpdated = () => {
    // Only reload products if we're not in the middle of an update
    // This prevents excessive API calls that might cause 429 errors
    setTimeout(() => {
      loadProducts()
    }, 2000) // Add 2-second delay to prevent rapid API calls
  }

  const handleToggleFeatured = async (product: Product) => {
    try {
      setLoading(true)
      await productService.toggleFeaturedStatus(product.id)
      await loadProducts()
      
      if ((window as any).addNotification) {
        (window as any).addNotification({
          type: 'success',
          title: 'Featured Status Updated',
          message: `Product "${product.name}" is now ${product.showInFeatured ? 'removed from' : 'added to'} featured products.`,
          duration: 3000
        })
      }
    } catch (error) {
      console.error('Error toggling featured status:', error)
      if ((window as any).addNotification) {
        (window as any).addNotification({
          type: 'error',
          title: 'Error',
          message: 'Failed to update featured status. Please try again.',
          duration: 3000
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (product: Product) => {
    try {
      setLoading(true)
      await productService.updateProduct(product.id, {
        active: !product.active
      })
      setSuccess(`Product ${product.active ? 'deactivated' : 'activated'} successfully`)
      loadProducts()
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(`Failed to ${product.active ? 'deactivate' : 'activate'} product`)
      console.error('Error toggling product status:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProduct = async (productId: string, data: any) => {
    try {
      await productService.updateProduct(productId, data)
      loadProducts()
      setProductToEdit(null)
    } catch (err) {
      setError('Failed to update product')
      console.error('Error updating product:', err)
    }
  }

  const handleAdjustQuantity = async (product: Product, adjustment: number) => {
    try {
      const newQuantity = Math.max(0, (product.quantity || 0) + adjustment)
      await productService.updateProduct(product.id, { quantity: newQuantity })
      // Refresh products to show updated quantity
      await loadProducts()
      
      if ((window as any).addNotification) {
        (window as any).addNotification({
          type: 'success',
          title: 'Quantity Updated',
          message: `Quantity for "${product.name}" updated to ${newQuantity}`,
          duration: 3000
        })
      }
    } catch (err) {
      console.error('Error adjusting quantity:', err)
      if ((window as any).addNotification) {
        (window as any).addNotification({
          type: 'error',
          title: 'Update Failed',
          message: 'Failed to update product quantity. Please try again.',
          duration: 3000
        })
      }
    }
  }

  const nextImage = (productId: string, totalImages: number) => {
    setProductImageIndices(prev => ({
      ...prev,
      [productId]: ((prev[productId] || 0) + 1) % totalImages
    }))
  }

  const prevImage = (productId: string, totalImages: number) => {
    setProductImageIndices(prev => ({
      ...prev,
      [productId]: ((prev[productId] || 0) - 1 + totalImages) % totalImages
    }))
  }

  // Filter, search, and sort products
  const filteredProducts = products
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.sku.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesFilter = filter === 'all' || 
                           (filter === 'active' && product.active) ||
                           (filter === 'inactive' && !product.active)
      
      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (sortBy) {
        case 'sortOrder':
          aValue = a.sortOrder || 0
          bValue = b.sortOrder || 0
          break
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'price':
          aValue = a.price
          bValue = b.price
          break
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
        case 'quantity':
          aValue = a.quantity || 0
          bValue = b.quantity || 0
          break
        default:
          return 0
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

  // Pagination
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex)
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product)
    setShowDeleteConfirm(true)
  }

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return

    setIsDeleting(true)
    try {
      await productService.deleteProduct(productToDelete.id)
      loadProducts()
      setShowDeleteConfirm(false)
      setProductToDelete(null)
    } catch (err) {
      setError('Failed to delete product')
      console.error('Error deleting product:', err)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false)
    setProductToDelete(null)
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
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
            <p className="text-gray-600 mt-2">Manage your jewelry products and images</p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowProductOrder(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200 text-sm font-medium"
            >
              <GripVertical className="w-4 h-4" />
              <span>Manage Order</span>
            </button>
            
            <button 
              onClick={() => setShowSetActiveConfirm(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              disabled={isSettingActive}
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isSettingActive ? 'Setting...' : 'Set All Active'}</span>
            </button>
            
            <button 
              onClick={() => setShowSetInactiveConfirm(true)}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              disabled={isSettingInactive}
            >
              <AlertCircle className="w-4 h-4" />
              <span>{isSettingInactive ? 'Setting...' : 'Set All Inactive'}</span>
            </button>
            
            <button 
              onClick={() => setShowClearConfirm(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              disabled={isClearing}
            >
              <Trash className="w-4 h-4" />
              <span>{isClearing ? 'Deleting...' : 'Delete All'}</span>
            </button>
            
            <button 
              onClick={handleAddProduct}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
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

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-700">{success}</p>
        </div>
      )}

               {/* Enhanced Filters and Search */}
               <div className="bg-white rounded-lg shadow mb-6">
                 <div className="p-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                       <input
                         type="text"
                         placeholder="Search products..."
                         value={searchQuery}
                         onChange={(e) => setSearchQuery(e.target.value)}
                         className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                       />
                     </div>

                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                       <select
                         value={filter}
                         onChange={(e) => setFilter(e.target.value as 'all' | 'active' | 'inactive')}
                         className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                       >
                         <option value="all">All Products</option>
                         <option value="active">Active Only</option>
                         <option value="inactive">Inactive Only</option>
                       </select>
                     </div>

                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                       <select
                         value={sortBy}
                         onChange={(e) => setSortBy(e.target.value as any)}
                         className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                       >
                         <option value="sortOrder">Sort Order</option>
                         <option value="name">Name</option>
                         <option value="price">Price</option>
                         <option value="createdAt">Date Created</option>
                         <option value="quantity">Quantity</option>
                       </select>
                     </div>

                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                       <select
                         value={sortOrder}
                         onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                         className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                       >
                         <option value="asc">Ascending</option>
                         <option value="desc">Descending</option>
                       </select>
                     </div>
                   </div>

                   <div className="flex items-center justify-between">
                     <div className="flex items-center space-x-4">
                       <div className="flex items-center space-x-2">
                         <label className="text-sm font-medium text-gray-700">Show:</label>
                         <select
                           value={itemsPerPage}
                           onChange={(e) => setItemsPerPage(Number(e.target.value))}
                           className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                         >
                           <option value={10}>10</option>
                           <option value={25}>25</option>
                           <option value={50}>50</option>
                           <option value={100}>100</option>
                         </select>
                         <span className="text-sm text-gray-500">per page</span>
                       </div>
                     </div>

                     <div className="text-sm text-gray-600">
                       Showing {filteredProducts.length} of {totalProducts} products
                     </div>
                   </div>
                 </div>
               </div>


      {/* Products Grid */}
      {paginatedProducts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <ImageIcon className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No products found
          </h3>
          <p className="text-gray-500">
            {searchQuery 
              ? `No products match "${searchQuery}"` 
              : 'Get started by adding your first product.'
            }
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedProducts.map((product) => (
            <div key={product.id} className={`bg-white rounded-lg shadow hover:shadow-lg transition-shadow ${!product.active ? 'opacity-60' : ''}`}>
              {/* Product Image */}
              <div className="aspect-square rounded-t-lg overflow-hidden bg-gray-100 relative">
                {/* Inactive Badge */}
                {!product.active && (
                  <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium z-10">
                    Inactive
                  </div>
                )}
                {product.images && product.images.length > 0 ? (
                  <>
                    {(() => {
                      const displayImage = getDisplayImage(product, productImageIndices[product.id] || 0)
                      return displayImage ? (
                        <img
                          src={displayImage.url}
                          alt={displayImage.altText || product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : null
                    })()}
                    {product.images.length > 1 && (
                      <>
                        <button
                          onClick={() => prevImage(product.id, product.images.length)}
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 rounded-full p-1 hover:bg-opacity-100 transition-all"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => nextImage(product.id, product.images.length)}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 rounded-full p-1 hover:bg-opacity-100 transition-all"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                          {(productImageIndices[product.id] || 0) + 1} / {product.images.length}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <ImageIcon className="w-12 h-12" />
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                  {!product.active && (
                    <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-medium">
                      Inactive
                    </span>
                  )}
                </div>
                <Tooltip content={product.description || ''} maxWidth="400px">
                  <p className="text-gray-600 text-sm mb-2 cursor-help">
                    {product.description && product.description.length > 100 
                      ? `${product.description.substring(0, 100)}...` 
                      : product.description
                    }
                  </p>
                </Tooltip>
                
                {/* Product Details */}
                <div className="text-sm text-gray-500 mb-2 space-y-1">
                  <p>SKU: {product.sku}</p>
                  <div className="flex items-center justify-between">
                    <span>Quantity: <span className="font-semibold">{product.quantity}</span></span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleAdjustQuantity(product, -1)}
                        disabled={loading}
                        className="p-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Decrease quantity by 1"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleAdjustQuantity(product, 1)}
                        disabled={loading}
                        className="p-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Increase quantity by 1"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  {product.weightGrams && (
                    <p>Weight: {product.weightGrams}g</p>
                  )}
                  {product.material && (
                    <p>Material: {product.material}</p>
                  )}
                  {product.gemstone && (
                    <p>Gemstone: {product.gemstone}</p>
                  )}
                </div>
                
                <p className="text-2xl font-bold text-primary-600 mb-4">
                  CHF {product.specialOffer && product.specialOfferPrice ? product.specialOfferPrice.toFixed(2) : product.price.toFixed(2)}
                  {product.specialOffer && product.specialOfferPrice && (
                    <>
                      <span className="text-sm text-gray-500 line-through ml-2">CHF {product.price.toFixed(2)}</span>
                      <span className="ml-2 text-sm font-bold" style={{ color: '#ef4444' }}>
                        -{Math.round(((product.price - product.specialOfferPrice) / product.price) * 100)}%
                      </span>
                    </>
                  )}
                </p>

                {/* Image Count */}
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <ImageIcon className="w-4 h-4 mr-1" />
                  <span>{product.images?.length || 0} image(s)</span>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleManageImages(product)}
                    className="flex-1 btn btn-outline text-sm flex items-center justify-center space-x-1"
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>Manage Images</span>
                  </button>
                  <button 
                    onClick={() => handleEditProduct(product)}
                    className="btn btn-outline text-sm p-2"
                    title="Edit Product"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleToggleActive(product)}
                    className={`btn btn-outline text-sm p-2 ${
                      product.active 
                        ? 'text-orange-600 hover:text-orange-700 hover:bg-orange-50' 
                        : 'text-green-600 hover:text-green-700 hover:bg-green-50'
                    }`}
                    title={product.active ? 'Deactivate Product' : 'Activate Product'}
                    disabled={loading}
                  >
                    {product.active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                  </button>
                  <button 
                    onClick={() => handleToggleFeatured(product)}
                    className={`btn btn-outline text-sm p-2 ${
                      product.showInFeatured 
                        ? 'text-blue-600 hover:text-blue-700 hover:bg-blue-50' 
                        : 'text-gray-600 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                    title={product.showInFeatured ? 'Remove from Featured' : 'Add to Featured'}
                    disabled={loading}
                  >
                    {product.showInFeatured ? <Star className="w-4 h-4 fill-current" /> : <Star className="w-4 h-4" />}
                  </button>
                  <button 
                    onClick={() => handleDeleteClick(product)}
                    className="btn btn-outline text-sm p-2 text-red-600 hover:text-red-700"
                    title="Delete Product"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredProducts.length)} of {filteredProducts.length} products
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <div className="flex space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      currentPage === page
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                )
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

        {/* Add Product Modal */}
        <AddProductModal
          isOpen={showAddProduct}
          onClose={() => {
            setShowAddProduct(false)
            setProductToEdit(null)
          }}
          onProductAdded={handleProductAdded}
        />
        
        <EditProductModal
          isOpen={!!productToEdit}
          onClose={() => setProductToEdit(null)}
          product={productToEdit}
          onProductUpdated={handleProductAdded}
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

        {/* Delete Confirmation Modal */}
        <ConfirmationModal
          isOpen={showDeleteConfirm}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          title="Delete Product"
          message={
            productToDelete
              ? `Are you sure you want to delete "${productToDelete.name}"? This action cannot be undone and will permanently remove the product and all its associated images.`
              : ''
          }
          confirmText="Delete Product"
          cancelText="Cancel"
          type="danger"
          isLoading={isDeleting}
        />

        {/* Delete All Products Confirmation Modal */}
        <ConfirmationModal
          isOpen={showClearConfirm}
          onClose={() => setShowClearConfirm(false)}
          onConfirm={handleClearAllImages}
          title="Delete All Products"
          message="Are you sure you want to delete ALL products and their images? This action cannot be undone and will permanently remove all products from the database and all associated images from storage."
          confirmText={isClearing ? "Deleting..." : "Delete All Products"}
          cancelText="Cancel"
          type="danger"
          isLoading={isClearing}
        />

        {/* Set All Products Inactive Confirmation Modal */}
        <ConfirmationModal
          isOpen={showSetInactiveConfirm}
          onClose={() => setShowSetInactiveConfirm(false)}
          onConfirm={handleSetAllProductsInactive}
          title="Set All Products to Inactive"
          message="Are you sure you want to set ALL active products to inactive? This will make all products unavailable for purchase on the website. You can reactivate individual products later if needed."
          confirmText={isSettingInactive ? "Setting..." : "Set All to Inactive"}
          cancelText="Cancel"
          type="warning"
          isLoading={isSettingInactive}
        />

        {/* Set All Products Active Confirmation Modal */}
        <ConfirmationModal
          isOpen={showSetActiveConfirm}
          onClose={() => setShowSetActiveConfirm(false)}
          onConfirm={handleSetAllProductsActive}
          title="Set All Products to Active"
          message="Are you sure you want to set ALL inactive products to active? This will make all products available for purchase on the website."
          confirmText={isSettingActive ? "Setting..." : "Set All to Active"}
          cancelText="Cancel"
          type="info"
          isLoading={isSettingActive}
        />


        {/* Image Management Modal */}
        <ImageManagementModal
          isOpen={showImageManagement}
          onClose={() => {
            setShowImageManagement(false)
            setProductForImageManagement(null)
          }}
          product={productForImageManagement}
          onImageUpdated={handleImageUpdated}
        />

        {/* Product Order Manager Modal */}
        {showProductOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Product Order Management</h2>
                  <button
                    onClick={() => setShowProductOrder(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <ProductOrderManager
                  onOrderUpdated={() => {
                    loadProducts()
                    setShowProductOrder(false)
                  }}
                />
              </div>
            </div>
          </div>
        )}
    </AdminLayout>
  )
}
