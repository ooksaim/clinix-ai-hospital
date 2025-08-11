"use client"

import { LoginForm } from '@/components/auth/login-form'
import { Scan } from 'lucide-react'

export default function RadiologistLogin() {
  const handleLogin = async (username: string, password: string): Promise<boolean> => {
    // Dummy authentication - accept any username/password combination for prototype
    return username === "admin" && password === "admin"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="bg-teal-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Scan className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Radiologist Portal
            </h1>
            <p className="text-gray-600">
              Access medical imaging analysis and rapid report generation tools
            </p>
          </div>
          
          <LoginForm 
            role="radiologist"
            roleTitle="Radiologist"
            roleIcon={<Scan className="w-5 h-5" />}
            roleColor="teal"
            onLogin={handleLogin}
          />
        </div>
      </div>
    </div>
  )
}
