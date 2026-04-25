# designPlate Tasks

## Purpose

This document breaks the hackathon build into focused work packages so the group can move in parallel and keep the demo path protected.

The task order prioritizes a working vertical slice before polish:

Prompt -> generated JSON -> rendered canvas -> edit selected element -> export code

## Team Roles

Suggested ownership:

| Role | Owns |
| --- | --- |
| Product/demo lead | Scope control, demo script, acceptance criteria |
| Frontend lead | Next.js shell, layout, canvas, inspector |
| AI lead | OpenAI route, prompt, validation, fallback |
| Export lead | JSON-to-JSX serializer and export panel |
| QA/integration lead | End-to-end flow, bug triage, final demo reset |

One person can hold multiple roles if the team is small.

## 11-Hour Build Plan

| Time | Goal | Output |
| --- | --- | --- |
| Hour 0-1 | Setup and alignment | Repo scaffold, task ownership, sample UI tree |
| Hour 1-3 | Static vertical slice | Sample JSON renders on canvas |
| Hour 3-5 | Editing | Select element and edit text/className |
| Hour 5-7 | AI generation | Prompt calls API and replaces tree |
| Hour 7-8 | Export | Current tree serializes to React + Tailwind |
| Hour 8-9 | Integration | Full flow works end to end |
| Hour 9-10 | Safety and fallback | Invalid AI output does not break demo |
| Hour 10-11 | Demo polish | Script, examples, final bug fixes |

## Milestone 1: Project Setup

- [x] Create Next.js app.
- [x] Install Tailwind CSS.
- [x] Install Craft.js.
- [x] Create basic editor page.
- [x] Add environment variable placeholder for OpenAI API key.
- [x] Add sample UI tree.

Acceptance check:

- [x] App starts locally.
- [x] Tailwind styles render.
- [x] Sample data is available in code.

## Milestone 2: UI Schema And State

- [x] Define supported element types.
- [x] Define `UIElementNode` type.
- [x] Add helper to assign missing node IDs.
- [x] Add helper to find node by ID.
- [x] Add helper to update node props by ID.
- [x] Store tree and selected ID in React state.

Acceptance check:

- [x] State can hold a nested UI tree.
- [x] A node can be selected by ID.
- [x] A selected node can be updated without mutating the original object.

## Milestone 3: Canvas Renderer

- [x] Build recursive renderer.
- [x] Render `section`.
- [x] Render `container`.
- [x] Render `text`.
- [x] Render `button`.
- [x] Render `image`.
- [x] Render `card`.
- [x] Render `stack`.
- [x] Add click selection around rendered nodes.
- [x] Add visible selected-element outline.

Acceptance check:

- [x] Sample UI appears on canvas.
- [x] Clicking an element updates selected state.
- [x] Selected element is visually obvious.

## Milestone 4: Inspector

- [x] Show selected element type.
- [x] Add text editor for nodes with `props.text`.
- [x] Add className editor.
- [x] Apply edits live to the canvas.
- [x] Show empty state when no element is selected.
- [x] Add optional preset style controls if time allows.

Acceptance check:

- [x] User can change headline text.
- [x] User can change Tailwind className.
- [x] Canvas updates immediately.

## Milestone 5: AI Generation

- [x] Create `POST /api/generate-ui`.
- [x] Add OpenAI client on the server.
- [x] Write strict prompt for JSON UI generation.
- [x] Parse model response.
- [x] Validate generated tree.
- [x] Normalize IDs and props.
- [x] Return fallback sample if generation fails.
- [x] Show loading state in UI.
- [x] Show useful error message when needed.

Acceptance check:

- [x] Prompt submission returns a UI tree.
- [x] Generated UI replaces the current canvas.
- [x] Invalid output does not crash the app.

## Milestone 6: Export

- [x] Build JSON-to-JSX serializer.
- [x] Escape text content.
- [x] Preserve className values.
- [x] Add export panel.
- [x] Add copy-to-clipboard action if time allows.

Acceptance check:

- [x] Export output reflects the current edited tree.
- [x] Exported component is readable.
- [x] Text edits appear in exported code.
- [x] Class edits appear in exported code.

## Milestone 7: Demo Hardening

- [x] Add one-click sample prompts.
- [x] Add reset to sample UI.
- [x] Test missing API key behavior.
- [x] Test invalid prompt behavior.
- [x] Test repeated generation.
- [x] Test editing after generation.
- [x] Test export after editing.
- [x] Freeze scope before final hour.

Acceptance check:

- [x] Full demo script works twice in a row.
- [x] The team knows which fallback path to use if the API fails.

## Priority Order

Build in this order:

1. Static sample JSON renders.
2. Selection works.
3. Editing works.
4. Export works.
5. AI generation works.
6. Craft.js enhancements.
7. Visual polish.

If time runs short, protect items 1 through 5.

## Precautions And Countermeasures

| Risk | Warning Sign | Countermeasure |
| --- | --- | --- |
| Team spends too long on setup | No rendered sample by Hour 2 | Stop setup polish and hardcode sample renderer |
| Craft.js slows progress | Selection is not working by Hour 4 | Use custom click selection and revisit Craft.js later |
| AI route blocks frontend | API not ready by Hour 5 | Continue with sample JSON and mock response |
| Export becomes too complex | Serializer edge cases pile up | Export only supported components |
| UI editing scope expands | Requests for drag/drop, spacing panels, themes | Keep only text and className editing |
| Demo depends on live API | API key/rate limit uncertainty | Keep fallback sample and demo prompt cache |
| State bugs break export | Canvas and export disagree | Use one JSON tree as source of truth |
| Final merge conflicts | Multiple people edit same files | Assign ownership and integrate every 1-2 hours |
| Last-minute visual issues | Text overlaps or canvas looks broken | Use simple layouts and safe Tailwind defaults |

## Final Demo Checklist

- [x] App runs locally.
- [x] Prompt input is visible.
- [x] Generate button works.
- [x] Loading state appears.
- [x] Canvas renders generated or fallback UI.
- [x] Element selection works.
- [x] Inspector edits text.
- [x] Inspector edits className.
- [x] Export panel updates.
- [x] Demo prompt is ready.
- [x] Backup sample UI is ready.
- [x] API fallback behavior is understood.
