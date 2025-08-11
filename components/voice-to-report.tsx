"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Mic, 
  Square, 
  Play, 
  Brain, 
  FileText, 
  Download, 
  Edit, 
  Save, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Loader2,
  Volume2,
  VolumeX
} from "lucide-react"

interface VoiceToReportProps {
  onReportGenerated?: (report: RadiologyReport) => void
}

interface RadiologyReport {
  id: string
  patientName: string
  patientId: string
  dateOfBirth: string
  studyDate: string
  studyType: string
  referringPhysician: string
  examination: string
  findings: string
  impression: string
  recommendations: string
  radiologist: string
  reportDate: string
  rawTranscript?: string
}

export function VoiceToReport({ onReportGenerated }: VoiceToReportProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState("")
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [transcript, setTranscript] = useState("")
  const [generatedReport, setGeneratedReport] = useState<RadiologyReport | null>(null)
  const [editableReport, setEditableReport] = useState<RadiologyReport | null>(null)
  const [error, setError] = useState("")
  const [recordingTime, setRecordingTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isApiConfigured, setIsApiConfigured] = useState<boolean | null>(null)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Patient Information State
  const [patientInfo, setPatientInfo] = useState({
    patientName: "",
    patientId: "",
    dateOfBirth: "",
    studyType: "",
    referringPhysician: ""
  })

  // Check API configuration on component mount
  useEffect(() => {
    const checkApiConfig = async () => {
      try {
        const response = await fetch('/api/check-openai-key')
        const data = await response.json()
        setIsApiConfigured(data.configured && data.valid !== false)
      } catch (error) {
        console.error('Failed to check API configuration:', error)
        setIsApiConfigured(false)
      }
    }
    
    checkApiConfig()
  }, [])

  const startRecording = useCallback(async () => {
    try {
      setError("") // Clear previous errors
      
      // Check if browser supports media recording
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support audio recording. Please use Chrome, Firefox, or Safari.')
      }
      
      if (!window.MediaRecorder) {
        throw new Error('MediaRecorder is not supported in your browser. Please update your browser.')
      }
      
      console.log('Requesting microphone access...')
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000, // Optimize for Whisper
          channelCount: 1,   // Mono audio
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      })
      
      console.log('Microphone access granted')
      
      // Check supported MIME types
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/wav'
      ]
      
      let selectedMimeType = 'audio/webm;codecs=opus'
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType
          break
        }
      }
      
      console.log('Using MIME type:', selectedMimeType)
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: selectedMimeType
      })
      
      audioChunksRef.current = []
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
          console.log('Audio chunk received:', event.data.size, 'bytes')
        }
      }
      
      mediaRecorder.onstop = () => {
        console.log('Recording stopped, creating blob...')
        const blob = new Blob(audioChunksRef.current, { type: selectedMimeType })
        console.log('Audio blob created:', {
          size: blob.size,
          type: blob.type
        })
        setAudioBlob(blob)
        stream.getTracks().forEach(track => {
          track.stop()
          console.log('Track stopped:', track.kind)
        })
      }
      
      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event)
        setError('Recording error occurred. Please try again.')
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start(250) // Collect data every 250ms
      setIsRecording(true)
      setRecordingTime(0)
      
      console.log('Recording started')
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1
          if (newTime >= 300) { // Auto-stop after 5 minutes
            stopRecording()
            setError('Recording automatically stopped after 5 minutes. Please process this recording or start a new one.')
          }
          return newTime
        })
      }, 1000)
      
    } catch (error) {
      console.error('Recording error:', error)
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError' || error.message.includes('Permission denied')) {
          setError("Microphone access denied. Please allow microphone permissions and reload the page.")
        } else if (error.name === 'NotFoundError') {
          setError("No microphone found. Please connect a microphone and try again.")
        } else if (error.name === 'NotReadableError') {
          setError("Microphone is already in use by another application. Please close other apps using the microphone.")
        } else if (error.name === 'OverconstrainedError') {
          setError("Microphone doesn't meet the required specifications. Please try with a different microphone.")
        } else {
          setError(`Recording error: ${error.message}`)
        }
      } else {
        setError("Failed to access microphone. Please check your browser settings and try again.")
      }
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [])

  const playRecording = useCallback(() => {
    if (audioBlob && !isPlaying) {
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)
      audioRef.current = audio
      
      audio.play()
      setIsPlaying(true)
      
      audio.onended = () => {
        setIsPlaying(false)
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [audioBlob, isPlaying])

  const stopPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsPlaying(false)
    }
  }, [])

  const processAudioToReport = useCallback(async () => {
    if (!audioBlob) return
    
    setIsProcessing(true)
    setError("")
    setProcessingStep("Preparing audio file...")
    
    try {
      // Validate audio blob
      if (audioBlob.size === 0) {
        throw new Error('Recording is empty. Please try recording again.')
      }
      
      if (audioBlob.size > 25 * 1024 * 1024) {
        throw new Error('Recording is too large (max 25MB). Please record a shorter message.')
      }
      
      console.log('Processing audio blob:', {
        size: audioBlob.size,
        type: audioBlob.type
      })
      
      setProcessingStep("Transcribing audio with OpenAI Whisper...")
      
      // Step 1: Convert audio to text using OpenAI Whisper API
      const transcriptionFormData = new FormData()
      transcriptionFormData.append('audio', audioBlob, 'recording.webm')
      
      const transcriptionResponse = await fetch('/api/transcribe', {
        method: 'POST',
        body: transcriptionFormData,
      })
      
      if (!transcriptionResponse.ok) {
        const errorData = await transcriptionResponse.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Transcription API error:', errorData)
        throw new Error(errorData.error || `Transcription failed with status ${transcriptionResponse.status}`)
      }
      
      const transcriptionResult = await transcriptionResponse.json()
      const transcribedText = transcriptionResult.transcript
      
      console.log('Transcription result:', {
        textLength: transcribedText?.length || 0,
        duration: transcriptionResult.duration,
        language: transcriptionResult.language
      })
      
      if (!transcribedText || transcribedText.trim().length === 0) {
        throw new Error('No speech detected in recording. Please speak more clearly and ensure your microphone is working.')
      }
      
      if (transcribedText.trim().length < 10) {
        throw new Error('Recording too short. Please provide more detailed medical findings.')
      }
      
      setTranscript(transcribedText)
      setProcessingStep("Generating professional report with GPT-4...")
      
      // Add a small delay to show the progress
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Step 2: Generate professional report using GPT-4
      const reportResponse = await fetch('/api/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript: transcribedText,
          patientInfo: {
            patientName: patientInfo.patientName || "Unknown Patient",
            patientId: patientInfo.patientId || "000000", 
            dateOfBirth: patientInfo.dateOfBirth || "",
            studyType: patientInfo.studyType || "CT Chest",
            referringPhysician: patientInfo.referringPhysician || "Dr. Unknown"
          }
        }),
      })
      
      if (!reportResponse.ok) {
        const errorData = await reportResponse.json()
        throw new Error(errorData.error || 'Failed to generate report')
      }
      
      const reportResult = await reportResponse.json()
      const reportData = reportResult.report
      
      setGeneratedReport(reportData)
      setEditableReport({ ...reportData })
      setProcessingStep("")
      
      if (onReportGenerated) {
        onReportGenerated(reportData)
      }
      
    } catch (error: any) {
      const errorMessage = error.message || "Failed to process audio. Please try again or check your internet connection."
      setError(errorMessage)
      setProcessingStep("")
      console.error("Processing error:", error)
    } finally {
      setIsProcessing(false)
    }
  }, [audioBlob, patientInfo, onReportGenerated])

  const saveReport = useCallback(() => {
    if (editableReport) {
      // In a real application, this would save to a database
      console.log("Saving report:", editableReport)
      
      // Simulate save operation
      setTimeout(() => {
        alert("Report saved successfully!")
      }, 500)
    }
  }, [editableReport])

  const downloadReport = useCallback(() => {
    if (editableReport) {
      const reportContent = `
RADIOLOGY REPORT
${'-'.repeat(50)}

Patient: ${editableReport.patientName}
Patient ID: ${editableReport.patientId}
Date of Birth: ${editableReport.dateOfBirth}
Study Date: ${editableReport.studyDate}
Study Type: ${editableReport.studyType}
Referring Physician: ${editableReport.referringPhysician}

EXAMINATION:
${editableReport.examination}

FINDINGS:
${editableReport.findings}

IMPRESSION:
${editableReport.impression}

RECOMMENDATIONS:
${editableReport.recommendations}

${'-'.repeat(50)}
Radiologist: ${editableReport.radiologist}
Report Date: ${editableReport.reportDate}
      `.trim()
      
      const blob = new Blob([reportContent], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Radiology_Report_${editableReport.patientId}_${editableReport.reportDate}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }, [editableReport])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const resetSession = () => {
    setAudioBlob(null)
    setTranscript("")
    setGeneratedReport(null)
    setEditableReport(null)
    setError("")
    setRecordingTime(0)
    setIsProcessing(false)
    setIsRecording(false)
    setIsPlaying(false)
    audioChunksRef.current = []
  }

  return (
    <div className="space-y-6">
      {/* API Configuration Alert */}
      {isApiConfigured === false && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>OpenAI API Key Required:</strong> To use the voice-to-report feature, you need to configure your OpenAI API key. 
            Create a <code className="bg-red-100 px-1 rounded">.env.local</code> file in your project root and add: <code className="bg-red-100 px-1 rounded">OPENAI_API_KEY=your_key_here</code>
            <br />
            <span className="text-xs">Get your API key from: https://platform.openai.com/api-keys</span>
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* API Key Warning */}
      <Alert className="border-orange-200 bg-orange-50">
        <Brain className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          <strong>AI Configuration Required:</strong> This feature uses OpenAI's Whisper API for transcription and GPT-4 for report generation. 
          Ensure your <code className="bg-orange-100 px-1 rounded">.env.local</code> file contains a valid <code className="bg-orange-100 px-1 rounded">OPENAI_API_KEY</code>. 
          See <code className="bg-orange-100 px-1 rounded">VOICE_TO_REPORT_GUIDE.md</code> for setup instructions.
        </AlertDescription>
      </Alert>

      {/* Patient Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Patient Information
          </CardTitle>
          <CardDescription>
            Enter patient details before starting voice dictation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="patientName">Patient Name</Label>
              <Input
                id="patientName"
                value={patientInfo.patientName}
                onChange={(e) => setPatientInfo(prev => ({ ...prev, patientName: e.target.value }))}
                placeholder="Enter patient full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="patientId">Patient ID</Label>
              <Input
                id="patientId"
                value={patientInfo.patientId}
                onChange={(e) => setPatientInfo(prev => ({ ...prev, patientId: e.target.value }))}
                placeholder="Enter patient ID"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={patientInfo.dateOfBirth}
                onChange={(e) => setPatientInfo(prev => ({ ...prev, dateOfBirth: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="studyType">Study Type</Label>
              <Select onValueChange={(value) => setPatientInfo(prev => ({ ...prev, studyType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select study type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CT Chest">CT Chest</SelectItem>
                  <SelectItem value="CT Abdomen">CT Abdomen</SelectItem>
                  <SelectItem value="CT Brain">CT Brain</SelectItem>
                  <SelectItem value="MRI Brain">MRI Brain</SelectItem>
                  <SelectItem value="MRI Spine">MRI Spine</SelectItem>
                  <SelectItem value="X-Ray Chest">X-Ray Chest</SelectItem>
                  <SelectItem value="X-Ray Knee">X-Ray Knee</SelectItem>
                  <SelectItem value="Ultrasound Abdomen">Ultrasound Abdomen</SelectItem>
                  <SelectItem value="Ultrasound Pelvic">Ultrasound Pelvic</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="referringPhysician">Referring Physician</Label>
              <Input
                id="referringPhysician"
                value={patientInfo.referringPhysician}
                onChange={(e) => setPatientInfo(prev => ({ ...prev, referringPhysician: e.target.value }))}
                placeholder="Enter referring physician name"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Voice Recording */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Voice Dictation
          </CardTitle>
          <CardDescription>
            Record your radiology findings and let AI generate the professional report
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center bg-gray-50 rounded-lg p-8">
            <div className="text-center space-y-4">
              {isRecording && (
                <div className="flex items-center justify-center mb-4">
                  <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse mr-2"></div>
                  <span className="text-lg font-mono">{formatTime(recordingTime)}</span>
                </div>
              )}
              
              <div className="flex items-center justify-center space-x-4">
                {!isRecording ? (
                  <Button
                    onClick={startRecording}
                    size="lg"
                    className="bg-red-600 hover:bg-red-700 text-white"
                    disabled={isProcessing}
                  >
                    <Mic className="h-5 w-5 mr-2" />
                    Start Recording
                  </Button>
                ) : (
                  <Button
                    onClick={stopRecording}
                    size="lg"
                    variant="outline"
                    className="border-red-600 text-red-600 hover:bg-red-50"
                  >
                    <Square className="h-5 w-5 mr-2" />
                    Stop Recording
                  </Button>
                )}
                
                {audioBlob && !isRecording && (
                  <div className="flex space-x-2">
                    <Button
                      onClick={isPlaying ? stopPlayback : playRecording}
                      variant="outline"
                      size="lg"
                    >
                      {isPlaying ? (
                        <>
                          <VolumeX className="h-5 w-5 mr-2" />
                          Stop
                        </>
                      ) : (
                        <>
                          <Volume2 className="h-5 w-5 mr-2" />
                          Play
                        </>
                      )}
                    </Button>
                    
                    <Button
                      onClick={processAudioToReport}
                      size="lg"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={isProcessing || !patientInfo.patientName || !patientInfo.studyType}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          {processingStep || "Processing with AI..."}
                        </>
                      ) : (
                        <>
                          <Brain className="h-5 w-5 mr-2" />
                          Generate Report
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
              
              <p className="text-sm text-gray-600 max-w-md">
                Click "Start Recording" and dictate your findings. The AI will transcribe your voice 
                and format it into a professional radiology report.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transcript Display */}
      {transcript && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Voice Transcript
            </CardTitle>
            <CardDescription>
              Raw transcript from voice recognition (Whisper API)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700 leading-relaxed">
                {transcript}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generated Report */}
      {editableReport && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Generated Report
                </CardTitle>
                <CardDescription>
                  AI-generated radiology report - review and edit as needed
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button onClick={saveReport} size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button onClick={downloadReport} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button onClick={resetSession} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  New Report
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Patient Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
              <div>
                <strong>Patient:</strong> {editableReport.patientName}
              </div>
              <div>
                <strong>Patient ID:</strong> {editableReport.patientId}
              </div>
              <div>
                <strong>Study Date:</strong> {editableReport.studyDate}
              </div>
              <div>
                <strong>Study Type:</strong> {editableReport.studyType}
              </div>
            </div>

            {/* Editable Report Sections */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="examination" className="text-base font-semibold">Examination</Label>
                <Textarea
                  id="examination"
                  value={editableReport.examination}
                  onChange={(e) => setEditableReport(prev => prev ? { ...prev, examination: e.target.value } : null)}
                  className="mt-2 min-h-[80px]"
                />
              </div>

              <div>
                <Label htmlFor="findings" className="text-base font-semibold">Findings</Label>
                <Textarea
                  id="findings"
                  value={editableReport.findings}
                  onChange={(e) => setEditableReport(prev => prev ? { ...prev, findings: e.target.value } : null)}
                  className="mt-2 min-h-[120px]"
                />
              </div>

              <div>
                <Label htmlFor="impression" className="text-base font-semibold">Impression</Label>
                <Textarea
                  id="impression"
                  value={editableReport.impression}
                  onChange={(e) => setEditableReport(prev => prev ? { ...prev, impression: e.target.value } : null)}
                  className="mt-2 min-h-[80px]"
                />
              </div>

              <div>
                <Label htmlFor="recommendations" className="text-base font-semibold">Recommendations</Label>
                <Textarea
                  id="recommendations"
                  value={editableReport.recommendations}
                  onChange={(e) => setEditableReport(prev => prev ? { ...prev, recommendations: e.target.value } : null)}
                  className="mt-2 min-h-[80px]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-gray-600">
                <p><strong>Radiologist:</strong> {editableReport.radiologist}</p>
                <p><strong>Report Date:</strong> {editableReport.reportDate}</p>
              </div>
              <Badge className="bg-green-100 text-green-800">
                AI Generated & Editable
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
