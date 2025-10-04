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

        if (!token || !user) {
          throw new Error('Missing authentication data')
        }

        // Note: Tokens are already set as HTTP-only cookies by the backend
        // No need to store them in localStorage

        // Parse user data
        const userData = JSON.parse(decodeURIComponent(user))
        console.log('Parsed user data:', userData)
        
        // Only update state if component is still mounted
        if (isMounted) {
          // Set user directly in auth context
          console.log('Setting user in context...')
          setUser(userData)
          console.log('User set in context')
          
          // Trigger cart migration after successful OAuth login
          window.dispatchEvent(new CustomEvent('userLoggedIn'))

          setStatus('success')
          setMessage(`Welcome back, ${userData.firstName || userData.email}!`)
        }

        // Clean up stored redirect URL
        localStorage.removeItem('oauth_redirect_url')
        
        // Redirect to the original page after ensuring React has finished rendering
        console.log('Redirecting to:', redirectUrl)
        
        // Use multiple redirect strategies
        console.log('Setting up automatic redirect strategies...')
        
        // Strategy 1: Immediate redirect (after state is set)
        setTimeout(() => {
          if (isMounted) {
            console.log('Strategy 1: Attempting immediate redirect...')
            try {
              window.location.replace(redirectUrl)
              console.log('Strategy 1: Immediate redirect successful')
              return
            } catch (error) {
              console.error('Strategy 1: Immediate redirect failed:', error)
            }
          }
        }, 500)

        // Strategy 2: Delayed redirect (main strategy)
        setTimeout(() => {
          if (isMounted) {
            console.log('Strategy 2: Attempting delayed redirect...')
            try {
              window.location.replace(redirectUrl)
              console.log('Strategy 2: Delayed redirect successful')
              return
            } catch (error) {
              console.error('Strategy 2: Delayed redirect failed:', error)
              // Fallback to window.location.href
              try {
                window.location.href = redirectUrl
                console.log('Strategy 2: Fallback redirect successful')
                return
              } catch (hrefError) {
                console.error('Strategy 2: All redirect methods failed:', hrefError)
                // Last resort: router.push
                if (isMounted) {
                  router.push(redirectUrl)
                }
              }
            }
          }
        }, 2000)

        // Strategy 3: Final fallback
        setTimeout(() => {
          if (isMounted) {
            console.log('Strategy 3: Final fallback redirect...')
            try {
              window.location.href = redirectUrl
              console.log('Strategy 3: Final fallback successful')
            } catch (error) {
              console.error('Strategy 3: Final fallback failed:', error)
            }
          }
        }, 3000)

      } catch (error) {
        console.error('OAuth callback error:', error)
        console.error('Error details:', error)
        
        if (isMounted) {
          setStatus('error')
          setMessage(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
          
          // Redirect to home after 3 seconds
          setTimeout(() => {
            if (isMounted) {
              router.push('/')
            }
          }, 3000)
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
              Redirecting you automatically...
            </p>
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
