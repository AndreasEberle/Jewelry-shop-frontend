'use client'

import { useState, useEffect, useRef } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { UserDataTable } from '@/components/admin/UserDataTable'
import { useTranslation } from '@/hooks/useTranslation'
import api from '@/services/api'
import { Users, Search, Filter } from 'lucide-react'

interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  phoneNumber?: string
  phoneCountryCode?: string
  dateOfBirth?: string
  gender?: string
  roles: string[]
  active: boolean
  oauthOnly: boolean
  ldapEnabled?: boolean
  totpEnabled?: boolean
  createdAt: string
  updatedAt?: string
  lastLoginAt?: string
  // Newsletter and marketing preferences
  newsletterSubscribed?: boolean
  marketingEmails?: boolean
  smsNotifications?: boolean
  // Additional user information
  preferredLanguage?: string
  timezone?: string
  emailVerified?: boolean
  phoneVerified?: boolean
  profileCompleted?: boolean
  notes?: string
  // User preferences
  language?: string
  currency?: string
  preferencesCreatedAt?: string
  preferencesUpdatedAt?: string
  // Related data counts
  addressCount?: number
  orderCount?: number
  paymentCount?: number
  totalSpent?: number
}

export default function AdminUsersPage() {
  const { t } = useTranslation()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'ADMIN' | 'CUSTOMER'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [authFilter, setAuthFilter] = useState<'all' | 'oauth' | 'email'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)
  const [totalUsers, setTotalUsers] = useState(0)
  const [initialLoad, setInitialLoad] = useState(false)
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [showFilters, setShowFilters] = useState(true)

  // Load users ONLY ONCE on mount - no more constant API calls!
  useEffect(() => {
    console.log('Users: Loading users ONCE on mount')
    loadUsers()
  }, []) // Empty dependency array = only run once on mount

  // Handle filter changes with a single useEffect
  useEffect(() => {
    if (initialLoad) { // Only run after initial load
      console.log('Users: Filters changed, reloading users')
      loadUsers()
    }
  }, [currentPage, itemsPerPage, roleFilter, statusFilter, authFilter])

  // Handle search with debouncing
  useEffect(() => {
    if (!initialLoad) return // Don't search until initial load is done
    
    const timeoutId = setTimeout(() => {
      console.log('Users: Search query changed, reloading users')
      loadUsers()
    }, 500) // 500ms delay

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    // Keep focus on the search input after state update
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus()
      }
    }, 0)
  }

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery('')
    setRoleFilter('all')
    setStatusFilter('all')
    setAuthFilter('all')
    setCurrentPage(1)
  }

  // Get active filters count
  const getActiveFiltersCount = () => {
    let count = 0
    if (searchQuery.trim() !== '') count++
    if (roleFilter !== 'all') count++
    if (statusFilter !== 'all') count++
    if (authFilter !== 'all') count++
    return count
  }

  // Remove specific filter
  const removeFilter = (filterType: 'search' | 'role' | 'status' | 'auth') => {
    switch (filterType) {
      case 'search':
        setSearchQuery('')
        break
      case 'role':
        setRoleFilter('all')
        break
      case 'status':
        setStatusFilter('all')
        break
      case 'auth':
        setAuthFilter('all')
        break
    }
  }

  const loadUsers = async () => {
    // Prevent multiple simultaneous API calls
    if (isLoadingUsers) {
      console.log('Users: API call already in progress, skipping...')
      return
    }
    
    try {
      setIsLoadingUsers(true)
      setLoading(true)
      console.log('Users: Loading users with filters:', { currentPage, itemsPerPage, roleFilter, statusFilter, authFilter, searchQuery })
      
      const params = new URLSearchParams({
        page: (currentPage - 1).toString(),
        size: itemsPerPage.toString(),
        search: searchQuery,
        role: roleFilter !== 'all' ? roleFilter : '',
        status: statusFilter !== 'all' ? statusFilter : '',
        auth: authFilter !== 'all' ? authFilter : ''
      })
      
      const response = await api.get(`/api/admin/users?${params}`)
      
      setUsers(response.data.content || response.data)
      setTotalUsers(response.data.totalElements || response.data.length)
      setInitialLoad(true) // Mark initial load as complete
      console.log('Users: Loaded', response.data.content?.length || response.data.length, 'users')
    } catch (err) {
      setError(t('admin.users.failedToLoad') || 'Failed to load users')
      console.error('Error loading users:', err)
    } finally {
      setLoading(false)
      setIsLoadingUsers(false)
    }
  }

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await api.patch(`/api/admin/users/${userId}/toggle-status`)
      
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, active: !currentStatus } : user
      ))
    } catch (err) {
      setError('Failed to update user status')
      console.error('Error toggling user status:', err)
    }
  }

  const totalPages = Math.ceil(totalUsers / itemsPerPage)

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
        <div className="flex items-center space-x-3 mb-6">
          <Users className="w-8 h-8 text-primary-600" />
          <h1 className="text-3xl font-bold text-gray-900">{t('admin.users.title') || 'User Management'}</h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            {/* Filter Management Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <h3 className="text-lg font-medium text-gray-900">{t('admin.users.filters') || 'Filters'}</h3>
                {getActiveFiltersCount() > 0 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {getActiveFiltersCount()} {t('admin.users.activeFilters') || 'active'}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  {showFilters ? t('admin.users.hideFilters') || 'Hide Filters' : t('admin.users.showFilters') || 'Show Filters'}
                </button>
                {getActiveFiltersCount() > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    {t('admin.users.clearAll') || 'Clear All'}
                  </button>
                )}
              </div>
            </div>

            {/* Active Filters Display */}
            {getActiveFiltersCount() > 0 && (
              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  {searchQuery.trim() !== '' && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {t('admin.users.search') || 'Search'}: "{searchQuery}"
                      <button
                        onClick={() => removeFilter('search')}
                        className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-600"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {roleFilter !== 'all' && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      {t('admin.users.role') || 'Role'}: {roleFilter}
                      <button
                        onClick={() => removeFilter('role')}
                        className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full text-green-400 hover:bg-green-200 hover:text-green-600"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {statusFilter !== 'all' && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                      {t('admin.users.status') || 'Status'}: {statusFilter}
                      <button
                        onClick={() => removeFilter('status')}
                        className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full text-yellow-400 hover:bg-yellow-200 hover:text-yellow-600"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {authFilter !== 'all' && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                      {t('admin.users.auth') || 'Auth'}: {authFilter}
                      <button
                        onClick={() => removeFilter('auth')}
                        className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full text-purple-400 hover:bg-purple-200 hover:text-purple-600"
                      >
                        ×
                      </button>
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Filters Grid */}
            {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.users.searchPlaceholder') || 'Search'}</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder={t('admin.users.searchPlaceholder') || 'Search users...'}
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.users.filterByRole') || 'Role'}</label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">{t('admin.users.allRoles') || 'All Roles'}</option>
                  <option value="ADMIN">{t('admin.administrator') || 'Admin'}</option>
                  <option value="CUSTOMER">{t('admin.user') || 'Customer'}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.users.filterByStatus') || 'Status'}</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">{t('admin.users.allStatuses') || 'All Statuses'}</option>
                  <option value="active">{t('admin.users.active') || 'Active'}</option>
                  <option value="inactive">{t('admin.users.inactive') || 'Inactive'}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.users.filterByAuth') || 'Auth Type'}</label>
                <select
                  value={authFilter}
                  onChange={(e) => setAuthFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">{t('admin.users.allAuthTypes') || 'All Auth Types'}</option>
                  <option value="oauth">{t('admin.users.oauth') || 'OAuth Only'}</option>
                  <option value="email">{t('admin.users.email') || 'Email/Password'}</option>
                </select>
              </div>
            </div>
            )}

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
                  <span className="text-sm text-gray-500">{t('admin.users.itemsPerPage') || 'per page'}</span>
                </div>
              </div>

              <div className="text-sm text-gray-600">
                {t('admin.users.showing') || 'Showing'} {users.length} {t('admin.users.of') || 'of'} {totalUsers} {t('admin.users.results') || 'users'}
              </div>
            </div>
          </div>
        </div>

        {/* Users Data Table */}
        <UserDataTable 
          data={users} 
          onToggleStatus={handleToggleUserStatus}
          loading={loading}
        />
      </div>
    </AdminLayout>
  )
}
