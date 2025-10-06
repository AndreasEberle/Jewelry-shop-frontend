import api from './api'

export interface Tag {
  id: string
  name: string
  slug: string
  description?: string
  createdAt: string
  updatedAt: string
}

export interface CreateTagRequest {
  name: string
}

export const tagService = {
  // Get all tags
  async getAllTags(): Promise<Tag[]> {
    const response = await api.get('/api/tags')
    return response.data
  },

  // Search tags by name
  async searchTags(query: string): Promise<Tag[]> {
    const response = await api.get(`/api/tags/search?query=${encodeURIComponent(query)}`)
    return response.data
  },

  // Create a new tag
  async createTag(tagData: CreateTagRequest): Promise<Tag> {
    const response = await api.post('/api/tags', tagData)
    return response.data
  }
}
