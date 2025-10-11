/**
 * Utility functions for input validation
 */

/**
 * Validates and formats numeric input to only allow numbers and a single decimal point
 * @param value - The input value to validate
 * @returns Cleaned numeric value
 */
export const validateNumericInput = (value: string): string => {
  // Remove any characters that are not digits or decimal point
  let cleaned = value.replace(/[^0-9.]/g, '')
  
  // Ensure only one decimal point
  const parts = cleaned.split('.')
  if (parts.length > 2) {
    cleaned = parts[0] + '.' + parts.slice(1).join('')
  }
  
  // Remove leading zeros except for decimal numbers like 0.5
  if (cleaned.length > 1 && cleaned[0] === '0' && cleaned[1] !== '.') {
    cleaned = cleaned.replace(/^0+/, '') || '0'
  }
  
  return cleaned
}

/**
 * Handles numeric input change with validation
 * @param value - The input value
 * @param setter - The state setter function
 * @param maxDecimals - Maximum number of decimal places (default: 2)
 */
export const handleNumericChange = (
  value: string, 
  setter: (value: string) => void,
  maxDecimals: number = 2
): void => {
  const cleaned = validateNumericInput(value)
  
  // Check decimal places
  const parts = cleaned.split('.')
  if (parts.length === 2 && parts[1].length > maxDecimals) {
    return // Don't update if too many decimal places
  }
  
  setter(cleaned)
}

/**
 * Validates if a string represents a valid positive number
 * @param value - The value to validate
 * @returns True if valid positive number
 */
export const isValidPositiveNumber = (value: string): boolean => {
  const num = parseFloat(value)
  return !isNaN(num) && num >= 0
}

/**
 * Formats a number to a specific number of decimal places
 * @param value - The numeric value
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string
 */
export const formatNumber = (value: string | number, decimals: number = 2): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '0'
  return num.toFixed(decimals)
}
