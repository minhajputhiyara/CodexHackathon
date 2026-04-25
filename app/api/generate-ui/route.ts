import { NextResponse } from "next/server";
import { normalizeUiTree, parseJsonFromText } from "@/lib/normalize-ui-tree";
import { sampleUiTree } from "@/lib/sample-ui";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const MODEL = "gpt-4.1-mini";

const instructions = `
You generate JSON UI trees for UIForge, an AI-native React and Tailwind UI canvas.

Return JSON only. Do not wrap the response in Markdown.

Allowed node shape:
{
  "type": "section" | "container" | "text" | "button" | "image" | "card" | "stack",
  "props": {
    "text": "optional text for text and button nodes",
    "src": "optional image URL for image nodes",
    "alt": "optional image alt text",
    "className": "optional Tailwind classes"
  },
  "children": []
}

Rules:
- Use only the allowed element types.
- Use Tailwind utility classes only in className.
- Do not include HTML strings, scripts, JavaScript event handlers, style objects, custom CSS, or external dependencies.
- Keep the UI simple and demo-friendly.
- Prefer section/container/stack/card/text/button.
- Make the root node a section.
- Keep the tree under 40 nodes.
`;

type GenerateRequest = {
  prompt?: string;
};

function fallbackResponse(message: string, status = 200) {
  return NextResponse.json(
    {
      tree: sampleUiTree,
      fallback: true,
      message,
    },
    { status },
  );
}

function extractOutputText(response: unknown) {
  if (
    typeof response === "object" &&
    response !== null &&
    "output_text" in response &&
    typeof response.output_text === "string"
  ) {
    return response.output_text;
  }

  if (
    typeof response === "object" &&
    response !== null &&
    "output" in response &&
    Array.isArray(response.output)
  ) {
    return response.output
      .flatMap((item) =>
        typeof item === "object" &&
        item !== null &&
        "content" in item &&
        Array.isArray(item.content)
          ? item.content
          : [],
      )
      .map((content) =>
        typeof content === "object" &&
        content !== null &&
        "text" in content &&
        typeof content.text === "string"
          ? content.text
          : "",
      )
      .join("");
  }

  return "";
}

export async function POST(request: Request) {
  let body: GenerateRequest;

  try {
    body = (await request.json()) as GenerateRequest;
  } catch {
    return fallbackResponse("Request body must be valid JSON.", 400);
  }

  const prompt = body.prompt?.trim();

  if (!prompt) {
    return fallbackResponse("Enter a prompt to generate UI.", 400);
  }

  if (!process.env.OPENAI_API_KEY) {
    return fallbackResponse(
      "OPENAI_API_KEY is not configured. Loaded the sample UI instead.",
    );
  }

  try {
    const response = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        instructions,
        input: `Generate a UI for this user prompt: ${prompt}`,
      }),
    });

    if (!response.ok) {
      return fallbackResponse(
        `OpenAI request failed with status ${response.status}. Loaded the sample UI instead.`,
      );
    }

    const data = (await response.json()) as unknown;
    const outputText = extractOutputText(data);

    if (!outputText) {
      return fallbackResponse(
        "OpenAI returned an empty response. Loaded the sample UI instead.",
      );
    }

    const parsed = parseJsonFromText(outputText);
    const normalized = normalizeUiTree(parsed);

    if (!normalized.ok) {
      return fallbackResponse(
        `${normalized.error} Loaded the sample UI instead.`,
      );
    }

    return NextResponse.json({
      tree: normalized.tree,
      fallback: false,
      message: "Generated UI.",
    });
  } catch {
    return fallbackResponse("Could not generate UI. Loaded the sample UI instead.");
  }
}

