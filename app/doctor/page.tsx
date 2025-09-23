"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { PatientManagement } from "@/components/patient-management"
import { DoctorAssignedPatients } from "@/components/doctor-assigned-patients"
import { DoctorQueueDashboard } from "@/components/doctor-queue-dashboard"
import { PatientConsultationInterface } from "@/components/patient-consultation-interface"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Stethoscope, Users, Activity, FileText, LogOut, ArrowLeft, Calendar, Clock } from "lucide-react"
import Link from "next/link"

export default function DoctorDashboard() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loadingAuth, setLoadingAuth] = useState(true)
  const [consultationPatient, setConsultationPatient] = useState<any>(null)
  const [stats, setStats] = useState({
    todaysVisits: 12,
    emergencyQueue: 3,
    totalPatients: 247
  })

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    
    if (!storedUser) {
      router.push('/login')
      return
    }

    try {
      const user = JSON.parse(storedUser)
      if (user.role !== 'doctor') {
        router.push('/login')
        return
      }
      setCurrentUser(user)
    } catch (error) {
      localStorage.removeItem('user')
      router.push('/login')
      return
    }
    
    setLoadingAuth(false)
  }, [router])

  const logout = () => {
    localStorage.removeItem('user')
    sessionStorage.removeItem('clinix-auth-doctor')
    router.push('/login')
  }

  const handleOpenConsultation = (patient: any) => {
    console.log('🏥 Doctor page - handleOpenConsultation called!')
    console.log('🏥 Patient data received:', patient)
    console.log('🏥 Setting consultationPatient state...')
    setConsultationPatient(patient)
    console.log('🏥 consultationPatient state updated')
  }

  const handleCloseConsultation = () => {
    setConsultationPatient(null)
  }

  const handleCompleteConsultation = (visitId: string) => {
    // This will be handled by the consultation interface
    setConsultationPatient(null)
  }

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <Header />
      
      <main className="container mx-auto px-4 py-6 max-w-7xl">
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
                <Stethoscope className="h-8 w-8 text-blue-600" />
                Doctor Dashboard
              </h1>
              <p className="text-gray-600 mt-1">OPD Queue & Consultation Management</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
              <Activity className="h-3 w-3 mr-1" />
              Dr. {currentUser.first_name} {currentUser.last_name}
            </Badge>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={logout}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        <Tabs defaultValue="queue" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="queue" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              My OPD Queue
            </TabsTrigger>
            <TabsTrigger value="assigned" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Assigned Patients
            </TabsTrigger>
            <TabsTrigger value="management" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Patient Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="queue">
            <DoctorQueueDashboard 
              doctorId={currentUser?.id} 
              doctorName={`${currentUser?.first_name} ${currentUser?.last_name}`}
              onOpenConsultation={handleOpenConsultation}
            />
          </TabsContent>

          <TabsContent value="assigned">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  My Assigned Patients
                </CardTitle>
                <CardDescription>
                  View and manage patients assigned to you today
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DoctorAssignedPatients doctorId={currentUser?.id} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="management">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Patient Management System
                </CardTitle>
                <CardDescription>
                  Search, register, and manage patient records with full medical history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PatientManagement />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Consultation Interface Modal */}
      {consultationPatient && (
        <div>
          <PatientConsultationInterface
            patient={consultationPatient}
            doctorId={currentUser?.id}
            doctorName={`${currentUser?.first_name} ${currentUser?.last_name}`}
            onClose={handleCloseConsultation}
            onCompleteConsultation={handleCompleteConsultation}
          />
        </div>
      )}

      <Footer />
    </div>
  )
}
