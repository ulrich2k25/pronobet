"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type LeagueItem = {
  id: number;
  name: string;
  type?: string; // "League" | "Cup"
  logo?: string;
  country?: string;
  flag?: string;
  seasons?: { year?: number; current?: boolean }[];
};

function currentSeasonGuess() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  return m >= 7 ? y : y - 1;
}

function seasonLabel(season: number) {
  return `${season}/${season + 1}`;
}

function SectionTitle({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="mt-4 flex items-center gap-2 text-xs tracking-widest text-white/50">
      <span className="opacity-80">{icon}</span>
      <span>{title}</span>
    </div>
  );
}

function LeagueRow({ item, season }: { item: LeagueItem; season: number }) {
  return (
    <Link
      href={`/competitions/${item.id}?season=${season}`}
      className="group block rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
    >
      <div className="flex items-center gap-4 p-4">
        <div className="h-12 w-12 rounded-2xl bg-black/20 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
          {item.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.logo}
              alt={item.name}
              className="h-9 w-9 object-contain"
            />
          ) : (
            <div className="text-white/30 text-xs">—</div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="font-semibold text-white/90 truncate">{item.name}</div>
          <div className="mt-1 text-xs text-white/50 flex items-center gap-2">
            <span className="truncate">{item.country || "International"}</span>
            <span className="opacity-40">•</span>
            <span>{seasonLabel(season)}</span>
          </div>
        </div>

        <div className="text-white/30 group-hover:text-white/60 transition text-xl">
          ›
        </div>
      </div>
    </Link>
  );
}

export default function CompetitionsPage() {
  const [season, setSeason] = useState<number>(currentSeasonGuess());
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [leagues, setLeagues] = useState<LeagueItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      const search = q.trim();

      // ✅ IMPORTANT:
      // API-Football refuse season + search ensemble.
      // Donc:
      // - si search est présent -> on envoie seulement search
      // - sinon -> on envoie season + current=true (compétitions en cours)
      if (search) {
        params.set("search", search);
        // (optionnel) tu peux enlever current ici pour éviter d'autres contraintes
        // params.set("current", "true");
      } else {
        params.set("season", String(season));
        params.set("current", "true");
      }

      try {
        const res = await fetch(`/api/leagues?${params.toString()}`, {
          cache: "no-store",
        });
        const data = await res.json();
        if (!res.ok || !data?.ok) {
          // 🚫 Si recherche trop courte → on ignore totalement l’erreur
          if (search.length > 0 && search.length < 3) {
            if (!cancelled) {
              setLeagues([]);
              setError(null);
            }
            return;
          }

          throw new Error(data?.details || data?.error || "Erreur");
        }

        if (!cancelled) setLeagues(data.leagues || []);
      } catch (e: any) {
        if (search.length > 0 && search.length < 3) {
          if (!cancelled) setError(null);
        } else {
          if (!cancelled) setError(e?.message || "Erreur");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [season, q]);

  const cups = useMemo(
    () => leagues.filter((l) => String(l.type || "").toLowerCase() === "cup"),
    [leagues]
  );
  const champs = useMemo(
    () => leagues.filter((l) => String(l.type || "").toLowerCase() !== "cup"),
    [leagues]
  );

  return (
    <div className="p-8">
      <div className="mx-auto w-full max-w-3xl">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-white">Compétitions</h1>
          <p className="mt-2 text-sm text-white/60">
            Découvre les compétitions en cours
          </p>
          <p className="mt-1 text-xs text-emerald-200/80">
            Notre IA analyse les compétitions et te donne des insights sur les
            équipes, les classements et les matchs à venir.
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex-1">
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">
                  ⌕
                </div>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Rechercher une compétition…"
                  className="w-full rounded-xl border border-white/10 bg-black/20 pl-9 pr-3 py-3 text-white/80 outline-none placeholder:text-white/30"
                />
              </div>

              {q.trim() && (
                <div className="mt-2 text-xs text-white/45">
                  Recherche globale (toutes saisons) — l’API ne permet pas
                  “saison + recherche” en même temps.
                </div>
              )}
            </div>

            <select
              value={season}
              onChange={(e) => setSeason(Number(e.target.value))}
              className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-white/80 outline-none"
              title="Saison"
              disabled={!!q.trim()} // ✅ optionnel mais logique: la saison ne s'applique pas en mode recherche
            >
              {Array.from({ length: 8 }).map((_, i) => {
                const y = currentSeasonGuess() - i;
                return (
                  <option key={y} value={y}>
                    {seasonLabel(y)}
                  </option>
                );
              })}
            </select>
          </div>

          {loading && <div className="mt-4 text-white/60">Chargement…</div>}
          {error && <div className="mt-4 text-red-300">Erreur: {error}</div>}

          {!loading && !error && (
            <div className="mt-4 space-y-3">
              {cups.length > 0 && (
                <>
                  <SectionTitle icon="🏆" title="COUPES" />
                  <div className="space-y-3">
                    {cups.slice(0, 30).map((item) => (
                      <LeagueRow key={item.id} item={item} season={season} />
                    ))}
                  </div>
                </>
              )}

              {champs.length > 0 && (
                <>
                  <SectionTitle icon="🌐" title="CHAMPIONNATS" />
                  <div className="space-y-3">
                    {champs.slice(0, 60).map((item) => (
                      <LeagueRow key={item.id} item={item} season={season} />
                    ))}
                  </div>
                </>
              )}

              {cups.length === 0 && champs.length === 0 && (
                <div className="text-white/60">
                  Aucune compétition trouvée.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}