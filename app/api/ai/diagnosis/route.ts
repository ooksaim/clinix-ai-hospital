import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface DiagnosisRequest {
  symptoms: string
  medicalHistory: string
  physicalExam: string
  vitalSigns: string
  chiefComplaint: string
  additionalInfo: string
  patientAge: number
  patientGender: string
}

export async function POST(request: NextRequest) {
  try {
    const requestData: DiagnosisRequest = await request.json()

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

    console.log('🤖 Sending request to OpenAI for medical diagnosis assistance...')

    // Make request to OpenAI GPT-4 (best model for medical purposes)
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
    })

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
    console.error('❌ AI Diagnosis API Error:', error)

    // Handle specific OpenAI errors
    if (error.code === 'insufficient_quota') {
      return NextResponse.json(
        { success: false, error: 'OpenAI API quota exceeded. Please check your billing.' },
        { status: 429 }
      )
    }

    if (error.code === 'invalid_api_key') {
      return NextResponse.json(
        { success: false, error: 'Invalid OpenAI API key configuration.' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to generate AI diagnosis. Please try again.' },
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