/**
 * Platform-specific limits for captions and hashtags (research: .planning/research/social-platform-apis.md).
 * Used for validation in planner and before publish.
 */
export const PLATFORM_LIMITS: Record<
  string,
  { captionMaxLength: number; hashtagMaxCount: number }
> = {
  youtube: { captionMaxLength: 5000, hashtagMaxCount: 500 },
  instagram: { captionMaxLength: 2200, hashtagMaxCount: 30 },
  x: { captionMaxLength: 280, hashtagMaxCount: 0 },
  linkedin: { captionMaxLength: 3000, hashtagMaxCount: 30 },
  facebook: { captionMaxLength: 63206, hashtagMaxCount: 30 },
  tiktok: { captionMaxLength: 2200, hashtagMaxCount: 30 },
};

export const AVAILABLE_PLATFORMS = [
  "youtube",
  "instagram",
  "x",
  "linkedin",
  "facebook",
  "tiktok",
] as const;

export type PlatformId = (typeof AVAILABLE_PLATFORMS)[number];

export function getPlatformLimit(
  platform: string
): { captionMaxLength: number; hashtagMaxCount: number } | null {
  return PLATFORM_LIMITS[platform.toLowerCase()] ?? null;
}

export function validateCaption(
  platform: string,
  caption: string
): { ok: true } | { ok: false; message: string } {
  const limit = getPlatformLimit(platform);
  if (!limit) return { ok: true };
  if (caption.length > limit.captionMaxLength) {
    return {
      ok: false,
      message: `Caption must be ${limit.captionMaxLength} characters or fewer for ${platform}.`,
    };
  }
  return { ok: true };
}

export function validateHashtags(
  platform: string,
  hashtags: string[]
): { ok: true } | { ok: false; message: string } {
  const limit = getPlatformLimit(platform);
  if (!limit) return { ok: true };
  if (hashtags.length > limit.hashtagMaxCount) {
    return {
      ok: false,
      message: `Maximum ${limit.hashtagMaxCount} hashtags for ${platform}.`,
    };
  }
  return { ok: true };
}
