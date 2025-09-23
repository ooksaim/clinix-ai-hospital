'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Building2, UserPlus } from 'lucide-react'

export default function InitialSetupPage() {
  const [formData, setFormData] = useState({
    email: 'admin@hospital.com',
    password: 'admin123',
    first_name: 'Hospital',
    last_name: 'Administrator'
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Use the special admin creation API that bypasses RLS entirely
      const response = await fetch('/api/create-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error)
      }

      setSuccess(true)
    } catch (error: any) {
      console.error('Setup error:', error)
      if (error.message.includes('fetch') || error.message.includes('network')) {
        setError('Network error. Please check your connection and try again.')
      } else {
        setError(error.message || 'Failed to create admin user')
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-green-600 p-3 rounded-full">
                <UserPlus className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-green-600">Setup Complete!</CardTitle>
            <CardDescription>
              Admin user created successfully
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="space-y-2 mb-6">
              <p className="text-sm"><strong>Email:</strong> {formData.email}</p>
              <p className="text-sm"><strong>Password:</strong> {formData.password}</p>
            </div>
            <Button asChild className="w-full">
              <a href="/login">Go to Login</a>
            </Button>
            <p className="text-xs text-gray-500 mt-4">
              Save these credentials! You can now login and create other users.
            </p>
          </CardContent>
        </Card>
      </div>
    )
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
          <CardTitle className="text-2xl font-bold">Initial Setup</CardTitle>
          <CardDescription>
            Create the first admin user for your hospital system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateAdmin} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="email">Admin Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
                minLength={6}
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating Admin User...' : 'Create Admin User'}
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm text-gray-600">
            <p><strong>Important:</strong> This will create the first admin user.</p>
            <p>Use this account to login and create other staff members.</p>
            <div className="mt-4">
              <Button asChild variant="outline" size="sm">
                <a href="/test-connection">Test Database Connection</a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}