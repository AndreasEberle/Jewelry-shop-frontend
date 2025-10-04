import { useState, useEffect, useCallback } from 'react'

interface ValidationResult {
  isUnique: boolean
  message: string
  isValidating: boolean
}

export function useProductNameValidation(name: string, excludeProductId?: string) {
  const [validation, setValidation] = useState<ValidationResult>({
    isUnique: true,
    message: '',
    isValidating: false
  })

  const validateName = useCallback(async (productName: string, productId?: string) => {
    if (!productName || productName.trim().length < 2) {
      setValidation({
        isUnique: true,
        message: '',
        isValidating: false
      })
      return
    }

    setValidation(prev => ({ ...prev, isValidating: true }))

    try {
      const params = new URLSearchParams({ name: productName })
      if (productId) {
        params.append('excludeProductId', productId)
      }

      const response = await fetch(`/api/admin/products/validate-name?${params}`, {
        credentials: 'include'
      })

      if (response.ok) {
        const result = await response.json()
        setValidation({
          isUnique: result.isUnique,
          message: result.message,
          isValidating: false
        })
      } else {
        setValidation({
          isUnique: false,
          message: 'Failed to validate product name',
          isValidating: false
        })
      }
    } catch (error) {
      setValidation({
        isUnique: false,
        message: 'Network error during validation',
        isValidating: false
      })
    }
  }, [])

  // Debounced validation
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      validateName(name, excludeProductId)
    }, 500) // 500ms delay

    return () => clearTimeout(timeoutId)
  }, [name, excludeProductId, validateName])

  return validation
}
