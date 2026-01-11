# POD Status Trigger - Deployment Guide

## Overview
This guide walks you through deploying the POD status consistency fix to your Supabase database.

## Prerequisites
- Access to Supabase Dashboard
- Database connection credentials
- Backup of trips table (recommended)

---

## Deployment Steps

### Step 1: Access Supabase SQL Editor
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `nlgvxjahadswvulkrcjc`
3. Navigate to **SQL Editor** in the left sidebar

### Step 2: Create the Trigger
1. Open `database/create_pod_status_trigger.sql`
2. Copy the entire contents
3. Paste into Supabase SQL Editor
4. Click **Run** button
5. Verify success message appears

**Expected Output:**
```
Success. No rows returned
```

### Step 3: Verify Trigger Creation
Run the verification query at the bottom of the trigger script:
```sql
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'enforce_pod_status_consistency';
```

**Expected Result:**
You should see one row with:
- `trigger_name`: enforce_pod_status_consistency
- `event_object_table`: trips
- `event_manipulation`: UPDATE or INSERT

### Step 4: Preview Data Migration
1. Open `database/fix_pod_status_data.sql`
2. Copy **ONLY Step 1** (the SELECT query)
3. Run it in SQL Editor
4. Review the list of trips that will be updated

**What to check:**
- How many trips have POD files but status is "Pending"
- Verify these are legitimate inconsistencies

### Step 5: Run Data Migration
1. Copy **Step 3** from `fix_pod_status_data.sql` (the UPDATE statements)
2. Run in SQL Editor
3. Note the number of rows updated

**Expected Output:**
```
UPDATE X rows
```
Where X is the number of inconsistent trips found in Step 4.

### Step 6: Verify Migration Success
Run the verification query (Step 4 in migration script):
```sql
SELECT COUNT(*) as remaining_inconsistencies
FROM trips
WHERE 
  ((pod_path IS NOT NULL AND pod_path != '') AND pod_status != 'Received')
  OR
  ((pod_path IS NULL OR pod_path = '') AND pod_status != 'Pending');
```

**Expected Result:**
```
remaining_inconsistencies: 0
```

---

## Testing the Fix

### Test 1: Mobile Upload
1. Open mobile app
2. Navigate to any trip
3. Upload a POD image
4. Refresh the page
5. **Verify:** Status shows green "RECEIVED"

### Test 2: Desktop Verification
1. Open desktop app
2. Navigate to the same trip from Test 1
3. **Verify:** Status shows green "RECEIVED"
4. **Verify:** POD images are visible

### Test 3: Trigger Behavior
Run this test query in SQL Editor:
```sql
-- Create a test trip
INSERT INTO trips (trip_code, vehicle_number, pod_path, pod_status)
VALUES ('TEST-001', 'TEST-VEH', 'https://example.com/pod.jpg', 'Pending');

-- Check if trigger auto-corrected the status
SELECT trip_code, pod_path, pod_status 
FROM trips 
WHERE trip_code = 'TEST-001';

-- Clean up
DELETE FROM trips WHERE trip_code = 'TEST-001';
```

**Expected Result:**
The `pod_status` should be `'Received'` even though we tried to insert it as `'Pending'`.

---

## Rollback Plan

If you need to remove the trigger:

```sql
-- Remove the trigger
DROP TRIGGER IF EXISTS enforce_pod_status_consistency ON trips;

-- Remove the function
DROP FUNCTION IF EXISTS update_pod_status();
```

**Note:** This will NOT undo the data migration. The updated statuses will remain.

---

## Desktop Application Update

**IMPORTANT:** Coordinate with the desktop development team to ensure their POD upload code includes:

```javascript
await supabase
  .from('trips')
  .update({
    pod_path: cloudinaryUrls,
    pod_status: 'Received'  // ← Must include this
  })
  .eq('id', tripId);
```

Even though the trigger provides protection, explicit updates from both frontends ensure consistency.

---

## Monitoring

After deployment, monitor for:
1. Any POD upload failures
2. Status display issues on either frontend
3. Database error logs in Supabase

---

## Success Criteria

✅ Trigger created successfully  
✅ Data migration completed with 0 remaining inconsistencies  
✅ Mobile uploads show correct status on desktop  
✅ Desktop uploads show correct status on mobile  
✅ Status persists across page refreshes  
✅ No manual intervention required for status updates

---

## Support

If you encounter issues:
1. Check Supabase logs for trigger errors
2. Verify trigger exists using the verification query
3. Test with a single trip before mass migration
4. Contact database administrator if trigger conflicts occur
