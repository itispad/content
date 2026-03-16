"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PlatformStat } from "@/lib/dashboard";
import { togglePlatformForTotals, disconnectPlatform } from "./actions";
import { Trash2 } from "lucide-react";

type Props = {
  accounts: PlatformStat[];
  totalSubscribers: number;
  totalViews: number;
  searchParams: { connected?: string; error?: string };
};

export function DashboardContent({
  accounts,
  totalSubscribers,
  totalViews,
  searchParams,
}: Props) {
  const connectedPlatform = searchParams.connected;
  const connected = connectedPlatform === "youtube" || connectedPlatform === "x";
  const error = searchParams.error;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Your stats and performance across connected platforms.
        </p>
      </div>

      {connected && (
        <p className="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">
          {connectedPlatform === "youtube" && "YouTube connected successfully."}
          {connectedPlatform === "x" && "X (Twitter) connected successfully."}
        </p>
      )}
      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error === "youtube_denied" && "YouTube connection was denied."}
          {error === "youtube_callback_missing" &&
            "Invalid callback (missing code or state)."}
          {error === "youtube_exchange_failed" &&
            "Failed to exchange authorization code."}
          {error === "youtube_save_failed" && "Failed to save connection."}
          {error === "youtube_callback_error" &&
            "Something went wrong during sign-in. Check the terminal for details."}
          {error.startsWith("x_") &&
            (error === "x_denied"
              ? "X connection was denied."
              : error === "x_callback_missing"
                ? "Invalid callback (missing code or state)."
                : error === "x_invalid_state"
                  ? "Invalid state. Try connecting again."
                  : error === "x_exchange_failed"
                    ? "Failed to exchange authorization code."
                    : error === "x_save_failed"
                      ? "Failed to save connection."
                      : error === "x_callback_error"
                        ? "Something went wrong during X sign-in. Check the terminal for details."
                        : `Error: ${error}`)}
          {!error.startsWith("x_") &&
            !["youtube_denied", "youtube_callback_missing", "youtube_exchange_failed", "youtube_save_failed", "youtube_callback_error"].includes(error) &&
            `Error: ${error}`}
        </p>
      )}

      {accounts.length === 0 ? (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium">No accounts connected</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Connect YouTube for dashboard stats. Connect X (Twitter) to
              schedule and publish posts from the planner.
            </p>
            <div className="flex flex-wrap gap-2">
              <a href="/api/oauth/youtube">
                <Button type="button">Connect YouTube</Button>
              </a>
              <a href="/api/oauth/x">
                <Button type="button" variant="outline">
                  Connect X (Twitter)
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium">Combined totals</h3>
              <p className="text-muted-foreground text-sm">
                Sum of metrics from platforms enabled below.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-muted-foreground text-sm">
                    Total subscribers
                  </p>
                  <p className="text-2xl font-semibold">
                    {totalSubscribers.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Total views</p>
                  <p className="text-2xl font-semibold">
                    {totalViews.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium">Platforms</h3>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Platform</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead className="text-right">
                      Subscribers
                    </TableHead>
                    <TableHead className="text-right">Views</TableHead>
                    <TableHead className="text-right">Videos</TableHead>
                    <TableHead>Include in totals</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((acc) => (
                    <TableRow key={acc.connectedAccountId}>
                      <TableCell className="font-medium capitalize">
                        {acc.platform}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {acc.error ? (
                          <span className="flex items-center gap-2">
                            <span className="text-destructive">
                              {acc.error}
                            </span>
                            {(acc.platform === "youtube" || acc.platform === "x") && (
                              <a
                                href={acc.platform === "youtube" ? "/api/oauth/youtube" : "/api/oauth/x"}
                                className="text-primary text-sm underline hover:no-underline"
                              >
                                Reconnect
                              </a>
                            )}
                          </span>
                        ) : (
                          acc.platformUsername ?? acc.platformUserId ?? "—"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {acc.subscribers.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {acc.views.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {acc.videoCount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={acc.enabledForTotals}
                          onCheckedChange={(checked) =>
                            togglePlatformForTotals(acc.platform, !!checked)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <form
                          action={disconnectPlatform.bind(null, acc.platform)}
                        >
                          <Button
                            type="submit"
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive"
                            title="Disconnect"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </form>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 flex flex-wrap gap-2">
                <a href="/api/oauth/youtube">
                  <Button type="button" variant="outline">
                    Connect YouTube
                  </Button>
                </a>
                <a href="/api/oauth/x">
                  <Button type="button" variant="outline">
                    Connect X (Twitter)
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
