"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { AIChatPanel } from "@/components/ai-chat-panel";
import { ElementInspector } from "@/components/element-inspector";
import { LayersPanel } from "@/components/layers-panel";
import { PageListPanel } from "@/components/page-list-panel";
import { demoPrompts } from "@/lib/demo-prompts";
import { sampleWebsiteProject } from "@/lib/sample-website-project";
import type { UIElementProps } from "@/lib/ui-schema";
import { findNodeById } from "@/lib/ui-tree";
import {
  findPageById,
  normalizeProject,
  updateNodePropsInPage,
  updatePageById,
  updatePageFrame,
  updatePageTreeById,
} from "@/lib/website-project";
import type { WebsiteProject } from "@/lib/website-project-schema";

const TldrawSiteCanvas = dynamic(
  () =>
    import("@/components/tldraw-site-canvas").then(
      (mod) => mod.TldrawSiteCanvas,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-[#0a0a0a] text-sm text-gray-500">
        Loading workspace...
      </div>
    ),
  },
);

export function EditorShell() {
  const [project, setProject] = useState<WebsiteProject>(() =>
    normalizeProject(sampleWebsiteProject),
  );
  const [selectedPageId, setSelectedPageId] = useState<string | null>("home");
  const [selectedElementId, setSelectedElementId] = useState<string | null>(
    "home-headline",
  );
  const [hoveredElementId, setHoveredElementId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [activeTab, setActiveTab] = useState<"design" | "advanced">("design");

  const selectedPage = useMemo(
    () => findPageById(project, selectedPageId),
    [project, selectedPageId],
  );
  const selectedNode = useMemo(
    () => findNodeById(selectedPage?.tree ?? project.pages[0]?.tree, selectedElementId),
    [project.pages, selectedElementId, selectedPage?.tree],
  );

  const updateSelectedNode = (props: Partial<UIElementProps>) => {
    if (!selectedPageId || !selectedElementId) {
      return;
    }

    setProject((currentProject) =>
      updateNodePropsInPage(
        currentProject,
        selectedPageId,
        selectedElementId,
        props,
      ),
    );
  };

  const selectPage = (pageId: string) => {
    setSelectedPageId(pageId);
    setSelectedElementId(null);
    setHoveredElementId(null);
  };

  const selectElement = (pageId: string, elementId: string) => {
    setSelectedPageId(pageId);
    setSelectedElementId(elementId);
  };

  const generateUi = async (prompt: string) => {
    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt) {
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch("/api/generate-ui", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: trimmedPrompt }),
      });

      const data = (await response.json()) as {
        project?: WebsiteProject;
        tree?: WebsiteProject["pages"][number]["tree"];
        fallback?: boolean;
        message?: string;
      };

      if (!data.project && !data.tree) {
        return;
      }

      if (data.project) {
        const nextProject = normalizeProject(data.project);
        setProject(nextProject);
        setSelectedPageId(nextProject.pages[0]?.id ?? null);
        setSelectedElementId(null);
      } else if (data.tree && selectedPageId) {
        setProject((currentProject) =>
          updatePageTreeById(currentProject, selectedPageId, data.tree!),
        );
        setSelectedElementId(data.tree.children?.[0]?.id ?? data.tree.id);
      }
    } catch {
      const nextProject = normalizeProject(sampleWebsiteProject);
      setProject(nextProject);
      setSelectedPageId(nextProject.pages[0]?.id ?? null);
      setSelectedElementId(null);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white">
      {/* Top Bar */}
      <div className="fixed left-0 right-0 top-0 z-50 flex h-12 items-center justify-between border-b border-[#2a2a2a] bg-[#0a0a0a] px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#8b5cf6]">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
            </svg>
          </div>
          <span className="text-sm font-medium">Untitled Project</span>
          <span className="rounded bg-[#1f1f1f] px-2 py-0.5 text-xs text-gray-400">Autosaved</span>
        </div>

        <div className="flex items-center gap-2">
          <button className="rounded p-2 hover:bg-[#1f1f1f]">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
          </button>
          <button className="rounded p-2 hover:bg-[#1f1f1f]">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </button>
          <button className="rounded p-2 hover:bg-[#1f1f1f]">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button className="rounded-md bg-[#8b5cf6] px-4 py-1.5 text-sm font-medium transition hover:bg-[#7c3aed]">
            Export
          </button>
          <div className="ml-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#8b5cf6] text-sm font-medium">
            K
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mt-12 flex w-full">
        {/* Left Sidebar - Layers */}
        <div className="w-64 border-r border-[#2a2a2a]">
          <LayersPanel
            hoveredElementId={hoveredElementId}
            onHoverElement={setHoveredElementId}
            project={project}
            selectedPageId={selectedPageId}
            selectedElementId={selectedElementId}
            onSelectElement={selectElement}
          />
        </div>

        {/* Center - Canvas */}
        <div className="flex flex-1 flex-col">
          {/* Canvas Toolbar */}
          <div className="flex items-center justify-center gap-2 border-b border-[#2a2a2a] py-2">
            <button className="rounded p-1.5 hover:bg-[#1f1f1f]">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <button className="rounded p-1.5 hover:bg-[#1f1f1f]">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
            <button className="rounded p-1.5 hover:bg-[#1f1f1f]">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            <div className="mx-2 h-6 w-px bg-[#2a2a2a]"></div>
            <button className="rounded bg-[#8b5cf6] px-3 py-1 text-xs font-medium">
              Container
            </button>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 overflow-hidden">
            <TldrawSiteCanvas
              onFrameChange={(pageId, frame) =>
                setProject((currentProject) =>
                  updatePageFrame(currentProject, pageId, frame),
                )
              }
              hoveredElementId={hoveredElementId}
              onHoverElement={setHoveredElementId}
              onSelectElement={selectElement}
              onSelectPage={selectPage}
              project={project}
              selectedElementId={selectedElementId}
              selectedPageId={selectedPageId}
            />
          </div>

          {/* Pages Bar */}
          <div className="border-t border-[#2a2a2a] p-2">
            <PageListPanel
              onSelectPage={selectPage}
              project={project}
              selectedPageId={selectedPageId}
            />
          </div>
        </div>

        {/* Right Sidebar - Chat & Properties */}
        <div className="flex w-96 flex-col border-l border-[#2a2a2a]">
          {/* Tabs */}
          <div className="flex border-b border-[#2a2a2a]">
            <button
              onClick={() => setShowChat(true)}
              className={`flex-1 border-b-2 px-4 py-3 text-sm font-medium transition ${
                showChat
                  ? "border-[#8b5cf6] text-white"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => setShowChat(false)}
              className={`flex-1 border-b-2 px-4 py-3 text-sm font-medium transition ${
                !showChat
                  ? "border-[#8b5cf6] text-white"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              Properties
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {showChat ? (
              <AIChatPanel
                onGenerate={generateUi}
                isGenerating={isGenerating}
                demoPrompts={demoPrompts}
              />
            ) : (
              <div className="h-full overflow-y-auto p-4">
                {/* Properties Tabs */}
                <div className="mb-4 flex gap-2">
                  <button
                    onClick={() => setActiveTab("design")}
                    className={`rounded px-3 py-1.5 text-sm font-medium transition ${
                      activeTab === "design"
                        ? "bg-[#8b5cf6] text-white"
                        : "bg-[#141414] text-gray-400 hover:text-white"
                    }`}
                  >
                    Design
                  </button>
                  <button
                    onClick={() => setActiveTab("advanced")}
                    className={`rounded px-3 py-1.5 text-sm font-medium transition ${
                      activeTab === "advanced"
                        ? "bg-[#8b5cf6] text-white"
                        : "bg-[#141414] text-gray-400 hover:text-white"
                    }`}
                  >
                    Advanced
                  </button>
                </div>

                <ElementInspector
                  onElementChange={updateSelectedNode}
                  onPageChange={(patch) => {
                    if (!selectedPageId) {
                      return;
                    }

                    setProject((currentProject) =>
                      updatePageById(currentProject, selectedPageId, patch),
                    );
                  }}
                  selectedNode={selectedNode}
                  selectedPage={selectedPage}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

