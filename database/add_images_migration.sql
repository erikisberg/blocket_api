-- Migration to add images field to listings table
-- Run this after the initial schema.sql

-- Add images field to store image URLs as JSON array
ALTER TABLE listings ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]';

-- Add index for images field for better performance
CREATE INDEX IF NOT EXISTS idx_listings_images ON listings USING GIN (images);

-- Update existing listings to have empty images array
UPDATE listings SET images = '[]' WHERE images IS NULL;

-- Add comment to document the field
COMMENT ON COLUMN listings.images IS 'Array of image URLs and metadata from Blocket';
