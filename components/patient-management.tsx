"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Loader2,
  User,
  Calendar,
  FileText,
  Plus,
  ArrowLeft,
  AlertCircle,
  Stethoscope,
  Activity,
  Clock,
  TrendingUp,
  Search,
  RefreshCw,
} from "lucide-react"
import { searchPatients, createPatient, getPatientVisits, type Patient, type Visit } from "@/app/actions"
import { DiagnosticForm } from "@/components/diagnostic-form"

type ViewState = "search" | "patient-details" | "new-visit" | "visit-history"

export function PatientManagement() {
  // Search state
  const [searchName, setSearchName] = useState("")
  const [searchFatherName, setSearchFatherName] = useState("")
  const [searchAge, setSearchAge] = useState("")
  const [searchResults, setSearchResults] = useState<Patient[]>([])
  const [searching, setSearching] = useState(false)

  // Current state
  const [currentView, setCurrentView] = useState<ViewState>("search")
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [patientVisits, setPatientVisits] = useState<Visit[]>([])
  const [visitCount, setVisitCount] = useState(0)

  // General state
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingVisits, setLoadingVisits] = useState(false)

  // Auto-search as user types
  useEffect(() => {
    const searchTimer = setTimeout(() => {
      if (searchName.trim() || searchFatherName.trim() || searchAge.trim()) {
        handleSearch()
      } else {
        setSearchResults([])
      }
    }, 500)

    return () => clearTimeout(searchTimer)
  }, [searchName, searchFatherName, searchAge])

  const handleSearch = async () => {
    try {
      setSearching(true)
      setError(null)
      console.log("🔍 Searching for patients with:", { searchName, searchFatherName, searchAge })

      const age = searchAge ? Number.parseInt(searchAge) : undefined
      const results = await searchPatients(searchName, searchFatherName, age)
      console.log("✅ Found patients:", results)

      setSearchResults(results)
    } catch (err: any) {
      console.error("❌ Search error:", err)
      setError(`Failed to search patients: ${err.message}`)
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  // Function to refresh visit data - FORCE LOAD EVERY TIME
  const refreshVisitData = async (patientId: string, forceLoad = false) => {
    try {
      setLoadingVisits(true)
      setError(null)
      console.log("🔄 Refreshing visit data for patient:", patientId, "Force load:", forceLoad)

      // Always try to load visits, with multiple retry attempts
      const visits = await getPatientVisits(patientId)
      console.log("✅ Loaded visits:", visits.length)

      setPatientVisits(visits)

      // Use the patient's Count field from Airtable as the authoritative source
      const patientCount = selectedPatient?.count || 0
      console.log("📊 Using patient count from Airtable:", patientCount)
      setVisitCount(patientCount)

      return visits
    } catch (err: any) {
      console.error("❌ Error refreshing visits:", err)
      // Keep the patient count even on error
      const patientCount = selectedPatient?.count || 0
      setVisitCount(patientCount)
      setError(
        `Visit history loading failed. Visit count from records: ${patientCount}. You can try refreshing manually.`,
      )
      return []
    } finally {
      setLoadingVisits(false)
    }
  }

  const handleSelectPatient = async (patient: Patient) => {
    try {
      setLoading(true)
      setError(null)

      console.log("👤 Selecting patient:", patient)
      setSelectedPatient(patient)
      setVisitCount(patient.count || 0)

      // ALWAYS try to load visit history immediately with aggressive retry
      console.log("📋 Force loading visits for patient:", patient.id)
      setLoadingVisits(true)

      try {
        // Multiple attempts to load visits
        let visits: Visit[] = []
        let attempts = 0
        const maxAttempts = 3

        while (attempts < maxAttempts && visits.length === 0 && patient.count > 0) {
          attempts++
          console.log(`🔄 Visit loading attempt ${attempts}/${maxAttempts}`)

          visits = await getPatientVisits(patient.id)

          if (visits.length === 0 && patient.count > 0) {
            console.log(`⏰ No visits loaded, waiting 2s before retry...`)
            await new Promise((resolve) => setTimeout(resolve, 2000))
          }
        }

        setPatientVisits(visits)
        console.log(`✅ Final visit load result: ${visits.length} visits loaded`)

        if (visits.length === 0 && patient.count > 0) {
          setError(
            `Patient has ${patient.count} visits in records, but visit details could not be loaded. Try refreshing manually.`,
          )
        }
      } catch (visitError) {
        console.warn("⚠️ Could not load visit history:", visitError)
        setPatientVisits([])
        setError(`Could not load visit history. Patient has ${patient.count} visits according to records.`)
      } finally {
        setLoadingVisits(false)
      }

      setCurrentView("patient-details")
    } catch (err: any) {
      console.error("❌ Select patient error:", err)
      setError(`Failed to load patient: ${err.message}`)
      setSelectedPatient(patient)
      setPatientVisits([])
      setVisitCount(patient.count || 0)
      setCurrentView("patient-details")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNewPatient = async () => {
    if (!searchName.trim() || !searchFatherName.trim() || !searchAge.trim()) {
      setError("Please fill in all fields to create a new patient")
      return
    }

    try {
      setLoading(true)
      setError(null)

      const age = Number.parseInt(searchAge)
      if (isNaN(age) || age <= 0) {
        throw new Error("Please enter a valid age")
      }

      const newPatient = await createPatient(searchName, searchFatherName, age)
      console.log("✅ Patient created successfully:", newPatient)

      setSelectedPatient(newPatient)
      setPatientVisits([])
      setVisitCount(newPatient.count || 0)
      setCurrentView("patient-details")

      // Clear search fields
      setSearchName("")
      setSearchFatherName("")
      setSearchAge("")
      setSearchResults([])
    } catch (err: any) {
      console.error("❌ Create patient error:", err)
      setError(`Failed to create patient: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleVisitCreated = async (newVisit: Visit) => {
    try {
      console.log("🆕 New visit created:", newVisit)

      if (selectedPatient) {
        const updatedPatient = {
          ...selectedPatient,
          count: selectedPatient.count + 1,
        }
        setSelectedPatient(updatedPatient)
        setVisitCount(updatedPatient.count)

        await refreshVisitData(selectedPatient.id, true)
      }

      setCurrentView("patient-details")
    } catch (err: any) {
      console.error("❌ Error refreshing visits:", err)
      setError(`Failed to refresh visit history: ${err.message}`)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (error) {
      return dateString
    }
  }

  const formatDateShort = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", {
        month: "long",   // Show full month name
        day: "numeric",
        year: "numeric",
        hour: "2-digit", // Add time display
        minute: "2-digit"
      })
    } catch (error) {
      return dateString
    }
  }

  const renderSearchView = () => (
    <div className="space-y-4 sm:space-y-6">
      {/* Enhanced Search Header */}
      <div className="text-center mb-6 sm:mb-8 px-2">
        <div className="flex items-center justify-center mb-3 sm:mb-4">
          <div className="bg-blue-100 p-2 sm:p-3 rounded-full">
            <Search className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
          </div>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Find or Create Patient Records</h2>
        <p className="text-sm sm:text-base text-gray-600 px-2">
          Search for existing patients using any combination of name, father's name, or age.
        </p>
      </div>

      {/* Search Form */}
      <Card className="border-t-4 border-t-blue-600 shadow-lg mx-2 sm:mx-0">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 sm:p-6">
          <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
            <User className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            <span>Patient Search</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Patient Name</label>
              <Input
                placeholder="Enter patient name"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="h-10 sm:h-12 text-sm sm:text-base"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Father Name</label>
              <Input
                placeholder="Enter father name"
                value={searchFatherName}
                onChange={(e) => setSearchFatherName(e.target.value)}
                className="h-10 sm:h-12 text-sm sm:text-base"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Age</label>
              <Input
                type="number"
                placeholder="Enter age"
                value={searchAge}
                onChange={(e) => setSearchAge(e.target.value)}
                className="h-10 sm:h-12 text-sm sm:text-base"
              />
            </div>
          </div>

          {(searchName.trim() || searchFatherName.trim() || searchAge.trim()) && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs sm:text-sm text-blue-700">
                <strong>Searching:</strong> The system will automatically search as you type.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Loading State */}
      {searching && (
        <Card className="border border-blue-200 mx-2 sm:mx-0">
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin mr-3 text-blue-600" />
              <span className="text-sm sm:text-lg text-gray-700">Searching...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-3 sm:space-y-4 mx-2 sm:mx-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">Search Results</h3>
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs sm:text-sm font-medium w-fit">
              {searchResults.length} patient{searchResults.length !== 1 ? "s" : ""} found
            </span>
          </div>

          {searchResults.map((patient) => (
            <Card
              key={patient.id}
              className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-green-500 hover:border-l-green-600"
              onClick={() => handleSelectPatient(patient)}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="bg-green-100 p-2 sm:p-3 rounded-full flex-shrink-0">
                      <User className="h-4 w-4 sm:h-6 sm:w-6 text-green-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-base sm:text-lg text-gray-900 truncate">{patient.name}</p>
                      <p className="text-sm sm:text-base text-gray-600">
                        Father: <span className="font-medium">{patient.fatherName}</span> • Age:{" "}
                        <span className="font-medium">{patient.age}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        ID: {patient.id.substring(0, 8)}... •{" "}
                        <span className="font-medium text-blue-600">{patient.count} visits</span>
                      </p>
                    </div>
                  </div>
                  <Button className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">Select Patient</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* No Results - Create New Patient */}
      {(searchName.trim() || searchFatherName.trim() || searchAge.trim()) &&
        searchResults.length === 0 &&
        !searching && (
          <Card className="border-dashed border-2 border-gray-300 bg-gray-50 mx-2 sm:mx-0">
            <CardContent className="p-6 sm:p-8 text-center">
              <div className="flex flex-col items-center space-y-4">
                <div className="bg-orange-100 p-3 sm:p-4 rounded-full">
                  <User className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
                </div>
                <div>
                  <p className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No Matching Patients Found</p>
                  <p className="text-sm sm:text-base text-gray-600 mb-6 px-2">
                    No existing records match your search criteria. You can create a new patient record.
                  </p>
                </div>
                <Button
                  onClick={handleCreateNewPatient}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-lg w-full sm:w-auto"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                      Create New Patient
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

      {/* Initial State Message */}
      {!searchName.trim() && !searchFatherName.trim() && !searchAge.trim() && (
        <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 mx-2 sm:mx-0">
          <CardContent className="p-6 sm:p-8 text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-blue-100 p-3 sm:p-4 rounded-full">
                <Search className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              </div>
              <div>
                <p className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Ready to Search</p>
                <p className="text-sm sm:text-base text-gray-600 px-2">
                  Start typing in any field above to search for existing patient records.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )

  const renderPatientDetails = () => (
    <div className="space-y-4 sm:space-y-6 mx-2 sm:mx-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <Button variant="outline" onClick={() => setCurrentView("search")} className="px-4 sm:px-6 w-fit">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Search
        </Button>
        <div className="flex items-center space-x-2 sm:space-x-4">
          {loadingVisits && <Loader2 className="h-4 w-4 animate-spin" />}
          <div className="text-xs sm:text-sm text-gray-600">
            Total Visits: <span className="font-bold text-blue-600 text-sm sm:text-lg">{visitCount}</span>
            <span className="text-xs text-gray-500 ml-1 sm:ml-2 hidden sm:inline">(from Airtable)</span>
          </div>
        </div>
      </div>

      {selectedPatient && (
        <Card className="border-t-4 border-t-blue-600 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 sm:p-6">
            <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                <span className="text-lg sm:text-xl">Patient Information</span>
              </div>
              <div className="text-xs sm:text-sm font-normal text-gray-600">
                ID: {selectedPatient.id.substring(0, 12)}...
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Patient Name</label>
                <p className="text-lg sm:text-xl font-bold text-gray-900 break-words">{selectedPatient.name}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Father Name</label>
                <p className="text-lg sm:text-xl font-bold text-gray-900 break-words">{selectedPatient.fatherName}</p>
              </div>
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Age</label>
                <p className="text-lg sm:text-xl font-bold text-gray-900">{selectedPatient.age} years</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <Button
          onClick={() => setCurrentView("new-visit")}
          className="bg-green-600 hover:bg-green-700 h-12 sm:h-16 text-sm sm:text-lg"
        >
          <Stethoscope className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6" />
          Start New Visit
        </Button>
        <Button
          variant="outline"
          onClick={() => setCurrentView("visit-history")}
          className="h-12 sm:h-16 text-sm sm:text-lg border-2"
        >
          <FileText className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6" />
          <span className="hidden sm:inline">View Medical History ({visitCount} visits)</span>
          <span className="sm:hidden">History ({visitCount})</span>
        </Button>
      </div>

      {/* Enhanced overview of recent visits */}
      {visitCount > 0 && (
        <Card className="border-l-4 border-l-cyan-500 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-600" />
                <span>Patient Overview</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => selectedPatient && refreshVisitData(selectedPatient.id, true)}
                disabled={loadingVisits}
                className="w-full sm:w-auto"
              >
                {loadingVisits ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                {patientVisits.length === 0 ? "Load History" : "Refresh"}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {patientVisits.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Total Visits:</span>
                    <span className="font-bold text-xl sm:text-2xl text-blue-600">{visitCount}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Last Visit:</span>
                    <span className="font-medium text-sm">{formatDateShort(patientVisits[0].visitDate)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">First Visit:</span>
                    <span className="font-medium text-sm">
                      {formatDateShort(patientVisits[patientVisits.length - 1].visitDate)}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-700 mb-3">Latest Diagnosis:</div>
                  <div className="bg-blue-50 border-l-4 border-blue-400 rounded-r-lg p-3 sm:p-4">
                    <p className="font-medium text-blue-800 text-xs sm:text-sm leading-relaxed break-words">
                      {patientVisits[0].diagnosis}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8">
                <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-base sm:text-lg font-medium text-gray-900 mb-2">Visit History Not Loaded</p>
                <p className="text-sm sm:text-base text-gray-600 mb-4 px-2">
                  Patient has {visitCount} visits but details are not loaded.
                </p>
                <Button
                  onClick={() => selectedPatient && refreshVisitData(selectedPatient.id, true)}
                  disabled={loadingVisits}
                  className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                >
                  {loadingVisits ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Load Visit History
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {visitCount === 0 && (
        <Card className="border-l-4 border-l-gray-400 bg-gray-50">
          <CardContent className="p-6 sm:p-8 text-center">
            <div className="flex flex-col items-center space-y-4">
              <FileText className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400" />
              <div>
                <p className="text-lg sm:text-xl font-semibold text-gray-900">No Medical History</p>
                <p className="text-sm sm:text-base text-gray-600 mt-2">This patient has no recorded visits yet</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )

  const renderNewVisit = () => (
    <div className="space-y-4 sm:space-y-6 mx-2 sm:mx-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <Button variant="outline" onClick={() => setCurrentView("patient-details")} className="px-4 sm:px-6 w-fit">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Patient
        </Button>
        <div className="text-right">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">New Visit #{visitCount + 1}</h2>
          <p className="text-sm sm:text-base text-gray-600 truncate">{selectedPatient?.name}</p>
        </div>
      </div>

      <Card className="border-t-4 border-t-green-600 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 sm:p-6">
          <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
            <Stethoscope className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            <span>AI-Powered Diagnostic Assessment</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <DiagnosticForm selectedPatient={selectedPatient} onVisitCreated={handleVisitCreated} />
        </CardContent>
      </Card>
    </div>
  )

  const renderVisitHistory = () => (
    <div className="space-y-4 sm:space-y-6 mx-2 sm:mx-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <Button variant="outline" onClick={() => setCurrentView("patient-details")} className="px-4 sm:px-6 w-fit">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Patient
        </Button>
        <div className="text-right">
          <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Complete Medical History</h2>
          <p className="text-sm sm:text-base text-gray-600">
            {selectedPatient?.name} • {visitCount} Total Visits
          </p>
        </div>
      </div>

      {loadingVisits && (
        <Card>
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin mr-3 text-blue-600" />
              <span className="text-sm sm:text-lg">Loading medical history...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {visitCount === 0 && !loadingVisits ? (
        <Card className="shadow-lg">
          <CardContent className="p-8 sm:p-12 text-center">
            <div className="flex flex-col items-center space-y-4 sm:space-y-6">
              <FileText className="h-16 w-16 sm:h-20 sm:w-20 text-gray-400" />
              <div>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">No Medical History Found</p>
                <p className="text-sm sm:text-lg text-gray-600 mt-3">This patient has no previous visits recorded</p>
              </div>
              <Button
                onClick={() => setCurrentView("new-visit")}
                className="bg-green-600 hover:bg-green-700 px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-lg w-full sm:w-auto"
              >
                <Stethoscope className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Start First Visit
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {/* Enhanced Summary Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card className="border-l-4 border-l-blue-500 shadow-md">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold">Total Visits</p>
                    <p className="text-2xl sm:text-3xl font-bold text-blue-600">{visitCount}</p>
                    <p className="text-xs text-gray-500 hidden sm:block">From Airtable</p>
                  </div>
                  <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500 shadow-md">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold">First Visit</p>
                    <p className="text-xs sm:text-sm font-medium">
                      {patientVisits.length > 0
                        ? formatDateShort(patientVisits[patientVisits.length - 1].visitDate)
                        : "N/A"}
                    </p>
                  </div>
                  <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500 shadow-md">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold">Latest Visit</p>
                    <p className="text-xs sm:text-sm font-medium">
                      {patientVisits.length > 0 ? formatDateShort(patientVisits[0].visitDate) : "N/A"}
                    </p>
                  </div>
                  <Stethoscope className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500 shadow-md">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold">Patient Age</p>
                    <p className="text-2xl sm:text-3xl font-bold text-orange-600">{selectedPatient?.age}</p>
                  </div>
                  <User className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Medical History Table */}
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                  <span className="hidden sm:inline">Medical History Table ({visitCount} visits)</span>
                  <span className="sm:hidden">History ({visitCount})</span>
                </CardTitle>
                <Button
                  onClick={() => refreshVisitData(selectedPatient?.id || "", true)}
                  variant="outline"
                  size="sm"
                  disabled={loadingVisits}
                  className="w-full sm:w-auto"
                >
                  {loadingVisits ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {patientVisits.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Visit #
                        </th>
                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden sm:table-cell">
                          Patient Name
                        </th>
                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Symptoms
                        </th>
                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Diagnosis
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {patientVisits.map((visit, index) => (
                        <tr key={visit.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="bg-blue-100 p-1 sm:p-2 rounded-full mr-2 sm:mr-3">
                                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                              </div>
                              <div>
                                <div className="text-xs sm:text-sm font-bold text-gray-900">#{visitCount - index}</div>
                                <div className="text-xs text-gray-500">
                                  {index === 0 ? "Latest" : `${index + 1} ago`}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 hidden sm:table-cell">
                            <div className="text-sm font-medium text-gray-900">
                              {visit.patientName || selectedPatient?.name || "Unknown"}
                            </div>
                            <div className="text-xs text-gray-500">ID: {visit.patientId.substring(0, 8)}...</div>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4">
                            <div className="text-xs sm:text-sm font-medium text-gray-900">
                              {formatDateShort(visit.visitDate)}
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4">
                            <div className="max-w-xs">
                              <div className="text-xs sm:text-sm text-gray-900">
                                {visit.symptoms} {/* Show full symptoms without truncation */}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4">
                            <div className="max-w-xs">
                              <div className="text-xs sm:text-sm font-medium text-gray-900">
                                {visit.diagnosis} {/* Show full diagnosis without truncation */}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 sm:p-12 text-center">
                  <FileText className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-base sm:text-lg font-medium text-gray-900">Visit records are loading...</p>
                  <p className="text-sm sm:text-base text-gray-600">
                    Patient has {visitCount} visits according to records
                  </p>
                  <Button
                    onClick={() => refreshVisitData(selectedPatient?.id || "", true)}
                    className="mt-4 w-full sm:w-auto"
                    disabled={loadingVisits}
                  >
                    {loadingVisits ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Try Loading Visits Again
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-center pt-4 sm:pt-6 border-t border-gray-200">
            <Button
              onClick={() => setCurrentView("new-visit")}
              className="bg-green-600 hover:bg-green-700 px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-lg w-full sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Add New Visit (#{visitCount + 1})
            </Button>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 lg:px-8">
      {error && (
        <Alert variant="destructive" className="mb-4 sm:mb-6 mx-2 sm:mx-0">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}

      {currentView === "search" && renderSearchView()}
      {currentView === "patient-details" && renderPatientDetails()}
      {currentView === "new-visit" && renderNewVisit()}
      {currentView === "visit-history" && renderVisitHistory()}
    </div>
  )
}
