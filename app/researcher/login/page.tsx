"use client"

import { LoginForm } from "@/components/auth/login-form"
import { useAuth } from "@/hooks/use-auth"
import { Microscope } from "lucide-react"

export default function ResearcherLogin() {
  const { login } = useAuth()

  const handleLogin = async (username: string, password: string): Promise<boolean> => {
    return await login(username, password, 'researcher')
  }

  return (
    <LoginForm
      role="researcher"
      roleTitle="Medical Researcher"
      roleIcon={<Microscope className="h-8 w-8" />}
      roleColor="violet"
      onLogin={handleLogin}
    />
  )
}
