import { NextRequest, NextResponse } from "next/server";
import { decodeXState, exchangeXCodeForTokens } from "@/lib/x";
import { createAdminClient } from "@/lib/supabase/admin";

const PLATFORM = "x";

function redirectToDashboard(baseUrl: string, param: string, value: string) {
  const url = new URL("/dashboard", baseUrl);
  url.searchParams.set(param, value);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    const redirectUri = `${baseUrl}/api/oauth/x/callback`;

    if (error) {
      return redirectToDashboard(baseUrl, "error", "x_denied");
    }

    if (!code || !state) {
      return redirectToDashboard(baseUrl, "error", "x_callback_missing");
    }

    let userId: string;
    let codeVerifier: string;
    try {
      const decoded = decodeXState(state);
      userId = decoded.userId;
      codeVerifier = decoded.codeVerifier;
    } catch {
      return redirectToDashboard(baseUrl, "error", "x_invalid_state");
    }

    let tokens;
    try {
      tokens = await exchangeXCodeForTokens(redirectUri, code, codeVerifier);
    } catch (e) {
      console.error("[x/callback] Token exchange failed:", e);
      return redirectToDashboard(baseUrl, "error", "x_exchange_failed");
    }

    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null;

    const supabase = createAdminClient();
    const { error: upsertError } = await supabase
      .from("connected_accounts")
      .upsert(
        {
          user_id: userId,
          platform: PLATFORM,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token ?? null,
          expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,platform" }
      );

    if (upsertError) {
      console.error("[x/callback] Supabase upsert failed:", upsertError);
      return redirectToDashboard(baseUrl, "error", "x_save_failed");
    }

    await supabase.from("user_platform_settings").upsert(
      {
        user_id: userId,
        platform: PLATFORM,
        enabled_for_totals: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,platform" }
    );

    return redirectToDashboard(baseUrl, "connected", PLATFORM);
  } catch (e) {
    console.error("[x/callback] Unexpected error:", e);
    return redirectToDashboard(baseUrl, "error", "x_callback_error");
  }
}
