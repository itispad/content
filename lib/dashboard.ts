import { createAdminClient } from "@/lib/supabase/admin";
import {
  getYouTubeChannelStats,
  refreshAccessTokenIfNeeded,
} from "@/lib/youtube";

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 min
const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const redirectUri = `${baseUrl}/api/oauth/youtube/callback`;

export type PlatformStat = {
  platform: string;
  platformUserId: string | null;
  platformUsername: string | null;
  subscribers: number;
  views: number;
  videoCount: number;
  engagementCount: number;
  enabledForTotals: boolean;
  connectedAccountId: string;
  error?: string;
};

export async function getDashboardData(
  userId: string
): Promise<{ accounts: PlatformStat[]; totalSubscribers: number; totalViews: number }> {
  const supabase = createAdminClient();

  const { data: accounts, error: accountsError } = await supabase
    .from("connected_accounts")
    .select("id, platform, access_token, refresh_token, expires_at, platform_user_id, platform_username")
    .eq("user_id", userId);

  if (accountsError || !accounts?.length) {
    return { accounts: [], totalSubscribers: 0, totalViews: 0 };
  }

  const { data: settings } = await supabase
    .from("user_platform_settings")
    .select("platform, enabled_for_totals")
    .eq("user_id", userId);

  const settingsMap = new Map(
    (settings ?? []).map((s) => [s.platform, s.enabled_for_totals ?? true])
  );

  const { data: cached } = await supabase
    .from("platform_stats")
    .select("connected_account_id, subscribers, views, video_count, engagement_count, fetched_at")
    .in(
      "connected_account_id",
      accounts.map((a) => a.id)
    );

  const cacheByAccount = new Map(
    (cached ?? []).map((c) => [c.connected_account_id, c])
  );

  const results: PlatformStat[] = [];
  const now = Date.now();

  for (const acc of accounts) {
    const enabledForTotals = settingsMap.get(acc.platform) ?? true;
    const cache = cacheByAccount.get(acc.id);
    const cacheValid =
      cache &&
      new Date(cache.fetched_at).getTime() > now - CACHE_TTL_MS;

    if (cacheValid && cache) {
      results.push({
        platform: acc.platform,
        platformUserId: acc.platform_user_id ?? null,
        platformUsername: acc.platform_username ?? null,
        subscribers: Number(cache.subscribers) ?? 0,
        views: Number(cache.views) ?? 0,
        videoCount: Number(cache.video_count) ?? 0,
        engagementCount: Number(cache.engagement_count) ?? 0,
        enabledForTotals,
        connectedAccountId: acc.id,
      });
      continue;
    }

    if (acc.platform === "youtube") {
      const refreshed = await refreshAccessTokenIfNeeded(
        redirectUri,
        acc.access_token,
        acc.refresh_token,
        acc.expires_at ? new Date(acc.expires_at) : null
      );
      let accessToken = acc.access_token;
      let expiresAt = acc.expires_at;
      if (refreshed) {
        accessToken = refreshed.access_token;
        expiresAt = refreshed.expires_at.toISOString();
        await supabase
          .from("connected_accounts")
          .update({
            access_token: accessToken,
            expires_at: expiresAt,
            updated_at: new Date().toISOString(),
          })
          .eq("id", acc.id);
      }
      try {
        const stats = await getYouTubeChannelStats(
          accessToken,
          acc.refresh_token,
          redirectUri
        );
        if (stats) {
          await supabase
            .from("connected_accounts")
            .update({
              platform_user_id: stats.platformUserId,
              platform_username: stats.platformUsername,
              updated_at: new Date().toISOString(),
            })
            .eq("id", acc.id);
          await supabase.from("platform_stats").upsert(
            {
              connected_account_id: acc.id,
              subscribers: stats.subscribers,
              views: stats.views,
              video_count: stats.videoCount,
              engagement_count: stats.engagementCount,
              fetched_at: new Date().toISOString(),
            },
            { onConflict: "connected_account_id" }
          );
          results.push({
            platform: "youtube",
            platformUserId: stats.platformUserId,
            platformUsername: stats.platformUsername,
            subscribers: stats.subscribers,
            views: stats.views,
            videoCount: stats.videoCount,
            engagementCount: stats.engagementCount,
            enabledForTotals,
            connectedAccountId: acc.id,
          });
        } else {
          results.push({
            platform: "youtube",
            platformUserId: null,
            platformUsername: null,
            subscribers: 0,
            views: 0,
            videoCount: 0,
            engagementCount: 0,
            enabledForTotals,
            connectedAccountId: acc.id,
            error: "No channel found",
          });
        }
      } catch (e) {
        results.push({
          platform: "youtube",
          platformUserId: null,
          platformUsername: null,
          subscribers: 0,
          views: 0,
          videoCount: 0,
          engagementCount: 0,
          enabledForTotals,
          connectedAccountId: acc.id,
          error: e instanceof Error ? e.message : "Failed to fetch stats",
        });
      }
    } else if (acc.platform === "x") {
      results.push({
        platform: "x",
        platformUserId: acc.platform_user_id ?? null,
        platformUsername: acc.platform_username ?? null,
        subscribers: 0,
        views: 0,
        videoCount: 0,
        engagementCount: 0,
        enabledForTotals,
        connectedAccountId: acc.id,
      });
    }
  }

  const totalSubscribers = results
    .filter((r) => r.enabledForTotals)
    .reduce((s, r) => s + r.subscribers, 0);
  const totalViews = results
    .filter((r) => r.enabledForTotals)
    .reduce((s, r) => s + r.views, 0);

  return { accounts: results, totalSubscribers, totalViews };
}
