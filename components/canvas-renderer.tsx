"use client";

import { useState, type MouseEvent, type PointerEvent } from "react";
import type { UIElementNode } from "@/lib/ui-schema";

type CanvasRendererProps = {
  node: UIElementNode;
  selectedId: string | null;
  hoveredId?: string | null;
  onSelect: (id: string) => void;
  onHover?: (id: string | null) => void;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const elementTagByType: Record<UIElementNode["type"], string> = {
  button: "button",
  card: "article",
  container: "div",
  image: "img",
  section: "section",
  stack: "div",
  text: "p",
};

function selectableClass(
  nodeId: string,
  selectedId: string | null,
  hoveredId: string | null,
) {
  return cx(
    "relative cursor-pointer transition outline-offset-2",
    selectedId === nodeId
      ? "outline outline-2 outline-teal-600"
      : hoveredId === nodeId
        ? "outline outline-2 outline-sky-500"
        : "hover:outline hover:outline-1 hover:outline-slate-300",
  );
}

function ElementOverlay({
  isHovered,
  isSelected,
  label,
}: {
  isHovered: boolean;
  isSelected: boolean;
  label: string;
}) {
  if (!isHovered && !isSelected) {
    return null;
  }

  return (
    <>
      <span
        className={cx(
          "pointer-events-none absolute inset-0 z-10 rounded-[inherit] ring-2 ring-inset",
          isSelected ? "ring-teal-500" : "ring-sky-500",
        )}
      />
      <span
        className={cx(
          "pointer-events-none absolute left-0 top-0 z-20 max-w-[min(280px,100%)] -translate-y-full truncate rounded-t-md px-2 py-1 font-mono text-[11px] font-semibold leading-none text-white shadow-lg",
          isSelected ? "bg-teal-600" : "bg-sky-600",
        )}
      >
        {label}
      </span>
    </>
  );
}

function CanvasElementRenderer({
  node,
  selectedId,
  hoveredId,
  onSelect,
  onHover,
}: Required<CanvasRendererProps>) {
  const tagName = elementTagByType[node.type];
  const isSelected = selectedId === node.id;
  const isHovered = hoveredId === node.id;
  const label = `${tagName}#${node.id}`;
  const children = node.children?.map((child) => (
    <CanvasElementRenderer
      key={child.id}
      node={child}
      hoveredId={hoveredId}
      selectedId={selectedId}
      onHover={onHover}
      onSelect={onSelect}
    />
  ));

  const selectCurrent = (event: MouseEvent) => {
    event.stopPropagation();
    onSelect(node.id);
  };
  const hoverCurrent = (event: PointerEvent) => {
    event.stopPropagation();
    onHover(node.id);
  };
  const clearHover = (event: PointerEvent<HTMLElement>) => {
    if (
      event.relatedTarget instanceof Node &&
      event.currentTarget.contains(event.relatedTarget)
    ) {
      return;
    }

    onHover(null);
  };

  const className = cx(
    node.props.className,
    selectableClass(node.id, selectedId, hoveredId),
  );
  const overlay = (
    <ElementOverlay
      isHovered={isHovered}
      isSelected={isSelected}
      label={label}
    />
  );

  switch (node.type) {
    case "section":
      return (
        <section
          className={className}
          data-element-id={node.id}
          data-element-type={node.type}
          onClick={selectCurrent}
          onPointerOut={clearHover}
          onPointerOver={hoverCurrent}
        >
          {overlay}
          {children}
        </section>
      );
    case "container":
      return (
        <div
          className={className}
          data-element-id={node.id}
          data-element-type={node.type}
          onClick={selectCurrent}
          onPointerOut={clearHover}
          onPointerOver={hoverCurrent}
        >
          {overlay}
          {children}
        </div>
      );
    case "stack":
      return (
        <div
          className={className}
          data-element-id={node.id}
          data-element-type={node.type}
          onClick={selectCurrent}
          onPointerOut={clearHover}
          onPointerOver={hoverCurrent}
        >
          {overlay}
          {children}
        </div>
      );
    case "card":
      return (
        <article
          className={className}
          data-element-id={node.id}
          data-element-type={node.type}
          onClick={selectCurrent}
          onPointerOut={clearHover}
          onPointerOver={hoverCurrent}
        >
          {overlay}
          {children}
        </article>
      );
    case "text":
      return (
        <p
          className={className}
          data-element-id={node.id}
          data-element-type={node.type}
          onClick={selectCurrent}
          onPointerOut={clearHover}
          onPointerOver={hoverCurrent}
        >
          {overlay}
          {node.props.text}
        </p>
      );
    case "button":
      return (
        <button
          className={className}
          data-element-id={node.id}
          data-element-type={node.type}
          onClick={selectCurrent}
          onPointerOut={clearHover}
          onPointerOver={hoverCurrent}
          type="button"
        >
          {overlay}
          {node.props.text}
        </button>
      );
    case "image":
      return (
        <span
          className={className}
          data-element-id={node.id}
          data-element-type={node.type}
          onClick={selectCurrent}
          onPointerOut={clearHover}
          onPointerOver={hoverCurrent}
        >
          {overlay}
          <img
            alt={node.props.alt || ""}
            className="block h-full w-full object-cover"
            src={
              node.props.src ||
              "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1200&q=80"
            }
          />
        </span>
      );
    default:
      return null;
  }
}

export function CanvasRenderer({
  hoveredId: controlledHoveredId,
  node,
  selectedId,
  onHover,
  onSelect,
}: CanvasRendererProps) {
  const [uncontrolledHoveredId, setUncontrolledHoveredId] = useState<
    string | null
  >(null);
  const hoveredId = controlledHoveredId ?? uncontrolledHoveredId;
  const handleHover = onHover ?? setUncontrolledHoveredId;

  return (
    <CanvasElementRenderer
      hoveredId={hoveredId}
      node={node}
      onHover={handleHover}
      onSelect={onSelect}
      selectedId={selectedId}
    />
  );
}
