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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Bed, Users, Package, AlertTriangle, CheckCircle, Clock, Plus, Minus } from 'lucide-react'
import Link from "next/link"

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
}

export default function ComprehensiveWardAdminDashboardAlt() {
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
  const [stats, setStats] = useState({
    pendingRequests: 0,
    availableBeds: 0,
    totalBeds: 0,
    occupancyRate: 0,
    lowStockItems: 0,
    pendingSupplyRequests: 0
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

  // Fetch admission requests
  const fetchAdmissionRequests = async () => {
    try {
      const response = await fetch('/api/admissions/requests')
      if (!response.ok) throw new Error('Failed to fetch admission requests')
      
      const data = await response.json()
      setAdmissionRequests(data.requests || [])
      
      // Update stats
      const pending = data.requests?.filter((req: AdmissionRequest) => req.admission_status === 'pending').length || 0
      setStats(prev => ({ ...prev, pendingRequests: pending }))
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
      setWardInfo(data.wards || [])
      
      // Calculate stats
      const totalBeds = data.wards?.reduce((sum: number, ward: WardInfo) => sum + ward.total_beds, 0) || 0
      const availableBeds = data.wards?.reduce((sum: number, ward: WardInfo) => sum + ward.available_beds, 0) || 0
      const occupancyRate = totalBeds > 0 ? Math.round(((totalBeds - availableBeds) / totalBeds) * 100) : 0
      
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
      setSupplies(data.supplies || [])
      
      // Count low stock items
      const lowStock = data.supplies?.filter((item: SupplyItem) => 
        item.current_stock <= item.minimum_threshold
      ).length || 0
      
      setStats(prev => ({ ...prev, lowStockItems: lowStock }))
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
      setSupplyRequests(data.requests || [])
      
      // Count pending requests
      const pending = data.requests?.filter((req: SupplyRequest) => req.status === 'pending').length || 0
      setStats(prev => ({ ...prev, pendingSupplyRequests: pending }))
    } catch (error) {
      console.error('Error fetching supply requests:', error)
    }
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
      const response = await fetch(`/api/admissions/requests/${selectedRequest.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bed_id: selectedBed,
          approved_by: currentUser.id
        })
      })

      if (!response.ok) throw new Error('Failed to approve admission')

      // Refresh data
      await Promise.all([fetchAdmissionRequests(), fetchWardInfo()])
      
      // Reset dialog
      setSelectedRequest(null)
      setSelectedBed('')
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

  // Get available beds for a ward
  const getAvailableBedsForWard = (wardId: string) => {
    const ward = wardInfo.find(w => w.id === wardId)
    return ward?.beds.filter(bed => bed.bed_status === 'available') || []
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Ward Administration Dashboard</h1>
          <p className="text-gray-600">Manage admissions, beds, supplies, and staff assignments</p>
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
        <Tabs defaultValue="admissions" className="space-y-6">
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
            <div className="grid gap-6">
              {wardInfo.map((ward) => (
                <Card key={ward.id}>
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      {ward.name} - {ward.ward_type}
                      <Badge variant="outline">
                        {ward.available_beds}/{ward.total_beds} Available
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {ward.beds.map((bed) => (
                        <div
                          key={bed.id}
                          className={`p-3 rounded-lg border-2 text-center ${
                            bed.bed_status === 'available'
                              ? 'border-green-300 bg-green-50'
                              : bed.bed_status === 'occupied'
                              ? 'border-red-300 bg-red-50'
                              : 'border-yellow-300 bg-yellow-50'
                          }`}
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
                          </div>
                          {bed.patient_name && (
                            <div className="text-xs text-gray-500 mt-1">{bed.patient_name}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
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
                <CardTitle>Supply Requests</CardTitle>
                <CardDescription>Pending supply requests from staff</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Requested By</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {supplyRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>{request.item_name}</TableCell>
                        <TableCell>{request.requested_quantity}</TableCell>
                        <TableCell>{request.requested_by}</TableCell>
                        <TableCell>{new Date(request.requested_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge>{request.status}</Badge>
                        </TableCell>
                        <TableCell>
                          {request.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button size="sm" variant="default">Approve</Button>
                              <Button size="sm" variant="outline">Reject</Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
                <div className="text-center py-8">
                  <p className="text-gray-500">Staff assignment management coming soon...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Bed Assignment Dialog */}
        <Dialog open={showBedAssignDialog} onOpenChange={setShowBedAssignDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Bed to Patient</DialogTitle>
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
      </main>

      <Footer />
    </div>
  )
}