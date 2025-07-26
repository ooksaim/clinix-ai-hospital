"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  AlertTriangle,
  Phone,
  Clock,
  MapPin,
  Users,
  Activity,
  Stethoscope,
  Brain,
  Zap,
  CheckCircle,
  XCircle,
  Bell,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Eye,
  Timer,
  Target
} from "lucide-react"
import {
  getEmergencyPatients,
  getTodaysVisits,
  performAITriage,
  calculatePatientRiskScore,
  type Patient,
  type Visit,
  type TriageAssessment,
  type VitalSigns
} from "@/app/actions"

interface EmergencyCase {
  id: string
  patient: Patient
  triageLevel: number
  symptoms: string
  vitalSigns?: VitalSigns
  estimatedWaitTime: number
  assignedStaff?: string
  status: 'waiting' | 'in-progress' | 'resolved'
  timestamp: Date
  priority: 'immediate' | 'urgent' | 'semi-urgent' | 'non-urgent'
  aiRecommendation?: string
  warningFlags: string[]
}

interface EmergencyProtocol {
  id: string
  name: string
  triageLevel: number
  description: string
  actions: string[]
  timeLimit: number // minutes
  requiredStaff: string[]
  isActive: boolean
}

const DEFAULT_PROTOCOLS: EmergencyProtocol[] = [
  {
    id: 'cardiac-arrest',
    name: 'Cardiac Arrest Protocol',
    triageLevel: 1,
    description: 'Immediate life-threatening cardiac emergency',
    actions: [
      'Call Code Blue immediately',
      'Begin CPR within 2 minutes',
      'Prepare defibrillator',
      'Establish IV access',
      'Administer medications per ACLS protocol'
    ],
    timeLimit: 5,
    requiredStaff: ['ER Doctor', 'Nurse', 'Respiratory Therapist'],
    isActive: true
  },
  {
    id: 'stroke-protocol',
    name: 'Acute Stroke Protocol',
    triageLevel: 1,
    description: 'Time-sensitive stroke intervention',
    actions: [
      'Activate stroke team',
      'Order immediate CT scan',
      'Check blood glucose',
      'Assess for thrombolytic therapy',
      'Monitor vitals every 15 minutes'
    ],
    timeLimit: 60,
    requiredStaff: ['Neurologist', 'ER Doctor', 'CT Technician'],
    isActive: true
  },
  {
    id: 'trauma-protocol',
    name: 'Major Trauma Protocol',
    triageLevel: 1,
    description: 'Multi-system trauma requiring immediate intervention',
    actions: [
      'Activate trauma team',
      'Secure airway',
      'Control bleeding',
      'Establish large bore IV access',
      'Order trauma panel labs and imaging'
    ],
    timeLimit: 10,
    requiredStaff: ['Trauma Surgeon', 'ER Doctor', 'Anesthesiologist'],
    isActive: true
  },
  {
    id: 'respiratory-distress',
    name: 'Severe Respiratory Distress',
    triageLevel: 2,
    description: 'Acute breathing difficulty requiring urgent intervention',
    actions: [
      'Apply high-flow oxygen',
      'Obtain arterial blood gas',
      'Prepare for intubation if needed',
      'Administer bronchodilators',
      'Monitor oxygen saturation continuously'
    ],
    timeLimit: 15,
    requiredStaff: ['ER Doctor', 'Respiratory Therapist'],
    isActive: true
  }
]

export function EmergencyProtocolManager() {
  const [emergencyCases, setEmergencyCases] = useState<EmergencyCase[]>([])
  const [protocols, setProtocols] = useState<EmergencyProtocol[]>(DEFAULT_PROTOCOLS)
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [selectedCase, setSelectedCase] = useState<EmergencyCase | null>(null)
  const [newProtocol, setNewProtocol] = useState<Partial<EmergencyProtocol>>({})
  const [showNewProtocolForm, setShowNewProtocolForm] = useState(false)

  // Emergency alert states
  const [activeAlerts, setActiveAlerts] = useState<Array<{
    id: string
    level: number
    message: string
    timestamp: Date
    acknowledged: boolean
  }>>([])

  // Fetch emergency cases from real data (OPTIMIZED VERSION)
  const fetchEmergencyCases = async () => {
    try {
      setIsLoading(true)
      console.log("🚨 Fetching emergency cases...")

      // Get emergency patients and today's visits
      const [emergencyPatients, todaysVisits] = await Promise.all([
        getEmergencyPatients(),
        getTodaysVisits()
      ])

      console.log(`🚨 Found ${emergencyPatients.length} emergency patients`)

      // Process cases with basic data first (no AI calls initially)
      const cases: EmergencyCase[] = []
      
      for (const patient of emergencyPatients) {
        // Find the patient's recent visit
        const patientVisit = todaysVisits.find(visit => visit.patientId === patient.id)
        
        if (patientVisit) {
          // Create basic emergency case without AI (for faster loading)
          const basicCase: EmergencyCase = {
            id: `emergency-${patient.id}-${Date.now()}`,
            patient,
            triageLevel: 3, // Default medium priority
            symptoms: patientVisit.symptoms,
            estimatedWaitTime: 30,
            status: 'waiting',
            timestamp: new Date(patientVisit.visitDate),
            priority: 'semi-urgent',
            warningFlags: ['Emergency case - assessment pending']
          }
          cases.push(basicCase)
        }
      }

      // Sort cases by timestamp (most recent first)
      cases.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      
      setEmergencyCases(cases)
      setLastUpdate(new Date())
      setIsLoading(false) // Stop loading here for basic data

      console.log(`✅ Processed ${cases.length} emergency cases (basic mode)`)

      // Enhance with AI triage in background (don't block UI)
      setTimeout(async () => {
        console.log("🤖 Enhancing with AI triage in background...")
        const enhancedCases = [...cases]
        
        for (let i = 0; i < Math.min(cases.length, 3); i++) { // Limit to 3 AI calls
          const case_ = cases[i]
          const patientVisit = todaysVisits.find(visit => visit.patientId === case_.patient.id)
          
          if (patientVisit) {
            try {
              const triageAssessment = await performAITriage(patientVisit.symptoms)
              
              enhancedCases[i] = {
                ...case_,
                triageLevel: triageAssessment.urgencyLevel,
                estimatedWaitTime: triageAssessment.estimatedWaitTime,
                priority: triageAssessment.priority,
                aiRecommendation: triageAssessment.aiRecommendation,
                warningFlags: triageAssessment.warningFlags
              }
              
              // Generate alerts for critical cases
              if (triageAssessment.urgencyLevel <= 2) {
                setActiveAlerts(prev => [...prev, {
                  id: `alert-${case_.patient.id}-${Date.now()}`,
                  level: triageAssessment.urgencyLevel,
                  message: `${case_.patient.name} requires immediate attention - ${triageAssessment.warningFlags.join(', ')}`,
                  timestamp: new Date(),
                  acknowledged: false
                }])
              }
              
            } catch (error) {
              console.warn(`⚠️ AI triage failed for patient ${case_.patient.id}:`, error)
            }
          }
        }
        
        // Sort by triage level after enhancement
        enhancedCases.sort((a, b) => a.triageLevel - b.triageLevel)
        setEmergencyCases(enhancedCases)
        console.log("✅ AI enhancement completed")
      }, 100) // Small delay to ensure UI loads first

    } catch (error) {
      console.error("❌ Error fetching emergency cases:", error)
      setActiveAlerts(prev => [...prev, {
        id: `error-${Date.now()}`,
        level: 1,
        message: 'Failed to fetch emergency data - check system status',
        timestamp: new Date(),
        acknowledged: false
      }])
      setIsLoading(false)
    }
  }

  // Auto-refresh emergency data (OPTIMIZED)
  useEffect(() => {
    fetchEmergencyCases()
    
    // Longer refresh interval to reduce server load
    const interval = setInterval(fetchEmergencyCases, 5 * 60 * 1000) // 5 minutes
    return () => clearInterval(interval)
  }, [])

  // Acknowledge alert
  const acknowledgeAlert = (alertId: string) => {
    setActiveAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )
    )
  }

  // Update case status
  const updateCaseStatus = (caseId: string, status: EmergencyCase['status']) => {
    setEmergencyCases(prev =>
      prev.map(case_ =>
        case_.id === caseId ? { ...case_, status } : case_
      )
    )
  }

  // Add new protocol
  const addProtocol = () => {
    if (newProtocol.name && newProtocol.description) {
      const protocol: EmergencyProtocol = {
        id: `protocol-${Date.now()}`,
        name: newProtocol.name,
        triageLevel: newProtocol.triageLevel || 3,
        description: newProtocol.description,
        actions: newProtocol.actions || [],
        timeLimit: newProtocol.timeLimit || 30,
        requiredStaff: newProtocol.requiredStaff || [],
        isActive: true
      }
      
      setProtocols(prev => [...prev, protocol])
      setNewProtocol({})
      setShowNewProtocolForm(false)
    }
  }

  // Get priority color
  const getPriorityColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-red-100 text-red-800 border-red-200'
      case 2: return 'bg-orange-100 text-orange-800 border-orange-200'
      case 3: return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-green-100 text-green-800 border-green-200'
    }
  }

  const getStatusColor = (status: EmergencyCase['status']) => {
    switch (status) {
      case 'waiting': return 'bg-red-100 text-red-800'
      case 'in-progress': return 'bg-yellow-100 text-yellow-800'
      case 'resolved': return 'bg-green-100 text-green-800'
    }
  }

  const getTimeSinceEmergency = (timestamp: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - timestamp.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    return `${diffHours}h ${diffMins % 60}m ago`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Emergency Protocol Manager</h2>
          <p className="text-gray-600">Real-time emergency monitoring and protocol management</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {emergencyCases.filter(c => c.status === 'waiting').length} Active Cases
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchEmergencyCases}
            disabled={isLoading}
            className="text-xs"
          >
            {isLoading ? (
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3 mr-1" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* Active Alerts */}
      {activeAlerts.filter(alert => !alert.acknowledged).length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-red-600 flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Active Emergency Alerts
          </h3>
          {activeAlerts.filter(alert => !alert.acknowledged).map((alert) => (
            <Alert key={alert.id} className="border-l-4 border-l-red-500 bg-red-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <AlertDescription className="font-medium">
                    <span className="text-red-600">LEVEL {alert.level} EMERGENCY:</span> {alert.message}
                  </AlertDescription>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {getTimeSinceEmergency(alert.timestamp)}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => acknowledgeAlert(alert.id)}
                    className="text-xs"
                  >
                    Acknowledge
                  </Button>
                </div>
              </div>
            </Alert>
          ))}
        </div>
      )}

      <Tabs defaultValue="active-cases" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="active-cases">Active Cases</TabsTrigger>
          <TabsTrigger value="protocols">Protocols</TabsTrigger>
          <TabsTrigger value="triage-board">Triage Board</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="active-cases" className="space-y-6">
          {/* Emergency Cases List */}
          <div className="grid gap-4">
            {emergencyCases.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <h3 className="text-lg font-semibold mb-2">No Active Emergency Cases</h3>
                  <p className="text-gray-600">All emergency situations are currently resolved</p>
                </CardContent>
              </Card>
            ) : (
              emergencyCases.map((case_) => (
                <Card key={case_.id} className={`border-l-4 ${
                  case_.triageLevel <= 2 ? 'border-l-red-500' : 
                  case_.triageLevel === 3 ? 'border-l-yellow-500' : 'border-l-green-500'
                }`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge className={getPriorityColor(case_.triageLevel)}>
                          Level {case_.triageLevel}
                        </Badge>
                        <div>
                          <CardTitle className="text-lg">{case_.patient.name}</CardTitle>
                          <p className="text-sm text-gray-600">Age {case_.patient.age} • {getTimeSinceEmergency(case_.timestamp)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(case_.status)}>
                          {case_.status.replace('-', ' ')}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedCase(case_)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">Symptoms</Label>
                        <p className="text-sm text-gray-700 mt-1">{case_.symptoms}</p>
                      </div>
                      
                      {case_.warningFlags.length > 0 && (
                        <div>
                          <Label className="text-sm font-medium text-red-600">Warning Flags</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {case_.warningFlags.map((flag, index) => (
                              <Badge key={index} variant="destructive" className="text-xs">
                                {flag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Wait: {case_.estimatedWaitTime}min
                          </span>
                          <span className="flex items-center gap-1">
                            <Target className="h-4 w-4" />
                            {case_.priority}
                          </span>
                        </div>
                        
                        <div className="flex gap-2">
                          {case_.status === 'waiting' && (
                            <Button
                              size="sm"
                              onClick={() => updateCaseStatus(case_.id, 'in-progress')}
                              className="text-xs"
                            >
                              Start Treatment
                            </Button>
                          )}
                          {case_.status === 'in-progress' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateCaseStatus(case_.id, 'resolved')}
                              className="text-xs"
                            >
                              Mark Resolved
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="protocols" className="space-y-6">
          {/* Protocols Management */}
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Emergency Protocols</h3>
            <Button
              onClick={() => setShowNewProtocolForm(true)}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Protocol
            </Button>
          </div>

          {/* New Protocol Form */}
          {showNewProtocolForm && (
            <Card>
              <CardHeader>
                <CardTitle>Create New Protocol</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="protocol-name">Protocol Name</Label>
                  <Input
                    id="protocol-name"
                    value={newProtocol.name || ''}
                    onChange={(e) => setNewProtocol(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter protocol name"
                  />
                </div>
                <div>
                  <Label htmlFor="protocol-description">Description</Label>
                  <Textarea
                    id="protocol-description"
                    value={newProtocol.description || ''}
                    onChange={(e) => setNewProtocol(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the protocol"
                  />
                </div>
                <div className="flex gap-4">
                  <Button onClick={addProtocol}>Save Protocol</Button>
                  <Button variant="outline" onClick={() => setShowNewProtocolForm(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Protocols List */}
          <div className="grid gap-4">
            {protocols.map((protocol) => (
              <Card key={protocol.id} className={`border-l-4 ${getPriorityColor(protocol.triageLevel)}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {protocol.name}
                        <Badge className={getPriorityColor(protocol.triageLevel)}>
                          Level {protocol.triageLevel}
                        </Badge>
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{protocol.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={protocol.isActive ? "default" : "secondary"}>
                        {protocol.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Timer className="h-3 w-3" />
                        {protocol.timeLimit}min
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Actions</Label>
                      <ul className="list-disc list-inside text-sm text-gray-700 mt-1 space-y-1">
                        {protocol.actions.map((action, index) => (
                          <li key={index}>{action}</li>
                        ))}
                      </ul>
                    </div>
                    
                    {protocol.requiredStaff.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium">Required Staff</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {protocol.requiredStaff.map((staff, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {staff}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="triage-board" className="space-y-6">
          {/* Triage Board Overview */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-red-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="text-sm text-gray-600">Critical (Level 1)</p>
                    <p className="text-2xl font-bold text-red-600">
                      {emergencyCases.filter(c => c.triageLevel === 1).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-sm text-gray-600">Urgent (Level 2)</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {emergencyCases.filter(c => c.triageLevel === 2).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-yellow-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="text-sm text-gray-600">Semi-Urgent (Level 3)</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {emergencyCases.filter(c => c.triageLevel === 3).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Resolved</p>
                    <p className="text-2xl font-bold text-green-600">
                      {emergencyCases.filter(c => c.status === 'resolved').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Current Emergency Queue */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Emergency Queue Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {emergencyCases.filter(c => c.status !== 'resolved').map((case_, index) => (
                  <div key={case_.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="text-lg font-bold text-gray-500">#{index + 1}</div>
                      <div>
                        <div className="font-medium">{case_.patient.name}</div>
                        <div className="text-sm text-gray-600">Level {case_.triageLevel} • {case_.priority}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(case_.status)}>
                        {case_.status.replace('-', ' ')}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {getTimeSinceEmergency(case_.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Emergency Analytics */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Response Times</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Average Response Time</span>
                    <span className="font-medium">8.5 minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Level 1 Cases</span>
                    <span className="font-medium text-red-600">3.2 minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Level 2 Cases</span>
                    <span className="font-medium text-orange-600">7.8 minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Level 3 Cases</span>
                    <span className="font-medium text-yellow-600">15.4 minutes</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Protocol Effectiveness</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Cases Resolved</span>
                    <span className="font-medium text-green-600">
                      {emergencyCases.filter(c => c.status === 'resolved').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Resolution Time</span>
                    <span className="font-medium">42 minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Protocol Compliance</span>
                    <span className="font-medium text-green-600">94%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Case Detail Modal (simplified for now) */}
      {selectedCase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Emergency Case Details</CardTitle>
                <Button variant="ghost" onClick={() => setSelectedCase(null)}>
                  <XCircle className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="font-medium">Patient Information</Label>
                  <p>{selectedCase.patient.name}, Age {selectedCase.patient.age}</p>
                </div>
                <div>
                  <Label className="font-medium">Symptoms</Label>
                  <p className="text-sm">{selectedCase.symptoms}</p>
                </div>
                {selectedCase.aiRecommendation && (
                  <div>
                    <Label className="font-medium">AI Recommendation</Label>
                    <p className="text-sm">{selectedCase.aiRecommendation}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
