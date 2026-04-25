import type { UIElementNode, UIElementProps } from "@/lib/ui-schema";

export function assignMissingNodeIds(
  node: UIElementNode,
  path: number[] = [],
): UIElementNode {
  const id = node.id || `node-${path.join("-") || "root"}`;

  return {
    ...node,
    id,
    props: { ...node.props },
    children: node.children?.map((child, index) =>
      assignMissingNodeIds(child, [...path, index]),
    ),
  };
}

export function findNodeById(
  node: UIElementNode,
  id: string | null,
): UIElementNode | null {
  if (!id) {
    return null;
  }

  if (node.id === id) {
    return node;
  }

  for (const child of node.children ?? []) {
    const match = findNodeById(child, id);

    if (match) {
      return match;
    }
  }

  return null;
}

export function updateNodePropsById(
  node: UIElementNode,
  id: string,
  props: Partial<UIElementProps>,
): UIElementNode {
  if (node.id === id) {
    return {
      ...node,
      props: {
        ...node.props,
        ...props,
      },
    };
  }

  return {
    ...node,
    children: node.children?.map((child) =>
      updateNodePropsById(child, id, props),
    ),
  };
}

