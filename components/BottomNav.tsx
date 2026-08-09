"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessagesSquare, Map, BookHeart, Music2 } from "lucide-react";

const TABS = [
  { href: "/", label: "Today", Icon: Home },
  { href: "/mentors", label: "Mentors", Icon: MessagesSquare },
  { href: "/practice", label: "Practice", Icon: Music2 },
  { href: "/roadmap", label: "Roadmap", Icon: Map },
  { href: "/journal", label: "Journal", Icon: BookHeart },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-silk-200 bg-white/90 backdrop-blur-xl md:hidden">
      <div className="mx-auto flex max-w-lg items-stretch justify-around pb-[env(safe-area-inset-bottom)]">
        {TABS.map(({ href, label, Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium ${
                active ? "text-peacock-600" : "text-ink-faint"
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.4 : 1.8} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
