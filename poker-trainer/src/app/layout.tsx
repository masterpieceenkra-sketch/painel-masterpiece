import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Poker Trainer — MTT",
  description: "Treinador de poker MTT com ranges Nash e spots pré-resolvidos.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <header className="border-b border-slate-800 bg-slate-950">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
            <Link href="/" className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-emerald-400">Poker</span>
              <span className="text-xl font-semibold text-slate-100">Trainer</span>
              <span className="text-xs uppercase tracking-wider text-slate-500">MTT</span>
            </Link>
            <nav className="flex items-center gap-5 text-sm text-slate-400">
              <Link href="/ranges" className="hover:text-emerald-300">
                Ranges
              </Link>
              <Link href="/progresso" className="hover:text-emerald-300">
                Progresso
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
        <footer className="mt-12 border-t border-slate-800 bg-slate-950">
          <div className="mx-auto max-w-5xl px-6 py-4 text-xs text-slate-500">
            Ranges são aproximações Nash chip-EV. Em bolha e final table aplique ajustes ICM.
          </div>
        </footer>
      </body>
    </html>
  );
}
