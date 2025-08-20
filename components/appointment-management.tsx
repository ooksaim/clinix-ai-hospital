"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Users, ExternalLink, RefreshCw, Mail, Phone, MapPin, Video } from "lucide-react"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { 
  getCurrentUser, 
  getTodaysAppointmentsWithDetails, 
  getThisWeeksAppointmentsWithDetails,
  getNextMonthAppointmentsWithDetails,
  getAllUpcomingAppointmentsWithDetails,
  testCalendlyConnection,
  testGetAnyEvents,
  testAllCalendlyEndpoints,
  calculateAvailability,
  formatDetailedAppointment,
  CalendlyEventWithDetails,
  CalendlyUser 
} from "@/lib/calendly"

interface AppointmentStats {
  todayCount: number
  weekCount: number
  availability: number
}

interface DetailedAppointment {
  id: string
  title: string
  startTime: string
  endTime: string
  startDate: string
  startTimeOnly: string
  endTimeOnly: string
  status: string
  attendeeName: string
  attendeeEmail: string
  attendeeCount: number
  location: string
  locationType: string
  invitees: any[]
  cancelUrl?: string
  rescheduleUrl?: string
  questionsAndAnswers: Array<{ question: string; answer: string }>
}

export function AppointmentManagement() {
  const [user, setUser] = useState<CalendlyUser | null>(null)
  const [todaysAppointments, setTodaysAppointments] = useState<CalendlyEventWithDetails[]>([])
  const [weeklyAppointments, setWeeklyAppointments] = useState<CalendlyEventWithDetails[]>([])
  const [allAppointments, setAllAppointments] = useState<CalendlyEventWithDetails[]>([])
  const [detailedAppointments, setDetailedAppointments] = useState<DetailedAppointment[]>([])
  const [stats, setStats] = useState<AppointmentStats>({
    todayCount: 0,
    weekCount: 0,
    availability: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [selectedDateAppointments, setSelectedDateAppointments] = useState<DetailedAppointment[]>([])
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date())

  const fetchAppointments = async () => {
    try {
      console.log('🚀 FETCH START: Beginning appointment fetch process...')
      setLoading(true)
      setError(null)

      // Test API connection first
      console.log('🔍 FETCH STEP 1: Testing API connection...')
      const connectionTest = await testCalendlyConnection()
      console.log('🔍 Connection test result:', connectionTest)
      if (!connectionTest) {
        console.error('❌ FETCH FAILED: API connection failed')
        setError('Failed to connect to Calendly API. Please check your access token.')
        return
      }

      // Test getting any events at all
      console.log('🧪 FETCH STEP 2: Testing if we can get ANY events...')
      await testGetAnyEvents()
      
      // Run comprehensive API tests
      console.log('🧪 FETCH STEP 2B: Running comprehensive API tests...')
      await testAllCalendlyEndpoints()

      // Get current user
      console.log('👤 FETCH STEP 3: Getting current user...')
      const currentUser = await getCurrentUser()
      console.log('👤 Current user received:', currentUser)
      setUser(currentUser)

      // Get appointments with WIDER date ranges
      console.log("📅 FETCH STEP 4: Fetching appointments...")
      
      console.log("📅 FETCH 4A: Getting today's events...")
      const todayEvents = await getTodaysAppointmentsWithDetails(currentUser.uri)
      console.log("📊 Today's events result:", todayEvents)
      console.log("📊 Today's events count:", todayEvents.length)
      
      console.log("📅 FETCH 4B: Getting this week's events...")
      const weekEvents = await getThisWeeksAppointmentsWithDetails(currentUser.uri)
      console.log("📊 Week events result:", weekEvents)
      console.log("📊 Week events count:", weekEvents.length)
      
      console.log("📅 FETCH 4C: Getting all upcoming events...")
      const allEvents = await getAllUpcomingAppointmentsWithDetails(currentUser.uri)
      console.log("📊 All events result:", allEvents)
      console.log("📊 All events count:", allEvents.length)
      
      console.log("📅 FETCH STEP 5: Setting state with events...")
      setTodaysAppointments(todayEvents)
      setWeeklyAppointments(weekEvents)
      setAllAppointments(allEvents)

      // Format detailed appointments from ALL events
      console.log("📅 FETCH STEP 6: Formatting detailed appointments...")
      const detailed = allEvents.map(formatDetailedAppointment)
      console.log("📋 Formatted appointments:", detailed)
      console.log("📋 Formatted appointments count:", detailed.length)
      setDetailedAppointments(detailed)

      // Calculate availability
      console.log("📊 FETCH STEP 7: Calculating availability...")
      const availability = await calculateAvailability(weekEvents)
      console.log("📊 Availability calculated:", availability)

      const newStats = {
        todayCount: todayEvents.length,
        weekCount: weekEvents.length,
        availability
      }
      console.log("📊 FETCH STEP 8: Setting stats:", newStats)
      setStats(newStats)

      // Set appointments for selected date
      console.log("📅 FETCH STEP 9: Setting selected date appointments...")
      if (selectedDate) {
        const selectedDateStr = selectedDate.toLocaleDateString()
        console.log("📅 Selected date string:", selectedDateStr)
        const dayAppointments = detailed.filter(apt => {
          console.log("📅 Comparing:", apt.startDate, "vs", selectedDateStr)
          return apt.startDate === selectedDateStr
        })
        console.log("📅 Day appointments found:", dayAppointments.length)
        setSelectedDateAppointments(dayAppointments)
      }

      setLastSyncTime(new Date())
      console.log("✅ FETCH COMPLETE: All appointments fetched and set successfully!")

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch appointments'
      console.error('❌ FETCH ERROR: Complete failure:', err)
      console.error('❌ Error message:', errorMessage)
      console.error('❌ Error stack:', err instanceof Error ? err.stack : 'No stack')
      setError(errorMessage)
    } finally {
      setLoading(false)
      console.log("🏁 FETCH END: Loading state set to false")
    }
  }

  useEffect(() => {
    fetchAppointments()
    
    // Auto-refresh every 30 seconds for real-time updates
    const interval = setInterval(() => {
      console.log("Auto-refreshing appointments...")
      fetchAppointments()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (selectedDate && detailedAppointments.length > 0) {
      const selectedDateStr = selectedDate.toLocaleDateString()
      const dayAppointments = detailedAppointments.filter(apt => apt.startDate === selectedDateStr)
      setSelectedDateAppointments(dayAppointments)
    }
  }, [selectedDate, detailedAppointments])

  const getLocationIcon = (locationType: string) => {
    switch (locationType.toLowerCase()) {
      case 'zoom':
      case 'google_meet':
      case 'gotomeeting':
      case 'webex':
        return <Video className="h-4 w-4" />
      case 'phone':
        return <Phone className="h-4 w-4" />
      case 'physical':
      case 'in_person':
        return <MapPin className="h-4 w-4" />
      default:
        return <Calendar className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading appointments...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-800 mb-4">Error: {error}</p>
              <Button onClick={fetchAppointments} variant="outline">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* User Info */}
      {user && (
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">Calendly Integration</h3>
            <p className="text-sm text-muted-foreground">
              Connected as: <span className="font-medium">{user.name}</span> ({user.email})
            </p>
          </div>
          <Button onClick={fetchAppointments} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Today's Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.todayCount}</div>
            <p className="text-xs text-muted-foreground">Scheduled for today</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.weekCount}</div>
            <p className="text-xs text-muted-foreground">Total appointments</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              All Upcoming
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{allAppointments.length}</div>
            <p className="text-xs text-muted-foreground">Total scheduled</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Last Sync
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold text-orange-600">
              {lastSyncTime.toLocaleTimeString()}
            </div>
            <p className="text-xs text-muted-foreground">Auto-refresh: 30s</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enhanced Calendar with Appointments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Calendar View
            </CardTitle>
            <CardDescription>
              Click on a date to see appointments for that day
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
              modifiers={{
                hasAppointment: detailedAppointments.map(apt => new Date(apt.startDate))
              }}
              modifiersClassNames={{
                hasAppointment: 'bg-blue-100 text-blue-900 font-semibold'
              }}
            />
            
            {/* Appointments for Selected Date */}
            <div className="mt-4">
              <h4 className="font-medium mb-3">
                {selectedDate ? selectedDate.toLocaleDateString() : 'Today'} 
                ({selectedDateAppointments.length} appointment{selectedDateAppointments.length !== 1 ? 's' : ''})
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedDateAppointments.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No appointments on this date</p>
                ) : (
                  selectedDateAppointments.map((appointment) => (
                    <div key={appointment.id} className="p-2 border rounded text-sm">
                      <div className="font-medium">{appointment.startTimeOnly} - {appointment.endTimeOnly}</div>
                      <div className="text-muted-foreground">{appointment.title}</div>
                      <div className="text-xs text-blue-600">{appointment.attendeeName}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Appointment List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Upcoming Appointments
            </CardTitle>
            <CardDescription>
              Detailed view of all scheduled appointments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {detailedAppointments.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No appointments scheduled</p>
              ) : (
                detailedAppointments.map((appointment) => (
                  <div key={appointment.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-lg">{appointment.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {appointment.startTime} - {appointment.endTime}
                        </div>
                      </div>
                      <Badge variant={appointment.status === 'active' ? 'default' : 'secondary'}>
                        {appointment.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{appointment.attendeeName}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{appointment.attendeeEmail}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {getLocationIcon(appointment.locationType)}
                        <span>{appointment.location}</span>
                      </div>
                    </div>

                    {appointment.questionsAndAnswers.length > 0 && (
                      <div className="border-t pt-2">
                        <h5 className="font-medium text-sm mb-1">Additional Information:</h5>
                        {appointment.questionsAndAnswers.map((qa, index) => (
                          <div key={index} className="text-xs">
                            <span className="font-medium">{qa.question}:</span> {qa.answer}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      {appointment.rescheduleUrl && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => window.open(appointment.rescheduleUrl, '_blank')}
                        >
                          Reschedule
                        </Button>
                      )}
                      {appointment.cancelUrl && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => window.open(appointment.cancelUrl, '_blank')}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              className="justify-start h-auto p-4" 
              variant="outline"
              onClick={() => user && window.open(user.scheduling_url, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-3" />
              <div className="text-left">
                <div className="font-medium">View Calendly Dashboard</div>
                <div className="text-sm text-muted-foreground">Open external Calendly management</div>
              </div>
            </Button>
            <Button 
              className="justify-start h-auto p-4" 
              variant="outline"
              onClick={fetchAppointments}
            >
              <RefreshCw className="h-4 w-4 mr-3" />
              <div className="text-left">
                <div className="font-medium">Sync Appointments</div>
                <div className="text-sm text-muted-foreground">Refresh from Calendly API</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Integration Status */}
      <div className="p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Real-time Integration Status</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-blue-800">
          <div>
            <span className="font-medium">Access Token:</span>
            <div>✓ Connected</div>
          </div>
          <div>
            <span className="font-medium">Last Sync:</span>
            <div>{lastSyncTime.toLocaleTimeString()}</div>
          </div>
          <div>
            <span className="font-medium">Events Loaded:</span>
            <div>{detailedAppointments.length} total</div>
          </div>
          <div>
            <span className="font-medium">Auto-refresh:</span>
            <div>Every 30 seconds</div>
          </div>
        </div>
        <div className="mt-2 flex gap-2">
          <Button variant="link" className="p-0 h-auto text-blue-600 text-sm">
            Configure Settings
          </Button>
          <Button 
            variant="link" 
            className="p-0 h-auto text-blue-600 text-sm"
            onClick={fetchAppointments}
          >
            Force Sync Now
          </Button>
        </div>
      </div>
    </div>
  )
}
