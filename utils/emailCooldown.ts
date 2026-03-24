import AsyncStorage from '@react-native-async-storage/async-storage';

const COOLDOWN_MS = 60_000; // 1 minute

export async function canSendEmail(email: string) {
  try {
    const key = `cooldown:${email}`;
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return true;
    const last = parseInt(raw, 10);
    return Date.now() - last > COOLDOWN_MS;
  } catch (e) {
    return true;
  }
}

export async function setSentNow(email: string) {
  try {
    const key = `cooldown:${email}`;
    await AsyncStorage.setItem(key, String(Date.now()));
  } catch (e) {
    // ignore
  }
}
