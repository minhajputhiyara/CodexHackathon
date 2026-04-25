"use client";

import { useState, useRef, useEffect } from "react";
import type { WebsiteProject } from "@/lib/website-project-schema";

interface ExportDropdownProps {
  project: WebsiteProject;
  selectedPageId: string | null;
}

export function ExportDropdown({ project, selectedPageId }: ExportDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const downloadJSON = () => {
    const dataStr = JSON.stringify(project, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${project.name || "project"}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setIsOpen(false);
  };

  const downloadHTML = () => {
    const selectedPage = project.pages.find((p) => p.id === selectedPageId) || project.pages[0];
    if (!selectedPage) return;

    const html = generateHTML(selectedPage.tree);
    const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${selectedPage.name}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  ${html}
</body>
</html>`;

    const dataBlob = new Blob([fullHTML], { type: "text/html" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedPage.name || "page"}.html`;
    link.click();
    URL.revokeObjectURL(url);
    setIsOpen(false);
  };

  const downloadReact = () => {
    const selectedPage = project.pages.find((p) => p.id === selectedPageId) || project.pages[0];
    if (!selectedPage) return;

    const jsx = generateJSX(selectedPage.tree);
    const reactComponent = `export default function ${toPascalCase(selectedPage.name)}() {
  return (
    ${jsx}
  );
}`;

    const dataBlob = new Blob([reactComponent], { type: "text/javascript" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${toPascalCase(selectedPage.name)}.jsx`;
    link.click();
    URL.revokeObjectURL(url);
    setIsOpen(false);
  };

  const generateHTML = (node: any, indent = 2): string => {
    const spaces = " ".repeat(indent);
    const tag = node.type === "container" ? "div" : node.type;
    const className = node.props?.className || "";
    const text = node.props?.text || "";
    const src = node.props?.src || "";
    const alt = node.props?.alt || "";

    let html = `${spaces}<${tag}`;
    if (className) html += ` class="${className}"`;
    if (src) html += ` src="${src}"`;
    if (alt) html += ` alt="${alt}"`;
    html += ">";

    if (text) {
      html += text;
    }

    if (node.children && node.children.length > 0) {
      html += "\n";
      node.children.forEach((child: any) => {
        html += generateHTML(child, indent + 2) + "\n";
      });
      html += spaces;
    }

    html += `</${tag}>`;
    return html;
  };

  const generateJSX = (node: any, indent = 4): string => {
    const spaces = " ".repeat(indent);
    const tag = node.type === "container" ? "div" : node.type;
    const className = node.props?.className || "";
    const text = node.props?.text || "";
    const src = node.props?.src || "";
    const alt = node.props?.alt || "";

    let jsx = `${spaces}<${tag}`;
    if (className) jsx += ` className="${className}"`;
    if (src) jsx += ` src="${src}"`;
    if (alt) jsx += ` alt="${alt}"`;
    jsx += ">";

    if (text) {
      jsx += text;
    }

    if (node.children && node.children.length > 0) {
      jsx += "\n";
      node.children.forEach((child: any) => {
        jsx += generateJSX(child, indent + 2) + "\n";
      });
      jsx += spaces;
    }

    jsx += `</${tag}>`;
    return jsx;
  };

  const toPascalCase = (str: string) => {
    return str
      .replace(/[^a-zA-Z0-9]/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join("");
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-md bg-[#8b5cf6] px-4 py-1.5 text-sm font-medium transition hover:bg-[#7c3aed]"
      >
        Export
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-md border border-[#2a2a2a] bg-[#141414] py-1 shadow-lg">
          <button
            onClick={downloadHTML}
            className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-gray-300 transition hover:bg-[#1f1f1f] hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            Export as HTML
          </button>
          <button
            onClick={downloadReact}
            className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-gray-300 transition hover:bg-[#1f1f1f] hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
            Export as React
          </button>
          <button
            onClick={downloadJSON}
            className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-gray-300 transition hover:bg-[#1f1f1f] hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export as JSON
          </button>
        </div>
      )}
    </div>
  );
}
