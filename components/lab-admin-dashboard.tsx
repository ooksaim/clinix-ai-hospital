"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { 
  TestTube, 
  Plus, 
  Search, 
  Filter,
  Clock,
  CheckCircle,
  AlertTriangle,
  Edit,
  Trash2,
  Eye
} from "lucide-react"
import Link from "next/link"

interface LabTest {
  id: string
  test_code: string
  test_name: string
  test_category: string
  specimen_type: string
  specimen_volume: string
  container_type: string
  test_method: string
  reference_range_male: string
  reference_range_female: string
  reference_range_pediatric: string
  critical_values: string
  turnaround_time: number
  cost: number
  department: string
  is_active: boolean
  created_at: string
  updated_at: string
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
  test_count: number
}

// Helper function to safely convert to string
const safeToString = (value: any): string => {
  if (value == null) return '-'
  if (typeof value === 'string') return value
  return String(value)
}

function LabTestsTable() {
  const [tests, setTests] = useState<LabTest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showAddForm, setShowAddForm] = useState(false)
  
  // Form state for adding new test
  const [form, setForm] = useState({
    test_code: '',
    test_name: '',
    test_category: '',
    specimen_type: '',
    specimen_volume: '',
    container_type: '',
    test_method: '',
    reference_range_male: '',
    reference_range_female: '',
    reference_range_pediatric: '',
    critical_values: '',
    turnaround_time: '',
    cost: '',
    department: '',
    is_active: true
  })

  const categories = ['all', 'hematology', 'chemistry', 'microbiology', 'immunology', 'pathology', 'radiology']
  
  useEffect(() => {
    fetchTests()
  }, [])

  const fetchTests = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/lab-tests')
      const result = await response.json()
      if (result.success) {
        setTests(result.data || [])
      } else {
        console.error('Failed to fetch tests:', result.error)
      }
    } catch (error) {
      console.error('Error fetching tests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/lab-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      
      const result = await response.json()
      if (result.success) {
        await fetchTests()
        setShowAddForm(false)
        setForm({
          test_code: '',
          test_name: '',
          test_category: '',
          specimen_type: '',
          specimen_volume: '',
          container_type: '',
          test_method: '',
          reference_range_male: '',
          reference_range_female: '',
          reference_range_pediatric: '',
          critical_values: '',
          turnaround_time: '',
          cost: '',
          department: '',
          is_active: true
        })
      } else {
        alert('Failed to create test: ' + result.error)
      }
    } catch (error) {
      alert('Error creating test: ' + error)
    }
  }

  const filteredTests = tests.filter(test => {
    const matchesSearch = test.test_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         test.test_code.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || test.test_category === selectedCategory
    return matchesSearch && matchesCategory
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with search and filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search tests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Test
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Lab Test</DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-1">Test Code *</Label>
                    <Input
                      name="test_code"
                      value={form.test_code}
                      onChange={handleFormChange}
                      placeholder="e.g. CBC"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-1">Test Name *</Label>
                    <Input
                      name="test_name"
                      value={form.test_name}
                      onChange={handleFormChange}
                      placeholder="e.g. Complete Blood Count"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-1">Category</Label>
                    <Input
                      name="test_category"
                      value={form.test_category}
                      onChange={handleFormChange}
                      placeholder="e.g. Hematology"
                    />
                  </div>
                  
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-1">Specimen Type *</Label>
                    <Input
                      name="specimen_type"
                      value={form.specimen_type}
                      onChange={handleFormChange}
                      placeholder="e.g. Blood"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-1">Specimen Volume</Label>
                    <Input
                      name="specimen_volume"
                      value={form.specimen_volume}
                      onChange={handleFormChange}
                      placeholder="e.g. 5ml"
                    />
                  </div>
                  
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-1">Container Type</Label>
                    <Input
                      name="container_type"
                      value={form.container_type}
                      onChange={handleFormChange}
                      placeholder="e.g. EDTA tube"
                    />
                  </div>
                  
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-1">Test Method</Label>
                    <Input
                      name="test_method"
                      value={form.test_method}
                      onChange={handleFormChange}
                      placeholder="e.g. Flow cytometry"
                    />
                  </div>
                  
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-1">Turnaround Time (hours)</Label>
                    <Input
                      name="turnaround_time"
                      type="number"
                      value={form.turnaround_time}
                      onChange={handleFormChange}
                      placeholder="24"
                    />
                  </div>
                  
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-1">Cost</Label>
                    <Input
                      name="cost"
                      type="number"
                      step="0.01"
                      value={form.cost}
                      onChange={handleFormChange}
                      placeholder="50.00"
                    />
                  </div>
                  
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-1">Department</Label>
                    <Input
                      name="department"
                      value={form.department}
                      onChange={handleFormChange}
                      placeholder="Laboratory"
                    />
                  </div>
                </div>
                
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">Reference Range (Male)</Label>
                  <Textarea
                    name="reference_range_male"
                    value={form.reference_range_male}
                    onChange={handleFormChange}
                    placeholder="Normal range for male patients"
                    rows={2}
                  />
                </div>
                
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">Reference Range (Female)</Label>
                  <Textarea
                    name="reference_range_female"
                    value={form.reference_range_female}
                    onChange={handleFormChange}
                    placeholder="Normal range for female patients"
                    rows={2}
                  />
                </div>
                
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">Reference Range (Pediatric)</Label>
                  <Textarea
                    name="reference_range_pediatric"
                    value={form.reference_range_pediatric}
                    onChange={handleFormChange}
                    placeholder="Normal range for pediatric patients"
                    rows={2}
                  />
                </div>
                
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">Critical Values</Label>
                  <Textarea
                    name="critical_values"
                    value={form.critical_values}
                    onChange={handleFormChange}
                    placeholder="Values requiring immediate attention"
                    rows={2}
                  />
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    Create Test
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Laboratory Tests ({filteredTests.length})</CardTitle>
          <CardDescription>
            Manage test catalog and configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Specimen</TableHead>
                  <TableHead>TAT</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTests.map((t, idx) => {
                  try {
                    const code = safeToString(t?.test_code)
                    const name = safeToString(t?.test_name)
                    const category = safeToString(t?.test_category)
                    const specimen = safeToString(t?.specimen_type)
                    const turnaround = t?.turnaround_time == null ? '-' : safeToString(t.turnaround_time)
                    const costVal = t?.cost != null && !Number.isNaN(Number(t.cost)) ? Number(t.cost) : NaN
                    const cost = Number.isFinite(costVal) ? costVal.toFixed(2) : safeToString(t?.cost)
                    const active = !!t?.is_active

                    return (
                      <TableRow key={t?.id || idx}>
                        <TableCell className="font-medium">{code}</TableCell>
                        <TableCell>{name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{category}</Badge>
                        </TableCell>
                        <TableCell>{specimen}</TableCell>
                        <TableCell>{turnaround}h</TableCell>
                        <TableCell>${cost}</TableCell>
                        <TableCell>
                          <Badge variant={active ? "default" : "secondary"}>
                            {active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline" disabled={!active}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  } catch (error) {
                    console.error('Error rendering row:', error, t)
                    return (
                      <TableRow key={idx}>
                        <TableCell colSpan={8} className="text-center text-red-500">
                          Error displaying test data
                        </TableCell>
                      </TableRow>
                    )
                  }
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function LabOrdersTable() {
  const [orders, setOrders] = useState<LabOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/lab-orders')
      const result = await response.json()
      if (result.success) {
        setOrders(result.data || [])
      } else {
        console.error('Failed to fetch orders:', result.error)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
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

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.patient_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || order.order_status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with search and filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lab Orders ({filteredOrders.length})</CardTitle>
          <CardDescription>
            Manage laboratory test orders and results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Tests</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.order_number}</TableCell>
                    <TableCell>{order.patient_name || 'Unknown Patient'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{order.test_count} test(s)</Badge>
                    </TableCell>
                    <TableCell>{getPriorityBadge(order.priority)}</TableCell>
                    <TableCell>{getStatusBadge(order.order_status)}</TableCell>
                    <TableCell>
                      {new Date(order.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Link href={`/lab-admin/orders/${order.id}`}>
                        <Button size="sm" variant="outline">
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function LabAdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState({
    totalTests: 0,
    pendingOrders: 0,
    completedToday: 0,
    urgentOrders: 0
  })
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/lab-orders/count', {
        cache: 'no-store', // Prevent caching for real-time data
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      const result = await response.json()
      if (result.success) {
        setStats(result.data)
        setLastUpdated(new Date())
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  // Initial fetch and set up real-time updates
  useEffect(() => {
    fetchStats()
    
    // Set up automatic refresh every 10 seconds
    const interval = setInterval(fetchStats, 10000)
    
    // Set up visibility change listener for immediate refresh when tab becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchStats()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Set up focus listener for refresh when window regains focus
    const handleFocus = () => {
      fetchStats()
    }
    
    window.addEventListener('focus', handleFocus)
    
    // Cleanup
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  // Also refresh stats when switching between tabs
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    fetchStats() // Refresh stats when changing tabs
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="space-y-2">
        {lastUpdated && (
          <div className="text-right">
            <p className="text-xs text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Total Tests (Pending)</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.totalTests}</p>
                </div>
                <TestTube className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Pending Orders</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.pendingOrders}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Completed Today</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completedToday}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Urgent Orders</p>
                  <p className="text-2xl font-bold text-red-600">{stats.urgentOrders}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <Button
          variant={activeTab === 'overview' ? 'default' : 'ghost'}
          onClick={() => handleTabChange('overview')}
          className="flex-1"
        >
          Recent Orders
        </Button>
        <Button
          variant={activeTab === 'orders' ? 'default' : 'ghost'}
          onClick={() => handleTabChange('orders')}
          className="flex-1"
        >
          All Orders
        </Button>
        <Button
          variant={activeTab === 'tests' ? 'default' : 'ghost'}
          onClick={() => handleTabChange('tests')}
          className="flex-1"
        >
          Test Catalog
        </Button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <LabOrdersTable />}
      {activeTab === 'orders' && <LabOrdersTable />}
      {activeTab === 'tests' && <LabTestsTable />}
    </div>
  )
}