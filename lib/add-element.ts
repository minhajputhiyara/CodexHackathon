import type { UIElement } from "./ui-schema";
import type { WebsiteProject } from "./website-project-schema";

export function addElementToPage(
  project: WebsiteProject,
  pageId: string,
  elementType: string,
  parentId?: string
): WebsiteProject {
  const newElement: UIElement = {
    id: `${elementType}-${Date.now()}`,
    type: elementType as UIElement["type"],
    props: getDefaultProps(elementType),
    children: elementType === "container" ? [] : undefined,
  };

  return {
    ...project,
    pages: project.pages.map((page) => {
      if (page.id !== pageId) return page;

      return {
        ...page,
        tree: addToTree(page.tree, newElement, parentId),
      };
    }),
  };
}

function addToTree(
  node: UIElement,
  newElement: UIElement,
  parentId?: string
): UIElement {
  // If no parent specified, add to root
  if (!parentId) {
    return {
      ...node,
      children: [...(node.children || []), newElement],
    };
  }

  // If this is the parent, add child
  if (node.id === parentId) {
    return {
      ...node,
      children: [...(node.children || []), newElement],
    };
  }

  // Recursively search children
  if (node.children) {
    return {
      ...node,
      children: node.children.map((child) =>
        addToTree(child, newElement, parentId)
      ),
    };
  }

  return node;
}

function getDefaultProps(elementType: string): Record<string, unknown> {
  switch (elementType) {
    case "text":
      return {
        text: "New text",
        className: "text-base text-gray-900",
      };
    case "button":
      return {
        text: "Button",
        className: "rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700",
      };
    case "image":
      return {
        src: "https://via.placeholder.com/400x300",
        alt: "Placeholder image",
        className: "rounded-md",
      };
    case "input":
      return {
        placeholder: "Enter text...",
        className: "rounded-md border border-gray-300 px-3 py-2 text-sm",
      };
    case "container":
      return {
        className: "flex flex-col gap-4 p-4",
      };
    case "icon":
      return {
        className: "h-6 w-6 text-gray-600",
      };
    default:
      return {
        className: "",
      };
  }
}
