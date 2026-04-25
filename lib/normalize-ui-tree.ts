import {
  supportedElementTypes,
  type UIElementNode,
  type UIElementProps,
  type UIElementType,
} from "@/lib/ui-schema";
import { assignMissingNodeIds } from "@/lib/ui-tree";

const MAX_DEPTH = 8;
const MAX_NODES = 80;
const MAX_TEXT_LENGTH = 500;
const MAX_CLASS_LENGTH = 500;

const supportedTypes = new Set<string>(supportedElementTypes);

type NormalizeResult =
  | {
      ok: true;
      tree: UIElementNode;
    }
  | {
      ok: false;
      error: string;
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function safeString(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.slice(0, maxLength) : undefined;
}

function normalizeProps(value: unknown): UIElementProps {
  if (!isRecord(value)) {
    return {};
  }

  return {
    text: safeString(value.text, MAX_TEXT_LENGTH),
    src: safeString(value.src, MAX_TEXT_LENGTH),
    alt: safeString(value.alt, MAX_TEXT_LENGTH),
    className: safeString(value.className, MAX_CLASS_LENGTH),
  };
}

function normalizeNode(
  value: unknown,
  depth: number,
  count: { value: number },
): UIElementNode {
  if (!isRecord(value)) {
    throw new Error("Every UI node must be an object.");
  }

  if (depth > MAX_DEPTH) {
    throw new Error(`Generated UI is deeper than ${MAX_DEPTH} levels.`);
  }

  count.value += 1;

  if (count.value > MAX_NODES) {
    throw new Error(`Generated UI has more than ${MAX_NODES} nodes.`);
  }

  const type = value.type;

  if (typeof type !== "string" || !supportedTypes.has(type)) {
    throw new Error(`Unsupported UI element type: ${String(type)}`);
  }

  const children = Array.isArray(value.children)
    ? value.children.map((child) => normalizeNode(child, depth + 1, count))
    : undefined;

  return {
    id: typeof value.id === "string" ? value.id : "",
    type: type as UIElementType,
    props: normalizeProps(value.props),
    children,
  };
}

export function normalizeUiTree(value: unknown): NormalizeResult {
  try {
    const tree = normalizeNode(value, 0, { value: 0 });
    return {
      ok: true,
      tree: assignMissingNodeIds(tree),
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Generated UI could not be normalized.",
    };
  }
}

export function parseJsonFromText(text: string) {
  const trimmed = text.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const jsonText = fencedMatch ? fencedMatch[1].trim() : trimmed;

  return JSON.parse(jsonText) as unknown;
}

