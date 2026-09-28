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
    probs: {
      home: number;
      draw: number;
      away: number;
    };
    tip: string;
    confidence: number;
  };
};

function formatDate(iso: string) {
  try {
    const d = new Date(iso);

    return d.toLocaleString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
    <div className="w-full">
      <div className="mx-auto w-full max-w-[980px]">
        {/* Header */}
        <div className="mb-5 pt-1 text-left md:mb-8 md:pt-4 md:text-center">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-200 md:hidden">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Tes analyses
          </div>

          <h1 className="text-[30px] font-extrabold leading-tight tracking-tight text-white md:text-5xl">
            Historique
          </h1>

          <p className="mt-1.5 text-sm leading-6 text-white/55 md:text-base">
            Retrouve toutes tes analyses précédentes.
          </p>

          {summary && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.035] px-3 py-1.5 text-[11px] font-medium text-white/50">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {summary.total} analyse
              {summary.total > 1 ? "s" : ""} enregistrée
              {summary.total > 1 ? "s" : ""}
            </div>
          )}
        </div>

        {/* Aucun historique */}
        {!hasAny ? (
          <div className="rounded-[24px] border border-white/10 bg-white/[0.035] px-5 py-10 text-center sm:px-8 md:rounded-3xl md:px-10 md:py-14">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-2xl">
              📊
            </div>

            <h2 className="mt-5 text-lg font-bold text-white sm:text-xl md:text-2xl">
              Aucune analyse pour le moment
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/45">
              Analyse ton premier match et tu retrouveras automatiquement le
              résultat ici.
            </p>

            <button
              type="button"
              onClick={() => router.push("/matches")}
              className="
                mt-6
                min-h-[50px]
                w-full
                rounded-2xl
                bg-emerald-500
                px-6
                text-sm
                font-bold
                text-[#04150f]
                transition
                hover:bg-emerald-400
                active:scale-[0.99]
                sm:w-auto
                sm:rounded-full
                sm:px-8
              "
            >
              Analyser un match
            </button>
          </div>
        ) : (
          <>
            {/* Barre actions */}
            <div className="mb-3 flex items-center justify-between gap-3 px-1">
              <div className="text-xs font-medium text-white/45">
                Analyses récentes
              </div>

              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem("pb_history");
                  setItems([]);
                }}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] font-medium text-white/50 transition hover:bg-white/[0.08] hover:text-white/75"
              >
                Effacer
              </button>
            </div>

            {/* Liste */}
            <div className="space-y-3">
              {items.map((it) => {
                const home = Math.round(
                  (it.prediction?.probs?.home ?? 0) * 100,
                );

                const draw = Math.round(
                  (it.prediction?.probs?.draw ?? 0) * 100,
                );

                const away = Math.round(
                  (it.prediction?.probs?.away ?? 0) * 100,
                );

                const confidence = Math.round(
                  (it.prediction?.confidence ?? 0) * 100,
                );

                return (
                  <article
                    key={it.id}
                    className="overflow-hidden rounded-[22px] border border-white/[0.08] bg-white/[0.035] md:rounded-2xl"
                  >
                    {/* Match */}
                    <div className="border-b border-white/[0.07] p-4 sm:p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/35">
                            Match analysé
                          </div>

                          <h2 className="mt-1.5 break-words text-[16px] font-bold leading-6 text-white sm:text-lg">
                            {it.prediction?.match ||
                              `${it.teamA} vs ${it.teamB}`}
                          </h2>

                          <div className="mt-1 text-[11px] text-white/35">
                            {formatDate(it.createdAt)}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <div className="rounded-full border border-emerald-400/15 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-200">
                            {it.prediction?.tip ?? "—"}
                          </div>

                          <div className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium text-white/55">
                            Confiance {confidence}%
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Probabilités */}
                    <div className="p-3 sm:p-5">
                      <div className="grid grid-cols-3 gap-2 sm:gap-3">
                        <div className="rounded-xl border border-white/[0.07] bg-black/15 px-2 py-3 text-center sm:p-3">
                          <div className="text-[9px] font-medium uppercase tracking-wide text-white/35 sm:text-[10px]">
                            Domicile
                          </div>

                          <div className="mt-1 text-lg font-extrabold text-white sm:text-xl">
                            {home}%
                          </div>
                        </div>

                        <div className="rounded-xl border border-white/[0.07] bg-black/15 px-2 py-3 text-center sm:p-3">
                          <div className="text-[9px] font-medium uppercase tracking-wide text-white/35 sm:text-[10px]">
                            Nul
                          </div>

                          <div className="mt-1 text-lg font-extrabold text-white sm:text-xl">
                            {draw}%
                          </div>
                        </div>

                        <div className="rounded-xl border border-white/[0.07] bg-black/15 px-2 py-3 text-center sm:p-3">
                          <div className="text-[9px] font-medium uppercase tracking-wide text-white/35 sm:text-[10px]">
                            Extérieur
                          </div>

                          <div className="mt-1 text-lg font-extrabold text-white sm:text-xl">
                            {away}%
                          </div>
                        </div>
                      </div>

                      {/* Barre probabilités */}
                      <div className="mt-3 overflow-hidden rounded-full border border-white/[0.07] bg-black/30">
                        <div className="flex h-2 w-full">
                          <div
                            style={{ width: `${home}%` }}
                            className="h-full bg-emerald-500/60"
                          />

                          <div
                            style={{ width: `${draw}%` }}
                            className="h-full bg-white/20"
                          />

                          <div
                            style={{ width: `${away}%` }}
                            className="h-full bg-emerald-200/30"
                          />
                        </div>
                      </div>

                      <p className="mt-2 text-[10px] leading-4 text-white/30">
                        Analyse statistique — aucun résultat n&apos;est garanti.
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* CTA */}
            <div className="mt-5 flex justify-center md:mt-8">
              <button
                type="button"
                onClick={() => router.push("/matches")}
                className="
                  min-h-[50px]
                  w-full
                  rounded-2xl
                  bg-emerald-500
                  px-7
                  text-sm
                  font-bold
                  text-[#04150f]
                  transition
                  hover:bg-emerald-400
                  active:scale-[0.99]
                  sm:w-auto
                  sm:rounded-full
                "
              >
                Nouvelle analyse
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
