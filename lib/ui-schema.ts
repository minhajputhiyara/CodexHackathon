export const supportedElementTypes = [
  "section",
  "container",
  "text",
  "button",
  "image",
  "card",
  "stack",
] as const;

export type UIElementType = (typeof supportedElementTypes)[number];

export type UIElementProps = {
  text?: string;
  src?: string;
  alt?: string;
  className?: string;
};

export type UIElementNode = {
  id: string;
  type: UIElementType;
  props: UIElementProps;
  children?: UIElementNode[];
};

