/**
 * X (Twitter) API v2: OAuth 2.0 PKCE and Create Tweet.
 * Scopes: tweet.read, tweet.write, users.read, offline.access for refresh token.
 */

const X_OAUTH_AUTHORIZE = "https://x.com/i/oauth2/authorize";
const X_OAUTH_TOKEN = "https://api.x.com/2/oauth2/token";
const X_API_TWEETS = "https://api.x.com/2/tweets";

function getClientCreds() {
  const clientId = process.env.X_CLIENT_ID;
  const clientSecret = process.env.X_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Missing X_CLIENT_ID or X_CLIENT_SECRET");
  }
  return { clientId, clientSecret };
}

/** Base64url encode (no padding). */
function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  const base64 = typeof Buffer !== "undefined"
    ? Buffer.from(binary, "binary").toString("base64")
    : btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Build X OAuth URL; state encodes userId + code_verifier so callback can exchange without server-side store. */
export async function getXAuthUrl(redirectUri: string, userId: string): Promise<{ url: string }> {
  const { clientId } = getClientCreds();
  const codeVerifier = crypto.getRandomValues(new Uint8Array(32))
    .reduce((acc, b) => acc + "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~"[b % 66], "");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(codeVerifier));
  const codeChallenge = base64UrlEncode(digest);
  const state = encodeXState(userId, codeVerifier);
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "tweet.read tweet.write users.read offline.access",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });
  return { url: `${X_OAUTH_AUTHORIZE}?${params.toString()}` };
}

/** Decode state that was encoded as base64url(JSON.stringify({ userId, codeVerifier })). */
export function decodeXState(state: string): { userId: string; codeVerifier: string } {
  try {
    let b64 = state.replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4;
    if (pad) b64 += "=".repeat(4 - pad);
    const decoded = Buffer.from(b64, "base64").toString("utf8");
    const parsed = JSON.parse(decoded) as { userId: string; codeVerifier: string };
    if (!parsed.userId || !parsed.codeVerifier) throw new Error("Invalid state shape");
    return parsed;
  } catch {
    throw new Error("Invalid or missing state");
  }
}

/** Encode state for X OAuth callback. */
export function encodeXState(userId: string, codeVerifier: string): string {
  const json = JSON.stringify({ userId, codeVerifier });
  return Buffer.from(json, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function exchangeXCodeForTokens(
  redirectUri: string,
  code: string,
  codeVerifier: string
): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}> {
  const { clientId, clientSecret } = getClientCreds();
  const body = new URLSearchParams({
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  });
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(X_OAUTH_TOKEN, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${auth}`,
    },
    body: body.toString(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`X token exchange failed: ${res.status} ${text}`);
  }
  const data = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  };
  return data;
}

export async function refreshXAccessToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in?: number;
}> {
  const { clientId, clientSecret } = getClientCreds();
  const body = new URLSearchParams({
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(X_OAUTH_TOKEN, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${auth}`,
    },
    body: body.toString(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`X refresh failed: ${res.status} ${text}`);
  }
  const data = (await res.json()) as { access_token: string; expires_in?: number };
  return data;
}

/** Create a tweet (text only for Phase 4). Idempotency is enforced by the publish job (skip if already succeeded). */
export async function createTweet(accessToken: string, text: string): Promise<{ id: string }> {
  const res = await fetch(X_API_TWEETS, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ text: text.slice(0, 280) }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`X create tweet failed: ${res.status} ${err}`);
  }
  const data = (await res.json()) as { data: { id: string } };
  return { id: data.data.id };
}
