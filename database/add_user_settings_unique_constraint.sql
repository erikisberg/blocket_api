-- Add unique constraint on user_id in user_settings table
-- This is needed for ON CONFLICT to work properly

-- First, remove any duplicate user_id entries if they exist
-- Use a subquery to find the first occurrence of each user_id
DELETE FROM user_settings 
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM user_settings 
  ORDER BY user_id, created_at ASC
);

-- Add unique constraint
ALTER TABLE user_settings ADD CONSTRAINT user_settings_user_id_unique UNIQUE (user_id);

-- Add comment
COMMENT ON CONSTRAINT user_settings_user_id_unique ON user_settings IS 'Ensures each user can only have one settings record';
