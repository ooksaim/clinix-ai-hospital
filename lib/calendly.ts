// Calendly API integration
const CALENDLY_API_BASE = 'https://api.calendly.com'

// Your Calendly access token
const CALENDLY_ACCESS_TOKEN = process.env.CALENDLY_ACCESS_TOKEN || ''

const calendlyHeaders = {
  'Authorization': `Bearer ${CALENDLY_ACCESS_TOKEN}`,
  'Content-Type': 'application/json'
}

// Test API connection
export async function testCalendlyConnection(): Promise<boolean> {
  try {
    console.log('🔍 STEP 1: Testing Calendly API connection...')
    console.log('🔑 Access Token (first 20 chars):', CALENDLY_ACCESS_TOKEN.substring(0, 20) + '...')
    console.log('🌐 API Base URL:', CALENDLY_API_BASE)
    
    const response = await fetch(`${CALENDLY_API_BASE}/users/me`, {
      headers: calendlyHeaders
    })

    console.log('📡 STEP 2: API Response Status:', response.status)
    console.log('📡 Response Headers:', Object.fromEntries(response.headers.entries()))
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ STEP 3: API Error Response:', errorText)
      console.error('❌ Response Status Text:', response.statusText)
      return false
    }

    const data = await response.json()
    console.log('✅ STEP 4: API Connection successful!')
    console.log('✅ User data received:', JSON.stringify(data, null, 2))
    console.log('✅ User name:', data.resource?.name)
    console.log('✅ User URI:', data.resource?.uri)
    return true
  } catch (error) {
    console.error('❌ STEP ERROR: API Connection failed:', error)
    console.error('❌ Error details:', error instanceof Error ? error.message : 'Unknown error')
    return false
  }
}

// Simple test to check if we can get ANY events at all
export async function testGetAnyEvents(): Promise<void> {
  try {
    console.log('🧪 TEST STEP 1: Getting any events without filters...')
    
    // Test 1: Try without any parameters
    console.log('🧪 TEST 1A: Trying API call with no parameters...')
    const response1 = await fetch(`${CALENDLY_API_BASE}/scheduled_events`, {
      headers: calendlyHeaders
    })
    console.log('📡 Test 1A Response Status:', response1.status)
    const data1 = await response1.text()
    console.log('📡 Test 1A Response (raw):', data1)
    
    // Test 2: Try with just count parameter
    console.log('🧪 TEST 1B: Trying API call with count parameter...')
    const response2 = await fetch(`${CALENDLY_API_BASE}/scheduled_events?count=100`, {
      headers: calendlyHeaders
    })
    console.log('📡 Test 1B Response Status:', response2.status)
    const data2 = await response2.text()
    console.log('📡 Test 1B Response (raw):', data2)
    
    // Test 3: Parse as JSON if successful
    if (response2.ok) {
      try {
        const jsonData = JSON.parse(data2)
        console.log('🧪 TEST 1C: JSON parsed successfully:', jsonData)
        console.log('🧪 Events found:', jsonData.collection?.length || 0)
        if (jsonData.collection && jsonData.collection.length > 0) {
          console.log('🧪 First event:', jsonData.collection[0])
        }
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError)
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Additional comprehensive API test
export async function testAllCalendlyEndpoints(): Promise<void> {
  try {
    console.log('🧪 COMPREHENSIVE TEST: Testing all Calendly endpoints...')
    
    // Test user endpoint
    console.log('🧪 TEST A: User endpoint...')
    const userResponse = await fetch(`${CALENDLY_API_BASE}/users/me`, {
      headers: calendlyHeaders
    })
    console.log('📡 User endpoint status:', userResponse.status)
    if (userResponse.ok) {
      const userData = await userResponse.json()
      console.log('👤 User data:', userData)
      
      // Test with user URI
      if (userData.resource?.uri) {
        console.log('🧪 TEST B: Events with user URI...')
        const userUri = userData.resource.uri
        const eventsResponse = await fetch(`${CALENDLY_API_BASE}/scheduled_events?user=${encodeURIComponent(userUri)}&count=100`, {
          headers: calendlyHeaders
        })
        console.log('📡 Events with user URI status:', eventsResponse.status)
        const eventsData = await eventsResponse.text()
        console.log('📡 Events with user URI response:', eventsData)
        
        if (eventsResponse.ok) {
          try {
            const eventsJson = JSON.parse(eventsData)
            console.log('📊 Events JSON:', eventsJson)
            console.log('📊 Events count:', eventsJson.collection?.length || 0)
          } catch (e) {
            console.error('❌ Failed to parse events JSON:', e)
          }
        }
      }
    }
    
    // Test event types endpoint
    console.log('🧪 TEST C: Event types endpoint...')
    const eventTypesResponse = await fetch(`${CALENDLY_API_BASE}/event_types`, {
      headers: calendlyHeaders
    })
    console.log('📡 Event types status:', eventTypesResponse.status)
    if (eventTypesResponse.ok) {
      const eventTypesData = await eventTypesResponse.json()
      console.log('📅 Event types:', eventTypesData)
    }
    
  } catch (error) {
    console.error('❌ Comprehensive test failed:', error)
  }
}

export interface CalendlyEvent {
  uri: string
  name: string
  status: string
  start_time: string
  end_time: string
  created_at: string
  updated_at: string
  location?: {
    type: string
    location?: string
  }
  invitees_counter: {
    total: number
    active: number
    limit: number
  }
  event_guests?: any[]
  event_memberships?: any[]
}

export interface CalendlyInvitee {
  uri: string
  email: string
  name: string
  status: string
  created_at: string
  updated_at: string
  cancel_url?: string
  reschedule_url?: string
  routing_form_submission?: string
  questions_and_answers?: Array<{
    question: string
    answer: string
  }>
  payment?: {
    external_id: string
    provider: string
    amount: number
    currency: string
    terms: string
    successful: boolean
  }
  no_show?: {
    created_at: string
  }
  reconfirmation?: {
    created_at: string
    confirmed_at?: string
  }
}

export interface CalendlyEventWithDetails extends CalendlyEvent {
  invitees?: CalendlyInvitee[]
  location_details?: {
    type: string
    location?: string
    join_url?: string
    additional_info?: string
  }
}

export interface CalendlyUser {
  uri: string
  name: string
  slug: string
  email: string
  scheduling_url: string
  timezone: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface CalendlyEventType {
  uri: string
  name: string
  active: boolean
  slug: string
  scheduling_url: string
  duration: number
  kind: string
  pooling_type?: string
  type: string
  color: string
  created_at: string
  updated_at: string
  internal_note?: string
  description_plain?: string
  description_html?: string
}

// Get current user info
export async function getCurrentUser(): Promise<CalendlyUser> {
  try {
    console.log('👤 STEP 1: Fetching current user...')
    
    // Test connection first
    const isConnected = await testCalendlyConnection()
    if (!isConnected) {
      throw new Error('Failed to connect to Calendly API')
    }

    console.log('👤 STEP 2: Making user API call...')
    const response = await fetch(`${CALENDLY_API_BASE}/users/me`, {
      headers: calendlyHeaders
    })

    console.log('👤 STEP 3: User API Response Status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ STEP 4: User fetch error:', errorText)
      throw new Error(`Calendly API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('✅ STEP 5: User data received:', JSON.stringify(data, null, 2))
    console.log('✅ User resource:', data.resource)
    console.log('✅ User URI for events:', data.resource?.uri)
    return data.resource
  } catch (error) {
    console.error('❌ Error fetching Calendly user:', error)
    throw error
  }
}

// Get user's event types
export async function getUserEventTypes(userUri: string): Promise<CalendlyEventType[]> {
  try {
    const response = await fetch(`${CALENDLY_API_BASE}/event_types?user=${encodeURIComponent(userUri)}`, {
      headers: calendlyHeaders
    })

    if (!response.ok) {
      throw new Error(`Calendly API error: ${response.status}`)
    }

    const data = await response.json()
    return data.collection || []
  } catch (error) {
    console.error('Error fetching event types:', error)
    throw error
  }
}

// Get scheduled events
export async function getScheduledEvents(userUri: string, options: {
  count?: number
  status?: 'active' | 'canceled'
} = {}): Promise<CalendlyEvent[]> {
  try {
    console.log('📅 EVENTS STEP 1: Starting scheduled events fetch')
    console.log('� User URI received:', userUri)
    console.log('📅 Options received:', JSON.stringify(options, null, 2))

    const params = new URLSearchParams({
      user: userUri,
      count: (options.count || 100).toString(),
      status: options.status || 'active'
    })

    const url = `${CALENDLY_API_BASE}/scheduled_events?${params}`
    console.log('📅 EVENTS STEP 2: API URL constructed:', url)
    console.log('📅 Request headers:', JSON.stringify(calendlyHeaders, null, 2))

    console.log('📅 EVENTS STEP 3: Making API request...')
    const response = await fetch(url, {
      headers: calendlyHeaders
    })

    console.log('� EVENTS STEP 4: Response received')
    console.log('📡 Response Status:', response.status)
    console.log('📡 Response Status Text:', response.statusText)
    console.log('📡 Response Headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ EVENTS STEP 5: API Error Response (raw):', errorText)
      
      // Try to parse error as JSON
      try {
        const errorJson = JSON.parse(errorText)
        console.error('❌ Error parsed as JSON:', errorJson)
      } catch {
        console.error('❌ Error is not JSON, raw text:', errorText)
      }
      
      throw new Error(`Calendly API error: ${response.status} - ${errorText}`)
    }

    console.log('📅 EVENTS STEP 6: Parsing response...')
    const responseText = await response.text()
    console.log('📅 Raw response text:', responseText)
    
    let data
    try {
      data = JSON.parse(responseText)
      console.log('📅 EVENTS STEP 7: Response parsed successfully')
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError)
      console.error('❌ Raw response that failed to parse:', responseText)
      throw new Error('Failed to parse API response as JSON')
    }

    console.log('📊 EVENTS STEP 8: Data structure analysis')
    console.log('📊 Full API response structure:', JSON.stringify(data, null, 2))
    console.log('📊 Data keys:', Object.keys(data || {}))
    console.log('📊 Collection exists?', !!data.collection)
    console.log('📊 Collection type:', typeof data.collection)
    console.log('📊 Collection length:', data.collection?.length || 'N/A')
    
    if (data.collection && data.collection.length > 0) {
      console.log('📋 EVENTS STEP 9: Events found!')
      console.log('📋 First event structure:', JSON.stringify(data.collection[0], null, 2))
      console.log('📋 All event names:', data.collection.map((e: any) => e.name))
      console.log('📋 All event times:', data.collection.map((e: any) => ({ name: e.name, start: e.start_time, end: e.end_time })))
    } else {
      console.log('⚠️ EVENTS STEP 9: No events in collection')
      console.log('⚠️ Collection value:', data.collection)
      
      // Check if there are other fields in the response
      console.log('🔍 Checking for other data fields...')
      Object.keys(data || {}).forEach(key => {
        console.log(`🔍 Field "${key}":`, data[key])
      })
    }
    
    const events = data.collection || []
    console.log('📅 EVENTS STEP 10: Returning', events.length, 'events')
    return events
    
  } catch (error) {
    console.error('❌ EVENTS ERROR: Complete failure in getScheduledEvents')
    console.error('❌ Error type:', typeof error)
    console.error('❌ Error message:', error instanceof Error ? error.message : 'Unknown error')
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack')
    throw error
  }
}

// Get today's appointments
export async function getTodaysAppointments(userUri: string): Promise<CalendlyEvent[]> {
  // Just get all events - no date filtering
  return getScheduledEvents(userUri, { count: 100 })
}

// Get this week's appointments
export async function getThisWeeksAppointments(userUri: string): Promise<CalendlyEvent[]> {
  // Just get all events - no date filtering
  return getScheduledEvents(userUri, { count: 100 })
}

// Calculate availability percentage
export function calculateAvailability(events: CalendlyEvent[], totalHours: number = 40): Promise<number> {
  const totalMinutesBooked = events.reduce((total, event) => {
    const start = new Date(event.start_time)
    const end = new Date(event.end_time)
    const duration = (end.getTime() - start.getTime()) / (1000 * 60) // minutes
    return total + duration
  }, 0)

  const totalMinutesAvailable = totalHours * 60
  const utilizationPercentage = Math.round((totalMinutesBooked / totalMinutesAvailable) * 100)
  
  return Promise.resolve(Math.min(utilizationPercentage, 100))
}

// Get invitees for a specific event
export async function getEventInvitees(eventUri: string): Promise<CalendlyInvitee[]> {
  try {
    console.log('👥 INVITEES STEP 1: Fetching invitees for event:', eventUri)
    
    // Extract the event UUID from the URI
    const eventUuid = eventUri.split('/').pop()
    console.log('👥 Event UUID:', eventUuid)
    
    const inviteesUrl = `${CALENDLY_API_BASE}/scheduled_events/${eventUuid}/invitees`
    console.log('👥 INVITEES STEP 2: Invitees URL:', inviteesUrl)
    
    const response = await fetch(inviteesUrl, {
      headers: calendlyHeaders
    })

    console.log('👥 INVITEES STEP 3: Response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ INVITEES ERROR:', errorText)
      throw new Error(`Calendly API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('👥 INVITEES STEP 4: Invitees data received:', JSON.stringify(data, null, 2))
    console.log('👥 Number of invitees:', data.collection?.length || 0)
    
    if (data.collection && data.collection.length > 0) {
      data.collection.forEach((invitee: any, index: number) => {
        console.log(`👥 Invitee ${index + 1}:`, {
          name: invitee.name,
          email: invitee.email,
          status: invitee.status,
          questionsAndAnswers: invitee.questions_and_answers
        })
      })
    }
    
    return data.collection || []
  } catch (error) {
    console.error('❌ Error fetching event invitees:', error)
    return []
  }
}

// Get detailed event information with invitees
export async function getEventWithDetails(eventUri: string): Promise<CalendlyEventWithDetails | null> {
  try {
    // Get event details
    const eventResponse = await fetch(`${CALENDLY_API_BASE}/scheduled_events/${encodeURIComponent(eventUri)}`, {
      headers: calendlyHeaders
    })

    if (!eventResponse.ok) {
      throw new Error(`Calendly API error: ${eventResponse.status}`)
    }

    const eventData = await eventResponse.json()
    const event = eventData.resource

    // Get invitees
    const invitees = await getEventInvitees(eventUri)

    return {
      ...event,
      invitees
    }
  } catch (error) {
    console.error('Error fetching event details:', error)
    return null
  }
}

// Get scheduled events with full details
export async function getScheduledEventsWithDetails(userUri: string, options: {
  count?: number
  status?: 'active' | 'canceled'
} = {}): Promise<CalendlyEventWithDetails[]> {
  try {
    console.log('📋 DETAILS STEP 1: Getting scheduled events with details...')
    
    // First get all events (no date filtering)
    const events = await getScheduledEvents(userUri, options)
    console.log('📋 DETAILS STEP 2: Got', events.length, 'events, now fetching invitee details...')
    
    // Then get details for each event
    const detailedEvents = await Promise.all(
      events.map(async (event, index) => {
        console.log(`📋 DETAILS STEP 3.${index + 1}: Processing event:`, event.name)
        console.log(`📋 Event URI:`, event.uri)
        
        const invitees = await getEventInvitees(event.uri)
        console.log(`📋 Invitees found for "${event.name}":`, invitees.length)
        
        const detailedEvent = {
          ...event,
          invitees
        }
        
        console.log(`📋 Detailed event created:`, {
          name: detailedEvent.name,
          inviteesCount: detailedEvent.invitees?.length || 0,
          primaryInvitee: detailedEvent.invitees?.[0]?.name || 'No invitee'
        })
        
        return detailedEvent
      })
    )

    console.log('📋 DETAILS STEP 4: All detailed events processed:', detailedEvents.length)
    return detailedEvents
  } catch (error) {
    console.error('❌ Error fetching detailed events:', error)
    return []
  }
}

// Get today's appointments with details
export async function getTodaysAppointmentsWithDetails(userUri: string): Promise<CalendlyEventWithDetails[]> {
  // Just get all events - no date filtering
  return getScheduledEventsWithDetails(userUri, { count: 100 })
}

// Get this week's appointments with details
export async function getThisWeeksAppointmentsWithDetails(userUri: string): Promise<CalendlyEventWithDetails[]> {
  // Just get all events - no date filtering  
  return getScheduledEventsWithDetails(userUri, { count: 100 })
}

// Get next 30 days of appointments with details
export async function getNextMonthAppointmentsWithDetails(userUri: string): Promise<CalendlyEventWithDetails[]> {
  // Just get all events - no date filtering
  return getScheduledEventsWithDetails(userUri, { count: 100 })
}

// Get ALL upcoming appointments (no date limit)
export async function getAllUpcomingAppointmentsWithDetails(userUri: string): Promise<CalendlyEventWithDetails[]> {
  try {
    console.log('🔍 Getting ALL appointments - no date filtering!')
    
    // Just get ALL events without any filtering
    const allEvents = await getScheduledEventsWithDetails(userUri, {
      count: 100 // Maximum allowed by Calendly API
    })
    console.log('📊 Total events found:', allEvents.length)
    
    return allEvents

  } catch (error) {
    console.error('❌ Error in getAllUpcomingAppointmentsWithDetails:', error)
    return []
  }
}

// Format appointment with detailed information
export function formatDetailedAppointment(event: CalendlyEventWithDetails) {
  console.log('🎯 FORMATTING: Processing event for formatting:', {
    name: event.name,
    hasInvitees: !!event.invitees,
    inviteesCount: event.invitees?.length || 0,
    inviteeData: event.invitees?.[0] || 'No primary invitee'
  })
  
  const primaryInvitee = event.invitees?.[0]
  
  const formatted = {
    id: event.uri,
    title: event.name,
    startTime: new Date(event.start_time).toLocaleString(),
    endTime: new Date(event.end_time).toLocaleString(),
    startDate: new Date(event.start_time).toLocaleDateString(),
    startTimeOnly: new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    endTimeOnly: new Date(event.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: event.status,
    attendeeName: primaryInvitee?.name || 'Unknown',
    attendeeEmail: primaryInvitee?.email || '',
    attendeeCount: event.invitees_counter.active,
    location: event.location?.location || 'Not specified',
    locationType: event.location?.type || 'unknown',
    invitees: event.invitees || [],
    cancelUrl: primaryInvitee?.cancel_url,
    rescheduleUrl: primaryInvitee?.reschedule_url,
    questionsAndAnswers: primaryInvitee?.questions_and_answers || []
  }
  
  console.log('🎯 FORMATTED RESULT:', {
    title: formatted.title,
    attendeeName: formatted.attendeeName,
    attendeeEmail: formatted.attendeeEmail,
    questionsCount: formatted.questionsAndAnswers.length
  })
  
  return formatted
}
