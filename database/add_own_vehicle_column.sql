-- Add is_own_vehicle column to trips table
ALTER TABLE trips 
ADD COLUMN IF NOT EXISTS is_own_vehicle BOOLEAN DEFAULT FALSE;

-- Update existing records by matching with own_vehicles table
UPDATE trips
SET is_own_vehicle = TRUE
WHERE vehicle_number IN (
    SELECT vehicle_number 
    FROM own_vehicles
);

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'trips' AND column_name = 'is_own_vehicle';
