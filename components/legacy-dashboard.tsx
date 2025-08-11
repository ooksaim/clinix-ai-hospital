"use client"

import { PatientManagement } from "@/components/patient-management"
import { HospitalDashboard } from "@/components/hospital-dashboard"
import { AITriageSystem } from "@/components/ai-triage-system"
import { AnalyticsDashboard } from "@/components/analytics-dashboard"
import { EmergencyProtocolManager } from "@/components/emergency-protocol-manager"
import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState, useEffect } from "react"
import { getDashboardStats } from "@/app/actions"
import { Users, Stethoscope, FileText, Activity, Brain, BarChart3, Zap, AlertTriangle } from "lucide-react"
import { Building2 as Hospital } from "lucide-react"

export default function LegacyDashboard() {
  const [dashboardStats, setDashboardStats] = useState({
    totalPatients: 0,
    todaysVisits: 0,
    emergencyQueue: 0,
    lastUpdate: ""
  })

  // Fetch initial dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const stats = await getDashboardStats()
        setDashboardStats(stats)
      } catch (error) {
        console.error("Error fetching dashboard stats:", error)
      }
    }

    fetchStats()
    
    // Refresh stats every 60 seconds
    const interval = setInterval(fetchStats, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Header />
      
      <main className="container mx-auto px-2 sm:px-3 lg:px-4 py-3 sm:py-4 lg:py-8 max-w-7xl">
        <div className="mb-4 sm:mb-6 lg:mb-8 text-center">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3 lg:mb-4 leading-tight px-2">
            Clinix AI Hospital Management
          </h1>
          <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-gray-600 max-w-4xl mx-auto px-4">
            Revolutionary AI-powered hospital management system with real-time patient monitoring, emergency protocols, and intelligent analytics
          </p>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-4 sm:space-y-6">
          <div className="w-full">
            <TabsList className="grid w-full grid-cols-5 gap-0.5 sm:gap-1 p-1 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl shadow-sm">
              <TabsTrigger value="dashboard" className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 px-1 sm:px-3 py-2 sm:py-3 rounded-lg transition-all duration-200 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md min-h-[2.5rem] sm:min-h-[3rem]">
                <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="text-[10px] xs:text-xs sm:text-sm font-medium leading-tight text-center hidden xs:block">Dash</span>
                <span className="text-lg xs:hidden">📊</span>
              </TabsTrigger>
              <TabsTrigger value="patients" className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 px-1 sm:px-3 py-2 sm:py-3 rounded-lg transition-all duration-200 data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:shadow-md min-h-[2.5rem] sm:min-h-[3rem]">
                <Users className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="text-[10px] xs:text-xs sm:text-sm font-medium leading-tight text-center hidden xs:block">Patients</span>
                <span className="text-lg xs:hidden">👥</span>
              </TabsTrigger>
              <TabsTrigger value="triage" className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 px-1 sm:px-3 py-2 sm:py-3 rounded-lg transition-all duration-200 data-[state=active]:bg-purple-500 data-[state=active]:text-white data-[state=active]:shadow-md min-h-[2.5rem] sm:min-h-[3rem]">
                <Stethoscope className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="text-[10px] xs:text-xs sm:text-sm font-medium leading-tight text-center hidden xs:block">Triage</span>
                <span className="text-lg xs:hidden">🩺</span>
              </TabsTrigger>
              <TabsTrigger value="emergency" className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 px-1 sm:px-3 py-2 sm:py-3 rounded-lg transition-all duration-200 data-[state=active]:bg-red-500 data-[state=active]:text-white data-[state=active]:shadow-md min-h-[2.5rem] sm:min-h-[3rem]">
                <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="text-[10px] xs:text-xs sm:text-sm font-medium leading-tight text-center hidden xs:block">Alert</span>
                <span className="text-lg xs:hidden">🚨</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 px-1 sm:px-3 py-2 sm:py-3 rounded-lg transition-all duration-200 data-[state=active]:bg-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-md min-h-[2.5rem] sm:min-h-[3rem]">
                <Brain className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="text-[10px] xs:text-xs sm:text-sm font-medium leading-tight text-center hidden xs:block">Stats</span>
                <span className="text-lg xs:hidden">🧠</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="dashboard" className="space-y-4 sm:space-y-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Hospital className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Live Hospital Dashboard</h2>
                <div className="ml-auto flex items-center gap-2">
                  <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-50 text-green-700 border-green-200">
                    <Activity className="h-3 w-3 mr-1" />
                    Live Data
                  </div>
                </div>
              </div>
              <HospitalDashboard />
            </div>
          </TabsContent>

          <TabsContent value="patients" className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-6 w-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">Patient Management System</h2>
              </div>
              <PatientManagement />
            </div>
          </TabsContent>

          <TabsContent value="triage" className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Stethoscope className="h-6 w-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">AI-Powered Triage System</h2>
              </div>
              <AITriageSystem onTriageComplete={(assessment) => {
                console.log("Triage completed:", assessment)
              }} />
            </div>
          </TabsContent>

          <TabsContent value="emergency" className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <EmergencyProtocolManager />
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <AnalyticsDashboard />
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  )
}
