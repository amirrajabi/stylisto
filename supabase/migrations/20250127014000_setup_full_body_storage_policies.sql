-- Create user-avatars bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-avatars', 'user-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Update storage policies for full body images in user-avatars bucket

-- Allow authenticated users to upload their own profile images (including full body)
CREATE POLICY "Users can upload their own profile images in user-avatars"
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'user-avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND (storage.foldername(name))[2] = 'profile'
);

-- Allow authenticated users to view their own profile images
CREATE POLICY "Users can view their own profile images in user-avatars"
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'user-avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND (storage.foldername(name))[2] = 'profile'
);

-- Allow authenticated users to update their own profile images
CREATE POLICY "Users can update their own profile images in user-avatars"
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'user-avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND (storage.foldername(name))[2] = 'profile'
);

-- Allow authenticated users to delete their own profile images
CREATE POLICY "Users can delete their own profile images in user-avatars"
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'user-avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND (storage.foldername(name))[2] = 'profile'
);

-- Alternative policies for direct user-id path (if no subdirectory)
CREATE POLICY "Users can upload directly to their user-avatars folder"
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'user-avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view directly from their user-avatars folder"
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'user-avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update directly in their user-avatars folder"
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'user-avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete directly from their user-avatars folder"
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'user-avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
); 