"use client";

import type { WebsiteProject } from "@/lib/website-project-schema";

type PageListPanelProps = {
  project: WebsiteProject;
  selectedPageId: string | null;
  onSelectPage: (pageId: string) => void;
};

export function PageListPanel({
  project,
  selectedPageId,
  onSelectPage,
}: PageListPanelProps) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Pages</h2>
          <p className="mt-1 text-xs text-slate-500">
            {project.pages.length} page workspace
          </p>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {project.pages.map((page) => {
          const isSelected = page.id === selectedPageId;

          return (
            <button
              className={`w-full rounded-md border px-3 py-2 text-left transition ${
                isSelected
                  ? "border-teal-600 bg-teal-50"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
              key={page.id}
              onClick={() => onSelectPage(page.id)}
              type="button"
            >
              <span className="block text-sm font-semibold text-slate-900">
                {page.name}
              </span>
              <span className="mt-1 block text-xs text-slate-500">
                {page.route}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

