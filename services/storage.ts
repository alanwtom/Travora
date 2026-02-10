import { supabase } from '@/lib/supabase';
import { STORAGE_BUCKETS } from '@/lib/constants';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';

/**
 * Upload a user's avatar image
 */
export async function uploadAvatar(
  userId: string,
  fileUri: string
): Promise<string> {
  const ext = fileUri.split('.').pop() ?? 'jpg';
  const filePath = `${userId}/avatar.${ext}`;

  const base64 = await FileSystem.readAsStringAsync(fileUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const { error } = await supabase.storage
    .from(STORAGE_BUCKETS.AVATARS)
    .upload(filePath, decode(base64), {
      contentType: `image/${ext}`,
      upsert: true,
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from(STORAGE_BUCKETS.AVATARS)
    .getPublicUrl(filePath);

  return publicUrl;
}

/**
 * Upload a video file
 */
export async function uploadVideo(
  userId: string,
  fileUri: string,
  fileName: string
): Promise<string> {
  const ext = fileUri.split('.').pop() ?? 'mp4';
  const filePath = `${userId}/${fileName}.${ext}`;

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    throw new Error('User not authenticated');
  }

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('EXPO_PUBLIC_SUPABASE_URL is not defined');
  }

  const uploadUrl = `${supabaseUrl}/storage/v1/object/${STORAGE_BUCKETS.VIDEOS}/${filePath}`;

  const response = await FileSystem.uploadAsync(uploadUrl, fileUri, {
    httpMethod: 'POST',
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': `video/${ext}`,
    },
  });

  if (response.status < 200 || response.status >= 300) {
    throw new Error(`Video upload failed: ${response.body}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from(STORAGE_BUCKETS.VIDEOS)
    .getPublicUrl(filePath);

  return publicUrl;
}

/**
 * Upload a video thumbnail
 */
export async function uploadThumbnail(
  userId: string,
  fileUri: string,
  videoFileName: string
): Promise<string> {
  const ext = fileUri.split('.').pop() ?? 'jpg';
  const filePath = `${userId}/thumbnails/${videoFileName}.${ext}`;

  const base64 = await FileSystem.readAsStringAsync(fileUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const { error } = await supabase.storage
    .from(STORAGE_BUCKETS.VIDEOS)
    .upload(filePath, decode(base64), {
      contentType: `image/${ext}`,
      upsert: true,
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from(STORAGE_BUCKETS.VIDEOS)
    .getPublicUrl(filePath);

  return publicUrl;
}

/**
 * Delete a video and its thumbnail from storage
 */
export async function deleteVideoFiles(userId: string, videoFileName: string) {
  const ext = 'mp4';
  const videoPath = `${userId}/${videoFileName}.${ext}`;
  const thumbPath = `${userId}/thumbnails/${videoFileName}.jpg`;

  await Promise.all([
    supabase.storage.from(STORAGE_BUCKETS.VIDEOS).remove([videoPath]),
    supabase.storage.from(STORAGE_BUCKETS.VIDEOS).remove([thumbPath]),
  ]);
}

/**
 * Get a public URL for a storage file
 */
export function getPublicUrl(bucket: string, path: string): string {
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);
  return publicUrl;
}
