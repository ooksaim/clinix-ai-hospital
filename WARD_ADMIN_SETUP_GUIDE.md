# Ward Admin Dashboard Setup Guide

## 🚀 Quick Setup Instructions

### 1. **Logout Button** ✅

- **DONE!** A logout button has been added to the header
- It will appear in the top-right corner next to the "Live" indicator
- Click it to logout and return to the login page

### 2. **Set Up Automatic Bed Management**

Run this SQL script in your Supabase SQL editor:

```bash
# Copy the content of setup-bed-management.sql and run it in Supabase
```

This will:

- Create sample beds for all wards (14 beds total)
- Set up automatic triggers that update bed counts whenever:
  - A new bed is added
  - A bed status changes (available ↔ occupied ↔ maintenance)
  - A bed is assigned to a patient
  - A bed is deleted
- Initialize correct bed counts for all wards

**Example bed distribution:**

- General Ward: 5 beds (4 available, 1 occupied)
- ICU: 3 beds (2 available, 1 occupied)
- Emergency Ward: 3 beds (2 available, 1 maintenance)
- Pediatric Ward: 3 beds (2 available, 1 occupied)

### 3. **Fill Up the Inventory**

Run this SQL script in your Supabase SQL editor:

```bash
# Copy the content of setup-ward-supplies.sql and run it in Supabase
```

This will:

- Add **23 different supply items** across all wards
- Create **5 sample supply requests** (3 pending, 2 processed)
- Set up realistic stock levels with some items below minimum threshold

**Example supplies added:**

- **General Ward**: Surgical gloves, face masks, hand sanitizer, bandages, etc.
- **ICU**: Ventilator tubing, ECG electrodes, IV bags, oxygen masks, etc.
- **Emergency Ward**: Trauma kits, defibrillator pads, emergency medications, etc.
- **Pediatric Ward**: Pediatric syringes, child-size masks, pediatric IV sets, etc.

## 🎯 **After Setup, You'll See:**

### **Dashboard Stats:**

- **Pending Admissions**: Current pending requests
- **Available Beds**: 9/14 available (64% occupancy)
- **Low Stock Items**: ~3-5 items below threshold
- **Supply Requests**: 3 pending requests

### **Bed Management Tab:**

- Visual bed grid with color coding
- Real-time bed status for all wards
- Patient names for occupied beds

### **Supply Management Tab:**

- Complete inventory with current stock levels
- Plus/minus buttons to adjust stock
- Low stock alerts (items in red)
- Supply request approval system

## ⚡ **Real-time Features:**

1. **Bed Counts Auto-Update** when:

   - You approve a patient and assign a bed
   - Bed status changes in the database
   - New beds are added/removed

2. **Supply Counts Update** when:

   - You click +/- buttons to adjust stock
   - New supplies are added to inventory
   - Supply requests are fulfilled

3. **Bed Assignment During Approval**:
   - Click "Approve & Assign Bed" on any admission request
   - Select specific bed from dropdown
   - Bed automatically becomes "occupied"
   - Ward bed counts update instantly

## 🛠️ **Manual Operations:**

- **Add More Beds**: Insert into `beds` table - counts update automatically
- **Adjust Stock**: Use +/- buttons in Supply Management tab
- **Add New Supply Items**: Insert into `ward_supplies` table
- **Create Supply Requests**: Insert into `supply_requests` table

## 📊 **Current Test Data:**

- **14 total beds** across 4 wards
- **23 supply items** with realistic stock levels
- **5 supply requests** for testing approval workflow
- **Automatic triggers** for real-time updates
