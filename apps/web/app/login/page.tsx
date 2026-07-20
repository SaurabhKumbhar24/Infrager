import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";
import Logo from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

export const metadata = {
  title: "Sign in",
  description: "Sign in to your Infrager workspace.",
};

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center px-6">
      <ThemeToggle className="absolute right-5 top-5" />
      <div className="w-full max-w-sm">
        <Logo />
        <h1 className="mt-8 text-2xl font-bold tracking-tight">Sign in</h1>
        <p className="mb-8 mt-1 text-sm text-muted">Pick up where you left off.</p>
        <Suspense>
          <AuthForm mode="login" />
        </Suspense>
      </div>
    </main>
  );
}
