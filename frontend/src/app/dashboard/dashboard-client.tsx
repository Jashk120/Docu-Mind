"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { AppNavbar } from "@/components/app-navbar";

type Repo = {
  full_name: string;
};

type FileDiff = {
  path: string;
  original_content: string;
  documented_content: string;
};

type ConfidenceFlag = {
  path: string;
  confidence: string;
  reason: string;
};

type PipelineResponse = {
  pr_url?: string;
  status?: string;
  context_md?: string;
  readme_md?: string;
  completed_files?: Record<string, string>;
  skipped_files?: Array<{ path: string; reason?: string }>;
  file_diffs?: FileDiff[];
  confidence_flags?: ConfidenceFlag[];
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
};

const steps = [
  { key: "tree_fetch", label: "Fetching repo structure" },
  { key: "file_done", label: "Generating docstrings" },
  { key: "context_done", label: "Building CONTEXT.md" },
  { key: "readme_done", label: "Generating README" },
  { key: "pr_done", label: "Creating Pull Request" },
];

function parseContextSections(context: string) {
  const lines = context.split("\n");
  const tableLines = lines.filter((l) => l.includes("|") && l.trim().startsWith("|"));
  const securityLines = lines.filter((l) => /security|auth|token|permission/i.test(l));
  return { tableLines, securityLines };
}

export function DashboardClient({
  accessToken,
}: {
  accessToken: string;
}) {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>("");
  const [loadingRepos, setLoadingRepos] = useState(true);
  const [running, setRunning] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(-1);
  const [prUrl, setPrUrl] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [contextMd, setContextMd] = useState<string>("");
  const [fileDiffs, setFileDiffs] = useState<FileDiff[]>([]);
  const [confidenceFlags, setConfidenceFlags] = useState<ConfidenceFlag[]>([]);
  const [selectedDiffPath, setSelectedDiffPath] = useState<string>("");
  const [projectId, setProjectId] = useState<string>("");

  const backendUrl = useMemo(() => process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000", []);

  useEffect(() => {
    const loadRepos = async () => {
      setLoadingRepos(true);
      setError("");
      try {
        const res = await fetch("https://api.github.com/user/repos", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/vnd.github+json",
          },
        });
        if (!res.ok) {
          let detail = "";
          try {
            const data = await res.json();
            detail = data?.message ? `: ${data.message}` : "";
          } catch {
            detail = "";
          }
          throw new Error(`GitHub repo fetch failed (${res.status})${detail}`);
        }
        const data = (await res.json()) as Repo[];
        setRepos(data);
      } catch (err) {
        setError(String(err));
      } finally {
        setLoadingRepos(false);
      }
    };
    void loadRepos();
  }, [accessToken]);

  const selectedDiff = fileDiffs.find((d) => d.path === selectedDiffPath) ?? fileDiffs[0];
  const { tableLines, securityLines } = parseContextSections(contextMd);
  const canGenerate = Boolean(selectedRepo) && !running && !loadingRepos;

  const generateDocs = async () => {
    if (!selectedRepo) return;
    const [owner, repo] = selectedRepo.split("/");

    setRunning(true);
    setActiveStep(0);
    setPrUrl("");
    setError("");
    setContextMd("");
    setFileDiffs([]);
    setConfidenceFlags([]);
    setSelectedDiffPath("");
    setProjectId("");

    const startedAt = Date.now();
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 15 * 60 * 1000);

    try {
      const res = await fetch(`${backendUrl}/repos/docstring-pipeline/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner, repo, github_token: accessToken, max_files: 20 }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`Pipeline failed (${res.status}): ${await res.text()}`);
      if (!res.body) throw new Error("Streaming body missing");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finalResult: PipelineResponse | null = null;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const eventChunk of events) {
          const dataLine = eventChunk.split("\n").find((line) => line.startsWith("data:"));
          if (!dataLine) continue;

          const payload = JSON.parse(dataLine.slice(5).trim()) as {
            stage: string;
            pr_url?: string;
            result?: PipelineResponse;
          };

          switch (payload.stage) {
            case "tree_fetch":
              setActiveStep(0);
              break;
            case "file_done":
              setActiveStep(1);
              break;
            case "context_done":
              setActiveStep(2);
              break;
            case "readme_done":
              setActiveStep(3);
              break;
            case "pr_done":
              setActiveStep(4);
              if (payload.pr_url) setPrUrl(payload.pr_url);
              break;
            case "pipeline_done":
              finalResult = payload.result ?? null;
              break;
            default:
              break;
          }
        }
      }

      const data = finalResult;
      if (!data) throw new Error("Pipeline did not return final result");

      setPrUrl(data.pr_url ?? "");
      setContextMd(data.context_md ?? "");
      setFileDiffs(data.file_diffs ?? []);
      setConfidenceFlags(data.confidence_flags ?? []);
      if ((data.file_diffs ?? []).length > 0) setSelectedDiffPath(data.file_diffs![0].path);

      const durationMs = Date.now() - startedAt;
      const runRes = await fetch("/api/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner,
          repo,
          status: data.status ?? "partial",
          pr_url: data.pr_url ?? null,
          context_md: data.context_md ?? null,
          readme_md: data.readme_md ?? null,
          completed_files: data.completed_files ?? {},
          skipped_files: data.skipped_files ?? [],
          file_diffs: data.file_diffs ?? [],
          confidence_flags: data.confidence_flags ?? [],
          max_files: 20,
          duration_ms: durationMs,
          usage: data.usage ?? { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
        }),
      });
      if (runRes.ok) {
        const runData = await runRes.json();
        if (runData?.project?.id) setProjectId(runData.project.id);
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        setError("Pipeline timed out after 15 minutes. Try a smaller repo or reduce max_files.");
      } else {
        setError(String(err));
      }
    } finally {
      window.clearTimeout(timeoutId);
      setRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <AppNavbar />

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-3">
        <section className="glass-panel rounded-2xl p-5 lg:col-span-1">
          <h2 className="mb-4 text-lg font-semibold">Pipeline</h2>
          <label className="mb-2 block text-xs uppercase tracking-wider text-indigo-300">Repository</label>
          <select
            value={selectedRepo}
            onChange={(e) => setSelectedRepo(e.target.value)}
            className="mb-4 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-3 text-sm"
          >
            <option value="">{loadingRepos ? "Loading repositories..." : "Select a repository"}</option>
            {repos.map((repo) => (
              <option key={repo.full_name} value={repo.full_name}>{repo.full_name}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => {
              if (!canGenerate) return;
              void generateDocs();
            }}
            aria-disabled={!canGenerate}
            className={`mb-5 w-full rounded-xl px-4 py-3 text-sm font-semibold ${
              canGenerate ? "bg-indigo-600 hover:bg-indigo-500" : "cursor-not-allowed bg-indigo-900/60 opacity-50"
            }`}
          >
            {running ? "Generating..." : "Generate Docs"}
          </button>

          <div className="space-y-2">
            {steps.map((step, idx) => {
              const status = idx < activeStep ? "done" : idx === activeStep ? "active" : "pending";
              return (
                <div key={step.key} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm">
                  <span className={status === "pending" ? "text-zinc-500" : "text-zinc-100"}>{step.label}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      status === "done"
                        ? "bg-emerald-500/15 text-emerald-300"
                        : status === "active"
                          ? "bg-indigo-500/15 text-indigo-300"
                          : "bg-zinc-800 text-zinc-500"
                    }`}
                  >
                    {status}
                  </span>
                </div>
              );
            })}
          </div>

          {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}
          {prUrl ? (
            <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm">
              <p className="mb-1 text-emerald-200">Pull Request Created</p>
              <a className="text-emerald-300 underline" href={prUrl} target="_blank" rel="noreferrer">{prUrl}</a>
              {projectId ? (
                <p className="mt-2">
                  <Link className="text-indigo-300 underline" href={`/projects/${projectId}`}>Open Project Details</Link>
                </p>
              ) : null}
            </div>
          ) : null}
        </section>

        <section className="glass-panel rounded-2xl p-5 lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">Before / After Diff</h2>
          {fileDiffs.length === 0 ? (
            <p className="text-sm text-zinc-500">Run the pipeline to see transformation diff.</p>
          ) : (
            <>
              <select
                className="mb-4 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                value={selectedDiffPath}
                onChange={(e) => setSelectedDiffPath(e.target.value)}
              >
                {fileDiffs.map((d) => (
                  <option key={d.path} value={d.path}>{d.path}</option>
                ))}
              </select>
              {selectedDiff ? (
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  <div>
                    <p className="mb-2 text-xs uppercase tracking-wide text-zinc-400">Original</p>
                    <pre className="max-h-[420px] overflow-auto rounded-xl border border-zinc-800 bg-black/30 p-3 text-xs whitespace-pre-wrap">{selectedDiff.original_content}</pre>
                  </div>
                  <div>
                    <p className="mb-2 text-xs uppercase tracking-wide text-zinc-400">Documented</p>
                    <pre className="max-h-[420px] overflow-auto rounded-xl border border-zinc-800 bg-black/30 p-3 text-xs whitespace-pre-wrap">{selectedDiff.documented_content}</pre>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </section>

        <section className="glass-panel rounded-2xl p-5 lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">CONTEXT.md Viewer</h2>
          {!contextMd ? (
            <p className="text-sm text-zinc-500">No context generated yet.</p>
          ) : (
            <div className="space-y-4">
              {tableLines.length > 0 ? (
                <div>
                  <p className="mb-2 text-xs uppercase tracking-wide text-zinc-400">Module Table</p>
                  <pre className="rounded-xl border border-zinc-800 bg-black/30 p-3 text-xs whitespace-pre-wrap">{tableLines.join("\n")}</pre>
                </div>
              ) : null}

              {securityLines.length > 0 ? (
                <div>
                  <p className="mb-2 text-xs uppercase tracking-wide text-zinc-400">Security Notes</p>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-200">
                    {securityLines.slice(0, 12).map((line, i) => (
                      <li key={`${line}-${i}`}>{line}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <details>
                <summary className="cursor-pointer text-sm text-indigo-300">Show full context</summary>
                <pre className="mt-3 max-h-[420px] overflow-auto rounded-xl border border-zinc-800 bg-black/30 p-3 text-xs whitespace-pre-wrap">{contextMd}</pre>
              </details>
            </div>
          )}
        </section>

        <section className="glass-panel rounded-2xl p-5 lg:col-span-1">
          <h2 className="mb-4 text-lg font-semibold">Confidence Flags</h2>
          {confidenceFlags.length === 0 ? (
            <p className="text-sm text-zinc-500">No confidence flags yet.</p>
          ) : (
            <div className="space-y-2">
              {confidenceFlags.map((flag) => (
                <div key={flag.path} className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-2">
                  <p className="truncate text-sm text-zinc-200">{flag.path}</p>
                  <p className={`text-xs ${flag.confidence === "low" ? "text-amber-300" : "text-emerald-300"}`}>
                    {flag.confidence} · {flag.reason}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
