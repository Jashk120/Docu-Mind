import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/auth";

import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.accessToken) {
    redirect("/");
  }

  return (
    <DashboardClient
      accessToken={session.accessToken}
      userName={session.user.name ?? undefined}
      userImage={session.user.image ?? undefined}
    />
  );
}
