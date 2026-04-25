"use client";

import type { UIElementNode, UIElementProps } from "@/lib/ui-schema";

type ElementInspectorProps = {
  selectedNode: UIElementNode | null;
  onChange: (props: Partial<UIElementProps>) => void;
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
  selectedNode,
  onChange,
}: ElementInspectorProps) {
  if (!selectedNode) {
    return (
      <div>
        <h2 className="text-sm font-semibold text-slate-900">Inspector</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Select an element on the canvas to edit its text and Tailwind classes.
        </p>
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
          {selectedNode.type}
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
              onChange={(event) => onChange({ text: event.target.value })}
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
            onChange={(event) => onChange({ className: event.target.value })}
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
                onClick={() => onChange({ className: preset.value })}
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
