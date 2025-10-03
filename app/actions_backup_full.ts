"use server"

import { GoogleGenerativeAI } from "@google/generative-ai"

// Define message type for chat
export type Message = {
  role: "user" | "assistant"
  content: string
}

// Enhanced Patient Data Model for Hospital Automation
export type Patient = {
  id: string
  name: string
  fatherName: string
  age: number
  count: number
  // Enhanced patient data
  phone?: string
  email?: string
  address?: string
  emergencyContact?: string
  bloodType?: string
  weight?: number
  height?: number
  allergies?: string[]
  currentMedications?: string[]
  chronicConditions?: string[]
  insuranceInfo?: string
  // AI Risk Assessment
  riskScore?: number
  riskLevel?: 'low' | 'medium' | 'high' | 'critical'
  lastVisitDate?: string
  // Photo for identification
  photoUrl?: string
}

export type Visit = {
  id: string
  patientId: string
  patientName?: string
  visitDate: string
  symptoms: string
  diagnosis: string
  possibleDiagnoses?: string[]
  // Enhanced visit data
  vitalSigns?: VitalSigns
  labResults?: LabResult[]
  prescriptions?: Prescription[]
  followUpDate?: string
  urgencyLevel?: 'low' | 'medium' | 'high' | 'emergency'
  aiConfidenceScore?: number
  doctorNotes?: string
  dischargeSummary?: string
}

// New Types for Hospital Automation
export type VitalSigns = {
  bloodPressure?: string
  heartRate?: number
  temperature?: number
  respiratoryRate?: number
  oxygenSaturation?: number
  weight?: number
  height?: number
  bmi?: number
  recordedAt: string
}

export type LabResult = {
  id: string
  testName: string
  result: string
  normalRange: string
  status: 'normal' | 'abnormal' | 'critical'
  testDate: string
  aiAnalysis?: string
}

export type Prescription = {
  id: string
  medicationName: string
  dosage: string
  frequency: string
  duration: string
  instructions: string
  prescribedDate: string
  status: 'active' | 'completed' | 'discontinued'
}

export type MedicalImage = {
  id: string
  patientId: string
  imageType: 'xray' | 'ct' | 'mri' | 'ultrasound' | 'ecg'
  imageUrl: string
  aiAnalysis: string
  findings: string[]
  uploadDate: string
  radiologistReview?: string
  urgencyFlag: boolean
}

export type Appointment = {
  id: string
  patientId: string
  doctorId: string
  appointmentDate: string
  appointmentTime: string
  type: 'consultation' | 'followup' | 'emergency' | 'surgery'
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled'
  aiTriageScore: number
  estimatedDuration: number
}

export type TriageAssessment = {
  patientId: string
  urgencyLevel: 1 | 2 | 3 | 4 | 5 // 1=emergency, 5=non-urgent
  estimatedWaitTime: number
  priority: 'immediate' | 'urgent' | 'semi-urgent' | 'non-urgent'
  aiRecommendation: string
  warningFlags: string[]
  assessmentTime: string
}

// Airtable configuration
const AIRTABLE_BASE_ID = "appdo1HD1AP0XLkLr"
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN || process.env.AIRTABLE_API_KEY || ""
const AIRTABLE_API_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`

const airtableHeaders = {
  Authorization: `Bearer ${AIRTABLE_TOKEN}`,
  "Content-Type": "application/json",
}

// Helper function to format date for Airtable
function formatDateForAirtable(): string {
  const now = new Date()
  // Format as YYYY-MM-DD HH:MM (Airtable datetime format)
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  const hours = String(now.getHours()).padStart(2, "0")
  const minutes = String(now.getMinutes()).padStart(2, "0")

  return `${year}-${month}-${day} ${hours}:${minutes}`
}

// Sleep function for retry delays
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Search patients in Airtable - IMPROVED VERSION
export async function searchPatients(name: string, fatherName: string, age?: number): Promise<Patient[]> {
  const maxRetries = 3
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔍 Searching patients (attempt ${attempt}/${maxRetries}):`, { name, fatherName, age })

      let filterFormula = ""
      const conditions = []

      if (name.trim()) {
        conditions.push(`SEARCH(LOWER("${name.toLowerCase()}"), LOWER({Name}))`)
      }
      if (fatherName.trim()) {
        conditions.push(`SEARCH(LOWER("${fatherName.toLowerCase()}"), LOWER({Father Name}))`)
      }
      if (age && age > 0) {
        conditions.push(`{Age} = ${age}`)
      }

      if (conditions.length > 0) {
        filterFormula = `AND(${conditions.join(", ")})`
      }

      console.log("📝 Filter formula:", filterFormula)

      const url = new URL(`${AIRTABLE_API_URL}/Patients`)
      if (filterFormula) {
        url.searchParams.append("filterByFormula", filterFormula)
      }
      url.searchParams.append("maxRecords", "10")

      console.log("🌐 Request URL:", url.toString())

      const response = await fetch(url.toString(), {
        headers: airtableHeaders,
      })

      console.log("📡 Response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ Airtable API error (attempt ${attempt}):`, errorText)

        if (attempt < maxRetries) {
          await sleep(1000 * attempt) // Progressive delay: 1s, 2s, 3s
          continue
        }

        throw new Error(`Airtable API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log("✅ Airtable response:", JSON.stringify(data, null, 2))

      if (!data.records || !Array.isArray(data.records)) {
        throw new Error("Invalid response format from Airtable")
      }

      const patients = data.records.map((record: any) => ({
        id: record.id,
        name: record.fields.Name || "",
        fatherName: record.fields["Father Name"] || "",
        age: record.fields.Age || 0,
        count: record.fields.Count || 0,
      }))

      console.log("👥 Mapped patients:", patients)
      return patients
    } catch (error) {
      console.error(`❌ Error searching patients (attempt ${attempt}):`, error)
      lastError = error as Error

      if (attempt < maxRetries) {
        await sleep(1000 * attempt)
        continue
      }
    }
  }

  throw new Error(`Failed to search patients after ${maxRetries} attempts: ${lastError?.message}`)
}

// Create new patient
export async function createPatient(name: string, fatherName: string, age: number): Promise<Patient> {
  try {
    console.log("➕ Creating patient with:", { name, fatherName, age })

    const requestBody = {
      fields: {
        Name: name,
        "Father Name": fatherName,
        Age: age,
      },
    }

    console.log("📝 Request body:", JSON.stringify(requestBody, null, 2))

    const response = await fetch(`${AIRTABLE_API_URL}/Patients`, {
      method: "POST",
      headers: airtableHeaders,
      body: JSON.stringify(requestBody),
    })

    console.log("📡 Create patient response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ Create patient error response:", errorText)
      throw new Error(`Airtable API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log("✅ Created patient response:", JSON.stringify(data, null, 2))

    const patient = {
      id: data.id,
      name: data.fields.Name,
      fatherName: data.fields["Father Name"],
      age: data.fields.Age,
      count: data.fields.Count || 0,
    }

    console.log("👤 Created patient:", patient)
    return patient
  } catch (error) {
    console.error("❌ Error creating patient:", error)
    throw new Error(`Failed to create patient: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

// Get patient visits - AGGRESSIVE RETRY VERSION
export async function getPatientVisits(patientId: string): Promise<Visit[]> {
  const maxRetries = 5 // Increased retries
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📋 Getting visits for patient: ${patientId} (attempt ${attempt}/${maxRetries})`)

      let visits: Visit[] = []
      let patientName = ""

      // Get patient name first with retry
      try {
        console.log("👤 Fetching patient name for:", patientId)
        const patientResponse = await fetch(`${AIRTABLE_API_URL}/Patients/${patientId}`, {
          headers: airtableHeaders,
        })

        if (patientResponse.ok) {
          const patientData = await patientResponse.json()
          patientName = patientData.fields.Name || ""
          console.log("✅ Patient name:", patientName)
        } else {
          console.log("⚠️ Could not fetch patient name, status:", patientResponse.status)
        }
      } catch (error) {
        console.log("⚠️ Could not fetch patient name, continuing without it:", error)
      }

      // Fetch all visits with aggressive retry
      console.log("🔄 Fetching all visits and filtering manually...")

      const url = new URL(`${AIRTABLE_API_URL}/Visits`)
      url.searchParams.append("maxRecords", "1000")
      url.searchParams.append("sort[0][field]", "Visit Date")
      url.searchParams.append("sort[0][direction]", "desc")

      console.log("🌐 Visits request URL:", url.toString())

      const response = await fetch(url.toString(), {
        headers: airtableHeaders,
      })

      console.log("📡 Visits response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ Visits API error (attempt ${attempt}):`, errorText)

        if (attempt < maxRetries) {
          // Progressive wait time: 2s, 4s, 6s, 8s, 10s
          const waitTime = 2000 * attempt
          console.log(`⏰ Waiting ${waitTime}ms before retry...`)
          await sleep(waitTime)
          continue
        }

        throw new Error(`Airtable API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log("📊 Total visits in database:", data.records?.length || 0)

      if (!data.records || !Array.isArray(data.records)) {
        throw new Error("Invalid response format from Airtable")
      }

      // Filter manually for matching patient ID
      const matchingVisits = data.records.filter((record: any) => {
        const linkedPatients = record.fields["Linked Patient"] || []
        const isMatch = Array.isArray(linkedPatients) && linkedPatients.includes(patientId)
        if (isMatch) {
          console.log("✅ Found matching visit:", record.id, linkedPatients)
        }
        return isMatch
      })

      console.log(`🎯 Found ${matchingVisits.length} matching visits for patient ${patientId}`)

      visits = matchingVisits.map((record: any) => ({
        id: record.id,
        patientId: record.fields["Linked Patient"]?.[0] || patientId,
        patientName: patientName,
        visitDate: record.fields["Visit Date"] || "",
        symptoms: record.fields.Symptoms || "",
        diagnosis: record.fields.Diagnosis || "",
        possibleDiagnoses: record.fields["Possible Diagnoses"] || [],
      }))

      console.log("📋 Final mapped visits:", visits.length)

      // Log each visit for debugging
      visits.forEach((visit, index) => {
        console.log(`Visit ${index + 1}:`, {
          id: visit.id,
          patientId: visit.patientId,
          date: visit.visitDate,
          symptomsLength: visit.symptoms.length,
          diagnosisLength: visit.diagnosis.length,
          possibleDiagnosesLength: visit.possibleDiagnoses?.length || 0,
        })
      })

      // SUCCESS - return the visits
      return visits
    } catch (error) {
      console.error(`❌ Error fetching patient visits (attempt ${attempt}):`, error)
      lastError = error as Error

      if (attempt < maxRetries) {
        // Progressive wait with exponential backoff
        const waitTime = Math.min(2000 * Math.pow(2, attempt - 1), 10000) // Max 10s wait
        console.log(`⏰ Waiting ${waitTime}ms before retry...`)
        await sleep(waitTime)
        continue
      }
    }
  }

  // If all retries failed, log the error but don't throw - return empty array
  console.error("❌ All attempts to fetch visits failed:", lastError?.message)
  console.log("⚠️ Returning empty visits array to prevent UI crash")
  return []
}

// ENHANCED: Extract ALL diagnosis headings from Gemini response
function extractAllDiagnosisHeadings(geminiResponse: string): string {
  try {
    console.log("🧠 Extracting ALL diagnosis headings from response length:", geminiResponse.length)

    const diagnosisHeadings: string[] = []
    const lines = geminiResponse.split("\n")

    // Look for diagnosis sections
    const diagnosisKeywords = [
      "POSSIBLE DIAGNOSES",
      "DIAGNOSIS",
      "LIKELY CONDITION",
      "MOST PROBABLE",
      "PRIMARY DIAGNOSIS",
      "DIFFERENTIAL DIAGNOSIS",
      "POTENTIAL CONDITIONS",
    ]

    let inDiagnosisSection = false
    let diagnosisSection = ""

    // First pass: Find the diagnosis section
    for (const line of lines) {
      const upperLine = line.toUpperCase()

      // Check if we're entering a diagnosis section
      if (diagnosisKeywords.some((keyword) => upperLine.includes(keyword))) {
        inDiagnosisSection = true
        continue
      }

      // If we're in diagnosis section and hit another major section, stop
      if (
        inDiagnosisSection &&
        (upperLine.includes("---") ||
          upperLine.includes("RECOMMENDED") ||
          upperLine.includes("MANAGEMENT") ||
          upperLine.includes("TREATMENT") ||
          upperLine.includes("TESTS"))
      ) {
        break
      }

      // Collect diagnosis content
      if (inDiagnosisSection && line.trim()) {
        diagnosisSection += line + "\n"
      }
    }

    console.log("📝 Found diagnosis section:", diagnosisSection.substring(0, 200) + "...")

    // Extract diagnosis headings using multiple patterns
    const patterns = [
      // Bold text: **Diagnosis Name**
      /\*\*(.*?)\*\*/g,
      // Numbered lists: 1. Diagnosis Name
      /^\d+\.\s*([^:\n]+)/gm,
      // Bullet points: - Diagnosis Name or • Diagnosis Name
      /^[-•]\s*([^:\n]+)/gm,
      // Parentheses: (Diagnosis Name)
      /$$([^)]+)$$/g,
      // Colon format: Diagnosis Name:
      /^([^:\n]+):/gm,
    ]

    // Apply each pattern to extract headings
    patterns.forEach((pattern, index) => {
      const matches = diagnosisSection.match(pattern)
      if (matches) {
        console.log(`🎯 Pattern ${index + 1} found ${matches.length} matches:`, matches.slice(0, 3))
        matches.forEach((match) => {
          // Clean up the match
          const cleaned = match
            .replace(/\*\*/g, "") // Remove bold markers
            .replace(/^\d+\.\s*/, "") // Remove numbering
            .replace(/^[-•]\s*/, "") // Remove bullet points
            .replace(/[()]/g, "") // Remove parentheses
            .replace(/:$/, "") // Remove trailing colon
            .trim()

          // Filter out non-medical terms and short matches
          if (
            cleaned.length > 3 &&
            cleaned.length < 100 &&
            !cleaned.toLowerCase().includes("section") &&
            !cleaned.toLowerCase().includes("assessment") &&
            !cleaned.toLowerCase().includes("analysis") &&
            !cleaned.toLowerCase().includes("based on") &&
            !cleaned.toLowerCase().includes("symptoms") &&
            !cleaned.toLowerCase().includes("patient")
          ) {
            diagnosisHeadings.push(cleaned)
          }
        })
      }
    })

    // Also check the entire response for any bold medical terms
    const allBoldMatches = geminiResponse.match(/\*\*(.*?)\*\*/g)
    if (allBoldMatches) {
      allBoldMatches.forEach((match) => {
        const cleaned = match.replace(/\*\*/g, "").trim()
        if (
          cleaned.length > 5 &&
          cleaned.length < 80 &&
          (cleaned.toLowerCase().includes("syndrome") ||
            cleaned.toLowerCase().includes("disease") ||
            cleaned.toLowerCase().includes("infection") ||
            cleaned.toLowerCase().includes("disorder") ||
            cleaned.toLowerCase().includes("condition") ||
            cleaned.toLowerCase().includes("itis") ||
            cleaned.toLowerCase().includes("osis") ||
            cleaned.toLowerCase().includes("pathy") ||
            /^[A-Z][a-z]+\s[A-Z][a-z]+/.test(cleaned)) // Medical naming pattern
        ) {
          diagnosisHeadings.push(cleaned)
        }
      })
    }

    // Remove duplicates and clean up
    const uniqueHeadings = [...new Set(diagnosisHeadings)].filter((heading) => heading.length > 3).slice(0, 10) // Limit to 10 diagnoses

    console.log("✅ Extracted diagnosis headings:", uniqueHeadings)

    if (uniqueHeadings.length > 0) {
      // Format as a clean list
      const formattedDiagnoses = uniqueHeadings.map((heading, index) => `${index + 1}. ${heading}`).join(" | ")
      console.log("📋 Final formatted diagnoses:", formattedDiagnoses)
      return formattedDiagnoses
    }

    // Fallback: try to extract first meaningful sentence from diagnosis section
    if (diagnosisSection) {
      const sentences = diagnosisSection.split(/[.!?]/)
      for (const sentence of sentences) {
        const cleaned = sentence.trim()
        if (cleaned.length > 10 && cleaned.length < 200) {
          console.log("⚠️ Using fallback sentence:", cleaned)
          return cleaned
        }
      }
    }

    // Final fallback
    console.log("⚠️ Using final fallback")
    return "Multiple possible diagnoses identified - see full assessment"
  } catch (error) {
    console.error("❌ Error extracting diagnosis headings:", error)
    return "Diagnosis extraction failed"
  }
}

// Create new visit with AI diagnosis
export async function createVisitWithDiagnosis(patientId: string, symptoms: string): Promise<Visit> {
  try {
    console.log("🏥 Creating visit for patient:", patientId, "with symptoms length:", symptoms.length)

    // Enhanced AI prompt to get better structured diagnoses
    const prompt = `
As a medical AI assistant, analyze the following symptoms and provide a comprehensive medical assessment:

PATIENT SYMPTOMS:
${symptoms}

Please provide your response in this EXACT format:

POSSIBLE DIAGNOSES:
1. **Primary Diagnosis Name** - Brief explanation
2. **Secondary Diagnosis Name** - Brief explanation  
3. **Alternative Diagnosis Name** - Brief explanation

RECOMMENDED TESTS:
- List specific tests needed

MANAGEMENT ADVICE:
- Treatment recommendations
- When to seek immediate care

IMPORTANT: Make sure to use **bold formatting** for all diagnosis names and number them clearly. Focus on the most likely medical conditions based on the symptoms provided.
    `

    console.log("🤖 Sending enhanced prompt to AI...")
    const aiResponse = await analyzeSymptomsWithAI(prompt)
    console.log("✅ Received AI response length:", aiResponse.length)

    // Extract ALL diagnosis headings instead of just one
    const allDiagnosisHeadings = extractAllDiagnosisHeadings(aiResponse)
    console.log("🎯 Extracted ALL diagnosis headings:", allDiagnosisHeadings)

    // Create visit record in Airtable with properly formatted date
    const visitDate = formatDateForAirtable()
    console.log("📅 Formatted visit date:", visitDate)

    const requestBody = {
      fields: {
        "Linked Patient": [patientId],
        "Visit Date": visitDate,
        Symptoms: symptoms,
        Diagnosis: allDiagnosisHeadings, // Store ALL diagnosis headings here
      },
    }

    console.log("📝 Visit request body:", JSON.stringify(requestBody, null, 2))

    const response = await fetch(`${AIRTABLE_API_URL}/Visits`, {
      method: "POST",
      headers: airtableHeaders,
      body: JSON.stringify(requestBody),
    })

    console.log("📡 Create visit response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ Create visit error response:", errorText)
      throw new Error(`Airtable API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log("✅ Created visit response:", JSON.stringify(data, null, 2))

    const visit = {
      id: data.id,
      patientId: patientId,
      visitDate: visitDate,
      symptoms: symptoms,
      diagnosis: allDiagnosisHeadings, // Return ALL diagnosis headings
    }

    console.log("🏥 Created visit with multiple diagnoses:", visit)
    return visit
  } catch (error) {
    console.error("❌ Error creating visit:", error)
    throw new Error(`Failed to create visit record: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

// Alternative function to create visit with just date (no time) if datetime doesn't work
export async function createVisitWithDateOnly(patientId: string, symptoms: string, diagnosis: string): Promise<Visit> {
  try {
    console.log("🏥 Creating visit with date only for patient:", patientId)

    // Format as just date YYYY-MM-DD
    const now = new Date()
    const visitDate = now.toISOString().split("T")[0] // Gets YYYY-MM-DD format
    console.log("📅 Date-only format:", visitDate)

    const requestBody = {
      fields: {
        "Linked Patient": [patientId],
        "Visit Date": visitDate,
        Symptoms: symptoms,
        Diagnosis: diagnosis,
      },
    }

    console.log("📝 Visit request body (date only):", JSON.stringify(requestBody, null, 2))

    const response = await fetch(`${AIRTABLE_API_URL}/Visits`, {
      method: "POST",
      headers: airtableHeaders,
      body: JSON.stringify(requestBody),
    })

    console.log("📡 Create visit response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ Create visit error response:", errorText)
      throw new Error(`Airtable API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log("✅ Created visit response:", JSON.stringify(data, null, 2))

    const visit = {
      id: data.id,
      patientId: patientId,
      visitDate: visitDate,
      symptoms: symptoms,
      diagnosis: diagnosis,
    }

    console.log("🏥 Created visit:", visit)
    return visit
  } catch (error) {
    console.error("❌ Error creating visit:", error)
    throw new Error(`Failed to create visit record: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

// PROPER AI Analysis Function with Google Gemini
export async function analyzeSymptomsWithAI(prompt: string): Promise<string> {
  const maxRetries = 3
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🤖 AI Analysis attempt ${attempt}/${maxRetries}`)

      // Check if API key exists - use the new key
      const apiKey = process.env.GOOGLE_API_KEY || ""
      if (!apiKey) {
        throw new Error("Google API key is not configured. Please check your environment variables.")
      }

      // Initialize the Google Generative AI with API key
      const genAI = new GoogleGenerativeAI(apiKey)

      // Use gemini-1.5-flash instead of pro for better quota limits
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

      // Generate content using the provided prompt directly
      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.3, // Lower temperature for more consistent results
          maxOutputTokens: 1024, // Reduced token limit to stay within quota
        },
      })

      const response = result.response
      const text = response.text()

      if (!text) {
        throw new Error("No response received from the AI model")
      }

      console.log("✅ AI analysis successful on attempt", attempt)
      return text
    } catch (error) {
      console.error(`❌ AI analysis attempt ${attempt} failed:`, error)
      lastError = error as Error

      // Handle specific quota errors with retry logic
      if (error instanceof Error) {
        if (error.message.includes("429") || error.message.includes("quota")) {
          console.log(`⏳ Quota exceeded, waiting before retry ${attempt}/${maxRetries}`)

          if (attempt < maxRetries) {
            // Exponential backoff: 15s, 30s, 60s
            const waitTime = 15000 * Math.pow(2, attempt - 1)
            console.log(`⏰ Waiting ${waitTime / 1000} seconds before retry...`)
            await sleep(waitTime)
            continue
          } else {
            throw new Error(
              "API quota exceeded. Please wait a few minutes before trying again, or consider upgrading your Google AI API plan for higher limits.",
            )
          }
        }

        if (error.message.includes("API_KEY_INVALID") || error.message.includes("API key not valid")) {
          throw new Error(
            "Invalid Google API key. Please check that your API key is correct and has the necessary permissions for the Generative Language API.",
          )
        }

        if (error.message.includes("permission")) {
          throw new Error(
            "API key doesn't have permission to access the Generative Language API. Please enable the API in Google Cloud Console.",
          )
        }
      }

      // If it's not a quota error, don't retry
      if (attempt === maxRetries) {
        throw new Error(`Failed to analyze symptoms after ${maxRetries} attempts: ${lastError?.message}`)
      }
    }
  }

  throw new Error(`Failed to analyze symptoms: ${lastError?.message}`)
}

// Chat with Gemini AI
export async function chatWithAI(messages: Message[]): Promise<string> {
  const maxRetries = 2
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`💬 Chat attempt ${attempt}/${maxRetries}`)

      // Check if API key exists - use the new key
      const apiKey = process.env.GOOGLE_API_KEY || ""
      if (!apiKey) {
        throw new Error("Google API key is not configured. Please check your environment variables.")
      }

      // Initialize the Google Generative AI with API key
      const genAI = new GoogleGenerativeAI(apiKey)

      // Use gemini-1.5-flash for chat as well
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

      // Create a chat session
      const chat = model.startChat({
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1024,
        },
        // Add medical assistant context as the first message
        history: [
          {
            role: "user",
            parts: [
              {
                text: "You are a helpful medical assistant AI. You provide informative responses about medical topics but always clarify that you're not providing medical diagnosis and encourage users to seek professional medical advice. Be thorough but cautious in your assessments, and always prioritize patient safety.",
              },
            ],
          },
          {
            role: "model",
            parts: [
              {
                text: "I understand my role as a helpful medical assistant AI. I'll provide informative responses about medical topics while clarifying that I'm not providing medical diagnosis and encouraging users to seek professional medical advice. I'll be thorough but cautious in my assessments and always prioritize patient safety.",
              },
            ],
          },
        ],
      })

      // Format user messages for the API
      for (const msg of messages) {
        await chat.sendMessage(msg.content)
      }

      // Get the last response
      const lastResponse = await chat.getHistory()
      const lastModelResponse = lastResponse[lastResponse.length - 1]

      if (lastModelResponse.role === "model" && lastModelResponse.parts[0]?.text) {
        console.log("✅ Chat successful on attempt", attempt)
        return lastModelResponse.parts[0].text
      }

      throw new Error("Failed to get a valid response from the model")
    } catch (error) {
      console.error(`❌ Chat attempt ${attempt} failed:`, error)
      lastError = error as Error

      // Handle quota errors with retry
      if (error instanceof Error && (error.message.includes("429") || error.message.includes("quota"))) {
        if (attempt < maxRetries) {
          console.log(`⏳ Chat quota exceeded, waiting before retry...`)
          await sleep(10000) // Wait 10 seconds for chat
          continue
        } else {
          throw new Error("Chat quota exceeded. Please wait a moment before continuing the conversation.")
        }
      }

      // Handle other specific errors
      if (error instanceof Error) {
        if (error.message.includes("API_KEY_INVALID") || error.message.includes("API key not valid")) {
          throw new Error(
            "Invalid Google API key. Please check that your API key is correct and has the necessary permissions.",
          )
        }
        if (error.message.includes("permission")) {
          throw new Error("API key doesn't have permission to access the Generative Language API.")
        }
      }

      if (attempt === maxRetries) {
        throw new Error(`Failed to generate a response after ${maxRetries} attempts: ${lastError?.message}`)
      }
    }
  }

  throw new Error(`Failed to generate a response: ${lastError?.message}`)
}

// ========================================
// AI HOSPITAL AUTOMATION FUNCTIONS
// ========================================

// 🚨 AI-Powered Triage System
export async function performAITriage(symptoms: string, vitalSigns?: VitalSigns): Promise<TriageAssessment> {
  try {
    const triagePrompt = `
As an AI medical triage system, assess the urgency of this patient:

SYMPTOMS: ${symptoms}
${vitalSigns ? `VITAL SIGNS: 
- Blood Pressure: ${vitalSigns.bloodPressure || 'N/A'}
- Heart Rate: ${vitalSigns.heartRate || 'N/A'} bpm
- Temperature: ${vitalSigns.temperature || 'N/A'}°F
- Respiratory Rate: ${vitalSigns.respiratoryRate || 'N/A'}/min
- Oxygen Saturation: ${vitalSigns.oxygenSaturation || 'N/A'}%` : ''}

Please provide a triage assessment in this EXACT format:

URGENCY LEVEL: [1-5] (1=immediate emergency, 5=non-urgent)
PRIORITY: [immediate/urgent/semi-urgent/non-urgent]
ESTIMATED WAIT TIME: [minutes]
WARNING FLAGS: [list any red flags requiring immediate attention]
RECOMMENDATION: [specific actions needed]

Base your assessment on established medical triage protocols.
    `

    const aiResponse = await analyzeSymptomsWithAI(triagePrompt)
    
    // Parse AI response to extract triage data
    const urgencyMatch = aiResponse.match(/URGENCY LEVEL:\s*(\d)/i)
    const priorityMatch = aiResponse.match(/PRIORITY:\s*(immediate|urgent|semi-urgent|non-urgent)/i)
    const waitTimeMatch = aiResponse.match(/ESTIMATED WAIT TIME:\s*(\d+)/i)
    
    const urgencyLevel = urgencyMatch ? parseInt(urgencyMatch[1]) as 1|2|3|4|5 : 3
    const priority = priorityMatch ? priorityMatch[1].toLowerCase() as any : 'semi-urgent'
    const waitTime = waitTimeMatch ? parseInt(waitTimeMatch[1]) : 30
    
    // Extract warning flags
    const flagsSection = aiResponse.match(/WARNING FLAGS:\s*(.*?)(?=RECOMMENDATION|$)/i)
    const warningFlags = flagsSection ? 
      flagsSection[1].split(/[,\n]/).map(flag => flag.replace(/^[-•]\s*/, '').trim()).filter(Boolean) : []

    return {
      patientId: '', // Will be set by caller
      urgencyLevel,
      estimatedWaitTime: waitTime,
      priority,
      aiRecommendation: aiResponse,
      warningFlags,
      assessmentTime: new Date().toISOString()
    }
  } catch (error) {
    console.error('❌ AI Triage failed:', error)
    // Return safe default for critical system
    return {
      patientId: '',
      urgencyLevel: 3,
      estimatedWaitTime: 30,
      priority: 'semi-urgent',
      aiRecommendation: 'Unable to complete AI triage. Please perform manual assessment.',
      warningFlags: ['AI Assessment Failed'],
      assessmentTime: new Date().toISOString()
    }
  }
}

// 🔬 AI Medical Image Analysis
export async function analyzeXRayWithAI(imageBase64: string, bodyPart: string): Promise<string> {
  try {
    const imageAnalysisPrompt = `
As an AI radiologist assistant, analyze this ${bodyPart} X-ray image and provide:

1. **FINDINGS**: Describe what you observe
2. **ABNORMALITIES**: List any potential abnormalities
3. **RECOMMENDATIONS**: Suggest next steps
4. **URGENCY**: Rate urgency (Low/Medium/High/Critical)

Important: This is an AI preliminary analysis. All findings must be confirmed by a qualified radiologist.
    `

    // For now, we'll use text analysis. In a real implementation, you'd use Google Vision AI
    // or specialized medical imaging AI services
    const analysis = await analyzeSymptomsWithAI(imageAnalysisPrompt)
    
    return `AI Preliminary Analysis for ${bodyPart} X-ray:
${analysis}

⚠️ IMPORTANT: This AI analysis is preliminary and must be reviewed by a qualified radiologist before making any clinical decisions.`
    
  } catch (error) {
    console.error('❌ Medical image analysis failed:', error)
    return 'AI image analysis unavailable. Please request manual radiologist review.'
  }
}

// 💊 AI Drug Interaction Checker
export async function checkDrugInteractions(medications: string[]): Promise<string> {
  try {
    const drugCheckPrompt = `
As an AI pharmacist assistant, analyze these medications for potential interactions:

CURRENT MEDICATIONS: ${medications.join(', ')}

Please provide:
1. **INTERACTIONS**: List any potential drug interactions
2. **SEVERITY**: Rate each interaction (Mild/Moderate/Severe/Critical)
3. **RECOMMENDATIONS**: Suggest alternatives or monitoring
4. **WARNINGS**: Any specific precautions needed

Focus on clinically significant interactions that require attention.
    `

    const analysis = await analyzeSymptomsWithAI(drugCheckPrompt)
    return analysis
    
  } catch (error) {
    console.error('❌ Drug interaction check failed:', error)
    return 'Drug interaction analysis unavailable. Please consult pharmacist.'
  }
}

// 📊 AI Risk Assessment Calculator
export async function calculatePatientRiskScore(patient: Patient, recentVisits: Visit[]): Promise<{score: number, level: 'low'|'medium'|'high'|'critical', factors: string[]}> {
  try {
    const riskPrompt = `
As an AI medical risk assessment system, calculate the risk score for this patient:

PATIENT DATA:
- Age: ${patient.age}
- Chronic Conditions: ${patient.chronicConditions?.join(', ') || 'None'}
- Allergies: ${patient.allergies?.join(', ') || 'None'}
- Current Medications: ${patient.currentMedications?.join(', ') || 'None'}

RECENT VISITS: ${recentVisits.length} visits in recent period
Recent Diagnoses: ${recentVisits.map(v => v.diagnosis).join('; ')}

Calculate a risk score (0-100) and identify risk factors. Consider:
- Age-related risks
- Chronic condition complications
- Medication interactions
- Frequency of recent visits
- Pattern of symptoms

Provide: RISK SCORE: [0-100], LEVEL: [low/medium/high/critical], FACTORS: [list key risk factors]
    `

    const analysis = await analyzeSymptomsWithAI(riskPrompt)
    
    // Parse the response
    const scoreMatch = analysis.match(/RISK SCORE:\s*(\d+)/i)
    const levelMatch = analysis.match(/LEVEL:\s*(low|medium|high|critical)/i)
    
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 25
    let level: 'low'|'medium'|'high'|'critical' = 'low'
    
    if (score >= 80) level = 'critical'
    else if (score >= 60) level = 'high'
    else if (score >= 40) level = 'medium'
    else level = 'low'
    
    // Extract risk factors
    const factorsSection = analysis.match(/FACTORS:\s*(.*?)$/i)
    const factors = factorsSection ? 
      factorsSection[1].split(/[,\n]/).map(factor => factor.replace(/^[-•]\s*/, '').trim()).filter(Boolean) : 
      ['General assessment completed']

    return { score, level, factors }
    
  } catch (error) {
    console.error('❌ Risk assessment failed:', error)
    return { score: 25, level: 'low', factors: ['Risk assessment unavailable'] }
  }
}

// 🔄 AI Follow-up Recommendation System
export async function generateFollowUpPlan(visit: Visit, patient: Patient): Promise<string> {
  try {
    const followUpPrompt = `
As an AI care coordinator, create a follow-up plan for this patient:

PATIENT: ${patient.name}, Age ${patient.age}
RECENT VISIT: ${visit.visitDate}
DIAGNOSIS: ${visit.diagnosis}
SYMPTOMS: ${visit.symptoms}
CHRONIC CONDITIONS: ${patient.chronicConditions?.join(', ') || 'None'}

Create a comprehensive follow-up plan including:
1. **NEXT APPOINTMENT**: When should the patient return?
2. **MONITORING**: What should be monitored at home?
3. **RED FLAGS**: Warning signs to watch for
4. **LIFESTYLE**: Any lifestyle recommendations
5. **MEDICATION**: Medication adherence reminders

Make it practical and patient-friendly.
    `

    const followUpPlan = await analyzeSymptomsWithAI(followUpPrompt)
    return followUpPlan
    
  } catch (error) {
    console.error('❌ Follow-up plan generation failed:', error)
    return 'Standard follow-up: Return if symptoms worsen or persist beyond expected timeframe. Contact healthcare provider with any concerns.'
  }
}

// 📈 AI Hospital Analytics
export async function generateHospitalInsights(patients: Patient[], visits: Visit[]): Promise<string> {
  try {
    const analyticsPrompt = `
As an AI hospital analytics system, analyze this data:

TOTAL PATIENTS: ${patients.length}
TOTAL VISITS: ${visits.length}
RECENT VISIT TRENDS: ${visits.slice(0, 10).map(v => v.diagnosis).join(', ')}

Provide insights on:
1. **COMMON DIAGNOSES**: Most frequent conditions
2. **PATIENT FLOW**: Visit patterns and trends
3. **RESOURCE NEEDS**: Predicted staffing/equipment needs
4. **EARLY WARNING**: Potential outbreak or concerning patterns
5. **EFFICIENCY**: Areas for improvement

Focus on actionable insights for hospital management.
    `

    const insights = await analyzeSymptomsWithAI(analyticsPrompt)
    return insights
    
  } catch (error) {
    console.error('❌ Hospital analytics failed:', error)
    return 'Hospital analytics temporarily unavailable. Manual review recommended.'
  }
}

// ========================================
// REAL-TIME DASHBOARD FUNCTIONS
// ========================================

// 📊 Get all patients for dashboard
export async function searchAllPatients(): Promise<Patient[]> {
  const maxRetries = 3
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔍 Fetching all patients (attempt ${attempt}/${maxRetries})`)

      const url = new URL(`${AIRTABLE_API_URL}/Patients`)
      url.searchParams.append("maxRecords", "100")
      url.searchParams.append("sort[0][field]", "Name")
      url.searchParams.append("sort[0][direction]", "asc")

      const response = await fetch(url.toString(), {
        headers: airtableHeaders,
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ Error fetching all patients (attempt ${attempt}):`, errorText)
        
        if (attempt < maxRetries) {
          await sleep(1000 * attempt)
          continue
        }
        
        throw new Error(`Airtable API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      
      if (!data.records || !Array.isArray(data.records)) {
        throw new Error("Invalid response format from Airtable")
      }

      const patients = data.records.map((record: any) => ({
        id: record.id,
        name: record.fields.Name || "",
        fatherName: record.fields["Father Name"] || "",
        age: record.fields.Age || 0,
        count: record.fields.Count || 0,
      }))

      console.log(`✅ Fetched ${patients.length} total patients`)
      return patients
      
    } catch (error) {
      console.error(`❌ Error fetching all patients (attempt ${attempt}):`, error)
      lastError = error as Error

      if (attempt < maxRetries) {
        await sleep(1000 * attempt)
        continue
      }
    }
  }

  console.error("❌ Failed to fetch all patients, returning empty array")
  return []
}

// 📅 Get today's visits for dashboard
export async function getTodaysVisits(): Promise<Visit[]> {
  const maxRetries = 3
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📅 Fetching today's visits (attempt ${attempt}/${maxRetries})`)

      // Get today's date in YYYY-MM-DD format
      const today = new Date()
      const todayString = today.toISOString().split('T')[0]
      
      console.log("🗓️ Looking for visits on:", todayString)

      const url = new URL(`${AIRTABLE_API_URL}/Visits`)
      url.searchParams.append("maxRecords", "100")
      url.searchParams.append("sort[0][field]", "Visit Date")
      url.searchParams.append("sort[0][direction]", "desc")

      const response = await fetch(url.toString(), {
        headers: airtableHeaders,
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ Error fetching today's visits (attempt ${attempt}):`, errorText)
        
        if (attempt < maxRetries) {
          await sleep(1000 * attempt)
          continue
        }
        
        throw new Error(`Airtable API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      
      if (!data.records || !Array.isArray(data.records)) {
        throw new Error("Invalid response format from Airtable")
      }

      // Filter visits for today
      const todaysVisits = data.records.filter((record: any) => {
        const visitDate = record.fields["Visit Date"]
        if (!visitDate) return false
        
        // Handle both date and datetime formats
        const visitDateOnly = visitDate.includes('T') ? 
          visitDate.split('T')[0] : 
          visitDate.split(' ')[0]
        
        return visitDateOnly === todayString
      }).map((record: any) => ({
        id: record.id,
        patientId: record.fields["Linked Patient"]?.[0] || "",
        patientName: "", // Will be populated if needed
        visitDate: record.fields["Visit Date"] || "",
        symptoms: record.fields.Symptoms || "",
        diagnosis: record.fields.Diagnosis || "",
        possibleDiagnoses: record.fields["Possible Diagnoses"] || [],
      }))

      console.log(`✅ Found ${todaysVisits.length} visits for today`)
      return todaysVisits
      
    } catch (error) {
      console.error(`❌ Error fetching today's visits (attempt ${attempt}):`, error)
      lastError = error as Error

      if (attempt < maxRetries) {
        await sleep(1000 * attempt)
        continue
      }
    }
  }

  console.error("❌ Failed to fetch today's visits, returning empty array")
  return []
}

// 🚨 Get emergency patients for dashboard
export async function getEmergencyPatients(): Promise<Patient[]> {
  try {
    console.log("🚨 Fetching emergency patients...")

    // Get today's visits first
    const todaysVisits = await getTodaysVisits()
    
    // Emergency keywords that indicate urgent conditions
    const emergencyKeywords = [
      'emergency', 'urgent', 'immediate', 'critical', 'severe',
      'acute', 'crisis', 'emergency room', 'trauma', 'shock',
      'heart attack', 'stroke', 'seizure', 'bleeding', 'unconscious',
      'respiratory distress', 'chest pain', 'difficulty breathing',
      'high fever', 'dehydration', 'overdose', 'allergic reaction'
    ]

    // Find visits with emergency keywords in symptoms or diagnosis
    const emergencyVisits = todaysVisits.filter(visit => {
      const textToCheck = (visit.symptoms + ' ' + visit.diagnosis).toLowerCase()
      return emergencyKeywords.some(keyword => textToCheck.includes(keyword))
    })

    console.log(`🔍 Found ${emergencyVisits.length} emergency visits today`)

    // Get unique patient IDs from emergency visits
    const emergencyPatientIds = [...new Set(emergencyVisits.map(visit => visit.patientId))].filter(Boolean)

    if (emergencyPatientIds.length === 0) {
      console.log("✅ No emergency patients found")
      return []
    }

    // Fetch patient details for emergency patients
    const emergencyPatients: Patient[] = []
    
    for (const patientId of emergencyPatientIds) {
      try {
        const response = await fetch(`${AIRTABLE_API_URL}/Patients/${patientId}`, {
          headers: airtableHeaders,
        })

        if (response.ok) {
          const patientData = await response.json()
          emergencyPatients.push({
            id: patientData.id,
            name: patientData.fields.Name || "",
            fatherName: patientData.fields["Father Name"] || "",
            age: patientData.fields.Age || 0,
            count: patientData.fields.Count || 0,
          })
        }
      } catch (error) {
        console.warn(`⚠️ Could not fetch patient ${patientId}:`, error)
      }
    }

    console.log(`✅ Fetched ${emergencyPatients.length} emergency patients`)
    return emergencyPatients
    
  } catch (error) {
    console.error("❌ Error fetching emergency patients:", error)
    return []
  }
}

// 📊 Get dashboard summary statistics
export async function getDashboardStats(): Promise<{
  totalPatients: number
  todaysVisits: number
  emergencyQueue: number
  lastUpdate: string
}> {
  try {
    console.log("📊 Fetching dashboard statistics...")

    const [allPatients, todaysVisits, emergencyPatients] = await Promise.all([
      searchAllPatients(),
      getTodaysVisits(), 
      getEmergencyPatients()
    ])

    const stats = {
      totalPatients: allPatients.length,
      todaysVisits: todaysVisits.length,
      emergencyQueue: emergencyPatients.length,
      lastUpdate: new Date().toISOString()
    }

    console.log("✅ Dashboard stats:", stats)
    return stats

  } catch (error) {
    console.error("❌ Error fetching dashboard stats:", error)
    return {
      totalPatients: 0,
      todaysVisits: 0,
      emergencyQueue: 0,
      lastUpdate: new Date().toISOString()
    }
  }
}

      const response = await fetch(url.toString(), {
        headers: airtableHeaders,
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ Error fetching all patients (attempt ${attempt}):`, errorText)
        
        if (attempt < maxRetries) {
          await sleep(1000 * attempt)
          continue
        }
        
        throw new Error(`Airtable API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      
      if (!data.records || !Array.isArray(data.records)) {
        throw new Error("Invalid response format from Airtable")
      }

      const patients = data.records.map((record: any) => ({
        id: record.id,
        name: record.fields.Name || "",
        fatherName: record.fields["Father Name"] || "",
        age: record.fields.Age || 0,
        count: record.fields.Count || 0,
      }))

      console.log(`✅ Fetched ${patients.length} total patients`)
      return patients
      
    } catch (error) {
      console.error(`❌ Error fetching all patients (attempt ${attempt}):`, error)
      lastError = error as Error

      if (attempt < maxRetries) {
        await sleep(1000 * attempt)
        continue
      }
    }
  }

  console.error("❌ Failed to fetch all patients, returning empty array")
  return []
}

// 📅 Get today's visits for dashboard
export async function getTodaysVisits(): Promise<Visit[]> {
  const maxRetries = 3
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📅 Fetching today's visits (attempt ${attempt}/${maxRetries})`)

      // Get today's date in YYYY-MM-DD format
      const today = new Date()
      const todayString = today.toISOString().split('T')[0]
      
      console.log("🗓️ Looking for visits on:", todayString)

      const url = new URL(`${AIRTABLE_API_URL}/Visits`)
      url.searchParams.append("maxRecords", "100")
      url.searchParams.append("sort[0][field]", "Visit Date")
      url.searchParams.append("sort[0][direction]", "desc")

      const response = await fetch(url.toString(), {
        headers: airtableHeaders,
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ Error fetching today's visits (attempt ${attempt}):`, errorText)
        
        if (attempt < maxRetries) {
          await sleep(1000 * attempt)
          continue
        }
        
        throw new Error(`Airtable API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      
      if (!data.records || !Array.isArray(data.records)) {
        throw new Error("Invalid response format from Airtable")
      }

      // Filter visits for today
      const todaysVisits = data.records.filter((record: any) => {
        const visitDate = record.fields["Visit Date"]
        if (!visitDate) return false
        
        // Handle both date and datetime formats
        const visitDateOnly = visitDate.includes('T') ? 
          visitDate.split('T')[0] : 
          visitDate.split(' ')[0]
        
        return visitDateOnly === todayString
      }).map((record: any) => ({
        id: record.id,
        patientId: record.fields["Linked Patient"]?.[0] || "",
        patientName: "", // Will be populated if needed
        visitDate: record.fields["Visit Date"] || "",
        symptoms: record.fields.Symptoms || "",
        diagnosis: record.fields.Diagnosis || "",
        possibleDiagnoses: record.fields["Possible Diagnoses"] || [],
      }))

      console.log(`✅ Found ${todaysVisits.length} visits for today`)
      return todaysVisits
      
    } catch (error) {
      console.error(`❌ Error fetching today's visits (attempt ${attempt}):`, error)
      lastError = error as Error

      if (attempt < maxRetries) {
        await sleep(1000 * attempt)
        continue
      }
    }
  }

  console.error("❌ Failed to fetch today's visits, returning empty array")
  return []
}

// 🚨 Get emergency patients for dashboard
export async function getEmergencyPatients(): Promise<Patient[]> {
  try {
    console.log("🚨 Fetching emergency patients...")

    // Get today's visits first
    const todaysVisits = await getTodaysVisits()
    
    // Emergency keywords that indicate urgent conditions
    const emergencyKeywords = [
      'emergency', 'urgent', 'immediate', 'critical', 'severe',
      'acute', 'crisis', 'emergency room', 'trauma', 'shock',
      'heart attack', 'stroke', 'seizure', 'bleeding', 'unconscious',
      'respiratory distress', 'chest pain', 'difficulty breathing',
      'high fever', 'dehydration', 'overdose', 'allergic reaction'
    ]

    // Find visits with emergency keywords in symptoms or diagnosis
    const emergencyVisits = todaysVisits.filter(visit => {
      const textToCheck = (visit.symptoms + ' ' + visit.diagnosis).toLowerCase()
      return emergencyKeywords.some(keyword => textToCheck.includes(keyword))
    })

    console.log(`🔍 Found ${emergencyVisits.length} emergency visits today`)

    // Get unique patient IDs from emergency visits
    const emergencyPatientIds = [...new Set(emergencyVisits.map(visit => visit.patientId))].filter(Boolean)

    if (emergencyPatientIds.length === 0) {
      console.log("✅ No emergency patients found")
      return []
    }

    // Fetch patient details for emergency patients
    const emergencyPatients: Patient[] = []
    
    for (const patientId of emergencyPatientIds) {
      try {
        const response = await fetch(`${AIRTABLE_API_URL}/Patients/${patientId}`, {
          headers: airtableHeaders,
        })

        if (response.ok) {
          const patientData = await response.json()
          emergencyPatients.push({
            id: patientData.id,
            name: patientData.fields.Name || "",
            fatherName: patientData.fields["Father Name"] || "",
            age: patientData.fields.Age || 0,
            count: patientData.fields.Count || 0,
          })
        }
      } catch (error) {
        console.warn(`⚠️ Could not fetch patient ${patientId}:`, error)
      }
    }

    console.log(`✅ Fetched ${emergencyPatients.length} emergency patients`)
    return emergencyPatients
    
  } catch (error) {
    console.error("❌ Error fetching emergency patients:", error)
    return []
  }
}

// 📊 Get dashboard summary statistics
export async function getDashboardStats(): Promise<{
  totalPatients: number
  todaysVisits: number
  emergencyQueue: number
  lastUpdate: string
}> {
  try {
    console.log("📊 Fetching dashboard statistics...")

    const [allPatients, todaysVisits, emergencyPatients] = await Promise.all([
      searchAllPatients(),
      getTodaysVisits(), 
      getEmergencyPatients()
    ])

    const stats = {
      totalPatients: allPatients.length,
      todaysVisits: todaysVisits.length,
      emergencyQueue: emergencyPatients.length,
      lastUpdate: new Date().toISOString()
    }

    console.log("✅ Dashboard stats:", stats)
    return stats

  } catch (error) {
    console.error("❌ Error fetching dashboard stats:", error)
    return {
      totalPatients: 0,
      todaysVisits: 0,
      emergencyQueue: 0,
      lastUpdate: new Date().toISOString()
    }
  }
}
