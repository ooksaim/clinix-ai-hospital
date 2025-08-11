import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not found in environment variables')
      return NextResponse.json({ 
        error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your .env.local file.' 
      }, { status: 500 })
    }

    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    
    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
    }

    // Validate file size (max 25MB for Whisper API)
    if (audioFile.size > 25 * 1024 * 1024) {
      return NextResponse.json({ 
        error: 'Audio file too large. Maximum size is 25MB.' 
      }, { status: 400 })
    }

    // Validate file type
    const validTypes = ['audio/webm', 'audio/mp3', 'audio/wav', 'audio/m4a']
    if (!validTypes.includes(audioFile.type) && !audioFile.name.match(/\.(webm|mp3|wav|m4a)$/i)) {
      return NextResponse.json({ 
        error: `Invalid file type: ${audioFile.type}. Supported types: webm, mp3, wav, m4a` 
      }, { status: 400 })
    }

    console.log(`Processing audio file: ${audioFile.name}, size: ${audioFile.size} bytes, type: ${audioFile.type}`)

    // Convert File to proper format for OpenAI
    const bytes = await audioFile.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Create a proper File object for OpenAI API
    const audioBlob = new Blob([buffer], { type: audioFile.type })
    
    // Prepare form data for OpenAI Whisper API
    const transcriptionFormData = new FormData()
    transcriptionFormData.append('file', audioBlob, audioFile.name || 'recording.webm')
    transcriptionFormData.append('model', 'whisper-1')
    transcriptionFormData.append('language', 'en')
    transcriptionFormData.append('temperature', '0.1') // Lower temperature for medical accuracy
    transcriptionFormData.append('prompt', 'This is a medical radiology dictation with medical terminology including findings, impressions, recommendations, CT, MRI, X-ray, ultrasound, anatomical terms, and clinical observations.')

    console.log('Calling OpenAI Whisper API...')

    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: transcriptionFormData,
    })

    if (!whisperResponse.ok) {
      const errorText = await whisperResponse.text()
      console.error('Whisper API Error Response:', {
        status: whisperResponse.status,
        statusText: whisperResponse.statusText,
        error: errorText
      })
      
      // Parse specific error messages
      let errorMessage = 'Failed to transcribe audio'
      try {
        const errorData = JSON.parse(errorText)
        if (errorData.error && errorData.error.message) {
          errorMessage = errorData.error.message
        }
      } catch {
        errorMessage = `Whisper API Error: ${whisperResponse.status} ${whisperResponse.statusText}`
      }
      
      return NextResponse.json(
        { error: errorMessage }, 
        { status: whisperResponse.status }
      )
    }

    const transcriptionResult = await whisperResponse.json()
    console.log('Transcription successful, length:', transcriptionResult.text?.length || 0)
    
    if (!transcriptionResult.text || transcriptionResult.text.trim().length === 0) {
      return NextResponse.json({ 
        error: 'No speech detected in the recording. Please ensure you speak clearly and the microphone is working.' 
      }, { status: 400 })
    }
    
    return NextResponse.json({
      transcript: transcriptionResult.text.trim(),
      duration: transcriptionResult.duration,
      language: transcriptionResult.language
    })

  } catch (error) {
    console.error('Transcription error:', error)
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('network') || error.message.includes('fetch')) {
        return NextResponse.json(
          { error: 'Network error. Please check your internet connection and try again.' }, 
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { error: `Transcription failed: ${error.message}` }, 
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error during transcription' }, 
      { status: 500 }
    )
  }
}
