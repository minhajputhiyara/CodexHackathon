"use client";

import dynamic from "next/dynamic";
import {
  ArrowUp,
  FileText,
  Globe,
  Image,
  LogOut,
  PanelsTopLeft,
  Palette,
  Pencil,
  Plus,
  Sparkles,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
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

const ACTIVE_PROJECT_STORAGE_KEY = "designplate_active_project_id";

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
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [isProjectHydrated, setIsProjectHydrated] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [workspaceMode, setWorkspaceMode] = useState<"dashboard" | "editor">(
    "dashboard",
  );
  const [dashboardPrompt, setDashboardPrompt] = useState("");
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
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
  const skipNextSaveRef = useRef(false);

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
      return [];
    }

    const data = (await response.json()) as { projects?: ProjectSummary[] };
    const nextProjects = data.projects ?? [];
    setProjects(nextProjects);
    return nextProjects;
  };

  const loadProject = async (projectId: string) => {
    setIsProjectHydrated(false);

    const response = await fetch(`/api/projects/${projectId}`);

    if (!response.ok) {
      setIsProjectHydrated(true);
      return false;
    }

    const data = (await response.json()) as { project?: WebsiteProject };

    if (!data.project) {
      setIsProjectHydrated(true);
      return false;
    }

    const nextProject = normalizeProject(data.project);
    skipNextSaveRef.current = true;
    setProject(nextProject);
    setProjectTitle(nextProject.name);
    setSelectedPageId(nextProject.pages[0]?.id ?? null);
    setSelectedElementId(null);
    setActiveProjectId(projectId);
    setWorkspaceMode("editor");
    setSaveStatus("saved");
    setIsProjectHydrated(true);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(ACTIVE_PROJECT_STORAGE_KEY, projectId);
    }

    return true;
  };

  const createSavedProject = async (nextProject: WebsiteProject) => {
    const response = await fetch("/api/projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ project: nextProject }),
    });

    if (!response.ok) {
      throw new Error("Could not save the generated project.");
    }

    const data = (await response.json()) as {
      project?: WebsiteProject;
      summary?: ProjectSummary;
    };

    if (!data.project || !data.summary) {
      throw new Error("Project save returned an invalid response.");
    }

    const normalizedProject = normalizeProject(data.project);
    skipNextSaveRef.current = true;
    setProject(normalizedProject);
    setProjectTitle(normalizedProject.name);
    setSelectedPageId(normalizedProject.pages[0]?.id ?? null);
    setSelectedElementId(null);
    setActiveProjectId(data.summary.id);
    setWorkspaceMode("editor");
    setSaveStatus("saved");
    setIsProjectHydrated(true);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(ACTIVE_PROJECT_STORAGE_KEY, data.summary.id);
    }

    setProjects((currentProjects) => [
      data.summary!,
      ...currentProjects.filter((item) => item.id !== data.summary!.id),
    ]);
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
    setActiveProjectId(null);
    setIsProjectHydrated(false);
    setWorkspaceMode("dashboard");
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(ACTIVE_PROJECT_STORAGE_KEY);
    }
    setAuthStatus("unauthenticated");
  };

  useEffect(() => {
    if (
      authStatus !== "authenticated" ||
      !activeProjectId ||
      !isProjectHydrated
    ) {
      return;
    }

    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }

    setSaveStatus("saving");

    const saveTimer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/projects/${activeProjectId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ project }),
        });

        if (!response.ok) {
          setSaveStatus("error");
          return;
        }

        const data = (await response.json()) as {
          summary?: ProjectSummary;
        };
        setSaveStatus("saved");
        setProjects((currentProjects) =>
          currentProjects.map((item) =>
            item.id === activeProjectId && data.summary ? data.summary : item,
          ),
        );
      } catch {
        setSaveStatus("error");
      }
    }, 700);

    return () => window.clearTimeout(saveTimer);
  }, [activeProjectId, authStatus, isProjectHydrated, project]);

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

  const createProjectFromDashboardPrompt = async (
    event?: FormEvent<HTMLFormElement>,
  ) => {
    event?.preventDefault();
    const trimmedPrompt = dashboardPrompt.trim();

    if (!trimmedPrompt || isCreatingProject) {
      return;
    }

    setDashboardError(null);
    setIsCreatingProject(true);
    setIsProjectHydrated(false);

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
        message?: string;
      };

      if (!data.project && !data.tree) {
        setDashboardError(data.message ?? "Could not generate a project.");
        return;
      }

      const generatedProject = data.project
        ? normalizeProject(data.project)
        : normalizeProject({
            ...sampleWebsiteProject,
            name: trimmedPrompt.slice(0, 64),
            pages: [
              {
                ...sampleWebsiteProject.pages[0],
                tree: data.tree!,
              },
            ],
          });

      await createSavedProject(generatedProject);
      setDashboardPrompt("");
    } catch {
      setDashboardError("Could not create the project. Try again.");
      setIsProjectHydrated(true);
    } finally {
      setIsCreatingProject(false);
    }
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

  if (workspaceMode === "dashboard") {
    return (
      <DashboardHome
        authUser={authUser}
        dashboardError={dashboardError}
        dashboardPrompt={dashboardPrompt}
        isCreatingProject={isCreatingProject}
        onChangePrompt={setDashboardPrompt}
        onCreateProject={createProjectFromDashboardPrompt}
        onLogout={logout}
        onSelectProject={loadProject}
        projects={projects}
      />
    );
  }

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white">
      {/* Top Bar */}
      <div className="fixed left-0 right-0 top-0 z-50 flex h-12 items-center justify-between border-b border-[#2a2a2a] bg-[#0a0a0a] px-4">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="designplate" className="h-8 w-auto rounded-md" />
          <button
            onClick={() => setIsEditingTitle(true)}
            className="rounded px-2 py-1 text-lg font-bold transition hover:bg-[#1f1f1f]"
          >
            <span className="text-white">design</span>
            <span className="bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] bg-clip-text text-transparent">plate</span>
          </button>
          <span className="rounded bg-[#1f1f1f] px-2 py-0.5 text-xs text-gray-400">Autosaved</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#8b5cf6]">
            <PanelsTopLeft className="h-5 w-5 text-white" strokeWidth={2} />
          </div>
          <span className="text-sm font-medium">{project.name}</span>
          <span className="rounded bg-[#1f1f1f] px-2 py-0.5 text-xs text-gray-400">
            {saveStatus === "saving"
              ? "Saving..."
              : saveStatus === "error"
                ? "Save failed"
                : "Autosaved"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="rounded-md border border-[#2a2a2a] px-3 py-1.5 text-sm font-medium text-gray-300 transition hover:bg-[#1f1f1f] hover:text-white"
            onClick={() => setWorkspaceMode("dashboard")}
            type="button"
          >
            Projects
          </button>
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
          <UserProjects
            activeProjectId={activeProjectId}
            onSelectProject={loadProject}
            projects={projects}
          />
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

type DashboardHomeProps = {
  authUser: AuthUser | null;
  dashboardError: string | null;
  dashboardPrompt: string;
  isCreatingProject: boolean;
  onChangePrompt: (prompt: string) => void;
  onCreateProject: (event?: FormEvent<HTMLFormElement>) => void;
  onLogout: () => void;
  onSelectProject: (projectId: string) => void;
  projects: ProjectSummary[];
};

function DashboardHome({
  authUser,
  dashboardError,
  dashboardPrompt,
  isCreatingProject,
  onChangePrompt,
  onCreateProject,
  onLogout,
  onSelectProject,
  projects,
}: DashboardHomeProps) {
  return (
    <div className="min-h-screen overflow-y-auto bg-black text-white">
      <header className="flex h-14 items-center justify-between border-b border-[#171717] px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#8b5cf6]">
            <PanelsTopLeft className="h-5 w-5 text-white" strokeWidth={2} />
          </div>
          <span className="text-sm font-semibold">designPlate</span>
        </div>
        <button
          className="flex h-9 items-center gap-2 rounded-full bg-[#171717] pl-1 pr-3 text-sm text-gray-300 transition hover:bg-[#222] hover:text-white"
          onClick={onLogout}
          type="button"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#8b5cf6] text-xs font-medium text-white">
            {authUser?.name.charAt(0).toUpperCase() ?? "U"}
          </span>
          <LogOut className="h-4 w-4" />
        </button>
      </header>

      <main className="px-6 pb-12">
        <section className="mx-auto flex min-h-[520px] max-w-5xl flex-col items-center justify-center py-16 text-center">
          <h1 className="text-4xl font-bold tracking-normal text-white md:text-5xl">
            Think it. Explore it.
          </h1>
          <p className="mt-4 text-lg text-gray-500">
            Explore freely, iterate fast. Your design, AI-powered.
          </p>

          <div className="mt-10 flex rounded-full border border-[#2a2a2a] bg-[#151519] p-1">
            <button
              className="rounded-full bg-[#46464f] px-7 py-3 text-sm font-semibold text-white"
              type="button"
            >
              Design on web
            </button>
            <button
              className="flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold text-gray-400"
              type="button"
            >
              Integrate with
              <Sparkles className="h-4 w-4 text-[#8b5cf6]" />
            </button>
          </div>

          <form
            className="mt-14 w-full max-w-4xl rounded-[28px] border border-[#303039] bg-[#18181d] p-5 text-left shadow-2xl"
            onSubmit={onCreateProject}
          >
            <textarea
              className="min-h-28 w-full resize-none bg-transparent text-xl text-white outline-none placeholder:text-gray-500"
              onChange={(event) => onChangePrompt(event.target.value)}
              placeholder="Describe what you want to create..."
              value={dashboardPrompt}
            />
            <div className="mt-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-gray-400">
                <button className="transition hover:text-white" type="button">
                  <Image className="h-5 w-5" />
                </button>
                <button className="transition hover:text-white" type="button">
                  <Pencil className="h-5 w-5" />
                </button>
                <span className="text-lg leading-none">/</span>
                <button className="transition hover:text-white" type="button">
                  <FileText className="h-5 w-5" />
                </button>
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Sparkles className="h-4 w-4 text-[#8b5cf6]" />
                  Fast generate
                </span>
              </div>

              <div className="flex items-center gap-4">
                <span className="hidden items-center gap-2 text-sm font-medium text-gray-400 sm:flex">
                  <Palette className="h-5 w-5" />
                  Use Design System
                </span>
                <button
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!dashboardPrompt.trim() || isCreatingProject}
                  type="submit"
                >
                  <ArrowUp className="h-7 w-7" />
                </button>
              </div>
            </div>
            {dashboardError ? (
              <p className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {dashboardError}
              </p>
            ) : null}
          </form>

          <div className="mt-8 flex flex-wrap justify-center gap-3 rounded-full bg-[#161616] px-4 py-2 text-sm font-medium text-gray-400">
            <button className="flex items-center gap-2 px-2 py-1 transition hover:text-white" type="button">
              <Image className="h-4 w-4" />
              Recreate Screenshot
            </button>
            <button className="flex items-center gap-2 px-2 py-1 transition hover:text-white" type="button">
              <Globe className="h-4 w-4" />
              Import from Site
            </button>
            <button className="flex items-center gap-2 px-2 py-1 transition hover:text-white" type="button">
              <Sparkles className="h-4 w-4" />
              Explore Effects
            </button>
          </div>
        </section>

        <section className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold">Recent Projects</h2>
            <button className="text-sm font-semibold text-gray-300 transition hover:text-white" type="button">
              Extract Design System
            </button>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <button
              className="flex min-h-60 flex-col items-center justify-center rounded-2xl border border-dashed border-[#45454d] bg-[#18181d] text-gray-400 transition hover:border-[#8b5cf6] hover:text-white"
              onClick={() => onChangePrompt("")}
              type="button"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#45454d]">
                <Plus className="h-8 w-8" />
              </span>
              <span className="mt-5 text-lg font-medium">New Project</span>
            </button>

            {projects.map((item) => (
              <button
                className="group min-h-60 rounded-2xl bg-[#252529] p-4 text-left transition hover:bg-[#303035]"
                key={item.id}
                onClick={() => onSelectProject(item.id)}
                type="button"
              >
                <div className="flex h-36 items-center justify-center rounded-xl bg-[#303036] transition group-hover:bg-[#3a3a42]">
                  <PanelsTopLeft className="h-10 w-10 text-[#777782]" />
                </div>
                <div className="mt-4 truncate text-base font-semibold text-white">
                  {item.name}
                </div>
                <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
                  <span>{item.pagesCount} pages</span>
                  <span>{new Date(item.updatedAt).toLocaleDateString()}</span>
                </div>
              </button>
            ))}
          </div>
        </section>
      </main>
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

      <div className="hidden flex-1 border-l border-[#2a2a2a] bg-[#111111] lg:flex lg:items-center lg:justify-center">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-white">
            Build <span className="text-[#8b5cf6]">beautiful</span> product with{" "}
            <span className="text-[#8b5cf6]">simple</span> prompt
          </h1>
        </div>
      </div>
    </div>
  );
}

function UserProjects({
  activeProjectId,
  onSelectProject,
  projects,
}: {
  activeProjectId: string | null;
  onSelectProject: (projectId: string) => void;
  projects: ProjectSummary[];
}) {
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
              className={`rounded-md border p-3 text-left transition hover:border-[#8b5cf6] hover:bg-[#1b1b1b] ${
                item.id === activeProjectId
                  ? "border-[#8b5cf6] bg-[#1b1625]"
                  : "border-[#2a2a2a] bg-[#151515]"
              }`}
              key={item.id}
              onClick={() => onSelectProject(item.id)}
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
