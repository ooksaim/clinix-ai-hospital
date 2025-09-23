// Database types generated from Supabase
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      departments: {
        Row: {
          id: string
          name: string
          code: string
          description: string | null
          head_user_id: string | null
          location: string | null
          phone: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          description?: string | null
          head_user_id?: string | null
          location?: string | null
          phone?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          description?: string | null
          head_user_id?: string | null
          location?: string | null
          phone?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          employee_id: string | null
          first_name: string
          last_name: string
          email: string
          phone: string | null
          cnic: string | null
          role: string
          department_id: string | null
          specialization: string | null
          license_number: string | null
          hire_date: string | null
          is_active: boolean
          shift_start: string | null
          shift_end: string | null
          emergency_contact: string | null
          address: string | null
          date_of_birth: string | null
          gender: string | null
          profile_image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          employee_id?: string | null
          first_name: string
          last_name: string
          email: string
          phone?: string | null
          cnic?: string | null
          role: string
          department_id?: string | null
          specialization?: string | null
          license_number?: string | null
          hire_date?: string | null
          is_active?: boolean
          shift_start?: string | null
          shift_end?: string | null
          emergency_contact?: string | null
          address?: string | null
          date_of_birth?: string | null
          gender?: string | null
          profile_image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string | null
          first_name?: string
          last_name?: string
          email?: string
          phone?: string | null
          cnic?: string | null
          role?: string
          department_id?: string | null
          specialization?: string | null
          license_number?: string | null
          hire_date?: string | null
          is_active?: boolean
          shift_start?: string | null
          shift_end?: string | null
          emergency_contact?: string | null
          address?: string | null
          date_of_birth?: string | null
          gender?: string | null
          profile_image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      patients: {
        Row: {
          id: string
          patient_number: string
          first_name: string
          last_name: string
          father_name: string | null
          date_of_birth: string | null
          age: number | null
          gender: string
          cnic: string | null
          phone: string | null
          emergency_contact: string | null
          address: string | null
          city: string | null
          blood_group: string | null
          marital_status: string | null
          occupation: string | null
          insurance_provider: string | null
          insurance_number: string | null
          allergies: string | null
          medical_history: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_number: string
          first_name: string
          last_name: string
          father_name?: string | null
          date_of_birth?: string | null
          age?: number | null
          gender: string
          cnic?: string | null
          phone?: string | null
          emergency_contact?: string | null
          address?: string | null
          city?: string | null
          blood_group?: string | null
          marital_status?: string | null
          occupation?: string | null
          insurance_provider?: string | null
          insurance_number?: string | null
          allergies?: string | null
          medical_history?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          patient_number?: string
          first_name?: string
          last_name?: string
          father_name?: string | null
          date_of_birth?: string | null
          age?: number | null
          gender?: string
          cnic?: string | null
          phone?: string | null
          emergency_contact?: string | null
          address?: string | null
          city?: string | null
          blood_group?: string | null
          marital_status?: string | null
          occupation?: string | null
          insurance_provider?: string | null
          insurance_number?: string | null
          allergies?: string | null
          medical_history?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      visits: {
        Row: {
          id: string
          visit_number: string
          patient_id: string
          department_id: string
          assigned_doctor_id: string | null
          visit_type: string
          chief_complaint: string | null
          symptoms: string | null
          examination_notes: string | null
          diagnosis: string | null
          treatment_plan: string | null
          follow_up_instructions: string | null
          visit_status: string
          priority: string
          visit_date: string
          appointment_time: string | null
          checkin_time: string | null
          consultation_start_time: string | null
          consultation_end_time: string | null
          requires_admission: boolean
          consultation_fee: number | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
      }
      tokens: {
        Row: {
          id: string
          token_number: number
          visit_id: string
          department_id: string
          assigned_doctor_id: string | null
          patient_id: string
          token_status: string
          issue_time: string
          issue_date: string
          called_time: string | null
          consultation_start_time: string | null
          estimated_wait_time: number | null
          created_at: string
          updated_at: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}