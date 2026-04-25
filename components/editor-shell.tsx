"use client";

import { useMemo, useState } from "react";
import { CanvasRenderer } from "@/components/canvas-renderer";
import { ElementInspector } from "@/components/element-inspector";
import { ExportPanel } from "@/components/export-panel";
import { demoPrompts } from "@/lib/demo-prompts";
import { sampleUiTree } from "@/lib/sample-ui";
import type { UIElementProps } from "@/lib/ui-schema";
import {
  assignMissingNodeIds,
  findNodeById,
  updateNodePropsById,
} from "@/lib/ui-tree";

export function EditorShell() {
  const [tree, setTree] = useState(() => assignMissingNodeIds(sampleUiTree));
  const [selectedId, setSelectedId] = useState<string | null>("headline");
  const [prompt, setPrompt] = useState<string>(demoPrompts[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const selectedNode = useMemo(
    () => findNodeById(tree, selectedId),
    [tree, selectedId],
  );

  const updateSelectedNode = (props: Partial<UIElementProps>) => {
    if (!selectedId) {
      return;
    }

    setTree((currentTree) => updateNodePropsById(currentTree, selectedId, props));
  };

  const resetCanvas = () => {
    setTree(assignMissingNodeIds(sampleUiTree));
    setSelectedId("headline");
    setStatusMessage("Reset to the backup sample UI.");
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
        tree?: typeof tree;
        fallback?: boolean;
        message?: string;
      };

      if (!data.tree) {
        setStatusMessage("Generation did not return a UI tree.");
        return;
      }

      const nextTree = assignMissingNodeIds(data.tree);
      setTree(nextTree);
      setSelectedId(nextTree.children?.[0]?.id ?? nextTree.id);
      setStatusMessage(
        data.message ??
          (data.fallback ? "Loaded fallback UI." : "Generated UI."),
      );
    } catch {
      setTree(assignMissingNodeIds(sampleUiTree));
      setSelectedId("headline");
      setStatusMessage("Generation failed. Loaded the sample UI instead.");
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
              Milestones 2-4
            </span>
            <span className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700">
              Local editing
            </span>
          </div>
        </header>

        <div className="grid flex-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="flex flex-col gap-4">
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

            <div
              className="rounded-md border border-slate-200 bg-white p-4"
              onClick={() => setSelectedId(null)}
            >
              <CanvasRenderer
                node={tree}
                onSelect={setSelectedId}
                selectedId={selectedId}
              />
            </div>
            <ExportPanel tree={tree} />
          </section>

          <aside className="rounded-md border border-slate-200 bg-white p-4">
            <ElementInspector
              onChange={updateSelectedNode}
              selectedNode={selectedNode}
            />

            <div className="mt-5 border-t border-slate-200 pt-4">
              <h3 className="text-sm font-semibold text-slate-900">
                Current tree
              </h3>
              <pre className="mt-2 max-h-72 overflow-auto rounded-md bg-slate-950 p-3 text-xs leading-5 text-slate-100">
                {JSON.stringify(tree, null, 2)}
              </pre>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
