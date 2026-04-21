INSERT INTO storage.buckets (id, name, public)
VALUES ('activity-images', 'activity-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload their own activity images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'activity-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Activity images are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'activity-images');

CREATE POLICY "Users can delete their own activity images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'activity-images' AND auth.uid()::text = (storage.foldername(name))[1]);
