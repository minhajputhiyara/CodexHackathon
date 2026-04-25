"use client";

import type { UIElementNode, UIElementProps } from "@/lib/ui-schema";
import type { WebsitePage } from "@/lib/website-project-schema";

type ElementInspectorProps = {
  selectedPage: WebsitePage | null;
  selectedNode: UIElementNode | null;
  onElementChange: (props: Partial<UIElementProps>) => void;
  onPageChange: (patch: Partial<Pick<WebsitePage, "name" | "route">>) => void;
};

const classPresets = [
  {
    label: "Hero Title",
    value: "text-4xl font-bold text-slate-950",
  },
  {
    label: "Muted Text",
    value: "text-base leading-7 text-slate-600",
  },
  {
    label: "Primary Button",
    value: "rounded-md bg-slate-950 px-6 py-3 text-sm font-semibold text-white",
  },
  {
    label: "Card",
    value: "rounded-md border border-slate-200 bg-slate-50 p-4",
  },
  {
    label: "Stack",
    value: "grid gap-4 md:grid-cols-3",
  },
];

export function ElementInspector({
  selectedPage,
  selectedNode,
  onElementChange,
  onPageChange,
}: ElementInspectorProps) {
  if (!selectedPage) {
    return (
      <div>
        <h2 className="text-sm font-semibold text-white">Inspector</h2>
        <p className="mt-2 text-sm leading-6 text-gray-400">
          Select a page frame or page from the list to inspect it.
        </p>
      </div>
    );
  }

  if (!selectedNode) {
    return (
      <div>
        <h2 className="mb-4 text-sm font-semibold text-white">Page Settings</h2>
        <div className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-xs font-medium text-gray-400">
              ID
            </span>
            <input
              className="w-full rounded-md border border-[#2a2a2a] bg-[#141414] px-3 py-2 text-sm text-white outline-none transition focus:border-[#8b5cf6]"
              value={selectedPage.id}
              disabled
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-medium text-gray-400">
              Page name
            </span>
            <input
              className="w-full rounded-md border border-[#2a2a2a] bg-[#141414] px-3 py-2 text-sm text-white outline-none transition focus:border-[#8b5cf6]"
              onChange={(event) => onPageChange({ name: event.target.value })}
              value={selectedPage.name}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-medium text-gray-400">
              Route
            </span>
            <input
              className="w-full rounded-md border border-[#2a2a2a] bg-[#141414] px-3 py-2 text-sm text-white outline-none transition focus:border-[#8b5cf6]"
              onChange={(event) => onPageChange({ route: event.target.value })}
              value={selectedPage.route}
            />
          </label>
        </div>
      </div>
    );
  }

  const supportsText =
    selectedNode.type === "text" || selectedNode.type === "button";

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-white">Element</h2>
        <span className="rounded-md bg-[#141414] px-2 py-1 text-xs font-medium text-gray-400">
          {selectedNode.type}
        </span>
      </div>

      <div className="space-y-4">
        <label className="block">
          <span className="mb-2 block text-xs font-medium text-gray-400">
            ID
          </span>
          <input
            className="w-full rounded-md border border-[#2a2a2a] bg-[#141414] px-3 py-2 text-sm text-white outline-none"
            value={selectedNode.id}
            disabled
          />
        </label>

        {supportsText ? (
          <label className="block">
            <span className="mb-2 block text-xs font-medium text-gray-400">
              Text
            </span>
            <textarea
              className="min-h-24 w-full resize-none rounded-md border border-[#2a2a2a] bg-[#141414] px-3 py-2 text-sm text-white outline-none transition focus:border-[#8b5cf6]"
              onChange={(event) =>
                onElementChange({ text: event.target.value })
              }
              value={selectedNode.props.text ?? ""}
            />
          </label>
        ) : null}

        <label className="block">
          <span className="mb-2 block text-xs font-medium text-gray-400">
            Tailwind classes
          </span>
          <textarea
            className="min-h-32 w-full resize-none rounded-md border border-[#2a2a2a] bg-[#141414] px-3 py-2 font-mono text-xs leading-5 text-white outline-none transition focus:border-[#8b5cf6]"
            onChange={(event) =>
              onElementChange({ className: event.target.value })
            }
            value={selectedNode.props.className ?? ""}
          />
        </label>

        <div>
          <span className="mb-2 block text-xs font-medium text-gray-400">
            Style Presets
          </span>
          <div className="grid grid-cols-2 gap-2">
            {classPresets.map((preset) => (
              <button
                className="rounded-md border border-[#2a2a2a] bg-[#141414] px-2 py-2 text-xs font-medium text-gray-300 transition hover:bg-[#1f1f1f]"
                key={preset.label}
                onClick={() => onElementChange({ className: preset.value })}
                type="button"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
