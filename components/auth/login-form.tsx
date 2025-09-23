"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Lock, User, Eye, EyeOff } from "lucide-react"
import { useRouter } from "next/navigation"

interface LoginFormProps {
  role: string
  roleTitle: string
  roleIcon: React.ReactNode
  roleColor: string
  onLogin: (username: string, password: string) => Promise<boolean>
}

export function LoginForm({ role, roleTitle, roleIcon, roleColor, onLogin }: LoginFormProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) {
      setError("Please enter both username and password")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const success = await onLogin(username, password)
      if (success) {
        // Store authentication in both sessionStorage and localStorage for compatibility
        const userData = {
          username,
          role,
          timestamp: Date.now(),
          // Add additional fields expected by doctor dashboard
          id: role === 'doctor' ? 'DOC001' : 'USER001',
          first_name: username === 'admin' ? 'Dr. John' : 'Admin',
          last_name: username === 'admin' ? 'Smith' : 'User'
        }
        
        sessionStorage.setItem(`clinix-auth-${role}`, JSON.stringify(userData))
        localStorage.setItem('user', JSON.stringify(userData)) // For backward compatibility
        router.push(`/${role}`)
      } else {
        setError("Invalid credentials. Please try again.")
      }
    } catch (err) {
      setError("Login failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className={`mx-auto w-16 h-16 rounded-full bg-${roleColor}-100 flex items-center justify-center mb-4`}>
            <div className={`text-${roleColor}-600`}>
              {roleIcon}
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            {roleTitle} Login
          </CardTitle>
          <CardDescription>
            Enter your credentials to access the {roleTitle.toLowerCase()} dashboard
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
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
              style={{ backgroundColor: `rgb(${roleColor === 'blue' ? '59 130 246' : roleColor === 'pink' ? '236 72 153' : roleColor === 'gray' ? '107 114 128' : roleColor === 'violet' ? '139 92 246' : '239 68 68'})` }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Sign In
                </>
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              <div className="bg-gray-50 p-3 rounded-lg mt-4">
                <p className="font-medium text-gray-700 mb-1">Demo Credentials:</p>
                <p className="text-gray-600">Username: <code className="bg-white px-1 rounded">admin</code></p>
                <p className="text-gray-600">Password: <code className="bg-white px-1 rounded">admin</code></p>
              </div>
            </div>
          </form>

          <div className="mt-6 text-center">
            <Button 
              variant="outline" 
              onClick={() => router.push('/')}
              className="w-full"
            >
              Back to Role Selection
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
