"use client"

import { LoginForm } from "@/components/auth/login-form"
import { useAuth } from "@/hooks/use-auth"
import { Stethoscope } from "lucide-react"

export default function DoctorLogin() {
  const { login } = useAuth()

  const handleLogin = async (username: string, password: string): Promise<boolean> => {
    return await login(username, password, 'doctor')
  }

  return (
    <LoginForm
      role="doctor"
      roleTitle="Doctor"
      roleIcon={<Stethoscope className="h-8 w-8" />}
      roleColor="blue"
      onLogin={handleLogin}
    />
  )
}
