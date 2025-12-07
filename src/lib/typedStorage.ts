export type UnknownRecord = Record<string, unknown>;

/**
 * 안전한 JSON 파서 (generic)
 * - key가 없거나 파싱 실패하면 defaultValue 반환
 */
export function safeParse<T>(raw: string | null, defaultValue: T): T {
  if (!raw) return defaultValue;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * 로컬/세션 스토리지 읽기 (generic)
 */
export function readLocalStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const raw = localStorage.getItem(key);
    return safeParse<T>(raw, defaultValue);
  } catch {
    return defaultValue;
  }
}

export function writeLocalStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('writeLocalStorage error', e);
  }
}

export function readSessionStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const raw = sessionStorage.getItem(key);
    return safeParse<T>(raw, defaultValue);
  } catch {
    return defaultValue;
  }
}

export function writeSessionStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('writeSessionStorage error', e);
  }
}