"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, AlertCircle, X, ImagePlus, Info, MessageSquare, Copy, Check, Microscope, Mic, MicOff, Volume2, Plus } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  analyzeSymptomsWithAI,
  createVisitWithDiagnosis,
  createVisitWithDateOnly,
  transcribeAudioWithWhisper,
  type Patient,
  type Visit,
} from "@/app/actions"
import Image from "next/image"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ChatInterface } from "@/components/chat-interface"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createWorker } from "tesseract.js"

// Maximum size in bytes (20MB)
const MAX_IMAGE_SIZE = 20 * 1024 * 1024

interface DiagnosticFormProps {
  selectedPatient: Patient | null
  onVisitCreated: (visit: Visit) => void
}

export function DiagnosticForm({ selectedPatient, onVisitCreated }: DiagnosticFormProps) {
  const [symptoms, setSymptoms] = useState("")
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [images, setImages] = useState<{ file: File; preview: string }[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState<string>("result")
  const [processingImages, setProcessingImages] = useState(false)

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false)
  const [voiceTranscript, setVoiceTranscript] = useState("")
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const [processingVoice, setProcessingVoice] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const [extractedText, setExtractedText] = useState<string[]>([])
  const [copied, setCopied] = useState(false)
  const [creatingVisit, setCreatingVisit] = useState(false)

  // Doctor's diagnosis dialog states
  const [showDoctorDialog, setShowDoctorDialog] = useState(false)
  const [doctorsDiagnosis, setDoctorsDiagnosis] = useState("")

  // Initialize Tesseract worker
  const [worker, setWorker] = useState<any>(null)

  // Voice recording functions using MediaRecorder and Whisper API
  const startVoiceRecording = async () => {
    try {
      console.log("🎤 Starting voice recording...")
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Initialize MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm' // Use webm format for better compatibility
      })
      
      audioChunksRef.current = []
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }
      
      mediaRecorder.onstop = async () => {
        console.log("🛑 Recording stopped, processing audio...")
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        
        setProcessingVoice(true)
        
        try {
          console.log("🤖 Converting audio to base64 for Whisper API...")
          
          // Convert Blob to base64 string for server action
          const arrayBuffer = await audioBlob.arrayBuffer()
          const uint8Array = new Uint8Array(arrayBuffer)
          let binaryString = ''
          for (let i = 0; i < uint8Array.byteLength; i++) {
            binaryString += String.fromCharCode(uint8Array[i])
          }
          const audioBase64 = btoa(binaryString)
          const fileName = `recording_${Date.now()}.webm`
          
          console.log("🤖 Sending audio to Whisper API...")
          const transcript = await transcribeAudioWithWhisper(audioBase64, fileName)
          
          if (transcript.trim()) {
            setVoiceTranscript(transcript.trim())
            console.log("✅ Transcription received:", transcript)
            
            // Automatically extract symptoms after transcription
            setTimeout(async () => {
              await extractSymptomsFromTranscript(transcript.trim())
            }, 500)
          } else {
            setVoiceError("No speech was detected in the recording.")
          }
        } catch (error: any) {
          console.error("❌ Transcription failed:", error)
          setVoiceError(error.message || "Failed to transcribe audio")
        } finally {
          setProcessingVoice(false)
        }
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorder.start()
      mediaRecorderRef.current = mediaRecorder
      setIsRecording(true)
      setVoiceError(null)
      setVoiceTranscript("")
      
      console.log("🚀 Recording started...")
      
    } catch (error: any) {
      console.error("❌ Error starting voice recording:", error)
      
      if (error.name === 'NotAllowedError') {
        setVoiceError("Microphone access denied. Please allow microphone access and try again.")
      } else if (error.name === 'NotFoundError') {
        setVoiceError("No microphone found. Please check your audio devices.")
      } else {
        setVoiceError("Failed to start voice recording. Please try again.")
      }
      setIsRecording(false)
    }
  }

  const stopVoiceRecording = () => {
    try {
      console.log("🛑 Stopping voice recording...")
      
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
      
      setIsRecording(false)
      
    } catch (error) {
      console.error("❌ Error stopping voice recording:", error)
      setVoiceError("Failed to stop voice recording")
      setIsRecording(false)
    }
  }

  const extractSymptomsFromTranscript = async (transcript: string) => {
    try {
      console.log("🔍 Extracting symptoms from transcript:", transcript)
      
      // Always do basic extraction first as a fallback
      const basicExtraction = extractBasicSymptoms(transcript)
      
      try {
        // Try AI extraction first
        const prompt = `
You are a medical AI assistant. Extract and summarize the key medical symptoms from this patient-doctor conversation transcript:

CONVERSATION TRANSCRIPT:
"${transcript}"

INSTRUCTIONS:
1. Extract only the medical symptoms, complaints, and relevant health information
2. Ignore non-medical conversation (greetings, scheduling, etc.)
3. Format as a clear, clinical summary
4. Include timing/duration if mentioned
5. Focus on what the patient is experiencing

Please provide a concise medical summary of the symptoms mentioned:
        `.trim()

        console.log("🤖 Attempting AI symptom extraction...")
        const extractedSymptoms = await analyzeSymptomsWithAI(prompt)
        
        // Add AI-extracted symptoms to the symptoms field
        const currentSymptoms = symptoms.trim()
        const newSymptoms = currentSymptoms 
          ? `${currentSymptoms}\n\n--- VOICE RECORDED SYMPTOMS (AI Enhanced) ---\n${extractedSymptoms}`
          : extractedSymptoms

        setSymptoms(newSymptoms)
        console.log("✅ AI-enhanced symptoms added to form")
        
      } catch (aiError) {
        console.warn("⚠️ AI extraction failed, using basic extraction:", aiError)
        
        // Fallback to basic extraction
        const currentSymptoms = symptoms.trim()
        const newSymptoms = currentSymptoms 
          ? `${currentSymptoms}\n\n--- VOICE RECORDED CONVERSATION ---\n${basicExtraction}`
          : basicExtraction

        setSymptoms(newSymptoms)
        console.log("✅ Basic symptoms added to form")
      }
      
      setVoiceTranscript("") // Clear transcript after processing
      
    } catch (error) {
      console.error("❌ Error extracting symptoms from transcript:", error)
      setVoiceError("Failed to process voice transcript")
    }
  }

  // Basic symptom extraction without AI
  const extractBasicSymptoms = (transcript: string): string => {
    const medicalKeywords = [
      'pain', 'headache', 'fever', 'cough', 'nausea', 'vomiting', 'diarrhea', 
      'fatigue', 'tired', 'dizzy', 'sore throat', 'congestion', 'shortness of breath',
      'chest pain', 'abdominal pain', 'back pain', 'joint pain', 'muscle pain',
      'chills', 'sweating', 'rash', 'itching', 'swelling', 'bleeding', 'bruising',
      'difficulty breathing', 'stomach ache', 'upset stomach', 'stuffy nose',
      'runny nose', 'sneezing', 'wheezing', 'burning', 'stinging', 'aching',
      'throbbing', 'sharp pain', 'dull pain', 'cramps', 'spasms', 'weakness',
      'numbness', 'tingling', 'stiffness', 'inflammation', 'infection',
      'temperature', 'hot', 'cold', 'shivering', 'trembling', 'shaking'
    ]
    
    const timeKeywords = [
      'days', 'day', 'hours', 'hour', 'minutes', 'minute', 'weeks', 'week',
      'months', 'month', 'yesterday', 'today', 'morning', 'afternoon', 'evening',
      'night', 'ago', 'since', 'for', 'started', 'began', 'began', 'ongoing'
    ]
    
    // Split into sentences and filter for medical content
    const sentences = transcript.split(/[.!?]+/).filter(sentence => {
      const lowerSentence = sentence.toLowerCase()
      return sentence.trim().length > 0 && 
             medicalKeywords.some(keyword => lowerSentence.includes(keyword.toLowerCase()))
    })
    
    if (sentences.length > 0) {
      // Extract and format medical sentences
      const medicalSentences = sentences.map(sentence => {
        const trimmed = sentence.trim()
        // Capitalize first letter if not already
        return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
      })
      
      return `Medical symptoms from conversation:\n${medicalSentences.join('. ')}.`
    } else {
      // If no medical keywords found, look for common patient expressions
      const patientExpressions = [
        'feel', 'feeling', 'hurt', 'hurts', 'uncomfortable', 'sick', 'ill',
        'problem', 'issue', 'trouble', 'wrong', 'bad', 'worse', 'better'
      ]
      
      const generalSentences = transcript.split(/[.!?]+/).filter(sentence => {
        const lowerSentence = sentence.toLowerCase()
        return sentence.trim().length > 0 && 
               patientExpressions.some(expr => lowerSentence.includes(expr.toLowerCase()))
      })
      
      if (generalSentences.length > 0) {
        return `Patient statements from conversation:\n${generalSentences.join('. ').trim()}.`
      } else {
        return `Patient conversation transcript:\n"${transcript.trim()}"`
      }
    }
  }

  const clearVoiceTranscript = () => {
    setVoiceTranscript("")
    setVoiceError(null)
  }

  useEffect(() => {
    const initWorker = async () => {
      try {
        const tesseractWorker = await createWorker("eng")
        setWorker(tesseractWorker)
      } catch (error) {
        console.error("Failed to initialize OCR engine:", error)
        setError("Failed to initialize OCR engine. Please try again.")
      }
    }

    initWorker()

    return () => {
      if (worker) {
        worker.terminate()
      }
    }
  }, [])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Check file sizes before adding
      const oversizedFiles = Array.from(e.target.files).filter((file) => file.size > MAX_IMAGE_SIZE)

      if (oversizedFiles.length > 0) {
        setError(`One or more images exceed the 20MB size limit. Please upload smaller images.`)
        // Reset the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
        return
      }

      const newImages = Array.from(e.target.files).map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }))

      setImages((prev) => [...prev, ...newImages])
      setError(null) // Clear any previous errors
    }

    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const removeImage = (index: number) => {
    setImages((prev) => {
      const updated = [...prev]
      URL.revokeObjectURL(updated[index].preview) // Clean up the object URL
      updated.splice(index, 1)
      return updated
    })
  }

  // Function to extract text from image using Tesseract OCR
  const extractTextFromImage = async (file: File, index: number): Promise<string> => {
    if (!worker) {
      throw new Error("OCR worker not initialized")
    }

    try {
      // Recognize without passing a function for progress tracking
      const result = await worker.recognize(file)
      const extractedText = result.data.text
      return extractedText
    } catch (error) {
      console.error("Error extracting text:", error)
      throw new Error(`Failed to extract text from image: ${file.name}`)
    }
  }

  // Extract diagnosis from AI response
  const extractDiagnosis = (aiResponse: string): string => {
    try {
      // Look for common diagnosis patterns
      const lines = aiResponse.split("\n")

      // Look for sections that might contain diagnosis
      const diagnosisKeywords = [
        "POSSIBLE DIAGNOSES",
        "DIAGNOSIS",
        "LIKELY CONDITION",
        "MOST PROBABLE",
        "PRIMARY DIAGNOSIS",
      ]

      let diagnosisSection = ""
      let inDiagnosisSection = false

      for (const line of lines) {
        const upperLine = line.toUpperCase()

        // Check if we're entering a diagnosis section
        if (diagnosisKeywords.some((keyword) => upperLine.includes(keyword))) {
          inDiagnosisSection = true
          continue
        }

        // If we're in diagnosis section and hit another major section, stop
        if (inDiagnosisSection && upperLine.includes("---") && upperLine.includes("RECOMMENDED")) {
          break
        }

        // Collect diagnosis content
        if (inDiagnosisSection && line.trim()) {
          diagnosisSection += line + " "
        }
      }

      // If we found a diagnosis section, extract the first meaningful diagnosis
      if (diagnosisSection) {
        // Look for bold text (likely conditions) or bullet points
        const boldMatches = diagnosisSection.match(/\*\*(.*?)\*\*/g)
        if (boldMatches && boldMatches.length > 0) {
          return boldMatches[0].replace(/\*\*/g, "").trim()
        }

        // Look for bullet points with conditions
        const bulletMatches = diagnosisSection.match(/[-•]\s*([^-•\n]+)/g)
        if (bulletMatches && bulletMatches.length > 0) {
          return bulletMatches[0].replace(/[-•]\s*/, "").trim()
        }

        // Return first sentence if no specific pattern found
        const firstSentence = diagnosisSection.split(".")[0]
        if (firstSentence && firstSentence.length > 10) {
          return firstSentence.trim()
        }
      }

      // Fallback: look for any bold text in the entire response
      const allBoldMatches = aiResponse.match(/\*\*(.*?)\*\*/g)
      if (allBoldMatches && allBoldMatches.length > 0) {
        return allBoldMatches[0].replace(/\*\*/g, "").trim()
      }

      // Final fallback
      return "Diagnosis pending further evaluation"
    } catch (error) {
      console.error("Error extracting diagnosis:", error)
      return "Diagnosis extraction failed"
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!symptoms.trim() && images.length === 0) {
      setError("Please enter symptoms or upload an image")
      return
    }

    if (!selectedPatient) {
      setError("No patient selected")
      return
    }

    try {
      setLoading(true)
      setError(null)
      setExtractedText([])

      // Process images with OCR if any
      const extractedTextArray: string[] = []

      if (images.length > 0) {
        setProcessingImages(true)

        for (let i = 0; i < images.length; i++) {
          try {
            const text = await extractTextFromImage(images[i].file, i)
            extractedTextArray.push(text)
          } catch (err) {
            console.error(`Failed to process image ${images[i].file.name}:`, err)
          }
        }

        setExtractedText(extractedTextArray)
        setProcessingImages(false)
      }

      // Format the extracted text to clearly indicate it's lab data
      const formattedLabData = extractedTextArray
        .map((text, index) => {
          return `
=== LAB REPORT ${index + 1} ===
${text.trim()}
===============================
        `.trim()
        })
        .join("\n\n")

      // Create the prompt for the API with ALL extracted text and formatting instructions
      const prompt = `
I need a comprehensive medical assessment based on the following information:

PATIENT SYMPTOMS:
${symptoms.trim() || "No symptoms provided"}

${
  extractedTextArray.length > 0
    ? `
LAB REPORT DATA (EXTRACTED FROM MEDICAL DOCUMENTS):
${formattedLabData}

IMPORTANT INSTRUCTION: The text above contains the COMPLETE raw data extracted from lab report images using OCR technology. This is ALL the lab data available for analysis. Please analyze this data carefully as if you were reading a lab report. Even though it may contain OCR errors or formatting issues, it contains valuable medical information such as test results, reference ranges, and medical measurements.
`
    : `
IMPORTANT NOTE: The patient did not provide any lab reports or medical test results. Your assessment will be based solely on the reported symptoms.
`
}

Based on the information provided, please create a comprehensive medical assessment with the following SPECIFIC FORMATTING REQUIREMENTS:

1. SECTION HEADINGS: Make all section headings very distinct by using ALL CAPS and adding a line of dashes below each heading.

2. LAB ANALYSIS:
   ${
     extractedTextArray.length > 0
       ? `- DO NOT repeat all the lab values in your response
   - Simply mention which values were abnormal and their significance
   - Focus on interpreting what these abnormal values indicate, not listing them all`
       : "- Note that no lab data was provided"
   }

3. POSSIBLE DIAGNOSES:
   - List the most likely conditions based on ${
     extractedTextArray.length > 0 ? "both the symptoms AND the lab report data" : "the symptoms"
   }
   - Make the names of specific diseases/conditions BOLD
   - Explain the reasoning behind each potential diagnosis

4. RECOMMENDED FURTHER TESTS:
   - Include this as a separate, distinct section
   - List specific tests that would help confirm or rule out the potential diagnoses
   - Explain why each test would be helpful

5. URGENT CARE GUIDANCE:
   - Clearly indicate when the patient should seek immediate medical attention
   - List specific warning signs that would require emergency care

6. MANAGEMENT ADVICE:
   - Provide practical advice for managing the symptoms
   - Include both medication and non-medication approaches if applicable

Format your response with clear headings and bullet points. Make the section headings stand out visually.

IMPORTANT: Include a disclaimer that this is not professional medical advice and the patient should consult with a healthcare provider.
      `.trim()

      console.log("🤖 Sending prompt to AI...")
      const diagnosis = await analyzeSymptomsWithAI(prompt)
      setResult(diagnosis)
      setActiveTab("result") // Switch to result tab when we get a response

      // Auto-delete images after getting response
      setImages((prev) => {
        // Clean up object URLs
        prev.forEach((img) => URL.revokeObjectURL(img.preview))
        return []
      })
    } catch (err: any) {
      const errorMessage = err.message || "Failed to analyze symptoms"
      setError(`An error occurred: ${errorMessage}`)
      console.error(err)
    } finally {
      setLoading(false)
      setProcessingImages(false)
    }
  }

  const handleSaveVisit = async () => {
    if (!selectedPatient || !symptoms.trim() || !result) {
      setError("Missing required data to save visit")
      return
    }

    // Show the doctor's diagnosis dialog
    setShowDoctorDialog(true)
  }

  const handleConfirmSaveVisit = async () => {
    if (!selectedPatient || !symptoms.trim() || !result) {
      setError("Missing required data to save visit")
      return
    }

    try {
      setCreatingVisit(true)
      setError(null)

      console.log("💾 Saving visit to Airtable...")
      console.log("👨‍⚕️ Doctor's diagnosis:", doctorsDiagnosis || "(empty - will use 'Same as AI model')")

      let newVisit: Visit

      try {
        // Try with datetime format first - now with doctor's diagnosis
        newVisit = await createVisitWithDiagnosis(selectedPatient.id, symptoms, doctorsDiagnosis)
      } catch (dateError: any) {
        console.log("⚠️ Datetime format failed, trying date-only format...")

        // Extract diagnosis from the current result
        const extractedDiagnosis = extractDiagnosis(result)

        // Try with date-only format as fallback - now with doctor's diagnosis
        newVisit = await createVisitWithDateOnly(selectedPatient.id, symptoms, extractedDiagnosis, doctorsDiagnosis)
      }

      console.log("✅ Visit saved successfully:", newVisit)

      // Clear form and close dialog
      setSymptoms("")
      setResult(null)
      setExtractedText([])
      setDoctorsDiagnosis("")
      setShowDoctorDialog(false)

      // Notify parent component
      onVisitCreated(newVisit)
    } catch (err: any) {
      console.error("❌ Error saving visit:", err)
      setError(`Failed to save visit: ${err.message}`)
    } finally {
      setCreatingVisit(false)
    }
  }

  const copyToClipboard = () => {
    if (result) {
      navigator.clipboard.writeText(result)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Describe Patient's Symptoms</h3>
        <p className="text-gray-600 mb-4">
          Please provide detailed information about the patient's symptoms, including when they started, their severity,
          and any other relevant health information.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <Textarea
              placeholder="Example: Patient has had a headache for 3 days, along with a mild fever of 100°F and a sore throat..."
              className="min-h-[150px] text-base"
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
            />

            {/* Voice Recording Controls */}
            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Voice Recording (Whisper AI)</span>
                </div>
                
                {voiceTranscript && (
                  <Badge variant="secondary" className="text-xs">
                    Transcript ready
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                {!isRecording ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={startVoiceRecording}
                          disabled={processingVoice}
                          className="flex items-center gap-2"
                        >
                          <Mic className="h-4 w-4" />
                          Start Recording
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Record patient-doctor conversation using OpenAI Whisper</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={stopVoiceRecording}
                    disabled={processingVoice}
                    className="flex items-center gap-2 animate-pulse"
                  >
                    <MicOff className="h-4 w-4" />
                    Recording... (Click to stop)
                  </Button>
                )}

                {processingVoice && (
                  <Button type="button" size="sm" disabled className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Transcribing...
                  </Button>
                )}
              </div>
            </div>

            {/* Voice Transcript Display */}
            {voiceTranscript && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Mic className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Whisper AI Transcript</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearVoiceTranscript}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-blue-700 italic">"{voiceTranscript}"</p>
                <div className="flex items-center justify-between mt-3">
                  <p className="text-xs text-blue-600">
                    Transcription completed. Use the button to extract symptoms manually if needed.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => extractSymptomsFromTranscript(voiceTranscript)}
                    disabled={processingVoice}
                    className="bg-white hover:bg-blue-50 border-blue-300 text-blue-700"
                  >
                    {processingVoice ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Plus className="h-3 w-3 mr-1" />
                        Extract Symptoms
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Voice Error Display */}
            {voiceError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{voiceError}</AlertDescription>
              </Alert>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-gray-900">Upload Medical Lab Reports</h4>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-gray-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-sm">
                        Upload images of medical lab reports, test results, or other medical documents. Our system will
                        extract the text and data from these images to include in your diagnosis. Images must be under
                        20MB each.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <span className="text-xs text-gray-500">Optional (Max 20MB per image)</span>
            </div>

            <div className="flex flex-wrap gap-3">
              {images.map((img, index) => (
                <div key={index} className="relative group">
                  <div className="w-24 h-24 rounded-lg overflow-hidden border border-gray-200">
                    <Image
                      src={img.preview || "/placeholder.svg"}
                      alt={`Uploaded image ${index + 1}`}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors"
              >
                <ImagePlus className="h-6 w-6 mb-1" />
                <span className="text-xs">Add Image</span>
              </button>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                multiple
                className="hidden"
              />
            </div>

            {images.length > 0 && (
              <div className="flex items-center gap-2 bg-blue-50 p-3 rounded-md">
                <Microscope className="h-4 w-4 text-blue-600" />
                <div className="text-xs text-blue-700">
                  <p className="font-medium">Lab Report Processing</p>
                  <p>
                    {images.length} image{images.length !== 1 ? "s" : ""} will be processed with OCR to extract medical
                    data and test results for analysis
                  </p>
                </div>
              </div>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {processingImages ? "Extracting Data from Lab Reports..." : "Analyzing Medical Information..."}
              </>
            ) : (
              "Analyze Symptoms & Lab Reports"
            )}
          </Button>
        </form>
      </div>

      {result && (
        <Card className="border-l-4 border-blue-500 mt-8 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 py-2 px-6 flex justify-between items-center">
              <TabsList className="bg-transparent">
                <TabsTrigger
                  value="result"
                  className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-blue-100"
                >
                  Diagnostic Assessment
                </TabsTrigger>
                <TabsTrigger
                  value="chat"
                  className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-blue-100"
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Chat with AI
                </TabsTrigger>
              </TabsList>

              {activeTab === "result" && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={copyToClipboard}
                        className="text-white hover:bg-white/20"
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        <span className="sr-only">Copy to clipboard</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{copied ? "Copied!" : "Copy to clipboard"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>

            <TabsContent value="result" className="p-6 m-0">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold">AI Diagnostic Assessment</h3>
                <Button onClick={handleSaveVisit} disabled={creatingVisit} className="bg-green-600 hover:bg-green-700">
                  {creatingVisit ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving Visit...
                    </>
                  ) : (
                    "Add Visit to Patient Record"
                  )}
                </Button>
              </div>

              <div className="prose prose-blue max-w-none">
                <div className="text-gray-700 whitespace-pre-wrap">{result}</div>
              </div>

              <div className="mt-4 text-sm text-gray-500">
                <p className="font-medium">Important Disclaimer:</p>
                <p>
                  This AI-generated assessment is for informational purposes only and should not replace professional
                  medical advice. Please consult with a healthcare provider for proper diagnosis and treatment.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="chat" className="m-0 min-h-[400px] flex flex-col">
              <div className="flex-1">
                <ChatInterface initialMessage={result} />
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      )}

      {/* Doctor's Diagnosis Dialog */}
      <Dialog open={showDoctorDialog} onOpenChange={setShowDoctorDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Confirm Diagnosis</DialogTitle>
            <DialogDescription>
              Please review the AI diagnosis and provide your professional assessment.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">AI Model Diagnosis:</Label>
              <div className="mt-1 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm">
                {result ? extractDiagnosis(result) : "No diagnosis available"}
              </div>
            </div>
            
            <div>
              <Label htmlFor="doctorsDiagnosis" className="text-sm font-medium text-gray-700">
                Your Professional Diagnosis (Optional):
              </Label>
              <Textarea
                id="doctorsDiagnosis"
                placeholder="Enter your diagnosis here, or leave empty to use 'Same as AI model'"
                value={doctorsDiagnosis}
                onChange={(e) => setDoctorsDiagnosis(e.target.value)}
                className="mt-1"
                rows={3}
              />
              <p className="mt-1 text-xs text-gray-500">
                If left empty, "Same as AI model" will be recorded in the patient record.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowDoctorDialog(false)}
              disabled={creatingVisit}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleConfirmSaveVisit}
              disabled={creatingVisit}
              className="bg-green-600 hover:bg-green-700"
            >
              {creatingVisit ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving Visit...
                </>
              ) : (
                "Save Visit to Record"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
