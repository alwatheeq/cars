/*
  # Add address fields to users table

  1. New Columns
    - `address` (text) - Full formatted address from Google Maps
    - `latitude` (decimal) - Latitude coordinate
    - `longitude` (decimal) - Longitude coordinate
    - `place_id` (text) - Google Places ID for reference
    - `address_components` (jsonb) - Structured address components from Google

  2. Changes
    - Add address-related columns to users table
    - Add index on coordinates for location-based queries
*/

-- Add address fields to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'address'
  ) THEN
    ALTER TABLE users ADD COLUMN address text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE users ADD COLUMN latitude decimal(10, 8);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE users ADD COLUMN longitude decimal(11, 8);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'place_id'
  ) THEN
    ALTER TABLE users ADD COLUMN place_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'address_components'
  ) THEN
    ALTER TABLE users ADD COLUMN address_components jsonb;
  END IF;
END $$;

-- Create index for location-based queries
CREATE INDEX IF NOT EXISTS idx_users_location ON users (latitude, longitude);