"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  UserCheck, 
  Stethoscope, 
  ClipboardList,
  Building, 
  Settings,
  LogOut,
  ArrowRight,
  UserCog,
  Activity,
  Microscope
} from "lucide-react"
import Link from "next/link"

export default function RoleSelection() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    
    if (!storedUser) {
      router.push('/login')
      return
    }

    try {
      const user = JSON.parse(storedUser)
      setCurrentUser(user)
    } catch (error) {
      localStorage.removeItem('user')
      router.push('/login')
    }
  }, [router])

  const logout = () => {
    localStorage.removeItem('user')
    router.push('/login')
  }

  const roles = [
    {
      id: 'admin',
      title: 'Admin Dashboard',
      description: 'Manage users, settings, and system configuration',
      icon: Settings,
      href: '/admin',
      color: 'bg-purple-500',
      allowed: ['admin']
    },
    {
      id: 'doctor',
      title: 'Doctor Interface',
      description: 'Patient consultations, prescriptions, and medical records',
      icon: Stethoscope,
      href: '/doctor',
      color: 'bg-blue-500',
      allowed: ['doctor', 'admin']
    },
    {
      id: 'nurse',
      title: 'Nurse Dashboard',
      description: 'Patient care, medication tracking, and shift management',
      icon: UserCheck,
      href: '/nurse',
      color: 'bg-green-500',
      allowed: ['nurse', 'admin']
    },
    {
      id: 'receptionist',
      title: 'Receptionist Panel',
      description: 'Patient registration, appointments, and front desk operations',
      icon: ClipboardList,
      href: '/receptionist',
      color: 'bg-orange-500',
      allowed: ['receptionist', 'admin']
    },
    {
      id: 'ward-admin',
      title: 'Ward Administration',
      description: 'Manage admissions, bed allocation, and ward capacity',
      icon: Building,
      href: '/ward-admin',
      color: 'bg-indigo-500',
      allowed: ['ward_admin']
    },
    {
      id: 'emergency',
      title: 'Emergency Department',
      description: 'Emergency protocols, triage, and crisis management',
      icon: Activity,
      href: '/emergency',
      color: 'bg-red-500',
      allowed: ['emergency', 'admin']
    },
    {
      id: 'radiologist',
      title: 'Radiology Department',
      description: 'Imaging analysis, reports, and diagnostic imaging',
      icon: Microscope,
      href: '/radiologist',
      color: 'bg-teal-500',
      allowed: ['radiologist', 'admin']
    },
    {
      id: 'researcher',
      title: 'Research & Analytics',
      description: 'Medical research, data analysis, and statistical reports',
      icon: UserCog,
      href: '/researcher',
      color: 'bg-pink-500',
      allowed: ['researcher', 'admin']
    }
  ]

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  const availableRoles = roles.filter(role => 
    role.allowed.includes(currentUser.role)
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Welcome to Clinix AI Hospital
            </h1>
            <p className="text-xl text-gray-600">
              Hello, {currentUser.first_name} {currentUser.last_name}
            </p>
            <Badge variant="secondary" className="mt-2 bg-blue-50 text-blue-700 border-blue-200">
              <Users className="h-3 w-3 mr-1" />
              {currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}
            </Badge>
          </div>
          <Button 
            variant="outline" 
            onClick={logout}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Role Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {availableRoles.map((role) => {
            const IconComponent = role.icon
            return (
              <Card key={role.id} className="hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-300">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-lg ${role.color} text-white`}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                  </div>
                  <CardTitle className="text-xl">{role.title}</CardTitle>
                  <CardDescription className="text-gray-600">
                    {role.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={role.href}>
                    <Button className="w-full" size="lg">
                      Access {role.title}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* System Status */}
        <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building className="h-5 w-5 text-blue-600" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">System Status:</span>
                <Badge className="bg-green-100 text-green-800 border-green-300">
                  Online
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Database:</span>
                <Badge className="bg-green-100 text-green-800 border-green-300">
                  Connected
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">AI Services:</span>
                <Badge className="bg-green-100 text-green-800 border-green-300">
                  Active
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  )
}