'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { AccountLayout } from '@/components/account/AccountLayout'
import { userService, Address } from '@/services/userService'
import { MapPin, Plus, Edit2, X, Trash2, Edit } from 'lucide-react'
import api from '@/services/api'
import { useTranslation } from '@/hooks/useTranslation'
import { ConfirmationModal } from '@/components/admin/ConfirmationModal'

export default function AdminAddressesPage() {
  const { t, isLoading: isLanguageLoading } = useTranslation()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddAddress, setShowAddAddress] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [shippingCountries, setShippingCountries] = useState<string[]>(['Switzerland', 'Liechtenstein'])
  
  const [addressForm, setAddressForm] = useState({
    street: '',
    apartment: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    isDefault: false,
    isMain: false
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    loadAddresses()
    fetchShippingCountries()
  }, [])

  const fetchShippingCountries = async () => {
    try {
      const response = await api.get('/api/public/shipping-countries')
      if (response.data && response.data.countries) {
        setShippingCountries(response.data.countries)
      }
    } catch (error) {
      console.error('Failed to load shipping countries:', error)
    }
  }

  const loadAddresses = async () => {
    try {
      setLoading(true)
      const addressData = await userService.getAddresses()
      // Sort addresses: default first, then by creation date
      const sorted = addressData.sort((a, b) => {
        if (a.isDefault && !b.isDefault) return -1
        if (!a.isDefault && b.isDefault) return 1
        return 0
      })
      setAddresses(sorted)
    } catch (error) {
      console.error('Failed to load addresses:', error)
    } finally {
      setLoading(false)
    }
  }

  const validateAddressForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!addressForm.street.trim()) {
      newErrors.street = t('account.enterStreetAddress')
    }
    if (!addressForm.city.trim()) {
      newErrors.city = t('account.enterCity')
    }
    if (!addressForm.postalCode.trim()) {
      newErrors.postalCode = t('account.enterPostalCode')
    }
    if (!addressForm.country) {
      newErrors.country = t('account.selectCountry')
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSaveAddress = async () => {
    if (!validateAddressForm()) {
      return
    }
    
    try {
      // Remove isMain from request as backend doesn't support it yet
      const { isMain, ...addressData } = addressForm
      
      if (editingAddress) {
        await userService.updateAddress(editingAddress.id, addressData)
      } else {
        await userService.createAddress(addressData)
      }
      await loadAddresses()
      setShowAddAddress(false)
      setEditingAddress(null)
      setErrors({})
      setAddressForm({ street: '', apartment: '', city: '', state: '', postalCode: '', country: '', isDefault: false, isMain: false })
    } catch (error: any) {
      alert(error.message || 'Failed to save address')
    }
  }

  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; addressId: string | null }>({
    isOpen: false,
    addressId: null
  })

  const handleDeleteClick = (id: string) => {
    setDeleteConfirm({ isOpen: true, addressId: id })
  }

  const handleDeleteCancel = () => {
    setDeleteConfirm({ isOpen: false, addressId: null })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.addressId) return
    try {
      await userService.deleteAddress(deleteConfirm.addressId)
      await loadAddresses()
      setDeleteConfirm({ isOpen: false, addressId: null })
    } catch (error: any) {
      alert(error.message || 'Failed to delete address')
    }
  }

  const handleSetAsDefault = async (id: string) => {
    try {
      await userService.updateAddress(id, { isDefault: true })
      // Update the addresses list immediately
      setAddresses(prev => {
        // Update the address that was set as default
        const updated = prev.map(addr => {
          if (addr.id === id) {
            return { ...addr, isDefault: true }
          } else {
            // Unset other defaults
            return { ...addr, isDefault: false }
          }
        })
        // Sort: default first
        return updated.sort((a, b) => {
          if (a.isDefault && !b.isDefault) return -1
          if (!a.isDefault && b.isDefault) return 1
          return 0
        })
      })
    } catch (error: any) {
      alert(error.message || 'Failed to set default address')
    }
  }

  const startEdit = (address: Address) => {
    setEditingAddress(address)
    setAddressForm({
      street: address.street,
      apartment: address.apartment || '',
      city: address.city,
      state: address.state || '',
      postalCode: address.postalCode,
      country: address.country,
      isDefault: address.isDefault || false,
      isMain: (address as any).isMain || false
    })
    setErrors({})
    setShowAddAddress(true)
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <AccountLayout>
        <div className="space-y-6xl">
          <div className="flex items-center justify-between mt-6">
            <h1 className="type-heading-3 text-content" style={{ paddingBottom: '24px', fontSize: '1.5rem', fontWeight: 'bold' }}>
              {!isLanguageLoading ? t('account.addressesTitle') : (
                <span className="h-6 w-32 bg-gray-200 rounded animate-pulse inline-block"></span>
              )}
            </h1>
            {!showAddAddress && (
              <button
                onClick={() => {
                  setShowAddAddress(true)
                  setEditingAddress(null)
                  setAddressForm({ street: '', apartment: '', city: '', state: '', postalCode: '', country: '', isDefault: false, isMain: false })
                  setErrors({})
                }}
                className="flex items-center gap-2 px-4 py-2 bg-black text-white hover:bg-gray-800 transition-colors"
              >
                <Plus className="w-4 h-4" />
                {!isLanguageLoading ? <span>{t('account.addAddress')}</span> : (
                  <span className="h-4 w-24 bg-gray-200 rounded animate-pulse"></span>
                )}
              </button>
            )}
          </div>

          {loading && (
            <div className="flex items-center justify-center py-12">
              {!isLanguageLoading ? (
                <p className="type-body-2 text-content">{t('account.loadingAddresses')}</p>
              ) : (
                <div className="h-6 w-40 bg-gray-200 rounded animate-pulse"></div>
              )}
            </div>
          )}

          {(showAddAddress || editingAddress) && (
            <div className="border border-black p-6 space-y-4">
              <h2 className="type-heading-6 text-content mb-4">
                {!isLanguageLoading ? (editingAddress ? t('account.editAddress') : t('account.addNewAddress')) : (
                  <span className="h-6 w-48 bg-gray-200 rounded animate-pulse inline-block"></span>
                )}
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-content mb-1">
                  {t('account.country')} <span className="text-red-500">*</span>
                </label>
                <select
                  value={addressForm.country}
                  onChange={(e) => {
                    const country = e.target.value
                    setAddressForm({...addressForm, country, city: '', state: '', postalCode: ''})
                    if (errors.country) {
                      setErrors({...errors, country: ''})
                    }
                  }}
                  className={`w-full px-4 py-2 border focus:outline-none focus:ring-2 ${
                    errors.country
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-black focus:ring-black'
                  }`}
                  required
                >
                  <option value="">{t('account.selectCountry')}</option>
                  {shippingCountries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
                {errors.country && (
                  <p className="mt-1 text-sm text-red-600">{errors.country}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-content mb-1">
                  {t('account.streetAddress')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={addressForm.street}
                  onChange={(e) => {
                    setAddressForm({...addressForm, street: e.target.value})
                    if (errors.street) {
                      setErrors({...errors, street: ''})
                    }
                  }}
                  placeholder="Enter street address"
                  className={`w-full px-4 py-2 border focus:outline-none focus:ring-2 ${
                    errors.street
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-black focus:ring-black'
                  }`}
                  required
                />
                {errors.street && (
                  <p className="mt-1 text-sm text-red-600">{errors.street}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-content mb-1">
                  {t('account.apartmentSuite')} <span className="text-gray-500 text-xs">({!isLanguageLoading ? t('common.optional') : '(Optional)'})</span>
                </label>
                <input
                  type="text"
                  value={addressForm.apartment}
                  onChange={(e) => setAddressForm({...addressForm, apartment: e.target.value})}
                  placeholder="Apt, Suite, Unit, etc."
                  className="w-full px-4 py-2 border border-black focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-content mb-1">
                    {t('account.city')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={addressForm.city}
                    onChange={(e) => {
                      setAddressForm({...addressForm, city: e.target.value})
                      if (errors.city) {
                        setErrors({...errors, city: ''})
                      }
                    }}
                    placeholder="City"
                    className={`w-full px-4 py-2 border focus:outline-none focus:ring-2 ${
                      errors.city
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-black focus:ring-black'
                    }`}
                    required
                  />
                  {errors.city && (
                    <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-content mb-1">
                    {t('account.postalCode')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={addressForm.postalCode}
                    onChange={(e) => {
                      const postalCode = e.target.value
                      setAddressForm({...addressForm, postalCode})
                      if (errors.postalCode) {
                        setErrors({...errors, postalCode: ''})
                      }
                      if (addressForm.country === 'Liechtenstein' && postalCode === '9495') {
                        setAddressForm(prev => ({...prev, postalCode, city: 'Triesen'}))
                      }
                    }}
                    placeholder="Postal Code"
                    className={`w-full px-4 py-2 border focus:outline-none focus:ring-2 ${
                      errors.postalCode
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-black focus:ring-black'
                    }`}
                    required
                  />
                  {errors.postalCode && (
                    <p className="mt-1 text-sm text-red-600">{errors.postalCode}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={addressForm.isDefault}
                  onChange={(e) => setAddressForm({...addressForm, isDefault: e.target.checked})}
                  className="h-4 w-4 text-black focus:ring-black border-black"
                />
                <label className="ml-2 text-sm text-content">
                  {t('account.setAsDefault')}
                </label>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleSaveAddress}
                  className="px-6 py-2 bg-black text-white hover:bg-gray-800 transition-colors"
                >
                  {t('account.save')}
                </button>
                <button
                  onClick={() => {
                    setShowAddAddress(false)
                    setEditingAddress(null)
                    setAddressForm({ street: '', apartment: '', city: '', state: '', postalCode: '', country: '', isDefault: false, isMain: false })
                  setErrors({})
                  }}
                  className="px-6 py-2 border border-black text-black hover:bg-gray-100 transition-colors"
                >
                  {t('account.cancel')}
                </button>
              </div>
            </div>
          )}

          {!loading && addresses.length === 0 && !showAddAddress && (
            <div className="text-center py-12">
              <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="type-body-2 text-content mb-4">You haven't saved any addresses yet.</p>
            </div>
          )}

          {!loading && addresses.length > 0 && (
            <div className="space-y-6">
              {addresses.map((address) => (
                <div key={address.id} className={`border p-6 ${address.isDefault ? 'border-black bg-gray-50' : 'border-gray-300'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {address.isDefault && (
                        <span className="inline-block px-2 py-1 bg-black text-white text-xs font-semibold mb-2">
                          {!isLanguageLoading ? t('account.default').toUpperCase() : (
                            <span className="h-4 w-16 bg-gray-200 rounded animate-pulse inline-block"></span>
                          )}
                        </span>
                      )}
                      <p className="type-body-2 text-content font-medium mb-1">
                        {address.street}{address.apartment && `, ${address.apartment}`}
                      </p>
                      <p className="type-body-2 text-content">
                        {address.city}{address.state && `, ${address.state}`} {address.postalCode}
                      </p>
                      <p className="type-body-2 text-content">{address.country}</p>
                    </div>
                    <div className="flex gap-2">
                      {!address.isDefault && (
                        <button
                          onClick={() => handleSetAsDefault(address.id)}
                          className="px-3 py-1 border border-black text-black hover:bg-gray-100 transition-colors text-xs"
                          title={!isLanguageLoading ? t('account.setAsDefault') : 'Set as default'}
                        >
                          {!isLanguageLoading ? t('account.setAsDefault') : (
                            <span className="h-4 w-20 bg-gray-200 rounded animate-pulse inline-block"></span>
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => startEdit(address)}
                        className="px-3 py-1 border border-black text-black hover:bg-gray-100 transition-colors"
                        title={!isLanguageLoading ? t('account.editAddress') : 'Edit'}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(address.id)}
                        className="px-3 py-1 border border-red-600 text-red-600 hover:bg-red-50 transition-colors"
                        title={!isLanguageLoading ? t('common.delete') : 'Delete'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Delete Confirmation Modal */}
          <ConfirmationModal
            isOpen={deleteConfirm.isOpen}
            onClose={handleDeleteCancel}
            onConfirm={handleDeleteConfirm}
            title={!isLanguageLoading ? t('account.deleteAddress') : 'Delete Address'}
            message={!isLanguageLoading ? t('account.deleteAddressConfirm') : 'Are you sure you want to delete this address? This action cannot be undone.'}
            confirmText={!isLanguageLoading ? t('common.delete') : 'Delete'}
            cancelText={!isLanguageLoading ? t('account.cancel') : 'Cancel'}
            type="danger"
          />
        </div>
      </AccountLayout>
      <Footer />
    </div>
  )
}

