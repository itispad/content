import { auth } from "@clerk/nextjs/server";
import { getDashboardData } from "@/lib/dashboard";
import { DashboardContent } from "./dashboard-content";

type PageProps = {
  searchParams: Promise<{ connected?: string; error?: string }>;
};

export default async function DashboardPage({ searchParams }: PageProps) {
  const { userId } = await auth();
  const resolved = await searchParams;

  if (!userId) {
    return (
      <div className="space-y-6">
        <p className="text-muted-foreground">Sign in to view your dashboard.</p>
      </div>
    );
  }

  const { accounts, totalSubscribers, totalViews } =
    await getDashboardData(userId);

  return (
    <DashboardContent
      accounts={accounts}
      totalSubscribers={totalSubscribers}
      totalViews={totalViews}
      searchParams={resolved}
    />
  );
}
