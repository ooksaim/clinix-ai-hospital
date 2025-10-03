# 🔍 DEBUGGING REAL ADMISSION REQUESTS

## The Issue

You want to see **real-time admission requests**, not sample data. The API is returning 200 status (working), but the dashboard shows "No pending admission requests".

## 🚨 CRITICAL FIX Applied

I found the bug! The API returns data in this structure:

```json
{
  "success": true,
  "data": {
    "requests": [...],
    "wards": [...]
  }
}
```

But the dashboard was looking for `data.requests` instead of `data.data.requests`.

**✅ Fixed in**: `app/ward-admin/page.tsx` - Now handles both data structures.

## 🧪 Testing Steps

### Step 1: Open Browser Developer Tools

1. Press `F12` or right-click → "Inspect"
2. Go to the **Console** tab
3. Refresh the ward admin page

### Step 2: Look for Debug Messages

You should now see these debug logs:

```
🔍 Raw admission requests data: {...}
📊 Found X admission requests, Y pending
🔍 Raw ward data: {...}
🏥 Ward stats: X wards, Y total beds, Z available
🔍 Raw supply requests data: {...}
📦 Found X supply requests, Y pending
```

### Step 3: Check What's Actually in Your Database

The problem might be:

1. **No real admission requests exist** in your database
2. **All requests have status other than 'pending'**
3. **Data structure mismatch** (which I just fixed)

### Step 4: Add Real Admission Requests

If you see empty arrays in the debug logs, you need to add real admission requests.

**Option A**: Create via Patient Registration

1. Go to `/receptionist`
2. Register a new patient
3. Create admission request

**Option B**: Add directly via Supabase
Go to Supabase → Table Editor → `admissions` table and add:

```sql
INSERT INTO admissions (
  admission_number,
  patient_id,
  ward_id,
  attending_doctor_id,
  admission_reason,
  admission_status,
  requested_by
) VALUES (
  'ADM-REAL-001',
  'your-patient-id',
  'your-ward-id',
  'your-doctor-id',
  'Emergency admission',
  'pending',
  'your-doctor-id'
);
```

## 🎯 Expected Results After Fix

If there are real pending admission requests, you should see:

- **Pending Admissions: [actual number]** (not 0)
- Admission cards with real patient names
- Bed assignment options when clicking "Approve"

## 🚨 Quick Check

Open browser console and run:

```javascript
fetch("/api/admissions/requests")
  .then((r) => r.json())
  .then((d) => console.log("Admission requests:", d));
```

This will show you exactly what data the API is returning.

---

**Next**: After seeing the debug output, we'll know if it's a data issue or display issue!

- Click "Open Consultation" on current patient
- Should open full-screen consultation modal
- Verify patient information display at top

2. **Tab Navigation Testing**

   - **History & Examination**: Chief complaint, present illness, medical history, physical exam
   - **Vital Signs**: Blood pressure, temperature, heart rate, respiratory rate, oxygen saturation, weight, height
   - **Diagnosis & Plan**: Clinical diagnosis, treatment plan
   - **Prescription**: Add/remove medications with dosage, frequency, duration, instructions
   - **Notes & Follow-up**: Follow-up date, instructions, additional notes

3. **Data Entry Testing**
   - Fill out each section with sample data
   - Add multiple prescriptions
   - Test prescription removal
   - Set follow-up date

### Phase 3: Save and Complete Consultation

1. **Save Draft**

   - Click "Save Draft" button
   - Should save consultation without changing visit status
   - Verify data persists when reopening

2. **Complete Consultation**
   - Fill out all required sections
   - Click "Complete Consultation"
   - Should save consultation data
   - Should update visit status to "completed"
   - Should update token status to "completed"
   - Should close consultation modal
   - Should update queue dashboard immediately

### Phase 4: Real-time Updates Verification

1. **Multi-Dashboard Testing**

   - Keep doctor dashboard open
   - Open receptionist dashboard in another tab
   - Open administrator dashboard in third tab
   - Complete consultation in doctor dashboard
   - Verify all dashboards update within 30 seconds

2. **Database Verification**
   - Check `visits` table: visit_status should be "completed"
   - Check `consultations` table: new record with all consultation data
   - Check `prescriptions` table: prescription records linked to consultation
   - Check `tokens` table: status should be "completed"

### Phase 5: Queue Flow Testing

1. **Multiple Patient Flow**

   - Assign 5+ patients to same doctor
   - Call first patient → start consultation → complete
   - Call second patient → start consultation → complete
   - Verify queue positions update correctly
   - Verify completed patients appear in "Completed" tab

2. **Concurrent Doctor Testing**
   - Login as different doctors simultaneously
   - Each should only see their assigned patients
   - Completing consultation should not affect other doctors' queues

## Expected Results

### Doctor Queue Dashboard

- ✅ Real-time patient queue with token numbers
- ✅ Call next patient functionality
- ✅ Current patient display
- ✅ Queue statistics (waiting, in consultation, completed)
- ✅ Auto-refresh every 30 seconds

### Patient Consultation Interface

- ✅ Full consultation form with all medical sections
- ✅ Prescription management (add/remove medications)
- ✅ Save draft functionality
- ✅ Complete consultation workflow
- ✅ Patient information display

### API Endpoints

- ✅ `POST /api/consultations` - Save consultation data
- ✅ `GET /api/consultations?visit_id=X` - Retrieve consultation
- ✅ `PUT /api/visits/status` - Update visit status
- ✅ `GET /api/patients/assigned?doctor_id=X` - Get doctor's patients

### Database Integration

- ✅ Consultations table storing detailed medical records
- ✅ Prescriptions table linked to consultations
- ✅ Visit status updates in real-time
- ✅ Token status synchronization

### Real-time Updates

- ✅ Doctor dashboard updates immediately after consultation
- ✅ Receptionist assignment dashboard reflects status changes
- ✅ Administrator dashboard shows updated statistics
- ✅ All dashboards sync within 30-second refresh cycle

## Troubleshooting

### Common Issues

1. **"Call Next Patient" not working**

   - Check if patients are assigned to doctor
   - Verify visit_status is "waiting"
   - Check API logs for errors

2. **Consultation modal not opening**

   - Verify patient object has required fields
   - Check browser console for errors
   - Ensure consultationPatient state is set

3. **Data not saving**

   - Check Supabase connection
   - Verify table permissions (RLS policies)
   - Check API endpoint responses

4. **Real-time updates not working**
   - Check auto-refresh intervals (30 seconds)
   - Verify API endpoints returning updated data
   - Clear browser cache and refresh

### Database Debugging

```sql
-- Check recent consultations
SELECT * FROM consultations ORDER BY created_at DESC LIMIT 10;

-- Check visit statuses
SELECT visit_number, visit_status, assigned_doctor_id FROM visits
WHERE visit_status IN ('waiting', 'in_consultation', 'completed');

-- Check prescriptions
SELECT p.medication, p.dosage, c.diagnosis
FROM prescriptions p
JOIN consultations c ON p.consultation_id = c.id;
```

## Success Criteria

- ✅ Doctor can view assigned patients in queue
- ✅ Doctor can call next patient and update status
- ✅ Doctor can open consultation interface for current patient
- ✅ Doctor can complete full consultation with prescriptions
- ✅ Visit status updates to "completed" after consultation
- ✅ All dashboards reflect changes in real-time
- ✅ Database stores complete consultation records
- ✅ Token system synchronizes with consultation status

This completes the core OPD workflow for Step 4!
