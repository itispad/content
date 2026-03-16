"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateCaption, validateHashtags } from "@/lib/platform-limits";
import type {
  PlatformOverrides,
  ContentState,
  ScheduledContentInsert,
} from "@/lib/content-types";

const MAX_MEDIA_SIZE_BYTES = 4 * 1024 * 1024; // 4 MB (under Vercel serverless limit)

export async function uploadMedia(formData: FormData): Promise<{ url?: string; error?: string }> {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };

  const file = formData.get("file") as File | null;
  if (!file?.size) return { error: "No file provided" };
  if (file.size > MAX_MEDIA_SIZE_BYTES) return { error: "File must be under 4 MB" };

  try {
    const blob = await put(`planner/${userId}/${file.name}`, file, {
      access: "public",
      addRandomSuffix: true,
    });
    return { url: blob.url };
  } catch (e) {
    console.error("[uploadMedia]", e);
    return { error: e instanceof Error ? e.message : "Upload failed" };
  }
}

export async function getContentList(userId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("scheduled_content")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return data ?? [];
}

function validateOverrides(platforms: string[], overrides: PlatformOverrides) {
  for (const platform of platforms) {
    const o = overrides[platform];
    if (!o) continue;
    if (o.caption) {
      const r = validateCaption(platform, o.caption);
      if (!r.ok) return r;
    }
    if (o.hashtags?.length) {
      const r = validateHashtags(platform, o.hashtags);
      if (!r.ok) return r;
    }
  }
  return { ok: true as const };
}

export async function createContent(form: {
  body: string;
  target_platforms: string[];
  platform_overrides: PlatformOverrides;
  media_urls?: string[];
}) {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };

  const validation = validateOverrides(
    form.target_platforms,
    form.platform_overrides
  );
  if (!validation.ok) return { error: validation.message };

  const supabase = createAdminClient();
  const insert: ScheduledContentInsert = {
    user_id: userId,
    body: form.body || null,
    target_platforms: form.target_platforms,
    platform_overrides: form.platform_overrides,
    media_urls: form.media_urls?.length ? form.media_urls : [],
    state: "draft",
  };
  const { error } = await supabase.from("scheduled_content").insert(insert);
  if (error) return { error: error.message };
  revalidatePath("/planner");
  return { ok: true };
}

export async function updateContent(
  id: string,
  form: {
    body: string;
    target_platforms: string[];
    platform_overrides: PlatformOverrides;
    media_urls?: string[];
  }
) {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };

  const validation = validateOverrides(
    form.target_platforms,
    form.platform_overrides
  );
  if (!validation.ok) return { error: validation.message };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("scheduled_content")
    .update({
      body: form.body || null,
      target_platforms: form.target_platforms,
      platform_overrides: form.platform_overrides,
      media_urls: form.media_urls ?? [],
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) return { error: error.message };
  revalidatePath("/planner");
  return { ok: true };
}

export async function scheduleContent(id: string, scheduledAt: Date) {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("scheduled_content")
    .update({
      scheduled_at: scheduledAt.toISOString(),
      state: "scheduled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) return { error: error.message };
  revalidatePath("/planner");
  return { ok: true };
}

/** Reschedule already-scheduled content (e.g. from calendar drag). */
export async function rescheduleContent(id: string, scheduledAt: Date) {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("scheduled_content")
    .update({
      scheduled_at: scheduledAt.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", userId)
    .eq("state", "scheduled");
  if (error) return { error: error.message };
  revalidatePath("/planner");
  return { ok: true };
}

export async function setContentState(id: string, state: ContentState) {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };

  const supabase = createAdminClient();
  const updates: { state: ContentState; updated_at: string } = {
    state,
    updated_at: new Date().toISOString(),
  };
  if (state === "draft") {
    (updates as Record<string, unknown>)["scheduled_at"] = null;
  }
  const { error } = await supabase
    .from("scheduled_content")
    .update(updates)
    .eq("id", id)
    .eq("user_id", userId);
  if (error) return { error: error.message };
  revalidatePath("/planner");
  return { ok: true };
}

export async function deleteContent(id: string) {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("scheduled_content")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) return { error: error.message };
  revalidatePath("/planner");
  return { ok: true };
}
