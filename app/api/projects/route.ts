import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCurrentUser } from "@/lib/auth";
import {
  ensureStarterProject,
  getProjectsCollection,
  toProjectSummary,
} from "@/lib/projects-db";
import { normalizeProject } from "@/lib/website-project";
import type { WebsiteProject } from "@/lib/website-project-schema";

type CreateProjectRequest = {
  project?: WebsiteProject;
};

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

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as CreateProjectRequest | null;

  if (!body?.project) {
    return NextResponse.json({ message: "Project is required." }, { status: 400 });
  }

  const normalizedProject = normalizeProject(body.project);
  const projects = await getProjectsCollection();
  const now = new Date();
  const result = await projects.insertOne({
    _id: new ObjectId(),
    createdAt: now,
    updatedAt: now,
    userId: user._id,
    project: normalizedProject,
  });

  const createdProject = {
    _id: result.insertedId,
    createdAt: now,
    updatedAt: now,
    userId: user._id,
    project: normalizedProject,
  };

  return NextResponse.json({
    project: normalizedProject,
    summary: toProjectSummary(createdProject),
  });
}
