"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { BarChart3, History, ShieldCheck, Trophy, User } from "lucide-react";

// Identical navigation routes; this component only changes visual presentation.
const ITEMS = [
  { label: "Matchs", href: "/matches", icon: BarChart3 },
  { label: "Compétitions", href: "/competitions", icon: Trophy },
  { label: "Historique", href: "/historique", icon: History },
  { label: "Profil", href: "/profil", icon: User },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function MobileSidebar() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => setIsAdmin(data?.isAdmin === true))
      .catch(() => setIsAdmin(false));
  }, []);

  const items = isAdmin
    ? [...ITEMS, { label: "Admin", href: "/admin", icon: ShieldCheck }]
    : ITEMS;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[#34463A] bg-[#09130F]/95 backdrop-blur-xl md:hidden">
        <div className="mx-auto flex h-[62px] w-full max-w-screen-sm items-center justify-between gap-3 px-4">
          <Link
            href="/matches"
            className="flex min-w-0 items-center gap-2.5 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C9F76B]"
          >
            <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[11px] border border-[#637B58]/40 bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/pronobet-logo.png"
                alt="Logo PronoBet"
                className="absolute left-1/2 top-[-11px] h-[70px] w-[70px] max-w-none -translate-x-1/2 object-contain"
              />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[16px] font-black leading-tight tracking-[-0.035em] text-[#F5F8F1]">
                PronoBet
              </span>
              <span className="mt-0.5 block truncate text-[10px] font-medium tracking-wide text-[#A6B8A8]">
                PRONOBET · ANALYSE IA
              </span>
            </span>
          </Link>

          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#C9F76B]/25 bg-[#C9F76B]/[0.09] px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#C9F76B]">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#C9F76B] shadow-[0_0_12px_rgba(201,247,107,0.45)]" />
            IA
          </span>
        </div>
      </header>

      <nav
        aria-label="Navigation principale"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-[#39493E] bg-[#0B1510]/95 shadow-[0_-16px_38px_rgba(0,0,0,0.32)] backdrop-blur-2xl md:hidden"
      >
        <div className={`mx-auto grid w-full max-w-screen-sm gap-1 px-2 pt-2 pb-[max(10px,env(safe-area-inset-bottom))] ${isAdmin ? "grid-cols-5" : "grid-cols-4"}`}>
          {items.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={[
                  "group relative flex min-h-[58px] min-w-0 flex-col items-center justify-center gap-1.5 rounded-[14px] px-1 text-center transition-colors duration-200",
                  "focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#C9F76B]",
                  active
                    ? "bg-[#C9F76B]/[0.10] text-[#C9F76B]"
                    : "text-[#A2B2A4] hover:bg-white/[0.05] hover:text-[#ECF3E9]",
                ].join(" ")}
              >
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-5 top-0 h-[2px] rounded-b-full bg-[#C9F76B] shadow-[0_0_12px_rgba(201,247,107,0.42)]"
                  />
                )}
                <Icon aria-hidden="true" className="h-[21px] w-[21px] shrink-0" strokeWidth={active ? 2.25 : 1.8} />
                <span className={`max-w-full truncate text-[11px] leading-tight tracking-[-0.01em] ${active ? "font-bold" : "font-medium"}`}>
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
