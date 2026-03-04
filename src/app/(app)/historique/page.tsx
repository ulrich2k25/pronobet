"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

export default function HistoriquePage() {
  const router = useRouter();
  const [items, setItems] = useState<HistoryItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("pb_history");
      const arr = raw ? (JSON.parse(raw) as HistoryItem[]) : [];
      setItems(Array.isArray(arr) ? arr : []);
    } catch {
      setItems([]);
    }
  }, []);

  const hasAny = items.length > 0;

  const summary = useMemo(() => {
    if (!hasAny) return null;
    return {
      total: items.length,
    };
  }, [hasAny, items.length]);

  return (
    <div className="py-10">
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-extrabold">Historique des analyses</h1>
        <p className="mt-2 text-white/60">Retrouve toutes tes analyses précédentes</p>
        {summary && (
          <p className="mt-3 text-sm text-emerald-200/80">
            {summary.total} analyse{summary.total > 1 ? "s" : ""} enregistrée{summary.total > 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Container carte centrale (comme Visifoot) */}
      <div className="w-full max-w-[980px] mx-auto rounded-3xl border border-white/10 bg-white/5 shadow-2xl">
        {!hasAny ? (
          <div className="p-10 md:p-14 flex flex-col items-center text-center">
            <div className="h-14 w-14 rounded-2xl border border-white/10 bg-black/20 flex items-center justify-center text-2xl">
              📊
            </div>

            <div className="mt-6 text-xl md:text-2xl font-semibold">
              Aucune analyse pour le moment
            </div>
            <div className="mt-2 text-white/60">
              Commence par analyser un match pour voir ton historique ici
            </div>

            <button
              onClick={() => router.push("/")}
              className="mt-8 rounded-full bg-emerald-600/80 hover:bg-emerald-600 transition px-8 py-4 font-semibold"
            >
              Analyser un match
            </button>
          </div>
        ) : (
          <div className="p-6 md:p-8">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm text-white/60">Tes analyses</div>

              <button
                onClick={() => {
                  localStorage.removeItem("pb_history");
                  setItems([]);
                }}
                className="text-xs rounded-full px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 transition text-white/70"
              >
                Effacer l’historique
              </button>
            </div>

            <div className="space-y-4">
              {items.map((it) => (
                <div key={it.id} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-lg font-bold">{it.prediction?.match || `${it.teamA} vs ${it.teamB}`}</div>
                      <div className="text-xs text-white/50">{formatDate(it.createdAt)}</div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <div className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">
                        Tip: {it.prediction?.tip ?? "—"}
                      </div>
                      <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
                        Confiance: {Math.round((it.prediction?.confidence ?? 0) * 100)}%
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                      <div className="text-xs text-white/50">Équipe 1</div>
                      <div className="mt-1 text-lg font-bold">
                        {Math.round((it.prediction?.probs?.home ?? 0) * 100)}%
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                      <div className="text-xs text-white/50">Nul</div>
                      <div className="mt-1 text-lg font-bold">
                        {Math.round((it.prediction?.probs?.draw ?? 0) * 100)}%
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                      <div className="text-xs text-white/50">Équipe 2</div>
                      <div className="mt-1 text-lg font-bold">
                        {Math.round((it.prediction?.probs?.away ?? 0) * 100)}%
                      </div>
                    </div>
                  </div>

                  {/* mini barre */}
                  <div className="mt-4">
                    <div className="h-3 w-full rounded-full overflow-hidden border border-white/10 bg-black/30 flex">
                      <div style={{ width: `${Math.round((it.prediction?.probs?.home ?? 0) * 100)}%` }} className="h-full bg-emerald-500/50" />
                      <div style={{ width: `${Math.round((it.prediction?.probs?.draw ?? 0) * 100)}%` }} className="h-full bg-white/15" />
                      <div style={{ width: `${Math.round((it.prediction?.probs?.away ?? 0) * 100)}%` }} className="h-full bg-emerald-200/25" />
                    </div>
                    <div className="mt-2 text-xs text-white/45">
                      Les analyses sont basées sur un modèle statistique. Aucun gain n’est garanti.
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-center">
              <button
                onClick={() => router.push("/")}
                className="rounded-full bg-emerald-600/80 hover:bg-emerald-600 transition px-8 py-4 font-semibold"
              >
                Analyser un match
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
