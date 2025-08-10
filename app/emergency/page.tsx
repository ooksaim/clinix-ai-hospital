"use client"

import { EmergencyProtocolManager } from "@/components/emergency-protocol-manager"
import { AITriageSystem } from "@/components/ai-triage-system"
import { PatientManagement } from "@/components/patient-management"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Zap, Users, Activity, Clock, Shield, Phone, ArrowLeft, LogOut } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { getDashboardStats } from "@/app/actions"
import { useAuth } from "@/hooks/use-auth"

export default function EmergencyDashboard() {
  const { user, isAuthenticated, isLoading, logout } = useAuth('emergency')
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
    const interval = setInterval(fetchStats, 10000) // Very frequent updates for emergency
    return () => clearInterval(interval)
  }, [isAuthenticated, isLoading])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  // Emergency-specific metrics
  const criticalCases = stats.emergencyQueue
  const moderateCases = Math.floor(stats.todaysVisits * 0.15)
  const responseTime = "4.2m" // Mock average response time
  const ambulancesActive = 3 // Mock data

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
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
                <Zap className="h-8 w-8 text-red-600" />
                Emergency Response Center
              </h1>
              <p className="text-gray-600 mt-1">Critical care coordination and emergency protocol management</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-red-50 text-red-700 border-red-200 animate-pulse">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Coord. {user?.username}
            </Badge>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => logout('emergency')}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Critical Alert System */}
        <div className="mb-6">
          <Card className="border-red-300 bg-gradient-to-r from-red-50 to-orange-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-red-800 flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 animate-pulse" />
                Emergency Status Monitor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-red-100 rounded-lg border-2 border-red-200">
                  <div className="text-3xl font-bold text-red-700">{criticalCases}</div>
                  <p className="text-sm text-red-600 font-medium">CRITICAL</p>
                  <p className="text-xs text-red-500">Immediate attention</p>
                </div>
                <div className="text-center p-4 bg-orange-100 rounded-lg border-2 border-orange-200">
                  <div className="text-3xl font-bold text-orange-700">{moderateCases}</div>
                  <p className="text-sm text-orange-600 font-medium">HIGH</p>
                  <p className="text-xs text-orange-500">Urgent care needed</p>
                </div>
                <div className="text-center p-4 bg-blue-100 rounded-lg border-2 border-blue-200">
                  <div className="text-3xl font-bold text-blue-700">{responseTime}</div>
                  <p className="text-sm text-blue-600 font-medium">AVG RESPONSE</p>
                  <p className="text-xs text-blue-500">Current average</p>
                </div>
                <div className="text-center p-4 bg-green-100 rounded-lg border-2 border-green-200">
                  <div className="text-3xl font-bold text-green-700">{ambulancesActive}</div>
                  <p className="text-sm text-green-600 font-medium">UNITS ACTIVE</p>
                  <p className="text-xs text-green-500">Emergency vehicles</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Action Center */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-red-600" />
                Emergency Dispatch Center
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button size="lg" className="h-16 bg-red-600 hover:bg-red-700 text-white">
                  <AlertTriangle className="h-6 w-6 mr-2" />
                  Code Red Alert
                </Button>
                <Button size="lg" variant="outline" className="h-16 border-orange-500 text-orange-600 hover:bg-orange-50">
                  <Zap className="h-6 w-6 mr-2" />
                  Mass Casualty Protocol
                </Button>
                <Button size="lg" variant="outline" className="h-16 border-blue-500 text-blue-600 hover:bg-blue-50">
                  <Shield className="h-6 w-6 mr-2" />
                  Security Alert
                </Button>
                <Button size="lg" variant="outline" className="h-16 border-purple-500 text-purple-600 hover:bg-purple-50">
                  <Activity className="h-6 w-6 mr-2" />
                  Medical Emergency
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resource Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Trauma Bay 1</span>
                <Badge variant="secondary" className="bg-red-100 text-red-700">Occupied</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Trauma Bay 2</span>
                <Badge variant="secondary" className="bg-green-100 text-green-700">Available</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">OR Suite 1</span>
                <Badge variant="secondary" className="bg-orange-100 text-orange-700">Preparing</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">ICU Beds</span>
                <Badge variant="secondary">2 Available</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Blood Bank</span>
                <Badge variant="secondary" className="bg-green-100 text-green-700">Well Stocked</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="protocols" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white border">
            <TabsTrigger value="protocols" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Emergency Protocols
            </TabsTrigger>
            <TabsTrigger value="triage" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Rapid Triage
            </TabsTrigger>
            <TabsTrigger value="patients" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Patient Tracking
            </TabsTrigger>
          </TabsList>

          <TabsContent value="protocols" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Emergency Response Protocols
                </CardTitle>
                <CardDescription>
                  Critical care protocols, disaster response procedures, and emergency coordination systems
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EmergencyProtocolManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="triage" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-orange-600" />
                  Rapid Emergency Triage
                </CardTitle>
                <CardDescription>
                  Ultra-fast patient assessment for emergency situations with AI-powered severity classification
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <div className="text-red-600 mt-1">🚨</div>
                      <div>
                        <h3 className="font-semibold text-red-800">Emergency Triage Mode</h3>
                        <p className="text-sm text-red-700 mt-1">
                          This triage system is optimized for rapid emergency assessment. 
                          Critical cases are automatically flagged for immediate attention.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <AITriageSystem onTriageComplete={(assessment) => {
                  console.log("Emergency triage completed:", assessment)
                  // In real implementation, this would trigger emergency protocols
                }} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="patients" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Emergency Patient Tracking
                </CardTitle>
                <CardDescription>
                  Real-time patient location, status updates, and critical care coordination
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                      <div className="text-2xl font-bold text-red-600">{criticalCases}</div>
                      <p className="text-sm text-red-600">Critical Patients</p>
                      <p className="text-xs text-red-500">Requires immediate care</p>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="text-2xl font-bold text-yellow-600">{moderateCases}</div>
                      <p className="text-sm text-yellow-600">Stable Patients</p>
                      <p className="text-xs text-yellow-500">Monitoring required</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="text-2xl font-bold text-green-600">{Math.floor(stats.todaysVisits * 0.6)}</div>
                      <p className="text-sm text-green-600">Treated & Released</p>
                      <p className="text-xs text-green-500">Successful outcomes</p>
                    </div>
                  </div>
                </div>
                <PatientManagement />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  )
}
