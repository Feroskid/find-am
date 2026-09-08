// Static avatar set living in /public/avatars (av-01.png … av-48.png).
// Each community member is deterministically assigned one from their user id,
// so the same person always shows the same picture.

export const AVATAR_COUNT = 48;

export function avatarPath(index: number) {
  const i = ((index % AVATAR_COUNT) + AVATAR_COUNT) % AVATAR_COUNT;
  return `/avatars/av-${String(i + 1).padStart(2, "0")}.png`;
}

export function avatarForId(id?: string | null) {
  if (!id) return avatarPath(0);
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return avatarPath(h);
}

/** Member's own picture when set, otherwise their assigned static avatar. */
export function memberAvatar(avatarUrl?: string | null, id?: string | null) {
  return avatarUrl && avatarUrl.trim() ? avatarUrl : avatarForId(id);
}

export const ALL_AVATARS = Array.from({ length: AVATAR_COUNT }, (_, i) => avatarPath(i));
