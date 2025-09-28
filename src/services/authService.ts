import api from './api'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  roles: string[]
  active: boolean
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
  user: User
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
}

export const authService = {
  // Login with email and password
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post('/api/auth/login', credentials)
    const data = response.data
    
    // Store token in localStorage
    if (data.accessToken) {
      localStorage.setItem('jwt_token', data.accessToken)
    }
    
    return data
  },

  // Register new user
  async register(userData: RegisterData): Promise<AuthResponse> {
    const response = await api.post('/api/auth/register', userData)
    const data = response.data
    
    // Store token in localStorage
    if (data.accessToken) {
      localStorage.setItem('jwt_token', data.accessToken)
    }
    
    return data
  },

  // OAuth2 login (redirect to backend)
  oauth2Login(provider: 'google' = 'google'): void {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/oauth2/authorization/${provider}`
  },

  // Logout
  async logout(): Promise<void> {
    try {
      await api.post('/api/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('jwt_token')
      window.location.href = '/'
    }
  },

  // Get current user info
  async getCurrentUser(): Promise<User> {
    const response = await api.get('/api/auth/me')
    return response.data
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!localStorage.getItem('jwt_token')
  },

  // Get stored token
  getToken(): string | null {
    return localStorage.getItem('jwt_token')
  },

  // Refresh token
  async refreshToken(): Promise<AuthResponse> {
    const response = await api.post('/api/auth/refresh')
    const data = response.data
    
    // Update stored token
    if (data.accessToken) {
      localStorage.setItem('jwt_token', data.accessToken)
    }
    
    return data
  }
}
