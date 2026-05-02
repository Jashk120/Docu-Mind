import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/auth";

import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/");
  }

  if (!session.accessToken) {
    redirect("/api/auth/signin/github?callbackUrl=/dashboard");
  }

  return (
    <DashboardClient accessToken={session.accessToken} />
  );
}
