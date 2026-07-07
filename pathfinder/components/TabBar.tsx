"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessagesSquare, Map, FolderHeart, MoreHorizontal } from "lucide-react";

// §8: mobile-first bottom tab bar — Today · Mentors · Roadmap · Portfolio · More.
const TABS = [
  { href: "/today", label: "Today", icon: Home },
  { href: "/mentors", label: "Mentors", icon: MessagesSquare },
  { href: "/roadmap", label: "Roadmap", icon: Map },
  { href: "/portfolio", label: "Portfolio", icon: FolderHeart },
  { href: "/more", label: "More", icon: MoreHorizontal },
];

export default function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-mist bg-white/95 backdrop-blur"
    >
      <div className="mx-auto flex max-w-md">
        {TABS.map((tab) => {
          const active = pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`tap-target flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] ${
                active ? "font-semibold text-peacock" : "text-ink/55"
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.4 : 1.8} aria-hidden />
              {tab.label}
            </Link>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
