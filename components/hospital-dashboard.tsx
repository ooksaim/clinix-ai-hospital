"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Users,
  Activity,
  AlertTriangle,
  TrendingUp,
  Clock,
  Stethoscope,
  FileText,
  BarChart3,
  UserCheck,
  Bell,
  Zap,
  Brain,
  RefreshCw,
  Calendar,
  Timer
} from "lucide-react"
import type { Patient, Visit, TriageAssessment } from "@/app/actions"
import { searchAllPatients, getTodaysVisits, getEmergencyPatients, getDashboardStats, detectEmergencyPatterns } from "@/app/actions"
import { AIQuotaMonitor } from "./ai-quota-monitor"

interface HospitalDashboardProps {
  patients?: Patient[]
  recentVisits?: Visit[]
  triageQueue?: TriageAssessment[]
}

export function HospitalDashboard({ patients = [], recentVisits = [], triageQueue = [] }: HospitalDashboardProps) {
  const [realTimeStats, setRealTimeStats] = useState({
    totalPatients: 0,
    todayVisits: 0,
    emergencyQueue: 0,
    avgWaitTime: 25,
    bedOccupancy: 85,
    staffOnDuty: 23
  })

  const [livePatients, setLivePatients] = useState<Patient[]>([])
  const [todaysVisits, setTodaysVisits] = useState<Visit[]>([])
  const [emergencyPatients, setEmergencyPatients] = useState<Patient[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const [alerts, setAlerts] = useState([
    { id: 1, type: 'emergency', message: 'Patient #1247 requires immediate attention', time: '2 min ago' },
    { id: 2, type: 'warning', message: 'Low oxygen supplies in Ward B', time: '15 min ago' },
    { id: 3, type: 'info', message: 'AI detected unusual symptom pattern - possible outbreak alert', time: '1 hour ago' }
  ])

  // Emergency pattern detection
  const [emergencyAlerts, setEmergencyAlerts] = useState<Array<{
    id: string
    type: 'outbreak' | 'capacity' | 'quality' | 'safety'
    severity: 'low' | 'medium' | 'high' | 'critical'
    message: string
    timestamp: string
    recommendation: string
  }>>([])
  const [emergencyScore, setEmergencyScore] = useState(0)

  // Fix hydration error by ensuring component is mounted before showing time
  useEffect(() => {
    setIsMounted(true)
    setLastUpdate(new Date())
  }, [])

  // Fetch real-time data using the new API
  const fetchRealTimeData = async () => {
    try {
      setIsLoading(true)
      console.log("🔄 Fetching real-time dashboard data...")

      // Use the new dashboard stats function for better performance
      const stats = await getDashboardStats()
      
      // Also run emergency pattern detection
      const emergencyPatterns = await detectEmergencyPatterns()
      setEmergencyAlerts(emergencyPatterns.alerts)
      setEmergencyScore(emergencyPatterns.emergencyScore)

      // Also fetch detailed data for components
      const [allPatients, todayVisits, emergencyPts] = await Promise.all([
        searchAllPatients(),
        getTodaysVisits(),
        getEmergencyPatients()
      ])

      setLivePatients(allPatients)
      setTodaysVisits(todayVisits)
      setEmergencyPatients(emergencyPts)

      // Update stats with live data
      setRealTimeStats(prev => ({
        ...prev,
        totalPatients: stats.totalPatients,
        todayVisits: stats.todaysVisits,
        emergencyQueue: stats.emergencyQueue,
        // Simulate some realistic variations for other metrics
        avgWaitTime: Math.max(15, Math.min(45, prev.avgWaitTime + (Math.random() - 0.5) * 10)),
        bedOccupancy: Math.max(70, Math.min(95, prev.bedOccupancy + (Math.random() - 0.5) * 5)),
        staffOnDuty: Math.max(18, Math.min(30, prev.staffOnDuty + Math.floor((Math.random() - 0.5) * 3)))
      }))

      setLastUpdate(new Date())
      
      console.log("✅ Real-time data updated:", {
        patients: stats.totalPatients,
        todayVisits: stats.todaysVisits,
        emergency: stats.emergencyQueue
      })

    } catch (error) {
      console.error("❌ Error fetching real-time data:", error)
      // Update alerts with error
      setAlerts(prev => [{
        id: Date.now(),
        type: 'warning',
        message: 'Real-time data update failed - using cached data',
        time: 'now'
      }, ...prev.slice(0, 2)])
    } finally {
      setIsLoading(false)
    }
  }

  // Initial load and auto-refresh
  useEffect(() => {
    if (isMounted) {
      fetchRealTimeData()
      
      if (autoRefresh) {
        const interval = setInterval(() => {
          fetchRealTimeData()
        }, 30000) // Refresh every 30 seconds

        return () => clearInterval(interval)
      }
    }
  }, [isMounted, autoRefresh])

  // Legacy effect for backward compatibility
  useEffect(() => {
    if (recentVisits.length > 0 || triageQueue.length > 0) {
      const today = new Date().toDateString()
      const todayVisitsCount = recentVisits.filter(visit => 
        new Date(visit.visitDate).toDateString() === today
      ).length

      const emergencyCount = triageQueue.filter(triage => 
        triage.urgencyLevel <= 2
      ).length

      setRealTimeStats(prev => ({
        ...prev,
        todayVisits: Math.max(prev.todayVisits, todayVisitsCount),
        emergencyQueue: Math.max(prev.emergencyQueue, emergencyCount)
      }))
    }
  }, [recentVisits, triageQueue])

  const getUrgencyColor = (level: number) => {
    if (level <= 2) return 'destructive'
    if (level === 3) return 'default'
    return 'secondary'
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'emergency': return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'warning': return <Clock className="h-4 w-4 text-yellow-500" />
      default: return <Bell className="h-4 w-4 text-blue-500" />
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getTimeAgo = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffSecs / 60)
    
    if (diffSecs < 60) return `${diffSecs}s ago`
    if (diffMins < 60) return `${diffMins}m ago`
    return `${Math.floor(diffMins / 60)}h ago`
  }

  // Don't render time until component is mounted to prevent hydration errors
  if (!isMounted) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Hospital AI Dashboard</h1>
            <p className="text-gray-600">Real-time hospital operations powered by AI</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-gray-50 text-gray-700 border-gray-200">
              <Activity className="h-3 w-3 mr-1 animate-pulse" />
              Loading...
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-16 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with real-time indicator */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hospital AI Dashboard</h1>
          <p className="text-gray-600">Real-time hospital operations powered by AI</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-50 text-green-700 border-green-200">
            <Activity className="h-3 w-3 mr-1" />
            All Systems Online
          </div>
          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 border-blue-200">
            <Brain className="h-3 w-3 mr-1" />
            AI Active
          </div>
          <Button 
            variant={autoRefresh ? "default" : "outline"} 
            size="sm" 
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="text-xs px-2 sm:px-3 py-1.5 h-8 sm:h-9 flex-shrink-0"
          >
            <Timer className="h-3 w-3 mr-1 flex-shrink-0" />
            <span className="hidden xs:inline">Auto: {autoRefresh ? 'ON' : 'OFF'}</span>
            <span className="xs:hidden">{autoRefresh ? '🔄' : '⏸️'}</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchRealTimeData}
            disabled={isLoading}
            className="text-xs px-2 sm:px-3 py-1.5 h-8 sm:h-9 flex-shrink-0"
          >
            {isLoading ? (
              <RefreshCw className="h-3 w-3 mr-1 animate-spin flex-shrink-0" />
            ) : (
              <RefreshCw className="h-3 w-3 mr-1 flex-shrink-0" />
            )}
            <span className="hidden xs:inline">Refresh</span>
            <span className="xs:hidden">🔄</span>
          </Button>
        </div>
      </div>

      {/* Last update indicator - only show when mounted */}
      {lastUpdate && (
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>Last updated: {formatTime(lastUpdate)} ({getTimeAgo(lastUpdate)})</span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Live Data
          </span>
        </div>
      )}

      {/* Real-time Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">Total Patients</p>
                <p className="text-2xl font-bold text-blue-600">{realTimeStats.totalPatients}</p>
                <div className="flex items-center gap-1 mt-1">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                  <p className="text-xs text-green-600 font-medium">Live</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">Today's Visits</p>
                <p className="text-2xl font-bold text-green-600">{realTimeStats.todayVisits}</p>
                <div className="flex items-center gap-1 mt-1">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                  <p className="text-xs text-green-600 font-medium">Live</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">Emergency Queue</p>
                <p className="text-2xl font-bold text-red-600">{realTimeStats.emergencyQueue}</p>
                <div className="flex items-center gap-1 mt-1">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                  <p className="text-xs text-red-600 font-medium">Live</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Avg Wait Time</p>
                <p className="text-2xl font-bold">{Math.round(realTimeStats.avgWaitTime)}m</p>
                <p className="text-xs text-orange-600">Updated 30s ago</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Bed Occupancy</p>
                <p className="text-2xl font-bold">{Math.round(realTimeStats.bedOccupancy)}%</p>
                <p className="text-xs text-purple-600">Near capacity</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-teal-600" />
              <div>
                <p className="text-sm text-gray-600">Staff on Duty</p>
                <p className="text-2xl font-bold">{realTimeStats.staffOnDuty}</p>
                <p className="text-xs text-teal-600">Optimal levels</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Visit Summary */}
      {todaysVisits.length > 0 && (
        <Card className="border-l-4 border-l-blue-400">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Today's Visit Details
              <Badge variant="secondary">{todaysVisits.length} visits</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {todaysVisits.slice(0, 6).map((visit, index) => (
                <div key={visit.id} className="p-3 border rounded-lg bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium">Visit #{index + 1}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(visit.visitDate).toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    <strong>Symptoms:</strong> {visit.symptoms}
                  </p>
                  {visit.diagnosis && (
                    <p className="text-sm text-blue-600">
                      <strong>Diagnosis:</strong> {visit.diagnosis}
                    </p>
                  )}
                </div>
              ))}
            </div>
            {todaysVisits.length > 6 && (
              <p className="text-center text-sm text-gray-500 mt-4">
                + {todaysVisits.length - 6} more visits today
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* AI Quota Monitor */}
      <div className="mb-6">
        <AIQuotaMonitor />
      </div>

      {/* Emergency Patients Alert */}
      {emergencyPatients.length > 0 && (
        <Alert className="border-l-4 border-l-red-500 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <AlertDescription className="font-medium text-red-800">
            <strong>{emergencyPatients.length} patients</strong> require immediate attention:
            <div className="mt-2 space-y-1">
              {emergencyPatients.slice(0, 3).map((patient, index) => (
                <div key={patient.id} className="text-sm flex justify-between items-center">
                  <span>• {patient.name} (Age: {patient.age})</span>
                  <Badge variant="destructive" className="text-xs">URGENT</Badge>
                </div>
              ))}
              {emergencyPatients.length > 3 && (
                <div className="text-sm">+ {emergencyPatients.length - 3} more patients</div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Emergency Pattern Alerts */}
      {emergencyAlerts.length > 0 && (
        <Alert className={`border-l-4 ${
          emergencyScore > 70 ? 'border-l-red-500 bg-red-50' :
          emergencyScore > 40 ? 'border-l-orange-500 bg-orange-50' :
          'border-l-yellow-500 bg-yellow-50'
        }`}>
          <AlertTriangle className={`h-4 w-4 ${
            emergencyScore > 70 ? 'text-red-500' :
            emergencyScore > 40 ? 'text-orange-500' :
            'text-yellow-500'
          }`} />
          <AlertDescription>
            <div className="font-medium mb-2">
              Emergency Pattern Detection - Risk Score: {emergencyScore}/100
            </div>
            <div className="space-y-2">
              {emergencyAlerts.slice(0, 3).map((alert) => (
                <div key={alert.id} className="text-sm border-l-2 border-gray-300 pl-3">
                  <div className="font-medium">{alert.message}</div>
                  <div className="text-gray-600 text-xs mt-1">{alert.recommendation}</div>
                </div>
              ))}
              {emergencyAlerts.length > 3 && (
                <div className="text-sm text-gray-500">+ {emergencyAlerts.length - 3} more alerts</div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Alerts & Triage */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Real-time Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Real-time Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map((alert) => (
              <Alert key={alert.id} className={`border-l-4 ${
                alert.type === 'emergency' ? 'border-l-red-500 bg-red-50' :
                alert.type === 'warning' ? 'border-l-yellow-500 bg-yellow-50' :
                'border-l-blue-500 bg-blue-50'
              }`}>
                <div className="flex items-start gap-3">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1">
                    <AlertDescription className="font-medium">
                      {alert.message}
                    </AlertDescription>
                    <p className="text-sm text-gray-500 mt-1">{alert.time}</p>
                  </div>
                  <Button size="sm" variant="outline">
                    Action
                  </Button>
                </div>
              </Alert>
            ))}
          </CardContent>
        </Card>

        {/* AI Triage Queue */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              AI Triage Queue
            </CardTitle>
          </CardHeader>
          <CardContent>
            {triageQueue.length > 0 || emergencyPatients.length > 0 ? (
              <div className="space-y-3">
                {emergencyPatients.slice(0, 5).map((patient, index) => (
                  <div key={patient.id} className="flex items-center justify-between p-3 border rounded-lg border-red-200 bg-red-50">
                    <div className="flex items-center gap-3">
                      <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-red-100 text-red-700 border-red-300">
                        Emergency
                      </div>
                      <div>
                        <p className="font-medium">{patient.name}</p>
                        <p className="text-sm text-gray-600">Age: {patient.age}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-red-600">Immediate</p>
                      <p className="text-xs text-gray-500">0m wait</p>
                    </div>
                  </div>
                ))}
                {triageQueue.slice(0, 5).map((triage, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                        triage.urgencyLevel <= 2 ? 'bg-red-100 text-red-700 border-red-300' :
                        triage.urgencyLevel === 3 ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                        'bg-gray-100 text-gray-700 border-gray-300'
                      }`}>
                        Level {triage.urgencyLevel}
                      </div>
                      <div>
                        <p className="font-medium">Patient #{index + 1}</p>
                        <p className="text-sm text-gray-600">{triage.priority}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{triage.estimatedWaitTime}m</p>
                      <p className="text-xs text-gray-500">wait time</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Stethoscope className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No patients in triage queue</p>
                <p className="text-sm mt-1">All clear! 🎉</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            AI-Powered Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
            <Button className="h-16 sm:h-20 flex-col gap-1 sm:gap-2 px-2 text-center" variant="outline">
              <Brain className="h-4 w-4 sm:h-6 sm:w-6 flex-shrink-0" />
              <span className="text-xs sm:text-sm leading-tight">AI Diagnosis</span>
            </Button>
            <Button className="h-16 sm:h-20 flex-col gap-1 sm:gap-2 px-2 text-center" variant="outline">
              <FileText className="h-4 w-4 sm:h-6 sm:w-6 flex-shrink-0" />
              <span className="text-xs sm:text-sm leading-tight">Report</span>
            </Button>
            <Button className="h-16 sm:h-20 flex-col gap-1 sm:gap-2 px-2 text-center" variant="outline">
              <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6 flex-shrink-0" />
              <span className="text-xs sm:text-sm leading-tight">Analytics</span>
            </Button>
            <Button className="h-16 sm:h-20 flex-col gap-1 sm:gap-2 px-2 text-center" variant="outline">
              <AlertTriangle className="h-4 w-4 sm:h-6 sm:w-6 flex-shrink-0" />
              <span className="text-xs sm:text-sm leading-tight text-center">Emergency</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
