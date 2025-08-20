"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import {
  Stethoscope, 
  Heart,
  Settings,
  Microscope,
  AlertTriangle,
  Scan
} from "lucide-react"

export function RoleSelectionV2() {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<string | null>(null)

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId)
    setTimeout(() => {
      if (roleId === 'admin') {
        router.push('/administrator/login')
      } else {
        router.push(`/${roleId}/login`)
      }
    }, 300)
  }

  return (
    <div className="min-h-screen bg-blue-50">
      <header className="bg-white py-4 px-6 shadow-sm">
        <div className="flex items-center">
          <div className="bg-blue-600 p-2 rounded-md">
            <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" />
              <path d="M12 8V12L16 14" />
            </svg>
          </div>
          <div className="ml-3">
            <h1 className="text-xl font-bold">Clinix AI Hospital Management</h1>
            <p className="text-sm text-gray-600">Advanced AI-powered healthcare management system</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-3">Choose Your Role to Continue</h2>
          <p className="text-gray-600 max-w-3xl mx-auto">
            Access role-specific features designed for your healthcare responsibilities. 
            Our AI-powered system adapts to your workflow and provides the tools you need.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: "AI Features", value: "27+", icon: "graph" },
            { label: "Specialized Roles", value: "6", icon: "users" },
            { label: "Standard Compliant", value: "WHO", icon: "check" },
            { label: "AI Availability", value: "24/7", icon: "zap" }
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-blue-100 rounded-md flex items-center justify-center text-blue-600">
                  {stat.icon === "graph" && <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
                  {stat.icon === "users" && <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
                  {stat.icon === "check" && <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                  {stat.icon === "zap" && <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>}
                </div>
                <div className="ml-3">
                  <div className="text-xl font-bold">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Roles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* Doctor */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="flex items-center p-5 border-b">
              <div className="flex-shrink-0 h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Stethoscope className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4 flex-grow">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">Doctor/Physician</h3>
                    <p className="text-sm text-gray-600">Clinical Care & Diagnosis</p>
                  </div>
                  <svg className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-600 mb-4">
                Access AI-powered diagnosis, patient management, and clinical decision support tools.
              </p>
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Key Features</p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs bg-gray-100 text-gray-800 rounded-full px-3 py-1">AI Medical Diagnosis</span>
                  <span className="text-xs bg-gray-100 text-gray-800 rounded-full px-3 py-1">Patient Records Management</span>
                  <span className="text-xs bg-gray-100 text-gray-800 rounded-full px-3 py-1">Medical History Tracking</span>
                  <span className="text-xs bg-gray-100 text-gray-800 rounded-full px-3 py-1">+3 more</span>
                </div>
              </div>
              <button 
                className="w-full py-3 text-white font-medium bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                onClick={() => handleRoleSelect('doctor')}
                disabled={selectedRole === 'doctor'}
              >
                {selectedRole === 'doctor' ? 'Loading...' : 'Start Diagnosis'}
              </button>
            </div>
          </div>
          
          {/* Nurse */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="flex items-center p-5 border-b">
              <div className="flex-shrink-0 h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Heart className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4 flex-grow">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">Nurse/Triage Specialist</h3>
                    <p className="text-sm text-gray-600">Patient Assessment & Triage</p>
                  </div>
                  <svg className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-600 mb-4">
                WHO-standard triage system, emergency protocols, and patient monitoring tools.
              </p>
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Key Features</p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs bg-gray-100 text-gray-800 rounded-full px-3 py-1">AI Triage System (WHO 5-Class)</span>
                  <span className="text-xs bg-gray-100 text-gray-800 rounded-full px-3 py-1">Emergency Protocol Management</span>
                  <span className="text-xs bg-gray-100 text-gray-800 rounded-full px-3 py-1">Vital Signs Recording</span>
                  <span className="text-xs bg-gray-100 text-gray-800 rounded-full px-3 py-1">+3 more</span>
                </div>
              </div>
              <button 
                className="w-full py-3 text-white font-medium bg-green-600 rounded-md hover:bg-green-700 transition-colors"
                onClick={() => handleRoleSelect('nurse')}
                disabled={selectedRole === 'nurse'}
              >
                {selectedRole === 'nurse' ? 'Loading...' : 'Begin Triage'}
              </button>
            </div>
          </div>
          
          {/* Admin */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="flex items-center p-5 border-b">
              <div className="flex-shrink-0 h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Settings className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4 flex-grow">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">Hospital Administrator</h3>
                    <p className="text-sm text-gray-600">Operations & Management</p>
                  </div>
                  <svg className="h-5 w-5 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-600 mb-4">
                Hospital operations dashboard, analytics, resource optimization, and system management.
              </p>
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Key Features</p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs bg-gray-100 text-gray-800 rounded-full px-3 py-1">Hospital Operations Dashboard</span>
                  <span className="text-xs bg-gray-100 text-gray-800 rounded-full px-3 py-1">Resource Allocation Optimizer</span>
                  <span className="text-xs bg-gray-100 text-gray-800 rounded-full px-3 py-1">Staff Management Tools</span>
                  <span className="text-xs bg-gray-100 text-gray-800 rounded-full px-3 py-1">+3 more</span>
                </div>
              </div>
              <button 
                className="w-full py-3 text-white font-medium bg-purple-600 rounded-md hover:bg-purple-700 transition-colors"
                onClick={() => handleRoleSelect('admin')}
                disabled={selectedRole === 'admin'}
              >
                {selectedRole === 'admin' ? 'Loading...' : 'View Dashboard'}
              </button>
            </div>
          </div>
          
          {/* Researcher */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="flex items-center p-5 border-b">
              <div className="flex-shrink-0 h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Microscope className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4 flex-grow">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">Medical Analyst</h3>
                    <p className="text-sm text-gray-600">Data Analysis & Research</p>
                  </div>
                  <svg className="h-5 w-5 text-orange-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-600 mb-4">
                Advanced analytics, patient demographics, diagnosis patterns, and research insights.
              </p>
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Key Features</p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs bg-gray-100 text-gray-800 rounded-full px-3 py-1">Patient Demographics Analysis</span>
                  <span className="text-xs bg-gray-100 text-gray-800 rounded-full px-3 py-1">Diagnosis Pattern Recognition</span>
                  <span className="text-xs bg-gray-100 text-gray-800 rounded-full px-3 py-1">Medical Condition Trends</span>
                  <span className="text-xs bg-gray-100 text-gray-800 rounded-full px-3 py-1">+3 more</span>
                </div>
              </div>
              <button 
                className="w-full py-3 text-white font-medium bg-orange-600 rounded-md hover:bg-orange-700 transition-colors"
                onClick={() => handleRoleSelect('researcher')}
                disabled={selectedRole === 'researcher'}
              >
                {selectedRole === 'researcher' ? 'Loading...' : 'Analyze Data'}
              </button>
            </div>
          </div>
          
          {/* Emergency */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="flex items-center p-5 border-b">
              <div className="flex-shrink-0 h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4 flex-grow">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">Emergency Coordinator</h3>
                    <p className="text-sm text-gray-600">Critical Care Management</p>
                  </div>
                  <svg className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-600 mb-4">
                Emergency response coordination, critical patient monitoring, and crisis management.
              </p>
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Key Features</p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs bg-gray-100 text-gray-800 rounded-full px-3 py-1">Emergency Response Protocols</span>
                  <span className="text-xs bg-gray-100 text-gray-800 rounded-full px-3 py-1">Critical Patient Alerts</span>
                  <span className="text-xs bg-gray-100 text-gray-800 rounded-full px-3 py-1">Staff Assignment System</span>
                  <span className="text-xs bg-gray-100 text-gray-800 rounded-full px-3 py-1">+3 more</span>
                </div>
              </div>
              <button 
                className="w-full py-3 text-white font-medium bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                onClick={() => handleRoleSelect('emergency')}
                disabled={selectedRole === 'emergency'}
              >
                {selectedRole === 'emergency' ? 'Loading...' : 'Emergency Center'}
              </button>
            </div>
          </div>
          
          {/* Radiologist */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="flex items-center p-5 border-b">
              <div className="flex-shrink-0 h-12 w-12 bg-teal-100 rounded-lg flex items-center justify-center">
                <Scan className="h-6 w-6 text-teal-600" />
              </div>
              <div className="ml-4 flex-grow">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">Radiologist</h3>
                    <p className="text-sm text-gray-600">Medical Imaging & Reports</p>
                  </div>
                  <svg className="h-5 w-5 text-teal-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-600 mb-4">
                AI-powered voice-to-report generation, medical imaging analysis, and rapid radiology reporting.
              </p>
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Key Features</p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs bg-gray-100 text-gray-800 rounded-full px-3 py-1">Rapid Report Generation</span>
                  <span className="text-xs bg-gray-100 text-gray-800 rounded-full px-3 py-1">Voice-to-Text Transcription</span>
                  <span className="text-xs bg-gray-100 text-gray-800 rounded-full px-3 py-1">AI Medical Report Formatting</span>
                  <span className="text-xs bg-gray-100 text-gray-800 rounded-full px-3 py-1">+3 more</span>
                </div>
              </div>
              <button 
                className="w-full py-3 text-white font-medium bg-teal-600 rounded-md hover:bg-teal-700 transition-colors"
                onClick={() => handleRoleSelect('radiologist')}
                disabled={selectedRole === 'radiologist'}
              >
                {selectedRole === 'radiologist' ? 'Loading...' : 'Generate Reports'}
              </button>
            </div>
          </div>
        </div>
        
        <div className="text-center text-gray-500 text-sm">
          Powered by advanced AI technology • WHO Standard Compliant • Real-time Analytics
        </div>
      </main>
    </div>
  )
}
