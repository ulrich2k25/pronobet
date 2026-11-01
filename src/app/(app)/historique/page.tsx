"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, BarChart3, Clock3, History, Plus, Trash2 } from "lucide-react";

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
    <div className="w-full min-w-0 pb-6 text-[#F3F8EF]">
      <div className="mx-auto w-full max-w-[1050px] min-w-0">
        <header className="relative mb-6 overflow-hidden rounded-[26px] border border-[#35483A] bg-[linear-gradient(120deg,#1B3020_0%,#111F16_52%,#0B1610_100%)] px-5 py-7 shadow-[0_20px_55px_rgba(0,0,0,0.16)] sm:mb-8 sm:rounded-[30px] sm:px-9 sm:py-9">
          <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-[#C9F76B]/[0.09] blur-[75px]" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#6B8955]/45 bg-[#C9F76B]/[0.07] px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#C9F76B]">
              <History size={14} aria-hidden="true" /> PRONOBET <span className="text-[#75926D]">/</span> Archives
            </div>
            <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-[36px] font-black leading-[1.05] tracking-[-0.045em] sm:text-[50px]">Vos analyses<span className="text-[#C9F76B]">.</span></h1>
                <p className="mt-3 max-w-lg text-sm leading-6 text-[#A5B8A8] sm:text-[15px]">Retrouvez vos précédents matchs, leurs probabilités et les pronostics calculés.</p>
              </div>
              {summary && (
                <div className="flex items-center gap-3 rounded-[18px] border border-[#597350]/45 bg-[#C9F76B]/[0.08] px-4 py-3" aria-label={`${summary.total} analyses enregistrées`}>
                  <BarChart3 size={22} aria-hidden="true" className="text-[#C9F76B]" />
                  <div><div className="text-2xl font-black leading-none tabular-nums text-[#E9FFBB]">{summary.total}</div><div className="mt-1 text-[11px] text-[#B5C7AF]">Analyse{summary.total > 1 ? "s" : ""} enregistrée{summary.total > 1 ? "s" : ""}</div></div>
                </div>
              )}
            </div>
          </div>
        </header>

        {!hasAny ? (
          <section className="rounded-[24px] border border-[#334739] bg-[#121F17] px-5 py-10 text-center shadow-[0_16px_40px_rgba(0,0,0,.12)] sm:px-10 sm:py-14">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] border border-[#5D7A4C]/50 bg-[#253624] text-[#C9F76B]"><BarChart3 size={30} strokeWidth={1.6} aria-hidden="true" /></div>
            <h2 className="mt-6 text-xl font-extrabold tracking-tight sm:text-[26px]">Votre premier rapport vous attend</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#A5B8A8]">Analysez un premier match : son résultat apparaîtra automatiquement ici, sur cet appareil.</p>
            <button type="button" onClick={() => router.push("/matches")} className="mt-7 inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-[15px] bg-[#C9F76B] px-6 text-sm font-extrabold text-[#0B170D] shadow-[0_8px_26px_rgba(201,247,107,.14)] transition hover:bg-[#D9FF94] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C9F76B] active:scale-[.99] sm:w-auto">
              <Plus size={18} aria-hidden="true" /> Analyser un match <ArrowUpRight size={17} aria-hidden="true" />
            </button>
          </section>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-1">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#D8E4D5]"><Clock3 size={16} className="text-[#C9F76B]" aria-hidden="true" /> Du plus récent au plus ancien</div>
              <button type="button" onClick={() => { localStorage.removeItem("pb_history"); setItems([]); }} className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#65504A] bg-[#291D1B]/60 px-3.5 text-xs font-bold text-[#EAB9A8] transition hover:border-[#A67164] hover:bg-[#34221F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EAB9A8]">
                <Trash2 size={15} aria-hidden="true" /> Effacer l&apos;historique
              </button>
            </div>
            <div className="space-y-4">
              {items.map((it) => {
                const home = Math.round((it.prediction?.probs?.home ?? 0) * 100);
                const draw = Math.round((it.prediction?.probs?.draw ?? 0) * 100);
                const away = Math.round((it.prediction?.probs?.away ?? 0) * 100);
                const confidence = Math.round((it.prediction?.confidence ?? 0) * 100);
                return (
                  <article key={it.id} className="group relative min-w-0 overflow-hidden rounded-[22px] border border-[#304338] bg-[#121F17] shadow-[0_12px_34px_rgba(0,0,0,.14)] transition-colors hover:border-[#668252] sm:rounded-[25px]">
                    <div className="absolute left-0 top-5 h-10 w-[3px] rounded-r-full bg-[#C9F76B]" aria-hidden="true" />
                    <div className="flex flex-col gap-5 border-b border-[#2D4133] px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#90AB91]"><span className="h-1.5 w-1.5 rounded-full bg-[#C9F76B]" /> MATCH ANALYSÉ</p>
                        <h2 className="mt-2 break-words text-[19px] font-extrabold leading-snug tracking-[-0.02em] text-[#F3F8EF] sm:text-[22px]">{it.prediction?.match || `${it.teamA} vs ${it.teamB}`}</h2>
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-[#A3B4A5]"><Clock3 size={13} aria-hidden="true" /> {formatDate(it.createdAt)}</div>
                      </div>
                      <div className="w-full min-w-0 rounded-[16px] border border-[#556E46] bg-[#263821] p-3.5 sm:w-[230px] sm:shrink-0">
                        <div className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#B3CE8E]">PRONOSTIC DU MODÈLE</div>
                        <div className="mt-1 break-words text-[15px] font-extrabold leading-snug text-[#E5FFB8]">{it.prediction?.tip ?? "—"}</div>
                        <div className="mt-2 text-xs font-semibold text-[#BACDB2]">Probabilité estimée : <span className="font-black tabular-nums text-[#E5FFB8]">{confidence}%</span></div>
                      </div>
                    </div>
                    <div className="px-4 py-5 sm:px-6">
                      <div className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#8FA891]">Probabilités du match</div>
                      <div className="grid grid-cols-3 gap-2 sm:gap-3">
                        {[
                          {label: "Domicile", value: home, cls: "text-[#C9F76B]"},
                          {label: "Nul", value: draw, cls: "text-[#E7EDE4]"},
                          {label: "Extérieur", value: away, cls: "text-[#B9D6B8]"},
                        ].map((p) => (
                          <div key={p.label} className="min-w-0 rounded-[14px] border border-[#314537] bg-[#0C1710] px-2 py-3 text-center sm:rounded-[16px] sm:px-3 sm:py-4">
                            <div className="text-[10px] font-semibold text-[#A7B7A7] sm:text-xs">{p.label}</div>
                            <div className={`mt-1 text-[23px] font-black tracking-[-0.035em] tabular-nums sm:text-[29px] ${p.cls}`}>{p.value}%</div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 flex h-2.5 w-full overflow-hidden rounded-full bg-[#2E4132]" aria-hidden="true">
                        <span style={{ width: `${home}%` }} className="bg-[#C9F76B]" />
                        <span style={{ width: `${draw}%` }} className="bg-[#889C8A]" />
                        <span style={{ width: `${away}%` }} className="bg-[#456D52]" />
                      </div>
                      <p className="mt-3 text-[11px] leading-5 text-[#90A391]">Probabilités statistiques, non garanties. Les analyses sont sauvegardées localement sur cet appareil.</p>
                    </div>
                  </article>
                );
              })}
            </div>
            <div className="mt-7 flex justify-center">
              <button type="button" onClick={() => router.push("/matches")} className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[15px] bg-[#C9F76B] px-7 text-sm font-black text-[#0B170D] transition hover:bg-[#D9FF94] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C9F76B] sm:w-auto">
                <Plus size={18} aria-hidden="true" /> Nouvelle analyse <ArrowUpRight size={17} aria-hidden="true" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
