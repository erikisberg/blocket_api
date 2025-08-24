-- Add profit_analysis field to listings table
-- This field will store detailed profit analysis from AI

-- Add the profit_analysis column as JSONB
ALTER TABLE listings ADD COLUMN IF NOT EXISTS profit_analysis JSONB;

-- Create an index for efficient querying of profit analysis data
CREATE INDEX IF NOT EXISTS idx_listings_profit_analysis ON listings USING GIN (profit_analysis);

-- Add comment to document the field
COMMENT ON COLUMN listings.profit_analysis IS 'Detailed profit analysis from AI including repair costs, estimated profit, risk level, etc.';

-- Update existing rows to have NULL profit_analysis
UPDATE listings SET profit_analysis = NULL WHERE profit_analysis IS NULL;
