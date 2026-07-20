/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

/** logo.svg mark + "Infrager." wordmark, used across all surfaces. */
export default function Logo({
  size = 24,
  href = "/",
  wordmark = true,
}: {
  size?: number;
  href?: string | null;
  wordmark?: boolean;
}) {
  const content = (
    <span className="flex items-center gap-2">
      {/* Black mark on white glyphs: inverted in dark so the tile stays visible. */}
      <img
        src="/logo.svg"
        alt="Infrager logo"
        width={size}
        height={size}
        className="rounded-md dark:invert"
      />
      {wordmark && (
        <span className="text-lg font-bold tracking-tight">
          Infrager<span className="text-cobalt">.</span>
        </span>
      )}
    </span>
  );
  if (!href) return content;
  return <Link href={href}>{content}</Link>;
}
