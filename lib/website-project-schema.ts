import type { UIElementNode } from "@/lib/ui-schema";

export type PageFrame = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type WebsitePage = {
  id: string;
  name: string;
  route: string;
  tree: UIElementNode;
  frame: PageFrame;
};

export type WebsiteProject = {
  id: string;
  name: string;
  pages: WebsitePage[];
};

