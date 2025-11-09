'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { useTranslation } from '@/hooks/useTranslation'
import api from '@/services/api'
import { 
  Package, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Truck, 
  CheckCircle, 
  XCircle, 
  Clock,
  DollarSign,
  Calendar,
  User,
  AlertCircle,
  RefreshCw
} from 'lucide-react'

interface Order {
  id: string
  orderNumber: string
  customerId: string
  customerEmail: string
  customerName: string
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED'
  totalAmount: number
  currency: string
  shippingAddress: string
  billingAddress: string
  notes?: string
  createdAt: string
  updatedAt: string
  items: OrderItem[]
  payment?: Payment
  trackingNumber?: string
  carrier?: string
  trackingLink?: string
  estimatedDeliveryDays?: number
}

interface OrderItem {
  id: string
  productId: string
  productName: string
  productSku: string
  quantity: number
  unitPrice: number
  totalPrice: number
  currency: string
}

interface Payment {
  id: string
  paymentMethod: string
  status: string
  amount: number
  currency: string
  transactionId?: string
  processedAt?: string
  gatewayResponse?: string
}

interface OrderStats {
  totalOrders: number
  ordersByStatus: Record<string, number>
  recentOrders: number
  totalRevenue: number
}

export default function AdminOrdersPage() {
  const { t } = useTranslation()
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<OrderStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [newStatus, setNewStatus] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [carrier, setCarrier] = useState('')
  const [trackingLink, setTrackingLink] = useState('')
  const [estimatedDeliveryDays, setEstimatedDeliveryDays] = useState<number>(4)
  const [notes, setNotes] = useState('')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    loadOrders()
    loadStats()
  }, [currentPage, statusFilter, searchQuery])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        size: '20',
        sortBy: 'createdAt',
        sortOrder: 'desc'
      })
      
      if (statusFilter) params.append('status', statusFilter)
      if (searchQuery) params.append('orderNumber', searchQuery)
      
      const response = await api.get(`/api/admin/orders?${params}`)
      setOrders(response.data.content || response.data)
      setTotalPages(response.data.totalPages || 0)
    } catch (err) {
      setError(t('admin.orders.failedToLoad') || 'Failed to load orders')
      console.error('Error loading orders:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await api.get('/api/admin/orders/stats')
      setStats(response.data)
    } catch (err) {
      console.error('Error loading stats:', err)
    }
  }

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order)
    setShowOrderModal(true)
  }

  const handleUpdateStatus = (order: Order) => {
    setSelectedOrder(order)
    setNewStatus(order.status)
    setTrackingNumber(order.trackingNumber || '')
    setCarrier(order.carrier || '')
    setTrackingLink(order.trackingLink || '')
    setEstimatedDeliveryDays(order.estimatedDeliveryDays || 4)
    setNotes(order.notes || '')
    setShowStatusModal(true)
  }

  const handleSaveStatus = async () => {
    if (!selectedOrder) return

    try {
      setError(null)
      setSuccessMessage(null)
      
      // Update status and all tracking info in one request
      await api.put(`/api/admin/orders/${selectedOrder.id}/status`, {
        status: newStatus,
        notes: notes || undefined,
        trackingNumber: trackingNumber?.trim() || undefined,
        carrier: carrier?.trim() || undefined,
        trackingLink: trackingLink?.trim() || undefined,
        estimatedDeliveryDays: estimatedDeliveryDays || undefined
      })

      setSuccessMessage(t('admin.orders.updateSuccess') || 'Order status updated successfully!')
      setShowStatusModal(false)
      setTimeout(() => {
        setSuccessMessage(null)
      }, 3000)
      loadOrders()
      loadStats()
    } catch (err) {
      setError(t('admin.orders.updateFailed') || 'Failed to update order status')
      setSuccessMessage(null)
      console.error('Error updating status:', err)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PENDING': return <Clock className="h-4 w-4 text-yellow-500" />
      case 'CONFIRMED': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'PROCESSING': return <Clock className="h-4 w-4 text-blue-500" />
      case 'SHIPPED': return <Truck className="h-4 w-4 text-blue-500" />
      case 'DELIVERED': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'CANCELLED': return <XCircle className="h-4 w-4 text-red-500" />
      case 'REFUNDED': return <XCircle className="h-4 w-4 text-red-500" />
      default: return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'CONFIRMED': return 'bg-green-100 text-green-800'
      case 'PROCESSING': return 'bg-blue-100 text-blue-800'
      case 'SHIPPED': return 'bg-blue-100 text-blue-800'
      case 'DELIVERED': return 'bg-green-100 text-green-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      case 'REFUNDED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'CHF'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading && orders.length === 0) {
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('admin.orders.title') || 'Orders'}</h1>
            <p className="text-gray-600">{t('admin.orders.title') || 'Orders'}</p>
          </div>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{successMessage}</span>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Package className="h-8 w-8 text-blue-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{t('admin.orders.stats.totalOrders') || 'Total Orders'}</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                  </div>
                </div>
                <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                  {stats.totalOrders}
                </span>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <AlertCircle className="h-8 w-8 text-orange-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{t('account.notDelivered') || 'Not Delivered'}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.totalOrders - ((stats.ordersByStatus && stats.ordersByStatus.DELIVERED) || 0)}
                    </p>
                  </div>
                </div>
                <span className="bg-orange-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                  {stats.totalOrders - ((stats.ordersByStatus && stats.ordersByStatus.DELIVERED) || 0)}
                </span>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <XCircle className="h-8 w-8 text-red-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{t('admin.orders.cancelled') || 'Cancelled'}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {(stats.ordersByStatus && stats.ordersByStatus.CANCELLED) || 0}
                    </p>
                  </div>
                </div>
                <span className="bg-red-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                  {(stats.ordersByStatus && stats.ordersByStatus.CANCELLED) || 0}
                </span>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <RefreshCw className="h-8 w-8 text-purple-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{t('admin.orders.refunded') || 'Refunded'}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {(stats.ordersByStatus && stats.ordersByStatus.REFUNDED) || 0}
                    </p>
                  </div>
                </div>
                <span className="bg-purple-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                  {(stats.ordersByStatus && stats.ordersByStatus.REFUNDED) || 0}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('admin.orders.searchPlaceholder') || 'Search orders...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 w-full"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">{t('admin.orders.allStatuses') || 'All Statuses'}</option>
                <option value="PENDING">{t('admin.orders.pending') || 'Pending'}</option>
                <option value="CONFIRMED">{t('admin.orders.confirmed') || 'Confirmed'}</option>
                <option value="PROCESSING">{t('admin.orders.processing') || 'Processing'}</option>
                <option value="SHIPPED">{t('admin.orders.shipped') || 'Shipped'}</option>
                <option value="DELIVERED">{t('admin.orders.delivered') || 'Delivered'}</option>
                <option value="CANCELLED">{t('admin.orders.cancelled') || 'Cancelled'}</option>
                <option value="REFUNDED">{t('admin.orders.refunded') || 'Refunded'}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.orders.orderNumber') || 'Order'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.orders.customer') || 'Customer'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.orders.status') || 'Status'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.orders.total') || 'Total'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.orders.date') || 'Date'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.orders.actions') || 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          #{order.orderNumber}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {order.customerName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.customerEmail}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span className="ml-1">{order.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(order.totalAmount, order.currency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleViewOrder(order)}
                        className="text-blue-600 hover:text-blue-900"
                        title={t('admin.orders.view') || 'View'}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(order)}
                        className="text-green-600 hover:text-green-900"
                        title={t('admin.orders.updateStatus') || 'Update Status'}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  {t('common.previous') || 'Previous'}
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                  disabled={currentPage >= totalPages - 1}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  {t('common.next') || 'Next'}
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing page <span className="font-medium">{currentPage + 1}</span> of{' '}
                    <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                      disabled={currentPage === 0}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                      disabled={currentPage >= totalPages - 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Order Details Modal */}
        {showOrderModal && selectedOrder && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Order #{selectedOrder.orderNumber}
                  </h3>
                  <button
                    onClick={() => setShowOrderModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  {/* Order Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">{t('admin.orders.status') || 'Status'}</label>
                      <p className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                        {getStatusIcon(selectedOrder.status)}
                        <span className="ml-1">{selectedOrder.status}</span>
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">{t('admin.orders.total') || 'Total'}</label>
                      <p className="text-sm text-gray-900">
                        {formatCurrency(selectedOrder.totalAmount, selectedOrder.currency)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">{t('admin.orders.date') || 'Date'}</label>
                      <p className="text-sm text-gray-900">{formatDate(selectedOrder.createdAt)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">{t('admin.orders.trackingNumber') || 'Tracking'}</label>
                      <p className="text-sm text-gray-900">
                        {selectedOrder.trackingNumber || t('common.notProvided') || 'Not provided'}
                      </p>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div>
                    <label className="text-sm font-medium text-gray-500">{t('admin.orders.customer') || 'Customer'}</label>
                    <p className="text-sm text-gray-900">{selectedOrder.customerName}</p>
                    <p className="text-sm text-gray-500">{selectedOrder.customerEmail}</p>
                  </div>

                  {/* Order Items */}
                  <div>
                    <label className="text-sm font-medium text-gray-500">{t('admin.orders.orderItems') || 'Items'}</label>
                    <div className="mt-2 space-y-2">
                      {selectedOrder.items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{item.productName}</p>
                            <p className="text-xs text-gray-500">SKU: {item.productSku}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-900">Qty: {item.quantity}</p>
                            <p className="text-sm text-gray-900">
                              {formatCurrency(item.totalPrice, item.currency)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Payment Info */}
                  {selectedOrder.payment && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Payment</label>
                      <div className="mt-2 p-2 bg-gray-50 rounded">
                        <p className="text-sm text-gray-900">
                          {selectedOrder.payment.paymentMethod} - {selectedOrder.payment.status}
                        </p>
                        {selectedOrder.payment.transactionId && (
                          <p className="text-xs text-gray-500">
                            Transaction: {selectedOrder.payment.transactionId}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Update Status Modal */}
        {showStatusModal && selectedOrder && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {t('admin.orders.updateStatus') || 'Update Status'}
                  </h3>
                  <button
                    onClick={() => setShowStatusModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="CONFIRMED">Confirmed</option>
                      <option value="PROCESSING">Processing</option>
                      <option value="SHIPPED">Shipped</option>
                      <option value="DELIVERED">Delivered</option>
                      <option value="CANCELLED">Cancelled</option>
                      <option value="REFUNDED">Refunded</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tracking Number</label>
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Enter tracking number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Carrier</label>
                    <input
                      type="text"
                      value={carrier}
                      onChange={(e) => setCarrier(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Enter carrier name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tracking Link</label>
                    <input
                      type="url"
                      value={trackingLink}
                      onChange={(e) => setTrackingLink(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="https://tracking.example.com/..."
                    />
                    <p className="mt-1 text-xs text-gray-500">Customer will see this link when tracking their order</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Estimated Delivery Days</label>
                    <div className="mt-1 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEstimatedDeliveryDays(Math.max(1, (estimatedDeliveryDays || 4) - 1))}
                        className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={estimatedDeliveryDays}
                        onChange={(e) => setEstimatedDeliveryDays(parseInt(e.target.value) || 4)}
                        className="block w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-center"
                      />
                      <button
                        type="button"
                        onClick={() => setEstimatedDeliveryDays((estimatedDeliveryDays || 4) + 1)}
                        className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        +
                      </button>
                      <span className="text-sm text-gray-600">days</span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Default: 3-5 days (currently {estimatedDeliveryDays} day{estimatedDeliveryDays !== 1 ? 's' : ''})</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Enter any additional notes"
                    />
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setShowStatusModal(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                      {t('admin.orders.cancel') || 'Cancel'}
                    </button>
                    <button
                      onClick={handleSaveStatus}
                      className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
                    >
                      {t('admin.orders.updateStatus') || 'Update Status'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}





