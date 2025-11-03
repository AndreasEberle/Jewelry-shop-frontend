'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { AccountLayout } from '@/components/account/AccountLayout'
import { userService, Address } from '@/services/userService'
import { MapPin, Plus, Edit2, X } from 'lucide-react'
import api from '@/services/api'

export default function AdminAddressesPage() {
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
    isDefault: false
  })

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
      setAddresses(addressData)
    } catch (error) {
      console.error('Failed to load addresses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAddress = async () => {
    try {
      if (editingAddress) {
        await userService.updateAddress(editingAddress.id, addressForm)
      } else {
        await userService.createAddress(addressForm)
      }
      await loadAddresses()
      setShowAddAddress(false)
      setEditingAddress(null)
      setAddressForm({ street: '', apartment: '', city: '', state: '', postalCode: '', country: '', isDefault: false })
    } catch (error: any) {
      alert(error.message || 'Failed to save address')
    }
  }

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return
    try {
      await userService.deleteAddress(id)
      await loadAddresses()
    } catch (error: any) {
      alert(error.message || 'Failed to delete address')
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
      isDefault: address.isDefault || false
    })
    setShowAddAddress(true)
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <AccountLayout>
        <div className="space-y-6xl">
          <div className="flex items-center justify-between">
            <h1 className="type-heading-3 text-content" style={{ paddingBottom: '24px', fontSize: '1.5rem', fontWeight: 'bold' }}>ADDRESSES</h1>
            {!showAddAddress && (
              <button
                onClick={() => {
                  setShowAddAddress(true)
                  setEditingAddress(null)
                  setAddressForm({ street: '', apartment: '', city: '', state: '', postalCode: '', country: '', isDefault: false })
                }}
                className="flex items-center gap-2 px-4 py-2 bg-black text-white hover:bg-gray-800 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Address</span>
              </button>
            )}
          </div>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <p className="type-body-2 text-content">Loading addresses...</p>
            </div>
          )}

          {(showAddAddress || editingAddress) && (
            <div className="border border-black p-6 space-y-4">
              <h2 className="type-heading-6 text-content mb-4">
                {editingAddress ? 'Edit Address' : 'Add New Address'}
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-content mb-1">
                  Country <span className="text-red-500">*</span>
                </label>
                <select
                  value={addressForm.country}
                  onChange={(e) => {
                    const country = e.target.value
                    setAddressForm({...addressForm, country, city: '', state: '', postalCode: ''})
                  }}
                  className="w-full px-4 py-2 border border-black focus:outline-none focus:ring-2 focus:ring-black"
                  required
                >
                  <option value="">Select Country</option>
                  {shippingCountries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-content mb-1">
                  Street Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={addressForm.street}
                  onChange={(e) => setAddressForm({...addressForm, street: e.target.value})}
                  placeholder="Enter street address"
                  className="w-full px-4 py-2 border border-black focus:outline-none focus:ring-2 focus:ring-black"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-content mb-1">
                  Apartment, Suite, etc. <span className="text-gray-500 text-xs">(Optional)</span>
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
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({...addressForm, city: e.target.value})}
                    placeholder="City"
                    className="w-full px-4 py-2 border border-black focus:outline-none focus:ring-2 focus:ring-black"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-content mb-1">
                    Postal Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={addressForm.postalCode}
                    onChange={(e) => {
                      const postalCode = e.target.value
                      setAddressForm({...addressForm, postalCode})
                      if (addressForm.country === 'Liechtenstein' && postalCode === '9495') {
                        setAddressForm(prev => ({...prev, postalCode, city: 'Triesen'}))
                      }
                    }}
                    placeholder="Postal Code"
                    className="w-full px-4 py-2 border border-black focus:outline-none focus:ring-2 focus:ring-black"
                    required
                  />
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
                  Set as default address
                </label>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleSaveAddress}
                  className="px-6 py-2 bg-black text-white hover:bg-gray-800 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setShowAddAddress(false)
                    setEditingAddress(null)
                    setAddressForm({ street: '', apartment: '', city: '', state: '', postalCode: '', country: '', isDefault: false })
                  }}
                  className="px-6 py-2 border border-black text-black hover:bg-gray-100 transition-colors"
                >
                  Cancel
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
                <div key={address.id} className="border border-black p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {address.isDefault && (
                        <span className="inline-block px-2 py-1 bg-black text-white text-xs font-semibold mb-2">
                          DEFAULT
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
                      <button
                        onClick={() => startEdit(address)}
                        className="p-2 hover:bg-gray-100 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAddress(address.id)}
                        className="p-2 hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <X className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </AccountLayout>
      <Footer />
    </div>
  )
}

