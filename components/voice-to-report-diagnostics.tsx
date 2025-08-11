"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Mic, 
  Settings, 
  RefreshCw,
  Eye,
  EyeOff
} from "lucide-react"

interface SystemCheck {
  name: string
  status: 'checking' | 'success' | 'error' | 'warning'
  message: string
  details?: string
}

export function VoiceToReportDiagnostics() {
  const [checks, setChecks] = useState<SystemCheck[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [apiKeyStatus, setApiKeyStatus] = useState<string>('')

  const runDiagnostics = async () => {
    setIsRunning(true)
    const newChecks: SystemCheck[] = []

    // Check 1: Browser Support
    newChecks.push({
      name: 'Browser Compatibility',
      status: 'checking',
      message: 'Checking browser support...'
    })
    setChecks([...newChecks])
    
    await new Promise(resolve => setTimeout(resolve, 500))
    
    if (typeof window !== 'undefined' && navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
      newChecks[0] = {
        name: 'Browser Compatibility',
        status: 'success',
        message: 'Browser supports audio recording',
        details: `User Agent: ${navigator.userAgent.split(' ')[0]}`
      }
    } else {
      newChecks[0] = {
        name: 'Browser Compatibility',
        status: 'error',
        message: 'Browser does not support audio recording',
        details: 'Please use Chrome, Firefox, or Safari'
      }
    }
    setChecks([...newChecks])

    // Check 2: MediaRecorder Support
    newChecks.push({
      name: 'MediaRecorder API',
      status: 'checking',
      message: 'Checking MediaRecorder support...'
    })
    setChecks([...newChecks])
    
    await new Promise(resolve => setTimeout(resolve, 300))
    
    if (typeof MediaRecorder !== 'undefined') {
      const supportedTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/wav'
      ].filter(type => MediaRecorder.isTypeSupported(type))
      
      newChecks[1] = {
        name: 'MediaRecorder API',
        status: 'success',
        message: 'MediaRecorder is supported',
        details: `Supported formats: ${supportedTypes.join(', ')}`
      }
    } else {
      newChecks[1] = {
        name: 'MediaRecorder API',
        status: 'error',
        message: 'MediaRecorder is not supported',
        details: 'Please update your browser'
      }
    }
    setChecks([...newChecks])

    // Check 3: Microphone Access
    newChecks.push({
      name: 'Microphone Access',
      status: 'checking',
      message: 'Testing microphone access...'
    })
    setChecks([...newChecks])
    
    await new Promise(resolve => setTimeout(resolve, 500))
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(track => track.stop())
      
      newChecks[2] = {
        name: 'Microphone Access',
        status: 'success',
        message: 'Microphone access granted',
        details: 'Audio recording is ready'
      }
    } catch (error: any) {
      newChecks[2] = {
        name: 'Microphone Access',
        status: 'error',
        message: 'Microphone access denied or not available',
        details: error.message || 'Please check browser permissions'
      }
    }
    setChecks([...newChecks])

    // Check 4: API Connectivity
    newChecks.push({
      name: 'API Connectivity',
      status: 'checking',
      message: 'Testing API endpoints...'
    })
    setChecks([...newChecks])
    
    await new Promise(resolve => setTimeout(resolve, 800))
    
    try {
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: new FormData()
      })
      
      if (response.status === 400) { // Expected error for empty request
        newChecks[3] = {
          name: 'API Connectivity',
          status: 'success',
          message: 'API endpoints are accessible',
          details: 'Transcription API is responding'
        }
      } else {
        newChecks[3] = {
          name: 'API Connectivity',
          status: 'warning',
          message: 'API responded with unexpected status',
          details: `Status: ${response.status}`
        }
      }
    } catch (error) {
      newChecks[3] = {
        name: 'API Connectivity',
        status: 'error',
        message: 'Cannot reach API endpoints',
        details: 'Please check if the server is running'
      }
    }
    setChecks([...newChecks])

    // Check 5: OpenAI API Key
    newChecks.push({
      name: 'OpenAI Configuration',
      status: 'checking',
      message: 'Verifying OpenAI API key...'
    })
    setChecks([...newChecks])
    
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    try {
      const response = await fetch('/api/check-openai-key', {
        method: 'GET'
      })
      
      if (response.ok) {
        const data = await response.json()
        setApiKeyStatus(data.keyPreview || 'Key configured')
        
        newChecks[4] = {
          name: 'OpenAI Configuration',
          status: 'success',
          message: 'OpenAI API key is configured',
          details: `Key: ${data.keyPreview || 'sk-...****'}`
        }
      } else {
        const errorData = await response.json()
        newChecks[4] = {
          name: 'OpenAI Configuration',
          status: 'error',
          message: 'OpenAI API key not configured',
          details: errorData.error || 'Please add OPENAI_API_KEY to .env.local'
        }
      }
    } catch (error) {
      newChecks[4] = {
        name: 'OpenAI Configuration',
        status: 'error',
        message: 'Cannot verify OpenAI API key',
        details: 'API endpoint not responding'
      }
    }
    setChecks([...newChecks])
    
    setIsRunning(false)
  }

  const getStatusIcon = (status: SystemCheck['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-orange-500" />
      case 'checking':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
    }
  }

  const getStatusBadge = (status: SystemCheck['status']) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Ready</Badge>
      case 'error':
        return <Badge variant="destructive">Error</Badge>
      case 'warning':
        return <Badge className="bg-orange-100 text-orange-800">Warning</Badge>
      case 'checking':
        return <Badge className="bg-blue-100 text-blue-800">Checking...</Badge>
    }
  }

  useEffect(() => {
    runDiagnostics()
  }, [])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="h-5 w-5" />
              System Diagnostics
            </CardTitle>
            <CardDescription>
              Voice-to-Report system health check and troubleshooting
            </CardDescription>
          </div>
          <Button
            onClick={runDiagnostics}
            disabled={isRunning}
            variant="outline"
            size="sm"
          >
            {isRunning ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Re-run Checks
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {checks.length === 0 ? (
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-2" />
            <p className="text-gray-600">Running diagnostics...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {checks.map((check, index) => (
              <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                {getStatusIcon(check.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900">{check.name}</p>
                    {getStatusBadge(check.status)}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{check.message}</p>
                  {check.details && (
                    <p className="text-xs text-gray-500 mt-1 font-mono">{check.details}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Common Issues and Solutions */}
        <div className="mt-6 pt-6 border-t">
          <h4 className="font-semibold text-gray-900 mb-3">Common Issues & Solutions</h4>
          <div className="space-y-3 text-sm">
            <Alert>
              <Mic className="h-4 w-4" />
              <AlertDescription>
                <strong>Microphone Access Denied:</strong> Click the microphone icon in your browser's address bar and allow microphone access. Reload the page after granting permission.
              </AlertDescription>
            </Alert>
            
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>OpenAI API Key Missing:</strong> Create a <code>.env.local</code> file in your project root and add: <code>OPENAI_API_KEY=your_key_here</code>
              </AlertDescription>
            </Alert>
            
            <Alert>
              <Settings className="h-4 w-4" />
              <AlertDescription>
                <strong>Browser Compatibility:</strong> This feature works best on Chrome, Firefox, or Safari. Internet Explorer and older browsers are not supported.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
