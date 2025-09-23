-- Create patients table if it doesn't exist
CREATE TABLE IF NOT EXISTS patients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    cnic VARCHAR(15) UNIQUE NOT NULL,
    age INTEGER,
    gender VARCHAR(10),
    date_of_birth DATE,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relation VARCHAR(50),
    blood_group VARCHAR(5),
    allergies TEXT,
    medical_history TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tokens table for queue management
CREATE TABLE IF NOT EXISTS tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    token_number INTEGER NOT NULL,
    visit_type VARCHAR(20) DEFAULT 'OPD',
    chief_complaint TEXT NOT NULL,
    symptoms TEXT,
    status VARCHAR(20) DEFAULT 'waiting',
    priority VARCHAR(10) DEFAULT 'normal',
    estimated_time INTEGER DEFAULT 15,
    called_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create visits table for medical records
CREATE TABLE IF NOT EXISTS visits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    token_id UUID REFERENCES tokens(id) ON DELETE SET NULL,
    visit_type VARCHAR(20) DEFAULT 'OPD',
    chief_complaint TEXT,
    symptoms TEXT,
    diagnosis TEXT,
    treatment_plan TEXT,
    prescription TEXT,
    follow_up_date DATE,
    payment_method VARCHAR(20) DEFAULT 'Cash',
    insurance_provider VARCHAR(100),
    insurance_number VARCHAR(50),
    total_amount DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'scheduled',
    visit_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create appointments table for scheduled visits
CREATE TABLE IF NOT EXISTS appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES users(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration INTEGER DEFAULT 30,
    appointment_type VARCHAR(20) DEFAULT 'consultation',
    notes TEXT,
    status VARCHAR(20) DEFAULT 'scheduled',
    reminder_sent BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patients_cnic ON patients(cnic);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(first_name, last_name);

CREATE INDEX IF NOT EXISTS idx_tokens_department_date ON tokens(department_id, created_at);
CREATE INDEX IF NOT EXISTS idx_tokens_status ON tokens(status);
CREATE INDEX IF NOT EXISTS idx_tokens_doctor ON tokens(doctor_id);

CREATE INDEX IF NOT EXISTS idx_visits_patient ON visits(patient_id);
CREATE INDEX IF NOT EXISTS idx_visits_doctor ON visits(doctor_id);
CREATE INDEX IF NOT EXISTS idx_visits_date ON visits(visit_date);

CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);

-- Add RLS policies for security
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Policies for patients table
CREATE POLICY "Enable read access for all users" ON patients FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON patients FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON patients FOR UPDATE USING (true);

-- Policies for tokens table
CREATE POLICY "Enable read access for all users" ON tokens FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON tokens FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON tokens FOR UPDATE USING (true);

-- Policies for visits table
CREATE POLICY "Enable read access for all users" ON visits FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON visits FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON visits FOR UPDATE USING (true);

-- Policies for appointments table
CREATE POLICY "Enable read access for all users" ON appointments FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON appointments FOR UPDATE USING (true);