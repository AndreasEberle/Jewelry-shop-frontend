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
  countryCode?: string
  dateOfBirth?: string
  gender?: string
  newsletterSubscribed?: boolean
  address?: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
}

export const authService = {
  // Login with email and password
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    console.log('authService: Attempting login with credentials:', { email: credentials.email })
    try {
      const response = await api.post('/api/auth/login', credentials)
      console.log('authService: Login response received:', response.data)
      const data = response.data
      
      // Store token in localStorage
      if (data.accessToken) {
        localStorage.setItem('jwt_token', data.accessToken)
        console.log('authService: Token stored in localStorage')
      } else {
        console.warn('authService: No access token in response')
      }
      
      return data
    } catch (error) {
      console.error('authService: Login failed:', error)
      throw error
    }
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
    // Store current page for redirect after OAuth
    const currentPath = window.location.pathname + window.location.search
    localStorage.setItem('oauth_redirect_url', currentPath)
    
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/oauth2/authorization/${provider}`
  },

  // Logout
  async logout(): Promise<void> {
    try {
      await api.post('/api/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear localStorage for email/password users
      localStorage.removeItem('jwt_token')
      localStorage.removeItem('jwt_refresh_token')
      // Don't redirect here - let AuthContext handle it
    }
  },

  // Get current user info
  async getCurrentUser(): Promise<User> {
    console.log('authService: getCurrentUser called')
    console.log('authService: JWT token in localStorage:', localStorage.getItem('jwt_token') ? 'Present' : 'Missing')
    const response = await api.get('/api/auth/me')
    console.log('authService: getCurrentUser response:', response.data)
    return response.data
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    // Check localStorage first (for email/password login)
    const localToken = localStorage.getItem('jwt_token')
    if (localToken) {
      return true
    }
    
    // For OAuth users, we can't check HTTP-only cookies directly
    // But we can check if we have a user in the AuthContext
    // This will be handled by the AuthContext itself
    return false
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
  },

  // Forgot password - request password reset
  async forgotPassword(email: string): Promise<void> {
    await api.post('/api/auth/forgot-password', null, {
      params: { email }
    })
  },

  // Reset password with token
  async resetPassword(token: string, newPassword: string): Promise<void> {
    await api.post('/api/auth/reset-password', null, {
      params: { token, newPassword }
    })
  }
}

