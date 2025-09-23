"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Users, 
  Clock, 
  Stethoscope, 
  RefreshCw,
  Bell,
  CheckCircle,
  Timer,
  User,
  Phone,
  FileText,
  Pill,
  ArrowRight
} from 'lucide-react'

interface QueuePatient {
  visitId: string
  visitNumber: string
  patientId: string
  patientNumber: string
  patientName: string
  age: number
  gender: string
  phone?: string
  chiefComplaint: string
  symptoms?: string
  visitStatus: 'waiting' | 'in_consultation' | 'completed'
  priority: 'normal' | 'urgent' | 'emergency'
  checkinTime: string
  tokenNumber?: string
  queuePosition?: number
}

interface DoctorQueueProps {
  doctorId: string
  doctorName: string
  onOpenConsultation?: (patient: QueuePatient) => void
}

export function DoctorQueueDashboard({ doctorId, doctorName, onOpenConsultation }: DoctorQueueProps) {
  const [patients, setPatients] = useState<QueuePatient[]>([])  // All patients for tabs
  const [queuePatients, setQueuePatients] = useState<QueuePatient[]>([])  // Active patients for main queue
  const [currentPatient, setCurrentPatient] = useState<QueuePatient | null>(null)
  const [loading, setLoading] = useState(true)
  const [callingPatient, setCallingPatient] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    waiting: 0,
    inConsultation: 0,
    completed: 0
  })

  const fetchQueue = async () => {
    console.log('📊 Fetching queue for doctor:', doctorId)
    try {
      const response = await fetch(`/api/patients/assigned?doctor_id=${doctorId}`)
      const result = await response.json()
      
      console.log('📊 Queue fetch response:', result)
      
      if (result.success) {
        // For doctor queue, use activePatients (non-completed) for the waiting queue
        const activePatients = result.data.activePatients || result.data.allPatients.filter((p: any) => p.visitStatus !== 'completed')
        console.log('📊 Active patients (for queue):', activePatients)
        setQueuePatients(activePatients)
        
        // Find current patient in consultation
        const current = activePatients.find((p: QueuePatient) => p.visitStatus === 'in_consultation')
        console.log('📊 Current patient in consultation:', current)
        setCurrentPatient(current || null)
        
        // FIXED: Use ALL patients for stats and tabs
        const allPatients = result.data.allPatients || []
        console.log('📊 All patients for doctor stats:', allPatients.length)
        
        // CRITICAL FIX: Set ALL patients for tabs to access completed patients
        setPatients(allPatients)
        
        // Update stats using ALL patients (including completed)
        const newStats = {
          total: allPatients.length,
          waiting: allPatients.filter((p: any) => p.visitStatus === 'waiting' || p.visitStatus === 'admission_requested').length,
          inConsultation: allPatients.filter((p: any) => p.visitStatus === 'in_consultation').length,
          completed: allPatients.filter((p: any) => p.visitStatus === 'completed').length
        }
        console.log('📊 Stats updated (with completed):', newStats)
        setStats(newStats)
      } else {
        console.error('❌ Failed to fetch queue:', result.error)
      }
    } catch (error) {
      console.error('💥 Error fetching queue:', error)
    } finally {
      setLoading(false)
    }
  }

  const callNextPatient = async () => {
    console.log('🔥 Call Next Patient button clicked!')
    console.log('Current patients:', patients)
    console.log('Doctor ID:', doctorId)
    
    try {
      setCallingPatient(true)
      
      // Find next waiting patient
      const nextPatient = patients
        .filter(p => p.visitStatus === 'waiting')
        .sort((a, b) => (a.queuePosition || 0) - (b.queuePosition || 0))[0]
      
      console.log('Next patient found:', nextPatient)
      
      if (!nextPatient) {
        console.log('❌ No patients waiting in queue')
        alert('No patients waiting in queue')
        return
      }

      // Update patient status to in_consultation
      console.log('🔄 Updating patient status to in_consultation for visit:', nextPatient.visitId)
      const response = await fetch('/api/visits/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitId: nextPatient.visitId,
          status: 'in_consultation'
        })
      })

      console.log('API Response status:', response.status)
      const responseData = await response.json()
      console.log('API Response data:', responseData)

      if (response.ok) {
        console.log('✅ Patient status updated successfully')
        // Update local state immediately
        setPatients(prev => prev.map(p => 
          p.visitId === nextPatient.visitId 
            ? { ...p, visitStatus: 'in_consultation' as const }
            : p.visitStatus === 'in_consultation'
            ? { ...p, visitStatus: 'waiting' as const } // Move current patient back to waiting if any
            : p
        ))
        setCurrentPatient({ ...nextPatient, visitStatus: 'in_consultation' })
        
        // Show notification
        alert(`Calling ${nextPatient.patientName} - Token #${nextPatient.tokenNumber}`)
      } else {
        console.error('❌ Failed to update patient status:', responseData)
        alert('Failed to call patient: ' + (responseData.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('💥 Error calling patient:', error)
      alert('Failed to call patient: ' + (error as Error).message)
    } finally {
      console.log('🔄 Setting callingPatient to false')
      setCallingPatient(false)
    }
  }

  const startConsultation = (patient: QueuePatient) => {
    console.log('🩺 Start Consultation button clicked!')
    console.log('Patient data:', patient)
    console.log('onOpenConsultation prop:', onOpenConsultation)
    
    if (onOpenConsultation) {
      console.log('✅ Calling onOpenConsultation...')
      onOpenConsultation(patient)
    } else {
      console.error('❌ onOpenConsultation prop is missing!')
      alert('Consultation interface not available')
    }
  }

  useEffect(() => {
    fetchQueue()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchQueue, 30000)
    return () => clearInterval(interval)
  }, [doctorId])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'waiting':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-300">Waiting</Badge>
      case 'in_consultation':
        return <Badge variant="outline" className="text-blue-600 border-blue-300">In Consultation</Badge>
      case 'completed':
        return <Badge variant="outline" className="text-green-600 border-green-300">Completed</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'emergency':
        return <Badge className="bg-red-500 text-white">Emergency</Badge>
      case 'urgent':
        return <Badge className="bg-orange-500 text-white">Urgent</Badge>
      case 'normal':
        return <Badge variant="secondary">Normal</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading your queue...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Doctor Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome, {doctorName}
        </h1>
        <p className="text-gray-600">Your OPD Queue Dashboard</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Patients</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Waiting</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.waiting}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">In Consultation</p>
                <p className="text-2xl font-bold text-blue-600">{stats.inConsultation}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Patient & Call Next */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Patient */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Current Patient
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentPatient ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{currentPatient.patientName}</h3>
                    <p className="text-sm text-gray-600">Token #{currentPatient.tokenNumber}</p>
                  </div>
                  {getStatusBadge(currentPatient.visitStatus)}
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Age:</strong> {currentPatient.age}</p>
                    <p><strong>Gender:</strong> {currentPatient.gender}</p>
                  </div>
                  <div>
                    <p><strong>Phone:</strong> {currentPatient.phone || 'N/A'}</p>
                    <p><strong>Priority:</strong> {currentPatient.priority}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm"><strong>Chief Complaint:</strong></p>
                  <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    {currentPatient.chiefComplaint}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button 
                    className="flex-1"
                    onClick={() => startConsultation(currentPatient)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Open Consultation
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Stethoscope className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No patient in consultation</p>
                <p className="text-sm text-gray-500">Call the next patient to start</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Call Next Patient */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Queue Control
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={callNextPatient}
              disabled={callingPatient || stats.waiting === 0}
              className="w-full h-16 text-lg"
              size="lg"
            >
              {callingPatient ? (
                <>
                  <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                  Calling Patient...
                </>
              ) : (
                <>
                  <Bell className="h-5 w-5 mr-2" />
                  Call Next Patient
                </>
              )}
            </Button>

            {stats.waiting > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Next in Queue:</h4>
                {queuePatients
                  .filter(p => p.visitStatus === 'waiting')
                  .sort((a, b) => (a.queuePosition || 0) - (b.queuePosition || 0))
                  .slice(0, 3)
                  .map((patient, index) => (
                    <div key={patient.visitId} className="flex items-center justify-between py-2">
                      <div>
                        <p className="font-medium">{patient.patientName}</p>
                        <p className="text-sm text-gray-600">Token #{patient.tokenNumber}</p>
                      </div>
                      {index === 0 && (
                        <Badge variant="outline" className="text-blue-600">Next</Badge>
                      )}
                    </div>
                  ))
                }
              </div>
            )}

            <Button 
              variant="outline" 
              onClick={fetchQueue}
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Queue
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Queue Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="waiting" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="waiting">
                Waiting ({stats.waiting})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({stats.completed})
              </TabsTrigger>
              <TabsTrigger value="all">
                All Patients ({stats.total})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="waiting">
              <div className="space-y-3">
                {patients
                  .filter(p => p.visitStatus === 'waiting')
                  .sort((a, b) => (a.queuePosition || 0) - (b.queuePosition || 0))
                  .map((patient) => (
                    <PatientQueueCard
                      key={patient.visitId}
                      patient={patient}
                      onCallPatient={() => callNextPatient()}
                      showCallButton={true}
                    />
                  ))
                }
                {patients.filter(p => p.visitStatus === 'waiting').length === 0 && (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No patients waiting</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="completed">
              <div className="space-y-3">
                {patients
                  .filter(p => p.visitStatus === 'completed')
                  .map((patient) => (
                    <PatientQueueCard
                      key={patient.visitId}
                      patient={patient}
                      onCallPatient={() => {}}
                      showCallButton={false}
                    />
                  ))
                }
                {patients.filter(p => p.visitStatus === 'completed').length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No completed consultations today</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="all">
              <div className="space-y-3">
                {patients.map((patient) => (
                  <PatientQueueCard
                    key={patient.visitId}
                    patient={patient}
                    onCallPatient={() => callNextPatient()}
                    showCallButton={patient.visitStatus === 'waiting'}
                  />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

interface PatientQueueCardProps {
  patient: QueuePatient
  onCallPatient: () => void
  showCallButton: boolean
}

function PatientQueueCard({ patient, onCallPatient, showCallButton }: PatientQueueCardProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'waiting':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-300">Waiting</Badge>
      case 'in_consultation':
        return <Badge variant="outline" className="text-blue-600 border-blue-300">In Consultation</Badge>
      case 'completed':
        return <Badge variant="outline" className="text-green-600 border-green-300">Completed</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'emergency':
        return <Badge className="bg-red-500 text-white">Emergency</Badge>
      case 'urgent':
        return <Badge className="bg-orange-500 text-white">Urgent</Badge>
      case 'normal':
        return <Badge variant="secondary">Normal</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <div className="border rounded-lg p-4 hover:bg-gray-50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
            {patient.tokenNumber}
          </div>
          <div>
            <h3 className="font-semibold">{patient.patientName}</h3>
            <p className="text-sm text-gray-600">{patient.age} years, {patient.gender}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {getStatusBadge(patient.visitStatus)}
          {getPriorityBadge(patient.priority)}
        </div>
      </div>
      
      <div className="text-sm text-gray-600 mb-3">
        <p><strong>Chief Complaint:</strong> {patient.chiefComplaint}</p>
        <p><strong>Check-in:</strong> {new Date(patient.checkinTime).toLocaleTimeString()}</p>
      </div>

      {showCallButton && (
        <Button size="sm" variant="outline" onClick={onCallPatient}>
          <Bell className="h-4 w-4 mr-2" />
          Call Patient
        </Button>
      )}
    </div>
  )
}