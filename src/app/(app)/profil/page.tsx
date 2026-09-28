"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Me = {
  id: string;
  username: string;
};

type HistoryItem = {
  id: string;
  createdAt: string;
  teamA: string;
  teamB: string;
  prediction: {
    match: string;
    probs: {
      home: number;
      draw: number;
      away: number;
    };
    tip: string;
    confidence: number;
  };
};

function safeNum(n: any) {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
}

export default function ProfilPage() {
  const router = useRouter();

  const [me, setMe] = useState<Me | null>(null);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [items, setItems] = useState<HistoryItem[]>([]);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/auth/me", {
        cache: "no-store",
        credentials: "include",
      });

      const data = await res.json().catch(() => null);

      setAuthed(!!data?.authenticated);

      if (data?.user) {
        setMe(data.user);
      }
    })();

    try {
      const raw = localStorage.getItem("pb_history");

      const arr = raw ? (JSON.parse(raw) as HistoryItem[]) : [];

      setItems(Array.isArray(arr) ? arr : []);
    } catch {
      setItems([]);
    }
  }, []);

  const totalAnalyses = useMemo(() => items.length, [items]);

  async function logout() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-[980px]">
        {/* Header */}
        <div className="mb-5 pt-1 text-left md:mb-8 md:pt-4 md:text-center">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-200 md:hidden">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Mon espace
          </div>

          <h1 className="text-[30px] font-extrabold leading-tight tracking-tight text-white md:text-5xl">
            Profil
          </h1>

          <p className="mt-1.5 text-sm leading-6 text-white/55 md:text-base">
            Gère ton compte et retrouve tes informations.
          </p>
        </div>

        <div className="space-y-3 md:space-y-5">
          {/* Utilisateur */}
          <section className="rounded-[22px] border border-white/[0.08] bg-white/[0.035] p-4 sm:p-5 md:rounded-3xl md:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-500/10 sm:h-14 sm:w-14">
                <span className="text-lg font-extrabold text-emerald-200 sm:text-xl">
                  {me?.username ? me.username.charAt(0).toUpperCase() : "P"}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">
                  Utilisateur
                </div>

                <div className="mt-0.5 truncate text-lg font-bold text-white sm:text-xl">
                  {me?.username || (authed ? "Compte" : "Non connecté")}
                </div>

                <div className="mt-0.5 text-[11px] leading-4 text-white/40 sm:text-xs">
                  {authed
                    ? "Accès activé"
                    : "Connecte-toi pour accéder à toutes les fonctionnalités."}
                </div>
              </div>
            </div>

            {/* Action compte séparée sur mobile */}
            <div className="mt-4 border-t border-white/[0.07] pt-4">
              {authed ? (
                <button
                  type="button"
                  onClick={logout}
                  className="min-h-[46px] w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-white/65 transition hover:bg-white/[0.08] hover:text-white sm:w-auto"
                >
                  Déconnexion
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => router.push("/login?next=/profil")}
                  className="min-h-[46px] w-full rounded-xl bg-emerald-500 px-5 text-sm font-bold text-[#04150f] transition hover:bg-emerald-400 sm:w-auto"
                >
                  Se connecter
                </button>
              )}
            </div>
          </section>

          {/* Analyses */}
          <section className="rounded-[22px] border border-white/[0.08] bg-white/[0.035] p-4 sm:p-5 md:rounded-2xl md:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[10px] font-semibold tracking-[0.16em] text-white/35">
                  ANALYSES
                </div>

                <div className="mt-1 text-3xl font-extrabold tracking-tight text-emerald-200">
                  {totalAnalyses}
                </div>

                <div className="mt-0.5 text-[11px] leading-4 text-white/40 sm:text-xs">
                  Enregistrées sur cet appareil
                </div>
              </div>

              <button
                type="button"
                onClick={() => router.push("/historique")}
                className="shrink-0 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-xs font-semibold text-white/65 transition hover:bg-white/[0.08] hover:text-white sm:px-4 sm:py-3 sm:text-sm"
              >
                Voir l&apos;historique
              </button>
            </div>
          </section>

          {/* Actions rapides */}
          <section className="rounded-[22px] border border-white/[0.08] bg-white/[0.035] p-4 sm:p-5 md:rounded-2xl md:p-6">
            <div className="text-sm font-bold text-white/85">
              Actions rapides
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => router.push("/matches")}
                className="min-h-[50px] rounded-xl bg-emerald-500 px-4 text-sm font-bold text-[#04150f] transition hover:bg-emerald-400 active:scale-[0.99]"
              >
                Analyser un match
              </button>

              <button
                type="button"
                onClick={() => router.push("/historique")}
                className="min-h-[50px] rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-white/70 transition hover:bg-white/[0.08] hover:text-white active:scale-[0.99]"
              >
                Voir l&apos;historique
              </button>
            </div>
          </section>

          {/* Zone sensible */}
          <section className="rounded-[22px] border border-red-400/15 bg-red-500/[0.06] p-4 sm:p-5 md:rounded-2xl md:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-red-400/15 bg-red-500/10 text-sm">
                !
              </div>

              <div className="min-w-0">
                <div className="text-sm font-bold text-red-200">
                  Zone sensible
                </div>

                <p className="mt-1 text-[11px] leading-5 text-white/45 sm:text-xs">
                  Cette action efface uniquement l&apos;historique enregistré
                  sur cet appareil.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                localStorage.removeItem("pb_history");
                setItems([]);
              }}
              className="mt-4 min-h-[46px] w-full rounded-xl border border-red-400/15 bg-red-500/[0.08] px-4 text-sm font-semibold text-red-200 transition hover:bg-red-500/[0.14] sm:w-auto"
            >
              Effacer l&apos;historique local
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
