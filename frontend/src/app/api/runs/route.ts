```typescript
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import path from "node:path";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/db";
import { putTextObject } from "@/lib/storage";

/**
 * Represents a file item with its path and an optional reason for skipping.
 */
type FileItem = { path: string; reason?: string };

/**
 * Handles GET requests to retrieve the authenticated user's pipeline runs.
 *
 * Fetches up to 100 most recent pipeline runs for the authenticated user,
 * including associated files, ordered by creation date descending.
 *
 * @returns A NextResponse containing a JSON object with the user's runs.
 *          If the user is not authenticated, returns a 401 response.
 *          If the user record is not found, returns an empty runs array.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return NextResponse.json({ runs: [] });
  }

  const runs = await prisma.pipelineRun.findMany({
    where: { userId: user.id },
    include: { files: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ runs });
}

/**
 * Handles POST requests to create a new pipeline run and project record.
 *
 * Expects a JSON body containing pipeline run details such as owner, repo,
 * status, PR URL, context/readme markdown, completed/skipped files, and usage
 * statistics. Writes the README.md, CONTEXT.md, and completed file contents
 * to object storage, then creates corresponding database records for the run
 * and project.
 *
 * @param req - The incoming request object containing the JSON body.
 * @returns A NextResponse containing a JSON object with the created run and project.
 *          Returns 401 if the user is not authenticated, or 404 if the user record
 *          is not found.
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const body = await req.json();
  const {
    owner,
    repo,
    status,
    pr_url,
    context_md,
    readme_md,
    completed_files,
    skipped_files,
    max_files,
    duration_ms,
    usage,
  } = body;

  const completedEntries: [string, string][] = Object.entries(completed_files ?? {});
  const skippedEntries: FileItem[] = Array.isArray(skipped_files) ? skipped_files : [];
  const now = new Date();
  const timestampDir = now.toISOString().replace(/[:.]/g, "-");
  const storagePath = path.join("storage", owner, repo, timestampDir);
  const storagePrefix = storagePath.replaceAll(path.sep, "/");

  await putTextObject(`${storagePrefix}/README.md`, String(readme_md ?? ""));
  await putTextObject(`${storagePrefix}/CONTEXT.md`, String(context_md ?? ""));

  await Promise.all(
    completedEntries.map(async ([filePath, content]) => {
      const objectPath = path.posix.join(storagePrefix, filePath.replaceAll(path.sep, "/"));
      await putTextObject(objectPath, String(content ?? ""));
    }),
  );

  const run = await prisma.pipelineRun.create({
    data: {
      userId: user.id,
      owner,
      repo,
      status: status ?? "partial",
      prUrl: pr_url ?? null,
      contextMd: context_md ?? null,
      readmeMd: readme_md ?? null,
      completedCount: completedEntries.length,
      skippedCount: skippedEntries.length,
      maxFiles: Number(max_files ?? 20),
      durationMs: duration_ms ?? null,
      promptTokens: usage?.prompt_tokens ?? null,
      completionTokens: usage?.completion_tokens ?? null,
      totalTokens: usage?.total_tokens ?? null,
      files: {
        create: [
          ...completedEntries.map(([path, content]) => ({
            path,
            status: "completed",
            reason: null,
            charCount: String(content ?? "").length,
          })),
          ...skippedEntries.map((item) => ({
            path: item.path,
            status: "skipped",
            reason: item.reason ?? "unknown",
            charCount: null,
          })),
        ],
      },
    },
    include: { files: true },
  });

  const project = await prisma.project.create({
    data: {
      userId: user.id,
      owner,
      repo,
      timestamp: now,
      prUrl: pr_url ?? null,
      status: status ?? "partial",
      fileCount: completedEntries.length,
      skippedCount: skippedEntries.length,
      tokenUsage: usage?.total_tokens ?? 0,
      durationMs: duration_ms ?? 0,
      storagePath,
      fileDiffsJson: JSON.stringify(body.file_diffs ?? []),
      confidenceJson: JSON.stringify(body.confidence_flags ?? []),
    },
  });

  return NextResponse.json({ run, project });
}
```