"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { ElementInspector } from "@/components/element-inspector";
import { ExportPanel } from "@/components/export-panel";
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
      <section className="flex min-h-[720px] items-center justify-center rounded-md border border-slate-200 bg-white text-sm text-slate-500">
        Loading workspace...
      </section>
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
  const [prompt, setPrompt] = useState<string>(demoPrompts[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

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

  const resetCanvas = () => {
    const nextProject = normalizeProject(sampleWebsiteProject);
    setProject(nextProject);
    setSelectedPageId(nextProject.pages[0]?.id ?? null);
    setSelectedElementId(`${nextProject.pages[0]?.id}-headline`);
    setStatusMessage("Reset to the backup sample website.");
  };

  const selectPage = (pageId: string) => {
    setSelectedPageId(pageId);
    setSelectedElementId(null);
  };

  const selectElement = (pageId: string, elementId: string) => {
    setSelectedPageId(pageId);
    setSelectedElementId(elementId);
  };

  const generateUi = async () => {
    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt) {
      setStatusMessage("Enter a prompt to generate UI.");
      return;
    }

    setIsGenerating(true);
    setStatusMessage(null);

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
        setStatusMessage("Generation did not return a website project.");
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

      setStatusMessage(
        data.message ??
          (data.fallback ? "Loaded fallback website." : "Generated website."),
      );
    } catch {
      const nextProject = normalizeProject(sampleWebsiteProject);
      setProject(nextProject);
      setSelectedPageId(nextProject.pages[0]?.id ?? null);
      setSelectedElementId(null);
      setStatusMessage("Generation failed. Loaded the sample website instead.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-5 px-5 py-5">
        <header className="flex flex-col gap-3 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold text-teal-700">UIForge</p>
            <h1 className="text-2xl font-bold">AI-first UI canvas</h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span className="rounded-md border border-slate-300 bg-white px-3 py-2">
              tldraw workspace
            </span>
            <span className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700">
              Multi-page canvas
            </span>
          </div>
        </header>

        <div className="grid flex-1 gap-5 xl:grid-cols-[320px_minmax(0,1fr)_360px]">
          <aside className="flex flex-col gap-4">
            <div className="rounded-md border border-slate-200 bg-white p-4">
              <label
                className="mb-2 block text-sm font-semibold text-slate-800"
                htmlFor="prompt"
              >
                Prompt
              </label>
              <div className="flex flex-col gap-3 md:flex-row">
                <textarea
                  id="prompt"
                  className="min-h-24 flex-1 resize-none rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                  onChange={(event) => setPrompt(event.target.value)}
                  value={prompt}
                />
                <button
                  className="rounded-md bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                  disabled={isGenerating}
                  onClick={generateUi}
                  type="button"
                >
                  {isGenerating ? "Generating..." : "Generate"}
                </button>
              </div>
              {statusMessage ? (
                <p className="mt-3 text-sm text-slate-600">{statusMessage}</p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                {demoPrompts.map((demoPrompt) => (
                  <button
                    className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                    key={demoPrompt}
                    onClick={() => setPrompt(demoPrompt)}
                    type="button"
                  >
                    {demoPrompt}
                  </button>
                ))}
                <button
                  className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                  onClick={resetCanvas}
                  type="button"
                >
                Reset
                </button>
              </div>
            </div>

            <PageListPanel
              onSelectPage={selectPage}
              project={project}
              selectedPageId={selectedPageId}
            />
          </aside>

          <TldrawSiteCanvas
            onFrameChange={(pageId, frame) =>
              setProject((currentProject) =>
                updatePageFrame(currentProject, pageId, frame),
              )
            }
            onSelectElement={selectElement}
            onSelectPage={selectPage}
            project={project}
            selectedElementId={selectedElementId}
            selectedPageId={selectedPageId}
          />

          <aside className="flex flex-col gap-4">
            <section className="rounded-md border border-slate-200 bg-white p-4">
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
            </section>

            <ExportPanel project={project} selectedPageId={selectedPageId} />

            <section className="rounded-md border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-slate-900">
                Project JSON
              </h3>
              <pre className="mt-2 max-h-72 overflow-auto rounded-md bg-slate-950 p-3 text-xs leading-5 text-slate-100">
                {JSON.stringify(project, null, 2)}
              </pre>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
