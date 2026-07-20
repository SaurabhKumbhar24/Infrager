"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch, getToken, storeSession } from "@/lib/api";

const inputClass =
  "h-10 w-full rounded-lg border border-sandstone bg-sand/60 px-3 text-sm text-ink placeholder:text-muted/70 focus:outline-none focus:border-cobalt focus:ring-[3px] focus:ring-cobalt/20";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Already signed in? Straight to the dashboard.
  useEffect(() => {
    if (getToken()) router.replace("/dashboard");
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await apiFetch(`/api/auth/${mode}`, {
      method: "POST",
      body: JSON.stringify(mode === "signup" ? { name, email, password } : { email, password }),
    });
    const data = await res?.json().catch(() => null);
    if (!res?.ok || !data?.token) {
      setError(data?.error ?? "Could not reach the Infrager API. Is it running?");
      setBusy(false);
      return;
    }
    storeSession(data.token, data.user);
    const next = searchParams.get("next");
    router.push(next && next.startsWith("/") ? next : "/dashboard");
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {mode === "signup" && (
        <div>
          <label className="mb-1.5 block text-sm font-medium">Name</label>
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ada Lovelace"
            required
          />
        </div>
      )}
      <div>
        <label className="mb-1.5 block text-sm font-medium">Email</label>
        <input
          className={inputClass}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">Password</label>
        <input
          className={inputClass}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
          required
          minLength={mode === "signup" ? 8 : undefined}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="h-11 w-full rounded-lg bg-ink font-semibold text-paper transition hover:-translate-y-px hover:bg-night disabled:opacity-60"
      >
        {busy ? "One moment…" : mode === "signup" ? "Create account" : "Sign in"}
      </button>
      <p className="text-center text-sm text-muted">
        {mode === "signup" ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-cobalt hover:underline">
              Sign in
            </Link>
          </>
        ) : (
          <>
            New to Infrager?{" "}
            <Link href="/signup" className="font-medium text-cobalt hover:underline">
              Create an account
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
