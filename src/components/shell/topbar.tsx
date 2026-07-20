"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import { GlobalSearch } from "./global-search";
import { initials } from "@/lib/utils";
import type { SessionUser } from "@/lib/session";

export function Topbar({ user, onMenu }: { user: SessionUser; onMenu: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/prihlasenie");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:px-6">
      <button className="btn-ghost p-2 lg:hidden" onClick={onMenu} aria-label="Menu">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
        </svg>
      </button>
      <div className="flex-1">
        <GlobalSearch />
      </div>
      <div className="relative">
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-dark text-sm font-bold text-white">
            {initials(user.name)}
          </span>
          <span className="hidden text-left sm:block">
            <span className="block text-sm font-semibold text-slate-800">{user.name}</span>
            <span className="block text-xs text-slate-400">
              {user.role === "SUPER_ADMIN" ? "Super administrátor" : "Administrátor"}
            </span>
          </span>
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 z-20 mt-1 w-52 rounded-lg border border-slate-200 bg-white py-1 shadow-cardhover">
              <div className="border-b border-slate-100 px-4 py-2">
                <div className="text-sm font-medium text-slate-800">{user.name}</div>
                <div className="truncate text-xs text-slate-400">{user.email}</div>
              </div>
              <button
                onClick={handleSignOut}
                className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              >
                Odhlásiť sa
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
