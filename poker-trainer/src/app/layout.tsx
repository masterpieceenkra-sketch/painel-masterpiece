import type { Metadata } from "next";
import "./globals.css";
import { HeaderNav } from "@/components/HeaderNav";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const metadata: Metadata = {
  title: "Poker Trainer — MTT",
  description: "Treinador de poker MTT com ranges Nash e spots pré-resolvidos.",
};

// GitHub repo for "Reportar bug" and source links. Hard-coded rather than
// pulling from env so static export keeps working without runtime config.
const REPO_URL = "https://github.com/masterpieceenkra-sketch/painel-masterpiece";
const ISSUES_URL = `${REPO_URL}/issues/new`;

// Subtle dot-grid texture. Inlined as a CSS background so we don't need an
// asset round-trip. 1px dots on a 24px grid, very low alpha, fading into the
// slate-950 base.
const BODY_BG_STYLE: React.CSSProperties = {
  backgroundImage:
    "radial-gradient(circle at 1px 1px, rgba(148, 163, 184, 0.07) 1px, transparent 0)",
  backgroundSize: "24px 24px",
  backgroundAttachment: "fixed",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="flex min-h-screen flex-col" style={BODY_BG_STYLE}>
        <HeaderNav />
        <Breadcrumbs />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 md:px-6 md:py-8">
          {children}
        </main>
        <footer className="mt-12 border-t border-slate-800 bg-slate-950/80">
          <div className="mx-auto grid max-w-5xl gap-4 px-4 py-5 text-xs text-slate-500 md:grid-cols-2 md:px-6">
            <div className="space-y-1">
              <p className="text-slate-400">
                &copy; {new Date().getFullYear()} Poker Trainer · MTT
              </p>
              <p>
                Ranges são aproximações Nash chip-EV. Em bolha e final table aplique ajustes ICM.
              </p>
            </div>
            <div className="flex flex-wrap items-start gap-x-4 gap-y-1 md:justify-end">
              <a
                href={REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-sm outline-none transition-colors hover:text-emerald-300 focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                GitHub
              </a>
              <a
                href={ISSUES_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-sm outline-none transition-colors hover:text-emerald-300 focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                Reportar bug
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
