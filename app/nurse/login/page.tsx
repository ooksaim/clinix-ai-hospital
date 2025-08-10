"use client"

import { LoginForm } from "@/components/auth/login-form"
import { useAuth } from "@/hooks/use-auth"
import { Heart } from "lucide-react"

export default function NurseLogin() {
  const { login } = useAuth()

  const handleLogin = async (username: string, password: string): Promise<boolean> => {
    return await login(username, password, 'nurse')
  }

  return (
    <LoginForm
      role="nurse"
      roleTitle="Nurse & Triage"
      roleIcon={<Heart className="h-8 w-8" />}
      roleColor="pink"
      onLogin={handleLogin}
    />
  )
}
