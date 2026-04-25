# tldraw Canvas Architecture

## Purpose

This document describes how designPlate should evolve from a single rendered UI tree into a multi-page website canvas using tldraw.

The goal is to show every generated website page in one zoomable workspace, similar to Figma artboards, while keeping the actual page content as editable React/HTML generated from designPlate's JSON schema.

This is an implementation plan only. It does not change code yet.

## Core Decision

Use tldraw as the workspace layer, not as the UI rendering engine.

designPlate should not convert generated website UIs into tldraw shapes. The generated pages should stay as JSON UI trees rendered by React components. tldraw should provide the infinite canvas behavior around those pages:

- Pan
- Zoom
- Multi-page spatial layout
- Page/frame selection
- Viewport controls
- Optional page arrangement

React should continue to own:

- Rendering each page from a JSON UI tree
- Element selection inside a page
- Inspector edits
- Prompt generation
- Code export
- Validation and normalization

Recommended mental model:

```text
tldraw = infinite workspace
Page frame = positioned website page preview
CanvasRenderer = real React/HTML renderer inside a frame
JSON tree = source of truth for page content
Inspector = edits selected page/element
Exporter = serializes JSON into React + Tailwind
```

## Why tldraw Fits

The corrected product direction needs multiple website pages visible in one view. A normal single preview panel is too limited because the user cannot compare pages, inspect page structure, or understand the generated site as a whole.

tldraw is suitable because it already solves the hard canvas problems:

- Infinite workspace
- Smooth pan and zoom
- Selection model
- Camera state
- Bounds and hit testing
- Shape positioning
- Keyboard and pointer interactions
- A Figma-like mental model

The important boundary is that tldraw should manage page containers, not every button, heading, or card inside the generated website.

## Target User Experience

The editor should feel like this:

```text
Left Panel                 Center tldraw Workspace              Right Panel
Prompt                     Home page frame                      Selected element
Page list                  Pricing page frame                   Text editor
Generate site              About page frame                     className editor
Regenerate page            Contact page frame                   Export controls
```

User flow:

1. User enters a prompt, for example: "Create a 5-page SaaS website for an AI writing tool."
2. AI returns a multi-page website project JSON.
3. The center workspace shows each page as a separate frame.
4. User pans and zooms around all generated pages.
5. User clicks a page frame to make it active.
6. User clicks an element inside that page.
7. Inspector edits update the JSON tree for that page.
8. Export generates React + Tailwind code for one page or all pages.

## Recommended Data Model

The current app stores one `UIElementNode` tree. The tldraw version should introduce a project-level model.

```ts
type WebsiteProject = {
  id: string;
  name: string;
  pages: WebsitePage[];
};

type WebsitePage = {
  id: string;
  name: string;
  route: string;
  tree: UIElementNode;
  frame: PageFrame;
};

type PageFrame = {
  x: number;
  y: number;
  width: number;
  height: number;
};
```

The existing `UIElementNode` schema can remain mostly unchanged.

```ts
type UIElementNode = {
  id: string;
  type: UIElementType;
  props: UIElementProps;
  children?: UIElementNode[];
};
```

New editor state should become:

```ts
type EditorState = {
  project: WebsiteProject;
  selectedPageId: string | null;
  selectedElementId: string | null;
};
```

Selection should be split into two concepts:

- `selectedPageId`: which website page frame is active
- `selectedElementId`: which UI node inside that page is active

This prevents confusion between selecting a tldraw frame and selecting a real rendered element inside that frame.

## tldraw Shape Strategy

Use a custom tldraw shape for website page frames.

Conceptually:

```text
WebsitePageShape
├── pageId
├── x/y position owned by tldraw
├── width/height owned by shape props
└── React-rendered page preview inside shape component
```

Each tldraw page shape should map to one `WebsitePage`.

The shape should store only canvas-specific metadata:

```ts
type WebsitePageShapeProps = {
  pageId: string;
  name: string;
  route: string;
  width: number;
  height: number;
};
```

The shape should not duplicate the full UI tree. The UI tree should stay in app state. This keeps export, editing, and AI regeneration reliable.

## Rendering Plan

Each page frame should render a real DOM preview:

```text
tldraw shape component
└── frame chrome
    ├── page name / route label
    └── clipped webpage preview
        └── CanvasRenderer node={page.tree}
```

Frame behavior:

- Fixed desktop frame size to start, for example `1440 x 1200` scaled by tldraw.
- Clip page overflow so every page looks like a bounded artboard.
- Show page name and route above or inside a small frame header.
- Use the existing recursive `CanvasRenderer` for page content.
- Keep Tailwind class rendering exactly as it works now.

Avoid using iframes for the first version. Same-DOM rendering makes selection and editing much simpler.

## Interaction Model

There are two levels of interaction.

### Page-Level Interaction

Handled by tldraw:

- Pan workspace
- Zoom workspace
- Select page frame
- Move page frame if unlocked
- Fit all pages in view

Clicking a page frame should set `selectedPageId`.

### Element-Level Interaction

Handled by designPlate's React renderer:

- Click text, button, image, card, stack, container, or section
- Stop event propagation so the click selects the inner element instead of only the page frame
- Set `selectedElementId`
- Show selected outline on the element
- Inspector edits the selected element inside the selected page tree

If event conflicts appear between tldraw and inner DOM clicks, prefer this rule:

- Single click on page background selects the page
- Single click on rendered UI element selects the element
- Drag on frame chrome moves the page frame
- Drag inside rendered website content should not move the tldraw frame in v1

## AI Generation Contract

The AI route should eventually return a project, not a single tree.

Recommended multi-page output:

```json
{
  "name": "AI Writing SaaS",
  "pages": [
    {
      "name": "Home",
      "route": "/",
      "tree": {
        "type": "section",
        "props": {
          "className": "min-h-screen bg-white px-8 py-16"
        },
        "children": []
      }
    },
    {
      "name": "Pricing",
      "route": "/pricing",
      "tree": {
        "type": "section",
        "props": {
          "className": "min-h-screen bg-slate-50 px-8 py-16"
        },
        "children": []
      }
    }
  ]
}
```

Validation should enforce:

- Project has at least one page
- Page IDs are assigned locally if missing
- Routes are unique
- Page names are present
- Every page tree is a valid `UIElementNode`
- Every element type is supported
- Raw HTML and scripts are rejected
- Invalid pages are replaced with safe fallback pages

For hackathon safety, keep a single-page fallback and add a multi-page fallback:

- Home
- Pricing
- About
- Contact

## Page Layout Algorithm

When a new multi-page project is generated, assign frame positions automatically.

Start simple:

```text
Home      Pricing
About     Contact
```

Suggested defaults:

- Frame width: `1440`
- Frame height: `1200`
- Horizontal gap: `240`
- Vertical gap: `240`
- Two columns for 2-4 pages
- Three columns for 5+ pages

Pseudo layout:

```ts
const columns = pages.length <= 4 ? 2 : 3;
const frameWidth = 1440;
const frameHeight = 1200;
const gap = 240;

pages.map((page, index) => ({
  x: (index % columns) * (frameWidth + gap),
  y: Math.floor(index / columns) * (frameHeight + gap),
  width: frameWidth,
  height: frameHeight,
}));
```

After generation, call tldraw's viewport fit behavior so the user sees all pages immediately.

## Export Architecture

Export should continue to use JSON, not tldraw shape data.

Export modes:

1. Export selected page
2. Export all pages

Selected page export:

```text
WebsitePage.tree -> existing JSON-to-JSX serializer
```

All pages export:

```text
WebsiteProject.pages -> one React component per page
```

Possible output structure:

```text
HomePage.tsx
PricingPage.tsx
AboutPage.tsx
ContactPage.tsx
```

For the hackathon, the export panel can display all page components in one code block with file comments.

## Inspector Architecture

The inspector should become page-aware.

When nothing is selected:

- Show project summary
- Show page count

When a page is selected but no element is selected:

- Show page name
- Show route
- Optional page frame size
- Optional regenerate this page

When an element is selected:

- Show page name
- Show element type
- Edit text if available
- Edit `className`
- Optional style presets

Edits must update only the tree for `selectedPageId`.

Recommended helper functions:

```ts
findPageById(project, pageId)
updatePageById(project, pageId, patch)
updatePageTreeById(project, pageId, nextTree)
updateNodePropsInPage(project, pageId, nodeId, props)
```

## Component Architecture

Recommended component split:

```text
components/
├── editor-shell.tsx
├── tldraw-site-canvas.tsx
├── website-page-shape.tsx
├── canvas-renderer.tsx
├── page-list-panel.tsx
├── element-inspector.tsx
└── export-panel.tsx

lib/
├── ui-schema.ts
├── website-project-schema.ts
├── ui-tree.ts
├── website-project.ts
├── normalize-ui-tree.ts
├── normalize-website-project.ts
├── export-jsx.ts
└── sample-website-project.ts
```

Responsibilities:

- `editor-shell.tsx`: owns project state, prompt state, selection state, generation actions.
- `tldraw-site-canvas.tsx`: mounts tldraw, registers custom page shape, syncs shapes with pages.
- `website-page-shape.tsx`: renders one page frame and its React preview.
- `canvas-renderer.tsx`: recursively renders supported UI elements.
- `page-list-panel.tsx`: lists pages and routes.
- `element-inspector.tsx`: edits selected page or selected element.
- `export-panel.tsx`: exports selected page or all pages.
- `website-project-schema.ts`: defines project/page/frame types.
- `website-project.ts`: helper functions for page updates and layout.
- `normalize-website-project.ts`: validates AI project output and applies fallbacks.

## State Synchronization

There should be one source of truth for page content:

```text
WebsiteProject.pages[].tree
```

tldraw can own visual shape positions during editing, but those positions should be synced back into:

```text
WebsiteProject.pages[].frame
```

Do not store:

- A separate copy of page trees inside tldraw shape props
- Export data inside tldraw
- Inspector state inside tldraw

Sync direction:

```text
Project pages -> create/update tldraw page shapes
tldraw shape movement -> update page.frame
Inspector edit -> update project page tree -> page shape re-renders
AI regenerate -> replace project -> recreate/sync page shapes
```

## Package Plan

Install tldraw:

```bash
npm install tldraw
```

Add tldraw styles once, likely in the canvas component or global app entry:

```ts
import "tldraw/tldraw.css";
```

Keep the current Craft.js files untouched until the tldraw route is stable. The project can later remove Craft.js if tldraw fully replaces that experiment.

## Implementation Phases

### Phase 1: Project Model

Goal: support multiple pages without tldraw yet.

Tasks:

- Add `WebsiteProject` and `WebsitePage` types.
- Add `sampleWebsiteProject`.
- Convert editor state from `tree` to `project`.
- Track `selectedPageId` and `selectedElementId`.
- Render the selected page using the current `CanvasRenderer`.
- Update inspector and export to work with selected page.

Acceptance check:

- App still works with one active page.
- Page-aware editing works.
- Export selected page works.

### Phase 2: Static Multi-Page Workspace

Goal: show all pages in one normal DOM grid before tldraw.

Tasks:

- Render all project pages as frames in a CSS grid.
- Click frame to select page.
- Click element to select element.
- Export selected page or all pages.

Acceptance check:

- Multiple pages are visible at once.
- Element editing updates the correct page.
- Export all pages works.

This phase reduces risk before introducing tldraw.

### Phase 3: tldraw Workspace

Goal: replace the DOM grid with a tldraw infinite workspace.

Tasks:

- Install tldraw.
- Create `TldrawSiteCanvas`.
- Register custom `WebsitePageShape`.
- Create one shape per `WebsitePage`.
- Render `CanvasRenderer` inside each page shape.
- Fit viewport to all pages after generation.

Acceptance check:

- User can pan and zoom around page frames.
- Every page renders as real React/HTML.
- Selecting and editing elements still works.

### Phase 4: Shape Sync

Goal: keep tldraw shape positions and project frames aligned.

Tasks:

- Initialize shapes from `page.frame`.
- Update `page.frame` when page shapes move.
- Recreate missing shapes after regeneration.
- Remove stale shapes when pages are removed.

Acceptance check:

- Page frame positions persist during the current session.
- Regeneration does not leave stale frames.
- Export is unaffected by tldraw shape state.

### Phase 5: Multi-Page AI Generation

Goal: generate complete website projects.

Tasks:

- Update API prompt to return project JSON.
- Validate project pages.
- Normalize page IDs, routes, frames, and element IDs.
- Fall back to `sampleWebsiteProject` when needed.
- Add prompt examples for multi-page websites.

Acceptance check:

- Prompt can generate 3-5 pages.
- Invalid model output does not crash the canvas.
- All pages appear in the tldraw workspace.

### Phase 6: Demo Polish

Goal: make the canvas feel intentional and demo-ready.

Tasks:

- Add fit-to-view button.
- Add selected page label.
- Add compact page list.
- Add selected/all export toggle.
- Add reset to sample project.
- Add loading and error states around generation.

Acceptance check:

- Demo can show prompt to multi-page site.
- User can inspect multiple pages in one view.
- User can edit a headline on one page.
- Export reflects edits.

## Risks And Countermeasures

| Risk | Warning Sign | Countermeasure |
| --- | --- | --- |
| tldraw event handling conflicts with inner React clicks | Clicking text moves/selects the frame instead of selecting the element | Stop propagation inside `CanvasRenderer`; reserve frame chrome for moving |
| Generated UI trees become duplicated between app state and tldraw | Export differs from preview | Store only `pageId`, route, and frame metadata in shape props |
| Custom tldraw shape takes too long | No multi-page preview after integration starts | Ship Phase 2 DOM grid as fallback |
| Pan/zoom makes text editing awkward | Users struggle to select inner elements | Add page list and selected page focus controls |
| Large generated pages hurt performance | Canvas lags with 5 pages | Limit page count, use fixed frame dimensions, render only supported elements |
| Multi-page AI output is inconsistent | Missing routes or unsupported elements | Normalize aggressively and use fallback pages |
| Export becomes route-aware too early | Time goes into framework details instead of demo | Export components first; routing can be a later enhancement |

## Recommended Hackathon Scope

For the first tldraw milestone, build only:

- Multi-page project data model
- tldraw infinite workspace
- One custom page frame shape per page
- Real React rendering inside each page frame
- Page selection
- Element selection
- Text and `className` editing
- Export selected page and all pages

Defer:

- Dragging individual elements inside a page
- Resizing elements visually
- Figma import/export
- True routing preview
- Persistent storage
- Collaboration
- Asset management
- Responsive breakpoint editing

## Final Architecture Summary

designPlate should use tldraw as a Figma-like workspace for arranging and viewing multiple website pages, while preserving the current JSON-to-React renderer as the actual UI rendering engine.

The most important rule is:

```text
tldraw owns where pages live.
designPlate owns what pages are.
```

That split keeps the prototype demoable, exportable, and easier to debug.
