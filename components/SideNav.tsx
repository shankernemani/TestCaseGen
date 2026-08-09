"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  MessagesSquare,
  Music2,
  Map,
  BookHeart,
  CalendarClock,
  Settings,
} from "lucide-react";

const MAIN = [
  { href: "/", label: "Today", Icon: Home },
  { href: "/mentors", label: "Mentors", Icon: MessagesSquare },
  { href: "/practice", label: "Practice", Icon: Music2 },
  { href: "/roadmap", label: "Roadmap", Icon: Map },
  { href: "/journal", label: "Journal", Icon: BookHeart },
  { href: "/deadlines", label: "Deadlines", Icon: CalendarClock },
];

/** Desktop navigation rail. Hidden on mobile, where BottomNav takes over. */
export default function SideNav() {
  const pathname = usePathname();
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-silk-200 bg-white/80 backdrop-blur-xl md:flex">
      <Link href="/" className="flex items-center gap-2.5 px-6 pb-6 pt-7">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-peacock font-display text-sm font-bold text-white">
          P
        </span>
        <span className="font-display text-lg font-bold text-ink">
          Pathfinder
        </span>
      </Link>
      <nav className="flex flex-1 flex-col gap-0.5 px-3">
        {MAIN.map(({ href, label, Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                active
                  ? "bg-silk-100 text-ink"
                  : "text-ink-soft hover:bg-silk-100/60 hover:text-ink"
              }`}
            >
              <Icon
                size={17}
                strokeWidth={2}
                className={active ? "text-peacock-600" : "text-ink-faint"}
              />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-silk-200 px-3 py-3">
        <Link
          href="/settings"
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
            pathname.startsWith("/settings")
              ? "bg-silk-100 text-ink"
              : "text-ink-soft hover:bg-silk-100/60 hover:text-ink"
          }`}
        >
          <Settings size={17} strokeWidth={2} className="text-ink-faint" />
          Profile
        </Link>
      </div>
    </aside>
  );
}
