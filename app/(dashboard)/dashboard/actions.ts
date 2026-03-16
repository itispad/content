"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export async function togglePlatformForTotals(platform: string, enabled: boolean) {
  const { userId } = await auth();
  if (!userId) return;
  const supabase = createAdminClient();
  await supabase.from("user_platform_settings").upsert(
    {
      user_id: userId,
      platform,
      enabled_for_totals: enabled,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,platform" }
  );
  revalidatePath("/dashboard");
}

export async function disconnectPlatform(platform: string) {
  const { userId } = await auth();
  if (!userId) return;
  const supabase = createAdminClient();
  await supabase
    .from("connected_accounts")
    .delete()
    .eq("user_id", userId)
    .eq("platform", platform);
  await supabase
    .from("user_platform_settings")
    .delete()
    .eq("user_id", userId)
    .eq("platform", platform);
  revalidatePath("/dashboard");
}
