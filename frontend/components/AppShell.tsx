"use client";
import { useEffect, useLayoutEffect, useState } from "react";
import { ensureUser } from "@/lib/auth";
import Navbar from "./Navbar";

const useSyncEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useSyncEffect(() => {
    ensureUser().finally(() => setReady(true));
  }, []);

  if (!ready) return null;

  return (
    <div className="flex h-screen">
      {/* Sidebar desktop */}
      <div className="hidden md:flex w-52 flex-shrink-0">
        <Navbar onNavigate={() => setMenuOpen(false)} />
      </div>

      {/* Mobile overlay */}
      {menuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMenuOpen(false)} />
      )}

      {/* Sidebar mobile drawer */}
      <div className={`fixed top-0 left-0 h-full w-64 z-50 md:hidden transition-transform duration-300 ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <Navbar onNavigate={() => setMenuOpen(false)} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <div className="md:hidden bg-[#002147] text-white flex items-center px-4 py-3 gap-3 flex-shrink-0">
          <button onClick={() => setMenuOpen(true)} className="text-white p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-blue-300">The Costa Rica Collection</div>
            <div className="text-white font-semibold text-xs">Vouchers</div>
          </div>
        </div>

        <main className="flex-1 overflow-auto bg-gray-50 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
