'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setUser } = useAuth()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [countdown, setCountdown] = useState(3)
  const hasProcessed = useRef(false)

  useEffect(() => {
    let isMounted = true

    const handleOAuthCallback = async () => {
      // Prevent multiple executions using ref
      if (hasProcessed.current) {
        console.log('OAuth callback already processed, skipping...')
        return
      }
      hasProcessed.current = true

      try {
        console.log('OAuth callback page loaded')
        console.log('Search params:', searchParams.toString())
        
        const token = searchParams.get('token')
        const refreshToken = searchParams.get('refreshToken')
        const user = searchParams.get('user')
        const isAdmin = searchParams.get('isAdmin')
        const redirectUrl = searchParams.get('redirect') || localStorage.getItem('oauth_redirect_url') || '/'

        console.log('Token:', token ? 'Present' : 'Missing')
        console.log('User:', user ? 'Present' : 'Missing')
        console.log('RefreshToken:', refreshToken ? 'Present' : 'Missing')
        console.log('IsAdmin:', isAdmin)
        console.log('RedirectUrl:', redirectUrl)
        
        // Log the actual values for debugging
        if (user) {
          console.log('Raw user data:', user)
        }

        if (!token || !user) {
          console.error('Missing authentication data:', { token: !!token, user: !!user })
          throw new Error('Missing authentication data')
        }

        // Store tokens in localStorage for OAuth users
        localStorage.setItem('jwt_token', token)
        if (refreshToken) {
          localStorage.setItem('jwt_refresh_token', refreshToken)
        }

        // Parse user data
        let userData
        try {
          userData = JSON.parse(decodeURIComponent(user))
          console.log('Parsed user data:', userData)
        } catch (parseError) {
          console.error('Failed to parse user data:', parseError)
          console.error('Raw user data:', user)
          throw new Error('Invalid user data format')
        }
        
        // Only update state if component is still mounted
        if (isMounted) {
          // Set user directly in auth context
          console.log('OAuth callback: Setting user in context...')
          setUser(userData)
          console.log('OAuth callback: User set in context:', userData)
          
          // Mark that we've checked auth to prevent it from being cleared
          window.dispatchEvent(new CustomEvent('authChecked', { detail: { user: userData } }))
          
          // Trigger preference loading and cart migration
          window.dispatchEvent(new CustomEvent('userLoggedIn'))
          console.log('OAuth callback: Dispatched userLoggedIn event for preference loading')
          
          // Cart migration will happen automatically via AuthContext state change
          console.log('OAuth callback: User state updated, cart migration will happen automatically')

          setStatus('success')
          setMessage(`Welcome back, ${userData.firstName || userData.email}!`)
          
          // Start countdown
          let count = 3
          const countdownInterval = setInterval(() => {
            count--
            setCountdown(count)
            if (count <= 0) {
              clearInterval(countdownInterval)
            }
          }, 1000)
        }

        // Clean up stored redirect URL
        localStorage.removeItem('oauth_redirect_url')
        
        // Redirect to the original page after ensuring React has finished rendering
        console.log('Redirecting to:', redirectUrl)
        
        // Simple, direct redirect approach
        console.log('Setting up automatic redirect...')
        console.log('Redirect URL:', redirectUrl)
        console.log('Component mounted:', isMounted)
        
        // Try immediate redirect first
        console.log('Attempting immediate redirect...')
        try {
          window.location.replace(redirectUrl)
          console.log('Immediate redirect successful')
        } catch (error) {
          console.error('Immediate redirect failed:', error)
          
          // Fallback with delay
          console.log('Setting up delayed redirect fallback...')
          setTimeout(() => {
            if (isMounted) {
              console.log('Delayed redirect attempt...')
              try {
                window.location.href = redirectUrl
                console.log('Delayed redirect successful')
              } catch (delayedError) {
                console.error('Delayed redirect failed:', delayedError)
                console.log('Trying router.push as last resort...')
                try {
                  router.push(redirectUrl)
                  console.log('Router.push successful')
                } catch (routerError) {
                  console.error('All redirect methods failed:', routerError)
                }
              }
            } else {
              console.log('Component unmounted, skipping delayed redirect')
            }
          }, 1000)
        }

      } catch (error) {
        console.error('OAuth callback error:', error)
        console.error('Error details:', error)
        
        if (isMounted) {
          setStatus('error')
          setMessage(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
          
          // Add fallback: try to get user from API
          console.log('OAuth callback: Trying fallback API call...')
          fetch('/api/auth/me', { credentials: 'include' })
            .then(response => response.json())
            .then(userData => {
              if (userData && userData.email) {
                console.log('OAuth callback: Fallback successful, user found:', userData)
                setUser(userData)
                
                // Trigger preference loading and cart migration
                window.dispatchEvent(new CustomEvent('userLoggedIn'))
                console.log('OAuth callback: Dispatched userLoggedIn event for preference loading (fallback)')
                
                setStatus('success')
                setMessage(`Welcome back, ${userData.firstName || userData.email}!`)
                // Redirect after fallback success
                setTimeout(() => {
                  if (isMounted) {
                    window.location.replace(redirectUrl)
                  }
                }, 2000)
              } else {
                // No user found, redirect to home
                setTimeout(() => {
                  if (isMounted) {
                    router.push('/')
                  }
                }, 3000)
              }
            })
            .catch(fallbackError => {
              console.error('OAuth callback: Fallback also failed:', fallbackError)
              // Redirect to home after 3 seconds
              setTimeout(() => {
                if (isMounted) {
                  router.push('/')
                }
              }, 3000)
            })
        }
      }
    }

    handleOAuthCallback()

    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false
      console.log('Component cleanup: isMounted set to false')
    }
  }, [searchParams, setUser, router]) // Include dependencies but use ref to prevent multiple executions

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Completing Authentication...
            </h2>
            <p className="text-gray-600">
              Please wait while we finish setting up your account.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Authentication Successful!
            </h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <p className="text-sm text-gray-500 mb-4">
              Redirecting you automatically in {countdown} seconds...
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${((3 - countdown) / 3) * 100}%` }}
              ></div>
            </div>
            <button
              onClick={() => {
                try {
                  const redirectUrl = searchParams.get('redirect') || localStorage.getItem('oauth_redirect_url') || '/'
                  console.log('Manual redirect to:', redirectUrl)
                  // Use window.location.replace for more secure redirect
                  window.location.replace(redirectUrl)
                } catch (error) {
                  console.error('Manual redirect failed:', error)
                  // Fallback to window.location.href
                  try {
                    window.location.href = '/'
                  } catch (fallbackError) {
                    console.error('Fallback redirect failed:', fallbackError)
                    // Last resort: router.push
                    router.push('/')
                  }
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Continue Manually
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Authentication Failed
            </h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <p className="text-sm text-gray-500">
              Redirecting you to the homepage...
            </p>
          </>
        )}
      </div>
    </div>
  )
}
