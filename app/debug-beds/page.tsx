'use client'

import { useEffect, useState } from 'react'

interface BedData {
  id: string
  bed_number: string
  status: string
  current_patient_id: string | null
  ward_id: string
}

interface AdmissionData {
  id: string
  bed_id: string
  patient_id: string
  admission_status: string
}

interface DebugData {
  success: boolean
  beds: BedData[]
  admissions: AdmissionData[]
  summary: {
    totalBeds: number
    occupiedBeds: number
    activeAdmissions: number
  }
}

export default function DebugBedsPage() {
  const [data, setData] = useState<DebugData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/ward-admin/debug-beds')
      .then(res => res.json())
      .then(data => {
        setData(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  if (loading) return <div className="p-4">Loading debug data...</div>
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>
  if (!data) return <div className="p-4">No data available</div>

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Database Debug - Beds & Admissions</h1>
      
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-100 p-4 rounded">
          <h3 className="font-semibold">Total Beds</h3>
          <p className="text-2xl">{data.summary.totalBeds}</p>
        </div>
        <div className="bg-green-100 p-4 rounded">
          <h3 className="font-semibold">Occupied Beds</h3>
          <p className="text-2xl">{data.summary.occupiedBeds}</p>
        </div>
        <div className="bg-yellow-100 p-4 rounded">
          <h3 className="font-semibold">Active Admissions</h3>
          <p className="text-2xl">{data.summary.activeAdmissions}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">All Beds</h2>
          <div className="bg-gray-50 p-4 rounded max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">ID</th>
                  <th className="text-left p-2">Bed #</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Patient ID</th>
                </tr>
              </thead>
              <tbody>
                {data.beds.map(bed => (
                  <tr key={bed.id} className={bed.status === 'occupied' ? 'bg-green-50' : ''}>
                    <td className="p-2">{bed.id}</td>
                    <td className="p-2">{bed.bed_number}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        bed.status === 'occupied' ? 'bg-green-200 text-green-800' : 
                        bed.status === 'available' ? 'bg-blue-200 text-blue-800' : 
                        'bg-gray-200 text-gray-800'
                      }`}>
                        {bed.status}
                      </span>
                    </td>
                    <td className="p-2">{bed.current_patient_id || 'None'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Active Admissions</h2>
          <div className="bg-gray-50 p-4 rounded max-h-96 overflow-y-auto">
            {data.admissions.length === 0 ? (
              <p className="text-gray-500">No active admissions found</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">ID</th>
                    <th className="text-left p-2">Bed ID</th>
                    <th className="text-left p-2">Patient ID</th>
                    <th className="text-left p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.admissions.map(admission => (
                    <tr key={admission.id}>
                      <td className="p-2">{admission.id}</td>
                      <td className="p-2">{admission.bed_id}</td>
                      <td className="p-2">{admission.patient_id}</td>
                      <td className="p-2">{admission.admission_status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-yellow-50 rounded">
        <h3 className="font-semibold mb-2">Analysis</h3>
        <p>
          If you have {data.summary.occupiedBeds} occupied beds but {data.summary.activeAdmissions} active admissions, 
          this explains why the patient info modal shows "No Patient Records Available".
        </p>
        {data.summary.occupiedBeds > data.summary.activeAdmissions && (
          <p className="mt-2 text-orange-600 font-medium">
            ⚠️ Data Inconsistency: Some beds are marked as occupied but have no corresponding admission records.
          </p>
        )}
      </div>
    </div>
  )
}