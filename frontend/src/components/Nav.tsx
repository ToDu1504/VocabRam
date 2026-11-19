"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Học", match: (p: string) => p === "/" || p.startsWith("/levels") || p.startsWith("/learn") },
  { href: "/review", label: "Ôn tập", match: (p: string) => p.startsWith("/review") },
];

export function Nav() {
  const path = usePathname();
  return (
    <header className="border-b border-line bg-panel/80">
      <nav className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-3">
        <Link href="/" className="mr-auto flex items-center gap-2 text-lg font-bold">
          <span aria-hidden="true">🐏</span> VocabRAM
        </Link>
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`rounded-lg px-4 py-2.5 text-sm font-medium ${l.match(path) ? "bg-accent text-white" : "text-muted hover:text-fg"}`}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
