'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, UserPlus, Search, CheckCircle } from "lucide-react"

interface PatientFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  age: string
  gender: string
  address: string
  chiefComplaint: string
}

interface Patient {
  id: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  age?: number
  gender?: string
  tokenNumber?: number
}

export function PatientRegistration() {
  const [formData, setFormData] = useState<PatientFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    age: '',
    gender: '',
    address: '',
    chiefComplaint: ''
  })

  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<Patient[]>([])
  const [isRegistering, setIsRegistering] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)
  const [registeredPatient, setRegisteredPatient] = useState<Patient & {tokenNumber: number} | null>(null)

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setMessage(null)
  }

  const searchPatients = async () => {
    if (!searchTerm.trim()) return

    setIsSearching(true)
    try {
      const response = await fetch(`/api/patients?search=${encodeURIComponent(searchTerm)}`)
      const data = await response.json()
      
      if (data.success) {
        setSearchResults(data.patients || [])
      } else {
        setMessage({ type: 'error', text: 'Search failed: ' + data.error })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Search failed: Network error' })
    } finally {
      setIsSearching(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validation
    if (!formData.firstName || !formData.lastName) {
      setMessage({ type: 'error', text: 'First name and last name are required' })
      return
    }

    setIsRegistering(true)
    setMessage(null)

    try {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        setMessage({ type: 'success', text: `Patient registered successfully! Token: ${data.tokenNumber}` })
        setRegisteredPatient({
          ...data.patient,
          tokenNumber: data.tokenNumber
        })
        // Reset form
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          age: '',
          gender: '',
          address: '',
          chiefComplaint: ''
        })
      } else {
        setMessage({ type: 'error', text: 'Registration failed: ' + data.error })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Registration failed: Network error' })
    } finally {
      setIsRegistering(false)
    }
  }

  const selectExistingPatient = (patient: Patient) => {
    setFormData({
      firstName: patient.first_name || '',
      lastName: patient.last_name || '',
      email: patient.email || '',
      phone: patient.phone || '',
      age: patient.age?.toString() || '',
      gender: patient.gender || '',
      address: '',
      chiefComplaint: ''
    })
    setSearchResults([])
    setSearchTerm('')
    setMessage({ type: 'success', text: 'Patient information loaded. You can modify and register for new visit.' })
  }

  return (
    <div className="space-y-6">
      {/* Patient Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Existing Patient
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={searchPatients} 
              disabled={isSearching || !searchTerm.trim()}
            >
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Search
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium">Search Results:</p>
              {searchResults.map((patient) => (
                <div 
                  key={patient.id} 
                  className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => selectExistingPatient(patient)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{patient.first_name} {patient.last_name}</p>
                      <p className="text-sm text-gray-600">
                        {patient.email && `${patient.email} • `}
                        {patient.phone && `${patient.phone} • `}
                        {patient.age && `Age: ${patient.age}`}
                      </p>
                    </div>
                    <Button size="sm" variant="outline">Select</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Registration Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Patient Registration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="gender">Gender</Label>
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
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="chiefComplaint">Chief Complaint / Reason for Visit</Label>
              <Input
                id="chiefComplaint"
                value={formData.chiefComplaint}
                onChange={(e) => handleInputChange('chiefComplaint', e.target.value)}
                placeholder="Describe the main concern or reason for today's visit..."
              />
            </div>

            <Button type="submit" disabled={isRegistering} className="w-full">
              {isRegistering ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Registering Patient...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Register Patient & Generate Token
                </>
              )}
            </Button>
          </form>

          {message && (
            <Alert className={`mt-4 ${message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
              <AlertDescription className={message.type === 'error' ? 'text-red-800' : 'text-green-800'}>
                {message.text}
              </AlertDescription>
            </Alert>
            )}

          {registeredPatient && (
            <Card className="mt-4 border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h3 className="text-lg font-semibold text-green-800">Registration Successful!</h3>
                  <p className="text-green-700">
                    Patient: {registeredPatient.first_name} {registeredPatient.last_name}
                  </p>
                  <p className="text-2xl font-bold text-green-800 mt-2">
                    Token Number: {registeredPatient.tokenNumber}
                  </p>
                  <p className="text-sm text-green-600 mt-2">
                    Please keep this token number for your appointment
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}