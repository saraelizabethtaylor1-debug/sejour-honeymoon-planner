import { supabase } from '@/integrations/supabase/client';

export async function uploadActivityImage(
  base64: string,
  userId: string,
  uid: string,
): Promise<string> {
  const match = base64.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error('Invalid base64 data URL');

  const mimeType = match[1];
  const b64data = match[2];
  const ext = mimeType.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg';

  const byteChars = atob(b64data);
  const bytes = new Uint8Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i);
  const blob = new Blob([bytes], { type: mimeType });

  const path = `${userId}/${uid}-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('activity-images')
    .upload(path, blob, { contentType: mimeType, upsert: true });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('activity-images').getPublicUrl(path);
  return data.publicUrl;
}
