'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface TestResults {
  connection: boolean | null
  departments: boolean | null
  auth: boolean | null
  error: string
  details: string[]
}

export default function TestConnection() {
  const [testing, setTesting] = useState(false)
  const [results, setResults] = useState<TestResults>({
    connection: null,
    departments: null,
    auth: null,
    error: '',
    details: []
  })

  const testConnection = async () => {
    setTesting(true)
    const newResults: TestResults = { 
      connection: false, 
      departments: false, 
      auth: false, 
      error: '', 
      details: [] 
    }

    try {
      newResults.details.push('🔄 Starting connection test via API...')
      
      // Call the API endpoint to test connection with service key
      const response = await fetch('/api/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!data.success) {
        newResults.error = data.error
        newResults.details = data.details || [data.error]
        setResults(newResults)
        setTesting(false)
        return
      }

      // Update results from API response
      const apiResults = data.results
      newResults.connection = apiResults.connection
      newResults.departments = apiResults.departments
      newResults.auth = apiResults.auth
      newResults.error = apiResults.error
      newResults.details = apiResults.details

    } catch (err: any) {
      newResults.details.push(`❌ API call failed: ${err.message}`)
      newResults.error = err.message
      newResults.connection = false
    }

    setResults(newResults)
    setTesting(false)
  }

  const StatusIcon = ({ status }: { status: boolean | null }) => {
    if (status === null) return <div className="w-5 h-5 bg-gray-300 rounded-full" />
    return status ? 
      <CheckCircle className="w-5 h-5 text-green-600" /> : 
      <XCircle className="w-5 h-5 text-red-600" />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Database Connection Test</CardTitle>
          <CardDescription>
            Test your Supabase database connection with service role access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button 
              onClick={testConnection} 
              disabled={testing}
              className="w-full"
            >
              {testing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing Connection...
                </>
              ) : (
                'Test Database Connection'
              )}
            </Button>

            {results.error && (
              <Alert variant="destructive">
                <AlertDescription>{results.error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Supabase Connection</span>
                <StatusIcon status={results.connection} />
              </div>
              
              <div className="flex items-center justify-between">
                <span>Departments Table</span>
                <StatusIcon status={results.departments} />
              </div>
              
              <div className="flex items-center justify-between">
                <span>User Profiles Table</span>
                <StatusIcon status={results.auth} />
              </div>
            </div>

            {results.details && results.details.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold mb-2">Detailed Test Log</h3>
                <div className="bg-gray-50 p-3 rounded-lg max-h-64 overflow-y-auto border">
                  {results.details.map((detail, index) => (
                    <div key={index} className="text-xs font-mono mb-1 leading-tight">
                      {detail}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-xs text-gray-600 space-y-1">
              <p><strong>Service Role Key Benefits:</strong></p>
              <p>• Full database access (bypasses RLS)</p>
              <p>• Can read all tables and data</p>
              <p>• Perfect for admin operations and testing</p>
            </div>

            <div className="flex space-x-2">
              <Button asChild variant="outline" size="sm">
                <a href="/setup">Back to Setup</a>
              </Button>
              <Button asChild variant="outline" size="sm">
                <a href="/login">Go to Login</a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}