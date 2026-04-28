"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookOpenText,
  CheckCircle2,
  FileCheck2,
  FileSearch,
  GitPullRequest,
  Loader2,
  Search,
  Sparkles,
} from "lucide-react";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

type Repo = {
  full_name: string;
};

type PipelineResponse = {
  pr_url?: string;
};

const steps = [
  { label: "Fetching repo structure", icon: FileSearch },
  { label: "Generating docstrings", icon: FileCheck2 },
  { label: "Building CONTEXT.md", icon: BookOpenText },
  { label: "Generating README", icon: BookOpenText },
  { label: "Creating Pull Request", icon: GitPullRequest },
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
  const [repoQuery, setRepoQuery] = useState("");

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

  const filteredRepos = useMemo(() => {
    const q = repoQuery.trim().toLowerCase();
    if (!q) return repos;
    return repos.filter((r) => r.full_name.toLowerCase().includes(q));
  }, [repos, repoQuery]);

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
    <main className="min-h-screen bg-[#0a0a0a] px-6 py-6 text-white">
      <header className="mx-auto mb-6 flex w-full max-w-4xl items-center justify-between rounded-xl border border-zinc-800 bg-[#111111] px-5 py-3 shadow-[0_0_40px_rgba(0,0,0,0.35)]">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-md bg-gradient-to-br from-indigo-500 to-indigo-300" />
          <h1 className="text-lg font-semibold tracking-tight">DocuMind</h1>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-sm text-[#a1a1aa]">{userName ?? "GitHub User"}</p>
          {userImage ? (
            <Image src={userImage} alt="User avatar" width={32} height={32} className="h-8 w-8 rounded-full ring-1 ring-zinc-700" />
          ) : (
            <div className="h-8 w-8 rounded-full bg-zinc-800 ring-1 ring-zinc-700" />
          )}
        </div>
      </header>

      <Card className="mx-auto max-w-4xl border-zinc-800 bg-[#111111] shadow-[0_0_60px_rgba(99,102,241,0.08)] transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Documentation Pipeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm font-medium text-[#a1a1aa]">Repository</p>
            <Select value={selectedRepo} onValueChange={setSelectedRepo}>
              <SelectTrigger className="h-11 rounded-lg border-zinc-700 bg-zinc-950 text-white hover:border-indigo-500">
                <SelectValue placeholder={loadingRepos ? "Loading repos..." : "Select a repository"} />
              </SelectTrigger>
              <SelectContent className="border-zinc-700 bg-[#0f0f10]">
                <div className="mb-2 flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-950 px-2">
                  <Search className="h-4 w-4 text-[#a1a1aa]" />
                  <input
                    value={repoQuery}
                    onChange={(e) => setRepoQuery(e.target.value)}
                    placeholder="Search repositories..."
                    className="h-9 w-full bg-transparent text-sm text-white outline-none placeholder:text-[#71717a]"
                  />
                </div>
                <div className="max-h-60 overflow-auto">
                  {filteredRepos.map((repo) => (
                    <SelectItem key={repo.full_name} value={repo.full_name}>
                      {repo.full_name}
                    </SelectItem>
                  ))}
                  {!loadingRepos && filteredRepos.length === 0 ? (
                    <p className="px-2 py-2 text-sm text-[#a1a1aa]">No repositories found</p>
                  ) : null}
                </div>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={generateDocs}
            disabled={!selectedRepo || running || loadingRepos}
            className="h-11 w-full gap-2 rounded-lg bg-[#6366f1] text-white transition-all duration-200 hover:bg-indigo-500 hover:shadow-[0_0_22px_rgba(99,102,241,0.5)]"
          >
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {running ? "Generating..." : "Generate Docs"}
          </Button>

          <Separator className="bg-zinc-800" />

          <div className="space-y-2">
            {steps.map((step, idx) => {
              const status = idx < activeStep ? "done" : idx === activeStep ? "active" : "pending";
              const Icon = step.icon;
              return (
                <div
                  key={step.label}
                  className="flex items-center justify-between rounded-md px-2 py-2 transition-all duration-300 hover:bg-zinc-900/60"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-[#a1a1aa]" />
                    <span className="text-sm text-zinc-200">{step.label}</span>
                  </div>
                  <Badge
                    className={`gap-1 border transition-all duration-300 ${
                      status === "done"
                        ? "border-emerald-400/60 bg-emerald-500/15 text-emerald-300 shadow-[0_0_12px_rgba(74,222,128,0.45)]"
                        : status === "active"
                          ? "border-indigo-400/60 bg-indigo-500/15 text-indigo-300"
                          : "border-zinc-700 bg-zinc-900 text-[#a1a1aa]"
                    }`}
                  >
                    {status === "done" ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
                    {status === "active" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                    {status}
                  </Badge>
                </div>
              );
            })}
          </div>

          {prUrl ? (
            <Card className="relative overflow-hidden border-emerald-400/40 bg-emerald-500/10 shadow-[0_0_40px_rgba(16,185,129,0.25)] transition-all duration-500">
              <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-emerald-300/20 blur-2xl animate-pulse-glow" />
              <div className="pointer-events-none absolute left-6 top-4 h-2 w-2 rounded-full bg-emerald-300 animate-ping" />
              <div className="pointer-events-none absolute left-16 top-10 h-2 w-2 rounded-full bg-emerald-200 animate-ping" />
              <div className="pointer-events-none absolute right-16 bottom-8 h-2 w-2 rounded-full bg-emerald-300 animate-ping" />
              <CardContent className="p-5">
                <p className="text-base font-semibold text-emerald-200">Pull request created successfully</p>
                <a
                  className="mt-2 inline-block text-sm text-emerald-100 underline underline-offset-4 hover:text-white"
                  href={prUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {prUrl}
                </a>
              </CardContent>
            </Card>
          ) : null}

          {error ? <p className="text-sm text-red-400">{error}</p> : null}
        </CardContent>
      </Card>
    </main>
  );
}
