"use client";

import dynamic from "next/dynamic";

const DashboardClient = dynamic(
  () => import("@/components/dashboard-client").then((mod) => mod.DashboardClient),
  { ssr: false },
);

export function DashboardShell({
  accessToken,
  userName,
  userImage,
}: {
  accessToken: string;
  userName?: string;
  userImage?: string;
}) {
  return <DashboardClient accessToken={accessToken} userName={userName} userImage={userImage} />;
}
