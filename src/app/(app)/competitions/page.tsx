"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type LeagueItem = {
  id: number;
  name: string;
  type?: string;
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
    <div className="mt-4 flex items-center gap-2 text-[11px] font-semibold tracking-[0.16em] text-white/45">
      <span className="opacity-80">{icon}</span>
      <span>{title}</span>
    </div>
  );
}

function LeagueRow({ item, season }: { item: LeagueItem; season: number }) {
  return (
    <Link
      href={`/competitions/${item.id}?season=${season}`}
      className="
        group
        block
        rounded-2xl
        border border-white/[0.08]
        bg-white/[0.035]
        transition
        hover:border-emerald-400/15
        hover:bg-white/[0.06]
        active:scale-[0.995]
      "
    >
      <div className="flex min-h-[68px] items-center gap-3 p-3 sm:gap-4 sm:p-4">
        {/* Logo */}
        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-black/20 sm:h-12 sm:w-12 sm:rounded-2xl">
          {item.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.logo}
              alt={item.name}
              className="h-8 w-8 object-contain sm:h-9 sm:w-9"
            />
          ) : (
            <div className="text-xs text-white/30">—</div>
          )}
        </div>

        {/* Informations */}
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14px] font-semibold text-white/90 sm:text-base">
            {item.name}
          </div>

          <div className="mt-1 flex min-w-0 items-center gap-1.5 text-[11px] text-white/40 sm:text-xs">
            <span className="truncate">{item.country || "International"}</span>

            <span className="shrink-0 opacity-40">•</span>

            <span className="shrink-0">{seasonLabel(season)}</span>
          </div>
        </div>

        {/* Flèche */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.04] text-lg text-white/30 transition group-hover:bg-emerald-500/10 group-hover:text-emerald-200">
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

      /*
       * API-Football n'accepte pas season + search ensemble.
       *
       * Recherche :
       *   -> search uniquement
       *
       * Sans recherche :
       *   -> season + current
       */
      if (search) {
        params.set("search", search);
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
          /*
           * Une recherche trop courte ne doit pas
           * afficher une erreur à l'utilisateur.
           */
          if (search.length > 0 && search.length < 3) {
            if (!cancelled) {
              setLeagues([]);
              setError(null);
            }

            return;
          }

          throw new Error(data?.details || data?.error || "Erreur");
        }

        if (!cancelled) {
          setLeagues(data.leagues || []);
        }
      } catch (e: any) {
        if (search.length > 0 && search.length < 3) {
          if (!cancelled) {
            setError(null);
          }
        } else {
          if (!cancelled) {
            setError(e?.message || "Erreur");
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [season, q]);

  const cups = useMemo(
    () =>
      leagues.filter(
        (league) => String(league.type || "").toLowerCase() === "cup",
      ),
    [leagues],
  );

  const champs = useMemo(
    () =>
      leagues.filter(
        (league) => String(league.type || "").toLowerCase() !== "cup",
      ),
    [leagues],
  );

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-3xl">
        {/* Header */}
        <div className="mb-5 pt-1 text-left md:mb-7 md:text-center">
          {/* Badge mobile */}
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-200 md:hidden">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Football mondial
          </div>

          <h1 className="text-[30px] font-extrabold leading-tight tracking-tight text-white md:text-4xl">
            Compétitions
          </h1>

          <p className="mt-1.5 text-sm leading-6 text-white/55">
            Championnats, coupes, classements et matchs.
          </p>

          <p className="mx-auto mt-2 hidden max-w-xl text-xs leading-5 text-emerald-200/70 md:block">
            Explore les compétitions disponibles et retrouve les informations
            essentielles sur les équipes et les matchs à venir.
          </p>
        </div>

        {/* Recherche + saison */}
        <div className="rounded-[22px] border border-white/10 bg-white/[0.035] p-3 sm:p-4 md:rounded-2xl">
          <div className="flex flex-col gap-2.5 sm:flex-row">
            {/* Recherche */}
            <div className="min-w-0 flex-1">
              <div className="relative">
                <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-lg text-white/35">
                  ⌕
                </div>

                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Rechercher une compétition"
                  className="
                    min-h-[50px]
                    w-full
                    rounded-xl
                    border border-white/10
                    bg-black/20
                    py-3
                    pl-10
                    pr-3
                    text-sm
                    text-white/90
                    outline-none
                    transition
                    placeholder:text-white/30
                    focus:border-emerald-400/30
                    focus:bg-black/25
                  "
                />
              </div>
            </div>

            {/* Saison */}
            <select
              value={season}
              onChange={(e) => setSeason(Number(e.target.value))}
              className="
                min-h-[50px]
                rounded-xl
                border border-white/10
                bg-[#0b1322]
                px-3
                py-3
                text-sm
                text-white/75
                outline-none
                disabled:cursor-not-allowed
                disabled:opacity-40
                sm:w-[145px]
              "
              title="Saison"
              disabled={!!q.trim()}
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

          {q.trim() && (
            <div className="mt-2 px-1 text-[10px] leading-4 text-white/35">
              Recherche globale sur les compétitions disponibles.
            </div>
          )}
        </div>

        {/* Chargement */}
        {loading && (
          <div className="mt-5 flex items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-8">
            <div className="text-sm text-white/45">
              Chargement des compétitions…
            </div>
          </div>
        )}

        {/* Erreur */}
        {error && (
          <div className="mt-4 rounded-xl border border-red-400/15 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            Erreur : {error}
          </div>
        )}

        {/* Résultats */}
        {!loading && !error && (
          <div className="mt-5 space-y-6">
            {/* Coupes */}
            {cups.length > 0 && (
              <section>
                <div className="mb-2.5 flex items-center justify-between px-1">
                  <SectionTitle icon="🏆" title="COUPES" />

                  <span className="mt-4 rounded-full bg-white/5 px-2.5 py-1 text-[10px] text-white/40">
                    {Math.min(cups.length, 30)}
                  </span>
                </div>

                <div className="space-y-2">
                  {cups.slice(0, 30).map((item) => (
                    <LeagueRow key={item.id} item={item} season={season} />
                  ))}
                </div>
              </section>
            )}

            {/* Championnats */}
            {champs.length > 0 && (
              <section>
                <div className="mb-2.5 flex items-center justify-between px-1">
                  <SectionTitle icon="🌐" title="CHAMPIONNATS" />

                  <span className="mt-4 rounded-full bg-white/5 px-2.5 py-1 text-[10px] text-white/40">
                    {Math.min(champs.length, 60)}
                  </span>
                </div>

                <div className="space-y-2">
                  {champs.slice(0, 60).map((item) => (
                    <LeagueRow key={item.id} item={item} season={season} />
                  ))}
                </div>
              </section>
            )}

            {/* Aucun résultat */}
            {cups.length === 0 && champs.length === 0 && (
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-10 text-center">
                <div className="text-sm font-medium text-white/65">
                  Aucune compétition trouvée
                </div>

                <div className="mt-1 text-xs text-white/35">
                  Essaie une autre recherche.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
