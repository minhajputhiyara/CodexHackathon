import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCurrentUser } from "@/lib/auth";
import { getProjectsCollection, toProjectSummary } from "@/lib/projects-db";
import { normalizeProject } from "@/lib/website-project";
import type { WebsiteProject } from "@/lib/website-project-schema";

type ProjectParams = {
  params: Promise<{
    projectId: string;
  }>;
};

type UpdateProjectRequest = {
  project?: WebsiteProject;
};

async function findUserProject(projectId: string) {
  const user = await getCurrentUser();

  if (!user) {
    return { error: "Authentication required.", status: 401 as const };
  }

  if (!ObjectId.isValid(projectId)) {
    return { error: "Project not found.", status: 404 as const };
  }

  const projects = await getProjectsCollection();
  const project = await projects.findOne({
    _id: new ObjectId(projectId),
    userId: user._id,
  });

  if (!project) {
    return { error: "Project not found.", status: 404 as const };
  }

  return { project, projects };
}

export async function GET(_request: Request, context: ProjectParams) {
  const { projectId } = await context.params;
  const result = await findUserProject(projectId);

  if ("error" in result) {
    return NextResponse.json({ message: result.error }, { status: result.status });
  }

  return NextResponse.json({
    project: result.project.project,
    summary: toProjectSummary(result.project),
  });
}

export async function PATCH(request: Request, context: ProjectParams) {
  const { projectId } = await context.params;
  const result = await findUserProject(projectId);

  if ("error" in result) {
    return NextResponse.json({ message: result.error }, { status: result.status });
  }

  const body = (await request.json().catch(() => null)) as UpdateProjectRequest | null;

  if (!body?.project) {
    return NextResponse.json({ message: "Project is required." }, { status: 400 });
  }

  const normalizedProject = normalizeProject(body.project);
  const updatedAt = new Date();

  await result.projects.updateOne(
    { _id: result.project._id, userId: result.project.userId },
    {
      $set: {
        project: normalizedProject,
        updatedAt,
      },
    },
  );

  return NextResponse.json({
    project: normalizedProject,
    summary: toProjectSummary({
      ...result.project,
      project: normalizedProject,
      updatedAt,
    }),
  });
}
