// Role-Based Access Control (RBAC) System
// Defines what features and data each role can access

export type Permission = 
  // Core Medical Features
  | 'medical_diagnosis'
  | 'patient_records_full'
  | 'patient_records_view'
  | 'medical_history'
  | 'drug_interaction'
  | 'voice_documentation'
  | 'medical_imaging'
  
  // Triage & Emergency Features  
  | 'triage_system'
  | 'emergency_protocols'
  | 'vital_signs'
  | 'patient_registration'
  | 'critical_alerts'
  | 'predictive_assessment'
  | 'emergency_coordination'
  | 'crisis_communication'
  
  // Administrative Features
  | 'hospital_operations'
  | 'resource_allocation'
  | 'staff_management'
  | 'system_configuration'
  | 'performance_analytics'
  | 'ai_quota_management'
  | 'appointment_management'
  | 'financial_reports'
  | 'system_logs'
  
  // Ward Management Features (New)
  | 'admission_management'
  | 'bed_management'
  | 'ward_coordination'
  
  // Analytics & Research Features
  | 'patient_demographics'
  | 'diagnosis_patterns'
  | 'medical_trends'
  | 'research_insights'
  | 'statistical_reports'
  | 'data_export'
  | 'advanced_analytics'
  
  // Radiology Features
  | 'report_generation'
  | 'voice_transcription'
  | 'imaging_analysis'
  | 'report_templates'
  | 'radiology_workflow'
  
  // Data Access Levels
  | 'view_all_patients'
  | 'edit_all_patients'
  | 'view_own_patients'
  | 'edit_own_patients'
  | 'view_department_patients'
  | 'edit_department_patients'

export type Role = 'doctor' | 'nurse' | 'admin' | 'researcher' | 'emergency' | 'radiologist' | 'ward_admin'

// Define what each role can access
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  // Doctor: ONLY medical care, diagnosis, and their own patients
  doctor: [
    'medical_diagnosis',
    'patient_records_full',
    'medical_history', 
    'drug_interaction',
    'voice_documentation',
    'medical_imaging',
    'view_own_patients',
    'edit_own_patients',
  ],

  // Nurse: ONLY triage, emergency care, vital signs - NO patient records access
  nurse: [
    'triage_system',
    'emergency_protocols',
    'vital_signs',
    'patient_registration', // Can register new patients
    'critical_alerts',
    'predictive_assessment',
    'voice_documentation',
  ],

  // Admin: ONLY hospital operations, NO patient data access, NO AI quota
  admin: [
    'hospital_operations',
    'resource_allocation', 
    'staff_management',
    'system_configuration',
    'performance_analytics', // Only operational analytics
    'appointment_management',
    'financial_reports',
    'system_logs',
  ],

  // Researcher: ONLY analytics and research - NO patient management access
  researcher: [
    'patient_demographics',
    'diagnosis_patterns', 
    'medical_trends',
    'research_insights',
    'statistical_reports',
    'data_export',
    'advanced_analytics',
    // NO patient management access at all
  ],

  // Emergency: ONLY emergency coordination - NO patient management
  emergency: [
    'triage_system',
    'emergency_protocols',
    'emergency_coordination',
    'critical_alerts',
    'crisis_communication',
    'vital_signs',
    'staff_management', // Can assign staff during emergencies
  ],

  // Radiologist: ONLY imaging and reports - NO patient management
  radiologist: [
    'report_generation',
    'voice_transcription',
    'imaging_analysis', 
    'report_templates',
    'radiology_workflow',
    'medical_imaging',
    'voice_documentation',
  ],

  // Ward Admin: ONLY ward management and admissions - NO patient clinical data
  ward_admin: [
    'hospital_operations',
    'resource_allocation',
    'admission_management',
    'bed_management',
    'ward_coordination',
    'view_department_patients', // Can see patient names for bed assignment
    'staff_management', // Limited to ward staff
  ],
}

// Feature visibility configuration
export const FEATURE_CONFIG = {
  // Components that should be shown/hidden based on permissions
  components: {
    'medical-diagnosis': ['medical_diagnosis'],
    'patient-management': ['patient_records_full', 'patient_records_view'],
    'ai-triage': ['triage_system'], 
    'emergency-protocols': ['emergency_protocols', 'emergency_coordination'],
    'analytics-dashboard': ['performance_analytics', 'advanced_analytics'],
    'ai-quota-monitor': ['ai_quota_management'],
    'appointment-management': ['appointment_management'],
    'voice-to-report': ['report_generation', 'voice_transcription'],
  },

  // Dashboard tabs that should be available to each role
  tabs: {
    doctor: ['diagnosis', 'patients', 'medical-history', 'voice-docs'], // ONLY medical features
    nurse: ['triage', 'emergency', 'vitals', 'registration'], // NO patient management
    admin: ['operations', 'appointments', 'analytics', 'staff'], // NO patient database, NO AI quota
    researcher: ['analytics', 'demographics', 'patterns', 'reports'], // ONLY research features
    emergency: ['emergency', 'triage', 'coordination', 'alerts'], // NO patient management
    radiologist: ['reports', 'imaging', 'voice-to-text', 'templates'], // ONLY radiology features
    ward_admin: ['admissions', 'beds', 'wards', 'capacity'], // ONLY ward management
  }
}

// Check if a role has a specific permission
export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission)
}

// Check if a role can access a component
export function canAccessComponent(role: Role, componentId: string): boolean {
  const requiredPermissions = FEATURE_CONFIG.components[componentId as keyof typeof FEATURE_CONFIG.components]
  if (!requiredPermissions) return false
  
  return requiredPermissions.some(permission => hasPermission(role, permission as Permission))
}

// Get available tabs for a role
export function getAvailableTabs(role: Role): string[] {
  return FEATURE_CONFIG.tabs[role] || []
}

// Check patient data access level
export function getPatientAccessLevel(role: Role): 'none' | 'view' | 'edit' | 'full' {
  if (hasPermission(role, 'patient_records_full')) return 'full'
  if (hasPermission(role, 'edit_all_patients') || hasPermission(role, 'edit_own_patients')) return 'edit'
  if (hasPermission(role, 'patient_records_view') || hasPermission(role, 'view_all_patients')) return 'view'
  return 'none'
}

// Get data scope for a role (what data they can see)
export function getDataScope(role: Role): 'all' | 'department' | 'own' | 'none' {
  if (hasPermission(role, 'view_all_patients')) return 'all'
  if (hasPermission(role, 'view_department_patients')) return 'department'  
  if (hasPermission(role, 'view_own_patients')) return 'own'
  return 'none'
}

// Role hierarchy for escalation (who can override whom)
export const ROLE_HIERARCHY: Record<Role, number> = {
  admin: 5,        // Highest authority
  emergency: 4,    // Can override in crisis situations  
  doctor: 3,       // Medical authority
  nurse: 2,        // Clinical support
  ward_admin: 2,   // Ward management authority
  radiologist: 2,  // Specialized but limited scope
  researcher: 1,   // Lowest access (view only)
}

// Emergency override permissions (what roles can be granted emergency access)
export const EMERGENCY_OVERRIDE_PERMISSIONS: Permission[] = [
  'view_all_patients',
  'critical_alerts', 
  'emergency_protocols',
  'vital_signs',
  'patient_records_view'
]
