/*
  # Create storage buckets for file uploads

  1. New Buckets
    - `complaint-attachments` - For complaint-related files
    - `profile-pictures` - For user profile pictures
    - `campaign-images` - For NGO campaign images
*/

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('complaint-attachments', 'complaint-attachments', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('profile-pictures', 'profile-pictures', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif']),
  ('campaign-images', 'campaign-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif']);

-- Storage policies for complaint-attachments
CREATE POLICY "Anyone can read complaint attachments"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'complaint-attachments');

CREATE POLICY "Users can upload complaint attachments"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'complaint-attachments');

CREATE POLICY "Users can update own complaint attachments"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'complaint-attachments' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own complaint attachments"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'complaint-attachments' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage policies for profile-pictures
CREATE POLICY "Anyone can read profile pictures"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'profile-pictures');

CREATE POLICY "Users can upload own profile pictures"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile-pictures' AND
    name = auth.uid()::text || '.jpg'
  );

CREATE POLICY "Users can update own profile pictures"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'profile-pictures' AND
    name = auth.uid()::text || '.jpg'
  );

CREATE POLICY "Users can delete own profile pictures"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'profile-pictures' AND
    name = auth.uid()::text || '.jpg'
  );

-- Storage policies for campaign-images
CREATE POLICY "Anyone can read campaign images"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'campaign-images');

CREATE POLICY "NGOs can upload campaign images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'campaign-images' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'ngo'
    )
  );

CREATE POLICY "NGOs can update own campaign images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'campaign-images' AND
    (storage.foldername(name))[1] = 'campaigns' AND
    (storage.foldername(name))[2] = auth.uid()::text AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'ngo'
    )
  );

CREATE POLICY "NGOs can delete own campaign images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'campaign-images' AND
    (storage.foldername(name))[1] = 'campaigns' AND
    (storage.foldername(name))[2] = auth.uid()::text AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'ngo'
    )
  );