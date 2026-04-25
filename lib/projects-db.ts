import { ObjectId, type Collection } from "mongodb";
import { sampleWebsiteProject } from "@/lib/sample-website-project";
import { getDb } from "@/lib/mongodb";
import type { WebsiteProject } from "@/lib/website-project-schema";

export type ProjectDocument = {
  _id: ObjectId;
  createdAt: Date;
  updatedAt: Date;
  userId: ObjectId;
  project: WebsiteProject;
};

export type ProjectSummary = {
  id: string;
  name: string;
  pagesCount: number;
  updatedAt: string;
};

export async function getProjectsCollection(): Promise<Collection<ProjectDocument>> {
  const db = await getDb();
  const projects = db.collection<ProjectDocument>("projects");
  await projects.createIndex({ userId: 1, updatedAt: -1 });
  return projects;
}

export async function ensureStarterProject(userId: ObjectId) {
  const projects = await getProjectsCollection();
  const existingProject = await projects.findOne({ userId });

  if (existingProject) {
    return;
  }

  const now = new Date();
  await projects.insertOne({
    _id: new ObjectId(),
    createdAt: now,
    updatedAt: now,
    userId,
    project: {
      ...sampleWebsiteProject,
      id: `starter-${userId.toString()}`,
      name: "designPlate Starter Site",
    },
  });
}

export function toProjectSummary(project: ProjectDocument): ProjectSummary {
  return {
    id: project._id.toString(),
    name: project.project.name,
    pagesCount: project.project.pages.length,
    updatedAt: project.updatedAt.toISOString(),
  };
}
