export type ContentState = "draft" | "scheduled" | "published";

export type PlatformOverrides = Record<
  string,
  { caption?: string; hashtags?: string[] }
>;

export type PublishResult = {
  success: boolean;
  post_id?: string | null;
  error?: string | null;
};

export type PublishResults = Record<string, PublishResult>;

export interface ScheduledContentRow {
  id: string;
  user_id: string;
  body: string | null;
  media_urls: string[];
  scheduled_at: string | null;
  state: ContentState;
  target_platforms: string[];
  platform_overrides: PlatformOverrides;
  publish_results: PublishResults;
  created_at: string;
  updated_at: string;
}

export interface ScheduledContentInsert {
  user_id: string;
  body?: string | null;
  media_urls?: string[];
  scheduled_at?: string | null;
  state?: ContentState;
  target_platforms?: string[];
  platform_overrides?: PlatformOverrides;
  publish_results?: PublishResults;
}

export interface ScheduledContentUpdate {
  body?: string | null;
  media_urls?: string[];
  scheduled_at?: string | null;
  state?: ContentState;
  target_platforms?: string[];
  platform_overrides?: PlatformOverrides;
  publish_results?: PublishResults;
}
