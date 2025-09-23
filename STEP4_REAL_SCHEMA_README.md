# STEP 4 DOCTOR WORKFLOW - REAL SCHEMA IMPLEMENTATION

## ✅ **COMPLETED UPDATES**

### 1. **Database Schema Documentation**

- **File**: `database-schema.sql`
- **Purpose**: Complete authoritative database schema documentation
- **Usage**: Reference for all future development to avoid creating duplicate tables

### 2. **Updated APIs for Real Schema**

#### **Consultations API** (`/api/consultations/route.ts`)

- ✅ Uses existing `visits` table instead of non-existent `consultations` table
- ✅ Saves consultation data to `visits.chief_complaint`, `visits.examination_notes`, etc.
- ✅ Saves vital signs to existing `patient_vitals` table
- ✅ Saves prescriptions to existing `medication_orders` table
- ✅ Creates medication records in `medications` table if needed

#### **Visit Status API** (`/api/visits/status/route.ts`)

- ✅ Updates `visits.visit_status` using real schema constraints
- ✅ Updates corresponding `tokens.token_status` automatically
- ✅ Sets consultation timestamps in visits table
- ✅ Better error handling and validation

### 3. **Updated Consultation Interface**

- ✅ Fixed error handling in save and complete functions
- ✅ Proper integration with updated APIs
- ✅ Works with real database schema

## 🚀 **HOW TO TEST THE SYSTEM**

### **Prerequisites**

1. Ensure your Supabase database has the schema from `database-schema.sql`
2. Have some test data:
   - Departments (e.g., Cardiology, Orthopedics)
   - Doctors with department assignments
   - Patients with visits assigned to doctors
   - Tokens generated for queue management

### **Testing Workflow**

#### **Step 1: Doctor Login**

```bash
# Navigate to doctor dashboard
http://localhost:3000/doctor

# Login with doctor credentials
# Should see "My OPD Queue" tab with real-time queue
```

#### **Step 2: Queue Management**

```bash
# Verify queue displays:
- Total patients assigned to doctor
- Waiting patients with token numbers
- Current patient (if any in consultation)

# Test "Call Next Patient" button:
- Should move first waiting patient to "in_consultation"
- Should update both visits and tokens tables
- Should show patient in "Current Patient" section
```

#### **Step 3: Consultation Interface**

```bash
# Click "Open Consultation" on current patient
# Should open modal with patient information
# Fill out consultation form:

# History & Examination tab:
- Chief complaint (pre-filled from visit)
- History of present illness
- Past medical history
- Physical examination

# Vital Signs tab:
- Blood pressure, temperature, heart rate, etc.
- Data saves to patient_vitals table

# Diagnosis & Plan tab:
- Clinical diagnosis
- Treatment plan

# Prescription tab:
- Add medications
- Data saves to medication_orders table
- Creates medications if they don't exist

# Notes & Follow-up tab:
- Follow-up instructions
- Additional notes
```

#### **Step 4: Save and Complete**

```bash
# Test "Save Draft" button:
- Should save to visits table
- Should NOT change visit status
- Data should persist when reopening

# Test "Complete Consultation" button:
- Should save all consultation data
- Should update visit_status to "completed"
- Should update token_status to "completed"
- Should close modal and return to queue
- Should show patient in "Completed" tab
```

#### **Step 5: Real-time Updates**

```bash
# Open multiple browser tabs:
- Doctor dashboard
- Receptionist dashboard (/receptionist)
- Administrator dashboard (/administrator)

# Complete consultation in doctor dashboard
# Verify updates in other dashboards within 30 seconds
```

## 🛠 **API ENDPOINTS REFERENCE**

### **1. Consultations API**

```typescript
// Save consultation
POST /api/consultations
{
  "visitId": "uuid",
  "doctorId": "uuid",
  "consultationData": {
    "chiefComplaint": "string",
    "historyOfPresentIllness": "string",
    "physicalExamination": "string",
    "vitalSigns": {
      "bloodPressure": "120/80",
      "temperature": "98.6",
      "heartRate": "72"
    },
    "diagnosis": "string",
    "treatmentPlan": "string",
    "prescriptions": [
      {
        "medication": "Paracetamol",
        "dosage": "500mg",
        "frequency": "twice_daily",
        "duration": "7 days",
        "instructions": "Take with food"
      }
    ],
    "followUpInstructions": "string"
  }
}

// Get consultations
GET /api/consultations?visit_id=uuid
GET /api/consultations?doctor_id=uuid
```

### **2. Visit Status API**

```typescript
// Update visit status
PUT /api/visits/status
{
  "visitId": "uuid",
  "status": "waiting|in_consultation|completed|cancelled|no_show"
}

// Get visits
GET /api/visits/status?doctor_id=uuid
GET /api/visits/status?visit_id=uuid
GET /api/visits/status?status=waiting
```

## 🗃️ **Database Tables Used**

### **Primary Tables**

- `visits` - Main consultation data (chief_complaint, diagnosis, treatment_plan)
- `patient_vitals` - Vital signs measurements
- `medication_orders` - Prescriptions
- `medications` - Medication master data
- `tokens` - Queue management
- `patients` - Patient information
- `departments` - Department data
- `user_profiles` - Doctor/staff information

### **Key Relationships**

```sql
visits.patient_id → patients.id
visits.assigned_doctor_id → user_profiles.id
visits.department_id → departments.id
tokens.visit_id → visits.id
patient_vitals.visit_id → visits.id
medication_orders.visit_id → visits.id
medication_orders.medication_id → medications.id
```

## 🐛 **Troubleshooting**

### **Common Issues**

#### **1. TypeScript Errors in APIs**

- **Issue**: Supabase typing conflicts
- **Solution**: Using `as any` for update operations until proper types are configured

#### **2. Queue Not Updating**

- **Issue**: Data not refreshing in real-time
- **Solution**: Check auto-refresh intervals (30 seconds), verify API responses

#### **3. Consultation Not Saving**

- **Issue**: API errors when saving consultation
- **Solution**: Check Supabase RLS policies, verify table permissions

#### **4. Token Status Not Updating**

- **Issue**: Token status not syncing with visit status
- **Solution**: Verify both APIs are called, check token table constraints

### **Database Debugging Queries**

```sql
-- Check recent visits
SELECT v.*, p.first_name, p.last_name, t.token_number
FROM visits v
JOIN patients p ON v.patient_id = p.id
LEFT JOIN tokens t ON v.id = t.visit_id
WHERE v.visit_date = CURRENT_DATE
ORDER BY v.checkin_time DESC;

-- Check consultation data
SELECT visit_number, visit_status, chief_complaint, diagnosis
FROM visits
WHERE visit_date = CURRENT_DATE
AND diagnosis IS NOT NULL;

-- Check prescriptions
SELECT mo.*, m.name as medication_name
FROM medication_orders mo
JOIN medications m ON mo.medication_id = m.id
WHERE mo.start_date = CURRENT_DATE;

-- Check vital signs
SELECT pv.*, p.first_name, p.last_name
FROM patient_vitals pv
JOIN patients p ON pv.patient_id = p.id
WHERE DATE(pv.recorded_at) = CURRENT_DATE;
```

## 🎯 **Success Criteria**

- ✅ Doctor queue displays real-time patient list
- ✅ "Call Next Patient" updates visit and token status
- ✅ Consultation interface opens with patient data
- ✅ All consultation sections save to correct database tables
- ✅ Vital signs save to patient_vitals table
- ✅ Prescriptions save to medication_orders table
- ✅ "Complete Consultation" updates status to completed
- ✅ Real-time updates appear across all dashboards
- ✅ Database maintains complete audit trail

## 📁 **Files Modified**

1. **`database-schema.sql`** - Complete schema documentation
2. **`/api/consultations/route.ts`** - Uses real schema (visits, patient_vitals, medication_orders)
3. **`/api/visits/status/route.ts`** - Proper status updates with real constraints
4. **`components/patient-consultation-interface.tsx`** - Better error handling
5. **`STEP4_TESTING_GUIDE.md`** - Original testing guide (still valid)

The system now uses the authoritative database schema and should work reliably with real data!
