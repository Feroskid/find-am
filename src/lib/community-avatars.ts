// Static avatar set living in /public/avatars (a01.png … a60.png).
// The backend stores only the key; the frontend maps it to the file.

export const AVATAR_COUNT = 60;
export const DEFAULT_AVATAR_KEY = "a01";

export const ALL_AVATAR_KEYS = Array.from(
  { length: AVATAR_COUNT },
  (_, i) => `a${String(i + 1).padStart(2, "0")}`,
);

export function avatarUrl(key?: string | null) {
  const k = key && /^a\d{2}$/.test(key) ? key : DEFAULT_AVATAR_KEY;
  return `/avatars/${k}.png`;
}
