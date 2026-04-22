import { supabase } from '@/lib/supabase';

export type BlockRow = {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
};

export function isBlocksTableMissingError(err: any): boolean {
  const msg = err?.message || '';
  return (
    err?.code === 'PGRST205' ||
    err?.code === '42P01' ||
    /could not find the table/i.test(msg) ||
    /relation .*blocks/i.test(msg) ||
    /public\.blocks/i.test(msg)
  );
}

function formatSbError(err: any): string {
  if (!err) return 'Unknown error';
  const msg = err.message || err.error_description || String(err);
  const code = err.code ? ` (${err.code})` : '';
  const details = err.details ? `\n${err.details}` : '';
  const hint = err.hint ? `\nHint: ${err.hint}` : '';
  const base = `${msg}${code}${details}${hint}`;

  // Helpful DX for the most common setup issue
  if (isBlocksTableMissingError(err) || /does not exist/i.test(msg)) {
    return `${base}\n\nSetup checklist:\n- Run supabase/migrations/015_blocks.sql in the Supabase SQL editor for the SAME project as EXPO_PUBLIC_SUPABASE_URL\n- Then refresh the PostgREST schema cache (Supabase: Settings → API → Reload schema, or wait 30–60s)\n- Restart the Expo dev server after any .env changes`;
  }

  return base;
}

export async function isBlocksFeatureAvailable(): Promise<boolean> {
  try {
    const { error } = await (supabase.from('blocks' as any) as any).select('id').limit(1);
    if (error) {
      if (isBlocksTableMissingError(error)) return false;
      // If RLS blocks reads, the feature is still "available" once schema exists.
      return true;
    }
    return true;
  } catch (e: any) {
    return !isBlocksTableMissingError(e);
  }
}

function uniq(ids: string[]) {
  return Array.from(new Set(ids.filter(Boolean)));
}

function toPostgrestInList(ids: string[]) {
  const clean = uniq(ids);
  return `(${clean.join(',')})`;
}

/**
 * Returns all user IDs that should be excluded from the current user's experience:
 * - users they blocked
 * - users who blocked them
 */
export async function getExcludedUserIds(currentUserId: string): Promise<string[]> {
  if (!currentUserId) return [];

  const { data, error } = await (supabase.from('blocks' as any) as any)
    .select('blocker_id,blocked_id')
    .or(`blocker_id.eq.${currentUserId},blocked_id.eq.${currentUserId}`);

  if (error) throw new Error(formatSbError(error));

  const rows = (data ?? []) as Array<Pick<BlockRow, 'blocker_id' | 'blocked_id'>>;

  const excluded: string[] = [];
  for (const r of rows) {
    if (r.blocker_id === currentUserId && r.blocked_id) excluded.push(r.blocked_id);
    if (r.blocked_id === currentUserId && r.blocker_id) excluded.push(r.blocker_id);
  }

  return uniq(excluded.filter((id) => id !== currentUserId));
}

export async function isBlockedByMe(currentUserId: string, targetUserId: string): Promise<boolean> {
  if (!currentUserId || !targetUserId) return false;
  if (currentUserId === targetUserId) return false;

  const { data, error } = await (supabase.from('blocks' as any) as any)
    .select('id')
    .eq('blocker_id', currentUserId)
    .eq('blocked_id', targetUserId)
    .maybeSingle();

  if (error) throw new Error(formatSbError(error));
  return !!data;
}

export async function blockUser(currentUserId: string, targetUserId: string) {
  if (!currentUserId || !targetUserId) throw new Error('Missing user id');
  if (currentUserId === targetUserId) throw new Error('You cannot block yourself.');

  // Use upsert to avoid "duplicate key value violates unique constraint"
  const { error } = await (supabase.from('blocks' as any) as any).upsert(
    {
      blocker_id: currentUserId,
      blocked_id: targetUserId,
    },
    { onConflict: 'blocker_id,blocked_id', ignoreDuplicates: true }
  );

  if (error) throw new Error(formatSbError(error));
}

export async function unblockUser(currentUserId: string, targetUserId: string) {
  if (!currentUserId || !targetUserId) throw new Error('Missing user id');

  const { error } = await (supabase.from('blocks' as any) as any)
    .delete()
    .eq('blocker_id', currentUserId)
    .eq('blocked_id', targetUserId);

  if (error) throw new Error(formatSbError(error));
}

export function withExcludedUserFilter<T extends { user_id?: string; id?: string }>(
  items: T[],
  excludedUserIds: string[]
) {
  if (!excludedUserIds.length) return items;
  const set = new Set(excludedUserIds);
  return items.filter((item) => {
    const uid = (item as any).user_id ?? (item as any).id;
    return !uid || !set.has(uid);
  });
}

export function addExcludedToVideoQuery(query: any, excludedUserIds: string[]) {
  if (!excludedUserIds.length) return query;
  return query.not('user_id', 'in', toPostgrestInList(excludedUserIds));
}

export function addExcludedToProfileQuery(query: any, excludedUserIds: string[]) {
  if (!excludedUserIds.length) return query;
  return query.not('id', 'in', toPostgrestInList(excludedUserIds));
}

