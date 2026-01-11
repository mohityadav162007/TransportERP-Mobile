-- ============================================================================
-- POD Status Consistency Trigger
-- ============================================================================
-- This trigger ensures that pod_status is always consistent with pod_path
-- Automatically sets status to 'Received' when pod_path has content
-- Works for all frontends (mobile, desktop, API, etc.)
-- ============================================================================

-- Step 1: Create the trigger function
CREATE OR REPLACE FUNCTION update_pod_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If pod_path has content (not null and not empty string)
  -- Automatically set pod_status to 'Received'
  IF NEW.pod_path IS NOT NULL AND NEW.pod_path != '' THEN
    NEW.pod_status := 'Received';
  
  -- If pod_path is cleared or null
  -- Set pod_status back to 'Pending'
  ELSIF NEW.pod_path IS NULL OR NEW.pod_path = '' THEN
    NEW.pod_status := 'Pending';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Create the trigger on trips table
-- This will fire BEFORE any INSERT or UPDATE that touches pod_path
DROP TRIGGER IF EXISTS enforce_pod_status_consistency ON trips;

CREATE TRIGGER enforce_pod_status_consistency
  BEFORE INSERT OR UPDATE OF pod_path
  ON trips
  FOR EACH ROW
  EXECUTE FUNCTION update_pod_status();

-- ============================================================================
-- Verification Query
-- ============================================================================
-- Run this to verify the trigger was created successfully
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'enforce_pod_status_consistency';
