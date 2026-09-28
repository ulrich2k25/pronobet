"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, History, Trophy, User, Sparkles } from "lucide-react";

const ITEMS = [
  {
    label: "Matchs",
    href: "/matches",
    icon: BarChart3,
  },
  {
    label: "Compétitions",
    href: "/competitions",
    icon: Trophy,
  },
  {
    label: "Historique",
    href: "/historique",
    icon: History,
  },
  {
    label: "Profil",
    href: "/profil",
    icon: User,
  },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function MobileSidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Header mobile */}
      <header className="md:hidden sticky top-0 z-40 border-b border-white/10 bg-[#07111f]/90 backdrop-blur-xl">
        <div className="flex h-16 items-center justify-between px-4">
          <Link href="/matches" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-500/10">
              <Sparkles className="h-4 w-4 text-emerald-300" />
            </div>

            <div>
              <div className="text-[17px] font-extrabold leading-none tracking-tight text-white">
                PronoBet
              </div>

              <div className="mt-1 text-[10px] font-medium text-white/40">
                Analyse IA de matchs
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="text-[10px] font-semibold text-emerald-200">
              IA
            </span>
          </div>
        </div>
      </header>

      {/* Navigation mobile */}
      <nav className="md:hidden fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#07111f]/95 backdrop-blur-2xl">
        <div className="grid grid-cols-4 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2">
          {ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "relative flex min-h-[54px] flex-col items-center justify-center gap-1 rounded-xl transition",
                  active
                    ? "text-emerald-300"
                    : "text-white/45 active:text-white/80",
                ].join(" ")}
              >
                {active && (
                  <span className="absolute top-0 h-[2px] w-6 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.7)]" />
                )}

                <Icon
                  className={[
                    "h-5 w-5 transition",
                    active ? "stroke-[2.3]" : "stroke-[1.8]",
                  ].join(" ")}
                />

                <span
                  className={[
                    "text-[10px] leading-none",
                    active ? "font-semibold" : "font-medium",
                  ].join(" ")}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
