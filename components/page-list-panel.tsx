"use client";

import type { WebsiteProject } from "@/lib/website-project-schema";

type PageListPanelProps = {
  project: WebsiteProject;
  selectedPageId: string | null;
  onAddPage: () => void;
  onSelectPage: (pageId: string) => void;
};

export function PageListPanel({
  project,
  selectedPageId,
  onAddPage,
  onSelectPage,
}: PageListPanelProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto">
      {project.pages.map((page) => {
        const isSelected = page.id === selectedPageId;

        return (
          <button
            className={`shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition ${
              isSelected
                ? "bg-[#8b5cf6] text-white"
                : "bg-[#141414] text-gray-400 hover:bg-[#1f1f1f] hover:text-white"
            }`}
            key={page.id}
            onClick={() => onSelectPage(page.id)}
            type="button"
          >
            {page.name}
          </button>
        );
      })}
      <button
        className="shrink-0 rounded-md bg-[#141414] px-3 py-1.5 text-sm text-gray-400 transition hover:bg-[#1f1f1f] hover:text-white"
        onClick={onAddPage}
        type="button"
      >
        + Add Page
      </button>
    </div>
  );
}

