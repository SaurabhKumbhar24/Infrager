"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Moon01Icon, Sun01Icon } from "@hugeicons/core-free-icons";
import { useTheme } from "@/contexts/ThemeContext";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { toggle } = useTheme();

  // Both icons are ALWAYS rendered; which one is visible is decided purely by
  // CSS via the `html.dark` class that the pre-hydration script in layout.tsx
  // sets before React runs. Identical markup on server and first client
  // render = no hydration mismatch; the rotate/fade is a plain CSS transition.
  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className={`grid size-8 place-items-center rounded-lg text-muted transition-colors hover:text-ink ${className}`}
    >
      {/* Moon — shown in light mode (click → switch to dark) */}
      <span className="col-start-1 row-start-1 flex items-center justify-center transition-all duration-200 dark:rotate-90 dark:scale-0 dark:opacity-0">
        <HugeiconsIcon icon={Moon01Icon} size={16} />
      </span>
      {/* Sun — shown in dark mode (click → switch to light) */}
      <span className="col-start-1 row-start-1 flex rotate-90 scale-0 items-center justify-center opacity-0 transition-all duration-200 dark:rotate-0 dark:scale-100 dark:opacity-100">
        <HugeiconsIcon icon={Sun01Icon} size={16} />
      </span>
    </button>
  );
}
