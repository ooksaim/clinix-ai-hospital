"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Users, 
  UserCheck, 
  Clock, 
  Stethoscope, 
  RefreshCw,
  Search,
  Filter,
  AlertCircle,
  CheckCircle,
  Timer,
  Building
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
  departmentId: string
  assignedDoctor: string
  assignedDoctorId: string
  chiefComplaint: string
  symptoms?: string
  visitStatus: 'waiting' | 'in_consultation' | 'completed'
  priority: 'normal' | 'urgent' | 'emergency'
  visitType: string
  checkinTime: string
  tokenNumber?: string
  tokenStatus?: string
  queuePosition?: number
}

interface AssignmentData {
  allPatients: AssignedPatient[]
  byDepartment: Record<string, AssignedPatient[]>
  byDoctor: Record<string, AssignedPatient[]>
  stats: {
    totalPatients: number
    waitingPatients: number
    inConsultationPatients: number
    completedPatients: number
    departmentCount: number
    doctorCount: number
  }
}

export function PatientAssignmentDashboard() {
  const [data, setData] = useState<AssignmentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [departmentFilter, setDepartmentFilter] = useState<string>('all')
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchAssignedPatients = async () => {
    try {
      console.log('Fetching assigned patients...')
      const response = await fetch('/api/patients/assigned')
      const result = await response.json()
      
      console.log('API Response:', result)
      
      if (result.success) {
        setData(result.data)
        console.log('Assigned patients data set:', result.data)
      } else {
        console.error('API returned error:', result.error)
      }
    } catch (error) {
      console.error('Error fetching assigned patients:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAssignedPatients()
    
    if (autoRefresh) {
      const interval = setInterval(fetchAssignedPatients, 30000) // Refresh every 30 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

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

  const filteredPatients = data?.allPatients.filter(patient => {
    const matchesSearch = patient.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.patientNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.assignedDoctor.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || patient.visitStatus === statusFilter
    const matchesDepartment = departmentFilter === 'all' || patient.departmentId === departmentFilter
    
    return matchesSearch && matchesStatus && matchesDepartment
  }) || []

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading patient assignments...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-600">Failed to load assignment data</p>
          <Button onClick={fetchAssignedPatients} className="mt-2">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Patient Assignment Dashboard</h2>
          <p className="text-gray-600">Real-time view of today's patient assignments</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50 border-green-300' : ''}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={fetchAssignedPatients}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Now
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Patients</p>
                <p className="text-2xl font-bold">{data?.stats.totalPatients || 0}</p>
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
                <p className="text-2xl font-bold">{data?.stats.waitingPatients || 0}</p>
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
                <p className="text-2xl font-bold">{data?.stats.inConsultationPatients || 0}</p>
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
                <p className="text-2xl font-bold">{data?.stats.completedPatients || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search patients, doctors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="waiting">Waiting</SelectItem>
                <SelectItem value="in_consultation">In Consultation</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {Object.keys(data?.byDepartment || {}).map(dept => (
                  <SelectItem key={dept} value={data?.byDepartment[dept][0]?.departmentId || dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="text-sm text-gray-600 flex items-center">
              Showing {filteredPatients.length} of {data?.stats.totalPatients || 0} patients
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Patient List</TabsTrigger>
          <TabsTrigger value="departments">By Department</TabsTrigger>
          <TabsTrigger value="doctors">By Doctor</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>All Assigned Patients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredPatients.map((patient) => (
                  <div key={patient.visitId} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{patient.patientName}</h3>
                          <Badge variant="outline">Token #{patient.tokenNumber}</Badge>
                          {getStatusBadge(patient.visitStatus)}
                          {getPriorityBadge(patient.priority)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div>
                            <p><strong>Patient ID:</strong> {patient.patientNumber}</p>
                            <p><strong>Age/Gender:</strong> {patient.age} / {patient.gender}</p>
                            <p><strong>Phone:</strong> {patient.phone || 'N/A'}</p>
                          </div>
                          <div>
                            <p><strong>Department:</strong> {patient.department}</p>
                            <p><strong>Doctor:</strong> {patient.assignedDoctor}</p>
                            <p><strong>Check-in:</strong> {new Date(patient.checkinTime).toLocaleTimeString()}</p>
                          </div>
                          <div>
                            <p><strong>Chief Complaint:</strong> {patient.chiefComplaint}</p>
                            <p><strong>Symptoms:</strong> {patient.symptoms || 'None specified'}</p>
                            <p><strong>Queue Position:</strong> {patient.queuePosition || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredPatients.length === 0 && (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No patients found matching your criteria</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Total patients today: {data?.stats.totalPatients || 0}
                    </p>
                    <Button onClick={fetchAssignedPatients} variant="outline" className="mt-4">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh Data
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(data?.byDepartment || {}).map(([department, patients]) => (
              <Card key={department}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    {department}
                    <Badge variant="secondary">{patients.length} patients</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {patients.slice(0, 5).map((patient) => (
                      <div key={patient.visitId} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <p className="font-medium">{patient.patientName}</p>
                          <p className="text-sm text-gray-600">{patient.assignedDoctor}</p>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(patient.visitStatus)}
                          <p className="text-xs text-gray-500 mt-1">Token #{patient.tokenNumber}</p>
                        </div>
                      </div>
                    ))}
                    {patients.length > 5 && (
                      <p className="text-sm text-gray-500 text-center">
                        +{patients.length - 5} more patients
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="doctors">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(data?.byDoctor || {}).map(([doctor, patients]) => (
              <Card key={doctor}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5" />
                    {doctor}
                    <Badge variant="secondary">{patients.length} patients</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {patients.slice(0, 5).map((patient) => (
                      <div key={patient.visitId} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <p className="font-medium">{patient.patientName}</p>
                          <p className="text-sm text-gray-600">{patient.department}</p>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(patient.visitStatus)}
                          <p className="text-xs text-gray-500 mt-1">Token #{patient.tokenNumber}</p>
                        </div>
                      </div>
                    ))}
                    {patients.length > 5 && (
                      <p className="text-sm text-gray-500 text-center">
                        +{patients.length - 5} more patients
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}