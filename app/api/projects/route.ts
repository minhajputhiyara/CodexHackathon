import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  ensureStarterProject,
  getProjectsCollection,
  toProjectSummary,
} from "@/lib/projects-db";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  await ensureStarterProject(user._id);

  const projects = await getProjectsCollection();
  const userProjects = await projects
    .find({ userId: user._id })
    .sort({ updatedAt: -1 })
    .toArray();

  return NextResponse.json({ projects: userProjects.map(toProjectSummary) });
}
