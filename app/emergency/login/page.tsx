"use client"

import { LoginForm } from "@/components/auth/login-form"
import { useAuth } from "@/hooks/use-auth"
import { Zap } from "lucide-react"

export default function EmergencyLogin() {
  const { login } = useAuth()

  const handleLogin = async (username: string, password: string): Promise<boolean> => {
    return await login(username, password, 'emergency')
  }

  return (
    <LoginForm
      role="emergency"
      roleTitle="Emergency Coordinator"
      roleIcon={<Zap className="h-8 w-8" />}
      roleColor="red"
      onLogin={handleLogin}
    />
  )
}
