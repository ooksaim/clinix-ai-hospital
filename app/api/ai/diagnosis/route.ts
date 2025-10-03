import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// Validate OpenAI API key at startup
if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is required')
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface DiagnosisRequest {
  symptoms?: string
  medicalHistory?: string
  physicalExam?: string
  vitalSigns?: string
  chiefComplaint?: string
  additionalInfo?: string
  patientAge?: number
  patientGender?: string
}
export async function POST(request: NextRequest) {
  try {
    // Validate content type
    const contentType = request.headers.get('content-type')
    if (!contentType?.startsWith('application/json')) {
      return NextResponse.json(
        { success: false, error: 'Content-Type must be application/json' },
        { status: 415 } // 415 Unsupported Media Type
      )
    }

    // Validate payload size
    const contentLength = request.headers.get('content-length')
    const maxSizeBytes = 1 * 1024 * 1024 // 1MB limit
    
    if (contentLength) {
      const sizeBytes = parseInt(contentLength, 10)
      if (sizeBytes > maxSizeBytes) {
        return NextResponse.json(
          { success: false, error: 'Request payload too large. Maximum size is 1MB.' },
          { status: 413 } // 413 Payload Too Large
        )
      }
    }

    // Parse JSON with proper error handling
    let requestData: DiagnosisRequest
    try {
      const bodyText = await request.text()
      
      // Additional size check on actual body content
      if (new TextEncoder().encode(bodyText).length > maxSizeBytes) {
        return NextResponse.json(
          { success: false, error: 'Request payload too large. Maximum size is 1MB.' },
          { status: 413 }
        )
      }

      requestData = JSON.parse(bodyText)
    } catch (error: any) {
      console.error('❌ JSON parsing error:', error.message)
      return NextResponse.json(
        { success: false, error: 'Invalid JSON format. Please check your request body.' },
        { status: 400 } // 400 Bad Request for invalid JSON
      )
    }

    // Validate required fields
    if (!requestData.symptoms?.trim() && !requestData.chiefComplaint?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Either symptoms or chief complaint is required' },
        { status: 400 }
      )
    }

    // Validate field lengths to prevent abuse
    const maxFieldLength = 5000
    for (const [key, value] of Object.entries(requestData)) {
      if (typeof value === 'string' && value.length > maxFieldLength) {
        return NextResponse.json(
          { success: false, error: `Field ${key} exceeds maximum length` },
          { status: 400 }
        )
      }
    }

    // Validate required fields
    if (!requestData.symptoms?.trim() && !requestData.chiefComplaint?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Either symptoms or chief complaint is required' },
        { status: 400 }
      )
    }

    // Construct comprehensive medical prompt
    const medicalPrompt = `
You are an experienced attending physician providing diagnostic assistance. Please analyze the following patient case and provide a comprehensive medical assessment.

**PATIENT INFORMATION:**
- Age: ${requestData.patientAge || 'Not specified'} years
- Gender: ${requestData.patientGender || 'Not specified'}

**CHIEF COMPLAINT:**
${requestData.chiefComplaint || 'Not provided'}

**CURRENT SYMPTOMS:**
${requestData.symptoms || 'Not provided'}

**MEDICAL HISTORY:**
${requestData.medicalHistory || 'Not provided'}

**PHYSICAL EXAMINATION FINDINGS:**
${requestData.physicalExam || 'Not performed yet'}

**VITAL SIGNS:**
${requestData.vitalSigns || 'Not recorded'}

**ADDITIONAL CLINICAL INFORMATION:**
${requestData.additionalInfo || 'None provided'}

**REQUESTED ANALYSIS:**
Please provide a structured diagnostic assessment with the following sections:

1. **DIFFERENTIAL DIAGNOSIS** (in order of clinical probability):
   - Most likely diagnosis with reasoning
   - Alternative diagnoses to consider
   - ICD-10 codes where applicable

2. **RED FLAGS & EMERGENCY INDICATORS:**
   - Any concerning signs requiring immediate attention
   - When to consider emergency referral

3. **RECOMMENDED INVESTIGATIONS:**
   - Essential diagnostic tests
   - Additional tests if initial results are inconclusive
   - Prioritize based on clinical urgency

4. **TREATMENT APPROACH:**
   - First-line treatment recommendations
   - Symptomatic management
   - Patient monitoring requirements

5. **FOLLOW-UP & PROGNOSIS:**
   - Recommended follow-up timeline
   - Expected clinical course
   - Patient education points

6. **CLINICAL PEARLS:**
   - Key diagnostic clues
   - Common pitfalls to avoid

**IMPORTANT GUIDELINES:**
- Base recommendations on evidence-based medicine
- Consider patient's age, gender, and medical history in your assessment
- Highlight any drug interactions or contraindications
- Provide specific medication dosages when appropriate
- Include both common and serious conditions in differential
- Always emphasize the importance of clinical correlation

Please format your response clearly with bullet points and medical terminology appropriate for healthcare professionals.
    `

    // Add timeout protection for the OpenAI API call
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      console.warn('⏰ AI diagnosis request timing out after 45 seconds')
      controller.abort()
    }, 45000) // Increased to 45 second timeout for complex cases

    try {
      console.log('🤖 Sending request to OpenAI for medical diagnosis...')
      console.log('📊 Request details:', {
        model: "gpt-4o",
        patientAge: requestData.patientAge,
        patientGender: requestData.patientGender,
        hasSymptoms: !!requestData.symptoms,
        hasHistory: !!requestData.medicalHistory,
        hasExam: !!requestData.physicalExam
      })
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o", // GPT-4o is the best model for medical analysis
        messages: [
          {
            role: "system",
            content: `You are a highly experienced physician with expertise in internal medicine, emergency medicine, and clinical diagnosis. You provide thorough, evidence-based diagnostic assistance while emphasizing the importance of clinical judgment. Always include appropriate medical disclaimers and encourage proper clinical correlation.`
          },
          {
            role: "user",
            content: medicalPrompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.3, // Lower temperature for more consistent medical responses
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      }, {
        signal: controller.signal
      })

      // Clear timeout on successful completion
      clearTimeout(timeoutId)

      const aiResponse = completion.choices[0]?.message?.content

      if (!aiResponse) {
        throw new Error('No response received from AI model')
      }

      console.log('✅ AI diagnosis assistance generated successfully')

      // Add medical disclaimer to the response
      const responseWithDisclaimer = `${aiResponse}

**⚠️ IMPORTANT MEDICAL DISCLAIMER:**
This AI-generated assessment is for educational and assistance purposes only. It should NOT replace clinical judgment, physical examination, or definitive diagnostic testing. Always:
- Correlate AI suggestions with your clinical findings
- Consider the full clinical context and patient presentation
- Follow institutional protocols and guidelines
- Seek senior consultation for complex cases
- Remember that AI may not account for all clinical nuances

The final diagnostic and treatment decisions remain the responsibility of the attending physician.`

      return NextResponse.json({
        success: true,
        response: responseWithDisclaimer,
        metadata: {
          model: completion.model,
          tokensUsed: completion.usage?.total_tokens || 0,
          timestamp: new Date().toISOString()
        }
      })

    } catch (error: any) {
      // Clear timeout in case of error
      clearTimeout(timeoutId)
      
      console.error('❌ AI Diagnosis API Error:', {
        name: error.name,
        message: error.message,
        code: error.code,
        type: error.type,
        timestamp: new Date().toISOString()
      })

      // Handle timeout/abort errors
      if (error.name === 'AbortError' || error.message?.includes('aborted')) {
        console.warn('⏰ AI diagnosis request timed out')
        return NextResponse.json(
          { 
            success: false, 
            error: 'Request timeout - AI service took too long to respond. Please try again.' 
          },
          { status: 504 }
        )
      }

      // Handle specific OpenAI errors
      if (error.code === 'insufficient_quota') {
        console.error('💳 OpenAI quota exceeded')
        return NextResponse.json(
          { success: false, error: 'OpenAI API quota exceeded. Please check your billing.' },
          { status: 429 }
        )
      }

      if (error.code === 'invalid_api_key') {
        console.error('🔑 Invalid OpenAI API key')
        return NextResponse.json(
          { success: false, error: 'Invalid OpenAI API key configuration.' },
          { status: 401 }
        )
      }

      if (error.code === 'model_not_found') {
        console.error('🤖 Model not found or unavailable')
        return NextResponse.json(
          { success: false, error: 'AI model temporarily unavailable. Please try again.' },
          { status: 503 }
        )
      }

      if (error.code === 'rate_limit_exceeded') {
        console.error('🚦 Rate limit exceeded')
        return NextResponse.json(
          { success: false, error: 'Too many requests. Please wait a moment and try again.' },
          { status: 429 }
        )
      }

      // Handle network and other errors
      if (error.message?.includes('network') || error.code === 'ECONNRESET') {
        console.error('🌐 Network error occurred')
        return NextResponse.json(
          { success: false, error: 'Network error. Please check your connection and try again.' },
          { status: 503 }
        )
      }

      // Generic error handling for any other cases
      console.error('🚨 Unexpected error in AI diagnosis')
      return NextResponse.json(
        { success: false, error: 'Failed to generate AI diagnosis. Please try again.' },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error('❌ Outer POST function error:', error)
    return NextResponse.json(
      { success: false, error: 'Request processing failed. Please try again.' },
      { status: 500 }
    )
  }
}

// Handle unsupported HTTP methods
export async function GET() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  )
}