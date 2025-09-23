-- CLINIX AI HOSPITAL - COMPLETE DATABASE SCHEMA
-- This is the authoritative database schema for the hospital management system
-- All APIs and features should reference this schema, not create new tables
-- Generated: September 18, 2025

-- ==============================================
-- CORE PATIENT MANAGEMENT TABLES
-- ==============================================

-- Patients table - Core patient information
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_number VARCHAR NOT NULL UNIQUE,
  first_name VARCHAR NOT NULL,
  last_name VARCHAR NOT NULL,
  father_name VARCHAR,
  date_of_birth DATE,
  age INTEGER,
  gender VARCHAR NOT NULL,
  cnic VARCHAR,
  phone VARCHAR,
  emergency_contact VARCHAR,
  address TEXT,
  city VARCHAR,
  blood_group VARCHAR,
  marital_status VARCHAR,
  occupation VARCHAR,
  insurance_provider VARCHAR,
  insurance_number VARCHAR,
  allergies TEXT,
  medical_history TEXT,
  email TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Departments table - Hospital departments
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR NOT NULL,
  code VARCHAR NOT NULL UNIQUE,
  description TEXT,
  head_user_id UUID,
  location VARCHAR,
  phone VARCHAR,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles table - Staff members (doctors, nurses, etc.)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY,
  employee_id VARCHAR,
  first_name VARCHAR NOT NULL,
  last_name VARCHAR NOT NULL,
  email VARCHAR NOT NULL UNIQUE,
  phone VARCHAR,
  cnic VARCHAR,
  role VARCHAR NOT NULL, -- 'doctor', 'nurse', 'receptionist', 'administrator', etc.
  department_id UUID REFERENCES departments(id),
  specialization VARCHAR,
  license_number VARCHAR,
  hire_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  shift_start TIME,
  shift_end TIME,
  emergency_contact VARCHAR,
  address TEXT,
  date_of_birth DATE,
  gender VARCHAR,
  profile_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- VISIT & CONSULTATION MANAGEMENT
-- ==============================================

-- Visits table - Patient visits (OPD/IPD) - MAIN CONSULTATION TABLE
CREATE TABLE visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visit_number VARCHAR NOT NULL UNIQUE,
  patient_id UUID NOT NULL REFERENCES patients(id),
  department_id UUID NOT NULL REFERENCES departments(id),
  assigned_doctor_id UUID REFERENCES user_profiles(id),
  visit_type VARCHAR DEFAULT 'opd', -- 'opd', 'ipd', 'emergency'
  chief_complaint TEXT, -- Main reason for visit
  symptoms TEXT, -- Patient symptoms
  examination_notes TEXT, -- Physical examination findings
  diagnosis TEXT, -- Clinical diagnosis
  treatment_plan TEXT, -- Treatment plan
  follow_up_instructions TEXT, -- Follow-up instructions
  visit_status VARCHAR DEFAULT 'waiting', -- 'waiting', 'in_consultation', 'completed', 'cancelled', 'no_show'
  priority VARCHAR DEFAULT 'normal', -- 'normal', 'urgent', 'emergency'
  visit_date DATE DEFAULT CURRENT_DATE,
  appointment_time TIME,
  checkin_time TIMESTAMP WITH TIME ZONE,
  consultation_start_time TIMESTAMP WITH TIME ZONE,
  consultation_end_time TIMESTAMP WITH TIME ZONE,
  requires_admission BOOLEAN DEFAULT FALSE,
  consultation_fee NUMERIC,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tokens table - Queue management system
CREATE TABLE tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_number INTEGER NOT NULL,
  visit_id UUID NOT NULL REFERENCES visits(id),
  department_id UUID NOT NULL REFERENCES departments(id),
  assigned_doctor_id UUID REFERENCES user_profiles(id),
  patient_id UUID NOT NULL REFERENCES patients(id),
  token_status VARCHAR DEFAULT 'waiting', -- 'waiting', 'called', 'in_consultation', 'completed'
  status TEXT, -- Additional status field
  issue_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  issue_date DATE DEFAULT CURRENT_DATE,
  called_time TIMESTAMP WITH TIME ZONE,
  consultation_start_time TIMESTAMP WITH TIME ZONE,
  estimated_wait_time INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Patient vitals table - Vital signs recording
CREATE TABLE patient_vitals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  visit_id UUID REFERENCES visits(id),
  admission_id UUID, -- References admissions(id) when available
  recorded_by UUID NOT NULL REFERENCES user_profiles(id),
  systolic_bp INTEGER,
  diastolic_bp INTEGER,
  heart_rate INTEGER,
  temperature NUMERIC, -- In Fahrenheit or Celsius
  respiratory_rate INTEGER,
  oxygen_saturation INTEGER,
  weight NUMERIC,
  height NUMERIC,
  bmi NUMERIC,
  blood_glucose INTEGER,
  pain_scale INTEGER, -- 1-10 scale
  notes TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- MEDICATION MANAGEMENT
-- ==============================================

-- Medications table - Master medication database
CREATE TABLE medications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR NOT NULL,
  generic_name VARCHAR,
  brand_name VARCHAR,
  dosage_form VARCHAR, -- 'tablet', 'capsule', 'syrup', 'injection', etc.
  strength VARCHAR,
  unit VARCHAR,
  manufacturer VARCHAR,
  drug_class VARCHAR,
  therapeutic_class VARCHAR,
  contraindications TEXT,
  side_effects TEXT,
  interactions TEXT,
  storage_requirements TEXT,
  price_per_unit NUMERIC,
  stock_quantity INTEGER DEFAULT 0,
  minimum_stock_level INTEGER DEFAULT 10,
  expiry_date DATE,
  is_controlled_substance BOOLEAN DEFAULT FALSE,
  requires_prescription BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Medication orders table - Prescription orders (PRESCRIPTIONS)
CREATE TABLE medication_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR NOT NULL UNIQUE,
  patient_id UUID NOT NULL REFERENCES patients(id),
  visit_id UUID REFERENCES visits(id),
  admission_id UUID, -- References admissions(id) when available
  medication_id UUID NOT NULL REFERENCES medications(id),
  prescribed_by UUID NOT NULL REFERENCES user_profiles(id),
  dosage VARCHAR NOT NULL,
  frequency VARCHAR NOT NULL, -- 'once_daily', 'twice_daily', 'thrice_daily', etc.
  route VARCHAR, -- 'oral', 'iv', 'im', 'topical', etc.
  duration_days INTEGER,
  quantity_prescribed INTEGER,
  instructions TEXT,
  indication TEXT,
  order_status VARCHAR DEFAULT 'pending', -- 'pending', 'active', 'completed', 'cancelled'
  is_stat BOOLEAN DEFAULT FALSE, -- Immediate/urgent order
  is_prn BOOLEAN DEFAULT FALSE, -- As needed
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  verified_by UUID REFERENCES user_profiles(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  dispensed_by UUID REFERENCES user_profiles(id),
  dispensed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Medication administration table - Track actual medication given
CREATE TABLE medication_administration (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  medication_order_id UUID NOT NULL REFERENCES medication_orders(id),
  patient_id UUID NOT NULL REFERENCES patients(id),
  administered_by UUID NOT NULL REFERENCES user_profiles(id),
  administered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  dosage_given VARCHAR,
  route_used VARCHAR,
  administration_status VARCHAR DEFAULT 'given', -- 'given', 'refused', 'held', 'missed'
  patient_response TEXT,
  side_effects_observed TEXT,
  notes TEXT,
  witnessed_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- LABORATORY MANAGEMENT
-- ==============================================

-- Lab tests table - Master lab test catalog
CREATE TABLE lab_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_code VARCHAR NOT NULL UNIQUE,
  test_name VARCHAR NOT NULL,
  test_category VARCHAR,
  specimen_type VARCHAR,
  specimen_volume VARCHAR,
  container_type VARCHAR,
  test_method VARCHAR,
  reference_range_male TEXT,
  reference_range_female TEXT,
  reference_range_pediatric TEXT,
  critical_values TEXT,
  turnaround_time INTEGER, -- In hours
  cost NUMERIC,
  department VARCHAR,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lab orders table - Lab test orders
CREATE TABLE lab_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR NOT NULL UNIQUE,
  patient_id UUID NOT NULL REFERENCES patients(id),
  visit_id UUID REFERENCES visits(id),
  admission_id UUID, -- References admissions(id) when available
  ordered_by UUID NOT NULL REFERENCES user_profiles(id),
  order_status VARCHAR DEFAULT 'pending', -- 'pending', 'collected', 'processing', 'completed', 'cancelled'
  priority VARCHAR DEFAULT 'routine', -- 'routine', 'urgent', 'stat'
  clinical_info TEXT,
  fasting_required BOOLEAN DEFAULT FALSE,
  specimen_collected_at TIMESTAMP WITH TIME ZONE,
  collected_by UUID REFERENCES user_profiles(id),
  processed_by UUID REFERENCES user_profiles(id),
  verified_by UUID REFERENCES user_profiles(id),
  reported_at TIMESTAMP WITH TIME ZONE,
  total_cost NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lab order tests table - Individual tests within an order
CREATE TABLE lab_order_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lab_order_id UUID NOT NULL REFERENCES lab_orders(id),
  lab_test_id UUID NOT NULL REFERENCES lab_tests(id),
  test_status VARCHAR DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'cancelled'
  result_value TEXT,
  result_unit VARCHAR,
  reference_range TEXT,
  abnormal_flag VARCHAR, -- 'normal', 'high', 'low', 'critical'
  critical_flag BOOLEAN DEFAULT FALSE,
  result_comment TEXT,
  performed_by UUID REFERENCES user_profiles(id),
  verified_by UUID REFERENCES user_profiles(id),
  result_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- RADIOLOGY MANAGEMENT
-- ==============================================

-- Radiology orders table - Imaging orders
CREATE TABLE radiology_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR NOT NULL UNIQUE,
  patient_id UUID NOT NULL REFERENCES patients(id),
  visit_id UUID REFERENCES visits(id),
  admission_id UUID, -- References admissions(id) when available
  ordered_by UUID NOT NULL REFERENCES user_profiles(id),
  study_type VARCHAR NOT NULL, -- 'X-Ray', 'CT', 'MRI', 'Ultrasound', etc.
  body_part VARCHAR,
  study_description TEXT,
  clinical_indication TEXT,
  contrast_required BOOLEAN DEFAULT FALSE,
  pregnancy_status VARCHAR, -- 'negative', 'positive', 'unknown'
  order_status VARCHAR DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'cancelled'
  priority VARCHAR DEFAULT 'routine', -- 'routine', 'urgent', 'stat'
  scheduled_datetime TIMESTAMP WITH TIME ZONE,
  performed_datetime TIMESTAMP WITH TIME ZONE,
  performed_by UUID REFERENCES user_profiles(id),
  radiologist_id UUID REFERENCES user_profiles(id),
  cost NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Radiology reports table - Imaging reports
CREATE TABLE radiology_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  radiology_order_id UUID NOT NULL REFERENCES radiology_orders(id),
  patient_id UUID NOT NULL REFERENCES patients(id),
  study_date DATE NOT NULL,
  technique TEXT,
  findings TEXT NOT NULL,
  impression TEXT NOT NULL,
  recommendations TEXT,
  report_status VARCHAR DEFAULT 'draft', -- 'draft', 'preliminary', 'final'
  dictated_by UUID REFERENCES user_profiles(id),
  transcribed_by UUID REFERENCES user_profiles(id),
  verified_by UUID REFERENCES user_profiles(id),
  dictated_at TIMESTAMP WITH TIME ZONE,
  transcribed_at TIMESTAMP WITH TIME ZONE,
  verified_at TIMESTAMP WITH TIME ZONE,
  image_count INTEGER DEFAULT 0,
  critical_findings BOOLEAN DEFAULT FALSE,
  addendum TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- ADMISSION & WARD MANAGEMENT
-- ==============================================

-- Wards table - Hospital wards
CREATE TABLE wards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR NOT NULL,
  code VARCHAR NOT NULL UNIQUE,
  department_id UUID REFERENCES departments(id),
  ward_type VARCHAR, -- 'general', 'icu', 'emergency', 'surgery', etc.
  total_beds INTEGER DEFAULT 0,
  available_beds INTEGER DEFAULT 0,
  floor_number INTEGER,
  wing VARCHAR,
  head_nurse_id UUID REFERENCES user_profiles(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Beds table - Individual beds
CREATE TABLE beds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bed_number VARCHAR NOT NULL,
  ward_id UUID REFERENCES wards(id),
  bed_type VARCHAR, -- 'standard', 'icu', 'isolation', etc.
  status VARCHAR DEFAULT 'available', -- 'available', 'occupied', 'maintenance', 'reserved'
  current_patient_id UUID REFERENCES patients(id),
  room_number VARCHAR,
  has_oxygen BOOLEAN DEFAULT FALSE,
  has_suction BOOLEAN DEFAULT FALSE,
  has_monitor BOOLEAN DEFAULT FALSE,
  daily_rate NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admissions table - Patient admissions
CREATE TABLE admissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admission_number VARCHAR NOT NULL UNIQUE,
  patient_id UUID NOT NULL REFERENCES patients(id),
  visit_id UUID REFERENCES visits(id),
  ward_id UUID NOT NULL REFERENCES wards(id),
  bed_id UUID REFERENCES beds(id),
  attending_doctor_id UUID NOT NULL REFERENCES user_profiles(id),
  assigned_nurse_id UUID REFERENCES user_profiles(id),
  admission_type VARCHAR, -- 'emergency', 'elective', 'transfer'
  admission_reason TEXT NOT NULL,
  diagnosis TEXT,
  treatment_plan TEXT,
  admission_status VARCHAR DEFAULT 'active', -- 'active', 'discharged', 'transferred'
  admission_date DATE DEFAULT CURRENT_DATE,
  admission_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expected_discharge_date DATE,
  actual_discharge_date DATE,
  discharge_summary TEXT,
  discharge_instructions TEXT,
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_date DATE,
  total_bill_amount NUMERIC,
  requested_by UUID REFERENCES user_profiles(id),
  approved_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- TASK & NOTIFICATION MANAGEMENT
-- ==============================================

-- Tasks table - Task management system
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_number VARCHAR NOT NULL UNIQUE,
  title VARCHAR NOT NULL,
  description TEXT,
  task_type VARCHAR NOT NULL, -- 'medication', 'procedure', 'follow_up', etc.
  priority VARCHAR DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  status VARCHAR DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'
  assigned_to UUID NOT NULL REFERENCES user_profiles(id),
  assigned_by UUID NOT NULL REFERENCES user_profiles(id),
  patient_id UUID REFERENCES patients(id),
  visit_id UUID REFERENCES visits(id),
  admission_id UUID REFERENCES admissions(id),
  department_id UUID REFERENCES departments(id),
  related_entity_type VARCHAR,
  related_entity_id UUID,
  due_datetime TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  estimated_duration INTEGER, -- In minutes
  completion_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table - System notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id UUID NOT NULL REFERENCES user_profiles(id),
  sender_id UUID REFERENCES user_profiles(id),
  title VARCHAR NOT NULL,
  message TEXT NOT NULL,
  notification_type VARCHAR NOT NULL, -- 'task', 'alert', 'reminder', 'system'
  priority VARCHAR DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  status VARCHAR DEFAULT 'unread', -- 'unread', 'read', 'archived'
  patient_id UUID REFERENCES patients(id),
  related_entity_type VARCHAR,
  related_entity_id UUID,
  action_url TEXT,
  read_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- AUDIT & LOGGING
-- ==============================================

-- Audit logs table - System audit trail
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id),
  action VARCHAR NOT NULL, -- 'create', 'update', 'delete', 'login', 'logout'
  entity_type VARCHAR NOT NULL, -- 'patient', 'visit', 'medication_order', etc.
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  session_id VARCHAR,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- INDEXES FOR PERFORMANCE
-- ==============================================

-- Critical indexes for query performance
CREATE INDEX idx_visits_patient_id ON visits(patient_id);
CREATE INDEX idx_visits_doctor_id ON visits(assigned_doctor_id);
CREATE INDEX idx_visits_department_id ON visits(department_id);
CREATE INDEX idx_visits_status ON visits(visit_status);
CREATE INDEX idx_visits_date ON visits(visit_date);

CREATE INDEX idx_tokens_visit_id ON tokens(visit_id);
CREATE INDEX idx_tokens_doctor_id ON tokens(assigned_doctor_id);
CREATE INDEX idx_tokens_status ON tokens(token_status);
CREATE INDEX idx_tokens_date ON tokens(issue_date);

CREATE INDEX idx_medication_orders_patient_id ON medication_orders(patient_id);
CREATE INDEX idx_medication_orders_visit_id ON medication_orders(visit_id);
CREATE INDEX idx_medication_orders_prescribed_by ON medication_orders(prescribed_by);

CREATE INDEX idx_patient_vitals_patient_id ON patient_vitals(patient_id);
CREATE INDEX idx_patient_vitals_visit_id ON patient_vitals(visit_id);

-- ==============================================
-- CONSTRAINTS & VALIDATIONS
-- ==============================================

-- Visit status constraint
ALTER TABLE visits ADD CONSTRAINT visits_visit_status_check 
CHECK (visit_status IN ('waiting', 'in_consultation', 'completed', 'cancelled', 'no_show'));

-- Token status constraint  
ALTER TABLE tokens ADD CONSTRAINT tokens_token_status_check
CHECK (token_status IN ('waiting', 'called', 'in_consultation', 'completed', 'cancelled'));

-- Priority constraint
ALTER TABLE visits ADD CONSTRAINT visits_priority_check
CHECK (priority IN ('normal', 'urgent', 'emergency'));

-- User role constraint
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_role_check
CHECK (role IN ('doctor', 'nurse', 'receptionist', 'administrator', 'pharmacist', 'lab_technician', 'radiologist'));

-- ==============================================
-- COMMENTS FOR REFERENCE
-- ==============================================

COMMENT ON TABLE visits IS 'Main consultation table - stores all patient visit data including consultation notes';
COMMENT ON TABLE medication_orders IS 'Prescription table - stores all medication prescriptions';
COMMENT ON TABLE patient_vitals IS 'Vital signs table - stores all patient vital sign measurements';
COMMENT ON TABLE tokens IS 'Queue management table - handles patient tokens and queue positions';

-- ==============================================
-- END OF SCHEMA
-- ==============================================