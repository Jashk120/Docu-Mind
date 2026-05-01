```typescript
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/auth";

import { DashboardClient } from "./dashboard-client";

/**
 * Renders the dashboard page after verifying user authentication.
 *
 * Retrieves the current session using NextAuth's `getServerSession`. If no
 * authenticated user or access token is found, the user is redirected to the
 * home page ("/"). Otherwise, the `DashboardClient` component is rendered with
 * the user's access token.
 *
 * @returns A promise resolving to the JSX element representing the dashboard page.
 * @throws {RedirectError} If the session or access token is missing, the function
 *   calls `redirect("/")`, which throws a redirect error to stop execution.
 */
export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.accessToken) {
    redirect("/");
  }

  return (
    <DashboardClient accessToken={session.accessToken} />
  );
}
```