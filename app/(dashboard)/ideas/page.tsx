import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function IdeasPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Idea Generator</h2>
        <p className="text-muted-foreground">
          Discover trends and bounce ideas for your niche.
        </p>
      </div>
      <Card>
        <CardHeader>
          <h3 className="text-lg font-medium">Ideas & to-do</h3>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Niche analysis, AI suggestions, and idea to-do list will be added in
            a later phase.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
