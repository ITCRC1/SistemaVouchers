"use client";
import AppShell from "@/components/AppShell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AppShell roles={["admin", "concierge", "auditor"]}>{children}</AppShell>;
}
