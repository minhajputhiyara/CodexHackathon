import { NextResponse } from "next/server";
import { getCurrentUser, safeUser } from "@/lib/auth";
import { ensureStarterProject } from "@/lib/projects-db";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  await ensureStarterProject(user._id);

  return NextResponse.json({ user: safeUser(user) });
}
