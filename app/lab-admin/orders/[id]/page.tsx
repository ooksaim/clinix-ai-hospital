'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  ArrowLeft,
  TestTube,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  Calendar,
  FileText,
  Edit,
  Save
} from "lucide-react"

interface LabTest {
  id: string
  test_code: string
  test_name: string
  test_category: string
  specimen_type: string
  reference_range_male?: string
  reference_range_female?: string
  critical_values?: string
}

interface OrderTest {
  id: string
  test_id: string
  test_status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  result_value?: string
  result_unit?: string
  result_notes?: string
  technician_notes?: string
  completed_at?: string
  lab_tests: LabTest
}

interface LabOrder {
  id: string
  order_number: string
  patient_id: string
  patient_name: string
  doctor_name: string
  admission_id?: string
  ordered_by: string
  order_status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'routine' | 'urgent' | 'stat'
  clinical_info?: string
  created_at: string
  updated_at: string
  lab_order_tests: OrderTest[]
}

export default function LabOrderDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string

  const [order, setOrder] = useState<LabOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [editingTest, setEditingTest] = useState<string | null>(null)

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails()
    }
  }, [orderId])

  const fetchOrderDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/lab-orders/${orderId}`)
      const result = await response.json()
      
      if (result.success) {
        setOrder(result.data)
      } else {
        console.error('Failed to fetch order:', result.error)
      }
    } catch (error) {
      console.error('Error fetching order:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateTestStatus = async (testId: string, status: string) => {
    try {
      setUpdating(true)
      const response = await fetch(`/api/lab-orders/${orderId}/tests/${testId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test_status: status })
      })

      const result = await response.json()
      if (result.success) {
        await fetchOrderDetails() // Refresh the data
      } else {
        alert('Failed to update test status')
      }
    } catch (error) {
      console.error('Error updating test:', error)
      alert('Error updating test status')
    } finally {
      setUpdating(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      in_progress: { color: 'bg-blue-100 text-blue-800', icon: TestTube },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: AlertTriangle }
    }
    const config = variants[status as keyof typeof variants] || variants.pending
    const IconComponent = config.icon

    return (
      <Badge className={config.color}>
        <IconComponent className="h-3 w-3 mr-1" />
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const colors = {
      routine: 'bg-gray-100 text-gray-800',
      urgent: 'bg-orange-100 text-orange-800',
      stat: 'bg-red-100 text-red-800'
    }
    
    return (
      <Badge className={colors[priority as keyof typeof colors] || colors.routine}>
        {priority.toUpperCase()}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-4">The requested lab order could not be found.</p>
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button 
              onClick={() => router.back()} 
              variant="outline" 
              size="sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Order {order.order_number}
              </h1>
              <p className="text-gray-600 mt-1">Lab order details and test results</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getPriorityBadge(order.priority)}
            {getStatusBadge(order.order_status)}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Information */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Order Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Patient</Label>
                  <p className="text-lg font-semibold">{order.patient_name}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-600">Ordered By</Label>
                  <p>{order.doctor_name}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-600">Order Date</Label>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    <p>{new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString()}</p>
                  </div>
                </div>
                
                {order.admission_id && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Admission ID</Label>
                    <p>{order.admission_id}</p>
                  </div>
                )}
                
                {order.clinical_info && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Clinical Information</Label>
                    <div className="flex items-start">
                      <FileText className="h-4 w-4 mr-2 text-gray-400 mt-1" />
                      <p className="text-sm">{order.clinical_info}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Tests */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TestTube className="h-5 w-5 mr-2" />
                  Laboratory Tests ({order.lab_order_tests.length})
                </CardTitle>
                <CardDescription>
                  Individual test results and status updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Test Code</TableHead>
                        <TableHead>Test Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Specimen</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {order.lab_order_tests.map((orderTest) => (
                        <TableRow key={orderTest.id}>
                          <TableCell className="font-medium">
                            {orderTest.lab_tests.test_code}
                          </TableCell>
                          <TableCell>{orderTest.lab_tests.test_name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {orderTest.lab_tests.test_category}
                            </Badge>
                          </TableCell>
                          <TableCell>{orderTest.lab_tests.specimen_type}</TableCell>
                          <TableCell>{getStatusBadge(orderTest.test_status)}</TableCell>
                          <TableCell>
                            <Select 
                              value={orderTest.test_status} 
                              onValueChange={(value) => updateTestStatus(orderTest.id, value)}
                              disabled={updating}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}