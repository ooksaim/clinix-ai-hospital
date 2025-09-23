'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  Activity, 
  Heart, 
  Clock, 
  Shield, 
  ArrowLeft, 
  LogOut,
  Stethoscope,
  ClipboardList,
  Thermometer,
  AlertTriangle
} from "lucide-react"
import Link from "next/link"

interface UserProfile {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
  department_id: string | null
  department_name: string | null
}

export default function NurseDashboard() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [loadingAuth, setLoadingAuth] = useState(true)
  
  // Nurse-specific stats
  const [stats, setStats] = useState({
    assignedPatients: 8,
    pendingVitals: 3,
    medicationsToAdminister: 12,
    wardCapacity: 85,
    criticalAlerts: 2,
    lastRoundsTime: "2 hours ago"
  })

  // Sample patient data for nurses
  const [patients] = useState([
    {
      id: '1',
      name: 'John Smith',
      room: '301A',
      age: 45,
      condition: 'Post-operative',
      priority: 'stable',
      vitals: { temp: '98.6°F', bp: '120/80', hr: '72 bpm' },
      lastChecked: '30 min ago',
      medications: ['Aspirin', 'Antibiotics']
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      room: '302B',
      age: 67,
      condition: 'Pneumonia',
      priority: 'monitor',
      vitals: { temp: '100.2°F', bp: '140/90', hr: '85 bpm' },
      lastChecked: '1 hour ago',
      medications: ['Oxygen therapy', 'Bronchodilator']
    },
    {
      id: '3',
      name: 'Michael Davis',
      room: '303A',
      age: 32,
      condition: 'Fracture repair',
      priority: 'stable',
      vitals: { temp: '98.4°F', bp: '115/75', hr: '68 bpm' },
      lastChecked: '45 min ago',
      medications: ['Pain management', 'Physical therapy']
    }
  ])

  // Sample tasks for nurses
  const [tasks, setTasks] = useState([
    { id: '1', task: 'Administer medication to Room 301A', priority: 'high', time: '2:00 PM', completed: false },
    { id: '2', task: 'Check vitals - Room 302B', priority: 'medium', time: '2:30 PM', completed: false },
    { id: '3', task: 'Wound dressing change - Room 303A', priority: 'medium', time: '3:00 PM', completed: false },
    { id: '4', task: 'Document patient progress notes', priority: 'low', time: '4:00 PM', completed: false }
  ])

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      const userData = JSON.parse(storedUser)
      if (userData.role === 'nurse') {
        setCurrentUser(userData)
      } else {
        router.push('/login')
      }
    } else {
      router.push('/login')
    }
    setLoadingAuth(false)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('user')
    router.push('/login')
  }

  const markTaskCompleted = (taskId: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed: true } : task
    ))
  }

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500'
      case 'monitor': return 'bg-yellow-500'
      case 'stable': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getTaskPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading nurse dashboard...</p>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome, {currentUser.first_name} {currentUser.last_name}
              </h1>
              <p className="text-gray-600">Nurse Dashboard - Patient Care Management</p>
            </div>
          </div>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assigned Patients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.assignedPatients}</div>
              <p className="text-xs text-muted-foreground">Active on your shift</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Vitals</CardTitle>
              <Thermometer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingVitals}</div>
              <p className="text-xs text-muted-foreground">Due for check</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Medications</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.medicationsToAdminister}</div>
              <p className="text-xs text-muted-foreground">To administer today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ward Capacity</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.wardCapacity}%</div>
              <p className="text-xs text-muted-foreground">Current occupancy</p>
            </CardContent>
          </Card>
        </div>

        {/* Critical Alerts */}
        {stats.criticalAlerts > 0 && (
          <Card className="mb-8 border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Critical Alerts ({stats.criticalAlerts})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-white rounded border-l-4 border-red-500">
                  <span>Patient in Room 302B - High fever (102.5°F)</span>
                  <Button size="sm" variant="destructive">Review</Button>
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded border-l-4 border-red-500">
                  <span>Medication overdue - Room 301A</span>
                  <Button size="sm" variant="destructive">Address</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="patients" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="patients">Patient Care</TabsTrigger>
            <TabsTrigger value="tasks">Tasks & Schedule</TabsTrigger>
            <TabsTrigger value="records">Medical Records</TabsTrigger>
          </TabsList>

          <TabsContent value="patients" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5" />
                  Assigned Patients
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {patients.map((patient) => (
                    <div key={patient.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">{patient.name}</h3>
                          <Badge className={`${getPriorityBadgeColor(patient.priority)} text-white`}>
                            {patient.priority}
                          </Badge>
                          <span className="text-sm text-gray-600">Room {patient.room}</span>
                        </div>
                        <div className="text-sm text-gray-500">
                          Last checked: {patient.lastChecked}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Age & Condition</p>
                          <p className="text-sm">{patient.age} years - {patient.condition}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Vital Signs</p>
                          <p className="text-sm">
                            {patient.vitals.temp} | {patient.vitals.bp} | {patient.vitals.hr}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Current Medications</p>
                          <p className="text-sm">{patient.medications.join(', ')}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Thermometer className="h-4 w-4 mr-2" />
                          Record Vitals
                        </Button>
                        <Button size="sm" variant="outline">
                          <Heart className="h-4 w-4 mr-2" />
                          Administer Medication
                        </Button>
                        <Button size="sm" variant="outline">
                          <ClipboardList className="h-4 w-4 mr-2" />
                          Update Notes
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Today's Tasks & Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div key={task.id} className={`flex items-center justify-between p-3 border rounded-lg ${task.completed ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          checked={task.completed}
                          onChange={() => markTaskCompleted(task.id)}
                          className="w-4 h-4"
                        />
                        <div>
                          <p className={`font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}>
                            {task.task}
                          </p>
                          <p className={`text-sm ${getTaskPriorityColor(task.priority)}`}>
                            {task.priority.toUpperCase()} priority - {task.time}
                          </p>
                        </div>
                      </div>
                      {!task.completed && (
                        <Button size="sm" onClick={() => markTaskCompleted(task.id)}>
                          Complete
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Shift Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Current Shift</p>
                    <p className="text-lg">Day Shift (7:00 AM - 7:00 PM)</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Last Rounds</p>
                    <p className="text-lg">{stats.lastRoundsTime}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="records" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  Medical Records Access
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button className="h-20 flex-col">
                    <ClipboardList className="h-6 w-6 mb-2" />
                    Nursing Notes
                  </Button>
                  <Button className="h-20 flex-col" variant="outline">
                    <Activity className="h-6 w-6 mb-2" />
                    Vital Signs History
                  </Button>
                  <Button className="h-20 flex-col" variant="outline">
                    <Heart className="h-6 w-6 mb-2" />
                    Medication Records
                  </Button>
                  <Button className="h-20 flex-col" variant="outline">
                    <Shield className="h-6 w-6 mb-2" />
                    Incident Reports
                  </Button>
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