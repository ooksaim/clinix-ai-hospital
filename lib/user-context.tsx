'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { AuthUser, getCurrentUserWithProfile, onAuthStateChange } from '@/lib/auth'

interface UserContextType {
  user: AuthUser | null
  loading: boolean
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

// Default context value for SSG/SSR safety
const defaultContextValue: UserContextType = {
  user: null,
  loading: true,
  signOut: async () => {},
  refreshUser: async () => {}
}

const UserContext = createContext<UserContextType>(defaultContextValue)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)

  // Ensure we're on the client
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Load user on mount - only on client
  useEffect(() => {
    if (!isClient) return
    
    getCurrentUserWithProfile()
      .then(setUser)
      .finally(() => setLoading(false))
  }, [isClient])

  // Listen to auth state changes - only on client
  useEffect(() => {
    if (!isClient) return

    const { data: { subscription } } = onAuthStateChange((user) => {
      setUser(user)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [isClient])

  const signOut = async () => {
    if (!isClient) return
    const { signOut: authSignOut } = await import('@/lib/auth')
    await authSignOut()
    setUser(null)
  }

  const refreshUser = async () => {
    if (!isClient) return
    const updatedUser = await getCurrentUserWithProfile()
    setUser(updatedUser)
  }

  // During SSR/SSG, return default values
  const contextValue = isClient ? { user, loading, signOut, refreshUser } : defaultContextValue

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  // Context should never be undefined now since we provide a default
  return context
}

// Convenience hooks for role-based access
export function useIsRole(role: string) {
  const { user } = useUser()
  return user?.profile?.role === role
}

export function useIsDoctor() {
  return useIsRole('doctor')
}

export function useIsNurse() {
  return useIsRole('nurse')
}

export function useIsAdmin() {
  return useIsRole('admin')
}

export function useIsReceptionist() {
  return useIsRole('receptionist')
}

export function useUserDepartment() {
  const { user } = useUser()
  return user?.profile?.department_id || null
}

export function useCanAccess(requiredRoles: string[]) {
  const { user } = useUser()
  return user ? requiredRoles.includes(user.profile?.role || '') : false
}