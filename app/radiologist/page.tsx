"use client"

import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LoadingIndicator } from "@/components/loading-indicator"
import { 
  Scan, 
  Mic, 
  User,
  LogOut,
  Play,
  ArrowRight
} from "lucide-react"
import { useRouter } from 'next/navigation'

export default function RadiologistDashboard() {
  const { user, isLoading, logout } = useAuth('radiologist')
  const router = useRouter()

  if (isLoading) {
    return <LoadingIndicator isLoading={true} label="Loading radiologist dashboard..." />
  }

  if (!user) {
    return null // This will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <div className="bg-teal-600 p-3 rounded-lg">
                <Scan className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Radiologist Dashboard</h1>
                <p className="text-gray-600">Medical Imaging & Report Generation</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Welcome</p>
                <p className="font-semibold text-gray-900 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {user.username}
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => logout('radiologist')}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Voice-to-Report System
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Generate professional radiology reports using AI-powered voice dictation. 
            Simply speak your findings and let our system create formatted reports.
          </p>
        </div>

        {/* Main Action Card */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto bg-teal-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <Mic className="h-8 w-8 text-teal-600" />
            </div>
            <CardTitle className="text-2xl">Rapid Report Generation</CardTitle>
            <CardDescription className="text-base">
              AI-powered voice dictation with OpenAI Whisper and GPT-4
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div className="flex flex-col items-center p-3">
                  <div className="bg-blue-100 p-2 rounded-lg mb-2">
                    <Mic className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="font-medium">Record</span>
                </div>
                <div className="flex flex-col items-center p-3">
                  <div className="bg-purple-100 p-2 rounded-lg mb-2">
                    <span className="text-purple-600 font-bold text-lg">AI</span>
                  </div>
                  <span className="font-medium">Process</span>
                </div>
                <div className="flex flex-col items-center p-3">
                  <div className="bg-green-100 p-2 rounded-lg mb-2">
                    <Scan className="h-5 w-5 text-green-600" />
                  </div>
                  <span className="font-medium">Format</span>
                </div>
                <div className="flex flex-col items-center p-3">
                  <div className="bg-orange-100 p-2 rounded-lg mb-2">
                    <span className="text-orange-600 font-bold">✓</span>
                  </div>
                  <span className="font-medium">Review</span>
                </div>
              </div>

              <Button 
                size="lg" 
                className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 text-lg"
                onClick={() => router.push('/radiologist/voice-to-report')}
              >
                <Play className="h-5 w-5 mr-2" />
                Start New Report
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>

              <p className="text-sm text-gray-500">
                Supports CT, MRI, X-Ray, and Ultrasound reports
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
