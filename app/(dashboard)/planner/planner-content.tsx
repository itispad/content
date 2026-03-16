"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createContent, scheduleContent, deleteContent, uploadMedia } from "./actions";
import { PlannerCalendar } from "./planner-calendar";
import {
  getPlatformLimit,
  AVAILABLE_PLATFORMS,
} from "@/lib/platform-limits";
import type { ScheduledContentRow } from "@/lib/content-types";

const platformOverridesSchema = z.record(
  z.string(),
  z.object({
    caption: z.string().optional(),
    hashtags: z.string().optional(),
  })
);

const formSchema = z.object({
  body: z.string(),
  target_platforms: z.array(z.string()),
  platform_overrides: platformOverridesSchema,
});

type FormValues = z.infer<typeof formSchema>;

function defaultOverrides(): Record<string, { caption?: string; hashtags?: string }> {
  return Object.fromEntries(
    AVAILABLE_PLATFORMS.map((p) => [p, { caption: "", hashtags: "" }])
  );
}

function hashtagsStringToArray(s: string): string[] {
  if (!s?.trim()) return [];
  return s
    .trim()
    .split(/\s+/)
    .map((x) => (x.startsWith("#") ? x : `#${x}`));
}

function overridesForSubmit(
  raw: Record<string, { caption?: string; hashtags?: string }>
): Record<string, { caption?: string; hashtags?: string[] }> {
  const out: Record<string, { caption?: string; hashtags?: string[] }> = {};
  for (const [platform, v] of Object.entries(raw)) {
    if (!v) continue;
    const caption = v.caption?.trim();
    const hashtags = hashtagsStringToArray(v.hashtags ?? "");
    if (caption || hashtags.length) {
      out[platform] = {};
      if (caption) out[platform].caption = caption;
      if (hashtags.length) out[platform].hashtags = hashtags;
    }
  }
  return out;
}

type Props = {
  contentList: ScheduledContentRow[];
};

export function PlannerContent({ contentList }: Props) {
  const [filter, setFilter] = useState<"all" | "draft" | "scheduled" | "published">("all");
  const [error, setError] = useState<string | null>(null);
  const [schedulingId, setSchedulingId] = useState<string | null>(null);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [view, setView] = useState<"list" | "calendar">("list");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    defaultValues: {
      body: "",
      target_platforms: ["youtube"],
      platform_overrides: defaultOverrides(),
    },
    resolver: zodResolver(formSchema),
  });

  const targetPlatforms = watch("target_platforms") ?? [];

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      setError("File must be under 4 MB");
      return;
    }
    setError(null);
    setUploading(true);
    const formData = new FormData();
    formData.set("file", file);
    const result = await uploadMedia(formData);
    setUploading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.url) setMediaUrls((prev) => [...prev, result.url!]);
    e.target.value = "";
  };

  const removeMedia = (url: string) => {
    setMediaUrls((prev) => prev.filter((u) => u !== url));
  };

  const onSubmit = async (data: FormValues) => {
    setError(null);
    const overrides = overridesForSubmit(data.platform_overrides);
    const result = await createContent({
      body: data.body,
      target_platforms: data.target_platforms,
      platform_overrides: overrides,
      media_urls: mediaUrls.length ? mediaUrls : undefined,
    });
    if (result.error) {
      setError(result.error);
      return;
    }
    setMediaUrls([]);
    reset({
      body: "",
      target_platforms: ["youtube"],
      platform_overrides: defaultOverrides(),
    });
  };

  const onSchedule = async (id: string) => {
    setError(null);
    const raw = prompt("Enter date and time (e.g. 2025-03-15 14:00):");
    if (!raw) return;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) {
      setError("Invalid date/time.");
      return;
    }
    setSchedulingId(id);
    const result = await scheduleContent(id, d);
    setSchedulingId(null);
    if (result.error) setError(result.error);
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    setError(null);
    await deleteContent(id);
  };

  const filtered =
    filter === "all"
      ? contentList
      : contentList.filter((c) => c.state === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Content Planner
          </h2>
          <p className="text-muted-foreground">
            Create drafts and schedule posts. Switch to Calendar to view or reschedule by drag.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={view === "list" ? "default" : "outline"}
            size="sm"
            type="button"
            onClick={() => setView("list")}
          >
            List
          </Button>
          <Button
            variant={view === "calendar" ? "default" : "outline"}
            size="sm"
            type="button"
            onClick={() => setView("calendar")}
          >
            Calendar
          </Button>
        </div>
      </div>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {view === "calendar" ? (
        <PlannerCalendar contentList={contentList} />
      ) : (
        <>
      <Card>
        <CardHeader>
          <h3 className="text-lg font-medium">New post</h3>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="body">Content (shared)</Label>
              <Textarea
                id="body"
                className="mt-1"
                rows={3}
                placeholder="Main text for all platforms..."
                {...register("body")}
              />
            </div>

            <div>
              <Label>Media (optional)</Label>
              <p className="text-muted-foreground text-xs mt-0.5">
                Images or video URLs for the post. Max 4 MB per file.
              </p>
              <div className="mt-2 flex flex-wrap gap-2 items-center">
                <Input
                  type="file"
                  accept="image/*,video/*"
                  className="max-w-xs"
                  disabled={uploading}
                  onChange={onFileChange}
                />
                {uploading && (
                  <span className="text-muted-foreground text-sm">Uploading…</span>
                )}
              </div>
              {mediaUrls.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {mediaUrls.map((url) => (
                    <div
                      key={url}
                      className="relative inline-block rounded-md border overflow-hidden bg-muted"
                    >
                      {url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                        <img
                          src={url}
                          alt="Upload"
                          className="h-20 w-20 object-cover"
                        />
                      ) : (
                        <div className="h-20 w-20 flex items-center justify-center text-muted-foreground text-xs">
                          Media
                        </div>
                      )}
                      <button
                        type="button"
                        className="absolute top-0.5 right-0.5 rounded bg-destructive/80 text-destructive-foreground p-1 text-xs hover:bg-destructive"
                        onClick={() => removeMedia(url)}
                        aria-label="Remove"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label>Platforms</Label>
              <div className="mt-2 flex flex-wrap gap-4">
                {AVAILABLE_PLATFORMS.map((platform) => {
                  const limit = getPlatformLimit(platform);
                  return (
                    <label
                      key={platform}
                      className="flex items-center gap-2 capitalize"
                    >
                      <Checkbox
                        checked={targetPlatforms.includes(platform)}
                        onCheckedChange={(checked) => {
                          const next = checked
                            ? [...targetPlatforms, platform]
                            : targetPlatforms.filter((p) => p !== platform);
                          setValue("target_platforms", next);
                        }}
                      />
                      <span>
                        {platform}
                        {limit && (
                          <span className="text-muted-foreground text-xs">
                            {" "}
                            ({limit.captionMaxLength} chars, {limit.hashtagMaxCount}{" "}
                            hashtags)
                          </span>
                        )}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {targetPlatforms.length > 0 && (
              <div className="space-y-3 rounded-lg border p-3">
                <Label>Per-platform overrides (optional)</Label>
                {targetPlatforms.map((platform) => {
                  const limit = getPlatformLimit(platform);
                  return (
                    <div key={platform} className="space-y-1">
                      <span className="text-muted-foreground text-sm capitalize">
                        {platform}
                      </span>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div>
                          <Label className="text-xs">Caption</Label>
                          <Input
                            placeholder={`Override caption (max ${limit?.captionMaxLength ?? "—"})`}
                            {...register(
                              `platform_overrides.${platform}.caption`
                            )}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Hashtags (space-separated)</Label>
                          <Input
                            placeholder="#tag1 #tag2"
                            {...register(
                              `platform_overrides.${platform}.hashtags`
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save as draft"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-medium">Scheduled content</h3>
            <div className="flex gap-2">
              {(
                [
                  "all",
                  "draft",
                  "scheduled",
                  "published",
                ] as const
              ).map((f) => (
                <Button
                  key={f}
                  variant={filter === f ? "default" : "outline"}
                  size="sm"
                  type="button"
                  onClick={() => setFilter(f)}
                >
                  {f}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No items. Create a draft above.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Content</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Platforms</TableHead>
                  <TableHead className="w-[180px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="max-w-[200px] truncate">
                      {row.body || "—"}
                    </TableCell>
                    <TableCell className="capitalize">{row.state}</TableCell>
                    <TableCell>
                      {row.scheduled_at
                        ? new Date(row.scheduled_at).toLocaleString()
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {row.target_platforms?.join(", ") || "—"}
                    </TableCell>
                    <TableCell>
                      {row.state === "draft" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="mr-1"
                          disabled={schedulingId === row.id}
                          onClick={() => onSchedule(row.id)}
                        >
                          Schedule
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => onDelete(row.id)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
        </>
      )}
    </div>
  );
}
