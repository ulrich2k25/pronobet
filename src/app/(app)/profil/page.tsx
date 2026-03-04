"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Me = { id: string; username: string };

type HistoryItem = {
  id: string;
  createdAt: string;
  teamA: string;
  teamB: string;
  prediction: {
    match: string;
    probs: { home: number; draw: number; away: number };
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
      if (data?.user) setMe(data.user);
    })();

    try {
      const raw = localStorage.getItem("pb_history");
      const arr = raw ? (JSON.parse(raw) as HistoryItem[]) : [];
      setItems(Array.isArray(arr) ? arr : []);
    } catch {
      setItems([]);
    }
  }, []);

  // ✅ on garde juste "total analyses" (plus de stats affichées)
  const totalAnalyses = useMemo(() => items.length, [items]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="py-10">
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-extrabold">Profil</h1>
        <p className="mt-2 text-white/60">Gère ton compte et retrouve tes infos.</p>
      </div>

      <div className="w-full max-w-[980px] mx-auto rounded-3xl border border-white/10 bg-white/5 shadow-2xl">
        <div className="p-6 md:p-8">
          {/* Carte utilisateur */}
          <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-emerald-500/15 border border-emerald-400/25 flex items-center justify-center">
                <span className="text-emerald-200 font-bold text-xl">P</span>
              </div>

              <div className="flex-1">
                <div className="text-sm text-white/50">Utilisateur</div>
                <div className="text-xl font-bold text-white/90">
                  {me?.username || (authed ? "Compte" : "Non connecté")}
                </div>
                <div className="text-xs text-white/50">
                  {authed
                    ? "Accès activé"
                    : "Connecte-toi pour accéder à toutes les fonctionnalités."}
                </div>
              </div>

              {authed ? (
                <button
                  onClick={logout}
                  className="rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition px-4 py-3 text-white/80 hover:text-white"
                >
                  Déconnexion
                </button>
              ) : (
                <button
                  onClick={() => router.push("/login?next=/profil")}
                  className="rounded-2xl bg-emerald-600/80 hover:bg-emerald-600 transition px-4 py-3 font-semibold"
                >
                  Se connecter
                </button>
              )}
            </div>
          </div>

          {/* ✅ Infos (remplace la section stats en 2 cartes) */}
          <div className="mt-6">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-6 flex items-center justify-between gap-4">
              <div>
                <div className="text-xs tracking-widest text-white/50">ANALYSES</div>
                <div className="mt-2 text-3xl font-extrabold text-emerald-200">
                  {totalAnalyses}
                </div>
                <div className="mt-1 text-xs text-white/50">
                  Analyses enregistrées sur cet appareil
                </div>
              </div>

              <button
                onClick={() => router.push("/historique")}
                className="shrink-0 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition px-4 py-3 font-semibold text-white/80"
              >
                Voir l’historique
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-6">
            <div className="text-sm font-semibold text-white/90">Actions rapides</div>

            {/* ✅ on passe à 2 boutons, donc 2 colonnes en desktop */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={() => router.push("/")}
                className="rounded-2xl bg-emerald-600/80 hover:bg-emerald-600 transition px-4 py-4 font-semibold"
              >
                Analyser un match
              </button>

              <button
                onClick={() => router.push("/historique")}
                className="rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition px-4 py-4 font-semibold text-white/80"
              >
                Voir l’historique
              </button>
            </div>

            <div className="mt-4 text-xs text-white/45"></div>
          </div>

          {/* Danger zone */}
          <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-500/10 p-6">
            <div className="text-sm font-semibold text-red-200">Zone sensible</div>
            <div className="mt-2 text-xs text-white/60">
              Efface ton historique local (sur cet appareil uniquement).
            </div>

            <button
              onClick={() => {
                localStorage.removeItem("pb_history");
                setItems([]);
              }}
              className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 hover:bg-red-500/15 transition px-4 py-3 text-red-200"
            >
              Effacer l’historique local
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}