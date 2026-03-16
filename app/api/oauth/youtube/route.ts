import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getYouTubeAuthUrl } from "@/lib/youtube";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"));
  }
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const redirectUri = `${baseUrl}/api/oauth/youtube/callback`;
  const url = getYouTubeAuthUrl(redirectUri, userId);
  return NextResponse.redirect(url);
}
