-- Create storage buckets for images
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('post-images', 'post-images', true),
  ('message-images', 'message-images', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for post images (public)
CREATE POLICY "Anyone can view post images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'post-images');

CREATE POLICY "Users can upload post images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'post-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own post images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'post-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for message images (private)
CREATE POLICY "Users can view message images they're involved in"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'message-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can upload message images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'message-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );