import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getLocalStorage = (key: string): string | null => {
  if (typeof window !== 'undefined') {
    try {
      return window.localStorage.getItem(key)
    } catch (error) {
      console.error('Error accessing localStorage:', error)
      return null
    }
  }
  return null
}

export const setLocalStorage = (key: string, value: string): boolean => {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(key, value)
      return true
    } catch (error) {
      console.error('Error setting localStorage:', error)
      return false
    }
  }
  return false
}

export const removeLocalStorage = (key: string): boolean => {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error('Error removing from localStorage:', error)
      return false
    }
  }
  return false
}

export const isLocalStorageAvailable = (): boolean => {
  if (typeof window === 'undefined') return false
  
  try {
    const testKey = '__test__'
    window.localStorage.setItem(testKey, testKey)
    window.localStorage.removeItem(testKey)
    return true
  } catch (e) {
    return false
  }
}

// 生成随机ID
function generateClientId() {
  return 'client_' + Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// 获取或创建客户端ID
export function getClientId() {
  if (typeof window === 'undefined') return null
  
  let clientId = localStorage.getItem('clientId')
  if (!clientId) {
    clientId = generateClientId()
    localStorage.setItem('clientId', clientId)
  }
  return clientId
} 