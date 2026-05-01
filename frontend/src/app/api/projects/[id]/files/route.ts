import { getServerSession } from "next-auth";
import path from "node:path";
import { NextResponse } from "next/server";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/db";
import { readTextObject } from "@/lib/storage";

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

  const normalizedPath = filePath.replaceAll(path.sep, "/");
  if (normalizedPath.startsWith("/")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const storagePrefix = project.storagePath.replaceAll(path.sep, "/");
  const objectKey = path.posix.join(storagePrefix, normalizedPath);

  try {
    const content = await readTextObject(objectKey);
    return NextResponse.json({ path: filePath, content });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
