import { supabase } from "@/lib/supabase";

export type VideoLocation = {
  id: string;
  name: string;
};

export async function searchLocations(query: string): Promise<VideoLocation[]> {
  const { data, error } = await supabase
    .from("locations" as any)
    .select("id, name")
    .ilike("name", `%${query}%`)
    .limit(20);
  if (error) throw error;
  return ((data ?? []) as any) as VideoLocation[];
}

export async function ensureLocations(names: string[]): Promise<VideoLocation[]> {
  if (!names.length) return [];
  const trimmed = [...new Set(names.map((n) => n.trim()).filter(Boolean))];

  const { data, error } = await supabase
    .from("locations" as any)
    .upsert(
      trimmed.map((name) => ({ name })),
      { onConflict: "name" }
    )
    .select("id, name");

  if (error) throw error;
  return ((data ?? []) as any) as VideoLocation[];
}

export async function setVideoLocations(videoId: string, locationIds: string[]) {
  // Remove all existing
  const { error: delErr } = await supabase
    .from("video_locations" as any)
    .delete()
    .eq("video_id", videoId);
  if (delErr) throw delErr;

  if (!locationIds.length) return;

  const { error: insErr } = await supabase
    .from("video_locations" as any)
    .insert(locationIds.map((locationId) => ({ video_id: videoId, location_id: locationId })));
  if (insErr) throw insErr;
}

export async function getVideoLocationNames(videoId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("video_locations" as any)
    .select("locations(name)")
    .eq("video_id", videoId);

  if (error) throw error;

  const names = ((data ?? []) as any[])
    .map((row) => row?.locations?.name)
    .filter((name): name is string => typeof name === "string" && name.length > 0);

  return [...new Set(names)];
}
