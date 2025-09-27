'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { 
  Clock, 
  User, 
  Bed, 
  Check, 
  X, 
  AlertCircle,
  Users,
  Building,
  Activity,
  Plus,
  Edit,
  Trash2,
  Stethoscope,
  Calendar,
  Phone,
  Loader2,
  RefreshCw
} from 'lucide-react'

interface Patient {
  first_name: string
  last_name: string
  patient_number: string
}

interface Ward {
  name: string
  ward_type: string
}

interface Doctor {
  first_name: string
  last_name: string
}

interface AdmissionRequest {
  id: string
  admission_number: string
  admission_reason: string
  admission_type: string
  admission_status: string
  created_at: string
  patient: Patient
  requesting_doctor: Doctor
  ward: Ward
}

interface BedInfo {
  id: string
  bedNumber: string
  wardId: string
  bedType: string
  status: string
  roomNumber: string
  hasOxygen: boolean
  hasSuction: boolean
  hasMonitor: boolean
  dailyRate: number
  notes?: string
  ward?: Ward
  currentPatient?: Patient
  createdAt: string
  updatedAt: string
}

export default function WardAdminDashboard({ wardAdminId }: { wardAdminId: string }) {
  const [admissionRequests, setAdmissionRequests] = useState<AdmissionRequest[]>([])
  const [beds, setBeds] = useState<BedInfo[]>([])
  const [selectedWard, setSelectedWard] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('pending')
  const [selectedBed, setSelectedBed] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState<string>('')
  const [wardDoctors, setWardDoctors] = useState<any[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [doctorPatients, setDoctorPatients] = useState<Record<string, any[]>>({});
  const { toast } = useToast()

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAdmissionRequests()
      fetchBeds()
      // Refresh assigned patients for visible doctors on the same interval
      try {
        fetchAssignedPatientsForAll()
      } catch (e) {
        console.error('[WardAdminDashboard] Error refreshing assigned patients interval:', e)
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    fetchAdmissionRequests()
    fetchBeds()
  }, [wardAdminId, statusFilter])

  // Fetch all ward doctors for staff assignment tab
  useEffect(() => {
    const fetchWardDoctors = async () => {
      setLoadingDoctors(true);
      try {
        console.log('[WardAdminDashboard] Fetching ward doctors from /api/users...');
        const res = await fetch('/api/users');
        const data = await res.json();
        console.log('[WardAdminDashboard] Raw /api/users response:', data);
        if (data.success) {
          // Filter for doctors with doctor_type 'ward' or 'both'
          const wardDocs = (data.users || []).filter((u: any) => u.role === 'doctor' && (u.doctor_type === 'ward' || u.doctor_type === 'both'));
          console.log('[WardAdminDashboard] Filtered ward doctors:', wardDocs);
          setWardDoctors(wardDocs);
            // After loading doctors, fetch assigned patients for the visible doctors
            try {
              console.log('[WardAdminDashboard] Requesting assigned admissions for visible doctors...')
              const ids = wardDocs.map((d: any) => d.id).filter(Boolean)
              if (ids.length > 0) {
                const params = new URLSearchParams({ doctor_ids: ids.join(',') })
                console.log('[WardAdminDashboard] calling /api/admissions/assigned?', params.toString())
                const r = await fetch(`/api/admissions/assigned?${params.toString()}`)
                const ad = await r.json()
                console.log('[WardAdminDashboard] admissions API response:', ad)
                if (ad.success) {
                  const byDoctor = ad.data?.byDoctor || {}
                  const map: Record<string, any[]> = {}
                  for (const id of ids) {
                    const admissions = byDoctor[id] || []
                    map[id] = (admissions || []).map((a: any) => ({
                      admissionId: a.admissionId,
                      patientName: a.patient ? `${a.patient.first_name} ${a.patient.last_name}` : `#${a.patientId}`,
                      patientNumber: a.patient ? a.patient.patient_number : 'Unknown',
                      source: 'admission'
                    }))
                  }
                  setDoctorPatients(map)
                }
              } else {
                // no ids: ensure state empty
                setDoctorPatients({})
              }
            } catch (e) {
              console.error('[WardAdminDashboard] Error fetching admissions for visible doctors', e)
              // fallback to existing batch/individual logic
              fetchAssignedPatientsForAll(wardDocs)
            }
        }
      } catch (e) {
        console.error('[WardAdminDashboard] Error fetching ward doctors:', e);
        setWardDoctors([]);
      } finally {
        setLoadingDoctors(false);
      }
    };
    fetchWardDoctors();
  }, []);

  // Fetch assigned admissions for a single doctor (admitted/inpatient patients)
  const fetchAssignedPatientsForDoctor = async (doctorId: string) => {
    try {
      const params = new URLSearchParams({ doctor_id: doctorId })
      const res = await fetch(`/api/admissions/assigned?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        // data.data.byDoctor[doctorId] contains admissions assigned to this doctor
        const admissions = data.data?.byDoctor?.[doctorId] || []
        // Map to a compact patient view
        let patients = admissions.map((a: any) => ({
          admissionId: a.admissionId,
          patientName: a.patient ? `${a.patient.first_name} ${a.patient.last_name}` : `#${a.patientId}`,
          patientNumber: a.patient ? a.patient.patient_number : 'Unknown',
          source: 'admission'
        }))

        // Fallback: if no admissions assigned to this doctor, try visits-based endpoint to show queued patients
        if (patients.length === 0) {
          try {
            const vres = await fetch(`/api/patients/assigned?${params.toString()}`)
            const vdata = await vres.json()
            if (vdata.success) {
              const active = vdata.data?.activePatients || []
              patients = active.map((p: any) => ({
                admissionId: p.visitId || null,
                patientName: p.patientName,
                patientNumber: p.patientNumber,
                source: 'visit'
              }))
            }
          } catch (verr) {
            console.error('[WardAdminDashboard] visits fallback failed for', doctorId, verr)
          }
        }

        setDoctorPatients(prev => ({ ...prev, [doctorId]: patients }))
      } else {
        console.error('[WardAdminDashboard] Failed to fetch assigned admissions for', doctorId, data.error)
        setDoctorPatients(prev => ({ ...prev, [doctorId]: [] }))
      }
    } catch (err) {
      console.error('[WardAdminDashboard] Error fetching assigned admissions for', doctorId, err)
      setDoctorPatients(prev => ({ ...prev, [doctorId]: [] }))
    }
  }

  // Fetch assigned patients for all doctors (optionally pass doctors list to avoid stale state)
  const fetchAssignedPatientsForAll = async (doctorsList?: any[]) => {
    // Use a single batched endpoint call to fetch assigned patients for the visible doctors
    try {
      const visibleDoctors = (doctorsList || wardDoctors || [])
      const visibleDoctorIds = visibleDoctors.map(d => d.id).filter(Boolean)

      let res
      if (visibleDoctorIds.length > 0) {
        const params = new URLSearchParams({ doctor_ids: visibleDoctorIds.join(',') })
        res = await fetch(`/api/admissions/assigned?${params.toString()}`)
      } else {
        res = await fetch('/api/admissions/assigned')
      }

      const data = await res.json()
      if (data.success) {
        // data.data.byDoctor is already grouped map from server
        const byDoctor = data.data?.byDoctor || {}
        // Map requested/visible doctors into patient lists
        const map: Record<string, any[]> = {}

        if (visibleDoctorIds.length > 0) {
          for (const id of visibleDoctorIds) {
            const admissions = byDoctor[id] || []
            map[id] = (admissions || []).map((a: any) => ({
              admissionId: a.admissionId,
              patientName: a.patient ? `${a.patient.first_name} ${a.patient.last_name}` : `#${a.patientId}`,
              patientNumber: a.patient ? a.patient.patient_number : 'Unknown',
              source: 'admission'
            }))
          }
        } else {
          // No visible doctors provided, fall back to mapping everything returned
          Object.keys(byDoctor).forEach(k => {
            map[k] = (byDoctor[k] || []).map((a: any) => ({
              admissionId: a.admissionId,
              patientName: a.patient ? `${a.patient.first_name} ${a.patient.last_name}` : `#${a.patientId}`,
              patientNumber: a.patient ? a.patient.patient_number : 'Unknown',
              source: 'admission'
            }))
          })
        }

        setDoctorPatients(map)

        // For any visible doctor without admissions, fetch visits fallback so UI shows queued patients
        for (const did of visibleDoctorIds) {
          if (!map[did] || map[did].length === 0) {
            // call per-doctor fetch which implements fallback to visits
            await fetchAssignedPatientsForDoctor(did)
          }
        }
      } else {
        console.error('[WardAdminDashboard] Failed to fetch assigned admissions (batched)', data.error)
      }
    } catch (err) {
      console.error('[WardAdminDashboard] Error fetching assigned admissions (batched)', err)
    }
  }

  const fetchAdmissionRequests = async () => {
    try {
      console.log('🚀 Starting fetch admission requests...')
      const response = await fetch('/api/admissions/requests')
      const data = await response.json()
      console.log('📥 Raw API response:', data)

      if (data.success) {
        const requests = data.data?.requests || []
        console.log('✅ Fetched admission requests:', requests)
        console.log('📊 Number of requests:', requests.length)
        console.log('🔄 Setting state with requests...')
        setAdmissionRequests(requests)
        console.log('✅ State updated!')
      } else {
        console.error('❌ Error fetching admission requests:', data.error)
      }
    } catch (error) {
      console.error('💥 Failed to fetch admission requests:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchBeds = async () => {
    try {
      const params = new URLSearchParams({
        ward_admin_id: wardAdminId
      })

      const response = await fetch(`/api/ward-admin/beds?${params}`)
      const data = await response.json()

      if (data.success) {
        setBeds(data.data || [])
      } else {
        console.error('Error fetching beds:', data.error)
      }
    } catch (error) {
      console.error('Failed to fetch beds:', error)
    }
  }

  const handleAdmissionAction = async (admissionId: string, action: 'approve' | 'reject', bedId?: string) => {
    setIsProcessing(admissionId)
    try {
      const response = await fetch('/api/admissions/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          admissionId,
          action,
          bedId,
          wardAdminId,
          notes: action === 'reject' ? 'Rejected by ward admin' : undefined
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: `Admission ${action}d`,
          description: data.message,
          variant: 'default',
        })
        
        // Refresh data
        fetchAdmissionRequests()
        fetchBeds()
        setSelectedBed('')
      } else {
        toast({
          title: 'Error',
          description: data.error,
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to process admission request',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing('')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-500', text: 'Pending' },
      approved: { color: 'bg-blue-500', text: 'Approved' },
      active: { color: 'bg-green-500', text: 'Active' },
      rejected: { color: 'bg-red-500', text: 'Rejected' },
      discharged: { color: 'bg-gray-500', text: 'Discharged' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending

    return (
      <Badge className={`${config.color} text-white`}>
        {config.text}
      </Badge>
    )
  }

  const getBedStatusBadge = (status: string) => {
    const statusConfig = {
      available: { color: 'bg-green-500', text: 'Available' },
      occupied: { color: 'bg-red-500', text: 'Occupied' },
      maintenance: { color: 'bg-yellow-500', text: 'Maintenance' },
      reserved: { color: 'bg-blue-500', text: 'Reserved' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.available

    return (
      <Badge className={`${config.color} text-white`}>
        {config.text}
      </Badge>
    )
  }

  const AdmissionRequestCard = ({ request }: { request: AdmissionRequest }) => (
    <Card className="mb-4 border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              {request.patient.first_name} {request.patient.last_name}
              {getStatusBadge(request.admission_status)}
            </CardTitle>
            <p className="text-sm text-gray-600">
              Patient #{request.patient.patient_number}
            </p>
          </div>
          <div className="text-right text-sm text-gray-500">
            <p>Requested: {new Date(request.created_at).toLocaleDateString()}</p>
            <p>{new Date(request.created_at).toLocaleTimeString()}</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Medical Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-sm mb-1">Admission Reason</h4>
            <p className="text-sm">{request.admission_reason}</p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-1">Admission Type</h4>
            <p className="text-sm">{request.admission_type}</p>
          </div>
        </div>

        {/* Doctor Information */}
        {request.requesting_doctor && (
          <div>
            <h4 className="font-semibold text-sm mb-1 flex items-center gap-1">
              <Stethoscope className="h-4 w-4" />
              Requesting Doctor
            </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {wardDoctors.map((doc) => {
                    const patients = doctorPatients[doc.id] || []
                    const initials = ((doc.first_name || '').charAt(0) + (doc.last_name || '').charAt(0)).toUpperCase()
                    return (
                      <Card key={doc.id} className="shadow-sm">
                        <CardHeader className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-semibold">{initials || 'DR'}</div>
                            <div>
                              <div className="text-sm font-medium">Dr. {doc.first_name} {doc.last_name}</div>
                              <div className="text-xs text-gray-500">{doc.specialization || 'General'}</div>
                              <div className="text-xs text-gray-400">{doc.doctor_type || '–'}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold">{patients.length}</div>
                            <div className="text-xs text-gray-500">assigned</div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          {loadingDoctors ? (
                            <div className="text-sm text-gray-400">Loading</div>
                          ) : (
                            <div className="space-y-2">
                              {(patients || []).slice(0, 3).map((p) => (
                                <div key={p.admissionId} className="flex items-center">
                                  <div className="text-sm">{p.patientName}</div>
                                </div>
                              ))}
                              {patients.length === 0 && <div className="text-sm text-gray-500">No assigned patients</div>}
                              {patients.length > 3 && (
                                <div className="text-xs text-gray-500">+{patients.length - 3} more</div>
                              )}
                            </div>
                          )}
                        </CardContent>
                        <div className="p-3 pt-0">
                          {/* Footer spacer kept for consistent card height */}
                          <div className="pt-2" />
                        </div>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
    </Card>
  );

  // Summary statistics
  // Count requests that are either 'pending' or 'active' so the dashboard reflects both cases
  const pendingRequests = admissionRequests.filter(r => ['pending', 'active'].includes(r.admission_status)).length
  
  // Debug logging
  console.log('🔍 COMPONENT RENDER DEBUG:')
  console.log('Current admissionRequests state:', admissionRequests)
  console.log('Calculated pendingRequests count:', pendingRequests)
  console.log('Is loading:', isLoading)
  
  const totalBeds = beds.length
  const availableBeds = beds.filter(b => b.status === 'available').length
  const occupiedBeds = beds.filter(b => b.status === 'occupied').length

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Ward Admin Dashboard</h1>
        <p className="text-gray-600">Manage admission requests and bed assignments</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{pendingRequests}</p>
                <p className="text-sm text-gray-600">Pending Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Bed className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{availableBeds}</p>
                <p className="text-sm text-gray-600">Available Beds</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{occupiedBeds}</p>
                <p className="text-sm text-gray-600">Occupied Beds</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{totalBeds}</p>
                <p className="text-sm text-gray-600">Total Beds</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="requests" className="space-y-4">
        <TabsList>
          <TabsTrigger value="requests">Admission Requests</TabsTrigger>
          <TabsTrigger value="beds">Bed Management</TabsTrigger>
          <TabsTrigger value="supply">Supply Management</TabsTrigger>
          <TabsTrigger value="staff">Staff Assignment</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-4">
          {/* Status Filter */}
          <div className="flex gap-2">
            <Button
              variant={statusFilter === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('pending')}
            >
              Pending ({admissionRequests.filter(r => r.admission_status === 'pending').length})
            </Button>
            <Button
              variant={statusFilter === 'active' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('active')}
            >
              Active ({admissionRequests.filter(r => r.admission_status === 'active').length})
            </Button>
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('all')}
            >
              All ({admissionRequests.length})
            </Button>
          </div>

          {/* Admission Requests List */}
          <div>
            {admissionRequests.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No admission requests</h3>
                  <p className="text-gray-600">No admission requests found for the selected status.</p>
                </CardContent>
              </Card>
            ) : (
              admissionRequests.map((request) => (
                <AdmissionRequestCard key={request.id} request={request} />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="beds" className="space-y-4">
          {/* Add Bed Button */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Bed Management</h2>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add New Bed
            </Button>
          </div>

          {/* Bed Status Filter */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              All ({totalBeds})
            </Button>
            <Button variant="outline" size="sm">
              Available ({availableBeds})
            </Button>
            <Button variant="outline" size="sm">
              Occupied ({occupiedBeds})
            </Button>
            <Button variant="outline" size="sm">
              Maintenance ({beds.filter(b => b.status === 'maintenance').length})
            </Button>
          </div>

          {/* Beds List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {beds.map((bed) => (
              <Card key={bed.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-medium">Bed {bed.bedNumber}</div>
                    <div className="text-xs text-gray-500">Room {bed.roomNumber || '–'}</div>
                    <div className="text-xs text-gray-400">{bed.bedType || 'Standard'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{bed.status}</div>
                    <div className="text-xs text-gray-500">{bed.currentPatient ? `${bed.currentPatient.first_name} ${bed.currentPatient.last_name}` : 'Empty'}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {beds.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Bed className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No beds found</h3>
                <p className="text-gray-600">Start by adding beds to your ward.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="staff" className="space-y-4">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle>Staff Assignments</CardTitle>
                <p className="text-gray-600">Manage staff assignments to patients and wards</p>
              </div>
              <div>
                <Button size="sm" onClick={() => fetchAssignedPatientsForAll()}>
                  Refresh Assigned Patients
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingDoctors ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="animate-spin h-6 w-6 text-gray-400 mr-2" />
                  <span className="text-gray-500">Loading ward doctors...</span>
                </div>
              ) : wardDoctors.length === 0 ? (
                <div className="text-center text-gray-500 py-8">No ward doctors found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Specialization</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Assigned Patients</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {wardDoctors.map(doc => (
                        <tr key={doc.id}>
                          <td className="px-4 py-2 whitespace-nowrap font-medium">Dr. {doc.first_name} {doc.last_name}</td>
                          <td className="px-4 py-2 whitespace-nowrap">{doc.email}</td>
                          <td className="px-4 py-2 whitespace-nowrap">{doc.specialization || '-'}</td>
                          <td className="px-4 py-2 whitespace-nowrap capitalize">{doc.doctor_type}</td>
                          <td className="px-4 py-2 whitespace-nowrap">{doc.phone || '-'}</td>
                          <td className="px-4 py-2 whitespace-nowrap align-top">
                            {/* Assigned patients summary */}
                            {loadingDoctors ? (
                              <span className="text-sm text-gray-400">Loading…</span>
                            ) : (
                              <div className="max-w-xs">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">{(doctorPatients[doc.id] || []).length}</span>
                                  <span className="text-xs text-gray-500">assigned</span>
                                  <Button size="sm" variant="ghost" onClick={() => fetchAssignedPatientsForDoctor(doc.id)}>Refresh</Button>
                                </div>
                                {(doctorPatients[doc.id] || []).slice(0,3).map(p => (
                                  <div key={p.admissionId} className="text-sm text-gray-700">{p.patientName} <span className="text-xs text-gray-400">#{p.patientNumber}</span></div>
                                ))}
                                {(doctorPatients[doc.id] || []).length > 3 && (
                                  <div className="text-xs text-gray-500">+{(doctorPatients[doc.id] || []).length - 3} more</div>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <Button size="sm" variant="outline">Edit</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}