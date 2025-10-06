'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Image as ImageIcon, Eye, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Product, CreateProductRequest } from '@/types'
import { productService } from '@/services/productService'
import { ProductImageUpload } from '@/components/admin/ProductImageUpload'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { AddProductModal } from '@/components/admin/AddProductModal'
import { ConfirmationModal } from '@/components/admin/ConfirmationModal'
import { EditProductModal } from '@/components/admin/EditProductModal'
import { useLanguage } from '@/contexts/LanguageContext'

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showImageUpload, setShowImageUpload] = useState(false)
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showEditProduct, setShowEditProduct] = useState(false)
  const [productToEdit, setProductToEdit] = useState<Product | null>(null)
  const [productImageIndices, setProductImageIndices] = useState<Record<string, number>>({})
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'createdAt' | 'quantity'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [totalProducts, setTotalProducts] = useState(0)
  const { currentLanguage, setLanguage, getLanguageFlag, getLanguageName, supportedLanguages } = useLanguage()

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

  const handleEditProduct = (product: Product) => {
    setProductToEdit(product)
    setShowEditProduct(true)
  }

  const handleSaveProduct = async (productId: string, data: any) => {
    try {
      await productService.updateProduct(productId, data)
      loadProducts()
      setShowEditProduct(false)
      setProductToEdit(null)
    } catch (err) {
      setError('Failed to update product')
      console.error('Error updating product:', err)
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
            <p className="text-gray-600 mt-2">Manage your jewelry products and images</p>
          </div>
          <div className="flex items-center space-x-4">
            
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
                    <img
                      src={product.images[productImageIndices[product.id] || 0].url}
                      alt={product.images[productImageIndices[product.id] || 0].altText || product.name}
                      className="w-full h-full object-cover"
                    />
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
                <p className="text-gray-600 text-sm mb-2">{product.description}</p>
                
                {/* Product Details */}
                <div className="text-sm text-gray-500 mb-2 space-y-1">
                  <p>SKU: {product.sku}</p>
                  <p>Quantity: {product.quantity}</p>
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
                    <span className="text-sm text-gray-500 line-through ml-2">CHF {product.price.toFixed(2)}</span>
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
                    onClick={() => openImageUpload(product)}
                    className="flex-1 btn btn-outline text-sm flex items-center justify-center space-x-1"
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>Manage Images</span>
                  </button>
                  <button 
                    onClick={() => handleEditProduct(product)}
                    className="btn btn-outline text-sm p-2"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteClick(product)}
                    className="btn btn-outline text-sm p-2 text-red-600 hover:text-red-700"
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

        {/* Edit Product Modal */}
        <EditProductModal
          isOpen={showEditProduct}
          onClose={() => {
            setShowEditProduct(false)
            setProductToEdit(null)
          }}
          product={productToEdit}
          onSave={handleSaveProduct}
        />
    </AdminLayout>
  )
}
