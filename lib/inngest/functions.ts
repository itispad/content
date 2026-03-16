import { cron } from "inngest";
import { inngest } from "./client";
import { createAdminClient } from "@/lib/supabase/admin";
import { runPublishForContent } from "@/lib/publish";

/** Every minute: find scheduled content due now and send content/publish for each. */
export const processDueScheduledContent = inngest.createFunction(
  {
    id: "scheduler-process-due",
    triggers: [cron("* * * * *")],
  },
  async ({ step }) => {
    const ids = await step.run("get-due-content-ids", async () => {
      const supabase = createAdminClient();
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("scheduled_content")
        .select("id")
        .eq("state", "scheduled")
        .not("scheduled_at", "is", null)
        .lte("scheduled_at", now);
      if (error) throw new Error(error.message);
      return (data ?? []).map((r) => r.id as string);
    });

    for (const contentId of ids) {
      await inngest.send({
        name: "content/publish",
        data: { contentId },
      });
    }

    return { processed: ids.length };
  }
);

/** Publish one content item to its target platforms (Phase 4: X only). */
export const publishContent = inngest.createFunction(
  {
    id: "content-publish",
    triggers: [{ event: "content/publish" }],
    retries: 2,
  },
  async ({ event, step }) => {
    const contentId = event.data.contentId as string;
    if (!contentId) throw new Error("Missing contentId");

    const result = await step.run("run-publish", async () => {
      return runPublishForContent(contentId);
    });

    if (!result.ok) {
      throw new Error(result.error ?? "Publish failed");
    }
    return result;
  }
);
