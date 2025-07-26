"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Brain,
  Users,
  Clock,
  AlertTriangle,
  Activity,
  FileText,
  Download,
  RefreshCw,
  Calendar,
  Stethoscope,
  Target,
  Zap,
  Eye,
  CheckCircle,
  XCircle
} from "lucide-react"
import {
  searchAllPatients,
  getTodaysVisits,
  getEmergencyPatients,
  generateHospitalInsights,
  calculatePatientRiskScore,
  type Patient,
  type Visit
} from "@/app/actions"

interface AnalyticsData {
  totalPatients: number
  todaysVisits: number
  weeklyVisits: number
  emergencyRate: number
  averageAge: number
  commonDiagnoses: Array<{ diagnosis: string; count: number; percentage: number }>
  ageDistribution: Array<{ range: string; count: number; percentage: number }>
  visitTrends: Array<{ date: string; visits: number }>
  riskAssessment: Array<{ level: string; count: number; percentage: number }>
}

interface AnalyticsDashboardProps {
  autoRefresh?: boolean
}

export function AnalyticsDashboard({ autoRefresh = true }: AnalyticsDashboardProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalPatients: 0,
    todaysVisits: 0,
    weeklyVisits: 0,
    emergencyRate: 0,
    averageAge: 0,
    commonDiagnoses: [],
    ageDistribution: [],
    visitTrends: [],
    riskAssessment: []
  })

  const [aiInsights, setAiInsights] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [alerts, setAlerts] = useState<Array<{
    id: number
    type: 'warning' | 'info' | 'success'
    message: string
    time: string
  }>>([])

  // Comprehensive analytics data processing
  const processAnalyticsData = async (patients: Patient[], visits: Visit[]) => {
    try {
      console.log("📊 Processing analytics data...")

      // Basic statistics
      const totalPatients = patients.length
      const todaysVisits = visits.length
      
      // Calculate weekly visits (simulate data for demo)
      const weeklyVisits = Math.round(todaysVisits * 7 * (0.8 + Math.random() * 0.4))

      // Calculate average age
      const averageAge = patients.length > 0 
        ? Math.round(patients.reduce((sum, p) => sum + (p.age || 0), 0) / patients.length)
        : 0

      // Emergency rate calculation
      const emergencyPatients = await getEmergencyPatients()
      const emergencyRate = todaysVisits > 0 
        ? Math.round((emergencyPatients.length / todaysVisits) * 100)
        : 0

      // Common diagnoses analysis
      const diagnosisCount: { [key: string]: number } = {}
      visits.forEach(visit => {
        if (visit.diagnosis) {
          // Extract main diagnosis (first part before any separators)
          const mainDiagnosis = visit.diagnosis.split(/[,|]|(?:\d+\.)/)[0].trim()
          if (mainDiagnosis && mainDiagnosis.length > 3) {
            diagnosisCount[mainDiagnosis] = (diagnosisCount[mainDiagnosis] || 0) + 1
          }
        }
      })

      const commonDiagnoses = Object.entries(diagnosisCount)
        .map(([diagnosis, count]) => ({
          diagnosis,
          count,
          percentage: Math.round((count / visits.length) * 100)
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      // Age distribution analysis
      const ageRanges = {
        '0-18': 0, '19-35': 0, '36-50': 0, '51-65': 0, '65+': 0
      }
      
      patients.forEach(patient => {
        const age = patient.age || 0
        if (age <= 18) ageRanges['0-18']++
        else if (age <= 35) ageRanges['19-35']++
        else if (age <= 50) ageRanges['36-50']++
        else if (age <= 65) ageRanges['51-65']++
        else ageRanges['65+']++
      })

      const ageDistribution = Object.entries(ageRanges).map(([range, count]) => ({
        range,
        count,
        percentage: totalPatients > 0 ? Math.round((count / totalPatients) * 100) : 0
      }))

      // Generate visit trends (last 7 days simulation)
      const visitTrends = Array.from({ length: 7 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - (6 - i))
        return {
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          visits: Math.round(todaysVisits * (0.7 + Math.random() * 0.6))
        }
      })

      // Risk assessment simulation (would use real AI risk scores in production)
      const riskLevels = { low: 0, medium: 0, high: 0, critical: 0 }
      
      // Simulate risk distribution based on real factors
      patients.forEach(patient => {
        const age = patient.age || 0
        if (age > 70) riskLevels.high++
        else if (age > 50) riskLevels.medium++
        else riskLevels.low++
      })

      // Add some critical cases based on emergency rate
      riskLevels.critical = Math.round(emergencyPatients.length * 0.3)
      riskLevels.high -= riskLevels.critical

      const totalRisk = Object.values(riskLevels).reduce((sum, count) => sum + count, 0)
      const riskAssessment = Object.entries(riskLevels).map(([level, count]) => ({
        level,
        count,
        percentage: totalRisk > 0 ? Math.round((count / totalRisk) * 100) : 0
      }))

      return {
        totalPatients,
        todaysVisits,
        weeklyVisits,
        emergencyRate,
        averageAge,
        commonDiagnoses,
        ageDistribution,
        visitTrends,
        riskAssessment
      }

    } catch (error) {
      console.error("❌ Error processing analytics data:", error)
      throw error
    }
  }

  // Fetch and process all analytics data (OPTIMIZED VERSION)
  const fetchAnalyticsData = async () => {
    try {
      setIsLoading(true)
      console.log("📊 Fetching comprehensive analytics data...")

      // Fetch basic data first (fast)
      const [patients, visits] = await Promise.all([
        searchAllPatients(),
        getTodaysVisits()
      ])

      console.log(`📈 Processing data: ${patients.length} patients, ${visits.length} visits`)

      // Process analytics immediately (without AI calls)
      const analytics = await processAnalyticsData(patients, visits)
      setAnalyticsData(analytics)

      // Update alerts based on analytics
      const newAlerts = []
      
      if (analytics.emergencyRate > 20) {
        newAlerts.push({
          id: Date.now() + 1,
          type: 'warning' as const,
          message: `High emergency rate detected: ${analytics.emergencyRate}%`,
          time: 'now'
        })
      }

      if (analytics.todaysVisits > analytics.weeklyVisits / 7 * 1.5) {
        newAlerts.push({
          id: Date.now() + 2,
          type: 'info' as const,
          message: `Above-average visit volume today: ${analytics.todaysVisits} visits`,
          time: 'now'
        })
      }

      if (analytics.commonDiagnoses.length > 0 && analytics.commonDiagnoses[0].percentage > 30) {
        newAlerts.push({
          id: Date.now() + 3,
          type: 'info' as const,
          message: `Trending diagnosis: ${analytics.commonDiagnoses[0].diagnosis} (${analytics.commonDiagnoses[0].percentage}%)`,
          time: 'now'
        })
      }

      setAlerts(newAlerts)
      setLastUpdate(new Date())
      setIsLoading(false) // Stop loading here for basic data

      console.log("✅ Analytics data processed successfully")

      // Generate AI insights in background (don't block UI)
      if (!aiInsights || Math.random() < 0.3) { // Only generate sometimes or if empty
        console.log("🤖 Generating AI insights in background...")
        try {
          const insights = await generateHospitalInsights(patients, visits)
          setAiInsights(insights)
          console.log("✅ AI insights generated")
        } catch (error) {
          console.warn("⚠️ AI insights failed, continuing without them:", error)
          setAiInsights("AI insights temporarily unavailable. Core analytics are working normally.")
        }
      }

    } catch (error) {
      console.error("❌ Error fetching analytics data:", error)
      setAlerts([{
        id: Date.now(),
        type: 'warning',
        message: 'Failed to fetch analytics data',
        time: 'now'
      }])
      setIsLoading(false)
    }
  }

  // Auto-refresh effect (OPTIMIZED)
  useEffect(() => {
    fetchAnalyticsData()
    
    if (autoRefresh) {
      // Longer interval to reduce server load
      const interval = setInterval(fetchAnalyticsData, 10 * 60 * 1000) // 10 minutes
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  // Generate comprehensive report
  const generateReport = () => {
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: analyticsData,
      insights: aiInsights,
      alerts: alerts
    }
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hospital-analytics-report-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />
      default: return <Eye className="h-4 w-4 text-blue-500" />
    }
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-600'
      case 'high': return 'text-orange-600'
      case 'medium': return 'text-yellow-600'
      default: return 'text-green-600'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Hospital Analytics & Insights</h2>
          <p className="text-gray-600">Comprehensive data analysis powered by AI</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={generateReport}
            className="text-xs px-2 sm:px-3 py-1.5 h-8 sm:h-9 flex-shrink-0"
          >
            <Download className="h-3 w-3 mr-1 flex-shrink-0" />
            <span className="hidden sm:inline">Export Report</span>
            <span className="sm:hidden">📥</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAnalyticsData}
            disabled={isLoading}
            className="text-xs px-2 sm:px-3 py-1.5 h-8 sm:h-9 flex-shrink-0"
          >
            {isLoading ? (
              <RefreshCw className="h-3 w-3 mr-1 animate-spin flex-shrink-0" />
            ) : (
              <RefreshCw className="h-3 w-3 mr-1 flex-shrink-0" />
            )}
            <span className="hidden sm:inline">Refresh</span>
            <span className="sm:hidden">🔄</span>
          </Button>
        </div>
      </div>

      {/* Last Update */}
      {lastUpdate && (
        <div className="text-sm text-gray-500">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      )}

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <Alert key={alert.id} className="border-l-4 border-l-blue-500">
              <div className="flex items-center gap-2">
                {getAlertIcon(alert.type)}
                <AlertDescription className="flex-1">
                  {alert.message}
                </AlertDescription>
                <span className="text-xs text-gray-500">{alert.time}</span>
              </div>
            </Alert>
          ))}
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
          <TabsTrigger value="diagnosis">Diagnosis Trends</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Total Patients</p>
                    <p className="text-2xl font-bold text-blue-600">{analyticsData.totalPatients}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Today's Visits</p>
                    <p className="text-2xl font-bold text-green-600">{analyticsData.todaysVisits}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="text-sm text-gray-600">Emergency Rate</p>
                    <p className="text-2xl font-bold text-red-600">{analyticsData.emergencyRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600">Avg Patient Age</p>
                    <p className="text-2xl font-bold text-purple-600">{analyticsData.averageAge}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Visit Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Visit Trends (Last 7 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.visitTrends.map((trend, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-16 text-sm text-gray-600">{trend.date}</div>
                    <div className="flex-1">
                      <Progress value={(trend.visits / Math.max(...analyticsData.visitTrends.map(t => t.visits))) * 100} className="h-2" />
                    </div>
                    <div className="w-12 text-sm font-medium">{trend.visits}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="demographics" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Age Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Age Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.ageDistribution.map((age, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="w-16 text-sm text-gray-600">{age.range}</div>
                      <div className="flex-1">
                        <Progress value={age.percentage} className="h-2" />
                      </div>
                      <div className="w-16 text-sm font-medium">{age.count} ({age.percentage}%)</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Risk Assessment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Risk Assessment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.riskAssessment.map((risk, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className={`w-16 text-sm font-medium capitalize ${getRiskColor(risk.level)}`}>
                        {risk.level}
                      </div>
                      <div className="flex-1">
                        <Progress value={risk.percentage} className="h-2" />
                      </div>
                      <div className="w-16 text-sm font-medium">{risk.count} ({risk.percentage}%)</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="diagnosis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5" />
                Common Diagnoses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.commonDiagnoses.slice(0, 10).map((diagnosis, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-8 text-sm font-medium text-gray-500">#{index + 1}</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium mb-1">{diagnosis.diagnosis}</div>
                      <Progress value={diagnosis.percentage} className="h-2" />
                    </div>
                    <div className="w-20 text-sm font-medium">{diagnosis.count} ({diagnosis.percentage}%)</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI-Generated Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  <span>Generating AI insights...</span>
                </div>
              ) : aiInsights ? (
                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {aiInsights}
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No AI insights available</p>
                  <p className="text-sm">Try refreshing to generate new insights</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
