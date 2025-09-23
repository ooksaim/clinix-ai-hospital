'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { AuthUser, getCurrentUserWithProfile, onAuthStateChange } from '@/lib/auth'

interface UserContextType {
  user: AuthUser | null
  loading: boolean
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Load user on mount
  useEffect(() => {
    getCurrentUserWithProfile()
      .then(setUser)
      .finally(() => setLoading(false))
  }, [])

  // Listen to auth state changes
  useEffect(() => {
    const { data: { subscription } } = onAuthStateChange((user) => {
      setUser(user)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    const { signOut: authSignOut } = await import('@/lib/auth')
    await authSignOut()
    setUser(null)
  }

  const refreshUser = async () => {
    const updatedUser = await getCurrentUserWithProfile()
    setUser(updatedUser)
  }

  return (
    <UserContext.Provider value={{ user, loading, signOut, refreshUser }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    // Return safe defaults during SSG/SSR
    if (typeof window === 'undefined') {
      return {
        user: null,
        loading: true,
        signOut: async () => {},
        refreshUser: async () => {}
      }
    }
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

// Convenience hooks for role-based access
export function useIsRole(role: string) {
  const { user } = useUser()
  return user?.profile.role === role
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
  return user?.profile.department_id || null
}

export function useCanAccess(requiredRoles: string[]) {
  const { user } = useUser()
  return user ? requiredRoles.includes(user.profile.role) : false
}