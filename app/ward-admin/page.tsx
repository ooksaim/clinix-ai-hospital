"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building, Users, Bed, Bell, CheckCircle, Clock, AlertTriangle, LogOut, ArrowLeft, RefreshCw } from "lucide-react"
import Link from "next/link"

interface AdmissionRequest {
  id: string
  admission_number: string
  patient: {
    first_name: string
    last_name: string
    patient_number: string
  }
  requesting_doctor: {
    first_name: string
    last_name: string
  }
  admission_reason: string
  admission_type: string
  ward: {
    name: string
    ward_type: string
  }
  admission_status: string
  created_at: string
}

interface WardInfo {
  id: string
  name: string
  ward_type: string
  total_beds: number
  available_beds: number
  occupied_beds: number
}

export default function WardAdminDashboard() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loadingAuth, setLoadingAuth] = useState(true)
  const [admissionRequests, setAdmissionRequests] = useState<AdmissionRequest[]>([])
  const [wardInfo, setWardInfo] = useState<WardInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    pendingRequests: 0,
    availableBeds: 0,
    totalBeds: 0,
    occupancyRate: 0
  })

  // Check authentication and role
  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    
    if (!storedUser) {
      router.push('/login')
      return
    }

    try {
      const user = JSON.parse(storedUser)
      if (user.role !== 'ward_admin') {
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

  const fetchAdmissionRequests = async (retryCount = 0) => {
    try {
      console.log('🏥 Fetching admission requests, attempt:', retryCount + 1)
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
      
      const response = await fetch('/api/admissions/requests', {
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      if (result.success) {
        console.log('✅ Successfully fetched admission requests:', result.data.requests.length)
        setAdmissionRequests(result.data.requests)
        setWardInfo(result.data.wards)
        
        // Calculate stats
        const pending = result.data.requests.filter((r: AdmissionRequest) => 
          r.admission_status === 'active'
        ).length
        
        const totalBeds = result.data.wards.reduce((sum: number, ward: WardInfo) => sum + ward.total_beds, 0)
        const availableBeds = result.data.wards.reduce((sum: number, ward: WardInfo) => sum + ward.available_beds, 0)
        const occupancyRate = totalBeds > 0 ? Math.round(((totalBeds - availableBeds) / totalBeds) * 100) : 0
        
        setStats({
          pendingRequests: pending,
          availableBeds,
          totalBeds,
          occupancyRate
        })
      } else {
        throw new Error(result.error || 'Failed to fetch admission requests')
      }
    } catch (error) {
      console.error('❌ Error fetching admission requests:', error)
      
      // Retry logic for production stability
      if (retryCount < 3 && (
        error instanceof Error && (
          error.message.includes('abort') ||
          error.message.includes('fetch') ||
          error.message.includes('network') ||
          error.message.includes('timeout')
        )
      )) {
        console.log(`🔄 Retrying in ${(retryCount + 1) * 2} seconds...`)
        setTimeout(() => {
          fetchAdmissionRequests(retryCount + 1)
        }, (retryCount + 1) * 2000)
      } else {
        // Show user-friendly error after all retries failed
        if (retryCount >= 3) {
          alert('Unable to load admission requests. Please check your connection and refresh the page.')
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const approveAdmission = async (admissionId: string) => {
    try {
      console.log('🏥 Approving admission:', admissionId)
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout for approval
      
      const response = await fetch(`/api/admissions/${admissionId}/approve`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify({ approved_by: currentUser.id }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Admission approved successfully:', result)
        alert('Admission approved successfully!')
        
        // Immediate refresh to show updated status
        await fetchAdmissionRequests()
      } else {
        const error = await response.json()
        console.error('❌ Approval failed:', error)
        alert('Failed to approve admission: ' + error.error)
      }
    } catch (error) {
      alert('Error approving admission: ' + (error as Error).message)
    }
  }

  const logout = () => {
    localStorage.removeItem('user')
    router.push('/login')
  }

  useEffect(() => {
    if (!loadingAuth && currentUser) {
      fetchAdmissionRequests()
      
      // FASTER: Auto-refresh every 3 seconds for real-time admission updates
      const interval = setInterval(fetchAdmissionRequests, 3000)
      return () => clearInterval(interval)
    }
  }, [loadingAuth, currentUser])

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

  const getUrgencyBadge = (admissionType: string) => {
    switch (admissionType) {
      case 'emergency':
        return <Badge className="bg-red-500 text-white">🔴 Emergency</Badge>
      case 'elective':
        return <Badge className="bg-green-500 text-white">� Elective</Badge>
      case 'transfer':
        return <Badge className="bg-orange-500 text-white">� Transfer</Badge>
      default:
        return <Badge variant="outline">{admissionType}</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_ward':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-300">Pending Assignment</Badge>
      case 'active':
        return <Badge variant="outline" className="text-blue-600 border-blue-300">Active</Badge>
      case 'approved':
        return <Badge variant="outline" className="text-green-600 border-green-300">Approved</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
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
                <Building className="h-8 w-8 text-blue-600" />
                Ward Administration
              </h1>
              <p className="text-gray-600 mt-1">Manage admissions and ward capacity</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
              <Building className="h-3 w-3 mr-1" />
              {currentUser.first_name} {currentUser.last_name}
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.pendingRequests}</div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Beds</CardTitle>
              <Bed className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.availableBeds}</div>
              <p className="text-xs text-muted-foreground">Out of {stats.totalBeds} total</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.occupancyRate}%</div>
              <p className="text-xs text-muted-foreground">Current occupancy</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Wards</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{wardInfo.length}</div>
              <p className="text-xs text-muted-foregreen">Active wards</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="requests" className="w-full">
          <TabsList className="grid grid-cols-2 w-full max-w-md">
            <TabsTrigger value="requests">Admission Requests</TabsTrigger>
            <TabsTrigger value="wards">Ward Status</TabsTrigger>
          </TabsList>

          {/* Admission Requests Tab */}
          <TabsContent value="requests" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-orange-600" />
                    <CardTitle>Pending Admission Requests</CardTitle>
                  </div>
                  <Button 
                    onClick={() => fetchAdmissionRequests()} 
                    variant="outline" 
                    size="sm"
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    Refresh
                  </Button>
                </div>
                <CardDescription>
                  Review and approve patient admissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading requests...</p>
                  </div>
                ) : admissionRequests.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No pending admission requests
                  </div>
                ) : (
                  <div className="space-y-4">
                    {admissionRequests.map((request) => (
                      <div key={request.id} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">
                              {request.patient.first_name} {request.patient.last_name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Patient ID: {request.patient.patient_number} | 
                              Admission #: {request.admission_number}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {getUrgencyBadge(request.admission_type)}
                            {getStatusBadge(request.admission_status)}
                          </div>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-4 text-sm mb-4">
                          <div>
                            <span className="font-semibold">Requesting Doctor: </span>
                            Dr. {request.requesting_doctor.first_name} {request.requesting_doctor.last_name}
                          </div>
                          <div>
                            <span className="font-semibold">Requested: </span>
                            {new Date(request.created_at).toLocaleString()}
                          </div>
                          <div>
                            <span className="font-semibold">Ward: </span>
                            {request.ward.name} ({request.ward.ward_type})
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <span className="font-semibold">Admission Reason: </span>
                          <p className="text-gray-700">{request.admission_reason}</p>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            onClick={() => approveAdmission(request.id)}
                            className="bg-green-600 hover:bg-green-700"
                            size="sm"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve Admission
                          </Button>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ward Status Tab */}
          <TabsContent value="wards" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bed className="h-5 w-5 text-blue-600" />
                  Ward Capacity Overview
                </CardTitle>
                <CardDescription>
                  Current bed availability across all wards
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {wardInfo.map((ward) => (
                    <div key={ward.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{ward.name}</h3>
                        <Badge variant="outline">{ward.ward_type}</Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Total Beds:</span>
                          <span className="font-medium">{ward.total_beds}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Available:</span>
                          <span className="font-medium text-green-600">{ward.available_beds}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Occupied:</span>
                          <span className="font-medium text-blue-600">{ward.occupied_beds}</span>
                        </div>
                        
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ 
                              width: `${ward.total_beds > 0 ? (ward.occupied_beds / ward.total_beds) * 100 : 0}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
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