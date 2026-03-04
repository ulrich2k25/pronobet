"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, History, LogOut, Trophy, User, Ticket } from "lucide-react";

type Item = { label: string; href: string; icon: React.ReactNode };
type Me = { id: string; username: string };

const ANALYSE_ITEMS: Item[] = [
  { label: "Matchs", href: "/matches", icon: <BarChart3 className="h-5 w-5" /> },
  { label: "Compétitions", href: "/competitions", icon: <Trophy className="h-5 w-5" /> },
  { label: "Historique", href: "/historique", icon: <History className="h-5 w-5" /> },
  { label: "Profil", href: "/profil", icon: <User className="h-5 w-5" /> },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  const [me, setMe] = useState<Me | null>(null);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [loadingLogout, setLoadingLogout] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
        });

        const data = await res.json().catch(() => null);
        if (cancelled) return;

        setAuthed(!!data?.authenticated);
        setMe(data?.user ?? null);
      } catch {
        if (!cancelled) {
          setAuthed(false);
          setMe(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function logout() {
    if (loadingLogout) return;
    setLoadingLogout(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {}

    setMe(null);
    setAuthed(false);

    // ✅ fermer le drawer mobile si ouvert
    onNavigate?.();

    router.replace("/login");
    router.refresh();
  }

  const username = me?.username || (authed ? "Compte" : "—");
  const planLabel = authed ? "Accès activé" : "Non connecté";

  return (
    <div
      className={[
        "h-full w-full",
        "bg-white/5 backdrop-blur-xl",
        "border border-white/10 md:border-r md:border-l-0 md:border-t-0 md:border-b-0",
        "shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_30px_80px_rgba(0,0,0,0.45)]",
        "overflow-hidden rounded-3xl md:rounded-none",
      ].join(" ")}
    >
      <div className="h-full flex flex-col overflow-hidden">
        {/* Brand */}
        <div className="px-6 pt-6 pb-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-extrabold">
              <span className="text-white/90">V</span>
              <span className="absolute -inset-1 rounded-2xl blur-xl bg-emerald-500/10" />
            </div>
            <div>
              <div className="text-xl font-extrabold tracking-tight">Pronobet</div>
              <div className="text-xs text-white/50">Analyse IA de matchs</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <div className="px-6 py-4 flex-1 min-h-0">
          <div className="text-[11px] tracking-[0.22em] text-white/35 mb-3">ANALYSE</div>

          <div className="space-y-2">
            {ANALYSE_ITEMS.map((it) => {
              const active = isActive(pathname, it.href);

              return (
                <Link
                  key={it.href}
                  href={it.href}
                  onClick={() => onNavigate?.()}
                  className={[
                    "group w-full flex items-center gap-3 rounded-2xl px-4 py-3 border transition",
                    "hover:translate-x-[2px] hover:border-white/15",
                    active
                      ? "bg-emerald-500/12 border-emerald-400/30 text-emerald-100 shadow-[0_0_0_1px_rgba(16,185,129,0.12),0_12px_40px_rgba(16,185,129,0.10)]"
                      : "bg-white/5 border-white/10 text-white/80 hover:bg-white/8",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "transition",
                      active ? "text-emerald-200" : "text-white/70 group-hover:text-white/90",
                    ].join(" ")}
                  >
                    {it.icon}
                  </span>
                  <span className="font-medium">{it.label}</span>

                  <span
                    className={[
                      "ml-auto h-2 w-2 rounded-full transition",
                      active
                        ? "bg-emerald-400 shadow-[0_0_18px_rgba(16,185,129,0.65)]"
                        : "bg-white/10 group-hover:bg-white/20",
                    ].join(" ")}
                  />
                </Link>
              );
            })}
          </div>

          {/* Code promo */}
          <div className="mt-4">
            <div className="w-full flex items-center justify-between rounded-2xl px-4 py-3 border border-white/10 bg-black/20 hover:bg-white/5 transition">
              <div className="flex items-center gap-3">
                <Ticket className="h-5 w-5 text-white/70" />
                <span className="font-medium text-white/80">Code promo</span>
              </div>
              <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-200 border border-emerald-400/20">
                BONNUS
              </span>
            </div>
          </div>

          {/* Accès */}
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs text-white/60 mb-2">Accès illimité</div>
            <div className="text-sm text-emerald-200 font-semibold">
              {authed ? "Accès activé." : "Connecte-toi pour activer l’accès."}
            </div>
            <div className="mt-2 text-xs text-white/50">Analyse les matchs sans limite.</div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto px-6 py-4 border-t border-white/10 bg-black/10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <User className="h-5 w-5 text-white/70" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white/90 truncate">{username}</div>
              <div className="text-xs text-white/50">{planLabel}</div>
            </div>
          </div>

          {authed && (
            <button
              type="button"
              onClick={logout}
              disabled={loadingLogout}
              className="mt-3 w-full flex items-center gap-3 rounded-2xl px-4 py-2.5 border border-white/10 bg-black/20 hover:bg-white/5 transition text-white/80 disabled:opacity-50"
            >
              <LogOut className="h-5 w-5 text-white/70" />
              <span className="font-medium">
                {loadingLogout ? "Déconnexion..." : "Déconnexion"}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}