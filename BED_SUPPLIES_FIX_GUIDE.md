# 🔧 QUICK FIX: No Beds or Supplies Appearing

## 🚨 **The Issues:**

1. **Bed assignment dropdown is empty** - No beds available for assignment
2. **Supply tab is empty** - No supply items showing up

## 🎯 **Root Cause:**

Your database is missing sample data! The APIs are working but there are no:

- Beds with `status = 'available'`
- Ward supply items in `ward_supplies` table

## ✅ **IMMEDIATE FIX:**

### Step 1: Add Sample Data

1. **Open Supabase Dashboard** → **SQL Editor**
2. **Copy and paste** the entire content of `QUICK_FIX_SAMPLE_DATA.sql`
3. **Click Run** to execute the script

### Step 2: Verify the Fix

1. **Refresh your ward admin dashboard**
2. **Open browser developer tools (F12)** → **Console tab**
3. **You should now see debug logs:**
   ```
   🔍 Raw ward data: {...}
   🏥 Ward stats: 4 wards, 14 total beds, 11 available
   🔍 Raw supplies data: {...}
   📦 Found 13 supply items, 0 low stock
   ```

### Step 3: Test Bed Assignment

1. **Click on an admission request** → **"Approve & Assign Bed"**
2. **The dropdown should now show available beds** like:
   - ICU-001 (Room 101)
   - ICU-002 (Room 102)
   - GEN-001 (Room 201)
   - etc.

### Step 4: Test Supply Management

1. **Click "Supply Management" tab**
2. **You should see 13 supply items** across all wards
3. **Try clicking +/- buttons** to adjust stock levels

## 📊 **What the Script Adds:**

### **Wards & Beds:**

- **4 Wards**: ICU, General, Emergency, Pediatric
- **14 Beds total**: 11 available, 3 occupied
- **Available beds** ready for assignment

### **Supply Items:**

- **13 Different supplies** across all wards
- **Medical equipment, linens, emergency supplies**
- **Realistic stock levels** for testing

### **Supply Requests:**

- **4 Sample requests** with different priorities
- **Linked to real users and supplies**
- **Mix of pending/approved statuses**

## 🎉 **Expected Results After Fix:**

✅ **Bed Assignment**: Dropdown shows 11 available beds  
✅ **Supply Management**: 13 supply items displayed  
✅ **Supply Requests**: 4 requests showing  
✅ **Real-time updates**: Stock adjustments work  
✅ **Statistics**: All dashboard stats show real numbers

---

**🚀 This adds realistic test data without affecting your existing admission requests or users!**
