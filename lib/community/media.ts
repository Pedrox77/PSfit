import { createClient } from "@/lib/supabase/server";
import {
  COMMUNITY_BUCKET, IMAGE_TYPES, MAX_IMAGE_BYTES, MAX_VIDEO_BYTES, VIDEO_TYPES,
} from "./constants";

export interface MediaValidation { valid: boolean; error?: string; kind?: "image" | "video" }

export function validateMediaFile(file: File): MediaValidation {
  const isImage = IMAGE_TYPES.includes(file.type as (typeof IMAGE_TYPES)[number]);
  const isVideo = VIDEO_TYPES.includes(file.type as (typeof VIDEO_TYPES)[number]);
  if (!isImage && !isVideo) return { valid: false, error: "Use JPG, PNG, WebP, MP4, or WebM." };
  if (isImage && file.size > MAX_IMAGE_BYTES) return { valid: false, error: "Images must be 8 MB or smaller." };
  if (isVideo && file.size > MAX_VIDEO_BYTES) return { valid: false, error: "Videos must be 25 MB or smaller." };
  return { valid: true, kind: isImage ? "image" : "video" };
}

export async function uploadPostMedia(userId: string, postId: string, file: File) {
  const validation = validateMediaFile(file);
  if (!validation.valid) throw new Error(validation.error);
  const extension = file.type.split("/")[1].replace("jpeg", "jpg");
  const path = `${userId}/posts/${postId}/${crypto.randomUUID()}.${extension}`;
  const supabase = await createClient();
  const { error } = await supabase.storage.from(COMMUNITY_BUCKET).upload(path, file, {
    contentType: file.type, upsert: false,
  });
  if (error) throw error;
  return { path, kind: validation.kind! };
}

export async function uploadStoryMedia(userId: string, storyId: string, file: File) {
  const validation = validateMediaFile(file);
  if (!validation.valid) throw new Error(validation.error);
  if (validation.kind === "video" && file.size > 25 * 1024 * 1024) throw new Error("Moment videos must be 25 MB or smaller.");
  const extension = file.type.split("/")[1].replace("jpeg", "jpg");
  const path = `${userId}/stories/${storyId}/${crypto.randomUUID()}.${extension}`;
  const supabase = await createClient();
  const { error } = await supabase.storage.from(COMMUNITY_BUCKET).upload(path, file, {
    contentType: file.type, upsert: false,
  });
  if (error) throw error;
  return { path, kind: validation.kind! };
}

export async function deletePostMedia(paths: string[]) {
  if (!paths.length) return;
  const supabase = await createClient();
  const { error } = await supabase.storage.from(COMMUNITY_BUCKET).remove(paths);
  if (error) throw error;
}

export async function createAuthorizedMediaUrl(path: string, expiresIn = 900) {
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from(COMMUNITY_BUCKET).createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}
