-- Add unique constraint on user_id in user_settings table
-- This is needed for ON CONFLICT to work properly

-- First, remove any duplicate user_id entries if they exist
DELETE FROM user_settings 
WHERE id NOT IN (
  SELECT MIN(id) 
  FROM user_settings 
  GROUP BY user_id
);

-- Add unique constraint
ALTER TABLE user_settings ADD CONSTRAINT user_settings_user_id_unique UNIQUE (user_id);

-- Add comment
COMMENT ON CONSTRAINT user_settings_user_id_unique ON user_settings IS 'Ensures each user can only have one settings record';
