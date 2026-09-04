import { redirect } from "next/navigation";

// Activity logging moved into History's "Activity" tab (calendar-based day
// picker) so the bottom nav stays at 5 icons instead of 6. Kept as a
// redirect rather than deleting the route outright, in case anything
// still links here (a bookmark, an old PWA shortcut).
export default function ActivityPageRedirect() {
  redirect("/history?tab=activity");
}
