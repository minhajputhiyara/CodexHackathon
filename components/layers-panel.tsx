"use client";

import type { UIElement } from "@/lib/ui-schema";
import type { WebsiteProject } from "@/lib/website-project-schema";

interface LayersPanelProps {
  project: WebsiteProject;
  selectedPageId: string | null;
  selectedElementId: string | null;
  onSelectElement: (pageId: string, elementId: string) => void;
}

export function LayersPanel({
  project,
  selectedPageId,
  selectedElementId,
  onSelectElement,
}: LayersPanelProps) {
  const selectedPage = project.pages.find((p) => p.id === selectedPageId);

  const renderNode = (node: UIElement, depth = 0): React.ReactNode => {
    const isSelected = node.id === selectedElementId;
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id}>
        <button
          onClick={() => selectedPageId && onSelectElement(selectedPageId, node.id)}
          className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition ${
            isSelected
              ? "bg-[#8b5cf6] text-white"
              : "text-gray-300 hover:bg-[#1f1f1f]"
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          {hasChildren && (
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
          <span className="flex-1 truncate">{node.type}</span>
          {node.props?.text && (
            <span className="truncate text-xs opacity-60">
              {String(node.props.text).slice(0, 20)}
            </span>
          )}
        </button>
        {hasChildren &&
          node.children!.map((child) => renderNode(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col bg-[#0a0a0a]">
      {/* Tabs */}
      <div className="flex border-b border-[#2a2a2a]">
        <button className="border-b-2 border-[#8b5cf6] px-4 py-3 text-sm font-medium text-white">
          Layers
        </button>
        <button className="px-4 py-3 text-sm font-medium text-gray-400 hover:text-white">
          Components
        </button>
      </div>

      {/* Search */}
      <div className="border-b border-[#2a2a2a] p-3">
        <div className="flex items-center gap-2 rounded-md border border-[#2a2a2a] bg-[#141414] px-3 py-1.5">
          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search layers..."
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-gray-500"
          />
        </div>
      </div>

      {/* Layer Tree */}
      <div className="flex-1 overflow-y-auto p-2">
        {selectedPage ? (
          <div>
            <div className="mb-2 px-2 text-xs font-medium text-gray-400">
              {selectedPage.name}
            </div>
            {renderNode(selectedPage.tree)}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-500">
            No page selected
          </div>
        )}
      </div>

      {/* Components Section */}
      <div className="border-t border-[#2a2a2a] p-3">
        <div className="mb-2 text-xs font-medium text-gray-400">Basic</div>
        <div className="grid grid-cols-3 gap-2">
          {["Div", "Text", "Image", "Button", "Input", "Icon"].map((comp) => (
            <button
              key={comp}
              className="flex flex-col items-center gap-1 rounded-md border border-[#2a2a2a] bg-[#141414] p-2 transition hover:bg-[#1f1f1f]"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded bg-[#1f1f1f]">
                <span className="text-xs text-gray-400">{comp[0]}</span>
              </div>
              <span className="text-xs text-gray-300">{comp}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
