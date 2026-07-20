import Link from "next/link";
import FooterCredit from "@/components/FooterCredit";
import Logo from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Home() {
  // Auth lives client-side (Bearer token); the landing page stays static and
  // /dashboard itself bounces unauthenticated visitors to /login.
  const cta = { href: "/dashboard", label: "Open dashboard" };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-sandstone bg-paper/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Logo />
          <nav className="flex items-center gap-6">
            <a
              href="https://github.com/SaurabhKumbhar24/Infrager"
              target="_blank"
              className="text-[13px] text-muted hover:text-ink"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
            <Link href="/login" className="text-[13px] text-muted hover:text-ink">
              Sign in
            </Link>
            <ThemeToggle />
            <Link
              href={cta.href}
              className="flex h-10 items-center rounded-lg bg-ink px-5 text-sm font-semibold text-paper transition hover:-translate-y-px hover:bg-night"
            >
              {cta.label}
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 py-24">
        <h1 className="max-w-3xl text-[clamp(2.75rem,6vw,5rem)] font-bold leading-[0.98] tracking-[-0.04em]">
          Draw your architecture. Ship <span className="text-cobalt">secure</span> Terraform.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted">
          Infrager turns drag-and-drop cloud diagrams into production-ready HCL, and flags open
          security groups, public buckets, unencrypted storage, and overprivileged IAM while you
          draw, not after you deploy. AWS and Google Cloud today; every cloud is the plan.
        </p>
        <div className="mt-10 flex items-center gap-4">
          <Link
            href={cta.href}
            className="flex h-11 items-center rounded-lg bg-ink px-6 font-semibold text-paper transition hover:-translate-y-px hover:bg-night"
          >
            {cta.label}
          </Link>
          <span className="mono text-xs text-muted">Open source · free · no card required</span>
        </div>

        <div className="mt-24 grid max-w-3xl grid-cols-1 divide-y divide-sandstone border-y border-sandstone">
          {[
            ["Multi-cloud canvas", "AWS and GCP service palettes today, built to add every provider."],
            ["Diagram to HCL", "Typed relationships, dependency-ordered Terraform, honest TODOs."],
            ["Security linting as you draw", "Findings appear on the canvas the moment a risky toggle flips."],
            ["Your work, saved", "Projects live in your workspace; autosaved on every change."],
          ].map(([title, body]) => (
            <div key={title} className="flex items-baseline gap-6 py-5">
              <span className="w-56 shrink-0 text-[1.05rem] font-semibold tracking-tight">
                {title}
              </span>
              <span className="text-sm text-muted">{body}</span>
            </div>
          ))}
        </div>
      </main>

      <FooterCredit />
    </div>
  );
}
