import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";
import Logo from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

export const metadata = {
  title: "Create account",
  description:
    "Create a free Infrager account and turn cloud architecture diagrams into secure Terraform. Free, no card required.",
};

export default function SignupPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center px-6">
      <ThemeToggle className="absolute right-5 top-5" />
      <div className="w-full max-w-sm">
        <Logo />
        <h1 className="mt-8 text-2xl font-bold tracking-tight">Create your account</h1>
        <p className="mb-8 mt-1 text-sm text-muted">
          Free. Your diagrams stay in your workspace.
        </p>
        <Suspense>
          <AuthForm mode="signup" />
        </Suspense>
      </div>
    </main>
  );
}
