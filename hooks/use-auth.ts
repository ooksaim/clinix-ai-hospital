"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface AuthUser {
  username: string
  role: string
  timestamp: number
}

export function useAuth(requiredRole?: string) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = () => {
      if (typeof window === 'undefined') return

      try {
        const authKey = requiredRole ? `clinix-auth-${requiredRole}` : null
        
        if (authKey) {
          const authData = sessionStorage.getItem(authKey)
          if (authData) {
            const userData = JSON.parse(authData)
            // Check if session is still valid (24 hours)
            const isExpired = Date.now() - userData.timestamp > 24 * 60 * 60 * 1000
            
            if (!isExpired) {
              setUser(userData)
            } else {
              sessionStorage.removeItem(authKey)
              router.push(`/${requiredRole}/login`)
            }
          } else if (requiredRole) {
            router.push(`/${requiredRole}/login`)
          }
        }
      } catch (error) {
        console.error('Auth check error:', error)
        if (requiredRole) {
          router.push(`/${requiredRole}/login`)
        }
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [requiredRole, router])

  const login = async (username: string, password: string, role: string): Promise<boolean> => {
    // Dummy authentication - in production, this would call an API
    if (username === 'admin' && password === 'admin') {
      const userData: AuthUser = {
        username,
        role,
        timestamp: Date.now()
      }
      
      sessionStorage.setItem(`clinix-auth-${role}`, JSON.stringify(userData))
      setUser(userData)
      return true
    }
    return false
  }

  const logout = (role: string) => {
    sessionStorage.removeItem(`clinix-auth-${role}`)
    setUser(null)
    router.push('/')
  }

  const isAuthenticated = !!user

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout
  }
}
