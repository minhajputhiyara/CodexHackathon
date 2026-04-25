"use client";

import { useMemo, useState } from "react";
import { exportPageJsx, exportProjectJsx } from "@/lib/export-jsx";
import { findPageById } from "@/lib/website-project";
import type { WebsiteProject } from "@/lib/website-project-schema";

type ExportPanelProps = {
  project: WebsiteProject;
  selectedPageId: string | null;
};

export function ExportPanel({ project, selectedPageId }: ExportPanelProps) {
  const [mode, setMode] = useState<"selected" | "all">("all");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">(
    "idle",
  );
  const selectedPage = findPageById(project, selectedPageId) ?? project.pages[0];
  const code = useMemo(
    () =>
      mode === "selected" && selectedPage
        ? exportPageJsx(selectedPage)
        : exportProjectJsx(project),
    [mode, project, selectedPage],
  );

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
  };

  return (
    <section className="rounded-md border border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Export</h2>
          <p className="mt-1 text-xs text-slate-500">
            React + Tailwind JSX
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex overflow-hidden rounded-md border border-slate-300">
            <button
              className={`px-3 py-2 text-xs font-semibold ${
                mode === "selected"
                  ? "bg-slate-950 text-white"
                  : "bg-white text-slate-700"
              }`}
              onClick={() => setMode("selected")}
              type="button"
            >
              Selected
            </button>
            <button
              className={`border-l border-slate-300 px-3 py-2 text-xs font-semibold ${
                mode === "all"
                  ? "bg-slate-950 text-white"
                  : "bg-white text-slate-700"
              }`}
              onClick={() => setMode("all")}
              type="button"
            >
              All
            </button>
          </div>
          <button
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            onClick={copyCode}
            type="button"
          >
            {copyStatus === "copied"
              ? "Copied"
              : copyStatus === "failed"
                ? "Copy failed"
                : "Copy"}
          </button>
        </div>
      </div>
      <pre className="max-h-80 overflow-auto p-4 text-xs leading-5 text-slate-100">
        <code className="block rounded-md bg-slate-950 p-4">{code}</code>
      </pre>
    </section>
  );
}
