"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Kicks off the idle-session memory sweep in the background on page load,
 * and refreshes the view if any sessions were folded into memory. */
export default function MemorySweeper() {
  const router = useRouter();
  useEffect(() => {
    let cancelled = false;
    fetch("/api/memory/sweep", { method: "POST" })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data?.closed > 0) router.refresh();
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
