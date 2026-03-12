import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function PlannerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Content Planner</h2>
        <p className="text-muted-foreground">
          Schedule and publish content across your platforms.
        </p>
      </div>
      <Card>
        <CardHeader>
          <h3 className="text-lg font-medium">Schedule</h3>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            The content planner form and calendar will be added in a later
            phase.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
