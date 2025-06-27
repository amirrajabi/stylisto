-- Add full_body_image_url column to users table for outfit try-on and design
ALTER TABLE users 
ADD COLUMN full_body_image_url TEXT; 