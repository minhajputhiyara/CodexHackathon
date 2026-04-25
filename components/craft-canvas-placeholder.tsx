"use client";

import { sampleUiTree } from "@/lib/sample-ui";

export function CraftCanvasPlaceholder() {
  return (
    <section className="min-h-[360px] rounded-md border border-dashed border-slate-300 bg-white p-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-5 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
          Canvas ready
        </p>
        <h1 className="text-4xl font-bold text-slate-950">
          {sampleUiTree.children?.[0]?.props.text}
        </h1>
        <p className="text-base leading-7 text-slate-600">
          Task 1 sets up the editor shell, dependencies, Tailwind styling, and
          sample data. The recursive renderer and selection tools come next.
        </p>
        <button className="mx-auto rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
          {sampleUiTree.children?.[1]?.props.text}
        </button>
      </div>
    </section>
  );
}

