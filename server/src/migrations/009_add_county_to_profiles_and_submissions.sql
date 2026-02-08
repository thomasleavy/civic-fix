-- Add county to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS county VARCHAR(50);

-- Add county to issues table
ALTER TABLE issues 
ADD COLUMN IF NOT EXISTS county VARCHAR(50);

-- Add county to suggestions table
ALTER TABLE suggestions 
ADD COLUMN IF NOT EXISTS county VARCHAR(50);

-- Create indexes for faster lookups by county
CREATE INDEX IF NOT EXISTS idx_user_profiles_county ON user_profiles(county);
CREATE INDEX IF NOT EXISTS idx_issues_county ON issues(county);
CREATE INDEX IF NOT EXISTS idx_suggestions_county ON suggestions(county);

-- Add check constraint to ensure valid Irish counties (32 counties of Ireland)
ALTER TABLE user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_county_check;

ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_county_check 
CHECK (county IS NULL OR county IN (
  'Carlow', 'Cavan', 'Clare', 'Cork', 'Donegal', 'Dublin', 'Galway', 
  'Kerry', 'Kildare', 'Kilkenny', 'Laois', 'Leitrim', 'Limerick', 
  'Longford', 'Louth', 'Mayo', 'Meath', 'Monaghan', 'Offaly', 
  'Roscommon', 'Sligo', 'Tipperary', 'Waterford', 'Westmeath', 
  'Wexford', 'Wicklow'
));

ALTER TABLE issues 
DROP CONSTRAINT IF EXISTS issues_county_check;

ALTER TABLE issues 
ADD CONSTRAINT issues_county_check 
CHECK (county IS NULL OR county IN (
  'Carlow', 'Cavan', 'Clare', 'Cork', 'Donegal', 'Dublin', 'Galway', 
  'Kerry', 'Kildare', 'Kilkenny', 'Laois', 'Leitrim', 'Limerick', 
  'Longford', 'Louth', 'Mayo', 'Meath', 'Monaghan', 'Offaly', 
  'Roscommon', 'Sligo', 'Tipperary', 'Waterford', 'Westmeath', 
  'Wexford', 'Wicklow'
));

ALTER TABLE suggestions 
DROP CONSTRAINT IF EXISTS suggestions_county_check;

ALTER TABLE suggestions 
ADD CONSTRAINT suggestions_county_check 
CHECK (county IS NULL OR county IN (
  'Carlow', 'Cavan', 'Clare', 'Cork', 'Donegal', 'Dublin', 'Galway', 
  'Kerry', 'Kildare', 'Kilkenny', 'Laois', 'Leitrim', 'Limerick', 
  'Longford', 'Louth', 'Mayo', 'Meath', 'Monaghan', 'Offaly', 
  'Roscommon', 'Sligo', 'Tipperary', 'Waterford', 'Westmeath', 
  'Wexford', 'Wicklow'
));
