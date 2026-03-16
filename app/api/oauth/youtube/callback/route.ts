import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/youtube";
import { createAdminClient } from "@/lib/supabase/admin";

const PLATFORM = "youtube";

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
    const redirectUri = `${baseUrl}/api/oauth/youtube/callback`;

    if (error) {
      return redirectToDashboard(baseUrl, "error", "youtube_denied");
    }

    if (!code || !state) {
      return redirectToDashboard(baseUrl, "error", "youtube_callback_missing");
    }

    const userId = state;
    let tokens;
    try {
      tokens = await exchangeCodeForTokens(redirectUri, code);
    } catch (e) {
      console.error("[youtube/callback] Token exchange failed:", e);
      return redirectToDashboard(baseUrl, "error", "youtube_exchange_failed");
    }

    const expiresAt = tokens.expiry_date
      ? new Date(tokens.expiry_date).toISOString()
      : null;

    const supabase = createAdminClient();
    const { error: upsertError } = await supabase
      .from("connected_accounts")
      .upsert(
        {
          user_id: userId,
          platform: PLATFORM,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,platform" }
      );

    if (upsertError) {
      console.error("[youtube/callback] Supabase upsert failed:", upsertError);
      return redirectToDashboard(baseUrl, "error", "youtube_save_failed");
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
    console.error("[youtube/callback] Unexpected error:", e);
    return redirectToDashboard(
      baseUrl,
      "error",
      "youtube_callback_error"
    );
  }
}
