import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { CalendarDays, User, Phone, Mail, MapPin, Heart, UserCheck, Stethoscope, Bed } from 'lucide-react'

interface PatientDetails {
  id: string
  bed_number: string
  bed_type: string
  bed_status: string
  visits?: {
    chief_complaint?: string
    symptoms?: string
    diagnosis?: string
    treatment_plan?: string
  }
  admission: {
    id: string
    admission_number: string
    admission_reason: string
    admission_type: string
    admission_date: string
    expected_discharge_date?: string
    admission_status: string
    diagnosis?: string
    treatment_plan?: string
    created_at: string
    patient: {
      id: string
      first_name: string
      last_name: string
      patient_number: string
      date_of_birth: string
      gender: string
      phone?: string
      email?: string
      address?: string
      emergency_contact?: string
      blood_group?: string
      allergies?: string
      medical_history?: string
      father_name?: string
      cnic?: string
      marital_status?: string
      occupation?: string
      created_at: string
    }
    requesting_doctor?: {
      id: string
      first_name: string
      last_name: string
      specialization?: string
      department?: string
    }
    assigned_doctor?: {
      id: string
      first_name: string
      last_name: string
      specialization?: string
      department?: string
    }
  }
  ward: {
    id: string
    name: string
    ward_type: string
    capacity: number
  }
}

interface PatientInfoModalProps {
  isOpen: boolean
  onClose: () => void
  patientDetails: PatientDetails | null
  loading: boolean
}

export function PatientInfoModal({ isOpen, onClose, patientDetails, loading }: PatientInfoModalProps) {
  if (!patientDetails && !loading) return null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const calculateAge = (birthDate: string) => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'discharged': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Patient Information
          </DialogTitle>
          <DialogDescription>
            View detailed patient information and admission details
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading patient details...</span>
          </div>
        ) : patientDetails ? (
          <div className="space-y-6">
            {/* Check if admission data exists */}
            {!patientDetails.admission ? (
              <div className="text-center py-8">
                <div className="mb-4">
                  <Bed className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                  <h3 className="text-lg font-medium text-gray-900">Bed Information</h3>
                  <p className="text-sm text-gray-600">Bed {patientDetails.bed_number} in {patientDetails.ward.name}</p>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 font-medium">No Patient Records Available</p>
                  <p className="text-yellow-700 text-sm mt-1">
                    This bed is marked as occupied but no active admission record was found.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Patient Header */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl">
                          {patientDetails.admission.patient.first_name} {patientDetails.admission.patient.last_name}
                        </CardTitle>
                        <p className="text-sm text-gray-600">
                          Patient ID: {patientDetails.admission.patient.patient_number}
                        </p>
                        {patientDetails.admission.patient.father_name && (
                          <p className="text-sm text-gray-600">Father's Name: {patientDetails.admission.patient.father_name}</p>
                        )}
                        {patientDetails.admission.patient.cnic && (
                          <p className="text-sm text-gray-600">CNIC: {patientDetails.admission.patient.cnic}</p>
                        )}
                        {patientDetails.admission.patient.marital_status && (
                          <p className="text-sm text-gray-600">Marital Status: {patientDetails.admission.patient.marital_status}</p>
                        )}
                        {patientDetails.admission.patient.occupation && (
                          <p className="text-sm text-gray-600">Occupation: {patientDetails.admission.patient.occupation}</p>
                        )}
                      </div>
                      <Badge className={getStatusColor(patientDetails.admission.admission_status)}>
                        {patientDetails.admission.admission_status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium">Age</p>
                          <p className="text-sm text-gray-600">
                            {calculateAge(patientDetails.admission.patient.date_of_birth)} years
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium">Gender</p>
                          <p className="text-sm text-gray-600">{patientDetails.admission.patient.gender}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium">Blood Type</p>
                          <p className="text-sm text-gray-600">
                            {patientDetails.admission.patient.blood_group || 'Not specified'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Bed & Ward Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Bed Assignment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm font-medium">Bed Number</p>
                        <p className="text-sm text-gray-600">{patientDetails.bed_number}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Bed Type</p>
                        <p className="text-sm text-gray-600">{patientDetails.bed_type}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Ward</p>
                        <p className="text-sm text-gray-600">{patientDetails.ward.name}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Admission Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Admission Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium">Admission Number</p>
                        <p className="text-sm text-gray-600">{patientDetails.admission.admission_number}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Admission Type</p>
                        <p className="text-sm text-gray-600">{patientDetails.admission.admission_type}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Admission Date</p>
                        <p className="text-sm text-gray-600">
                          {formatDate(patientDetails.admission.admission_date)}
                        </p>
                      </div>
                      {patientDetails.admission.expected_discharge_date && (
                        <div>
                          <p className="text-sm font-medium">Expected Discharge</p>
                          <p className="text-sm text-gray-600">
                            {formatDate(patientDetails.admission.expected_discharge_date)}
                          </p>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">Reason for Admission</p>
                      <p className="text-sm text-gray-600">{patientDetails.admission.admission_reason}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Clinical Information */}
                {(patientDetails.admission.diagnosis || patientDetails.admission.treatment_plan) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Stethoscope className="h-5 w-5" />
                        Clinical Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {patientDetails.visits?.chief_complaint && (
                        <div>
                          <p className="text-sm font-medium text-purple-700">Chief Complaint</p>
                          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mt-1">
                            <p className="text-sm text-purple-900">{patientDetails.visits.chief_complaint}</p>
                          </div>
                        </div>
                      )}
                      {patientDetails.visits?.symptoms && (
                        <div>
                          <p className="text-sm font-medium text-orange-700">Symptoms</p>
                          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-1">
                            <p className="text-sm text-orange-900">{patientDetails.visits.symptoms}</p>
                          </div>
                        </div>
                      )}
                      {patientDetails.admission.diagnosis && (
                        <div>
                          <p className="text-sm font-medium text-blue-700">Diagnosis</p>
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-1">
                            <p className="text-sm text-blue-900">{patientDetails.admission.diagnosis}</p>
                          </div>
                        </div>
                      )}
                      {patientDetails.admission.treatment_plan && (
                        <div>
                          <p className="text-sm font-medium text-green-700">Treatment Plan</p>
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-1">
                            <p className="text-sm text-green-900">{patientDetails.admission.treatment_plan}</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Contact Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {patientDetails.admission.patient.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium">Phone</p>
                            <p className="text-sm text-gray-600">{patientDetails.admission.patient.phone}</p>
                          </div>
                        </div>
                      )}
                      {patientDetails.admission.patient.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium">Email</p>
                            <p className="text-sm text-gray-600">{patientDetails.admission.patient.email}</p>
                          </div>
                        </div>
                      )}
                      {patientDetails.admission.patient.address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium">Address</p>
                            <p className="text-sm text-gray-600">{patientDetails.admission.patient.address}</p>
                          </div>
                        </div>
                      )}
                      {patientDetails.admission.patient.emergency_contact && (
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium">Emergency Contact</p>
                            <p className="text-sm text-gray-600">
                              {patientDetails.admission.patient.emergency_contact}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Medical Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Medical Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {patientDetails.admission.patient.allergies && (
                      <div>
                        <p className="text-sm font-medium text-red-600">Allergies</p>
                        <p className="text-sm text-gray-600">{patientDetails.admission.patient.allergies}</p>
                      </div>
                    )}
                    {patientDetails.admission.patient.medical_history && (
                      <div>
                        <p className="text-sm font-medium">Medical History</p>
                        <p className="text-sm text-gray-600">{patientDetails.admission.patient.medical_history}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Doctor Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Medical Team</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {patientDetails.admission.requesting_doctor && (
                        <div className="flex items-center gap-2">
                          <Stethoscope className="h-4 w-4 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium">Requesting Doctor</p>
                            <p className="text-sm text-gray-600">
                              Dr. {patientDetails.admission.requesting_doctor.first_name} {patientDetails.admission.requesting_doctor.last_name}
                            </p>
                            {patientDetails.admission.requesting_doctor.specialization && (
                              <p className="text-xs text-gray-500">{patientDetails.admission.requesting_doctor.specialization}</p>
                            )}
                          </div>
                        </div>
                      )}
                      {patientDetails.admission.assigned_doctor && (
                        <div className="flex items-center gap-2">
                          <Stethoscope className="h-4 w-4 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium">Assigned Doctor</p>
                            <p className="text-sm text-gray-600">
                              Dr. {patientDetails.admission.assigned_doctor.first_name} {patientDetails.admission.assigned_doctor.last_name}
                            </p>
                            {patientDetails.admission.assigned_doctor.specialization && (
                              <p className="text-xs text-gray-500">{patientDetails.admission.assigned_doctor.specialization}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Close Button */}
            <div className="flex justify-end pt-4">
              <Button onClick={onClose} variant="outline">
                Close
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600">No patient details available</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}