import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export function PatientHistoryDebugger() {
  const [searchQuery, setSearchQuery] = useState('')
  const [patientId, setPatientId] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [historyResults, setHistoryResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const searchPatients = async () => {
    if (!searchQuery.trim()) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/patients/search?q=${encodeURIComponent(searchQuery)}`)
      const result = await response.json()
      
      console.log('🔍 Search results:', result)
      setSearchResults(result.data || [])
    } catch (error) {
      console.error('❌ Search error:', error)
      setSearchResults([])
    } finally {
      setLoading(false)
    }
  }

  const getPatientHistory = async (id: string) => {
    if (!id.trim()) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/patients/history?patient_id=${id}`)
      const result = await response.json()
      
      console.log('🏥 History results:', result)
      setHistoryResults(result)
    } catch (error) {
      console.error('❌ History error:', error)
      setHistoryResults({ success: false, error: 'Failed to fetch history' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔍 Patient Search & History Debugger</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search by name, phone, CNIC, or patient number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchPatients()}
            />
            <Button onClick={searchPatients} disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">Search Results:</h3>
              {searchResults.map((patient) => (
                <div key={patient.id} className="p-3 border rounded flex items-center justify-between">
                  <div>
                    <p className="font-medium">{patient.first_name} {patient.last_name}</p>
                    <p className="text-sm text-gray-600">
                      ID: {patient.id} | Patient #: {patient.patient_number}
                    </p>
                    <p className="text-sm text-gray-600">
                      Phone: {patient.phone} | CNIC: {patient.cnic}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setPatientId(patient.id)
                      getPatientHistory(patient.id)
                    }}
                  >
                    Get History
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="border-t pt-4">
            <div className="flex gap-2">
              <Input
                placeholder="Or enter patient ID directly..."
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && getPatientHistory(patientId)}
              />
              <Button onClick={() => getPatientHistory(patientId)} disabled={loading}>
                {loading ? 'Loading...' : 'Get History'}
              </Button>
            </div>
          </div>

          {historyResults && (
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Medical History Results:</h3>
              <div className="bg-gray-50 p-4 rounded">
                {historyResults.success ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-500 text-white">Success</Badge>
                      <span>Found medical history for patient</span>
                    </div>
                    
                    {historyResults.data?.patient && (
                      <div>
                        <h4 className="font-medium">Patient Info:</h4>
                        <p>{historyResults.data.patient.first_name} {historyResults.data.patient.last_name}</p>
                        <p className="text-sm text-gray-600">
                          Phone: {historyResults.data.patient.phone} | 
                          Age: {historyResults.data.patient.age || 'N/A'} |
                          Blood Group: {historyResults.data.patient.blood_group || 'N/A'}
                        </p>
                      </div>
                    )}

                    {historyResults.data?.visits && (
                      <div>
                        <h4 className="font-medium">Visit History ({historyResults.data.visits.length} visits):</h4>
                        {historyResults.data.visits.map((visit: any, index: number) => (
                          <div key={index} className="ml-4 p-2 border-l-2 border-blue-200">
                            <p className="text-sm">
                              <strong>Date:</strong> {new Date(visit.visit_date).toLocaleDateString()}
                            </p>
                            <p className="text-sm">
                              <strong>Chief Complaint:</strong> {visit.chief_complaint || 'N/A'}
                            </p>
                            <p className="text-sm">
                              <strong>Status:</strong> {visit.visit_status}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {historyResults.data?.medications && historyResults.data.medications.length > 0 && (
                      <div>
                        <h4 className="font-medium">Current Medications ({historyResults.data.medications.length}):</h4>
                        {historyResults.data.medications.map((med: any, index: number) => (
                          <div key={index} className="ml-4 text-sm">
                            <p><strong>{med.medication_name}</strong> - {med.dosage} {med.frequency}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-red-500 text-white">Error</Badge>
                      <span>Failed to get medical history</span>
                    </div>
                    <p className="text-sm text-red-600">{historyResults.error}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}