"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { 
  User, 
  FileText, 
  Stethoscope, 
  Pill, 
  Save, 
  Clock,
  Phone,
  CheckCircle,
  ArrowLeft,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  Activity,
  Building
} from 'lucide-react'

interface Patient {
  visitId: string
  visitNumber: string
  patientId: string
  patientNumber: string
  patientName: string
  age: number
  gender: string
  phone?: string
  chiefComplaint: string
  symptoms?: string
  visitStatus: string
  checkinTime: string
  tokenNumber?: string
}

interface VitalSigns {
  bloodPressure?: string
  temperature?: string
  heartRate?: string
  respiratoryRate?: string
  oxygenSaturation?: string
  weight?: string
  height?: string
}

interface Prescription {
  id: string
  medication: string
  dosage: string
  frequency: string
  duration: string
  instructions: string
}

interface ConsultationData {
  chiefComplaint: string
  historyOfPresentIllness: string
  pastMedicalHistory: string
  physicalExamination: string
  vitalSigns: VitalSigns
  diagnosis: string
  treatmentPlan: string
  prescriptions: Prescription[]
  followUpDate?: string
  followUpInstructions: string
  consultationNotes: string
}

interface PatientConsultationProps {
  patient: Patient
  doctorId: string
  doctorName: string
  onClose: () => void
  onCompleteConsultation: (visitId: string) => void
}

export function PatientConsultationInterface({ 
  patient, 
  doctorId, 
  doctorName, 
  onClose, 
  onCompleteConsultation 
}: PatientConsultationProps) {
  const [consultationData, setConsultationData] = useState<ConsultationData>({
    chiefComplaint: patient.chiefComplaint || '',
    historyOfPresentIllness: '',
    pastMedicalHistory: '',
    physicalExamination: '',
    vitalSigns: {},
    diagnosis: '',
    treatmentPlan: '',
    prescriptions: [],
    followUpInstructions: '',
    consultationNotes: ''
  })

  const [saving, setSaving] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [admissionRequesting, setAdmissionRequesting] = useState(false)
  const [showAdmissionForm, setShowAdmissionForm] = useState(false)
  const [admissionData, setAdmissionData] = useState({
    reason: '',
    urgency: 'routine', // 'emergency', 'urgent', 'routine'
    wardType: '', // 'general', 'icu', 'emergency', 'surgery'
    expectedDuration: '',
    additionalNotes: ''
  })
  const [activeTab, setActiveTab] = useState('patient-history') // Start with patient history
  const [medicalHistory, setMedicalHistory] = useState<any>(null)
  const [loadingHistory, setLoadingHistory] = useState(true)

  const addPrescription = () => {
    const newPrescription: Prescription = {
      id: Date.now().toString(),
      medication: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: ''
    }
    setConsultationData(prev => ({
      ...prev,
      prescriptions: [...prev.prescriptions, newPrescription]
    }))
  }

  const updatePrescription = (id: string, field: keyof Prescription, value: string) => {
    setConsultationData(prev => ({
      ...prev,
      prescriptions: prev.prescriptions.map(p => 
        p.id === id ? { ...p, [field]: value } : p
      )
    }))
  }

  const removePrescription = (id: string) => {
    setConsultationData(prev => ({
      ...prev,
      prescriptions: prev.prescriptions.filter(p => p.id !== id)
    }))
  }

  const updateVitalSigns = (field: keyof VitalSigns, value: string) => {
    setConsultationData(prev => ({
      ...prev,
      vitalSigns: { ...prev.vitalSigns, [field]: value }
    }))
  }

  const fetchMedicalHistory = async () => {
    try {
      setLoadingHistory(true)
      console.log('🏥 Fetching medical history for patient:', patient.patientId)
      
      const response = await fetch(`/api/patients/history?patient_id=${patient.patientId}`)
      const result = await response.json()

      if (result.success) {
        console.log('✅ Medical history loaded:', result.data)
        setMedicalHistory(result.data)
      } else {
        console.error('❌ Failed to load medical history:', result.error)
        setMedicalHistory(null)
      }
    } catch (error) {
      console.error('💥 Error fetching medical history:', error)
      setMedicalHistory(null)
    } finally {
      setLoadingHistory(false)
    }
  }

  // Fetch medical history when component mounts
  useEffect(() => {
    fetchMedicalHistory()
  }, [patient.patientId])

  const saveConsultation = async () => {
    try {
      setSaving(true)
      
      const response = await fetch('/api/consultations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitId: patient.visitId,
          doctorId,
          consultationData
        })
      })

      const result = await response.json()

      if (result.success) {
        alert('Consultation saved successfully!')
      } else {
        throw new Error(result.error || 'Failed to save consultation')
      }
    } catch (error) {
      console.error('Error saving consultation:', error)
      alert(`Failed to save consultation: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const completeConsultation = async () => {
    try {
      setCompleting(true)

      // First save the consultation data to visits table
      const consultationResponse = await fetch('/api/consultations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitId: patient.visitId,
          doctorId,
          consultationData: {
            ...consultationData,
            consultationStartTime: new Date().toISOString()
          }
        })
      })

      if (!consultationResponse.ok) {
        const error = await consultationResponse.json()
        throw new Error(error.error || 'Failed to save consultation')
      }

      // Then update visit status to completed
      const statusResponse = await fetch('/api/visits/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitId: patient.visitId,
          status: 'completed'
        })
      })

      if (!statusResponse.ok) {
        const error = await statusResponse.json()
        throw new Error(error.error || 'Failed to complete consultation')
      }

      alert('Consultation completed successfully!')
      onCompleteConsultation(patient.visitId)
      onClose()
    } catch (error) {
      console.error('Error completing consultation:', error)
      alert(`Failed to complete consultation: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setCompleting(false)
    }
  }

  const requestAdmission = async () => {
    if (!admissionData.reason.trim()) {
      alert('Please provide admission reason')
      return
    }

    try {
      setAdmissionRequesting(true)

      console.log('🏥 Requesting admission for patient:', patient.patientId)
      
      const response = await fetch('/api/admissions/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patient.patientId,
          visitId: patient.visitId,
          requestedBy: doctorId,
          admissionReason: admissionData.reason,
          urgency: admissionData.urgency,
          wardType: admissionData.wardType,
          expectedDuration: admissionData.expectedDuration,
          additionalNotes: admissionData.additionalNotes,
          consultationData: consultationData // Include current consultation data
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to request admission')
      }

      const result = await response.json()
      
      alert(`Admission request submitted successfully! Admission Request #${result.admissionNumber}`)
      setShowAdmissionForm(false)
      // Optionally close consultation or keep it open
      
    } catch (error) {
      console.error('Error requesting admission:', error)
      alert(`Failed to request admission: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setAdmissionRequesting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-[98vw] h-[98vh] flex flex-col m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={onClose}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Queue
            </Button>
            <div>
              <h1 className="text-xl font-bold">Patient Consultation</h1>
              <p className="text-sm text-gray-600">Dr. {doctorName}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={saveConsultation}
              disabled={saving}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Draft'}
            </Button>

            <Button 
              variant="outline"
              onClick={() => setShowAdmissionForm(true)}
              className="bg-orange-50 text-orange-600 border-orange-300 hover:bg-orange-100"
            >
              <Building className="h-4 w-4 mr-2" />
              Request Admission
            </Button>
            
            <Button 
              onClick={completeConsultation}
              disabled={completing}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {completing ? 'Completing...' : 'Complete Consultation'}
            </Button>
          </div>
        </div>

        {/* Patient Info */}
        <div className="bg-blue-50 p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 text-blue-600 rounded-full w-12 h-12 flex items-center justify-center font-bold">
                {patient.tokenNumber}
              </div>
              <div>
                <h2 className="font-semibold text-lg">{patient.patientName}</h2>
                <p className="text-gray-600">{patient.age} years, {patient.gender}</p>
                <p className="text-sm text-gray-500">Patient ID: {patient.patientNumber}</p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-sm text-gray-600">Visit Number: {patient.visitNumber}</p>
              <p className="text-sm text-gray-600">Check-in: {new Date(patient.checkinTime).toLocaleString()}</p>
              {patient.phone && (
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {patient.phone}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Consultation Content */}
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-6 m-4">
              <TabsTrigger value="patient-history">Patient History</TabsTrigger>
              <TabsTrigger value="history">History & Examination</TabsTrigger>
              <TabsTrigger value="vitals">Vital Signs</TabsTrigger>
              <TabsTrigger value="diagnosis">Diagnosis & Plan</TabsTrigger>
              <TabsTrigger value="prescription">Prescription</TabsTrigger>
              <TabsTrigger value="notes">Notes & Follow-up</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-auto px-4 pb-4">
              {/* Patient Medical History Tab */}
              <TabsContent value="patient-history" className="mt-0">
                <div className="space-y-6">
                  {loadingHistory ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading medical history...</p>
                      </div>
                    </div>
                  ) : medicalHistory ? (
                    <>
                      {/* Patient Summary */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Patient Overview
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="font-medium text-gray-600">Total Visits</p>
                              <p className="text-xl font-bold text-blue-600">{medicalHistory.totalVisits}</p>
                            </div>
                            <div>
                              <p className="font-medium text-gray-600">Last Visit</p>
                              <p className="font-semibold">{medicalHistory.summary?.lastVisitDate ? new Date(medicalHistory.summary.lastVisitDate).toLocaleDateString() : 'N/A'}</p>
                            </div>
                            <div>
                              <p className="font-medium text-gray-600">Active Medications</p>
                              <p className="text-xl font-bold text-green-600">{medicalHistory.currentMedications?.length || 0}</p>
                            </div>
                            <div>
                              <p className="font-medium text-gray-600">Blood Group</p>
                              <p className="font-semibold">{medicalHistory.patient?.blood_group || 'Unknown'}</p>
                            </div>
                          </div>
                          {medicalHistory.patient?.allergies && (
                            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                              <p className="font-medium text-red-800 flex items-center gap-2">
                                <AlertCircle className="h-4 w-4" />
                                Allergies
                              </p>
                              <p className="text-red-700">{medicalHistory.patient.allergies}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Current Active Medications */}
                      {medicalHistory.currentMedications && medicalHistory.currentMedications.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Pill className="h-5 w-5" />
                              Current Active Medications
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {medicalHistory.currentMedications.map((med: any) => (
                                <div key={med.id} className="flex justify-between items-center p-3 bg-green-50 border border-green-200 rounded-lg">
                                  <div>
                                    <p className="font-semibold text-green-800">{med.medication_name}</p>
                                    <p className="text-sm text-green-600">{med.dosage} • {med.frequency}</p>
                                    {med.instructions && <p className="text-sm text-gray-600 italic">{med.instructions}</p>}
                                  </div>
                                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                                    {med.order_status}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Recent Visits History */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Recent Medical History (Last 5 Visits)
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {medicalHistory.recentVisits?.map((visit: any) => (
                              <div key={visit.id} className="border-l-4 border-blue-500 pl-4 pb-4">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <p className="font-semibold text-gray-900">
                                      {new Date(visit.visit_date).toLocaleDateString()} - {visit.visit_type?.toUpperCase()}
                                    </p>
                                    <p className="text-sm text-gray-600">{visit.doctor} • {visit.department}</p>
                                  </div>
                                  <Badge variant={visit.visit_status === 'completed' ? 'default' : 'secondary'}>
                                    {visit.visit_status}
                                  </Badge>
                                </div>
                                
                                {visit.chief_complaint && (
                                  <div className="mb-2">
                                    <p className="text-sm font-medium text-gray-700">Chief Complaint:</p>
                                    <p className="text-sm text-gray-600">{visit.chief_complaint}</p>
                                  </div>
                                )}
                                
                                {visit.diagnosis && (
                                  <div className="mb-2">
                                    <p className="text-sm font-medium text-gray-700">Diagnosis:</p>
                                    <p className="text-sm text-gray-600">{visit.diagnosis}</p>
                                  </div>
                                )}

                                {/* Latest Vitals for this visit */}
                                {visit.vitals && visit.vitals.length > 0 && (
                                  <div className="mb-2">
                                    <p className="text-sm font-medium text-gray-700">Vitals:</p>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                      {visit.vitals[0].systolic_bp && (
                                        <span>BP: {visit.vitals[0].systolic_bp}/{visit.vitals[0].diastolic_bp}</span>
                                      )}
                                      {visit.vitals[0].temperature && (
                                        <span>Temp: {visit.vitals[0].temperature}°F</span>
                                      )}
                                      {visit.vitals[0].heart_rate && (
                                        <span>HR: {visit.vitals[0].heart_rate} bpm</span>
                                      )}
                                      {visit.vitals[0].oxygen_saturation && (
                                        <span>O2: {visit.vitals[0].oxygen_saturation}%</span>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Medications prescribed in this visit */}
                                {visit.medications && visit.medications.length > 0 && (
                                  <div className="mb-2">
                                    <p className="text-sm font-medium text-gray-700">Medications Prescribed:</p>
                                    <div className="text-xs text-gray-600 space-y-1">
                                      {visit.medications.slice(0, 3).map((med: any) => (
                                        <div key={med.id}>
                                          • {med.medication_name} - {med.dosage} {med.frequency}
                                        </div>
                                      ))}
                                      {visit.medications.length > 3 && (
                                        <div className="text-blue-600">+ {visit.medications.length - 3} more...</div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Common Diagnoses */}
                      {medicalHistory.commonDiagnoses && medicalHistory.commonDiagnoses.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Stethoscope className="h-5 w-5" />
                              Recurring Conditions
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-wrap gap-2">
                              {medicalHistory.commonDiagnoses.map((diagnosis: any) => (
                                <Badge key={diagnosis.diagnosis} variant="outline" className="bg-yellow-50 border-yellow-300">
                                  {diagnosis.diagnosis} ({diagnosis.count}x)
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </>
                  ) : (
                    <Card>
                      <CardContent className="text-center py-12">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No medical history available for this patient.</p>
                        <p className="text-sm text-gray-500 mt-2">
                          This might be the patient's first visit, or the patient ID might not match previous records.
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Patient ID: {patient.patientId}
                        </p>
                        <p className="text-xs text-gray-400">
                          Phone: {patient.phone || 'N/A'}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="history" className="mt-0">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Chief Complaint
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={consultationData.chiefComplaint}
                        onChange={(e) => setConsultationData(prev => ({ ...prev, chiefComplaint: e.target.value }))}
                        placeholder="Patient's main concern or reason for visit..."
                        className="min-h-20"
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>History of Present Illness</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={consultationData.historyOfPresentIllness}
                        onChange={(e) => setConsultationData(prev => ({ ...prev, historyOfPresentIllness: e.target.value }))}
                        placeholder="Detailed history of current illness, timeline, symptoms progression..."
                        className="min-h-32"
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Past Medical History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={consultationData.pastMedicalHistory}
                        onChange={(e) => setConsultationData(prev => ({ ...prev, pastMedicalHistory: e.target.value }))}
                        placeholder="Previous illnesses, surgeries, medications, allergies..."
                        className="min-h-24"
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Stethoscope className="h-5 w-5" />
                        Physical Examination
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={consultationData.physicalExamination}
                        onChange={(e) => setConsultationData(prev => ({ ...prev, physicalExamination: e.target.value }))}
                        placeholder="General appearance, system-wise examination findings..."
                        className="min-h-32"
                      />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="vitals" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Vital Signs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div>
                        <Label htmlFor="bp">Blood Pressure (mmHg)</Label>
                        <Input
                          id="bp"
                          value={consultationData.vitalSigns.bloodPressure || ''}
                          onChange={(e) => updateVitalSigns('bloodPressure', e.target.value)}
                          placeholder="120/80"
                        />
                      </div>

                      <div>
                        <Label htmlFor="temp">Temperature (°F)</Label>
                        <Input
                          id="temp"
                          value={consultationData.vitalSigns.temperature || ''}
                          onChange={(e) => updateVitalSigns('temperature', e.target.value)}
                          placeholder="98.6"
                        />
                      </div>

                      <div>
                        <Label htmlFor="hr">Heart Rate (bpm)</Label>
                        <Input
                          id="hr"
                          value={consultationData.vitalSigns.heartRate || ''}
                          onChange={(e) => updateVitalSigns('heartRate', e.target.value)}
                          placeholder="72"
                        />
                      </div>

                      <div>
                        <Label htmlFor="rr">Respiratory Rate (rpm)</Label>
                        <Input
                          id="rr"
                          value={consultationData.vitalSigns.respiratoryRate || ''}
                          onChange={(e) => updateVitalSigns('respiratoryRate', e.target.value)}
                          placeholder="16"
                        />
                      </div>

                      <div>
                        <Label htmlFor="spo2">Oxygen Saturation (%)</Label>
                        <Input
                          id="spo2"
                          value={consultationData.vitalSigns.oxygenSaturation || ''}
                          onChange={(e) => updateVitalSigns('oxygenSaturation', e.target.value)}
                          placeholder="98"
                        />
                      </div>

                      <div>
                        <Label htmlFor="weight">Weight (kg)</Label>
                        <Input
                          id="weight"
                          value={consultationData.vitalSigns.weight || ''}
                          onChange={(e) => updateVitalSigns('weight', e.target.value)}
                          placeholder="70"
                        />
                      </div>

                      <div>
                        <Label htmlFor="height">Height (cm)</Label>
                        <Input
                          id="height"
                          value={consultationData.vitalSigns.height || ''}
                          onChange={(e) => updateVitalSigns('height', e.target.value)}
                          placeholder="170"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="diagnosis" className="mt-0">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Clinical Diagnosis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={consultationData.diagnosis}
                        onChange={(e) => setConsultationData(prev => ({ ...prev, diagnosis: e.target.value }))}
                        placeholder="Primary and secondary diagnosis with ICD codes if available..."
                        className="min-h-24"
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Treatment Plan</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={consultationData.treatmentPlan}
                        onChange={(e) => setConsultationData(prev => ({ ...prev, treatmentPlan: e.target.value }))}
                        placeholder="Treatment approach, investigations needed, lifestyle modifications..."
                        className="min-h-24"
                      />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="prescription" className="mt-0">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Pill className="h-5 w-5" />
                        Prescription
                      </CardTitle>
                      <Button onClick={addPrescription}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Medication
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {consultationData.prescriptions.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Pill className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No medications prescribed yet</p>
                        <Button variant="outline" onClick={addPrescription} className="mt-2">
                          Add First Medication
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {consultationData.prescriptions.map((prescription, index) => (
                          <div key={prescription.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="font-medium">Medication {index + 1}</h3>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => removePrescription(prescription.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              <div>
                                <Label>Medication Name</Label>
                                <Input
                                  value={prescription.medication}
                                  onChange={(e) => updatePrescription(prescription.id, 'medication', e.target.value)}
                                  placeholder="e.g., Paracetamol"
                                />
                              </div>
                              
                              <div>
                                <Label>Dosage</Label>
                                <Input
                                  value={prescription.dosage}
                                  onChange={(e) => updatePrescription(prescription.id, 'dosage', e.target.value)}
                                  placeholder="e.g., 500mg"
                                />
                              </div>
                              
                              <div>
                                <Label>Frequency</Label>
                                <Select
                                  value={prescription.frequency}
                                  onValueChange={(value) => updatePrescription(prescription.id, 'frequency', value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select frequency" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="once_daily">Once Daily</SelectItem>
                                    <SelectItem value="twice_daily">Twice Daily</SelectItem>
                                    <SelectItem value="thrice_daily">Thrice Daily</SelectItem>
                                    <SelectItem value="four_times_daily">Four Times Daily</SelectItem>
                                    <SelectItem value="as_needed">As Needed</SelectItem>
                                    <SelectItem value="before_meals">Before Meals</SelectItem>
                                    <SelectItem value="after_meals">After Meals</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div>
                                <Label>Duration</Label>
                                <Input
                                  value={prescription.duration}
                                  onChange={(e) => updatePrescription(prescription.id, 'duration', e.target.value)}
                                  placeholder="e.g., 7 days"
                                />
                              </div>
                              
                              <div className="md:col-span-2">
                                <Label>Instructions</Label>
                                <Input
                                  value={prescription.instructions}
                                  onChange={(e) => updatePrescription(prescription.id, 'instructions', e.target.value)}
                                  placeholder="e.g., Take with food, avoid alcohol"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notes" className="mt-0">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Follow-up Instructions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="followup-date">Follow-up Date (if needed)</Label>
                          <Input
                            id="followup-date"
                            type="date"
                            value={consultationData.followUpDate || ''}
                            onChange={(e) => setConsultationData(prev => ({ ...prev, followUpDate: e.target.value }))}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="followup-instructions">Follow-up Instructions</Label>
                          <Textarea
                            id="followup-instructions"
                            value={consultationData.followUpInstructions}
                            onChange={(e) => setConsultationData(prev => ({ ...prev, followUpInstructions: e.target.value }))}
                            placeholder="When to return, warning signs to watch for, lifestyle advice..."
                            className="min-h-24"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Additional Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={consultationData.consultationNotes}
                        onChange={(e) => setConsultationData(prev => ({ ...prev, consultationNotes: e.target.value }))}
                        placeholder="Any additional observations, patient education provided, etc..."
                        className="min-h-24"
                      />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      {/* Admission Request Form Dialog */}
      {showAdmissionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg w-full max-w-2xl m-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Request Patient Admission</h2>
              <Button variant="outline" size="sm" onClick={() => setShowAdmissionForm(false)}>
                ✕
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="admission-reason">Admission Reason *</Label>
                <Textarea
                  id="admission-reason"
                  value={admissionData.reason}
                  onChange={(e) => setAdmissionData(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Medical reason for admission, current condition requiring hospitalization..."
                  className="min-h-20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="urgency">Urgency Level</Label>
                  <Select value={admissionData.urgency} onValueChange={(value) => setAdmissionData(prev => ({ ...prev, urgency: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select urgency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="emergency">🔴 Emergency</SelectItem>
                      <SelectItem value="urgent">🟠 Urgent</SelectItem>
                      <SelectItem value="routine">🟢 Routine</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="ward-type">Preferred Ward Type</Label>
                  <Select value={admissionData.wardType} onValueChange={(value) => setAdmissionData(prev => ({ ...prev, wardType: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select ward type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Ward</SelectItem>
                      <SelectItem value="icu">ICU</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                      <SelectItem value="surgery">Surgery</SelectItem>
                      <SelectItem value="cardiology">Cardiology</SelectItem>
                      <SelectItem value="pediatric">Pediatric</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="expected-duration">Expected Duration</Label>
                <Input
                  id="expected-duration"
                  value={admissionData.expectedDuration}
                  onChange={(e) => setAdmissionData(prev => ({ ...prev, expectedDuration: e.target.value }))}
                  placeholder="e.g., 3-5 days, 1 week, etc."
                />
              </div>

              <div>
                <Label htmlFor="additional-notes">Additional Notes</Label>
                <Textarea
                  id="additional-notes"
                  value={admissionData.additionalNotes}
                  onChange={(e) => setAdmissionData(prev => ({ ...prev, additionalNotes: e.target.value }))}
                  placeholder="Special requirements, allergies, family contact info, etc..."
                  className="min-h-16"
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowAdmissionForm(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={requestAdmission}
                  disabled={admissionRequesting || !admissionData.reason.trim()}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <Building className="h-4 w-4 mr-2" />
                  {admissionRequesting ? 'Requesting...' : 'Submit Admission Request'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}