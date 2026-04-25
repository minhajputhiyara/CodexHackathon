import type { UIElementNode } from "@/lib/ui-schema";

const tagByType: Record<UIElementNode["type"], string> = {
  section: "section",
  container: "div",
  text: "p",
  button: "button",
  image: "img",
  card: "article",
  stack: "div",
};

function indent(level: number) {
  return "  ".repeat(level);
}

function escapeAttribute(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function escapeText(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;");
}

function renderAttributes(node: UIElementNode) {
  const attributes: string[] = [];

  if (node.props.className) {
    attributes.push(`className="${escapeAttribute(node.props.className)}"`);
  }

  if (node.type === "button") {
    attributes.push('type="button"');
  }

  if (node.type === "image") {
    attributes.push(`src="${escapeAttribute(node.props.src || "")}"`);
    attributes.push(`alt="${escapeAttribute(node.props.alt || "")}"`);
  }

  return attributes.length > 0 ? ` ${attributes.join(" ")}` : "";
}

function renderNode(node: UIElementNode, level: number): string {
  const tag = tagByType[node.type];
  const attributes = renderAttributes(node);
  const currentIndent = indent(level);

  if (node.type === "image") {
    return `${currentIndent}<${tag}${attributes} />`;
  }

  const text = node.props.text ? escapeText(node.props.text) : "";
  const children = node.children?.map((child) => renderNode(child, level + 1));
  const content = [text, ...(children ?? [])].filter(Boolean);

  if (content.length === 0) {
    return `${currentIndent}<${tag}${attributes} />`;
  }

  if (content.length === 1 && text) {
    return `${currentIndent}<${tag}${attributes}>${text}</${tag}>`;
  }

  return [
    `${currentIndent}<${tag}${attributes}>`,
    ...content.map((line) => (line.startsWith("  ") ? line : `${indent(level + 1)}${line}`)),
    `${currentIndent}</${tag}>`,
  ].join("\n");
}

export function exportJsx(tree: UIElementNode) {
  return [
    "export default function GeneratedUI() {",
    "  return (",
    renderNode(tree, 2),
    "  );",
    "}",
  ].join("\n");
}

