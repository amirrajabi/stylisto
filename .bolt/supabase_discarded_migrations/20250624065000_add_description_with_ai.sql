-- Add description_with_ai field to clothing_items table
ALTER TABLE public.clothing_items
ADD COLUMN IF NOT EXISTS description_with_ai TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.clothing_items.description_with_ai IS 'AI-generated description of the clothing item for better virtual try-on results';

-- Update RLS policies if needed (existing policies should handle this automatically) 