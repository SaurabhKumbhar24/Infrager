export default function FooterCredit() {
  return (
    <footer className="border-t border-sandstone">
      <div className="mx-auto flex h-14 max-w-6xl flex-wrap items-center justify-between gap-2 px-6">
        <span className="mono text-xs text-muted">
          © {new Date().getFullYear()} Infrager · MIT licensed · free
        </span>
        <span className="text-xs text-muted">
          Developed by the{" "}
          <a
            href="https://www.getfluiq.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-cobalt hover:underline"
          >
            FluiqAI team
          </a>
        </span>
      </div>
    </footer>
  );
}
