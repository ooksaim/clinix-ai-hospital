"use client"

import { AnalyticsDashboard } from "@/components/analytics-dashboard"
import { PatientManagement } from "@/components/patient-management"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Microscope, BarChart3, Database, FileText, TrendingUp, Brain, ArrowLeft, Beaker, LogOut } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { getDashboardStats } from "@/app/actions"
import { useAuth } from "@/hooks/use-auth"

export default function ResearcherDashboard() {
  const { user, isAuthenticated, isLoading, logout } = useAuth('researcher')
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
    const interval = setInterval(fetchStats, 120000) // Less frequent updates for research
    return () => clearInterval(interval)
  }, [isAuthenticated, isLoading])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  // Research-specific calculated metrics
  const totalDataPoints = stats.totalPatients * 15 // Average data points per patient
  const activeStudies = 7 // Mock data
  const publicationsThisYear = 12 // Mock data
  const collaborations = 23 // Mock data

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50">
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
                <Microscope className="h-8 w-8 text-violet-600" />
                Medical Research Dashboard
              </h1>
              <p className="text-gray-600 mt-1">Clinical research, data analysis, and medical insights</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-violet-50 text-violet-700 border-violet-200">
              <Beaker className="h-3 w-3 mr-1" />
              Dr. {user?.username}
            </Badge>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => logout('researcher')}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Research Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Data Points</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{totalDataPoints.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Available for analysis</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Studies</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{activeStudies}</div>
              <p className="text-xs text-muted-foreground">Ongoing research projects</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Publications</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{publicationsThisYear}</div>
              <p className="text-xs text-muted-foreground">This year</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Collaborations</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-600">{collaborations}</div>
              <p className="text-xs text-muted-foreground">Active partnerships</p>
            </CardContent>
          </Card>
        </div>

        {/* Research Overview Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-600" />
                Current Research Studies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg">
                  <div>
                    <p className="font-medium">AI Diagnosis Accuracy Study</p>
                    <p className="text-sm text-gray-600">Phase II - Data Collection</p>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">Active</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <div>
                    <p className="font-medium">Triage Efficiency Analysis</p>
                    <p className="text-sm text-gray-600">Phase III - Analysis</p>
                  </div>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">Analysis</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                  <div>
                    <p className="font-medium">Patient Outcome Prediction</p>
                    <p className="text-sm text-gray-600">Phase I - Design</p>
                  </div>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700">Planning</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Research Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border">
                  <h3 className="font-semibold text-blue-900 mb-2">AI Diagnosis Accuracy</h3>
                  <p className="text-sm text-blue-700">Current model shows 94.2% accuracy in preliminary trials</p>
                  <div className="mt-2 bg-blue-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{width: '94.2%'}}></div>
                  </div>
                </div>
                
                <div className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border">
                  <h3 className="font-semibold text-emerald-900 mb-2">Triage Time Reduction</h3>
                  <p className="text-sm text-emerald-700">Average wait time reduced by 37% with AI triage</p>
                  <div className="mt-2 bg-emerald-200 rounded-full h-2">
                    <div className="bg-emerald-600 h-2 rounded-full" style={{width: '37%'}}></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white border">
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Data Analytics
            </TabsTrigger>
            <TabsTrigger value="datasets" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Research Datasets
            </TabsTrigger>
            <TabsTrigger value="studies" className="flex items-center gap-2">
              <Microscope className="h-4 w-4" />
              Study Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-indigo-600" />
                  Clinical Research Analytics
                </CardTitle>
                <CardDescription>
                  Advanced statistical analysis, predictive modeling, and clinical outcome research
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AnalyticsDashboard />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="datasets" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-blue-600" />
                  Research Dataset Management
                </CardTitle>
                <CardDescription>
                  Access anonymized patient data for research purposes with full compliance and ethics oversight
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <div className="text-amber-600 mt-1">⚠️</div>
                      <div>
                        <h3 className="font-semibold text-amber-800">Research Ethics Notice</h3>
                        <p className="text-sm text-amber-700 mt-1">
                          All patient data shown here is anonymized and complies with medical research ethics guidelines. 
                          Patient identifiable information is masked for research purposes.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <PatientManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="studies" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Microscope className="h-5 w-5 text-violet-600" />
                  Research Study Dashboard
                </CardTitle>
                <CardDescription>
                  Manage clinical trials, observational studies, and research protocols
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Study Templates</h3>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start">
                        <FileText className="h-4 w-4 mr-2" />
                        Clinical Trial Protocol
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Observational Study
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Brain className="h-4 w-4 mr-2" />
                        AI Model Validation
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Outcome Analysis
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Research Tools</h3>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start">
                        <Database className="h-4 w-4 mr-2" />
                        Statistical Analysis
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <FileText className="h-4 w-4 mr-2" />
                        Literature Review
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Data Visualization
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Beaker className="h-4 w-4 mr-2" />
                        Hypothesis Testing
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 p-6 bg-gradient-to-r from-violet-50 to-indigo-50 rounded-xl border">
                  <h3 className="font-semibold text-lg mb-4">Research Collaboration Hub</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                      <div className="text-2xl font-bold text-violet-600">23</div>
                      <p className="text-sm text-gray-600">Active Collaborators</p>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                      <div className="text-2xl font-bold text-indigo-600">15</div>
                      <p className="text-sm text-gray-600">Partner Institutions</p>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                      <div className="text-2xl font-bold text-blue-600">8</div>
                      <p className="text-sm text-gray-600">International Projects</p>
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
