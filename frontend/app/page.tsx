"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser } from "@/lib/auth";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      if (user.role === "admin") router.replace("/admin");
      else router.replace("/admin/vouchers");
    } else {
      router.replace("/login");
    }
  }, [router]);
  return <div className="flex items-center justify-center h-screen text-gray-400">Cargando…</div>;
}
