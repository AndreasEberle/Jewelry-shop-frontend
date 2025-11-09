'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { useTranslation } from '@/hooks/useTranslation'
import api from '@/services/api'
import { Tag, Plus, Edit, Trash2, Check, X, Calendar, DollarSign, Percent } from 'lucide-react'

interface DiscountCode {
  id: string
  code: string
  description: string | null
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT'
  discountValue: number
  minimumPurchaseAmount: number | null
  maximumDiscountAmount: number | null
  usageLimit: number | null
  usageCount: number
  isActive: boolean
  validFrom: string | null
  validUntil: string | null
  createdAt: string
  updatedAt: string
}

export default function AdminDiscountCodesPage() {
  const { t } = useTranslation()
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingCode, setEditingCode] = useState<DiscountCode | null>(null)
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED_AMOUNT',
    discountValue: '',
    minimumPurchaseAmount: '',
    maximumDiscountAmount: '',
    usageLimit: '',
    isActive: true,
    validFrom: '',
    validUntil: ''
  })
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadDiscountCodes()
  }, [])

  const loadDiscountCodes = async () => {
    try {
      setLoading(true)
      const response = await api.get('/api/admin/discount-codes')
      setDiscountCodes(response.data)
    } catch (error: any) {
      console.error('Failed to load discount codes:', error)
      setError(t('admin.discountCodes.failedToLoad') || 'Failed to load discount codes')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingCode(null)
    setFormData({
      code: '',
      description: '',
      discountType: 'PERCENTAGE',
      discountValue: '',
      minimumPurchaseAmount: '',
      maximumDiscountAmount: '',
      usageLimit: '',
      isActive: true,
      validFrom: '',
      validUntil: ''
    })
    setError(null)
    setShowCreateModal(true)
  }

  const handleEdit = (code: DiscountCode) => {
    setEditingCode(code)
    setFormData({
      code: code.code,
      description: code.description || '',
      discountType: code.discountType,
      discountValue: code.discountValue.toString(),
      minimumPurchaseAmount: code.minimumPurchaseAmount?.toString() || '',
      maximumDiscountAmount: code.maximumDiscountAmount?.toString() || '',
      usageLimit: code.usageLimit?.toString() || '',
      isActive: code.isActive,
      validFrom: code.validFrom ? new Date(code.validFrom).toISOString().slice(0, 16) : '',
      validUntil: code.validUntil ? new Date(code.validUntil).toISOString().slice(0, 16) : ''
    })
    setError(null)
    setShowCreateModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t('admin.discountCodes.deleteConfirm') || 'Are you sure you want to delete this discount code?')) {
      return
    }

    try {
      await api.delete(`/api/admin/discount-codes/${id}`)
      loadDiscountCodes()
    } catch (error: any) {
      alert(t('admin.discountCodes.failedToDelete') || 'Failed to delete discount code: ' + (error.response?.data?.message || error.message))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)

    try {
      const requestData = {
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim() || null,
        discountType: formData.discountType,
        discountValue: parseFloat(formData.discountValue),
        minimumPurchaseAmount: formData.minimumPurchaseAmount ? parseFloat(formData.minimumPurchaseAmount) : null,
        maximumDiscountAmount: formData.maximumDiscountAmount ? parseFloat(formData.maximumDiscountAmount) : null,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
        isActive: formData.isActive,
        validFrom: formData.validFrom ? new Date(formData.validFrom).toISOString() : null,
        validUntil: formData.validUntil ? new Date(formData.validUntil).toISOString() : null
      }

      if (editingCode) {
        await api.put(`/api/admin/discount-codes/${editingCode.id}`, requestData)
      } else {
        await api.post('/api/admin/discount-codes', requestData)
      }

      setShowCreateModal(false)
      loadDiscountCodes()
    } catch (error: any) {
      setError(error.response?.data?.message || error.message || t('admin.discountCodes.failedToSave') || 'Failed to save discount code')
    } finally {
      setIsSaving(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return t('admin.discountCodes.notSet') || 'Not set'
    return new Date(dateString).toLocaleDateString()
  }

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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Tag className="w-8 h-8 text-primary-600" />
            <h1 className="text-3xl font-bold text-gray-900">{t('admin.discountCodes.title') || 'Discount Codes'}</h1>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            {t('admin.discountCodes.createDiscountCode') || 'Create Discount Code'}
          </button>
        </div>

        {/* Discount Codes Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.discountCodes.code') || 'Code'}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.discountCodes.type') || 'Type'}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.discountCodes.value') || 'Value'}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.discountCodes.usage') || 'Usage'}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.discountCodes.status') || 'Status'}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.discountCodes.validDates') || 'Valid Dates'}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.discountCodes.actions') || 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {discountCodes.map((code) => (
                <tr key={code.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{code.code}</div>
                    {code.description && (
                      <div className="text-sm text-gray-500">{code.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {code.discountType === 'PERCENTAGE' ? (
                        <span className="flex items-center gap-1">
                          <Percent className="w-4 h-4" />
                          Percentage
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          Fixed Amount
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {code.discountType === 'PERCENTAGE' ? `${code.discountValue}%` : `CHF ${code.discountValue.toFixed(2)}`}
                    {code.maximumDiscountAmount && (
                      <div className="text-xs text-gray-500">Max: CHF {code.maximumDiscountAmount.toFixed(2)}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {code.usageLimit ? `${code.usageCount} / ${code.usageLimit}` : `${code.usageCount} (${t('admin.discountCodes.unlimited') || 'unlimited'})`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      code.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {code.isActive ? t('admin.discountCodes.active') || 'Active' : t('admin.discountCodes.inactive') || 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <div>
                        <div>{t('admin.discountCodes.from') || 'From'}: {formatDate(code.validFrom)}</div>
                        <div>{t('admin.discountCodes.until') || 'Until'}: {formatDate(code.validUntil)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(code)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(code.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Create/Edit Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingCode ? t('admin.discountCodes.editDiscountCode') || 'Edit Discount Code' : t('admin.discountCodes.createDiscountCode') || 'Create Discount Code'}
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('admin.discountCodes.code') || 'Code'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                    placeholder={t('admin.discountCodes.placeholderCode') || 'SUMMER2024'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('admin.discountCodes.description') || 'Description'}
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={3}
                    placeholder={t('admin.discountCodes.placeholderDescription') || 'Summer sale discount'}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('admin.discountCodes.discountType') || 'Discount Type'} <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.discountType}
                      onChange={(e) => setFormData({ ...formData, discountType: e.target.value as 'PERCENTAGE' | 'FIXED_AMOUNT' })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    >
                      <option value="PERCENTAGE">{t('admin.discountCodes.percentage') || 'Percentage'}</option>
                      <option value="FIXED_AMOUNT">{t('admin.discountCodes.fixedAmount') || 'Fixed Amount'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('admin.discountCodes.discountValue') || 'Discount Value'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formData.discountValue}
                      onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                      placeholder={formData.discountType === 'PERCENTAGE' ? '10' : '50.00'}
                    />
                    <span className="text-xs text-gray-500 mt-1">
                      {formData.discountType === 'PERCENTAGE' ? t('admin.discountCodes.percentageHelp') || 'Percentage (e.g., 10 for 10%)' : t('admin.discountCodes.fixedAmountHelp') || 'Fixed amount in CHF'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('admin.discountCodes.minimumPurchaseAmount') || 'Minimum Purchase Amount (CHF)'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.minimumPurchaseAmount}
                      onChange={(e) => setFormData({ ...formData, minimumPurchaseAmount: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('admin.discountCodes.maximumDiscountAmount') || 'Maximum Discount Amount (CHF)'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.maximumDiscountAmount}
                      onChange={(e) => setFormData({ ...formData, maximumDiscountAmount: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder={t('admin.discountCodes.placeholderMaxDiscount') || 'Leave empty for no limit'}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('admin.discountCodes.usageLimit') || 'Usage Limit'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder={t('admin.discountCodes.placeholderUsageLimit') || 'Leave empty for unlimited'}
                  />
                  <span className="text-xs text-gray-500 mt-1">
                    {t('admin.discountCodes.usageLimitHelp') || 'Maximum number of times this code can be used (leave empty for unlimited)'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('admin.discountCodes.validFrom') || 'Valid From'}
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.validFrom}
                      onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('admin.discountCodes.validUntil') || 'Valid Until'}
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.validUntil}
                      onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                    {t('admin.discountCodes.active') || 'Active'}
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50"
                  >
                    {isSaving ? t('admin.discountCodes.saving') || 'Saving...' : editingCode ? t('admin.discountCodes.update') || 'Update' : t('admin.discountCodes.create') || 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    {t('admin.discountCodes.cancel') || 'Cancel'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}


