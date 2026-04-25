# designPlate Requirements

## Purpose

This document defines what the hackathon prototype must prove, what is out of scope, and how the team will decide whether the product is working.

designPlate is a proof-of-concept for AI-native UI creation:

Prompt -> Editable UI -> React + Tailwind code

The goal is not to build a full design tool. The goal is to demonstrate that a user can describe an interface, receive a real editable UI, make targeted edits, and export usable code.

## Primary User Flow

1. User enters a natural language prompt.
2. AI converts the prompt into a structured JSON UI tree.
3. App renders the JSON as real React/HTML on a canvas.
4. User selects an element on the canvas.
5. User edits text and basic style properties.
6. User exports React + Tailwind code.

## Must Have Scope

The prototype must include:

1. Prompt to UI generation.
2. Live canvas rendering using real HTML/React.
3. Element selection from the canvas.
4. Editing selected element text.
5. Editing selected element styles through supported controls.
6. Exporting generated UI as React + Tailwind code.
7. Local-only state management.

## Should Have Scope

These are valuable if the must-have flow is complete:

1. Prompt examples.
2. Regenerate UI button.
3. Reset canvas button.
4. Copy-to-clipboard export action.
5. Simple component tree panel.
6. Loading and error states for AI generation.

## Out of Scope

The hackathon prototype will not include:

1. User accounts.
2. Database persistence.
3. Multi-page projects.
4. Figma import or export.
5. Drag-and-drop layout editing beyond what Craft.js provides quickly.
6. Complex responsive breakpoint editing.
7. Asset upload management.
8. Collaboration.
9. Production-grade code formatting.
10. Full design system management.

## Supported UI Elements

The first version should support a small controlled element set:

1. `section`
2. `container`
3. `text`
4. `button`
5. `image`
6. `card`
7. `stack`

The AI should only output supported element types. Unsupported element types must be rejected or normalized before rendering.

## JSON UI Tree

The UI is represented as structured JSON:

```json
{
  "type": "section",
  "props": {
    "className": "min-h-screen bg-white px-8 py-16"
  },
  "children": [
    {
      "type": "text",
      "props": {
        "text": "Build faster with AI",
        "className": "text-4xl font-bold"
      }
    },
    {
      "type": "button",
      "props": {
        "text": "Get Started",
        "className": "bg-black text-white px-6 py-3 rounded-xl"
      }
    }
  ]
}
```

## Functional Requirements

### Prompt Input

The user must be able to:

1. Type a prompt into a text input or textarea.
2. Submit the prompt.
3. See a loading state while UI generation is in progress.
4. See a useful error message if generation fails.

### AI Generation

The system must:

1. Send the user prompt to the AI layer.
2. Ask the AI to return only valid JSON matching the supported UI schema.
3. Validate the response before rendering.
4. Fall back to a safe sample UI if the response is invalid.
5. Avoid rendering arbitrary HTML from the model.

### Canvas Rendering

The system must:

1. Render the JSON UI tree as real React components.
2. Preserve Tailwind classes from the JSON props.
3. Render nested children recursively.
4. Clearly show the currently selected element.
5. Keep the canvas usable after regeneration.

### Element Editing

The user must be able to:

1. Select an element.
2. Edit text for text-like elements.
3. Edit class names or supported style controls.
4. See edits reflected live on the canvas.

Minimum editable fields:

1. Text content.
2. Tailwind `className`.

Optional editable fields:

1. Background color preset.
2. Text color preset.
3. Font size preset.
4. Padding preset.
5. Border radius preset.

### Code Export

The system must:

1. Convert the current JSON UI tree into React JSX.
2. Preserve Tailwind class names.
3. Display the exported code.
4. Provide a copy action if time allows.

## Non-Functional Requirements

1. The prototype should be demoable in a browser.
2. The core flow should work without a database.
3. The code should be understandable enough for rapid team iteration.
4. The AI output path should fail safely.
5. The app should stay responsive during generation and editing.

## Acceptance Criteria

The hackathon build is successful when:

1. A user can enter: "Create a SaaS landing page hero for an AI writing tool."
2. The app generates a structured UI.
3. The UI renders on a live canvas as editable HTML.
4. The user can select the headline.
5. The user can change the headline text.
6. The user can update the headline Tailwind class.
7. The export panel shows React + Tailwind code matching the edited UI.
8. Refreshing the page may lose work, because persistence is out of scope.

## Precautions And Countermeasures

| Risk | Precaution | Countermeasure |
| --- | --- | --- |
| AI returns invalid JSON | Use a strict system prompt and schema instructions | Validate response and load a safe fallback UI |
| AI returns unsupported elements | Maintain an allowlist of element types | Reject, normalize, or replace unsupported nodes |
| AI returns unsafe HTML or scripts | Never render raw HTML from model output | Render only known React components from JSON |
| Tailwind classes break layout | Start with safe prompt examples and class presets | Allow manual class editing and reset |
| Scope grows too large | Keep must-have flow visible in `tasks.md` | Defer all non-essential features |
| Craft.js integration takes too long | Build a thin recursive renderer first | Use Craft.js only for selection/editing where practical |
| Export code does not match canvas | Use the same JSON tree as source of truth | Test edits before export demo |
| API key is missing during demo | Provide sample JSON fallback mode | Demo local generation flow without API if needed |
| Team duplicates work | Use task ownership in `tasks.md` | Assign owners before implementation starts |
| Last-hour integration failure | Integrate early with a vertical slice | Freeze scope before polish |

## Demo Script

1. Open designPlate.
2. Enter a prompt for a simple landing page.
3. Generate UI.
4. Select headline.
5. Change text.
6. Change a Tailwind class.
7. Export code.
8. Copy or show the generated React component.

