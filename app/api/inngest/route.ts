import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import {
  processDueScheduledContent,
  publishContent,
} from "@/lib/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [processDueScheduledContent, publishContent],
});
