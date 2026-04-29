import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/auth";
import { AppNavbar } from "@/components/app-navbar";
import { prisma } from "@/lib/db";

function statusClasses(status: string) {
  const s = status.toLowerCase();
  if (s === "complete" || s === "completed") return "bg-emerald-500/10 text-emerald-300 border-emerald-400/20";
  if (s === "running" || s === "processing") return "bg-amber-500/10 text-amber-300 border-amber-400/20";
  return "bg-zinc-500/10 text-zinc-300 border-zinc-400/20";
}

export default async function ProjectsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return (
      <div className="min-h-screen bg-[#051424] text-white">
        <AppNavbar />
        <main className="p-8">No projects yet.</main>
      </div>
    );
  }

  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    orderBy: { timestamp: "desc" },
  });

  return (
    <div className="min-h-screen bg-[#051424] text-white">
      <AppNavbar />
      <main className="px-6 py-8 md:px-10">
        <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-indigo-400">Active Workspace</p>
          <h1 className="text-3xl font-semibold">Development Repositories</h1>
          <p className="mt-2 text-zinc-300">Manage AI-driven documentation pipelines across your repositories.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="rounded-xl border border-white/10 bg-slate-900/50 p-5 backdrop-blur transition hover:bg-slate-800/70"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{project.owner}/{project.repo}</h2>
                  <p className="text-sm text-zinc-400">{project.fileCount} files documented</p>
                </div>
                <span className={`rounded border px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${statusClasses(project.status)}`}>
                  {project.status}
                </span>
              </div>

              <div className="space-y-1 border-t border-white/10 pt-4 text-sm text-zinc-300">
                <p>Date: {new Date(project.timestamp).toLocaleString()}</p>
                <p>Skipped: {project.skippedCount}</p>
                {project.prUrl ? (
                  <p>
                    PR: <span className="text-indigo-300 underline">{project.prUrl}</span>
                  </p>
                ) : (
                  <p className="text-zinc-500">PR: not created</p>
                )}
              </div>
            </Link>
          ))}
        </div>
        </div>
      </main>
    </div>
  );
}
