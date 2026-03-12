import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Your stats and performance across connected platforms.
        </p>
      </div>
      <Card>
        <CardHeader>
          <h3 className="text-lg font-medium">Overview</h3>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Connect your accounts in a future phase to see combined and
            per-platform statistics here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
