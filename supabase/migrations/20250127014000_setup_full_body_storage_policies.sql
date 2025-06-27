-- Create user-content bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-content', 'user-content', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own full body images
CREATE POLICY "Users can upload their own full body images"
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'user-content' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND (storage.foldername(name))[2] = 'full-body-images'
);

-- Allow authenticated users to view their own full body images
CREATE POLICY "Users can view their own full body images"
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'user-content' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND (storage.foldername(name))[2] = 'full-body-images'
);

-- Allow authenticated users to update their own full body images
CREATE POLICY "Users can update their own full body images"
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'user-content' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND (storage.foldername(name))[2] = 'full-body-images'
);

-- Allow authenticated users to delete their own full body images
CREATE POLICY "Users can delete their own full body images"
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'user-content' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND (storage.foldername(name))[2] = 'full-body-images'
); 