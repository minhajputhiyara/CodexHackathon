"use client";

import dynamic from "next/dynamic";
import { PanelsTopLeft } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { AIChatPanel } from "@/components/ai-chat-panel";
import { ElementInspector } from "@/components/element-inspector";
import { LayersPanel } from "@/components/layers-panel";
import { PageListPanel } from "@/components/page-list-panel";
import { demoPrompts } from "@/lib/demo-prompts";
import { sampleWebsiteProject } from "@/lib/sample-website-project";
import type { UIElementProps } from "@/lib/ui-schema";
import { findNodeById } from "@/lib/ui-tree";
import {
  findPageById,
  normalizeProject,
  updateNodePropsInPage,
  updatePageById,
  updatePageFrame,
  updatePageTreeById,
} from "@/lib/website-project";
import type { WebsiteProject } from "@/lib/website-project-schema";

const TldrawSiteCanvas = dynamic(
  () =>
    import("@/components/tldraw-site-canvas").then(
      (mod) => mod.TldrawSiteCanvas,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-[#0a0a0a] text-sm text-gray-500">
        Loading workspace...
      </div>
    ),
  },
);

type AuthUser = {
  id: string;
  email: string;
  name: string;
};

type ProjectSummary = {
  id: string;
  name: string;
  pagesCount: number;
  updatedAt: string;
};

export function EditorShell() {
  const [authStatus, setAuthStatus] = useState<
    "checking" | "authenticated" | "unauthenticated"
  >("checking");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authForm, setAuthForm] = useState({
    email: "",
    name: "",
    password: "",
  });
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [project, setProject] = useState<WebsiteProject>(() =>
    normalizeProject(sampleWebsiteProject),
  );
  const [selectedPageId, setSelectedPageId] = useState<string | null>("home");
  const [selectedElementId, setSelectedElementId] = useState<string | null>(
    "home-headline",
  );
  const [hoveredElementId, setHoveredElementId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [activeTab, setActiveTab] = useState<"design" | "advanced">("design");
  const [projectTitle, setProjectTitle] = useState("Untitled Project");
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const selectedPage = useMemo(
    () => findPageById(project, selectedPageId),
    [project, selectedPageId],
  );
  const selectedNode = useMemo(
    () => findNodeById(selectedPage?.tree ?? project.pages[0]?.tree, selectedElementId),
    [project.pages, selectedElementId, selectedPage?.tree],
  );

  const loadProjects = async () => {
    const response = await fetch("/api/projects");

    if (!response.ok) {
      setProjects([]);
      return;
    }

    const data = (await response.json()) as { projects?: ProjectSummary[] };
    setProjects(data.projects ?? []);
  };

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      try {
        const response = await fetch("/api/auth/me");
        const data = (await response.json()) as { user?: AuthUser | null };

        if (!isMounted) {
          return;
        }

        if (response.ok && data.user) {
          setAuthUser(data.user);
          setAuthStatus("authenticated");
          await loadProjects();
        } else {
          setAuthStatus("unauthenticated");
        }
      } catch {
        if (isMounted) {
          setAuthStatus("unauthenticated");
        }
      }
    }

    checkSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const submitAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError(null);
    setIsAuthenticating(true);

    try {
      const response = await fetch(`/api/auth/${authMode}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(authForm),
      });
      const data = (await response.json()) as {
        message?: string;
        user?: AuthUser;
      };

      if (!response.ok || !data.user) {
        setAuthError(data.message ?? "Authentication failed.");
        return;
      }

      setAuthUser(data.user);
      setAuthStatus("authenticated");
      setAuthForm({ email: "", name: "", password: "" });
      await loadProjects();
    } catch {
      setAuthError("Could not reach the authentication server.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setAuthUser(null);
    setProjects([]);
    setAuthStatus("unauthenticated");
  };

  const updateSelectedNode = (props: Partial<UIElementProps>) => {
    if (!selectedPageId || !selectedElementId) {
      return;
    }

    setProject((currentProject) =>
      updateNodePropsInPage(
        currentProject,
        selectedPageId,
        selectedElementId,
        props,
      ),
    );
  };

  const selectPage = (pageId: string) => {
    setSelectedPageId(pageId);
    setSelectedElementId(null);
    setHoveredElementId(null);
  };

  const selectElement = (pageId: string, elementId: string) => {
    setSelectedPageId(pageId);
    setSelectedElementId(elementId);
  };

  const generateUi = async (prompt: string) => {
    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt) {
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch("/api/generate-ui", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: trimmedPrompt }),
      });

      const data = (await response.json()) as {
        project?: WebsiteProject;
        tree?: WebsiteProject["pages"][number]["tree"];
        fallback?: boolean;
        message?: string;
      };

      if (!data.project && !data.tree) {
        return;
      }

      if (data.project) {
        const nextProject = normalizeProject(data.project);
        setProject(nextProject);
        setSelectedPageId(nextProject.pages[0]?.id ?? null);
        setSelectedElementId(null);
      } else if (data.tree && selectedPageId) {
        setProject((currentProject) =>
          updatePageTreeById(currentProject, selectedPageId, data.tree!),
        );
        setSelectedElementId(data.tree.children?.[0]?.id ?? data.tree.id);
      }
    } catch {
      const nextProject = normalizeProject(sampleWebsiteProject);
      setProject(nextProject);
      setSelectedPageId(nextProject.pages[0]?.id ?? null);
      setSelectedElementId(null);
    } finally {
      setIsGenerating(false);
    }
  };

  if (authStatus === "checking") {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0a] text-sm text-gray-400">
        Checking session...
      </div>
    );
  }

  if (authStatus === "unauthenticated") {
    return (
      <AuthPanel
        authError={authError}
        authForm={authForm}
        authMode={authMode}
        isAuthenticating={isAuthenticating}
        onChange={setAuthForm}
        onModeChange={(mode) => {
          setAuthMode(mode);
          setAuthError(null);
        }}
        onSubmit={submitAuth}
      />
    );
  }

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white">
      {/* Top Bar */}
      <div className="fixed left-0 right-0 top-0 z-50 flex h-12 items-center justify-between border-b border-[#2a2a2a] bg-[#0a0a0a] px-4">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="designplate" className="h-8 w-8 rounded-md" />
          <button
            onClick={() => setIsEditingTitle(true)}
            className="rounded px-2 py-1 text-lg font-bold transition hover:bg-[#1f1f1f]"
          >
            <span className="text-white">design</span>
            <span className="bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] bg-clip-text text-transparent">plate</span>
          </button>
          <span className="rounded bg-[#1f1f1f] px-2 py-0.5 text-xs text-gray-400">Autosaved</span>
        </div>

        <div className="flex items-center gap-2">
          <button className="rounded p-2 hover:bg-[#1f1f1f]">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
          </button>
          <button className="rounded p-2 hover:bg-[#1f1f1f]">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </button>
          <button className="rounded p-2 hover:bg-[#1f1f1f]">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button className="rounded-md bg-[#8b5cf6] px-4 py-1.5 text-sm font-medium transition hover:bg-[#7c3aed]">
            Export
          </button>
          <button
            className="ml-2 flex h-8 items-center gap-2 rounded-full bg-[#1f1f1f] pl-1 pr-3 text-sm text-gray-300 transition hover:bg-[#262626] hover:text-white"
            onClick={logout}
            type="button"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#8b5cf6] text-xs font-medium text-white">
              {authUser?.name.charAt(0).toUpperCase() ?? "U"}
            </span>
            Sign out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="mt-12 flex w-full">
        {/* Left Sidebar - Layers */}
        <div className="flex w-64 flex-col border-r border-[#2a2a2a]">
          <div className="min-h-0 flex-1">
            <LayersPanel
              hoveredElementId={hoveredElementId}
            onHoverElement={setHoveredElementId}
            project={project}
              selectedPageId={selectedPageId}
              selectedElementId={selectedElementId}
              onSelectElement={selectElement}
            />
          </div>
          <UserProjects projects={projects} />
        </div>

        {/* Center - Canvas */}
        <div className="flex flex-1 flex-col">
          {/* Canvas Toolbar */}
          <div className="flex items-center justify-center gap-2 border-b border-[#2a2a2a] py-2">
            <button className="rounded p-1.5 hover:bg-[#1f1f1f]">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <button className="rounded p-1.5 hover:bg-[#1f1f1f]">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
            <button className="rounded p-1.5 hover:bg-[#1f1f1f]">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            <div className="mx-2 h-6 w-px bg-[#2a2a2a]"></div>
            <button className="rounded bg-[#8b5cf6] px-3 py-1 text-xs font-medium">
              Container
            </button>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 overflow-hidden">
            <TldrawSiteCanvas
              onFrameChange={(pageId, frame) =>
                setProject((currentProject) =>
                  updatePageFrame(currentProject, pageId, frame),
                )
              }
              hoveredElementId={hoveredElementId}
              onHoverElement={setHoveredElementId}
              onSelectElement={selectElement}
              onSelectPage={selectPage}
              project={project}
              selectedElementId={selectedElementId}
              selectedPageId={selectedPageId}
            />
          </div>

          {/* Pages Bar */}
          <div className="border-t border-[#2a2a2a] p-2">
            <PageListPanel
              onSelectPage={selectPage}
              project={project}
              selectedPageId={selectedPageId}
            />
          </div>
        </div>

        {/* Right Sidebar - Chat & Properties */}
        <div className="flex w-96 flex-col border-l border-[#2a2a2a]">
          {/* Tabs */}
          <div className="flex border-b border-[#2a2a2a]">
            <button
              onClick={() => setShowChat(true)}
              className={`flex-1 border-b-2 px-4 py-3 text-sm font-medium transition ${
                showChat
                  ? "border-[#8b5cf6] text-white"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => setShowChat(false)}
              className={`flex-1 border-b-2 px-4 py-3 text-sm font-medium transition ${
                !showChat
                  ? "border-[#8b5cf6] text-white"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              Properties
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {showChat ? (
              <AIChatPanel
                onGenerate={generateUi}
                isGenerating={isGenerating}
                demoPrompts={demoPrompts}
              />
            ) : (
              <div className="h-full overflow-y-auto p-4">
                {/* Properties Tabs */}
                <div className="mb-4 flex gap-2">
                  <button
                    onClick={() => setActiveTab("design")}
                    className={`rounded px-3 py-1.5 text-sm font-medium transition ${
                      activeTab === "design"
                        ? "bg-[#8b5cf6] text-white"
                        : "bg-[#141414] text-gray-400 hover:text-white"
                    }`}
                  >
                    Design
                  </button>
                  <button
                    onClick={() => setActiveTab("advanced")}
                    className={`rounded px-3 py-1.5 text-sm font-medium transition ${
                      activeTab === "advanced"
                        ? "bg-[#8b5cf6] text-white"
                        : "bg-[#141414] text-gray-400 hover:text-white"
                    }`}
                  >
                    Advanced
                  </button>
                </div>

                <ElementInspector
                  onElementChange={updateSelectedNode}
                  onPageChange={(patch) => {
                    if (!selectedPageId) {
                      return;
                    }

                    setProject((currentProject) =>
                      updatePageById(currentProject, selectedPageId, patch),
                    );
                  }}
                  selectedNode={selectedNode}
                  selectedPage={selectedPage}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

type AuthPanelProps = {
  authError: string | null;
  authForm: {
    email: string;
    name: string;
    password: string;
  };
  authMode: "login" | "signup";
  isAuthenticating: boolean;
  onChange: (form: AuthPanelProps["authForm"]) => void;
  onModeChange: (mode: "login" | "signup") => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function AuthPanel({
  authError,
  authForm,
  authMode,
  isAuthenticating,
  onChange,
  onModeChange,
  onSubmit,
}: AuthPanelProps) {
  const isSignup = authMode === "signup";

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white">
      <div className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3">
            <img src="/logo.png" alt="designplate" className="h-12 w-auto rounded-md" />
            <div>
              <h1 className="text-2xl font-bold">
                <span className="text-white">design</span>
                <span className="bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] bg-clip-text text-transparent">plate</span>
              </h1>
              <p className="text-sm text-gray-400">Sign in to open your projects.</p>
            </div>
          </div>

          <div className="mb-5 grid grid-cols-2 rounded-md border border-[#2a2a2a] bg-[#141414] p-1">
            <button
              className={`rounded px-3 py-2 text-sm font-medium transition ${
                !isSignup
                  ? "bg-[#8b5cf6] text-white"
                  : "text-gray-400 hover:text-white"
              }`}
              onClick={() => onModeChange("login")}
              type="button"
            >
              Login
            </button>
            <button
              className={`rounded px-3 py-2 text-sm font-medium transition ${
                isSignup
                  ? "bg-[#8b5cf6] text-white"
                  : "text-gray-400 hover:text-white"
              }`}
              onClick={() => onModeChange("signup")}
              type="button"
            >
              Sign up
            </button>
          </div>

          <form className="space-y-4" onSubmit={onSubmit}>
            {isSignup ? (
              <label className="block">
                <span className="mb-2 block text-sm text-gray-300">Name</span>
                <input
                  className="w-full rounded-md border border-[#2a2a2a] bg-[#141414] px-3 py-2 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-[#8b5cf6]"
                  onChange={(event) =>
                    onChange({ ...authForm, name: event.target.value })
                  }
                  placeholder="Minhaj"
                  value={authForm.name}
                />
              </label>
            ) : null}

            <label className="block">
              <span className="mb-2 block text-sm text-gray-300">Email</span>
              <input
                className="w-full rounded-md border border-[#2a2a2a] bg-[#141414] px-3 py-2 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-[#8b5cf6]"
                onChange={(event) =>
                  onChange({ ...authForm, email: event.target.value })
                }
                placeholder="you@example.com"
                type="email"
                value={authForm.email}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-gray-300">Password</span>
              <input
                className="w-full rounded-md border border-[#2a2a2a] bg-[#141414] px-3 py-2 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-[#8b5cf6]"
                onChange={(event) =>
                  onChange({ ...authForm, password: event.target.value })
                }
                placeholder="At least 6 characters"
                type="password"
                value={authForm.password}
              />
            </label>

            {authError ? (
              <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {authError}
              </p>
            ) : null}

            <button
              className="w-full rounded-md bg-[#8b5cf6] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#7c3aed] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isAuthenticating}
              type="submit"
            >
              {isAuthenticating
                ? "Authenticating..."
                : isSignup
                  ? "Create account"
                  : "Login"}
            </button>
          </form>
        </div>
      </div>

      <div className="hidden flex-1 border-l border-[#2a2a2a] bg-[#111111] p-10 lg:block">
        <div className="flex h-full flex-col justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[#8b5cf6]">
              User workspace
            </p>
            <h2 className="mt-4 max-w-lg text-4xl font-bold leading-tight">
              Generate, edit, and reopen the projects tied to your account.
            </h2>
          </div>
          <div className="grid gap-3">
            {["designPlate Starter Site", "Landing page draft", "Client website"].map(
              (name, index) => (
                <div
                  className="rounded-md border border-[#2a2a2a] bg-[#171717] p-4"
                  key={name}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{name}</span>
                    <span className="text-xs text-gray-500">
                      {index + 2} pages
                    </span>
                  </div>
                  <div className="mt-3 h-2 rounded bg-[#252525]" />
                </div>
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function UserProjects({ projects }: { projects: ProjectSummary[] }) {
  return (
    <div className="border-t border-[#2a2a2a] bg-[#101010] p-3">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase text-gray-500">
          Your projects
        </h2>
        <span className="rounded bg-[#1f1f1f] px-2 py-0.5 text-xs text-gray-500">
          {projects.length}
        </span>
      </div>

      <div className="grid max-h-52 gap-2 overflow-y-auto">
        {projects.length > 0 ? (
          projects.map((item) => (
            <button
              className="rounded-md border border-[#2a2a2a] bg-[#151515] p-3 text-left transition hover:border-[#8b5cf6] hover:bg-[#1b1b1b]"
              key={item.id}
              type="button"
            >
              <div className="truncate text-sm font-medium text-white">
                {item.name}
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                <span>{item.pagesCount} pages</span>
                <span>{new Date(item.updatedAt).toLocaleDateString()}</span>
              </div>
            </button>
          ))
        ) : (
          <div className="rounded-md border border-dashed border-[#2a2a2a] p-3 text-sm text-gray-500">
            No projects yet.
          </div>
        )}
      </div>
    </div>
  );
}
