'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  User, 
  Phone, 
  Heart, 
  Calendar,
  Search,
  UserPlus,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react"

interface Department {
  id: string
  name: string
  description: string
}

interface VisitHistory {
  id: string
  visit_date: string
  visit_type: string
  chief_complaint: string
  symptoms: string
  token: {
    token_number: string
    queue_position: number
    status: string
  }
  department: {
    name: string
  }
  doctor?: {
    name: string
  }
}

interface Patient {
  id: string
  patient_number: string
  first_name: string
  last_name: string
  father_name?: string
  cnic: string
  phone: string
  date_of_birth: string
  age?: number
  gender: string
  visits?: number | Array<{ count: number }>  // Support both formats
}

export function PatientRegistration() {
  const [activeTab, setActiveTab] = useState('register')
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [searchResults, setSearchResults] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [visitHistory, setVisitHistory] = useState<VisitHistory[]>([])
  const [isViewingHistory, setIsViewingHistory] = useState(false)
  
  // History popup state
  const [historyPopupOpen, setHistoryPopupOpen] = useState(false)
  const [historyData, setHistoryData] = useState<any>(null)
  
  // Registration form state
  const [formData, setFormData] = useState({
    // Personal Information (patients table)
    first_name: '',
    last_name: '',
    father_name: '',
    date_of_birth: '',
    gender: '',
    cnic: '',
    
    // Contact Information (patients table)
    phone: '',
    email: '',
    address: '',
    city: '',
    emergency_contact: '',
    
    // Medical Information (patients table)
    blood_group: '',
    allergies: '',
    medical_history: '',
    marital_status: '',
    occupation: '',
    
    // Visit Information (visits table)
    department_id: '',
    chief_complaint: '',
    symptoms: '',
    visit_type: 'opd',
    priority: 'normal'
  })

  const [searchQuery, setSearchQuery] = useState('')

  // Fetch departments function
  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments')
      const data = await response.json()
      if (data.success) {
        setDepartments(data.departments)
      }
    } catch (error) {
      console.error('Failed to fetch departments:', error)
    }
  }

  // Fetch departments on component mount
  useEffect(() => {
    fetchDepartments()
  }, [])

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const validateForm = () => {
    const required = ['first_name', 'last_name', 'date_of_birth', 'gender', 'phone', 'department_id', 'chief_complaint']
    for (const field of required) {
      if (!formData[field as keyof typeof formData]) {
        setError(`${field.replace('_', ' ')} is required`)
        return false
      }
    }
    
    // CNIC validation (13 digits)
    if (formData.cnic && !/^\d{13}$/.test(formData.cnic.replace(/-/g, ''))) {
      setError('CNIC must be 13 digits')
      return false
    }
    
    // Phone validation
    if (!/^\+?[\d\s-()]{10,}$/.test(formData.phone)) {
      setError('Please enter a valid phone number')
      return false
    }
    
    // Email validation if provided
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address')
      return false
    }
    
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    if (!validateForm()) return
    
    setLoading(true)
    
    try {
      const response = await fetch('/api/patients/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      
      const data = await response.json()
      
      if (data.success) {
        setSuccess(`Patient registered successfully! Token Number: ${data.token_number}`)
        setFormData({
          first_name: '', last_name: '', father_name: '', date_of_birth: '', gender: '', cnic: '',
          phone: '', email: '', address: '', city: '', emergency_contact: '',
          blood_group: '', allergies: '', medical_history: '', marital_status: '', occupation: '',
          department_id: '', chief_complaint: '', symptoms: '', visit_type: 'opd', priority: 'normal'
        })
      } else {
        setError(data.error || 'Registration failed')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Optimized real-time search with better debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        handleSearch()
      } else {
        setSearchResults([])
      }
    }, 500) // Increased to 500ms for better performance

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/patients/search?q=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()
      
      if (data.success) {
        setSearchResults(data.patients)
      } else {
        setError(data.error || 'Search failed')
        setSearchResults([])
      }
    } catch (error) {
      setError('Search failed. Please try again.')
      setSearchResults([])
    } finally {
      setLoading(false)
    }
  }

  // Create new visit for existing patient
  const handleNewVisit = async (patient: Patient) => {
    try {
      // Pre-fill form with existing patient data
      setFormData({
        first_name: patient.first_name,
        last_name: patient.last_name,
        father_name: patient.father_name || '',
        date_of_birth: patient.date_of_birth,
        gender: patient.gender,
        cnic: patient.cnic || '',
        phone: patient.phone || '',
        email: '', // Will be fetched if needed
        address: '', city: '', emergency_contact: '',
        blood_group: '', allergies: '', medical_history: '', 
        marital_status: '', occupation: '',
        department_id: '', chief_complaint: '', symptoms: '', 
        visit_type: 'opd', priority: 'normal'
      })
      
      // Switch to registration tab
      setActiveTab('register')
      
      // Show info message
      setSuccess(`Patient ${patient.first_name} ${patient.last_name} selected. Please complete visit information.`)
      
    } catch (error) {
      setError('Failed to load patient data')
    }
  }

  // Show patient history/details
  const handleViewHistory = async (patient: Patient) => {
    try {
      console.log("🚀 SHOWING HISTORY POPUP for patient:", patient.id, patient.first_name, patient.last_name)
      setLoading(true)
      
      const response = await fetch(`/api/patients/history?patient_id=${patient.id}`)
      const data = await response.json()
      
      console.log("🚀 POPUP API Response:", data)
      
      if (data.success && data.data) {
        setHistoryData(data.data)
        setHistoryPopupOpen(true)
        console.log("🚀 History data set, popup should be visible now")
      } else {
        alert("No history data found for this patient")
      }
    } catch (error) {
      console.error("❌ Error loading history:", error)
      alert("Error loading patient history")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Patient Registration
            </CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Register new patients or search existing records for OPD visits
          </p>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="register" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Register New Patient
              </TabsTrigger>
              <TabsTrigger value="search" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Search Existing
              </TabsTrigger>
            </TabsList>

            <TabsContent value="search" className="space-y-4 mt-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search by name, CNIC, or phone number (type at least 2 characters)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {loading && (
                <div className="flex items-center justify-center py-8">
                  <Clock className="h-6 w-6 animate-spin mr-2" />
                  <span>Searching...</span>
                </div>
              )}

              {searchResults.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Search Results:</h3>
                  {searchResults.map((patient) => (
                    <div key={patient.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{patient.first_name} {patient.last_name}</p>
                        <p className="text-sm text-gray-600">CNIC: {patient.cnic || 'N/A'} | Phone: {patient.phone || 'N/A'}</p>
                        <p className="text-xs text-gray-500">
                          Age: {patient.age || 'N/A'} | Gender: {patient.gender} | 
                          Visits: {typeof patient.visits === 'number' ? patient.visits : patient.visits?.[0]?.count || 0}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleNewVisit(patient)}>
                          <Calendar className="h-4 w-4 mr-2" />
                          New Visit
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleViewHistory(patient)}>
                          View History
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {searchQuery.length >= 2 && searchResults.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-500">
                  No patients found matching "{searchQuery}"
                </div>
              )}

              {searchQuery.length > 0 && searchQuery.length < 2 && (
                <div className="text-center py-8 text-gray-500">
                  Type at least 2 characters to search
                </div>
              )}
            </TabsContent>

            <TabsContent value="register" className="space-y-6 mt-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">{success}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <Tabs defaultValue="personal" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="personal">Personal</TabsTrigger>
                    <TabsTrigger value="contact">Contact</TabsTrigger>
                    <TabsTrigger value="medical">Medical</TabsTrigger>
                    <TabsTrigger value="visit">Visit Info</TabsTrigger>
                  </TabsList>

                  <TabsContent value="personal" className="space-y-4 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="first_name">First Name *</Label>
                        <Input
                          id="first_name"
                          value={formData.first_name}
                          onChange={(e) => handleInputChange('first_name', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="last_name">Last Name *</Label>
                        <Input
                          id="last_name"
                          value={formData.last_name}
                          onChange={(e) => handleInputChange('last_name', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="father_name">Father Name</Label>
                        <Input
                          id="father_name"
                          value={formData.father_name}
                          onChange={(e) => handleInputChange('father_name', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="date_of_birth">Date of Birth *</Label>
                        <Input
                          id="date_of_birth"
                          type="date"
                          value={formData.date_of_birth}
                          onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="gender">Gender *</Label>
                        <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="cnic">CNIC</Label>
                        <Input
                          id="cnic"
                          placeholder="12345-6789012-3"
                          value={formData.cnic}
                          onChange={(e) => handleInputChange('cnic', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="marital_status">Marital Status</Label>
                        <Select value={formData.marital_status} onValueChange={(value) => handleInputChange('marital_status', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="single">Single</SelectItem>
                            <SelectItem value="married">Married</SelectItem>
                            <SelectItem value="divorced">Divorced</SelectItem>
                            <SelectItem value="widowed">Widowed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="occupation">Occupation</Label>
                        <Input
                          id="occupation"
                          value={formData.occupation}
                          onChange={(e) => handleInputChange('occupation', e.target.value)}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="contact" className="space-y-4 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="address">Address</Label>
                        <Textarea
                          id="address"
                          value={formData.address}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="emergency_contact">Emergency Contact</Label>
                        <Input
                          id="emergency_contact"
                          placeholder="Name and phone number of emergency contact"
                          value={formData.emergency_contact}
                          onChange={(e) => handleInputChange('emergency_contact', e.target.value)}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="medical" className="space-y-4 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="blood_group">Blood Group</Label>
                        <Select value={formData.blood_group} onValueChange={(value) => handleInputChange('blood_group', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select blood group" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="A+">A+</SelectItem>
                            <SelectItem value="A-">A-</SelectItem>
                            <SelectItem value="B+">B+</SelectItem>
                            <SelectItem value="B-">B-</SelectItem>
                            <SelectItem value="AB+">AB+</SelectItem>
                            <SelectItem value="AB-">AB-</SelectItem>
                            <SelectItem value="O+">O+</SelectItem>
                            <SelectItem value="O-">O-</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="allergies">Known Allergies</Label>
                        <Textarea
                          id="allergies"
                          placeholder="List any known allergies..."
                          value={formData.allergies}
                          onChange={(e) => handleInputChange('allergies', e.target.value)}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="medical_history">Medical History</Label>
                        <Textarea
                          id="medical_history"
                          placeholder="Previous medical conditions, surgeries, etc..."
                          value={formData.medical_history}
                          onChange={(e) => handleInputChange('medical_history', e.target.value)}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="visit" className="space-y-4 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="department_id">Department *</Label>
                        <Select value={formData.department_id} onValueChange={(value) => handleInputChange('department_id', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent>
                            {departments.map((dept) => (
                              <SelectItem key={dept.id} value={dept.id}>
                                {dept.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="visit_type">Visit Type</Label>
                        <Select value={formData.visit_type} onValueChange={(value) => handleInputChange('visit_type', value)} disabled>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="opd">OPD</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="priority">Priority</Label>
                        <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                            <SelectItem value="emergency">Emergency</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="chief_complaint">Chief Complaint *</Label>
                        <Textarea
                          id="chief_complaint"
                          placeholder="Main reason for visit..."
                          value={formData.chief_complaint}
                          onChange={(e) => handleInputChange('chief_complaint', e.target.value)}
                          required
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="symptoms">Symptoms</Label>
                        <Textarea
                          id="symptoms"
                          placeholder="Describe symptoms in detail..."
                          value={formData.symptoms}
                          onChange={(e) => handleInputChange('symptoms', e.target.value)}
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end gap-4 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => {
                    setFormData({
                      first_name: '', last_name: '', father_name: '', date_of_birth: '', gender: '', cnic: '',
                      phone: '', email: '', address: '', city: '', emergency_contact: '',
                      blood_group: '', allergies: '', medical_history: '', marital_status: '', occupation: '',
                      department_id: '', chief_complaint: '', symptoms: '', visit_type: 'opd', priority: 'normal'
                    })
                  }}>
                    Clear Form
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Registering...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Register Patient
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Patient History Popup Dialog */}
      {historyPopupOpen && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="relative bg-white dark:bg-neutral-900 w-full max-w-5xl rounded-lg shadow-2xl border border-gray-200 dark:border-neutral-700 animate-in fade-in zoom-in duration-150">
            {/* Close Button */}
            <button
              onClick={() => setHistoryPopupOpen(false)}
              className="absolute top-3 right-3 rounded-md px-3 py-1 text-sm font-medium bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 transition-colors"
            >
              ✕ Close
            </button>

            <div className="sticky top-0 bg-white dark:bg-neutral-900 border-b p-4 rounded-t-lg">
              <h2 className="text-xl font-bold">Patient Medical History</h2>
            </div>

            <div className="p-4 space-y-5 max-h-[75vh] overflow-y-auto">
              {!historyData && (
                <div className="text-center py-10 text-gray-500">Loading history...</div>
              )}

              {historyData && (
                <>
                  {/* Patient Summary */}
                  <div className="grid md:grid-cols-4 gap-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-sm">
                    <div>
                      <p className="text-gray-500 text-xs">Name</p>
                      <p className="font-semibold">{historyData.patient?.first_name} {historyData.patient?.last_name}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Patient #</p>
                      <p className="font-medium">{historyData.patient?.patient_number || '—'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Phone</p>
                      <p>{historyData.patient?.phone || '—'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Total Visits</p>
                      <p className="font-bold text-blue-600">{historyData.totalVisits}</p>
                    </div>
                  </div>

                  {/* Visits */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Visits</h3>
                    {historyData.visits && historyData.visits.length > 0 ? (
                      <div className="space-y-3">
                        {historyData.visits.map((visit: any, idx: number) => (
                          <div key={visit.id || idx} className="border rounded-lg p-4 bg-gray-50 dark:bg-neutral-800 text-sm">
                            <div className="flex flex-wrap gap-2 justify-between mb-2">
                              <span className="font-medium">Visit #{historyData.totalVisits - idx}</span>
                              <span className="text-gray-500 text-xs">{visit.visit_date ? new Date(visit.visit_date).toLocaleDateString() : '—'}</span>
                            </div>
                            <div className="grid md:grid-cols-2 gap-3">
                              <div><span className="font-semibold">Symptoms: </span>{visit.symptoms || visit.chief_complaint || '—'}</div>
                              <div><span className="font-semibold">Diagnosis: </span>{visit.diagnosis || visit.final_diagnosis || '—'}</div>
                              <div><span className="font-semibold">Treatment: </span>{visit.treatment_plan || visit.notes || '—'}</div>
                              <div><span className="font-semibold">Priority: </span>{visit.priority || 'Normal'}</div>
                              <div><span className="font-semibold">Doctor: </span>{visit.doctor || 'Not assigned'}</div>
                              <div><span className="font-semibold">Department: </span>{visit.department || '—'}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-500 italic">No visit records.</div>
                    )}
                  </div>
                </>
              )}

              {/* Bottom Close Button */}
              <div className="flex justify-end pt-4 border-t">
                <Button 
                  onClick={() => setHistoryPopupOpen(false)}
                  variant="outline"
                  className="bg-gray-100 hover:bg-gray-200"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}