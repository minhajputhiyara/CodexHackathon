"use client";

import { useMemo, useState } from "react";
import type { UIElementNode } from "@/lib/ui-schema";
import { exportJsx } from "@/lib/export-jsx";

type ExportPanelProps = {
  tree: UIElementNode;
};

export function ExportPanel({ tree }: ExportPanelProps) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">(
    "idle",
  );
  const code = useMemo(() => exportJsx(tree), [tree]);

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
          <p className="mt-1 text-xs text-slate-500">React + Tailwind JSX</p>
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
      <pre className="max-h-80 overflow-auto p-4 text-xs leading-5 text-slate-100">
        <code className="block rounded-md bg-slate-950 p-4">{code}</code>
      </pre>
    </section>
  );
}

