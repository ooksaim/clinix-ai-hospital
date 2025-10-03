"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Bed, Users, Package, AlertTriangle, CheckCircle, Clock, Plus, Minus, ArrowLeft, LogOut, User, Stethoscope, RefreshCw, Edit, Filter } from 'lucide-react'
import Link from "next/link"
import { PatientInfoModal } from '@/components/patient-info-modal'
import { LoadingIndicator } from '@/components/loading-indicator'
import { signOut } from '@/lib/auth'

interface AdmissionRequest {
  id: string
  admission_number: string
  patient: {
    first_name: string
    last_name: string
    patient_number: string
    age?: number
    gender?: string
  }
  requesting_doctor: {
    first_name: string
    last_name: string
  }
  admission_reason: string
  admission_type: string
  ward: {
    id: string
    name: string
    ward_type: string
  }
  admission_status: string
  created_at: string
}

interface Bed {
  id: string
  bed_number: string
  bed_type: string
  bed_status: 'available' | 'occupied' | 'maintenance'
  patient_id?: string
  patient_name?: string
}

interface WardInfo {
  id: string
  name: string
  ward_type: string
  total_beds: number
  available_beds: number
  occupied_beds: number
  beds: Bed[]
}

interface SupplyItem {
  id: string
  item_name: string
  category: string
  current_stock: number
  minimum_threshold: number
  unit: string
  last_updated: string
}

interface SupplyRequest {
  id: string
  item_name: string
  requested_quantity: number
  status: 'pending' | 'approved' | 'delivered'
  requested_by: string
  requested_at: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
}

export default function WardAdminPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loadingAuth, setLoadingAuth] = useState(true)
  const [admissionRequests, setAdmissionRequests] = useState<AdmissionRequest[]>([])
  const [wardInfo, setWardInfo] = useState<WardInfo[]>([])
  const [supplies, setSupplies] = useState<SupplyItem[]>([])
  const [supplyRequests, setSupplyRequests] = useState<SupplyRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<AdmissionRequest | null>(null)
  const [selectedBed, setSelectedBed] = useState<string>('')
  const [showBedAssignDialog, setShowBedAssignDialog] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null)
  const [availableDoctors, setAvailableDoctors] = useState<any[]>([])
  const [loadingAvailableDoctors, setLoadingAvailableDoctors] = useState<boolean>(false)
  const [showSupplyRequestDialog, setShowSupplyRequestDialog] = useState(false)
  const [selectedSupplyItem, setSelectedSupplyItem] = useState<any>(null)
  const [requestQuantity, setRequestQuantity] = useState<number>(1)
  const [requestUrgency, setRequestUrgency] = useState<string>('medium')
  const [stats, setStats] = useState({
    pendingRequests: 0,
    availableBeds: 0,
    totalBeds: 0,
    occupancyRate: 0,
    lowStockItems: 0,
    pendingSupplyRequests: 0
  })
  // Ward doctors for Staff Assignment tab (fetch on tab activation)
  const [wardDoctors, setWardDoctors] = useState<any[]>([])
  const [loadingDoctors, setLoadingDoctors] = useState<boolean>(false)
  const [doctorPatients, setDoctorPatients] = useState<Record<string, any[]>>({})  
  const [activeTab, setActiveTab] = useState<string>('admissions')
  const [supplyStatusFilter, setSupplyStatusFilter] = useState<'all' | 'pending' | 'approved' | 'delivered'>('all')
  const [bedSearchQuery, setBedSearchQuery] = useState<string>('')  // Fetch ward doctors function (call when Staff tab is active)
  const fetchWardDoctors = async () => {
    setLoadingDoctors(true)
    try {
      console.log('[WardAdminPage] Fetching /api/users for ward doctors')
      const res = await fetch('/api/users')
      const data = await res.json()
      console.log('[WardAdminPage] /api/users response:', data)
      if (data && data.success) {
        const docs = (data.users || []).filter((u: any) => u.role === 'doctor' && (u.doctor_type === 'ward' || u.doctor_type === 'both'))
        console.log('[WardAdminPage] filtered ward doctors:', docs)
        setWardDoctors(docs)
        // After loading doctors, fetch assigned admissions for these doctors
        try {
          const ids = docs.map((d: any) => d.id).filter(Boolean)
          if (ids.length > 0) {
            const params = new URLSearchParams({ doctor_ids: ids.join(',') })
            console.log('[WardAdminPage] fetching assigned admissions for doctors', ids)
            const r = await fetch(`/api/admissions/assigned?${params.toString()}`)
            const ad = await r.json()
            console.log('[WardAdminPage] admissions API response:', ad)
            if (ad && ad.success) {
              const byDoctor = ad.data?.byDoctor || {}
              const map: Record<string, any[]> = {}
              for (const id of ids) {
                const admissions = byDoctor[id] || []
                map[id] = (admissions || []).map((a: any) => ({
                  admissionId: a.admissionId,
                  bedId: a.bedId,
                  patientName: a.patient ? `${a.patient.first_name} ${a.patient.last_name}` : `#${a.patientId}`,
                  patientNumber: a.patient ? a.patient.patient_number : 'Unknown',
                  source: 'admission'
                }))
              }
              setDoctorPatients(map)
            } else {
              setDoctorPatients({})
            }
          } else {
            setDoctorPatients({})
          }
        } catch (err) {
          console.error('[WardAdminPage] Error fetching assigned admissions for doctors:', err)
          setDoctorPatients({})
        }
      } else {
        setWardDoctors([])
      }
    } catch (err) {
      console.error('[WardAdminPage] Error fetching users:', err)
      setWardDoctors([])
    } finally {
      setLoadingDoctors(false)
    }
  }

  // Fetch assigned patients for a single doctor with visits fallback
  const fetchAssignedPatientsForDoctor = async (doctorId: string) => {
    try {
      const params = new URLSearchParams({ doctor_id: doctorId })
      const res = await fetch(`/api/admissions/assigned?${params.toString()}`)
      const data = await res.json()
      let patients: any[] = []
      if (data && data.success) {
        const admissions = data.data?.byDoctor?.[doctorId] || []
        patients = admissions.map((a: any) => ({
          admissionId: a.admissionId,
          patientId: a.patientId,
          patientName: a.patient ? `${a.patient.first_name} ${a.patient.last_name}` : `#${a.patientId}`,
          patientNumber: a.patient ? a.patient.patient_number : 'Unknown',
          admissionReason: a.admission_reason || 'General care',
          admissionStatus: a.admission_status || 'active',
          source: 'admission'
        }))
      }

      // Fallback to visits if no admissions found
      if (patients.length === 0) {
        try {
          const vres = await fetch(`/api/patients/assigned?${params.toString()}`)
          const vdata = await vres.json()
          if (vdata && vdata.success) {
            const active = vdata.data?.activePatients || []
            patients = active.map((p: any) => ({
              admissionId: p.visitId || null,
              patientId: p.patientId,
              patientName: p.patientName,
              patientNumber: p.patientNumber,
              admissionReason: 'Outpatient visit',
              admissionStatus: 'active',
              source: 'visit'
            }))
          }
        } catch (verr) {
          console.error('[WardAdminPage] visits fallback failed for', doctorId, verr)
        }
      }

      setDoctorPatients(prev => ({ ...prev, [doctorId]: patients }))
    } catch (err) {
      console.error('[WardAdminPage] Error fetching assigned admissions for', doctorId, err)
      setDoctorPatients(prev => ({ ...prev, [doctorId]: [] }))
    }
  }

  // Fetch patient details by admission ID for the modal
  // Fetch patient details by bed ID if available, else by admission ID
  const fetchPatientDetailsByAdmission = async (admissionId: string) => {
    try {
      setLoadingPatientDetails(true)
      setShowPatientInfoModal(true)
      // Find the bedId for this admissionId from all admissions in doctorPatients
      let bedId: string | undefined = undefined;
      for (const doctorId in doctorPatients) {
        const patient = doctorPatients[doctorId].find((p) => p.admissionId === admissionId);
        if (patient && patient.bedId) {
          bedId = patient.bedId;
          break;
        }
      }
      // If not found in doctorPatients, try to fetch admission details to get bedId
      if (!bedId) {
        const admissionRes = await fetch(`/api/admissions/${admissionId}`);
        if (admissionRes.ok) {
          const admissionData = await admissionRes.json();
          bedId = admissionData?.bed_id;
        }
      }
      let response;
      if (bedId) {
        response = await fetch(`/api/ward-admin/patient-details?bed_id=${encodeURIComponent(bedId)}`);
      } else {
        response = await fetch(`/api/ward-admin/patient-details?admission_id=${admissionId}`);
      }
      if (!response.ok) throw new Error('Failed to fetch patient details');
      const data = await response.json();
      if (data.success) {
        setSelectedPatientDetails(data.data);
      } else {
        setSelectedPatientDetails(null);
      }
    } catch (error) {
      setSelectedPatientDetails(null);
    } finally {
      setLoadingPatientDetails(false);
    }
  }

  useEffect(() => {
    if (activeTab === 'staff') {
      // avoid starting a new fetch if one is already in progress
      if (!loadingDoctors) fetchWardDoctors()
    }
  }, [activeTab])
  
  // Patient info modal states
  const [showPatientInfoModal, setShowPatientInfoModal] = useState(false)
  const [selectedPatientDetails, setSelectedPatientDetails] = useState<any>(null)
  const [loadingPatientDetails, setLoadingPatientDetails] = useState(false)

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

  // Logout handler
  const handleLogout = async () => {
    try {
      // Try to sign out via Supabase helper, ignore errors and always clear client state
      await signOut().catch(() => {})
    } catch (err) {
      // ignore
    }
    // Clear local client auth and redirect to login
    try { localStorage.removeItem('user') } catch {}
    router.push('/login')
  }

  // Fetch admission requests
  const fetchAdmissionRequests = async () => {
    try {
      const response = await fetch('/api/admissions/requests')
      if (!response.ok) throw new Error('Failed to fetch admission requests')
      
      const data = await response.json()
      console.log('🔍 Raw admission requests data:', data) // Debug log
      
      // Fix: The API returns data.data.requests, not data.requests
      const requests = data.data?.requests || data.requests || []
      setAdmissionRequests(requests)
      
  // Update stats: count both 'pending' and 'active' statuses so dashboard reflects both
  const pending = requests.filter((req: AdmissionRequest) => ['pending', 'active'].includes(req.admission_status)).length || 0
  setStats(prev => ({ ...prev, pendingRequests: pending }))
      
      console.log(`📊 Found ${requests.length} admission requests, ${pending} pending`) // Debug log
    } catch (error) {
      console.error('Error fetching admission requests:', error)
    }
  }

  // Fetch ward information with beds
  const fetchWardInfo = async () => {
    try {
      const response = await fetch('/api/ward-admin/beds')
      if (!response.ok) throw new Error('Failed to fetch ward info')
      
      const data = await response.json()
      console.log('🔍 Raw ward data:', data) // Debug log
      
      setWardInfo(data.wards || [])
      
      // Calculate stats
      const totalBeds = data.wards?.reduce((sum: number, ward: WardInfo) => sum + ward.total_beds, 0) || 0
      const availableBeds = data.wards?.reduce((sum: number, ward: WardInfo) => sum + ward.available_beds, 0) || 0
      const occupancyRate = totalBeds > 0 ? Math.round(((totalBeds - availableBeds) / totalBeds) * 100) : 0
      
      console.log(`🏥 Ward stats: ${data.wards?.length || 0} wards, ${totalBeds} total beds, ${availableBeds} available`) // Debug log
      
      setStats(prev => ({
        ...prev,
        totalBeds,
        availableBeds,
        occupancyRate
      }))
    } catch (error) {
      console.error('Error fetching ward info:', error)
    }
  }

  // Fetch supplies
  const fetchSupplies = async () => {
    try {
      const response = await fetch('/api/ward-admin/supplies')
      if (!response.ok) throw new Error('Failed to fetch supplies')
      
      const data = await response.json()
      console.log('🔍 Raw supplies data:', data) // Debug log
      
      setSupplies(data.supplies || [])
      
      // Count low stock items
      const lowStock = data.supplies?.filter((item: SupplyItem) => 
        item.current_stock <= item.minimum_threshold
      ).length || 0
      
      setStats(prev => ({ ...prev, lowStockItems: lowStock }))
      
      console.log(`📦 Found ${data.supplies?.length || 0} supply items, ${lowStock} low stock`) // Debug log
    } catch (error) {
      console.error('Error fetching supplies:', error)
    }
  }

  // Fetch supply requests
  const fetchSupplyRequests = async () => {
    try {
      const response = await fetch('/api/ward-admin/supply-requests')
      if (!response.ok) throw new Error('Failed to fetch supply requests')
      
      const data = await response.json()
      console.log('🔍 Raw supply requests data:', data) // Debug log
      
      setSupplyRequests(data.requests || [])
      
      // Count pending requests
      const pending = data.requests?.filter((req: SupplyRequest) => req.status === 'pending').length || 0
      setStats(prev => ({ ...prev, pendingSupplyRequests: pending }))
      
      console.log(`📦 Found ${data.requests?.length || 0} supply requests, ${pending} pending`) // Debug log
    } catch (error) {
      console.error('Error fetching supply requests:', error)
    }
  }

  // Filter beds based on search query
  const filterBedsBySearch = (ward: WardInfo) => {
    if (!bedSearchQuery.trim()) {
      return ward.beds
    }
    
    const query = bedSearchQuery.toLowerCase().trim()
    return ward.beds.filter(bed => {
      // Search by patient name if bed is occupied
      if (bed.bed_status === 'occupied' && bed.patient_name) {
        return bed.patient_name.toLowerCase().includes(query)
      }
      // Search by bed number
      if (bed.bed_number.toLowerCase().includes(query)) {
        return true
      }
      // Search by bed type
      if (bed.bed_type.toLowerCase().includes(query)) {
        return true
      }
      return false
    })
  }

  // Load all data
  useEffect(() => {
    if (!loadingAuth && currentUser) {
      Promise.all([
        fetchAdmissionRequests(),
        fetchWardInfo(),
        fetchSupplies(),
        fetchSupplyRequests()
      ]).finally(() => setLoading(false))
    }
  }, [loadingAuth, currentUser])

  // Approve admission with bed assignment
  const handleApproveAdmission = async () => {
    if (!selectedRequest || !selectedBed) return

    try {
      const payload: any = {
        bed_id: selectedBed,
        approved_by: currentUser.id
      }
      if (selectedDoctor) payload.assigned_doctor_id = selectedDoctor

      const response = await fetch(`/api/admissions/${selectedRequest.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) throw new Error('Failed to approve admission')

      // Refresh data
      await Promise.all([fetchAdmissionRequests(), fetchWardInfo()])
      
      // Reset dialog
      setSelectedRequest(null)
      setSelectedBed('')
      setSelectedDoctor(null)
      setShowBedAssignDialog(false)
    } catch (error) {
      console.error('Error approving admission:', error)
    }
  }

  // Update supply stock
  const updateSupplyStock = async (itemId: string, change: number) => {
    try {
      const response = await fetch(`/api/ward-admin/supplies/${itemId}/update-stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ change })
      })

      if (!response.ok) throw new Error('Failed to update stock')
      
      // Refresh supplies
      await fetchSupplies()
    } catch (error) {
      console.error('Error updating stock:', error)
    }
  }

  // Request supply - open dialog
  const requestSupply = async (item: any) => {
    setSelectedSupplyItem(item)
    setRequestQuantity(1)
    setRequestUrgency('medium')
    setShowSupplyRequestDialog(true)
  }

  // Submit supply request
  const submitSupplyRequest = async () => {
    try {
      // For now, using placeholder values for required fields
      // In a real app, these would come from user context/session
      const ward_id = 'c14a8dc4-099c-431c-be1d-f8d8f32988de' // Example ward ID - should be dynamic
      const requested_by = 'ee29522f-483e-46d7-9a0b-2087e15cef95' // Example user ID - should be from auth
      
      const response = await fetch('/api/ward-admin/supply-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ward_id,
          supply_id: selectedSupplyItem.id,
          requested_by,
          quantity_requested: requestQuantity,
          urgency: requestUrgency,
          request_reason: `Stock request for ${selectedSupplyItem.item_name}`,
          notes: `Requested ${requestQuantity} units. Current stock: ${selectedSupplyItem.current_stock}, Minimum threshold: ${selectedSupplyItem.minimum_threshold}`
        })
      })

      if (!response.ok) throw new Error('Failed to create supply request')
      
      // Close dialog and refresh supply requests
      setShowSupplyRequestDialog(false)
      await fetchSupplyRequests()
      
      // Show success message
      console.log(`✅ Supply request created for ${selectedSupplyItem.item_name} - Quantity: ${requestQuantity}, Urgency: ${requestUrgency}`)
    } catch (error) {
      console.error('Error creating supply request:', error)
    }
  }

  // Fetch patient details for occupied bed
  const fetchPatientDetails = async (bedId: string) => {
    try {
      setLoadingPatientDetails(true)
      setShowPatientInfoModal(true)
      
      const response = await fetch(`/api/ward-admin/patient-details?bed_id=${bedId}`)
      if (!response.ok) throw new Error('Failed to fetch patient details')
      
      const data = await response.json()
      if (data.success) {
        setSelectedPatientDetails(data.data)
      } else {
        console.error('Error fetching patient details:', data.error)
        setSelectedPatientDetails(null)
      }
    } catch (error) {
      console.error('Error fetching patient details:', error)
      setSelectedPatientDetails(null)
    } finally {
      setLoadingPatientDetails(false)
    }
  }

  // Get available beds for a ward
  const getAvailableBedsForWard = (wardId: string) => {
    console.log(`🔍 Looking for beds in ward: ${wardId}`) // Debug log
    console.log(`🔍 All ward info:`, wardInfo) // Debug log
    
    const ward = wardInfo.find(w => w.id === wardId)
    console.log(`🔍 Found ward:`, ward) // Debug log
    
    const availableBeds = ward?.beds.filter(bed => bed.bed_status === 'available') || []
    console.log(`🔍 Available beds for ward ${wardId}:`, availableBeds) // Debug log
    
    return availableBeds
  }

  if (loadingAuth || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading Ward Admin Dashboard...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Ward Administration Dashboard</h1>
            <p className="text-gray-600">Manage admissions, beds, supplies, and staff assignments</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => { fetchAdmissionRequests(); fetchWardInfo(); fetchSupplies(); fetchSupplyRequests(); }}>
              Refresh
            </Button>
            <Button variant="outline" onClick={handleLogout} className="text-red-600 hover:text-red-700 hover:bg-red-50">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Admissions</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingRequests}</div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Beds</CardTitle>
              <Bed className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.availableBeds}</div>
              <p className="text-xs text-muted-foreground">{stats.occupancyRate}% occupancy</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.lowStockItems}</div>
              <p className="text-xs text-muted-foreground">Need restocking</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Supply Requests</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingSupplyRequests}</div>
              <p className="text-xs text-muted-foreground">Pending approval</p>
            </CardContent>
          </Card>
        </div>

  {/* Main Tabs */}
  <Tabs defaultValue="admissions" onValueChange={(v) => setActiveTab(v)} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="admissions">Admission Requests</TabsTrigger>
            <TabsTrigger value="beds">Bed Management</TabsTrigger>
            <TabsTrigger value="supplies">Supply Management</TabsTrigger>
            <TabsTrigger value="staff">Staff Assignment</TabsTrigger>
          </TabsList>

          {/* Admission Requests Tab */}
          <TabsContent value="admissions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pending Admission Requests</CardTitle>
                <CardDescription>Review and approve patient admissions with bed assignments</CardDescription>
              </CardHeader>
              <CardContent>
                {admissionRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No pending admission requests</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {admissionRequests.map((request) => (
                      <div key={request.id} className="border rounded-lg p-4 bg-white">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">
                                {request.patient.first_name} {request.patient.last_name}
                              </h3>
                              <Badge variant="outline">{request.patient.patient_number}</Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                              <strong>Doctor:</strong> Dr. {request.requesting_doctor.first_name} {request.requesting_doctor.last_name}
                            </p>
                            <p className="text-sm text-gray-600">
                              <strong>Ward:</strong> {request.ward.name} ({request.ward.ward_type})
                            </p>
                            <p className="text-sm text-gray-600">
                              <strong>Reason:</strong> {request.admission_reason}
                            </p>
                            <p className="text-sm text-gray-600">
                              <strong>Type:</strong> {request.admission_type}
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Badge className="mb-2">
                              {request.admission_status}
                            </Badge>
                            <Button
                              onClick={() => {
                                setSelectedRequest(request)
                                setShowBedAssignDialog(true)
                              }}
                              className="w-full"
                            >
                              Approve & Assign Bed
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bed Management Tab */}
          <TabsContent value="beds" className="space-y-6">
            {/* Search Bar */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bed className="h-5 w-5" />
                  Bed Management
                </CardTitle>
                <CardDescription>Search and manage ward beds and patients</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label htmlFor="bed-search">Search by Patient Name, Bed Number, or Bed Type</Label>
                    <Input
                      id="bed-search"
                      type="text"
                      placeholder="Search for patient, bed number (e.g., B-101), or bed type (e.g., ICU)..."
                      value={bedSearchQuery}
                      onChange={(e) => setBedSearchQuery(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  {bedSearchQuery && (
                    <Button 
                      variant="outline" 
                      onClick={() => setBedSearchQuery('')}
                      className="mt-6"
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <div className="grid gap-6">
              {wardInfo.map((ward) => {
                const filteredBeds = filterBedsBySearch(ward)
                
                // If search is active and no beds match, don't show the ward
                if (bedSearchQuery && filteredBeds.length === 0) {
                  return null
                }
                
                return (
                  <Card key={ward.id}>
                    <CardHeader>
                      <CardTitle className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          {ward.name} - {ward.ward_type}
                          {bedSearchQuery && filteredBeds.length !== ward.beds.length && (
                            <Badge variant="secondary">
                              {filteredBeds.length} of {ward.beds.length} beds shown
                            </Badge>
                          )}
                        </div>
                        <Badge variant="outline">
                          {ward.available_beds}/{ward.total_beds} Available
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {filteredBeds.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          No beds match your search criteria
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                          {filteredBeds.map((bed) => (
                            <div
                              key={bed.id}
                              className={`p-3 rounded-lg border-2 text-center transition-all duration-200 ${
                                bed.bed_status === 'available'
                                  ? 'border-green-300 bg-green-50'
                                  : bed.bed_status === 'occupied'
                                  ? 'border-red-300 bg-red-50 cursor-pointer hover:bg-red-100 hover:border-red-400'
                                  : 'border-yellow-300 bg-yellow-50'
                              }`}
                              onClick={() => {
                                if (bed.bed_status === 'occupied') {
                                  fetchPatientDetails(bed.id)
                                }
                              }}
                              title={bed.bed_status === 'occupied' ? 'Click to view patient details' : ''}
                            >
                              <div className="font-semibold">{bed.bed_number}</div>
                              <div className="text-xs text-gray-600">{bed.bed_type}</div>
                              <div className={`text-xs mt-1 ${
                                bed.bed_status === 'available'
                                  ? 'text-green-600'
                                  : bed.bed_status === 'occupied'
                                  ? 'text-red-600'
                                  : 'text-yellow-600'
                              }`}>
                                {bed.bed_status}
                                {bed.bed_status === 'occupied' && bed.patient_name && (
                                  <div className="font-bold text-red-700 text-xs mt-1">{bed.patient_name}</div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          {/* Supply Management Tab */}
          <TabsContent value="supplies" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Supply Inventory</CardTitle>
                <CardDescription>Monitor and manage ward supplies</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Current Stock</TableHead>
                      <TableHead>Min Threshold</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {supplies.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.item_name}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>{item.current_stock} {item.unit}</TableCell>
                        <TableCell>{item.minimum_threshold} {item.unit}</TableCell>
                        <TableCell>
                          <Badge
                            variant={item.current_stock <= item.minimum_threshold ? "destructive" : "default"}
                          >
                            {item.current_stock <= item.minimum_threshold ? "Low Stock" : "In Stock"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateSupplyStock(item.id, 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateSupplyStock(item.id, -1)}
                              disabled={item.current_stock <= 0}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => requestSupply(item)}
                            >
                              Request
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Supply Requests
                    </CardTitle>
                    <CardDescription>Monitor and track supply requests from staff</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <Select value={supplyStatusFilter} onValueChange={(value) => setSupplyStatusFilter(value as any)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All ({supplyRequests.length})</SelectItem>
                        <SelectItem value="pending">Pending ({supplyRequests.filter(r => r.status === 'pending').length})</SelectItem>
                        <SelectItem value="approved">Approved ({supplyRequests.filter(r => r.status === 'approved').length})</SelectItem>
                        <SelectItem value="delivered">Delivered ({supplyRequests.filter(r => r.status === 'delivered').length})</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {supplyRequests.filter(request => 
                  supplyStatusFilter === 'all' || request.status === supplyStatusFilter
                ).length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {supplyStatusFilter === 'all' ? 'No supply requests' : `No ${supplyStatusFilter} requests`}
                    </h3>
                    <p className="text-gray-600">
                      {supplyStatusFilter === 'all' 
                        ? 'Supply requests will appear here when staff make requests'
                        : `No requests with ${supplyStatusFilter} status found`
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {supplyRequests.filter(request => 
                      supplyStatusFilter === 'all' || request.status === supplyStatusFilter
                    ).map((request) => {
                      const isApproved = request.status === 'approved'
                      const isDelivered = request.status === 'delivered'
                      const isPending = request.status === 'pending'
                      
                      return (
                        <div 
                          key={request.id} 
                          className={`rounded-lg border p-4 transition-all hover:shadow-md ${
                            isApproved ? 'bg-green-50 border-green-200' :
                            isDelivered ? 'bg-blue-50 border-blue-200' :
                            isPending ? 'bg-orange-50 border-orange-200' :
                            'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold text-gray-900">{request.item_name}</h3>
                                <Badge 
                                  variant={
                                    isApproved ? 'default' :
                                    isDelivered ? 'secondary' :
                                    isPending ? 'destructive' :
                                    'outline'
                                  }
                                  className={`${
                                    isApproved ? 'bg-green-100 text-green-800 border-green-300' :
                                    isDelivered ? 'bg-blue-100 text-blue-800 border-blue-300' :
                                    isPending ? 'bg-orange-100 text-orange-800 border-orange-300' :
                                    ''
                                  }`}
                                >
                                  {isApproved ? '✅ Approved' :
                                   isDelivered ? '📦 Delivered' :
                                   isPending ? '⏳ Pending' :
                                   request.status.charAt(0).toUpperCase() + request.status.slice(1)
                                  }
                                </Badge>
                                <Badge 
                                  variant={
                                    request.priority === 'urgent' ? 'destructive' :
                                    request.priority === 'high' ? 'default' :
                                    request.priority === 'medium' ? 'secondary' :
                                    'outline'
                                  }
                                >
                                  {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                                <div>
                                  <span className="font-medium">Quantity:</span>
                                  <span className="ml-2 font-semibold">{request.requested_quantity}</span>
                                </div>
                                <div>
                                  <span className="font-medium">Requested by:</span>
                                  <span className="ml-2">{request.requested_by}</span>
                                </div>
                                <div>
                                  <span className="font-medium">Date:</span>
                                  <span className="ml-2">{new Date(request.requested_at).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              {isPending && (
                                <Clock className="h-5 w-5 text-orange-500" />
                              )}
                              {isApproved && (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              )}
                              {isDelivered && (
                                <Package className="h-5 w-5 text-blue-500" />
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Staff Assignment Tab */}
          <TabsContent value="staff" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Staff Assignments</CardTitle>
                <CardDescription>Manage staff assignments to patients and wards</CardDescription>
              </CardHeader>
                  <CardContent>
                    {loadingDoctors ? (
                      <div className="flex items-center space-x-2">
                        <LoadingIndicator isLoading={true} label="Loading staff" />
                      </div>
                    ) : wardDoctors.length === 0 ? (
                      <div className="text-muted-foreground">No ward doctors found.</div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {wardDoctors.map((d) => {
                          const patients = doctorPatients[d.id] || []
                          const initials = ((d.first_name || '').charAt(0) + (d.last_name || '').charAt(0)).toUpperCase()
                          return (
                            <Card key={d.id} className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-white to-gray-50/50">
                              <CardHeader className="pb-3">
                                <div className="flex items-start gap-4">
                                  {/* Enhanced Doctor Avatar */}
                                  <div className={`relative h-14 w-14 rounded-xl bg-gradient-to-br ${
                                    ['from-blue-400 to-blue-600', 'from-purple-400 to-purple-600', 'from-green-400 to-green-600', 'from-orange-400 to-orange-600', 'from-pink-400 to-pink-600', 'from-indigo-400 to-indigo-600', 'from-teal-400 to-teal-600', 'from-red-400 to-red-600'][(d.id?.charCodeAt(0) || 0) % 8]
                                  } flex items-center justify-center shadow-lg`}>
                                    <span className="text-white font-bold text-lg">{initials || 'DR'}</span>
                                    <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 border-2 border-white rounded-full"></div>
                                  </div>
                                  
                                  {/* Doctor Info */}
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-900 text-base mb-1 truncate">
                                      Dr. {d.first_name} {d.last_name}
                                    </h3>
                                    <div className="flex items-center gap-2 mb-1">
                                      <Stethoscope className="h-3 w-3 text-gray-400" />
                                      <span className="text-sm text-gray-600 truncate">{d.specialization || d.department || 'General Medicine'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                        d.doctor_type === 'ward' ? 'bg-blue-100 text-blue-700' :
                                        d.doctor_type === 'both' ? 'bg-purple-100 text-purple-700' :
                                        'bg-gray-100 text-gray-700'
                                      }`}>
                                        {d.doctor_type || 'General'}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Patient Count Badge */}
                                  <div className="text-right">
                                    <div className={`inline-flex items-center justify-center h-8 w-8 rounded-full font-bold text-sm ${
                                      patients.length === 0 ? 'bg-gray-100 text-gray-400' :
                                      patients.length <= 2 ? 'bg-green-100 text-green-700' :
                                      patients.length <= 4 ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-red-100 text-red-700'
                                    }`}>
                                      {patients.length}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">patients</div>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent className="pt-0">
                                {loadingDoctors ? (
                                  <div className="text-sm text-muted-foreground">Loading</div>
                                ) : (
                                  <div className="space-y-3">
                                    {patients.slice(0, 3).map((p, index) => (
                                      <div key={p.admissionId || index} 
                                           className="group/patient flex items-center p-3 rounded-lg bg-white/60 hover:bg-white hover:shadow-sm transition-all duration-200 cursor-pointer border border-gray-100"
                                           onClick={() => p.admissionId && fetchPatientDetailsByAdmission(p.admissionId)}>
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                          <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <User className="h-4 w-4 text-gray-600" />
                                          </div>
                                          <div className="min-w-0 flex-1">
                                            <div className="font-medium text-sm text-gray-900 group-hover/patient:text-blue-600 truncate">
                                              {p.patientName}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                    {patients.length === 0 && (
                                      <div className="flex items-center justify-center py-6 text-gray-400">
                                        <div className="text-center">
                                          <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                          <p className="text-sm">No assigned patients</p>
                                        </div>
                                      </div>
                                    )}
                                    {patients.length > 3 && (
                                      <div className="text-center py-2">
                                        <span className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
                                          +{patients.length - 3} more patients
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </CardContent>
                              {/* Action Footer */}
                              <div className="px-6 pb-4">
                                {/* Footer spacer kept for consistent card height and divider */}
                                <div className="pt-3 border-t border-gray-100" />
                              </div>
                            </Card>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Bed Assignment Dialog */}
        <Dialog open={showBedAssignDialog} onOpenChange={(open) => {
          setShowBedAssignDialog(open)
          // When opening the dialog, fetch available ward doctors for assignment
          if (open && selectedRequest) {
            (async () => {
              setLoadingAvailableDoctors(true)
              try {
                console.log('[WardAdminPage] Fetching available ward doctors for assignment')
                const res = await fetch('/api/users')
                const data = await res.json()
                console.log('[WardAdminPage] /api/users response (for dialog):', data)
                if (data && data.success) {
                  // Primary filter: doctors whose doctor_type indicates ward work
                  const docs = (data.users || []).filter((u: any) => u.role === 'doctor' && (u.doctor_type === 'ward' || u.doctor_type === 'both'))
                  console.log('[WardAdminPage] matched ward/both doctors:', docs)
                  if (docs.length > 0) {
                    setAvailableDoctors(docs)
                  } else {
                    // Fallback: if none explicitly marked as ward/both, show any active doctors
                    // This helps when doctor_type is missing or defaulted to 'opd' for existing users
                    const fallback = (data.users || []).filter((u: any) => u.role === 'doctor' && (u.is_active === undefined || u.is_active === true))
                    console.warn('[WardAdminPage] No explicit ward doctors; falling back to any active doctors:', fallback)
                    setAvailableDoctors(fallback)
                  }
                } else {
                  setAvailableDoctors([])
                }
              } catch (err) {
                console.error('[WardAdminPage] Error fetching available doctors:', err)
                setAvailableDoctors([])
              } finally {
                setLoadingAvailableDoctors(false)
              }
            })()
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Bed to Patient</DialogTitle>
              <DialogDescription>Assign a bed and optionally assign a doctor to the patient.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedRequest && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold">
                    {selectedRequest.patient.first_name} {selectedRequest.patient.last_name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Ward: {selectedRequest.ward.name}
                  </p>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="bed-select">Select Available Bed</Label>
                <Select value={selectedBed} onValueChange={setSelectedBed}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a bed..." />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedRequest && getAvailableBedsForWard(selectedRequest.ward.id).map((bed) => (
                      <SelectItem key={bed.id} value={bed.id}>
                        {bed.bed_number} - {bed.bed_type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="doctor-select">Assign Doctor (optional)</Label>
                {loadingAvailableDoctors ? (
                  <div className="text-sm text-muted-foreground">Loading doctors...</div>
                ) : availableDoctors.length === 0 ? (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">No ward doctors available</div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={async () => {
                        // retry fetching doctors
                        setLoadingAvailableDoctors(true)
                        try {
                          const res = await fetch('/api/users')
                          const data = await res.json()
                          console.log('[WardAdminPage] retry /api/users response:', data)
                          if (data && data.success) {
                            const docs = (data.users || []).filter((u: any) => u.role === 'doctor' && (u.doctor_type === 'ward' || u.doctor_type === 'both'))
                            if (docs.length > 0) {
                              setAvailableDoctors(docs)
                            } else {
                              const fallback = (data.users || []).filter((u: any) => u.role === 'doctor' && (u.is_active === undefined || u.is_active === true))
                              console.warn('[WardAdminPage] retry fallback to active doctors:', fallback)
                              if (fallback.length > 0) setAvailableDoctors(fallback)
                              else if (wardDoctors && wardDoctors.length > 0) {
                                console.warn('[WardAdminPage] using wardDoctors state as last-resort fallback', wardDoctors)
                                setAvailableDoctors(wardDoctors)
                              } else {
                                setAvailableDoctors([])
                              }
                            }
                          } else {
                            setAvailableDoctors([])
                          }
                        } catch (err) {
                          console.error('[WardAdminPage] retry error fetching doctors:', err)
                          setAvailableDoctors([])
                        } finally {
                          setLoadingAvailableDoctors(false)
                        }
                      }}>
                        Refresh doctors
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => {
                        // Open Staff tab so user can view/edit doctors
                        setActiveTab('staff')
                      }}>
                        View Staff
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Select value={selectedDoctor ?? '__none'} onValueChange={(v) => setSelectedDoctor(v === '__none' ? null : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a doctor (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">-- None --</SelectItem>
                      {availableDoctors.map((doc) => (
                        <SelectItem key={doc.id} value={doc.id}>{doc.first_name} {doc.last_name} - {doc.specialization || doc.department_name || ''}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowBedAssignDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleApproveAdmission}
                  disabled={!selectedBed}
                >
                  Approve & Assign
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Supply Request Dialog */}
        <Dialog open={showSupplyRequestDialog} onOpenChange={setShowSupplyRequestDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Supply Items</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {selectedSupplyItem && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold">{selectedSupplyItem.item_name}</h3>
                  <p className="text-sm text-gray-600">
                    Category: {selectedSupplyItem.supply_category}
                  </p>
                  <p className="text-sm text-gray-600">
                    Current Stock: {selectedSupplyItem.current_stock}
                  </p>
                  <p className="text-sm text-gray-600">
                    Minimum Threshold: {selectedSupplyItem.minimum_threshold}
                  </p>
                </div>
              )}
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity Requested</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={requestQuantity}
                    onChange={(e) => setRequestQuantity(parseInt(e.target.value) || 1)}
                    placeholder="Enter quantity..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="urgency">Urgency Level</Label>
                  <Select value={requestUrgency} onValueChange={setRequestUrgency}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select urgency level..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low - Can wait</SelectItem>
                      <SelectItem value="medium">Medium - Standard request</SelectItem>
                      <SelectItem value="high">High - Needed soon</SelectItem>
                      <SelectItem value="urgent">Urgent - Critical need</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowSupplyRequestDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={submitSupplyRequest}
                  disabled={!requestQuantity || requestQuantity < 1}
                >
                  Submit Request
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Patient Info Modal */}
        <PatientInfoModal
          isOpen={showPatientInfoModal}
          onClose={() => {
            setShowPatientInfoModal(false)
            setSelectedPatientDetails(null)
          }}
          patientDetails={selectedPatientDetails}
          loading={loadingPatientDetails}
        />
      </main>

      <Footer />
    </div>
  )
}