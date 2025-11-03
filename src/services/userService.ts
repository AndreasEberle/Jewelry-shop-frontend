import api from './api'

export interface UserProfile {
  id: string
  email: string
  firstName: string
  lastName: string
  phoneCountryCode?: string
  phoneNumber?: string
  dateOfBirth?: string
  gender?: string
  preferredLanguage?: string
  timezone?: string
  newsletterSubscribed?: boolean
  marketingEmails?: boolean
  smsNotifications?: boolean
}

export interface Address {
  id: string
  street: string
  apartment?: string
  city: string
  state?: string
  postalCode: string
  country: string
  isDefault: boolean
}

export interface UpdateProfileRequest {
  firstName?: string
  lastName?: string
  phoneCountryCode?: string
  phoneNumber?: string
  dateOfBirth?: string
  gender?: string
  preferredLanguage?: string
  timezone?: string
  newsletterSubscribed?: boolean
  marketingEmails?: boolean
  smsNotifications?: boolean
}

export const userService = {
  // Get current user profile
  async getProfile(): Promise<UserProfile> {
    const response = await api.get('/api/auth/me')
    return response.data
  },

  // Update user profile
  async updateProfile(data: UpdateProfileRequest): Promise<UserProfile> {
    const response = await api.put('/api/user/profile', data)
    return response.data
  },

  // Get user addresses
  async getAddresses(): Promise<Address[]> {
    const response = await api.get('/api/user/addresses')
    return response.data
  },

  // Create address
  async createAddress(address: Omit<Address, 'id' | 'isDefault'>): Promise<Address> {
    const response = await api.post('/api/user/addresses', address)
    return response.data
  },

  // Update address
  async updateAddress(id: string, address: Partial<Address>): Promise<Address> {
    const response = await api.put(`/api/user/addresses/${id}`, address)
    return response.data
  },

  // Delete address
  async deleteAddress(id: string): Promise<void> {
    await api.delete(`/api/user/addresses/${id}`)
  }
}

