'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Building2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Use the new login API that bypasses RLS
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error)
      }

      const { user, session } = result
      
      if (user && session) {
        // Store user data immediately
        localStorage.setItem('user', JSON.stringify(user))
        
        // Determine target URL
        let targetUrl = '/roles';
        if (user.role === 'admin') targetUrl = '/admin';
        else if (user.role === 'doctor') {
          if (user.doctor_type === 'ward') targetUrl = '/ward-doctor';
          else targetUrl = '/doctor';
        }
        else if (user.role === 'nurse') targetUrl = '/nurse';
        else if (user.role === 'receptionist') targetUrl = '/receptionist';
        else if (user.role === 'ward_admin') targetUrl = '/ward-admin';
        else if (user.role === 'pharmacist') targetUrl = '/pharmacist';
        else if (user.role === 'lab_tech') targetUrl = '/laboratory';
        else if (user.role === 'lab_admin') targetUrl = '/lab-admin';
        else if (user.role === 'radiologist') targetUrl = '/radiology';
        else if (user.role === 'emergency') targetUrl = '/emergency';
        else if (user.role === 'researcher') targetUrl = '/researcher';
        
        console.log('Login successful, redirecting to:', targetUrl)
        
        // Force immediate redirect
        window.location.replace(targetUrl)
      }
    } catch (error: any) {
      setError(error.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <Building2 className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Clinix AI Hospital</CardTitle>
          <CardDescription>
            Sign in to access your hospital dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Hospital Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your hospital email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Demo Accounts:</p>
            <div className="mt-2 text-xs space-y-1">
              <p>Admin: admin@hospital.com</p>
              <p>Doctor: doctor@hospital.com</p>
              <p>Nurse: nurse@hospital.com</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}