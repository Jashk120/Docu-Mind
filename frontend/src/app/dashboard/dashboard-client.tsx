"use client";

import { useEffect, useMemo, useState } from "react";

type Repo = {
  full_name: string;
};

type PipelineResponse = {
  pr_url?: string;
};

const steps = [
  "Fetching repo structure",
  "Generating docstrings",
  "Building CONTEXT.md",
  "Generating README",
  "Creating Pull Request",
];

export function DashboardClient({
  accessToken,
  userName,
  userImage,
}: {
  accessToken: string;
  userName?: string;
  userImage?: string;
}) {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>("");
  const [loadingRepos, setLoadingRepos] = useState(true);
  const [running, setRunning] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(-1);
  const [prUrl, setPrUrl] = useState<string>("");
  const [error, setError] = useState<string>("");

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
          throw new Error(`GitHub repo fetch failed (${res.status})`);
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

  const generateDocs = async () => {
    if (!selectedRepo) return;
    const [owner, repo] = selectedRepo.split("/");

    setRunning(true);
    setActiveStep(0);
    setPrUrl("");
    setError("");

    const timer = window.setInterval(() => {
      setActiveStep((prev) => {
        if (prev >= steps.length - 1) return prev;
        return prev + 1;
      });
    }, 1500);
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 15 * 60 * 1000);

    try {
      const res = await fetch(`${backendUrl}/repos/docstring-pipeline`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ owner, repo, github_token: accessToken, max_files: 20 }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`Pipeline failed (${res.status}): ${await res.text()}`);
      }

      const data = (await res.json()) as PipelineResponse;
      setActiveStep(steps.length - 1);
      setPrUrl(data.pr_url ?? "");
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        setError("Pipeline timed out after 15 minutes. Try a smaller repo or reduce max_files.");
      } else {
        setError(String(err));
      }
    } finally {
      window.clearInterval(timer);
      window.clearTimeout(timeoutId);
      setRunning(false);
    }
  };

  return (
    <>
      <nav className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-8 h-16 bg-slate-950/80 backdrop-blur-lg border-b border-white/10 shadow-[0_10px_40px_-15px_rgba(99,102,241,0.2)]">
        <div className="flex items-center gap-8">
          <span className="text-xl font-bold tracking-tight text-slate-50 font-[Manrope] antialiased">DocuMind AI</span>
          <div className="hidden md:flex items-center gap-6">
            <span className="text-indigo-400 font-semibold border-b-2 border-indigo-500 pb-1 font-[Manrope] text-sm">Dashboard</span>
            <span className="text-slate-400 font-medium">Projects</span>
            <span className="text-slate-400 font-medium">Documentation</span>
            <span className="text-slate-400 font-medium">Analytics</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-slate-400 text-sm">{userName ?? "GitHub User"}</span>
          <div className="h-8 w-8 rounded-full overflow-hidden border border-indigo-500/30">
            {userImage ? <img alt="User avatar" className="h-full w-full object-cover" src={userImage} /> : null}
          </div>
        </div>
      </nav>

      <aside className="fixed left-0 top-16 bottom-0 flex flex-col z-40 h-full w-64 border-r border-white/10 bg-slate-950/50 backdrop-blur-xl shadow-2xl shadow-indigo-900/20 font-[Manrope] text-sm">
        <div className="p-6">
          <button className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-indigo-500/20">
            <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
            Generate
          </button>
        </div>
      </aside>

      <main className="pl-64 pt-16 min-h-screen bg-background text-on-background">
        <div className="max-w-4xl mx-auto px-8 py-12">
          <header className="mb-10 text-center">
            <h1 className="text-4xl font-bold text-white mb-2">Workspace Dashboard</h1>
            <p className="text-[#a1a1aa]">Synthesize and automate your documentation with enterprise AI.</p>
          </header>

          <section className="glass-panel rounded-[32px] p-8 ai-glow relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
            <div className="relative z-10 space-y-10">
              <div>
                <label className="block text-sm text-indigo-300 uppercase tracking-widest mb-4">Select Repository</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-indigo-400">search</span>
                  </div>
                  <select
                    value={selectedRepo}
                    onChange={(e) => setSelectedRepo(e.target.value)}
                    className="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all cursor-pointer"
                  >
                    <option value="">{loadingRepos ? "Loading repositories..." : "Select a repository"}</option>
                    {repos.map((repo) => (
                      <option key={repo.full_name} value={repo.full_name}>
                        {repo.full_name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-slate-500">keyboard_arrow_down</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={generateDocs}
                  disabled={!selectedRepo || running || loadingRepos}
                  className="group relative px-10 py-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-full font-semibold text-white shadow-2xl shadow-indigo-600/30 transition-all active:scale-95 flex items-center gap-3 overflow-hidden"
                >
                  <span className={`material-symbols-outlined text-[28px] ${running ? "spinner" : "animate-pulse"}`}>auto_awesome</span>
                  {running ? "Generating..." : "Generate Docs"}
                  <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                </button>
              </div>

              <div className="space-y-6">
                <label className="block text-sm text-indigo-300 uppercase tracking-widest">Processing Pipeline</label>
                <div className="space-y-4">
                  {steps.map((step, idx) => {
                    const status = idx < activeStep ? "done" : idx === activeStep ? "active" : "pending";
                    return (
                      <div
                        key={step}
                        className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                          status === "done"
                            ? "bg-white/5 border-white/5"
                            : status === "active"
                              ? "bg-indigo-500/5 border-indigo-500/20 ai-glow"
                              : "bg-transparent border-dashed border-white/10 opacity-50"
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-800/70">
                          {status === "done" ? (
                            <span className="material-symbols-outlined text-emerald-400 text-[20px]">check</span>
                          ) : status === "active" ? (
                            <span className="material-symbols-outlined text-indigo-400 text-[24px] spinner">progress_activity</span>
                          ) : (
                            <span className="text-xs text-slate-500">{String(idx + 1).padStart(2, "0")}</span>
                          )}
                        </div>
                        <span className={`flex-1 ${status === "pending" ? "text-slate-400" : "text-white"}`}>{step}</span>
                        <span
                          className={`text-xs px-3 py-1 rounded-full uppercase ${
                            status === "done"
                              ? "text-emerald-400 bg-emerald-400/10"
                              : status === "active"
                                ? "text-indigo-400 bg-indigo-400/10"
                                : "text-slate-500 bg-slate-800"
                          }`}
                        >
                          {status === "done" ? "Completed" : status === "active" ? "In Progress" : "Pending"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {prUrl ? (
            <section className="mt-8 transition-all">
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-[24px] p-6 flex items-center justify-between group cursor-pointer hover:bg-emerald-500/15">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-emerald-400 text-[28px]">check_circle</span>
                  </div>
                  <div>
                    <h3 className="text-emerald-100 text-[18px] font-semibold">Pull Request Created</h3>
                    <p className="text-emerald-400/70 text-sm">Your documentation update is ready for review.</p>
                  </div>
                </div>
                <a className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-semibold" href={prUrl} target="_blank" rel="noreferrer">
                  View on GitHub
                  <span className="material-symbols-outlined">open_in_new</span>
                </a>
              </div>
            </section>
          ) : null}

          {error ? <p className="mt-6 text-sm text-red-400">{error}</p> : null}
        </div>
      </main>
    </>
  );
}
