import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { randomUUID } from 'crypto'

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is required')
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      // Patient Basic Information
      patientInfo,
      age,
      gender,
      medicalHistory,
      allergies,
      
      // OPD Consultation Data
      opdDiagnosis,
      opdSymptoms,
      opdTreatmentPlan,
      opdChiefComplaint,
      
      // Current Ward Assessment
      currentSymptoms,
      wardFindings,
      physicalExam,
      receivingNotes,
      vitalSigns,
      
      // Treatment Progress & Current Status
      treatmentProgress,
      currentDiagnosis,
      currentTreatmentPlans,
      
      // Clinical Context
      admissionReason,
      daysSinceAdmission,
      additionalNotes,
      
      context
    } = body

    // Construct comprehensive prompt for ward doctor AI assistance
    const prompt = `You are an expert ward doctor AI consultant. Provide comprehensive clinical analysis comparing OPD and Ward assessments for optimal patient management.

🏥 **PATIENT PROFILE:**
${patientInfo}
Age: ${age} | Gender: ${gender}
Days since admission: ${daysSinceAdmission}
Admission Reason: ${admissionReason}

📋 **MEDICAL BACKGROUND:**
Medical History: ${medicalHistory}
Known Allergies: ${allergies}
Current Vital Signs: ${vitalSigns}

📊 **OPD INITIAL ASSESSMENT:**
Chief Complaint: ${opdChiefComplaint}
Original Symptoms: ${opdSymptoms}
OPD Diagnosis: ${opdDiagnosis}
Initial Treatment Plan: ${opdTreatmentPlan}

🏥 **CURRENT WARD STATUS:**
Current Symptoms: ${currentSymptoms}
Ward Findings: ${wardFindings}
Physical Examination: ${physicalExam}
Receiving Notes: ${receivingNotes}
Current Diagnosis: ${currentDiagnosis}
Active Treatment Plans: ${currentTreatmentPlans}
Treatment Progress: ${treatmentProgress}
Additional Clinical Notes: ${additionalNotes}

🔍 **COMPREHENSIVE ANALYSIS REQUIRED:**

**1. 📈 CLINICAL PROGRESSION ANALYSIS:**
• Compare OPD presentation vs current ward status
• Analyze symptom evolution and treatment response
• Identify improvement, stability, or deterioration patterns
• Assess treatment effectiveness and patient progression

**2. 🎯 DIAGNOSTIC REFINEMENT:**
• Evaluate OPD diagnosis accuracy based on ward findings
• Suggest diagnostic modifications or confirmations
• Identify any missed conditions or complications
• Provide refined differential diagnosis list

**3. 💊 TREATMENT OPTIMIZATION:**
• Compare OPD vs Ward treatment approaches
• Recommend best evidence-based treatment strategy
• Suggest medication adjustments or additions
• Identify potential drug interactions or contraindications

**4. 🚨 CLINICAL DECISION SUPPORT:**
• Risk stratification and monitoring priorities
• Early warning signs requiring immediate attention
• Criteria for treatment escalation or de-escalation
• Discharge readiness indicators

**5. 🔬 INVESTIGATION RECOMMENDATIONS:**
• Additional diagnostic tests if indicated
• Monitoring parameters and frequency
• Laboratory and imaging priorities
• Specialist consultation needs

**6. 📋 COMPREHENSIVE CARE PLAN:**
• Short-term management priorities (24-48 hours)
• Medium-term goals and milestones
• Long-term recovery and rehabilitation planning
• Patient and family education needs

**7. ⚡ MEDICATION RECOMMENDATIONS:**
• Specific drug recommendations with dosages
• Duration of therapy considerations
• Monitoring requirements for medications
• Alternative options if first-line fails

**8. 🎯 CLINICAL PEARLS & INSIGHTS:**
• Key learning points from this case
• Best practice recommendations
• Pitfalls to avoid in similar cases
• Evidence-based medicine insights

Please provide detailed, actionable recommendations organized clearly for immediate clinical use. Focus on practical decision-making support that helps optimize patient outcomes.`

    console.log('🏥 Ward AI Comprehensive Analysis Request:', {
      requestId: randomUUID(),
      fieldCount: Object.keys(body).length,
      context
    })

    // Add timeout protection
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o", // Best model for medical analysis
        messages: [
          {
            role: "system",
            content: "You are an expert ward doctor AI assistant specializing in hospital patient management, treatment progression analysis, and clinical decision support. Provide detailed, practical insights for ward-level patient care."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.3, // Lower temperature for more consistent medical advice
      }, {
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      const diagnosis = completion.choices[0].message.content

      console.log('✅ Ward AI Diagnosis Generated successfully')
      return NextResponse.json({
        success: true,
        diagnosis: diagnosis,
        model: "gpt-4o",
        context: "comprehensive_ward_analysis"
      })

    } catch (error: any) {
      clearTimeout(timeoutId)

      console.error('❌ Ward AI Diagnosis Error:', error)

      if (error.name === 'AbortError') {
        return NextResponse.json({
          success: false,
          error: 'Request timeout - AI service took too long to respond'
        }, { status: 504 })
      }

      if (error.status === 429) {
        return NextResponse.json({
          success: false,
          error: 'Rate limit exceeded. Please try again later.'
        }, { status: 429 })
      }

      if (error.status === 401) {
        return NextResponse.json({
          success: false,
          error: 'Invalid API key configuration'
        }, { status: 500 })
      }

      return NextResponse.json({
        success: false,
        error: 'Failed to generate ward diagnosis'
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('❌ Ward AI Diagnosis Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to generate ward diagnosis'
    }, { status: 500 })
  }
}