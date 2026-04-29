"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/projects", label: "Projects" },
  { href: "/analytics", label: "Analytics" },
];

function isActive(pathname: string, href: string) {
  if (pathname === href) return true;
  return pathname.startsWith(`${href}/`);
}

export function AppNavbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-[#0b0b0c]/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/dashboard" className="text-xl font-bold tracking-tight">DocuMind AI</Link>
        <nav className="flex items-center gap-5 text-sm">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? "font-semibold text-indigo-400" : "text-zinc-400 hover:text-zinc-200"}
              >
                {item.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="rounded border border-zinc-700 px-3 py-1 text-zinc-300 hover:border-zinc-500 hover:text-zinc-100"
          >
            Sign out
          </button>
        </nav>
      </div>
    </header>
  );
}
