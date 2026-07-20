"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Logout01Icon } from "@hugeicons/core-free-icons";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Logo from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { apiFetch, clearSession, getStoredUser, getToken } from "@/lib/api";
import type { ProjectSummary } from "@/lib/types/project";
import ProjectCard from "./ProjectCard";

export default function DashboardClient() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);
  const [creating, setCreating] = useState(false);
  const user = typeof window !== "undefined" ? getStoredUser() : null;

  const bail = useCallback(() => {
    clearSession();
    router.replace("/login?next=/dashboard");
  }, [router]);

  useEffect(() => {
    if (!getToken()) {
      bail();
      return;
    }
    (async () => {
      const res = await apiFetch("/api/projects");
      if (!res || res.status === 401) {
        bail();
        return;
      }
      const data = await res.json().catch(() => null);
      setProjects(data?.projects ?? []);
    })();
  }, [bail]);

  async function createProject() {
    setCreating(true);
    const res = await apiFetch("/api/projects", {
      method: "POST",
      body: JSON.stringify({ name: `Untitled architecture ${(projects?.length ?? 0) + 1}` }),
    });
    const data = await res?.json().catch(() => null);
    if (res?.ok && data?.project) {
      router.push(`/editor/${data.project.id}`);
    } else {
      setCreating(false);
    }
  }

  function signOut() {
    clearSession();
    router.push("/login");
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-sandstone bg-paper/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Logo />
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <span className="text-[13px] text-muted">{user?.email}</span>
            <button
              onClick={signOut}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-sandstone px-3 text-[13px] font-medium hover:bg-sand"
            >
              <HugeiconsIcon icon={Logout01Icon} size={15} />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
            <p className="mt-1 text-sm text-muted">
              {projects === null ? (
                "Loading…"
              ) : (
                <>
                  <span className="mono">{projects.length}</span>{" "}
                  {projects.length === 1 ? "architecture" : "architectures"} in your workspace
                </>
              )}
            </p>
          </div>
          <button
            onClick={createProject}
            disabled={creating || projects === null}
            className="flex h-11 items-center gap-2 rounded-lg bg-ink px-5 font-semibold text-paper transition hover:-translate-y-px hover:bg-night disabled:opacity-60"
          >
            <HugeiconsIcon icon={Add01Icon} size={16} />
            {creating ? "Creating…" : "New project"}
          </button>
        </div>

        {projects !== null &&
          (projects.length === 0 ? (
            <button
              onClick={createProject}
              className="mt-10 flex h-56 w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-sandstone-deep text-muted transition hover:border-cobalt hover:text-ink"
            >
              <HugeiconsIcon icon={Add01Icon} size={24} />
              <span className="text-sm font-medium">
                No projects yet. Create your first architecture.
              </span>
            </button>
          ) : (
            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onRenamed={(name) =>
                    setProjects((ps) =>
                      (ps ?? []).map((p) => (p.id === project.id ? { ...p, name } : p))
                    )
                  }
                  onDeleted={() =>
                    setProjects((ps) => (ps ?? []).filter((p) => p.id !== project.id))
                  }
                />
              ))}
            </div>
          ))}
      </main>
    </div>
  );
}
