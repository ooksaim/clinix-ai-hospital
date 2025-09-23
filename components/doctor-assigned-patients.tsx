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
  CheckCircle,
  AlertCircle,
  Timer,
  User
} from 'lucide-react'

interface AssignedPatient {
  visitId: string
  visitNumber: string
  patientId: string
  patientNumber: string
  patientName: string
  age: number
  gender: string
  phone?: string
  cnic?: string
  department: string
  chiefComplaint: string
  symptoms?: string
  visitStatus: 'waiting' | 'in_consultation' | 'completed'
  priority: 'normal' | 'urgent' | 'emergency'
  checkinTime: string
  tokenNumber?: string
  queuePosition?: number
}

interface DoctorAssignedPatientsProps {
  doctorId: string
}

export function DoctorAssignedPatients({ doctorId }: DoctorAssignedPatientsProps) {
  const [patients, setPatients] = useState<AssignedPatient[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    waiting: 0,
    inConsultation: 0,
    completed: 0
  })

  const fetchAssignedPatients = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/patients/assigned?doctor_id=${doctorId}`)
      const result = await response.json()
      
      if (result.success) {
        const assignedPatients = result.data.allPatients
        setPatients(assignedPatients)
        
        // Calculate stats
        setStats({
          total: assignedPatients.length,
          waiting: assignedPatients.filter((p: AssignedPatient) => p.visitStatus === 'waiting').length,
          inConsultation: assignedPatients.filter((p: AssignedPatient) => p.visitStatus === 'in_consultation').length,
          completed: assignedPatients.filter((p: AssignedPatient) => p.visitStatus === 'completed').length
        })
      }
    } catch (error) {
      console.error('Error fetching assigned patients:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (doctorId) {
      fetchAssignedPatients()
      
      // Auto-refresh every 30 seconds
      const interval = setInterval(fetchAssignedPatients, 30000)
      return () => clearInterval(interval)
    }
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

  const updatePatientStatus = async (visitId: string, newStatus: string) => {
    try {
      // Here you would call an API to update the patient status
      // For now, we'll just refresh the data
      await fetchAssignedPatients()
    } catch (error) {
      console.error('Error updating patient status:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading your assigned patients...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Assigned</p>
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
                <p className="text-2xl font-bold">{stats.waiting}</p>
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
                <p className="text-2xl font-bold">{stats.inConsultation}</p>
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
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Patient List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              My Assigned Patients Today
            </CardTitle>
            <Button variant="outline" size="sm" onClick={fetchAssignedPatients}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="waiting" className="space-y-4">
            <TabsList>
              <TabsTrigger value="waiting">
                Waiting ({stats.waiting})
              </TabsTrigger>
              <TabsTrigger value="in_consultation">
                In Consultation ({stats.inConsultation})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({stats.completed})
              </TabsTrigger>
              <TabsTrigger value="all">
                All ({stats.total})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="waiting">
              <div className="space-y-4">
                {patients.filter(p => p.visitStatus === 'waiting').map((patient) => (
                  <PatientCard
                    key={patient.visitId}
                    patient={patient}
                    onStatusUpdate={updatePatientStatus}
                    showActions={true}
                  />
                ))}
                {patients.filter(p => p.visitStatus === 'waiting').length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No patients waiting</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="in_consultation">
              <div className="space-y-4">
                {patients.filter(p => p.visitStatus === 'in_consultation').map((patient) => (
                  <PatientCard
                    key={patient.visitId}
                    patient={patient}
                    onStatusUpdate={updatePatientStatus}
                    showActions={true}
                  />
                ))}
                {patients.filter(p => p.visitStatus === 'in_consultation').length === 0 && (
                  <div className="text-center py-8">
                    <Stethoscope className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No patients in consultation</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="completed">
              <div className="space-y-4">
                {patients.filter(p => p.visitStatus === 'completed').map((patient) => (
                  <PatientCard
                    key={patient.visitId}
                    patient={patient}
                    onStatusUpdate={updatePatientStatus}
                    showActions={false}
                  />
                ))}
                {patients.filter(p => p.visitStatus === 'completed').length === 0 && (
                  <div className="text-center py-8">
                    <Timer className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No completed consultations today</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="all">
              <div className="space-y-4">
                {patients.map((patient) => (
                  <PatientCard
                    key={patient.visitId}
                    patient={patient}
                    onStatusUpdate={updatePatientStatus}
                    showActions={patient.visitStatus !== 'completed'}
                  />
                ))}
                {patients.length === 0 && (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No patients assigned today</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

interface PatientCardProps {
  patient: AssignedPatient
  onStatusUpdate: (visitId: string, newStatus: string) => void
  showActions: boolean
}

function PatientCard({ patient, onStatusUpdate, showActions }: PatientCardProps) {
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
          <h3 className="font-semibold text-lg">{patient.patientName}</h3>
          <Badge variant="outline">Token #{patient.tokenNumber}</Badge>
          {getStatusBadge(patient.visitStatus)}
          {getPriorityBadge(patient.priority)}
        </div>
        
        {showActions && (
          <div className="flex gap-2">
            {patient.visitStatus === 'waiting' && (
              <Button 
                size="sm" 
                onClick={() => onStatusUpdate(patient.visitId, 'in_consultation')}
              >
                Start Consultation
              </Button>
            )}
            {patient.visitStatus === 'in_consultation' && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onStatusUpdate(patient.visitId, 'completed')}
              >
                Complete
              </Button>
            )}
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
        <div>
          <p><strong>Patient ID:</strong> {patient.patientNumber}</p>
          <p><strong>Age/Gender:</strong> {patient.age} / {patient.gender}</p>
          <p><strong>Phone:</strong> {patient.phone || 'N/A'}</p>
        </div>
        <div>
          <p><strong>Department:</strong> {patient.department}</p>
          <p><strong>Check-in:</strong> {new Date(patient.checkinTime).toLocaleTimeString()}</p>
          <p><strong>Queue Position:</strong> {patient.queuePosition || 'N/A'}</p>
        </div>
        <div>
          <p><strong>Chief Complaint:</strong> {patient.chiefComplaint}</p>
          <p><strong>Symptoms:</strong> {patient.symptoms || 'None specified'}</p>
          <p><strong>Visit Number:</strong> {patient.visitNumber}</p>
        </div>
      </div>
    </div>
  )
}