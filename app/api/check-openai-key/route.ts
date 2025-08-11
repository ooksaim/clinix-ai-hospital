import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY
    
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your .env.local file.',
        configured: false
      }, { status: 400 })
    }
    
    // Validate API key format
    if (!apiKey.startsWith('sk-')) {
      return NextResponse.json({ 
        error: 'Invalid OpenAI API key format. Key should start with "sk-".',
        configured: false
      }, { status: 400 })
    }
    
    // Create a preview of the key (show first 7 and last 4 characters)
    const keyPreview = apiKey.length > 20 
      ? `${apiKey.substring(0, 7)}...${apiKey.substring(apiKey.length - 4)}`
      : 'sk-...****'
    
    // Optionally test the key with a simple API call
    try {
      const testResponse = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      })
      
      if (testResponse.ok) {
        return NextResponse.json({
          configured: true,
          valid: true,
          keyPreview,
          message: 'OpenAI API key is valid and working'
        })
      } else {
        return NextResponse.json({
          configured: true,
          valid: false,
          keyPreview,
          error: 'API key is configured but invalid or expired',
          message: 'Please check your OpenAI API key'
        }, { status: 401 })
      }
    } catch (testError) {
      // If we can't test the key (network issues), assume it's configured
      return NextResponse.json({
        configured: true,
        valid: 'unknown',
        keyPreview,
        message: 'API key is configured (unable to verify due to network)'
      })
    }
    
  } catch (error) {
    console.error('OpenAI key check error:', error)
    return NextResponse.json({
      error: 'Internal server error while checking API key',
      configured: false
    }, { status: 500 })
  }
}
