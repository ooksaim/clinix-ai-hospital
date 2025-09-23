"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Building2 } from 'lucide-react'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is already logged in via localStorage
    const storedUser = localStorage.getItem('user')
    
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser)
        // User is logged in, redirect to role selection page
        router.push('/roles')
      } catch (error) {
        // Invalid stored user data, clear it and redirect to login
        localStorage.removeItem('user')
        router.push('/login')
      }
    } else {
      // No user logged in, redirect to login
      router.push('/login')
    }
  }, [router])

  // Loading state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-blue-600 p-4 rounded-full">
            <Building2 className="h-12 w-12 text-white" />
          </div>
        </div>
        <div className="flex items-center justify-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-lg font-medium text-gray-700">Loading Clinix AI...</span>
        </div>
        <p className="text-sm text-gray-500 mt-2">Initializing hospital management system</p>
      </div>
    </div>
  )
}
