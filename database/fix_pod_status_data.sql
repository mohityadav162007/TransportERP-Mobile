-- ============================================================================
-- Data Migration: Fix Existing POD Status Inconsistencies
-- ============================================================================
-- This script fixes trips that have POD files but incorrect status
-- Run this AFTER creating the trigger
-- ============================================================================

-- Step 1: Preview affected records (READ-ONLY)
-- Run this first to see what will be updated
SELECT 
  id,
  trip_code,
  pod_path,
  pod_status,
  CASE 
    WHEN (pod_path IS NOT NULL AND pod_path != '') THEN 'Should be: Received'
    ELSE 'Should be: Pending'
  END as correct_status
FROM trips
WHERE 
  -- Find trips with POD files but status is Pending
  ((pod_path IS NOT NULL AND pod_path != '') AND pod_status != 'Received')
  OR
  -- Find trips without POD files but status is Received
  ((pod_path IS NULL OR pod_path = '') AND pod_status != 'Pending');

-- Step 2: Count affected records
SELECT 
  COUNT(*) as total_inconsistent_trips,
  SUM(CASE WHEN (pod_path IS NOT NULL AND pod_path != '') AND pod_status != 'Received' THEN 1 ELSE 0 END) as has_pod_but_pending,
  SUM(CASE WHEN (pod_path IS NULL OR pod_path = '') AND pod_status != 'Pending' THEN 1 ELSE 0 END) as no_pod_but_received
FROM trips;

-- Step 3: Fix inconsistent records (WRITE OPERATION)
-- Uncomment and run this after reviewing the preview above

-- Fix trips that have POD files but status is Pending
UPDATE trips
SET pod_status = 'Received'
WHERE (pod_path IS NOT NULL AND pod_path != '')
  AND pod_status != 'Received';

-- Fix trips that don't have POD files but status is Received
UPDATE trips
SET pod_status = 'Pending'
WHERE (pod_path IS NULL OR pod_path = '')
  AND pod_status != 'Pending';

-- Step 4: Verification - should return 0 inconsistencies
SELECT 
  COUNT(*) as remaining_inconsistencies
FROM trips
WHERE 
  ((pod_path IS NOT NULL AND pod_path != '') AND pod_status != 'Received')
  OR
  ((pod_path IS NULL OR pod_path = '') AND pod_status != 'Pending');
