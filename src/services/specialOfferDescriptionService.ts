import api from './api'

export interface SpecialOfferDescription {
  id: string
  name: string
  slug: string
  description?: string
  createdAt: string
  updatedAt: string
}

export const specialOfferDescriptionService = {
  // Get all special offer descriptions
  async getAllSpecialOfferDescriptions(): Promise<SpecialOfferDescription[]> {
    const response = await api.get('/api/admin/special-offer-descriptions')
    return response.data
  },

  // Search special offer descriptions
  async searchSpecialOfferDescriptions(query?: string): Promise<SpecialOfferDescription[]> {
    const response = await api.get('/api/admin/special-offer-descriptions/search', {
      params: { query }
    })
    return response.data
  },

  // Create a new special offer description
  async createSpecialOfferDescription(data: {
    name: string
    description?: string
  }): Promise<SpecialOfferDescription> {
    const response = await api.post('/api/admin/special-offer-descriptions', data)
    return response.data
  },

  // Update a special offer description
  async updateSpecialOfferDescription(id: string, data: {
    name: string
    description?: string
  }): Promise<SpecialOfferDescription> {
    const response = await api.put(`/api/admin/special-offer-descriptions/${id}`, data)
    return response.data
  },

  // Delete a special offer description
  async deleteSpecialOfferDescription(id: string): Promise<void> {
    await api.delete(`/api/admin/special-offer-descriptions/${id}`)
  },

  // Get default special offer description from system config
  async getDefaultSpecialOfferDescription(): Promise<string> {
    const response = await api.get('/api/admin/system-config')
    const configs = response.data
    const defaultConfig = configs.find((config: any) => config.configKey === 'default_special_offer_description')
    return defaultConfig ? defaultConfig.configValue : ''
  },

  // Update default special offer description in system config
  async updateDefaultSpecialOfferDescription(value: string): Promise<void> {
    await api.put('/api/admin/system-config/default_special_offer_description', { configValue: value })
  }
}
