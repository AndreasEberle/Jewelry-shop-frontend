import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // This ensures cookies are sent with requests
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Add JWT token if available
    const token = localStorage.getItem('jwt_token')
    // Only log important requests to reduce console noise
    if (config.url?.includes('/admin/') || config.url?.includes('/auth/')) {
      console.log('API Interceptor: Request to', config.url, 'Token:', token ? `Present` : 'Missing')
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    // Only log important responses to reduce console noise
    if (response.config.url?.includes('/admin/') || response.config.url?.includes('/auth/')) {
      console.log('API Interceptor: Response from', response.config.url, 'Status:', response.status)
    }
    return response
  },
  (error) => {
    console.log('API Interceptor: Error from', error.config?.url, 'Status:', error.response?.status, 'Message:', error.message)
    if (error.response?.status === 401) {
      // Handle unauthorized access
      console.log('API Interceptor: 401 error - clearing token and redirecting')
      localStorage.removeItem('jwt_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

