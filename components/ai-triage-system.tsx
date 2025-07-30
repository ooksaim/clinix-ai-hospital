"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  AlertTriangle, 
  Activity, 
  Clock, 
  User, 
  Stethoscope,
  Brain,
  Zap,
  CheckCircle,
  XCircle
} from "lucide-react"
import { performAITriage, type TriageAssessment, type VitalSigns } from "@/app/actions"

interface AITriageSystemProps {
  onTriageComplete: (assessment: TriageAssessment) => void
}

export function AITriageSystem({ onTriageComplete }: AITriageSystemProps) {
  const [symptoms, setSymptoms] = useState("")
  const [vitalSigns, setVitalSigns] = useState<Partial<VitalSigns>>({
    bloodPressure: "",
    heartRate: undefined,
    temperature: undefined,
    respiratoryRate: undefined,
    oxygenSaturation: undefined
  })
  const [assessment, setAssessment] = useState<TriageAssessment | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleTriageAnalysis = async () => {
    if (!symptoms.trim()) {
      setError("Please enter patient symptoms")
      return
    }

    try {
      setIsAnalyzing(true)
      setError(null)
      
      // Convert partial vital signs to VitalSigns type if any values are provided
      const vitals = Object.values(vitalSigns).some(value => value !== "" && value !== undefined) ? {
        ...vitalSigns,
        recordedAt: new Date().toISOString()
      } as VitalSigns : undefined

      const triageResult = await performAITriage(symptoms, vitals)
      setAssessment(triageResult)
      onTriageComplete(triageResult)
      
    } catch (err: any) {
      setError(`Triage analysis failed: ${err.message}`)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const resetTriage = () => {
    setSymptoms("")
    setVitalSigns({
      bloodPressure: "",
      heartRate: undefined,
      temperature: undefined,
      respiratoryRate: undefined,
      oxygenSaturation: undefined
    })
    setAssessment(null)
    setError(null)
  }

  const getUrgencyBadge = (level: number) => {
    if (level === 1) return { 
      color: 'bg-red-600 text-white', 
      text: 'RED - Immediate', 
      icon: <AlertTriangle className="h-4 w-4" /> 
    }
    if (level === 2) return { 
      color: 'bg-orange-500 text-white', 
      text: 'ORANGE - 10 mins', 
      icon: <Zap className="h-4 w-4" /> 
    }
    if (level === 3) return { 
      color: 'bg-yellow-500 text-white', 
      text: 'YELLOW - 30 mins', 
      icon: <Clock className="h-4 w-4" /> 
    }
    if (level === 4) return { 
      color: 'bg-green-500 text-white', 
      text: 'GREEN - 60 mins', 
      icon: <Activity className="h-4 w-4" /> 
    }
    return { 
      color: 'bg-blue-500 text-white', 
      text: 'BLUE - 2+ hours', 
      icon: <User className="h-4 w-4" /> 
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="bg-blue-600 p-3 rounded-lg">
          <Brain className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AI Triage System</h2>
          <p className="text-gray-600">Intelligent patient prioritization powered by AI</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Patient Assessment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Symptoms */}
            <div>
              <Label htmlFor="symptoms" className="text-sm font-medium">
                Chief Complaint & Symptoms *
              </Label>
              <Textarea
                id="symptoms"
                value={symptoms}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSymptoms(e.target.value)}
                placeholder="Describe the patient's primary complaint and symptoms..."
                className="min-h-24 mt-1"
                disabled={isAnalyzing}
              />
            </div>

            {/* Vital Signs */}
            <div>
              <Label className="text-sm font-medium mb-3 block">
                Vital Signs (Optional but recommended)
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="bp" className="text-xs text-gray-600">Blood Pressure</Label>
                  <Input
                    id="bp"
                    value={vitalSigns.bloodPressure}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVitalSigns(prev => ({ ...prev, bloodPressure: e.target.value }))}
                    placeholder="120/80"
                    disabled={isAnalyzing}
                  />
                </div>
                <div>
                  <Label htmlFor="hr" className="text-xs text-gray-600">Heart Rate (bpm)</Label>
                  <Input
                    id="hr"
                    type="number"
                    value={vitalSigns.heartRate || ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVitalSigns(prev => ({ ...prev, heartRate: parseInt(e.target.value) || undefined }))}
                    placeholder="72"
                    disabled={isAnalyzing}
                  />
                </div>
                <div>
                  <Label htmlFor="temp" className="text-xs text-gray-600">Temperature (°F)</Label>
                  <Input
                    id="temp"
                    type="number"
                    step="0.1"
                    value={vitalSigns.temperature || ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVitalSigns(prev => ({ ...prev, temperature: parseFloat(e.target.value) || undefined }))}
                    placeholder="98.6"
                    disabled={isAnalyzing}
                  />
                </div>
                <div>
                  <Label htmlFor="rr" className="text-xs text-gray-600">Respiratory Rate</Label>
                  <Input
                    id="rr"
                    type="number"
                    value={vitalSigns.respiratoryRate || ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVitalSigns(prev => ({ ...prev, respiratoryRate: parseInt(e.target.value) || undefined }))}
                    placeholder="16"
                    disabled={isAnalyzing}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="o2" className="text-xs text-gray-600">Oxygen Saturation (%)</Label>
                  <Input
                    id="o2"
                    type="number"
                    value={vitalSigns.oxygenSaturation || ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVitalSigns(prev => ({ ...prev, oxygenSaturation: parseInt(e.target.value) || undefined }))}
                    placeholder="98"
                    disabled={isAnalyzing}
                  />
                </div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button 
                onClick={handleTriageAnalysis}
                disabled={isAnalyzing || !symptoms.trim()}
                className="flex-1"
              >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Perform AI Triage
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={resetTriage} disabled={isAnalyzing}>
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Triage Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            {assessment ? (
              <div className="space-y-4">
                {/* Urgency Level */}
                <div className="text-center">
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold ${getUrgencyBadge(assessment.urgencyLevel).color}`}>
                    {getUrgencyBadge(assessment.urgencyLevel).icon}
                    <span>{getUrgencyBadge(assessment.urgencyLevel).text}</span>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <p className="text-sm text-gray-600">Priority Level</p>
                    <p className="text-lg font-semibold capitalize">{assessment.priority}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <p className="text-sm text-gray-600">Est. Wait Time</p>
                    <p className="text-lg font-semibold">{assessment.estimatedWaitTime} min</p>
                  </div>
                </div>

                {/* Warning Flags */}
                {assessment.warningFlags.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Warning Flags
                    </h4>
                    <ul className="space-y-1">
                      {assessment.warningFlags.map((flag, index) => (
                        <li key={index} className="text-sm bg-red-50 p-2 rounded border-l-4 border-red-500">
                          {flag}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* AI Recommendation */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    AI Recommendation
                  </h4>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{assessment.aiRecommendation}</p>
                  </div>
                </div>

                <div className="text-xs text-gray-500 text-center pt-2">
                  Assessment completed at {new Date(assessment.assessmentTime).toLocaleString()}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Brain className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p>Complete the patient assessment to receive AI triage recommendations</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
