import { getServerSession } from "next-auth";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { id } = await ctx.params;
  const project = await prisma.project.findFirst({ where: { id, userId: user.id } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const url = new URL(req.url);
  const filePath = url.searchParams.get("path") ?? "README.md";

  if (path.isAbsolute(filePath) || filePath.includes("..")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const baseDir = path.resolve(process.cwd(), project.storagePath);
  const absolutePath = path.resolve(baseDir, filePath);

  if (!absolutePath.startsWith(baseDir)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  try {
    const content = await readFile(absolutePath, "utf8");
    return NextResponse.json({ path: filePath, content });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
