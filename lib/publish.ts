/**
 * Publish scheduled content to platforms. Phase 4: X (Twitter) only.
 * Idempotency: if publish_results[platform].success is already true, skip posting.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { createTweet, refreshXAccessToken } from "@/lib/x";
import type { PublishResult, PublishResults, PlatformOverrides } from "@/lib/content-types";

const SUPPORTED_PUBLISH_PLATFORMS = ["x"] as const;

function buildTextForPlatform(
  body: string | null,
  platform: string,
  overrides: PlatformOverrides
): string {
  const o = overrides[platform];
  const caption = o?.caption?.trim();
  const hashtags = (o?.hashtags ?? []).filter(Boolean).join(" ");
  const parts: string[] = [];
  if (caption) parts.push(caption);
  else if (body) parts.push(body);
  if (hashtags) parts.push(hashtags);
  return parts.join(" ").trim().slice(0, 280) || " ";
}

/** Run publish for one content item: load row, publish to each supported target platform, update publish_results and state. */
export async function runPublishForContent(contentId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = createAdminClient();

  const { data: row, error: fetchError } = await supabase
    .from("scheduled_content")
    .select("*")
    .eq("id", contentId)
    .eq("state", "scheduled")
    .single();

  if (fetchError || !row) {
    return { ok: false, error: fetchError?.message ?? "Content not found or not scheduled" };
  }

  const targetPlatforms = (row.target_platforms as string[]) ?? [];
  const platformOverrides = (row.platform_overrides as PlatformOverrides) ?? {};
  const existingResults = (row.publish_results as PublishResults) ?? {};
  const results: PublishResults = { ...existingResults };

  for (const platform of targetPlatforms) {
    if (!SUPPORTED_PUBLISH_PLATFORMS.includes(platform as "x")) {
      results[platform] = { success: false, error: "Platform not yet supported for publishing" };
      continue;
    }

    // Idempotency: already succeeded
    if (results[platform]?.success && results[platform].post_id) {
      continue;
    }

    if (platform === "x") {
      const { data: account } = await supabase
        .from("connected_accounts")
        .select("access_token, refresh_token, expires_at")
        .eq("user_id", row.user_id)
        .eq("platform", "x")
        .single();

      if (!account?.access_token) {
        results.x = { success: false, error: "X account not connected" };
        continue;
      }

      let accessToken = account.access_token as string;
      const expiresAt = account.expires_at ? new Date(account.expires_at) : null;
      const now = new Date();
      if (expiresAt && expiresAt.getTime() < now.getTime() + 60 * 1000 && account.refresh_token) {
        try {
          const refreshed = await refreshXAccessToken(account.refresh_token as string);
          accessToken = refreshed.access_token;
          const newExpiry = refreshed.expires_in
            ? new Date(Date.now() + refreshed.expires_in * 1000).toISOString()
            : null;
          await supabase
            .from("connected_accounts")
            .update({
              access_token: accessToken,
              expires_at: newExpiry,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", row.user_id)
            .eq("platform", "x");
        } catch (e) {
          results.x = { success: false, error: `Token refresh failed: ${String(e)}` };
          continue;
        }
      }

      const text = buildTextForPlatform(row.body, "x", platformOverrides);
      try {
        const { id } = await createTweet(accessToken, text);
        results.x = { success: true, post_id: id };
      } catch (e) {
        results.x = { success: false, error: String(e) };
      }
    }
  }

  const allDone = targetPlatforms.every((p) => results[p] !== undefined);
  const state = allDone ? "published" : "scheduled";

  const { error: updateError } = await supabase
    .from("scheduled_content")
    .update({
      publish_results: results,
      state,
      updated_at: new Date().toISOString(),
    })
    .eq("id", contentId);

  if (updateError) return { ok: false, error: updateError.message };
  return { ok: true };
}
