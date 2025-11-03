'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { User, Mail, LogOut, Phone, Calendar, Globe, MapPin, Edit2, Save, X, Plus } from 'lucide-react'
import { LanguageSelector } from '@/components/LanguageSelector'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useLanguageChange } from '@/hooks/useLanguageChange'
import { userService, UserProfile, Address } from '@/services/userService'
import api from '@/services/api'
import Link from 'next/link'

export default function BackupOldAccountPage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth()
  const router = useRouter()
  const { forceUpdate } = useLanguageChange()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showAddAddress, setShowAddAddress] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneCountryCode: '',
    phoneNumber: '',
    dateOfBirth: '',
    gender: '',
    newsletterSubscribed: false,
    marketingEmails: false,
    smsNotifications: false
  })

  const [addressForm, setAddressForm] = useState({
    street: '',
    apartment: '',
    city: '',
    state: '',
    postalCode: '',
    country: ''
  })
  const [shippingCountries, setShippingCountries] = useState<string[]>(['Switzerland', 'Liechtenstein'])

  useEffect(() => {
    // Fetch shipping countries from config
    const fetchShippingCountries = async () => {
      try {
        const response = await api.get('/api/public/shipping-countries')
        if (response.data && response.data.countries) {
          setShippingCountries(response.data.countries)
        }
      } catch (error) {
        console.error('Failed to load shipping countries:', error)
        // Keep default values
      }
    }
    fetchShippingCountries()
  }, [])

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/')
    } else if (user) {
      loadProfile()
      loadAddresses()
    }
  }, [user, isLoading, router])

  const loadProfile = async () => {
    try {
      const profileData = await userService.getProfile()
      setProfile(profileData)
      setFormData({
        firstName: profileData.firstName || '',
        lastName: profileData.lastName || '',
        phoneCountryCode: profileData.phoneCountryCode || '',
        phoneNumber: profileData.phoneNumber || '',
        dateOfBirth: profileData.dateOfBirth ? profileData.dateOfBirth.split('T')[0] : '',
        gender: profileData.gender || '',
        newsletterSubscribed: profileData.newsletterSubscribed || false,
        marketingEmails: profileData.marketingEmails || false,
        smsNotifications: profileData.smsNotifications || false
      })
    } catch (error) {
      console.error('Failed to load profile:', error)
    }
  }

  const loadAddresses = async () => {
    try {
      const addressData = await userService.getAddresses()
      setAddresses(addressData)
    } catch (error) {
      console.error('Failed to load addresses:', error)
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      await userService.updateProfile(formData)
      await loadProfile()
      setIsEditing(false)
    } catch (error: any) {
      alert(error.message || 'Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveAddress = async () => {
    try {
      setIsSaving(true)
      if (editingAddress) {
        await userService.updateAddress(editingAddress.id, addressForm)
      } else {
        await userService.createAddress(addressForm)
      }
      await loadAddresses()
      setShowAddAddress(false)
      setEditingAddress(null)
      setAddressForm({ street: '', apartment: '', city: '', state: '', postalCode: '', country: '' })
    } catch (error: any) {
      alert(error.message || 'Failed to save address')
    } finally {
      setIsSaving(false)
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <User className="h-16 w-16 text-gray-400 mx-auto mb-4 animate-pulse" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading...</h2>
          <p className="text-gray-600">Checking your authentication status.</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Please log in</h2>
          <p className="text-gray-600">You need to be logged in to view your account.</p>
        </div>
      </div>
    )
  }

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  const preferredName = profile?.firstName && profile?.lastName 
    ? `${profile.firstName} ${profile.lastName}` 
    : user?.firstName && user?.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : user?.email?.split('@')[0] || 'User'

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-amber-50">
      <Header />
      <main className="py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg border-4 border-amber-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-amber-100 to-orange-100 border-b-2 border-amber-200">
              <div>
                <h1 className="text-3xl font-bold text-amber-900">My Account</h1>
                <p className="text-amber-700 mt-1">Manage your account information and preferences</p>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Personal Information */}
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-gray-900 flex items-center text-amber-800">
                        <User className="h-5 w-5 mr-2" />
                        Personal Information
                      </h2>
                      {!isEditing && (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="flex items-center space-x-2 px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm"
                        >
                          <Edit2 className="w-4 h-4" />
                          <span>Edit</span>
                        </button>
                      )}
                    </div>
                    <div className="space-y-4 bg-gradient-to-br from-yellow-50 to-amber-50 p-4 rounded-lg border border-amber-200">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                          {isEditing ? (
                            <input
                              type="text"
                              value={formData.firstName}
                              onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                          ) : (
                            <p className="text-sm text-gray-900 font-medium">{profile?.firstName || user.firstName}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                          {isEditing ? (
                            <input
                              type="text"
                              value={formData.lastName}
                              onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                          ) : (
                            <p className="text-sm text-gray-900 font-medium">{profile?.lastName || user.lastName}</p>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                          <Mail className="h-4 w-4 mr-1" />
                          Email
                        </label>
                        <p className="text-sm text-gray-900">{user.email}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                            <Phone className="h-4 w-4 mr-1" />
                            Phone Country Code
                          </label>
                          {isEditing ? (
                            <input
                              type="text"
                              value={formData.phoneCountryCode}
                              onChange={(e) => setFormData({...formData, phoneCountryCode: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                              placeholder="+41"
                            />
                          ) : (
                            <p className="text-sm text-gray-900">{profile?.phoneCountryCode || '-'}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                          {isEditing ? (
                            <input
                              type="text"
                              value={formData.phoneNumber}
                              onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                              placeholder="123 456 789"
                            />
                          ) : (
                            <p className="text-sm text-gray-900">{profile?.phoneNumber || '-'}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            Date of Birth
                          </label>
                          {isEditing ? (
                            <input
                              type="date"
                              value={formData.dateOfBirth}
                              onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                          ) : (
                            <p className="text-sm text-gray-900">{profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : '-'}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                          {isEditing ? (
                            <select
                              value={formData.gender}
                              onChange={(e) => setFormData({...formData, gender: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                            >
                              <option value="">Select...</option>
                              <option value="male">Male</option>
                              <option value="female">Female</option>
                              <option value="other">Other</option>
                              <option value="prefer_not_to_say">Prefer not to say</option>
                            </select>
                          ) : (
                            <p className="text-sm text-gray-900 capitalize">{profile?.gender || '-'}</p>
                          )}
                        </div>
                      </div>

                      {isEditing && (
                        <div className="flex space-x-4 pt-4 border-t border-amber-200">
                          <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                          >
                            <Save className="w-4 h-4" />
                            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                          </button>
                          <button
                            onClick={() => {
                              setIsEditing(false)
                              loadProfile()
                            }}
                            className="flex items-center space-x-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                          >
                            <X className="w-4 h-4" />
                            <span>Cancel</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Addresses */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-gray-900 flex items-center text-amber-800">
                        <MapPin className="h-5 w-5 mr-2" />
                        Addresses
                      </h2>
                      {!showAddAddress && !editingAddress && (
                        <button
                          onClick={() => setShowAddAddress(true)}
                          className="flex items-center space-x-2 px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add Address</span>
                        </button>
                      )}
                    </div>
                    
                    {(showAddAddress || editingAddress) && (
                      <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-4 rounded-lg border border-amber-200 mb-4">
                        <h3 className="font-semibold text-gray-900 mb-3">{editingAddress ? 'Edit Address' : 'Add New Address'}</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Country <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={addressForm.country}
                              onChange={(e) => {
                                const country = e.target.value
                                setAddressForm({...addressForm, country, city: '', state: '', postalCode: ''})
                              }}
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-base"
                              required
                            >
                              <option value="">Select Country</option>
                              {shippingCountries.map(country => (
                                <option key={country} value={country}>{country}</option>
                              ))}
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Street Address <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={addressForm.street}
                              onChange={(e) => setAddressForm({...addressForm, street: e.target.value})}
                              placeholder="Enter street address"
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-base"
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Apartment, Suite, Unit, etc. <span className="text-gray-500 text-xs">(Optional)</span>
                            </label>
                            <input
                              type="text"
                              value={addressForm.apartment}
                              onChange={(e) => setAddressForm({...addressForm, apartment: e.target.value})}
                              placeholder="Apt, Suite, Unit, Building, Floor, etc."
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-base"
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                City <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={addressForm.city}
                                onChange={(e) => setAddressForm({...addressForm, city: e.target.value})}
                                placeholder="City"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-base"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-base"
                                required
                              />
                            </div>
                          </div>
                          
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={addressForm.isDefault || false}
                              onChange={(e) => setAddressForm({...addressForm, isDefault: e.target.checked})}
                              className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                            />
                            <label className="ml-2 text-sm text-gray-700">
                              Set as default address
                            </label>
                          </div>
                          <div className="flex space-x-2 pt-2">
                            <button
                              onClick={handleSaveAddress}
                              disabled={isSaving}
                              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
                            >
                              <Save className="w-4 h-4" />
                              <span>Save</span>
                            </button>
                            <button
                              onClick={() => {
                                setShowAddAddress(false)
                                setEditingAddress(null)
                                setAddressForm({ street: '', apartment: '', city: '', state: '', postalCode: '', country: '' })
                              }}
                              className="flex items-center space-x-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 text-sm"
                            >
                              <X className="w-4 h-4" />
                              <span>Cancel</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      {addresses.length === 0 ? (
                        <p className="text-gray-500 text-sm italic">No addresses saved yet</p>
                      ) : (
                        addresses.map((address) => (
                          <div key={address.id} className="bg-gradient-to-br from-yellow-50 to-amber-50 p-4 rounded-lg border border-amber-200">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                {address.isDefault && (
                                  <span className="inline-block px-2 py-1 bg-amber-500 text-white text-xs font-semibold rounded mb-2">
                                    Default
                                  </span>
                                )}
                                <p className="text-sm text-gray-900 font-medium">
                                  {address.street}{address.apartment && `, ${address.apartment}`}
                                </p>
                                <p className="text-sm text-gray-700">
                                  {address.city}{address.state && `, ${address.state}`} {address.postalCode}
                                </p>
                                <p className="text-sm text-gray-700">{address.country}</p>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => {
                                    setEditingAddress(address)
                                    setAddressForm({
                                      street: address.street,
                                      apartment: address.apartment || '',
                                      city: address.city,
                                      state: address.state || '',
                                      postalCode: address.postalCode,
                                      country: address.country
                                    })
                                    setShowAddAddress(false)
                                  }}
                                  className="p-2 text-amber-700 hover:bg-amber-100 rounded"
                                  title="Edit"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteAddress(address.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                                  title="Delete"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Settings & Preferences */}
                <div className="space-y-6">
                  {/* Settings */}
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center text-amber-800">
                      <Globe className="h-5 w-5 mr-2" />
                      Settings / Einstellungen
                    </h2>
                    <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-4 rounded-lg border border-amber-200">
                      <LanguageSelector />
                      
                      {isEditing && (
                        <div className="mt-4 pt-4 border-t border-amber-200 space-y-3">
                          <label className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={formData.newsletterSubscribed}
                              onChange={(e) => setFormData({...formData, newsletterSubscribed: e.target.checked})}
                              className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                            />
                            <span className="text-sm text-gray-700">Subscribe to Newsletter</span>
                          </label>
                          <label className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={formData.marketingEmails}
                              onChange={(e) => setFormData({...formData, marketingEmails: e.target.checked})}
                              className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                            />
                            <span className="text-sm text-gray-700">Receive Marketing Emails</span>
                          </label>
                          <label className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={formData.smsNotifications}
                              onChange={(e) => setFormData({...formData, smsNotifications: e.target.checked})}
                              className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                            />
                            <span className="text-sm text-gray-700">SMS Notifications</span>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick Links - Enhanced */}
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 text-amber-800">Quick Links</h2>
                    <div className="grid grid-cols-1 gap-3">
                      <Link
                        href="/cart"
                        className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all transform hover:scale-105"
                      >
                        <span className="font-semibold">View Shopping Cart</span>
                        <span className="text-xl">🛒</span>
                      </Link>
                      <Link
                        href="/products"
                        className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-500 hover:to-amber-500 text-white rounded-lg shadow-md hover:shadow-lg transition-all transform hover:scale-105"
                      >
                        <span className="font-semibold">Continue Shopping</span>
                        <span className="text-xl">✨</span>
                      </Link>
                      {user?.roles?.includes('ADMIN') && (
                        <Link
                          href="/account"
                          className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all transform hover:scale-105"
                        >
                          <span className="font-semibold">Admin Dashboard</span>
                          <span className="text-xl">⚙️</span>
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Account Actions */}
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 text-amber-800">Account Actions</h2>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-3 border-2 border-red-300 rounded-lg shadow-sm text-sm font-semibold text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

