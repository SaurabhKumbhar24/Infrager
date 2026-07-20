import type { Metadata } from "next";
import { Figtree, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/contexts/ThemeContext";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://infrager.getfluiq.com"),
  title: {
    default: "Infrager — Draw your architecture. Ship secure Terraform.",
    template: "%s · Infrager",
  },
  description:
    "Free, open-source tool that turns drag-and-drop AWS and GCP architecture diagrams into production-ready Terraform, with live security linting: open security groups, public buckets, unencrypted storage, and overprivileged IAM flagged while you draw.",
  keywords: [
    "terraform generator",
    "infrastructure as code",
    "cloud architecture diagram",
    "diagram to terraform",
    "AWS terraform",
    "GCP terraform",
    "security linting",
    "IaC security",
    "drag and drop cloud designer",
    "open source",
  ],
  authors: [{ name: "FluiqAI team", url: "https://www.getfluiq.com" }],
  creator: "FluiqAI",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "https://infrager.getfluiq.com",
    siteName: "Infrager",
    title: "Infrager — Draw your architecture. Ship secure Terraform.",
    description:
      "Drag-and-drop AWS and GCP diagrams into production-ready Terraform, with security linting that flags problems while you draw. Open source and free.",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "Infrager — Draw your architecture. Ship secure Terraform.",
    description:
      "Drag-and-drop AWS and GCP diagrams into production-ready Terraform, with live security linting. Open source and free.",
  },
  icons: { icon: "/logo.svg" },
};

// Runs before hydration so the correct theme class is on <html> before first
// paint: no light-mode flash for dark-theme users.
const themeInitScript = `(function(){try{var t=localStorage.getItem('infrager-theme')||(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${figtree.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <link rel="alternate" type="text/plain" title="LLM context (summary)" href="/llms.txt" />
        <link rel="alternate" type="text/plain" title="LLM context (full)" href="/llms-full.txt" />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
