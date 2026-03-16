import { google } from "googleapis";

const SCOPES = [
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/yt-analytics.readonly",
];

export function getOAuth2Client(redirectUri: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET");
  }
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function getYouTubeAuthUrl(redirectUri: string, state: string): string {
  const oauth2 = getOAuth2Client(redirectUri);
  return oauth2.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
    state,
  });
}

export async function exchangeCodeForTokens(
  redirectUri: string,
  code: string
): Promise<{
  access_token: string | null;
  refresh_token: string | null;
  expiry_date: number | null;
}> {
  const oauth2 = getOAuth2Client(redirectUri);
  const { tokens } = await oauth2.getToken(code);
  return {
    access_token: tokens.access_token ?? null,
    refresh_token: tokens.refresh_token ?? null,
    expiry_date: tokens.expiry_date ?? null,
  };
}

export async function getYouTubeChannelStats(accessToken: string | null, refreshToken: string | null, redirectUri: string) {
  const oauth2 = getOAuth2Client(redirectUri);
  oauth2.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  const youtube = google.youtube({ version: "v3", auth: oauth2 });
  const channels = await youtube.channels.list({
    part: ["snippet", "statistics"],
    mine: true,
  });
  const channel = channels.data.items?.[0];
  if (!channel) return null;
  const stats = channel.statistics;
  const snippet = channel.snippet;
  return {
    platformUserId: channel.id ?? null,
    platformUsername: snippet?.title ?? snippet?.customUrl ?? null,
    subscribers: parseInt(stats?.subscriberCount ?? "0", 10),
    views: parseInt(stats?.viewCount ?? "0", 10),
    videoCount: parseInt(stats?.videoCount ?? "0", 10),
    engagementCount: 0,
  };
}

export async function refreshAccessTokenIfNeeded(
  redirectUri: string,
  accessToken: string | null,
  refreshToken: string | null,
  expiresAt: Date | null
): Promise<{ access_token: string; expires_at: Date } | null> {
  if (!refreshToken) return null;
  const now = new Date();
  if (expiresAt && expiresAt.getTime() > now.getTime() + 5 * 60 * 1000) {
    return null;
  }
  const oauth2 = getOAuth2Client(redirectUri);
  oauth2.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await oauth2.refreshAccessToken();
  const expiry = credentials.expiry_date
    ? new Date(credentials.expiry_date)
    : new Date(Date.now() + 3600 * 1000);
  return {
    access_token: credentials.access_token ?? "",
    expires_at: expiry,
  };
}
