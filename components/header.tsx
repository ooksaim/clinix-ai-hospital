"use client"

import { Stethoscope, Activity, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export function Header() {
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem('user')
    router.push('/login')
  }

  return (
    <header className="bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-600 border-b border-blue-500 shadow-lg py-4 sm:py-6 px-3 sm:px-4 md:px-6 lg:px-8">
      <div className="container mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-xl shadow-lg">
              <Stethoscope className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                Clinix AI
              </h1>
              <div className="hidden sm:block">
                <p className="text-xs sm:text-sm text-blue-100">Hospital Management System</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden md:flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg">
              <Activity className="h-4 w-4 text-green-300" />
              <span className="text-sm text-white font-medium">System Online</span>
            </div>
            <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-2 rounded-lg">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs sm:text-sm text-white font-medium">Live</span>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="bg-white/20 border-white/30 text-white hover:bg-white/30 hover:text-white"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
