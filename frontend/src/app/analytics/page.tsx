import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/auth";
import { AppNavbar } from "@/components/app-navbar";
import { prisma } from "@/lib/db";

function avg(nums: number[]) {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <AppNavbar />
        <main className="p-8">No analytics yet.</main>
      </div>
    );
  }

  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    orderBy: { timestamp: "desc" },
    take: 500,
  });

  const runsPerDayMap = new Map<string, number>();
  for (const project of projects) {
    const day = project.timestamp.toISOString().slice(0, 10);
    runsPerDayMap.set(day, (runsPerDayMap.get(day) ?? 0) + 1);
  }

  const successRate = projects.length
    ? (projects.filter((p) => p.status === "complete" || p.status === "completed").length / projects.length) * 100
    : 0;
  const avgDuration = avg(projects.map((p) => p.durationMs ?? 0).filter((n) => n > 0));
  const totalTokens = projects.reduce((acc, p) => acc + (p.tokenUsage ?? 0), 0);
  const avgFiles = avg(projects.map((p) => p.fileCount ?? 0));

  const runsPerDay = Array.from(runsPerDayMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <AppNavbar />
      <main className="p-8">
        <h1 className="mb-6 text-3xl font-bold">Analytics</h1>
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-zinc-700 bg-[#111111] p-4"><p className="text-sm text-zinc-400">Total Runs</p><p className="text-2xl font-bold">{projects.length}</p></div>
        <div className="rounded-xl border border-zinc-700 bg-[#111111] p-4"><p className="text-sm text-zinc-400">Success Rate</p><p className="text-2xl font-bold">{successRate.toFixed(1)}%</p></div>
        <div className="rounded-xl border border-zinc-700 bg-[#111111] p-4"><p className="text-sm text-zinc-400">Avg Duration</p><p className="text-2xl font-bold">{Math.round(avgDuration)} ms</p></div>
        <div className="rounded-xl border border-zinc-700 bg-[#111111] p-4"><p className="text-sm text-zinc-400">Total Tokens Used</p><p className="text-2xl font-bold">{totalTokens}</p></div>
      </div>

      <div className="mb-6 rounded-xl border border-zinc-700 bg-[#111111] p-4">
        <p className="mb-3 font-semibold">Runs per Day</p>
        <div className="space-y-2">
          {runsPerDay.map(([day, count]) => (
            <div key={day} className="flex items-center gap-3">
              <p className="w-28 text-xs text-zinc-400">{day}</p>
              <div className="h-2 rounded bg-indigo-500" style={{ width: `${Math.max(8, count * 14)}px` }} />
              <p className="text-xs text-zinc-300">{count}</p>
            </div>
          ))}
        </div>
      </div>

        <div className="rounded-xl border border-zinc-700 bg-[#111111] p-4">
          <p className="font-semibold">Average Files Documented Per Run</p>
          <p className="mt-1 text-2xl font-bold">{avgFiles.toFixed(2)}</p>
        </div>
      </main>
    </div>
  );
}
