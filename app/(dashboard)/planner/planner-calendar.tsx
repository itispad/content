"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import { format, parse, startOfWeek, getDay } from "date-fns";
import type { ScheduledContentRow } from "@/lib/content-types";
import { rescheduleContent } from "./actions";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";

const locales = { "en-US": undefined };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const DnDCalendar = withDragAndDrop(Calendar);

export type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: ScheduledContentRow;
};

type Props = {
  contentList: ScheduledContentRow[];
};

export function PlannerCalendar({ contentList }: Props) {
  const router = useRouter();
  const events: CalendarEvent[] = useMemo(() => {
    return contentList
      .filter((row) => row.scheduled_at && row.state === "scheduled")
      .map((row) => ({
        id: row.id,
        title: row.body?.slice(0, 40)?.trim() || "Post",
        start: new Date(row.scheduled_at!),
        end: new Date(new Date(row.scheduled_at!).getTime() + 15 * 60 * 1000),
        resource: row,
      }));
  }, [contentList]);

  const onEventDrop = useCallback(
    async (args: { event: CalendarEvent; start: Date | string }) => {
      const ev = args.event as CalendarEvent;
      const start = typeof args.start === "string" ? new Date(args.start) : args.start;
      const result = await rescheduleContent(ev.resource.id, start);
      if (!result?.error) router.refresh();
    },
    [router]
  );

  const calendarProps = {
    localizer,
    events,
    onEventDrop: onEventDrop as (args: unknown) => void,
    startAccessor: (e: object) => (e as CalendarEvent).start,
    endAccessor: (e: object) => (e as CalendarEvent).end,
    titleAccessor: (e: object) => (e as CalendarEvent).title,
    views: ["month", "week", "agenda"],
    defaultView: "month",
    toolbar: true,
    resizable: false,
    draggableAccessor: () => true,
  };

  return (
    <div className="h-[600px] rounded-lg border bg-card p-4">
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <DnDCalendar {...(calendarProps as any)} />
    </div>
  );
}
