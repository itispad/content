import { auth } from "@clerk/nextjs/server";
import { getContentList } from "./actions";
import { PlannerContent } from "./planner-content";

export default async function PlannerPage() {
  const { userId } = await auth();
  if (!userId) {
    return (
      <div className="space-y-6">
        <p className="text-muted-foreground">Sign in to use the planner.</p>
      </div>
    );
  }

  const contentList = await getContentList(userId);

  return <PlannerContent contentList={contentList} />;
}
