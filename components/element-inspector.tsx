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
        <h2 className="text-sm font-semibold text-slate-900">Inspector</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Select a page frame or page from the list to inspect it.
        </p>
      </div>
    );
  }

  if (!selectedNode) {
    return (
      <div>
        <h2 className="text-sm font-semibold text-slate-900">Inspector</h2>
        <div className="mt-4 space-y-4">
          <label className="block">
            <span className="text-xs font-semibold uppercase text-slate-500">
              Page name
            </span>
            <input
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              onChange={(event) => onPageChange({ name: event.target.value })}
              value={selectedPage.name}
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase text-slate-500">
              Route
            </span>
            <input
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              onChange={(event) => onPageChange({ route: event.target.value })}
              value={selectedPage.route}
            />
          </label>
          <p className="text-sm leading-6 text-slate-600">
            Select an element inside this page frame to edit text and Tailwind
            classes.
          </p>
        </div>
      </div>
    );
  }

  const supportsText =
    selectedNode.type === "text" || selectedNode.type === "button";

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-900">Inspector</h2>
        <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600">
          {selectedPage.name} / {selectedNode.type}
        </span>
      </div>

      <div className="mt-4 space-y-4">
        {supportsText ? (
          <label className="block">
            <span className="text-xs font-semibold uppercase text-slate-500">
              Text
            </span>
            <textarea
              className="mt-2 min-h-24 w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              onChange={(event) =>
                onElementChange({ text: event.target.value })
              }
              value={selectedNode.props.text ?? ""}
            />
          </label>
        ) : null}

        <label className="block">
          <span className="text-xs font-semibold uppercase text-slate-500">
            Tailwind classes
          </span>
          <textarea
            className="mt-2 min-h-32 w-full resize-none rounded-md border border-slate-300 px-3 py-2 font-mono text-xs leading-5 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            onChange={(event) =>
              onElementChange({ className: event.target.value })
            }
            value={selectedNode.props.className ?? ""}
          />
        </label>

        <div>
          <span className="text-xs font-semibold uppercase text-slate-500">
            Presets
          </span>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {classPresets.map((preset) => (
              <button
                className="rounded-md border border-slate-300 px-2 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
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
