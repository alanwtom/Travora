import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'travora:blocked_user_ids:v1';

type Listener = (blockedIds: string[]) => void;
const listeners = new Set<Listener>();

function notify(blockedIds: string[]) {
  listeners.forEach((l) => {
    try {
      l(blockedIds);
    } catch {
      // ignore
    }
  });
}

export function subscribeToLocalBlocks(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

async function readList(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

async function writeList(ids: string[]) {
  const uniq = Array.from(new Set(ids.filter(Boolean)));
  await AsyncStorage.setItem(KEY, JSON.stringify(uniq));
  notify(uniq);
}

export async function getLocallyBlockedUserIds(): Promise<string[]> {
  return await readList();
}

export async function isLocallyBlocked(userId: string): Promise<boolean> {
  if (!userId) return false;
  const ids = await readList();
  return ids.includes(userId);
}

export async function blockUserLocally(userId: string) {
  if (!userId) return;
  const ids = await readList();
  if (ids.includes(userId)) return;
  ids.push(userId);
  await writeList(ids);
}

export async function unblockUserLocally(userId: string) {
  if (!userId) return;
  const ids = await readList();
  await writeList(ids.filter((id) => id !== userId));
}

