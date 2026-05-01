```typescript
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/db";
import { deletePrefix } from "@/lib/storage";

/**
 * Handles GET requests to retrieve a project by its ID for the authenticated user.
 *
 * @param _ - The incoming HTTP request (unused in this handler).
 * @param ctx - The route context containing the project ID parameter.
 * @param ctx.params - A promise that resolves to an object with the project's `id`.
 * @returns A JSON response containing the project object on success, or an error response with
 *          status 401 (Unauthorized), 404 (Not found / User not found), or 500 on server error.
 */
export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { id } = await ctx.params;
  const project = await prisma.project.findFirst({ where: { id, userId: user.id } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ project });
}

/**
 * Handles DELETE requests to remove a project by its ID for the authenticated user,
 * including deletion of related storage resources.
 *
 * @param _ - The incoming HTTP request (unused in this handler).
 * @param ctx - The route context containing the project ID parameter.
 * @param ctx.params - A promise that resolves to an object with the project's `id`.
 * @returns A JSON response indicating success (`{ ok: true }`) on deletion, or an error
 *          response with status 401 (Unauthorized), 404 (Not found / User not found),
 *          or 500 on server error.
 */
export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { id } = await ctx.params;
  const existing = await prisma.project.findFirst({ where: { id, userId: user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await deletePrefix(`${existing.storagePath.replaceAll("\\", "/")}/`);
  await prisma.project.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
```