"use client";

import type { UIElementNode } from "@/lib/ui-schema";

type CanvasRendererProps = {
  node: UIElementNode;
  selectedId: string | null;
  onSelect: (id: string) => void;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function selectableClass(nodeId: string, selectedId: string | null) {
  return cx(
    "relative cursor-pointer transition",
    selectedId === nodeId
      ? "outline outline-2 outline-offset-4 outline-teal-600"
      : "hover:outline hover:outline-1 hover:outline-offset-4 hover:outline-slate-300",
  );
}

export function CanvasRenderer({
  node,
  selectedId,
  onSelect,
}: CanvasRendererProps) {
  const children = node.children?.map((child) => (
    <CanvasRenderer
      key={child.id}
      node={child}
      selectedId={selectedId}
      onSelect={onSelect}
    />
  ));

  const selectCurrent = (event: React.MouseEvent) => {
    event.stopPropagation();
    onSelect(node.id);
  };

  const className = cx(node.props.className, selectableClass(node.id, selectedId));

  switch (node.type) {
    case "section":
      return (
        <section className={className} onClick={selectCurrent}>
          {children}
        </section>
      );
    case "container":
      return (
        <div className={className} onClick={selectCurrent}>
          {children}
        </div>
      );
    case "stack":
      return (
        <div className={className} onClick={selectCurrent}>
          {children}
        </div>
      );
    case "card":
      return (
        <article className={className} onClick={selectCurrent}>
          {children}
        </article>
      );
    case "text":
      return (
        <p className={className} onClick={selectCurrent}>
          {node.props.text}
        </p>
      );
    case "button":
      return (
        <button className={className} onClick={selectCurrent} type="button">
          {node.props.text}
        </button>
      );
    case "image":
      return (
        <img
          alt={node.props.alt || ""}
          className={className}
          onClick={selectCurrent}
          src={
            node.props.src ||
            "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1200&q=80"
          }
        />
      );
    default:
      return null;
  }
}

