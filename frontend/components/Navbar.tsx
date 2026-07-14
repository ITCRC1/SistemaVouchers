"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getStoredUser } from "@/lib/auth";
import clsx from "clsx";

const NAV: Record<string, { label: string; href: string }[]> = {
  admin: [
    { label: "Dashboard", href: "/admin" },
    { label: "Vouchers", href: "/admin/vouchers" },
    { label: "Auditoría", href: "/admin/auditoria" },
    { label: "Cuentas por Pagar", href: "/admin/cuentas-por-pagar" },
    { label: "Provisiones", href: "/admin/provisiones" },
    { label: "Reportes", href: "/admin/reports" },
    { label: "Proveedores", href: "/admin/providers" },
    { label: "Servicios", href: "/admin/services" },
    { label: "Tarifas", href: "/admin/precios" },
    { label: "Usuarios", href: "/admin/usuarios" },
    { label: "Centro de Ayuda", href: "/admin/ayuda" },
  ],
  user: [
    { label: "Dashboard", href: "/admin" },
    { label: "Vouchers", href: "/admin/vouchers" },
    { label: "Auditoría", href: "/admin/auditoria" },
    { label: "Cuentas por Pagar", href: "/admin/cuentas-por-pagar" },
    { label: "Provisiones", href: "/admin/provisiones" },
    { label: "Reportes", href: "/admin/reports" },
    { label: "Proveedores", href: "/admin/providers" },
    { label: "Servicios", href: "/admin/services" },
    { label: "Tarifas", href: "/admin/precios" },
    { label: "Centro de Ayuda", href: "/admin/ayuda" },
  ],
  concierge: [
    { label: "Vouchers", href: "/admin/vouchers" },
    { label: "Centro de Ayuda", href: "/admin/ayuda" },
  ],
  front_desk: [
    { label: "Registrar Uso", href: "/front-desk" },
  ],
  auditor: [
    { label: "Auditoría", href: "/audit" },
    { label: "Reportes", href: "/admin/reports" },
    { label: "Centro de Ayuda", href: "/admin/ayuda" },
  ],
};

export default function Navbar({ onNavigate }: { onNavigate?: () => void }) {
  const user = getStoredUser();
  const pathname = usePathname();
  const items = user ? (NAV[user.role] ?? []) : [];

  return (
    <nav className="bg-[#002147] text-white h-full flex flex-col w-full">
      <div className="border-b border-white/10">
        <img
          src="/logo-collection.png"
          alt="The Costa Rica Collection"
          className="w-full object-cover"
          style={{ maxHeight: "110px" }}
          onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
        <div className="px-5 py-3">
          <div className="text-xs font-bold uppercase tracking-widest text-blue-300">The Costa Rica Collection</div>
          <div className="text-white font-semibold text-sm mt-0.5">Vouchers</div>
        </div>
      </div>
      <div className="flex-1 py-2 space-y-0.5 px-2 overflow-y-auto">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={clsx(
              "block px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              pathname === item.href
                ? "bg-[#0066CC] text-white"
                : "text-blue-100 hover:bg-white/10"
            )}
          >
            {item.label}
          </Link>
        ))}

      </div>

      {user && (
        <div className="px-4 py-4 border-t border-white/10">
          <div className="text-sm font-medium text-white truncate">{user.name}</div>
        </div>
      )}
    </nav>
  );
}
