"use client"

import { useAuth } from '@/hooks/use-auth'
import { LoadingIndicator } from "@/components/loading-indicator"
import { VoiceToReport } from "@/components/voice-to-report"
import { VoiceToReportDiagnostics } from "@/components/voice-to-report-diagnostics"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeft,
  Scan,
  User,
  LogOut,
  Mic,
  Settings
} from "lucide-react"
import { useRouter } from 'next/navigation'

export default function VoiceToReportPage() {
  const { user, isLoading, logout } = useAuth('radiologist')
  const router = useRouter()

  if (isLoading) {
    return <LoadingIndicator isLoading={true} label="Loading voice-to-report system..." />
  }

  if (!user) {
    return null // This will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/radiologist')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
              <div className="h-6 w-px bg-gray-300" />
              <div className="flex items-center gap-3">
                <div className="bg-teal-600 p-2 rounded-lg">
                  <Scan className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Rapid Report Generation</h1>
                  <p className="text-sm text-gray-600">Voice-to-Radiology Report System</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-gray-500">Logged in as</p>
                <p className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
                  <User className="h-3 w-3" />
                  {user.username}
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => logout('radiologist')}
                className="flex items-center gap-2"
              >
                <LogOut className="h-3 w-3" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="bg-gradient-to-r from-teal-50 to-blue-50 p-6 rounded-lg border border-teal-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">AI-Powered Voice Dictation</h2>
            <p className="text-gray-700 text-sm mb-4">
              Speak your radiology findings naturally, and our AI will transcribe your voice using OpenAI's Whisper API 
              and format it into a professional report using GPT-4. The system supports CT, MRI, X-Ray, and Ultrasound reports.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-teal-100 text-teal-800 text-xs rounded-full font-medium">
                OpenAI Whisper API
              </span>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                GPT-4 Medical Formatting
              </span>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs rounded-full font-medium">
                Professional Templates
              </span>
              <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                Editable Output
              </span>
            </div>
          </div>
        </div>

        {/* Voice-to-Report Component */}
        <Tabs defaultValue="generator" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generator" className="flex items-center gap-2">
              <Mic className="h-4 w-4" />
              Report Generator
            </TabsTrigger>
            <TabsTrigger value="diagnostics" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              System Check
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="generator">
            <VoiceToReport 
              onReportGenerated={(report) => {
                console.log('Report generated:', report)
                // Here you could save to database, send notifications, etc.
              }}
            />
          </TabsContent>
          
          <TabsContent value="diagnostics">
            <VoiceToReportDiagnostics />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
