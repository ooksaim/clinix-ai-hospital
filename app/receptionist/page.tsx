"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserPlus, Calendar, Phone, ArrowLeft, LogOut, Users, ClipboardList, Clock, UserCheck } from "lucide-react"
import Link from "next/link"
import { PatientRegistration } from "@/components/patient-registration"
import { PatientAssignmentDashboard } from "@/components/patient-assignment-dashboard"

interface UserProfile {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
  department_id: string | null
  department_name: string | null
}

export default function ReceptionistDashboard() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [loadingAuth, setLoadingAuth] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [stats, setStats] = useState({
    todaysAppointments: 24,
    queueStatus: 7,
    newRegistrations: 5,
    phoneCalls: 18
  })

  // Check authentication and role
  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    
    if (!storedUser) {
      router.push('/login')
      return
    }

    try {
      const user = JSON.parse(storedUser)
      if (user.role !== 'receptionist') {
        router.push('/login')
        return
      }
      setCurrentUser(user)
    } catch (error) {
      localStorage.removeItem('user')
      router.push('/login')
      return
    }
    
    setLoadingAuth(false)
  }, [router])

  const logout = () => {
    localStorage.removeItem('user')
    router.push('/login')
  }

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <Header />
      
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Roles
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Phone className="h-8 w-8 text-green-600" />
                Receptionist Dashboard
              </h1>
              <p className="text-gray-600 mt-1">Front desk operations and patient services</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
              <Phone className="h-3 w-3 mr-1" />
              {currentUser.first_name} {currentUser.last_name}
            </Badge>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={logout}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todaysAppointments}</div>
              <p className="text-xs text-muted-foreground">Scheduled visits</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Queue Status</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.queueStatus}</div>
              <p className="text-xs text-muted-foreground">Patients waiting</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Registrations</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.newRegistrations}</div>
              <p className="text-xs text-muted-foreground">Today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Phone Calls</CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.phoneCalls}</div>
              <p className="text-xs text-muted-foreground">Handled today</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Features - Tabbed Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-5 w-full max-w-2xl">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="register">Register Patient</TabsTrigger>
            <TabsTrigger value="assignments" className="flex items-center gap-1">
              <UserCheck className="h-3 w-3" />
              Assignments
            </TabsTrigger>
            <TabsTrigger value="queue">Queue</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Patient Registration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-green-600" />
                    Patient Registration
                  </CardTitle>
                  <CardDescription>
                    Register new patients and manage existing records
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => setActiveTab("register")}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Register New Patient
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => setActiveTab("register")}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Search Patient Records
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => alert("Patient update feature coming soon!")}
                  >
                    <ClipboardList className="h-4 w-4 mr-2" />
                    Update Patient Info
                  </Button>
                </CardContent>
              </Card>

              {/* Patient Assignments - NEW */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-blue-600" />
                    Patient Assignments
                  </CardTitle>
                  <CardDescription>
                    Monitor real-time patient assignments to doctors
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => setActiveTab("assignments")}
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    View All Assignments
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => setActiveTab("assignments")}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Real-time Status
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => setActiveTab("assignments")}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    By Department
                  </Button>
                </CardContent>
              </Card>

              {/* Appointment Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    Appointment Management
                  </CardTitle>
                  <CardDescription>
                    Schedule, reschedule, and manage patient appointments
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => setActiveTab("appointments")}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Appointment
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => setActiveTab("appointments")}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    View Today's Schedule
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => setActiveTab("queue")}
                  >
                    <ClipboardList className="h-4 w-4 mr-2" />
                    Manage Queue
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => alert("Reminder system coming soon!")}
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Send Reminders
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Emergency Contact</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="destructive">
                    <Phone className="h-4 w-4 mr-2" />
                    Call Emergency
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Print Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">
                    <ClipboardList className="h-4 w-4 mr-2" />
                    Daily Summary
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Patient Check-in</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="default">
                    <UserCheck className="h-4 w-4 mr-2" />
                    Quick Check-in
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Patient Registration Tab */}
          <TabsContent value="register" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-green-600" />
                  Patient Registration & Search
                </CardTitle>
                <CardDescription>
                  Register new patients, search existing patients, and view their medical history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PatientRegistration />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Patient Assignments Tab */}
          <TabsContent value="assignments" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-blue-600" />
                  Real-time Patient Assignments
                </CardTitle>
                <CardDescription>
                  Monitor patient assignments to doctors in real-time - see which patients you registered get assigned to which doctors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PatientAssignmentDashboard />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Queue Management Tab */}
          <TabsContent value="queue" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  Today's Patient Queue
                </CardTitle>
                <CardDescription>
                  Current waiting patients and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border">
                    <div>
                      <p className="font-medium">Token #12 - John Smith</p>
                      <p className="text-sm text-gray-600">Department: Cardiology • Arrived: 10:30 AM • Dr. Johnson</p>
                    </div>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">In Progress</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border">
                    <div>
                      <p className="font-medium">Token #13 - Sarah Johnson</p>
                      <p className="text-sm text-gray-600">Department: Internal Medicine • Arrived: 11:15 AM • Dr. Wilson</p>
                    </div>
                    <Badge variant="secondary" className="bg-orange-100 text-orange-700">Waiting</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border">
                    <div>
                      <p className="font-medium">Token #14 - Michael Davis</p>
                      <p className="text-sm text-gray-600">Department: Emergency • Arrived: 12:00 PM • Dr. Brown</p>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-700">Next</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border">
                    <div>
                      <p className="font-medium">Token #15 - Emma Wilson</p>
                      <p className="text-sm text-gray-600">Department: Pediatrics • Scheduled: 2:30 PM • Dr. Martinez</p>
                    </div>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700">Scheduled</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Appointment Management
                </CardTitle>
                <CardDescription>
                  Schedule, view, and manage patient appointments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button className="justify-start" variant="outline">
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule New Appointment
                    </Button>
                    <Button className="justify-start" variant="outline">
                      <Clock className="h-4 w-4 mr-2" />
                      View Today's Schedule
                    </Button>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3">Today's Appointments</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span>9:00 AM - Dr. Smith - John Doe (Cardiology)</span>
                        <Badge variant="secondary">Confirmed</Badge>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span>10:30 AM - Dr. Johnson - Jane Smith (Internal Medicine)</span>
                        <Badge variant="secondary">In Progress</Badge>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span>2:00 PM - Dr. Brown - Mike Wilson (Emergency)</span>
                        <Badge variant="secondary">Scheduled</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  )
}