import { supabase } from './supabase'
import { Database } from './database.types'

export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type UserRole = 'doctor' | 'nurse' | 'pharmacist' | 'lab_tech' | 'radiologist' | 'admin' | 'receptionist' | 'ward_admin'

export interface AuthUser {
  id: string
  email: string
  profile: UserProfile
}

// Sign in with email and password
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  
  if (error) throw error
  
  // Get user profile
  if (data.user) {
    const profile = await getUserProfile(data.user.id)
    return {
      user: data.user,
      profile
    }
  }
  
  return { user: null, profile: null }
}

// Sign up new user (admin only)
export const signUp = async (userData: {
  email: string
  password: string
  first_name: string
  last_name: string
  role: UserRole
  department_id?: string
  phone?: string
  cnic?: string
  specialization?: string
}) => {
  // Create auth user
  const { data, error } = await supabase.auth.signUp({
    email: userData.email,
    password: userData.password
  })
  
  if (error) throw error
  
  // Create user profile
  if (data.user) {
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: data.user.id,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: userData.role,
        department_id: userData.department_id,
        phone: userData.phone,
        cnic: userData.cnic,
        specialization: userData.specialization,
        is_active: true
      })
    
    if (profileError) throw profileError
  }
  
  return data
}

// Get user profile by ID
export const getUserProfile = async (userId: string): Promise<UserProfile> => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) throw error
  return data
}

// Get current authenticated user with profile
export const getCurrentUserWithProfile = async (): Promise<AuthUser | null> => {
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) return null
  
  try {
    const profile = await getUserProfile(user.id)
    return {
      id: user.id,
      email: user.email!,
      profile
    }
  } catch {
    return null
  }
}

// Sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// Update user profile
export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  
  if (error) throw error
  return data
}

// Get all departments
export const getDepartments = async () => {
  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .eq('is_active', true)
    .order('name')
  
  if (error) throw error
  return data
}

// Get users by role
export const getUsersByRole = async (role: UserRole) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select(`
      *,
      departments:department_id (
        id,
        name,
        code
      )
    `)
    .eq('role', role)
    .eq('is_active', true)
    .order('first_name')
  
  if (error) throw error
  return data
}

// Get all users (admin only)
export const getAllUsers = async () => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select(`
      *,
      departments:department_id (
        id,
        name,
        code
      )
    `)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

// Deactivate user
export const deactivateUser = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .update({ is_active: false })
    .eq('id', userId)
    .select()
    .single()
  
  if (error) throw error
  return data
}

// Activate user
export const activateUser = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .update({ is_active: true })
    .eq('id', userId)
    .select()
    .single()
  
  if (error) throw error
  return data
}

// Auth state change listener
export const onAuthStateChange = (callback: (user: AuthUser | null) => void) => {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      const user = await getCurrentUserWithProfile()
      callback(user)
    } else {
      callback(null)
    }
  })
}