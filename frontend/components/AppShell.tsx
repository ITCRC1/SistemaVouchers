"use client";
import { useEffect, useLayoutEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser, logout } from "@/lib/auth";
import Navbar from "./Navbar";

const useSyncEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

const IDLE_MS  = 60_000;
const WARN_MS  = 10_000;

export default function AppShell({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const router = useRouter();
  const [ready, setReady]           = useState(false);
  const [menuOpen, setMenuOpen]     = useState(false);
  const [warnVisible, setWarnVisible] = useState(false);
  const [countdown, setCountdown]   = useState(WARN_MS / 1000);

  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const warnRef  = useRef<ReturnType<typeof setTimeout>>();
  const tickRef  = useRef<ReturnType<typeof setInterval>>();

  useSyncEffect(() => {
    const user = getStoredUser();
    if (user && (!roles || roles.includes(user.role))) {
      setReady(true);
      return;
    }
    router.replace("/login");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetIdle = useCallback(() => {
    clearTimeout(timerRef.current);
    clearTimeout(warnRef.current);
    clearInterval(tickRef.current);
    setWarnVisible(false);
    setCountdown(WARN_MS / 1000);

    warnRef.current = setTimeout(() => {
      setWarnVisible(true);
      let t = WARN_MS / 1000;
      tickRef.current = setInterval(() => {
        t--;
        setCountdown(t);
        if (t <= 0) clearInterval(tickRef.current);
      }, 1000);
    }, IDLE_MS - WARN_MS);

    timerRef.current = setTimeout(logout, IDLE_MS);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"] as const;
    events.forEach(e => window.addEventListener(e, resetIdle, { passive: true }));
    resetIdle();
    return () => {
      events.forEach(e => window.removeEventListener(e, resetIdle));
      clearTimeout(timerRef.current);
      clearTimeout(warnRef.current);
      clearInterval(tickRef.current);
    };
  }, [ready, resetIdle]);

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

      {/* Idle warning overlay */}
      {warnVisible && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
            <div className="text-5xl font-bold text-[#002147] mb-3">{countdown}</div>
            <h2 className="text-lg font-bold mb-2">Tu sesión está por cerrar</h2>
            <p className="text-sm text-gray-500 mb-6">
              Por inactividad, la sesión cerrará automáticamente.
            </p>
            <button onClick={resetIdle} className="btn-primary w-full">
              Seguir conectado
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
