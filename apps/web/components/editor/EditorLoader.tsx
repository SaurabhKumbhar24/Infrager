"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch, clearSession, getToken } from "@/lib/api";
import type { ProjectFull } from "@/lib/types/project";
import Editor from "./Editor";

/** Fetches the project client-side (Bearer auth), then mounts the editor. */
export default function EditorLoader({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [project, setProject] = useState<ProjectFull | null>(null);
  const [state, setState] = useState<"loading" | "notfound" | "ready">("loading");

  useEffect(() => {
    if (!getToken()) {
      router.replace(`/login?next=/editor/${projectId}`);
      return;
    }
    (async () => {
      const res = await apiFetch(`/api/projects/${projectId}`);
      if (!res || res.status === 401) {
        clearSession();
        router.replace(`/login?next=/editor/${projectId}`);
        return;
      }
      if (!res.ok) {
        setState("notfound");
        return;
      }
      const data = await res.json().catch(() => null);
      if (!data?.project) {
        setState("notfound");
        return;
      }
      setProject(data.project);
      setState("ready");
    })();
  }, [projectId, router]);

  if (state === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <span className="mono text-sm text-muted">Loading project…</span>
      </div>
    );
  }
  if (state === "notfound" || !project) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-sm text-muted">This project doesn&apos;t exist or isn&apos;t yours.</p>
        <Link href="/dashboard" className="text-sm font-medium text-cobalt hover:underline">
          Back to projects
        </Link>
      </div>
    );
  }
  return (
    <Editor projectId={project.id} initialName={project.name} initialDocument={project.document} />
  );
}
