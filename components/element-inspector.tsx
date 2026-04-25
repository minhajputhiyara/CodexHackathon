"use client";

import type { ReactNode } from "react";
import type { UIElementNode, UIElementProps } from "@/lib/ui-schema";
import type { WebsitePage } from "@/lib/website-project-schema";

type InspectorMode = "design" | "advanced";

type ElementInspectorProps = {
  mode?: InspectorMode;
  selectedPage: WebsitePage | null;
  selectedNode: UIElementNode | null;
  onElementChange: (props: Partial<UIElementProps>) => void;
  onPageChange: (patch: Partial<Pick<WebsitePage, "name" | "route">>) => void;
};

type Option = {
  label: string;
  value: string;
};

type ColorOption = Option & {
  swatch: string;
};

const inputClass =
  "w-full rounded-md border border-[#2a2a2a] bg-[#141414] px-3 py-2 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-[#8b5cf6]";
const labelClass = "mb-2 block text-xs font-medium text-gray-400";
const sectionClass = "border-b border-[#2a2a2a] pb-5 last:border-b-0 last:pb-0";

const classPresets = [
  ["Hero Title", "text-4xl font-bold leading-tight text-slate-950"],
  ["Muted Text", "text-base leading-7 text-slate-600"],
  [
    "Primary Button",
    "inline-flex items-center justify-center rounded-md bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-sm",
  ],
  ["Card", "rounded-md border border-slate-200 bg-white p-6 shadow-sm"],
  ["Stack", "grid gap-4 md:grid-cols-3"],
] satisfies Array<[string, string]>;

const displayOptions: Option[] = [
  { label: "Block", value: "" },
  { label: "Flex", value: "flex" },
  { label: "Grid", value: "grid" },
  { label: "Inline flex", value: "inline-flex" },
];
const directionOptions: Option[] = [
  { label: "Row", value: "flex-row" },
  { label: "Column", value: "flex-col" },
  { label: "Row reverse", value: "flex-row-reverse" },
  { label: "Column reverse", value: "flex-col-reverse" },
];
const alignOptions: Option[] = [
  { label: "Start", value: "items-start" },
  { label: "Center", value: "items-center" },
  { label: "End", value: "items-end" },
  { label: "Stretch", value: "items-stretch" },
];
const justifyOptions: Option[] = [
  { label: "Start", value: "justify-start" },
  { label: "Center", value: "justify-center" },
  { label: "End", value: "justify-end" },
  { label: "Between", value: "justify-between" },
];
const gridOptions: Option[] = [
  { label: "1 col", value: "grid-cols-1" },
  { label: "2 col", value: "grid-cols-2" },
  { label: "3 col", value: "grid-cols-3" },
  { label: "4 col", value: "grid-cols-4" },
];
const gapOptions: Option[] = [
  { label: "0", value: "gap-0" },
  { label: "4", value: "gap-1" },
  { label: "8", value: "gap-2" },
  { label: "12", value: "gap-3" },
  { label: "16", value: "gap-4" },
  { label: "24", value: "gap-6" },
  { label: "32", value: "gap-8" },
];
const paddingOptions: Option[] = [
  { label: "0", value: "p-0" },
  { label: "8", value: "p-2" },
  { label: "16", value: "p-4" },
  { label: "24", value: "p-6" },
  { label: "32", value: "p-8" },
  { label: "48", value: "p-12" },
  { label: "64", value: "p-16" },
];
const widthOptions: Option[] = [
  { label: "Auto", value: "" },
  { label: "Full", value: "w-full" },
  { label: "Fit", value: "w-fit" },
  { label: "Screen", value: "w-screen" },
];
const maxWidthOptions: Option[] = [
  { label: "None", value: "" },
  { label: "Small", value: "max-w-sm" },
  { label: "Medium", value: "max-w-md" },
  { label: "Large", value: "max-w-2xl" },
  { label: "Page", value: "max-w-6xl" },
  { label: "Full", value: "max-w-full" },
];
const heightOptions: Option[] = [
  { label: "Auto", value: "" },
  { label: "Full", value: "h-full" },
  { label: "160", value: "h-40" },
  { label: "240", value: "h-60" },
  { label: "320", value: "h-80" },
  { label: "Screen", value: "min-h-screen" },
];
const fontSizeOptions: Option[] = [
  { label: "12", value: "text-xs" },
  { label: "14", value: "text-sm" },
  { label: "16", value: "text-base" },
  { label: "18", value: "text-lg" },
  { label: "24", value: "text-2xl" },
  { label: "36", value: "text-4xl" },
  { label: "48", value: "text-5xl" },
];
const fontWeightOptions: Option[] = [
  { label: "Regular", value: "font-normal" },
  { label: "Medium", value: "font-medium" },
  { label: "Semibold", value: "font-semibold" },
  { label: "Bold", value: "font-bold" },
  { label: "Black", value: "font-black" },
];
const lineHeightOptions: Option[] = [
  { label: "Tight", value: "leading-tight" },
  { label: "Normal", value: "leading-normal" },
  { label: "Relaxed", value: "leading-7" },
  { label: "Loose", value: "leading-9" },
];
const textAlignOptions: Option[] = [
  { label: "Left", value: "text-left" },
  { label: "Center", value: "text-center" },
  { label: "Right", value: "text-right" },
];
const colorOptions: ColorOption[] = [
  { label: "Slate", value: "text-slate-950", swatch: "#020617" },
  { label: "Muted", value: "text-slate-600", swatch: "#475569" },
  { label: "Gray", value: "text-gray-600", swatch: "#4b5563" },
  { label: "White", value: "text-white", swatch: "#ffffff" },
  { label: "Violet", value: "text-violet-600", swatch: "#7c3aed" },
  { label: "Teal", value: "text-teal-600", swatch: "#0d9488" },
];
const backgroundOptions: ColorOption[] = [
  { label: "None", value: "", swatch: "transparent" },
  { label: "White", value: "bg-white", swatch: "#ffffff" },
  { label: "Slate", value: "bg-slate-950", swatch: "#020617" },
  { label: "Gray", value: "bg-slate-50", swatch: "#f8fafc" },
  { label: "Violet", value: "bg-violet-600", swatch: "#7c3aed" },
  { label: "Teal", value: "bg-teal-600", swatch: "#0d9488" },
];
const radiusOptions: Option[] = [
  { label: "0", value: "rounded-none" },
  { label: "4", value: "rounded" },
  { label: "6", value: "rounded-md" },
  { label: "8", value: "rounded-lg" },
  { label: "Full", value: "rounded-full" },
];
const borderOptions: Option[] = [
  { label: "None", value: "" },
  { label: "1 px", value: "border border-slate-200" },
  { label: "Dark", value: "border border-slate-800" },
  { label: "Accent", value: "border border-violet-300" },
];
const shadowOptions: Option[] = [
  { label: "None", value: "" },
  { label: "Small", value: "shadow-sm" },
  { label: "Medium", value: "shadow-md" },
  { label: "Large", value: "shadow-lg" },
];
const aspectOptions: Option[] = [
  { label: "Auto", value: "" },
  { label: "Square", value: "aspect-square" },
  { label: "Video", value: "aspect-video" },
  { label: "Wide", value: "aspect-[16/7]" },
];

function splitClasses(className = "") {
  return className.split(/\s+/).filter(Boolean);
}

function matchesToken(token: string, prefix: string) {
  if (prefix.startsWith("!")) {
    return token === prefix.slice(1);
  }

  return token === prefix || token.startsWith(`${prefix}-`);
}

function updateClassGroup(
  className: string | undefined,
  prefixes: string[],
  nextValue: string,
) {
  const nextTokens = splitClasses(className).filter(
    (token) => !prefixes.some((prefix) => matchesToken(token, prefix)),
  );

  return [...nextTokens, ...splitClasses(nextValue)].join(" ");
}

function getClassValue(className: string | undefined, options: Option[]) {
  const tokens = splitClasses(className);

  return (
    options.find((option) => {
      const optionTokens = splitClasses(option.value);
      return (
        option.value !== "" &&
        optionTokens.every((token) => tokens.includes(token))
      );
    })?.value ?? ""
  );
}

function getDisplayValue(className: string | undefined) {
  const tokens = splitClasses(className);

  if (tokens.includes("inline-flex")) return "inline-flex";
  if (tokens.includes("flex")) return "flex";
  if (tokens.includes("grid")) return "grid";

  return "";
}

function getColorValue(className: string | undefined, options: ColorOption[]) {
  const tokens = splitClasses(className);
  return options.find((option) => tokens.includes(option.value))?.value ?? "";
}

function mergeTextClasses(
  className: string,
  patch: Partial<{ align: string; color: string; size: string }>,
) {
  return [
    patch.size ?? getClassValue(className, fontSizeOptions),
    patch.color ?? getColorValue(className, colorOptions),
    patch.align ?? getClassValue(className, textAlignOptions),
  ].join(" ");
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={sectionClass}>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
        {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function SelectField({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: Option[];
  value: string;
}) {
  return (
    <Field label={label}>
      <select
        className={inputClass}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={`${label}-${option.label}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

function SegmentedControl({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: Option[];
  value: string;
}) {
  return (
    <div>
      <span className={labelClass}>{label}</span>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => {
          const isSelected = option.value === value;

          return (
            <button
              className={`rounded-md border px-2 py-2 text-xs font-medium transition ${
                isSelected
                  ? "border-[#8b5cf6] bg-[#8b5cf6] text-white"
                  : "border-[#2a2a2a] bg-[#141414] text-gray-300 hover:bg-[#1f1f1f]"
              }`}
              key={`${label}-${option.label}`}
              onClick={() => onChange(option.value)}
              type="button"
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ColorSwatches({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: ColorOption[];
  value: string;
}) {
  return (
    <div>
      <span className={labelClass}>{label}</span>
      <div className="grid grid-cols-3 gap-2">
        {options.map((option) => {
          const isSelected = option.value === value;

          return (
            <button
              className={`flex min-h-10 items-center gap-2 rounded-md border px-2 text-left text-xs font-medium transition ${
                isSelected
                  ? "border-[#8b5cf6] bg-[#1f1f1f] text-white"
                  : "border-[#2a2a2a] bg-[#141414] text-gray-300 hover:bg-[#1f1f1f]"
              }`}
              key={`${label}-${option.label}`}
              onClick={() => onChange(option.value)}
              type="button"
            >
              <span
                className="h-4 w-4 rounded border border-white/20"
                style={{ background: option.swatch }}
              />
              <span className="truncate">{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ElementInspector({
  mode = "design",
  selectedPage,
  selectedNode,
  onElementChange,
  onPageChange,
}: ElementInspectorProps) {
  if (!selectedPage) {
    return (
      <div>
        <h2 className="text-sm font-semibold text-white">Inspector</h2>
        <p className="mt-2 text-sm leading-6 text-gray-400">
          Select a page frame or page from the list to inspect it.
        </p>
      </div>
    );
  }

  if (!selectedNode) {
    return (
      <div>
        <h2 className="mb-4 text-sm font-semibold text-white">Page Settings</h2>
        <div className="space-y-4">
          <Field label="ID">
            <input className={inputClass} disabled value={selectedPage.id} />
          </Field>
          <Field label="Page name">
            <input
              className={inputClass}
              onChange={(event) => onPageChange({ name: event.target.value })}
              value={selectedPage.name}
            />
          </Field>
          <Field label="Route">
            <input
              className={inputClass}
              onChange={(event) => onPageChange({ route: event.target.value })}
              value={selectedPage.route}
            />
          </Field>
        </div>
      </div>
    );
  }

  const className = selectedNode.props.className ?? "";
  const displayValue = getDisplayValue(className);
  const supportsText =
    selectedNode.type === "text" || selectedNode.type === "button";
  const supportsLayout = selectedNode.type !== "text";
  const supportsImage = selectedNode.type === "image";
  const patchClass = (prefixes: string[], nextValue: string) =>
    onElementChange({
      className: updateClassGroup(className, prefixes, nextValue),
    });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-white">Element</h2>
          <p className="mt-1 truncate font-mono text-xs text-gray-500">
            {selectedNode.id}
          </p>
        </div>
        <span className="rounded-md bg-[#141414] px-2 py-1 text-xs font-medium text-gray-400">
          {selectedNode.type}
        </span>
      </div>

      {mode === "advanced" ? (
        <div className="space-y-5">
          <Section title="Identity">
            <Field label="ID">
              <input className={inputClass} disabled value={selectedNode.id} />
            </Field>
          </Section>
          {supportsText ? (
            <Section title="Content">
              <Field label="Text">
                <textarea
                  className={`${inputClass} min-h-24 resize-none`}
                  onChange={(event) =>
                    onElementChange({ text: event.target.value })
                  }
                  value={selectedNode.props.text ?? ""}
                />
              </Field>
            </Section>
          ) : null}
          {supportsImage ? (
            <Section title="Image">
              <Field label="Source URL">
                <input
                  className={inputClass}
                  onChange={(event) =>
                    onElementChange({ src: event.target.value })
                  }
                  placeholder="https://..."
                  value={selectedNode.props.src ?? ""}
                />
              </Field>
              <Field label="Alt text">
                <input
                  className={inputClass}
                  onChange={(event) =>
                    onElementChange({ alt: event.target.value })
                  }
                  value={selectedNode.props.alt ?? ""}
                />
              </Field>
            </Section>
          ) : null}
          <Section title="Tailwind">
            <Field label="Classes">
              <textarea
                className={`${inputClass} min-h-40 resize-none font-mono text-xs leading-5`}
                onChange={(event) =>
                  onElementChange({ className: event.target.value })
                }
                value={className}
              />
            </Field>
          </Section>
        </div>
      ) : (
        <DesignInspector
          className={className}
          displayValue={displayValue}
          onElementChange={onElementChange}
          patchClass={patchClass}
          selectedNode={selectedNode}
          supportsImage={supportsImage}
          supportsLayout={supportsLayout}
          supportsText={supportsText}
        />
      )}
    </div>
  );
}

function DesignInspector({
  className,
  displayValue,
  onElementChange,
  patchClass,
  selectedNode,
  supportsImage,
  supportsLayout,
  supportsText,
}: {
  className: string;
  displayValue: string;
  onElementChange: (props: Partial<UIElementProps>) => void;
  patchClass: (prefixes: string[], nextValue: string) => void;
  selectedNode: UIElementNode;
  supportsImage: boolean;
  supportsLayout: boolean;
  supportsText: boolean;
}) {
  return (
    <div className="space-y-5">
      {supportsText ? (
        <Section title="Content">
          <Field label="Text">
            <textarea
              className={`${inputClass} min-h-24 resize-none`}
              onChange={(event) => onElementChange({ text: event.target.value })}
              value={selectedNode.props.text ?? ""}
            />
          </Field>
        </Section>
      ) : null}

      {supportsImage ? (
        <Section title="Image">
          <Field label="Source URL">
            <input
              className={inputClass}
              onChange={(event) => onElementChange({ src: event.target.value })}
              placeholder="https://..."
              value={selectedNode.props.src ?? ""}
            />
          </Field>
          <Field label="Alt text">
            <input
              className={inputClass}
              onChange={(event) => onElementChange({ alt: event.target.value })}
              value={selectedNode.props.alt ?? ""}
            />
          </Field>
          <SelectField
            label="Aspect"
            onChange={(value) => patchClass(["aspect"], value)}
            options={aspectOptions}
            value={getClassValue(className, aspectOptions)}
          />
        </Section>
      ) : null}

      {supportsLayout ? (
        <Section title="Layout">
          <SegmentedControl
            label="Display"
            onChange={(value) =>
              patchClass(["!flex", "!grid", "!inline-flex"], value)
            }
            options={displayOptions}
            value={displayValue}
          />
          {displayValue.includes("flex") ? (
            <>
              <SelectField
                label="Direction"
                onChange={(value) =>
                  patchClass(["flex-row", "flex-col"], value)
                }
                options={directionOptions}
                value={getClassValue(className, directionOptions)}
              />
              <SelectField
                label="Align"
                onChange={(value) => patchClass(["items"], value)}
                options={alignOptions}
                value={getClassValue(className, alignOptions)}
              />
              <SelectField
                label="Justify"
                onChange={(value) => patchClass(["justify"], value)}
                options={justifyOptions}
                value={getClassValue(className, justifyOptions)}
              />
            </>
          ) : null}
          {displayValue === "grid" ? (
            <SelectField
              label="Columns"
              onChange={(value) => patchClass(["grid-cols"], value)}
              options={gridOptions}
              value={getClassValue(className, gridOptions)}
            />
          ) : null}
          <SelectField
            label="Gap"
            onChange={(value) => patchClass(["gap"], value)}
            options={gapOptions}
            value={getClassValue(className, gapOptions)}
          />
        </Section>
      ) : null}

      <Section title="Size & Spacing">
        <SelectField
          label="Padding"
          onChange={(value) =>
            patchClass(["p", "px", "py", "pt", "pr", "pb", "pl"], value)
          }
          options={paddingOptions}
          value={getClassValue(className, paddingOptions)}
        />
        <SelectField
          label="Width"
          onChange={(value) => patchClass(["w"], value)}
          options={widthOptions}
          value={getClassValue(className, widthOptions)}
        />
        <SelectField
          label="Max width"
          onChange={(value) => patchClass(["max-w"], value)}
          options={maxWidthOptions}
          value={getClassValue(className, maxWidthOptions)}
        />
        <SelectField
          label="Height"
          onChange={(value) => patchClass(["h", "min-h"], value)}
          options={heightOptions}
          value={getClassValue(className, heightOptions)}
        />
      </Section>

      {supportsText ? (
        <Section title="Typography">
          <SelectField
            label="Size"
            onChange={(value) =>
              patchClass(["text"], mergeTextClasses(className, { size: value }))
            }
            options={fontSizeOptions}
            value={getClassValue(className, fontSizeOptions)}
          />
          <SelectField
            label="Weight"
            onChange={(value) => patchClass(["font"], value)}
            options={fontWeightOptions}
            value={getClassValue(className, fontWeightOptions)}
          />
          <SelectField
            label="Line height"
            onChange={(value) => patchClass(["leading"], value)}
            options={lineHeightOptions}
            value={getClassValue(className, lineHeightOptions)}
          />
          <SegmentedControl
            label="Alignment"
            onChange={(value) =>
              patchClass(["text"], mergeTextClasses(className, { align: value }))
            }
            options={textAlignOptions}
            value={getClassValue(className, textAlignOptions)}
          />
          <ColorSwatches
            label="Text color"
            onChange={(value) =>
              patchClass(["text"], mergeTextClasses(className, { color: value }))
            }
            options={colorOptions}
            value={getColorValue(className, colorOptions)}
          />
        </Section>
      ) : null}

      <Section title="Appearance">
        <ColorSwatches
          label="Fill"
          onChange={(value) => patchClass(["bg"], value)}
          options={backgroundOptions}
          value={getColorValue(className, backgroundOptions)}
        />
        <SelectField
          label="Radius"
          onChange={(value) => patchClass(["rounded"], value)}
          options={radiusOptions}
          value={getClassValue(className, radiusOptions)}
        />
        <SelectField
          label="Border"
          onChange={(value) => patchClass(["border"], value)}
          options={borderOptions}
          value={getClassValue(className, borderOptions)}
        />
        <SelectField
          label="Shadow"
          onChange={(value) => patchClass(["shadow"], value)}
          options={shadowOptions}
          value={getClassValue(className, shadowOptions)}
        />
      </Section>

      <Section title="Presets">
        <div className="grid grid-cols-2 gap-2">
          {classPresets.map(([label, value]) => (
            <button
              className="rounded-md border border-[#2a2a2a] bg-[#141414] px-2 py-2 text-xs font-medium text-gray-300 transition hover:bg-[#1f1f1f]"
              key={label}
              onClick={() => onElementChange({ className: value })}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
      </Section>
    </div>
  );
}
