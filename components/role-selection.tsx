"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Stethoscope, 
  Heart, 
  BarChart3, 
  Microscope, 
  AlertTriangle,
  ArrowRight,
  Brain,
  Activity,
  Users,
  TrendingUp,
  Zap,
  Settings
} from "lucide-react"
import { useRouter } from "next/navigation"

interface Role {
  id: string
  title: string
  subtitle: string
  icon: any
  color: string
  bgColor: string
  description: string
  features: string[]
  primaryAction: string
}

const roles: Role[] = [
  {
    id: 'doctor',
    title: 'Doctor/Physician',
    subtitle: 'Clinical Care & Diagnosis',
    icon: Stethoscope,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200',
    description: 'Access AI-powered diagnosis, patient management, and clinical decision support tools.',
    features: [
      'AI Medical Diagnosis',
      'Patient Records Management', 
      'Medical History Tracking',
      'Drug Interaction Analysis',
      'Voice Documentation',
      'Medical Image Analysis'
    ],
    primaryAction: 'Start Diagnosis'
  },
  {
    id: 'nurse',
    title: 'Nurse/Triage Specialist',
    subtitle: 'Patient Assessment & Triage',
    icon: Heart,
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200',
    description: 'WHO-standard triage system, emergency protocols, and patient monitoring tools.',
    features: [
      'AI Triage System (WHO 5-Class)',
      'Emergency Protocol Management',
      'Vital Signs Recording',
      'Patient Registration',
      'Critical Alert Monitoring',
      'Predictive Health Assessment'
    ],
    primaryAction: 'Begin Triage'
  },
  {
    id: 'admin',
    title: 'Hospital Administrator',
    subtitle: 'Operations & Management',
    icon: Settings,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 border-purple-200',
    description: 'Hospital operations dashboard, analytics, resource optimization, and system management.',
    features: [
      'Hospital Operations Dashboard',
      'Resource Allocation Optimizer',
      'Staff Management Tools',
      'System Configuration',
      'Performance Analytics',
      'AI Quota Management'
    ],
    primaryAction: 'View Dashboard'
  },
  {
    id: 'researcher',
    title: 'Medical Analyst',
    subtitle: 'Data Analysis & Research',
    icon: Microscope,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 border-orange-200',
    description: 'Advanced analytics, patient demographics, diagnosis patterns, and research insights.',
    features: [
      'Patient Demographics Analysis',
      'Diagnosis Pattern Recognition',
      'Medical Condition Trends',
      'AI-Generated Insights',
      'Statistical Reporting',
      'Research Data Export'
    ],
    primaryAction: 'Analyze Data'
  },
  {
    id: 'emergency',
    title: 'Emergency Coordinator',
    subtitle: 'Critical Care Management',
    icon: AlertTriangle,
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-red-200',
    description: 'Emergency response coordination, critical patient monitoring, and crisis management.',
    features: [
      'Emergency Response Protocols',
      'Critical Patient Alerts',
      'Staff Assignment System',
      'Real-time Emergency Dashboard',
      'Crisis Communication Tools',
      'Emergency Analytics'
    ],
    primaryAction: 'Emergency Center'
  }
]

export function RoleSelection() {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<string | null>(null)

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId)
    // Navigate to role-specific login page
    setTimeout(() => {
      if (roleId === 'admin') {
        router.push('/administrator/login')
      } else {
        router.push(`/${roleId}/login`)
      }
    }, 300)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-3 rounded-xl">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Clinix AI Hospital Management</h1>
              <p className="text-gray-600">Advanced AI-powered healthcare management system</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Introduction */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Role to Continue
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Access role-specific features designed for your healthcare responsibilities. 
            Our AI-powered system adapts to your workflow and provides the tools you need.
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">27+</p>
                <p className="text-gray-600">AI Features</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">5</p>
                <p className="text-gray-600">Specialized Roles</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">WHO</p>
                <p className="text-gray-600">Standard Compliant</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center gap-3">
              <Zap className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">24/7</p>
                <p className="text-gray-600">AI Availability</p>
              </div>
            </div>
          </div>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {roles.map((role) => {
            const IconComponent = role.icon
            const isSelected = selectedRole === role.id
            
            return (
              <Card 
                key={role.id} 
                className={`cursor-pointer transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 ${
                  isSelected 
                    ? 'ring-2 ring-blue-500 shadow-lg scale-105' 
                    : 'hover:shadow-md'
                } ${role.bgColor}`}
                onClick={() => handleRoleSelect(role.id)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-lg bg-white shadow-sm`}>
                        <IconComponent className={`h-6 w-6 ${role.color}`} />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold text-gray-900">
                          {role.title}
                        </CardTitle>
                        <CardDescription className="text-sm text-gray-600">
                          {role.subtitle}
                        </CardDescription>
                      </div>
                    </div>
                    <ArrowRight className={`h-5 w-5 transition-transform ${
                      isSelected ? 'translate-x-1' : ''
                    } ${role.color}`} />
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {role.description}
                  </p>
                  
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Key Features
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {role.features.slice(0, 3).map((feature, index) => (
                        <Badge 
                          key={index}
                          variant="secondary" 
                          className="text-xs bg-white/70 text-gray-700 hover:bg-white/90"
                        >
                          {feature}
                        </Badge>
                      ))}
                      {role.features.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{role.features.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  <Button 
                    className={`w-full mt-4 ${role.color.replace('text-', 'bg-').replace('600', '600')} hover:opacity-90 text-white`}
                    disabled={isSelected}
                  >
                    {isSelected ? 'Loading...' : role.primaryAction}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Footer */}
        <div className="text-center mt-16">
          <p className="text-gray-500">
            Powered by advanced AI technology • WHO Standard Compliant • Real-time Analytics
          </p>
        </div>
      </div>
    </div>
  )
}
