import { supabase } from "@/lib/supabase";

export type MediaTag = {
  id: string;
  name: string;
};

export async function searchTags(query: string): Promise<MediaTag[]> {
  const { data, error } = await supabase
    // New table not in generated types yet
    .from("tags" as any)
    .select("id, name")
    .ilike("name", `%${query}%`)
    .limit(20);
  if (error) throw error;
  return ((data ?? []) as any) as MediaTag[];
}

export async function ensureTags(names: string[]): Promise<MediaTag[]> {
  if (!names.length) return [];
  const trimmed = [...new Set(names.map((n) => n.trim()).filter(Boolean))];

  const { data, error } = await supabase
    .from("tags" as any)
    .upsert(
      trimmed.map((name) => ({ name })),
      { onConflict: "name" }
    )
    .select("id, name");

  if (error) throw error;
  return ((data ?? []) as any) as MediaTag[];
}

export async function setVideoTags(videoId: string, tagIds: string[]) {
  // Remove all existing
  const { error: delErr } = await supabase
    .from("video_tags" as any)
    .delete()
    .eq("video_id", videoId);
  if (delErr) throw delErr;

  if (!tagIds.length) return;

  const { error: insErr } = await supabase
    .from("video_tags" as any)
    .insert(tagIds.map((tagId) => ({ video_id: videoId, tag_id: tagId })));
  if (insErr) throw insErr;
}