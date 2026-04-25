"use client";

import { useState, useEffect } from "react";

interface FileChange {
  path: string;
  status: "modified" | "added" | "deleted";
}

export function SourceControlPanel() {
  const [commitMessage, setCommitMessage] = useState("");
  const [isCommitting, setIsCommitting] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [branch, setBranch] = useState("main");
  const [changes, setChanges] = useState<FileChange[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const loadStatus = async () => {
    try {
      const response = await fetch("/api/git/status");
      const data = await response.json();
      
      if (data.changes) {
        setChanges(data.changes);
      }
      if (data.branch) {
        setBranch(data.branch);
      }
    } catch (error) {
      console.error("Failed to load git status:", error);
    }
  };

  useEffect(() => {
    loadStatus();
    // Refresh status every 5 seconds
    const interval = setInterval(loadStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCommit = async () => {
    if (!commitMessage.trim()) return;

    setIsCommitting(true);
    setStatusMessage(null);

    try {
      const response = await fetch("/api/git/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: commitMessage }),
      });

      if (response.ok) {
        setCommitMessage("");
        setStatusMessage("Changes committed successfully");
        await loadStatus();
      } else {
        setStatusMessage("Failed to commit changes");
      }
    } catch (error) {
      setStatusMessage("Failed to commit changes");
    } finally {
      setIsCommitting(false);
    }
  };

  const handlePush = async () => {
    setIsPushing(true);
    setStatusMessage(null);

    try {
      const response = await fetch("/api/git/push", {
        method: "POST",
      });

      if (response.ok) {
        setStatusMessage("Pushed to remote successfully");
      } else {
        setStatusMessage("Failed to push changes");
      }
    } catch (error) {
      setStatusMessage("Failed to push changes");
    } finally {
      setIsPushing(false);
    }
  };

  const handlePull = async () => {
    setIsPulling(true);
    setStatusMessage(null);

    try {
      const response = await fetch("/api/git/pull", {
        method: "POST",
      });

      if (response.ok) {
        setStatusMessage("Pulled from remote successfully");
        await loadStatus();
      } else {
        setStatusMessage("Failed to pull changes");
      }
    } catch (error) {
      setStatusMessage("Failed to pull changes");
    } finally {
      setIsPulling(false);
    }
  };

  const getStatusIcon = (status: FileChange["status"]) => {
    switch (status) {
      case "modified":
        return <span className="text-yellow-500">M</span>;
      case "added":
        return <span className="text-green-500">A</span>;
      case "deleted":
        return <span className="text-red-500">D</span>;
    }
  };

  return (
    <div className="flex h-full flex-col bg-[#0a0a0a]">
      {/* Header */}
      <div className="border-b border-[#2a2a2a] px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Source Control</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePull}
              disabled={isPulling}
              className="rounded p-1 text-gray-400 transition hover:bg-[#1f1f1f] hover:text-white disabled:opacity-50"
              title="Pull"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              onClick={handlePush}
              disabled={isPushing || changes.length > 0}
              className="rounded p-1 text-gray-400 transition hover:bg-[#1f1f1f] hover:text-white disabled:opacity-50"
              title="Push"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </button>
            <button
              onClick={loadStatus}
              className="rounded p-1 text-gray-400 transition hover:bg-[#1f1f1f] hover:text-white"
              title="Refresh"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>{branch}</span>
        </div>
        {statusMessage && (
          <div className="mt-2 rounded bg-[#1f1f1f] px-2 py-1 text-xs text-gray-300">
            {statusMessage}
          </div>
        )}
      </div>

      {/* Changes */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3">
          <div className="mb-2 text-xs font-medium text-gray-400">
            Changes ({changes.length})
          </div>
          {changes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <svg className="mb-2 h-12 w-12 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-gray-500">No changes</p>
            </div>
          ) : (
            <div className="space-y-1">
              {changes.map((change, index) => (
                <div
                  key={index}
                  className="group flex items-center gap-2 rounded px-2 py-1.5 text-sm transition hover:bg-[#1f1f1f]"
                >
                  <span className="font-mono text-xs font-semibold">
                    {getStatusIcon(change.status)}
                  </span>
                  <span className="flex-1 truncate text-gray-300" title={change.path}>
                    {change.path}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Commit Section */}
      {changes.length > 0 && (
        <div className="border-t border-[#2a2a2a] p-3">
          <textarea
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            placeholder="Commit message..."
            className="mb-2 w-full resize-none rounded-md border border-[#2a2a2a] bg-[#141414] px-3 py-2 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-[#8b5cf6]"
            rows={3}
          />
          <button
            onClick={handleCommit}
            disabled={!commitMessage.trim() || isCommitting}
            className="w-full rounded-md bg-[#8b5cf6] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#7c3aed] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isCommitting ? "Committing..." : "Commit"}
          </button>
        </div>
      )}
    </div>
  );
}
