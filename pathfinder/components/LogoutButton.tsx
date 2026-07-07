"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="btn-quiet w-full"
      onClick={async () => {
        await fetch("/api/auth", { method: "DELETE" });
        router.push("/login");
        router.refresh();
      }}
    >
      Switch profile
    </button>
  );
}
