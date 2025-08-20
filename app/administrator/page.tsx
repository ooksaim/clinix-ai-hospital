"use client"

import { HospitalDashboard } from "@/components/hospital-dashboard"
import { AnalyticsDashboard } from "@/components/analytics-dashboard"
import { PatientManagement } from "@/components/patient-management"
import { AppointmentManagement } from "@/components/appointment-management"
import { AIQuotaMonitor } from "@/components/ai-quota-monitor"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Settings, BarChart3, Users, DollarSign, Calendar, Building2, ArrowLeft, TrendingUp, LogOut, Shield } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { getDashboardStats } from "@/app/actions"
import { useAuth } from "@/hooks/use-auth"
import { usePermissions, PermissionGuard } from "@/hooks/use-permissions"

export default function AdministratorDashboard() {
  const { user, isAuthenticated, isLoading, logout } = useAuth('administrator')
  const permissions = usePermissions('admin')
  const [stats, setStats] = useState({
    totalPatients: 0,
    todaysVisits: 0,
    emergencyQueue: 0,
    lastUpdate: ""
  })

  useEffect(() => {
    if (!isAuthenticated || isLoading) return
    
    const fetchStats = async () => {
      try {
        const dashboardStats = await getDashboardStats()
        setStats(dashboardStats)
      } catch (error) {
        console.error("Error fetching stats:", error)
      }
    }
    
    fetchStats()
    const interval = setInterval(fetchStats, 60000)
    return () => clearInterval(interval)
  }, [isAuthenticated, isLoading])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  // Calculated administrative metrics
  const monthlyRevenue = stats.todaysVisits * 150 * 30 // Estimated monthly revenue
  const staffUtilization = 87 // Mock data
  const bedOccupancy = 78 // Mock data
  const patientSatisfaction = 94 // Mock data

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
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
                <Settings className="h-8 w-8 text-gray-600" />
                Administrator Dashboard
              </h1>
              <p className="text-gray-600 mt-1">Hospital operations, analytics, and system management</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
              <Building2 className="h-3 w-3 mr-1" />
              Admin {user?.username}
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <Shield className="h-3 w-3 mr-1" />
              Access Level: {permissions.roleLevel}
            </Badge>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => logout('administrator')}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${monthlyRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 inline mr-1" />
                +12% from last month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bed Occupancy</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{bedOccupancy}%</div>
              <p className="text-xs text-muted-foreground">Optimal range: 70-85%</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Staff Utilization</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{staffUtilization}%</div>
              <p className="text-xs text-muted-foreground">Across all departments</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Patient Satisfaction</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{patientSatisfaction}%</div>
              <p className="text-xs text-muted-foreground">Average rating: 4.7/5</p>
            </CardContent>
          </Card>
        </div>

        {/* Operational Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                Hospital Operations Overview
              </CardTitle>
              <CardDescription>Real-time facility management and resource allocation</CardDescription>
            </CardHeader>
            <CardContent>
              <HospitalDashboard />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                System Configuration
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Staff Management
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Overview
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <DollarSign className="h-4 w-4 mr-2" />
                Financial Reports
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <BarChart3 className="h-4 w-4 mr-2" />
                Performance Metrics
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs - Permission-Controlled */}
        <Tabs defaultValue="operations" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white border">
            <PermissionGuard role="admin" permission="hospital_operations">
              <TabsTrigger value="operations" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Hospital Operations
              </TabsTrigger>
            </PermissionGuard>
            
            <PermissionGuard role="admin" permission="appointment_management">
              <TabsTrigger value="appointments" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Appointments
              </TabsTrigger>
            </PermissionGuard>
            
            <PermissionGuard role="admin" permission="performance_analytics">
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Operational Analytics
              </TabsTrigger>
            </PermissionGuard>
            
            <PermissionGuard role="admin" permission="staff_management">
              <TabsTrigger value="staff" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Staff Management
              </TabsTrigger>
            </PermissionGuard>
          </TabsList>

          <PermissionGuard role="admin" permission="hospital_operations">
            <TabsContent value="operations" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-gray-600" />
                    Hospital Operations Center
                  </CardTitle>
                  <CardDescription>
                    Hospital system management, resource allocation, and operational controls
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <HospitalDashboard />
                </CardContent>
              </Card>
            </TabsContent>
          </PermissionGuard>

          <PermissionGuard role="admin" permission="appointment_management">
            <TabsContent value="appointments" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-green-600" />
                    Appointment Management System
                  </CardTitle>
                  <CardDescription>
                    Calendly integration for comprehensive appointment oversight and scheduling
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AppointmentManagement />
                </CardContent>
              </Card>
            </TabsContent>
          </PermissionGuard>

          <PermissionGuard role="admin" permission="performance_analytics">
            <TabsContent value="analytics" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-indigo-600" />
                    Operational Analytics Dashboard
                  </CardTitle>
                  <CardDescription>
                    Hospital performance metrics, resource utilization, and operational efficiency analytics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AnalyticsDashboard />
                </CardContent>
              </Card>
            </TabsContent>
          </PermissionGuard>

          <PermissionGuard role="admin" permission="staff_management">
            <TabsContent value="staff" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Staff Management System
                  </CardTitle>
                  <CardDescription>
                    Manage hospital staff, schedules, assignments, and administrative oversight
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">Staff Overview</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span>Doctors on Duty</span>
                          <Badge variant="secondary">12 active</Badge>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span>Nurses on Duty</span>
                          <Badge variant="secondary">28 active</Badge>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span>Administrative Staff</span>
                          <Badge variant="secondary">8 active</Badge>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span>Total Staff</span>
                          <Badge variant="secondary">48 total</Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">Resource Allocation</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span>ICU Coverage</span>
                          <Badge variant="secondary" className="bg-green-50 text-green-700">Adequate</Badge>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span>Emergency Coverage</span>
                          <Badge variant="secondary" className="bg-green-50 text-green-700">Full</Badge>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span>Schedule Compliance</span>
                          <Badge variant="secondary" className="bg-green-50 text-green-700">96%</Badge>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span>Overtime Hours</span>
                          <Badge variant="secondary" className="bg-yellow-50 text-yellow-700">12 hrs/week</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </PermissionGuard>
        </Tabs>
      </main>

      <Footer />
    </div>
  )
}
