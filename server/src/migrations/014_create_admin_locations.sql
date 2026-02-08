-- Create admin_locations table to track which counties each admin manages
CREATE TABLE IF NOT EXISTS admin_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  county VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(admin_id, county)
);

-- Add check constraint for valid Irish counties (drop first if exists)
ALTER TABLE admin_locations
DROP CONSTRAINT IF EXISTS admin_locations_county_check;

ALTER TABLE admin_locations
ADD CONSTRAINT admin_locations_county_check 
CHECK (county IN (
  'Carlow', 'Cavan', 'Clare', 'Cork', 'Donegal', 'Dublin', 'Galway',
  'Kerry', 'Kildare', 'Kilkenny', 'Laois', 'Leitrim', 'Limerick',
  'Longford', 'Louth', 'Mayo', 'Meath', 'Monaghan', 'Offaly',
  'Roscommon', 'Sligo', 'Tipperary', 'Waterford', 'Westmeath',
  'Wexford', 'Wicklow'
));

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_locations_admin_id ON admin_locations(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_locations_county ON admin_locations(county);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_admin_locations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_admin_locations_updated_at_trigger ON admin_locations;
CREATE TRIGGER update_admin_locations_updated_at_trigger
BEFORE UPDATE ON admin_locations
FOR EACH ROW
EXECUTE FUNCTION update_admin_locations_updated_at();
