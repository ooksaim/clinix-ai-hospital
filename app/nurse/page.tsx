"use client"

import { AITriageSystem } from "@/components/ai-triage-system"
import { EmergencyProtocolManager } from "@/components/emergency-protocol-manager"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, AlertTriangle, Users, Activity, Clock, Shield, ArrowLeft, LogOut } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { getDashboardStats } from "@/app/actions"
import { useAuth } from "@/hooks/use-auth"

export default function NurseDashboard() {
  const { user, isAuthenticated, isLoading, logout } = useAuth('nurse')
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
    const interval = setInterval(fetchStats, 15000) // More frequent updates for nurses
    return () => clearInterval(interval)
  }, [isAuthenticated, isLoading])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50">
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
                <Heart className="h-8 w-8 text-pink-600" />
                Nurse & Triage Dashboard
              </h1>
              <p className="text-gray-600 mt-1">Patient triage, emergency protocols, and frontline care</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-pink-50 text-pink-700 border-pink-200">
              <Shield className="h-3 w-3 mr-1" />
              Nurse {user?.username}
            </Badge>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => logout('nurse')}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Priority Alert Section */}
        <div className="mb-6">
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-red-800 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Emergency Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">{stats.emergencyQueue}</div>
                  <p className="text-sm text-red-700">Critical Cases</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">{Math.floor(stats.todaysVisits * 0.3)}</div>
                  <p className="text-sm text-orange-700">High Priority</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600">{Math.floor(stats.todaysVisits * 0.4)}</div>
                  <p className="text-sm text-yellow-700">Moderate Priority</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Patients Today</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todaysVisits}</div>
              <p className="text-xs text-muted-foreground">Processed today</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Triage Queue</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{Math.floor(stats.todaysVisits * 0.2)}</div>
              <p className="text-xs text-muted-foreground">Awaiting assessment</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Wait Time</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">12m</div>
              <p className="text-xs text-muted-foreground">Current average</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bed Capacity</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">78%</div>
              <p className="text-xs text-muted-foreground">Currently occupied</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="triage" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-white border">
            <TabsTrigger value="triage" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Patient Triage
            </TabsTrigger>
            <TabsTrigger value="emergency" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Emergency Protocols
            </TabsTrigger>
          </TabsList>

          <TabsContent value="triage" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-pink-600" />
                  WHO Emergency Triage Assessment
                </CardTitle>
                <CardDescription>
                  Rapid patient assessment and priority classification using WHO-ETAT standards
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AITriageSystem onTriageComplete={(assessment) => {
                  console.log("Triage completed:", assessment)
                }} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="emergency" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Emergency Response Protocols
                </CardTitle>
                <CardDescription>
                  Critical care protocols, emergency procedures, and rapid response guidelines
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EmergencyProtocolManager />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  )
}
