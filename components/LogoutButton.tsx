"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
        router.refresh();
      }}
      className="flex items-center gap-1 rounded-full border border-silk-300 px-3 py-1.5 text-xs text-ink-soft"
    >
      <LogOut size={14} /> Sign out
    </button>
  );
}
