"use client"

import { LoginForm } from "@/components/auth/login-form"
import { useAuth } from "@/hooks/use-auth"
import { Settings } from "lucide-react"

export default function AdministratorLogin() {
  const { login } = useAuth()

  const handleLogin = async (username: string, password: string): Promise<boolean> => {
    return await login(username, password, 'administrator')
  }

  return (
    <LoginForm
      role="administrator"
      roleTitle="Administrator"
      roleIcon={<Settings className="h-8 w-8" />}
      roleColor="gray"
      onLogin={handleLogin}
    />
  )
}
