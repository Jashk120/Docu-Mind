"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

import { AppNavbar } from "@/components/app-navbar";

type DiffItem = {
  path: string;
  original_content: string;
  documented_content: string;
};

type ConfidenceFlag = {
  path: string;
  confidence: string;
  reason: string;
};

type Project = {
  id: string;
  owner: string;
  repo: string;
  prUrl: string | null;
  status: string;
  fileCount: number;
  skippedCount: number;
  tokenUsage: number;
  durationMs: number;
  fileDiffsJson: string | null;
  confidenceJson: string | null;
  timestamp: string;
};

const tabs = ["README", "CONTEXT.md", "Diff View", "Confidence Flags"] as const;

export default function ProjectDetailClient({ project }: { project: Project }) {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("README");
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const diffs = useMemo<DiffItem[]>(() => {
    try {
      return JSON.parse(project.fileDiffsJson ?? "[]") as DiffItem[];
    } catch {
      return [];
    }
  }, [project.fileDiffsJson]);

  const confidenceFlags = useMemo<ConfidenceFlag[]>(() => {
    try {
      return JSON.parse(project.confidenceJson ?? "[]") as ConfidenceFlag[];
    } catch {
      return [];
    }
  }, [project.confidenceJson]);

  const stableTimestamp = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "medium",
        timeZone: "UTC",
      }).format(new Date(project.timestamp)),
    [project.timestamp],
  );

  useEffect(() => {
    const filePath = activeTab === "README" ? "README.md" : activeTab === "CONTEXT.md" ? "CONTEXT.md" : "";
    if (!filePath) return;

    let mounted = true;

    fetch(`/api/projects/${project.id}/files?path=${encodeURIComponent(filePath)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load file");
        const data = await res.json();
        if (mounted) {
          setContent(data.content ?? "");
          setError("");
        }
      })
      .catch((err) => {
        if (mounted) setError(String(err));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [activeTab, project.id]);

  return (
    <div className="min-h-screen bg-[#051424] text-white">
      <AppNavbar />
      <main className="px-6 py-8 md:px-10">
        <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Link href="/projects" className="text-sm text-indigo-300 underline">Back to projects</Link>
          <h1 className="text-2xl font-semibold">{project.owner}/{project.repo}</h1>
          <span className="rounded border border-white/15 px-2 py-1 text-xs uppercase tracking-wide text-zinc-300">{project.status}</span>
        </div>

        <div className="mb-6 rounded-xl border border-white/10 bg-slate-900/50 p-4 text-sm text-zinc-300">
          <p>Date (UTC): {stableTimestamp}</p>
          <p>Files: {project.fileCount} | Skipped: {project.skippedCount} | Tokens: {project.tokenUsage} | Duration: {project.durationMs} ms</p>
          {project.prUrl ? (
            <p>
              PR: <a className="text-indigo-300 underline" href={project.prUrl} target="_blank" rel="noreferrer">{project.prUrl}</a>
            </p>
          ) : null}
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setLoading(true);
                setError("");
                setActiveTab(tab);
              }}
              className={`rounded-lg border px-3 py-2 text-sm ${activeTab === tab ? "border-indigo-400 bg-indigo-500/20 text-indigo-200" : "border-white/10 bg-slate-900/50 text-zinc-300"}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <section className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
          {(activeTab === "README" || activeTab === "CONTEXT.md") && (
            <>
              {loading ? <p className="text-sm text-zinc-400">Loading...</p> : null}
              {error ? <p className="text-sm text-red-400">{error}</p> : null}
              {!loading && !error ? (
                <article className="prose prose-invert max-w-none text-sm">
                  <ReactMarkdown>{content}</ReactMarkdown>
                </article>
              ) : null}
            </>
          )}

          {activeTab === "Diff View" ? (
            <div className="space-y-4">
              {diffs.map((d) => (
                <div key={d.path} className="rounded-lg border border-white/10 p-3">
                  <p className="mb-2 text-sm font-semibold text-zinc-200">{d.path}</p>
                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                    <pre className="max-h-80 overflow-auto rounded border border-white/10 bg-black/30 p-3 text-xs whitespace-pre-wrap">{d.original_content}</pre>
                    <pre className="max-h-80 overflow-auto rounded border border-white/10 bg-black/30 p-3 text-xs whitespace-pre-wrap">{d.documented_content}</pre>
                  </div>
                </div>
              ))}
              {diffs.length === 0 ? <p className="text-sm text-zinc-400">No diff data saved.</p> : null}
            </div>
          ) : null}

          {activeTab === "Confidence Flags" ? (
            <div className="space-y-2">
              {confidenceFlags.map((flag, idx) => (
                <div key={`${flag.path}-${idx}`} className="rounded-lg border border-white/10 p-3">
                  <p className="text-sm text-zinc-200">{flag.path}</p>
                  <p className="text-xs text-amber-300">{flag.confidence} - {flag.reason}</p>
                </div>
              ))}
              {confidenceFlags.length === 0 ? <p className="text-sm text-zinc-400">No confidence flags saved.</p> : null}
            </div>
          ) : null}
        </section>
        </div>
      </main>
    </div>
  );
}
