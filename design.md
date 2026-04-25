# UIForge Design

## Purpose

This document explains how the prototype should be structured technically so the team can build quickly without losing the core product idea.

The design favors a narrow vertical slice:

Prompt -> JSON UI tree -> React canvas -> editor controls -> code export

## Technology Choices

| Layer | Choice | Reason |
| --- | --- | --- |
| App framework | Next.js | Fast React setup with API routes |
| Styling | Tailwind CSS | Direct match with exported code |
| Visual editor | Craft.js | Selection and editable component structure |
| AI provider | OpenAI API | Prompt to structured JSON generation |
| State | Local React state | No database needed for prototype |
| Export | JSON-to-JSX serializer | Keeps canvas and code export aligned |

## High-Level Architecture

```text
User Prompt
    |
    v
Prompt Panel
    |
    v
Next.js API Route
    |
    v
OpenAI API
    |
    v
Validated JSON UI Tree
    |
    +--> Canvas Renderer
    |
    +--> Element Inspector
    |
    +--> Code Exporter
```

## Suggested App Structure

```text
app/
  page.tsx
  api/
    generate-ui/
      route.ts
components/
  prompt-panel.tsx
  editor-shell.tsx
  canvas-renderer.tsx
  element-inspector.tsx
  export-panel.tsx
  ui-elements/
    section.tsx
    container.tsx
    text.tsx
    button.tsx
    image.tsx
    card.tsx
    stack.tsx
lib/
  ui-schema.ts
  validate-ui-tree.ts
  normalize-ui-tree.ts
  export-jsx.ts
  sample-ui.ts
```

This structure is a suggestion. If the team scaffolds with a different Next.js layout, preserve the same boundaries.

## Core Data Types

```ts
export type UIElementType =
  | "section"
  | "container"
  | "text"
  | "button"
  | "image"
  | "card"
  | "stack";

export type UIElementNode = {
  id: string;
  type: UIElementType;
  props: {
    text?: string;
    src?: string;
    alt?: string;
    className?: string;
  };
  children?: UIElementNode[];
};
```

The model may omit IDs. The app should add stable IDs during normalization.

## State Model

Use a single JSON UI tree as the source of truth:

```ts
type EditorState = {
  tree: UIElementNode;
  selectedId: string | null;
  isGenerating: boolean;
  error: string | null;
};
```

All major views should read from or update this state:

1. Canvas renders `tree`.
2. Inspector edits the selected node inside `tree`.
3. Exporter serializes `tree`.
4. Prompt generation replaces `tree` after validation.

## AI Generation Design

### API Route

Create a server-side route:

```text
POST /api/generate-ui
```

Request:

```json
{
  "prompt": "Create a pricing section for a SaaS app"
}
```

Response:

```json
{
  "tree": {
    "id": "root",
    "type": "section",
    "props": {
      "className": "min-h-screen bg-white px-8 py-16"
    },
    "children": []
  }
}
```

### Prompt Rules For The AI

The system prompt should instruct the model to:

1. Return JSON only.
2. Use only the supported element types.
3. Use Tailwind classes only in `className`.
4. Keep layouts simple.
5. Avoid scripts, raw HTML, event handlers, external dependencies, and custom CSS.
6. Generate accessible text where possible.

### Validation

Before rendering, validate:

1. Root is an object.
2. Every node has a supported `type`.
3. `props` is an object.
4. `children`, if present, is an array.
5. Text fields are strings.
6. Class names are strings.
7. Tree depth and node count are bounded.

Suggested limits:

1. Maximum depth: 8.
2. Maximum nodes: 80.
3. Maximum text length per node: 500 characters.
4. Maximum className length per node: 500 characters.

## Rendering Design

The canvas renderer should recursively map nodes to known components:

```ts
function renderNode(node: UIElementNode) {
  switch (node.type) {
    case "section":
      return <section className={node.props.className}>{children}</section>;
    case "text":
      return <p className={node.props.className}>{node.props.text}</p>;
    case "button":
      return <button className={node.props.className}>{node.props.text}</button>;
    default:
      return null;
  }
}
```

Selection can be handled by wrapping each rendered node with a selectable boundary that records `selectedId`.

## Inspector Design

When an element is selected, the inspector should show:

1. Element type.
2. Text input when the element supports `props.text`.
3. Class name input for `props.className`.
4. Optional preset controls for common Tailwind changes.

The inspector should update the JSON tree immutably.

## Export Design

The exporter should serialize the same JSON tree into JSX:

```tsx
export default function GeneratedUI() {
  return (
    <section className="min-h-screen bg-white px-8 py-16">
      <p className="text-4xl font-bold">Build faster with AI</p>
      <button className="bg-black text-white px-6 py-3 rounded-xl">
        Get Started
      </button>
    </section>
  );
}
```

Minimum export requirements:

1. Generate valid JSX-like output.
2. Preserve text.
3. Preserve class names.
4. Include a single default component wrapper.

## Craft.js Integration Approach

Use Craft.js only where it accelerates the prototype:

1. Wrap supported elements as Craft components.
2. Use Craft.js selection state if it is quick to integrate.
3. Keep the JSON tree as the primary source of truth unless Craft.js becomes the faster source.

If Craft.js slows the build, use a custom recursive renderer with click selection and ship the prototype. The product concept matters more than deep editor mechanics.

## Error Handling

The UI should handle:

1. Empty prompt.
2. Slow AI response.
3. Failed API request.
4. Invalid AI JSON.
5. Unsupported generated element.
6. Empty selected state.

The app should never crash because of malformed AI output.

## Security And Safety Precautions

| Concern | Design Precaution | Countermeasure |
| --- | --- | --- |
| Prompt injection changes output contract | Keep API system prompt strict | Validate response independently of the model |
| Model returns raw HTML | Schema excludes HTML fields | Ignore unknown props and never use `dangerouslySetInnerHTML` |
| Model returns JavaScript handlers | Allowlist props only | Drop props beginning with `on` during normalization |
| Overly large responses freeze UI | Set depth and node limits | Reject tree and show fallback |
| Untrusted image URLs | Allow image `src`, but keep it optional | Use placeholder image when invalid |
| API secrets leak to client | Call OpenAI only from server route | Store key in environment variable |
| Export includes unsafe content | Escape text during serialization | Export only known components and props |

## Fallback Mode

The app should include a static sample UI tree in `sample-ui.ts`.

Fallback mode is used when:

1. No API key is configured.
2. The AI request fails.
3. The response cannot be parsed.
4. The response fails validation.

This protects the demo and allows frontend work to continue without AI availability.

## Visual Layout

Recommended app layout:

```text
+-------------------------------------------------------+
| Prompt input + Generate button                        |
+-----------------------+-------------------------------+
| Canvas                | Inspector                     |
|                       |                               |
|                       | Selected element controls     |
+-----------------------+-------------------------------+
| Export panel                                          |
+-------------------------------------------------------+
```

Keep the interface utilitarian. The prototype is an editor, not a landing page.

