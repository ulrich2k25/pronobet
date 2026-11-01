"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CalendarDays, Globe2, Search, Trophy, ChevronDown } from "lucide-react";

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

function SectionTitle({
  kind,
  title,
  count,
}: {
  kind: "cup" | "league";
  title: string;
  count: number;
}) {
  return (
    <div className="mb-4 flex min-w-0 items-end justify-between gap-3 sm:mb-5">
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border border-[#3F5643] bg-[#1A2B20] text-[#C9F76B] sm:h-12 sm:w-12">
          {kind === "cup" ? (
            <Trophy aria-hidden="true" className="h-[21px] w-[21px]" strokeWidth={1.7} />
          ) : (
            <Globe2 aria-hidden="true" className="h-[21px] w-[21px]" strokeWidth={1.7} />
          )}
        </span>
        <div className="min-w-0">
          <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#9EBAA2]">
            {kind === "cup" ? "Coupes & trophées" : "Ligues & championnats"}
          </div>
          <h2 className="mt-1 text-[21px] font-extrabold leading-tight tracking-[-0.035em] text-[#F6F8F2] sm:text-[26px]">
            {title}
          </h2>
        </div>
      </div>
      <span className="shrink-0 rounded-full border border-[#3A5140] bg-[#18271D] px-3 py-1.5 text-xs font-bold tabular-nums text-[#BCE88D]">
        {count}
      </span>
    </div>
  );
}

function LeagueRow({ item, season }: { item: LeagueItem; season: number }) {
  return (
    <Link
      href={`/competitions/${item.id}?season=${season}`}
      className="group relative flex min-w-0 items-center gap-3 overflow-hidden rounded-[18px] border border-[#314338] bg-[#142019] p-3.5 transition-[border-color,background-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-[#89B75E] hover:bg-[#1A2B20] hover:shadow-[0_12px_30px_rgba(0,0,0,0.2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9F76B] active:translate-y-0 sm:gap-4 sm:p-4"
    >
      <span aria-hidden="true" className="absolute inset-y-4 left-0 w-[2px] rounded-full bg-[#C9F76B] opacity-0 transition-opacity group-hover:opacity-100" />

      <div className="flex h-[56px] w-[56px] shrink-0 items-center justify-center overflow-hidden rounded-[14px] border border-[#3A4C3E] bg-[#0B1510] sm:h-[62px] sm:w-[62px]">
        {item.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.logo}
            alt=""
            loading="lazy"
            className="h-10 w-10 object-contain sm:h-11 sm:w-11"
          />
        ) : (
          <Trophy aria-hidden="true" className="h-6 w-6 text-[#819887]" strokeWidth={1.4} />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate text-[14px] font-bold leading-snug tracking-[-0.015em] text-[#F3F7F0] sm:text-[15px]" title={item.name}>
          {item.name}
        </div>
        <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#A9BCAA]">
          <span className="max-w-full truncate">{item.country || "International"}</span>
          <span className="text-[#516B57]" aria-hidden="true">•</span>
          <span className="shrink-0 tabular-nums text-[#D1E2CA]">{seasonLabel(season)}</span>
        </div>
      </div>

      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#385040] bg-[#203127] text-[#A7BAA8] transition-[background-color,color,transform] duration-200 group-hover:translate-x-0.5 group-hover:border-[#C9F76B]/50 group-hover:bg-[#C9F76B] group-hover:text-[#14200E]" aria-hidden="true">
        <ArrowUpRight className="h-[18px] w-[18px]" strokeWidth={2} />
      </span>
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
    <div className="relative isolate w-full min-w-0 overflow-hidden rounded-[24px] bg-[#09110E] text-[#F2F5EE] shadow-[0_24px_90px_rgba(0,0,0,0.18)] sm:rounded-[30px] lg:rounded-[36px]">
      {/* Habillage purement décoratif, sans interaction ni données inventées. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[430px] overflow-hidden">
        <div className="absolute -right-40 -top-40 h-[480px] w-[480px] rounded-full border border-[#C9F76B]/[0.12] sm:-right-16 sm:h-[580px] sm:w-[580px]" />
        <div className="absolute -right-16 -top-28 h-[290px] w-[290px] rounded-full border border-[#C9F76B]/[0.09] sm:right-6 sm:h-[400px] sm:w-[400px]" />
        <div className="absolute right-0 top-0 h-[260px] w-[320px] bg-[#C9F76B]/[0.045] blur-[90px]" />
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(181,213,177,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(181,213,177,0.07)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      </div>

      <div className="relative mx-auto w-full max-w-[1100px] px-4 pb-8 pt-6 sm:px-7 sm:pb-12 sm:pt-9 lg:px-10 lg:pt-11">
        <header className="mb-7 sm:mb-9">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2.5 text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#C9F76B] sm:text-[11px]">
              <span className="relative flex h-2.5 w-2.5 items-center justify-center" aria-hidden="true">
                <span className="absolute h-full w-full rounded-full bg-[#C9F76B]/30" />
                <span className="relative h-1.5 w-1.5 rounded-full bg-[#C9F76B]" />
              </span>
              PronoBet <span className="font-medium text-[#819888]">/</span> COMPÉTITIONS
            </div>
            <span className="rounded-full border border-[#425746] bg-[#15241A]/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#D7E3D6]">
              Football mondial
            </span>
          </div>

          <div className="mt-7 flex items-center justify-between gap-6 sm:mt-10">
            <div className="min-w-0">
              <span className="mb-3 block text-xs font-semibold uppercase tracking-[0.18em] text-[#A6B9A8]">Le football, sans frontières</span>
              <h1 className="text-[clamp(2.6rem,7vw,5rem)] font-black leading-[0.99] tracking-[-0.06em] text-[#F6F8F2]">
                Toutes les<br /><span className="text-[#C9F76B]">compétitions.</span>
              </h1>
              <p className="mt-5 max-w-[540px] text-[14px] leading-7 text-[#B1C0B3] sm:mt-6 sm:text-[16px]">
                Explore les championnats et les coupes, puis retrouve les classements, les équipes et les rencontres.
              </p>
            </div>

            <div aria-hidden="true" className="relative hidden h-[190px] w-[180px] shrink-0 items-center justify-center overflow-hidden rounded-[24px] border border-[#3D5541] bg-[#15251B] lg:flex">
              <div className="absolute inset-5 rounded-[8px] border border-[#74925F]/30" />
              <div className="absolute inset-x-5 top-1/2 h-px bg-[#74925F]/30" />
              <div className="absolute left-1/2 top-5 h-[150px] w-px bg-[#74925F]/30" />
              <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#74925F]/40" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-[20px] border border-[#C9F76B]/30 bg-[#C9F76B]/10 shadow-[0_0_65px_rgba(201,247,107,0.12)]">
                <Trophy className="h-8 w-8 text-[#C9F76B]" strokeWidth={1.5} />
              </div>
            </div>
          </div>
        </header>

        <section aria-labelledby="competition-search-title" className="relative rounded-[24px] border border-[#35453A] bg-[#142019] p-4 shadow-[0_30px_55px_rgba(0,0,0,0.14)] sm:rounded-[28px] sm:p-6 lg:p-8">
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[#C9F76B]/60 to-transparent" />
          <div className="mb-6">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#C9F76B]">01 / Explorer</p>
            <h2 id="competition-search-title" className="mt-2 text-[22px] font-extrabold tracking-[-0.04em] text-[#F6F8F2] sm:text-[26px]">Trouver une compétition</h2>
            <p className="mt-1.5 text-[13px] leading-5 text-[#A8BAAA]">Recherche par nom ou sélection d&apos;une saison.</p>
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_180px] sm:items-end sm:gap-3">
            <div className="min-w-0">
              <label htmlFor="competition-search" className="mb-2.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-[#B5C2B5] sm:text-[11px]">Compétition</label>
              <div className="group relative">
                <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8FA394] transition-colors group-focus-within:text-[#C9F76B]" strokeWidth={1.8} />
                <input
                  id="competition-search"
                  type="search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Rechercher une compétition"
                  className="min-h-[56px] w-full min-w-0 rounded-[15px] border border-[#34483A] bg-[#0C1510] py-3 pl-12 pr-4 text-[14px] font-medium text-[#F4F7EF] outline-none transition-[border-color,background-color] placeholder:text-[#8FA193] hover:border-[#536C57] focus:border-[#C9F76B] focus:bg-[#101C15] focus-visible:outline-none sm:text-[15px]"
                />
              </div>
            </div>

            <div className="min-w-0">
              <label htmlFor="competition-season" className="mb-2.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-[#B5C2B5] sm:text-[11px]">Saison</label>
              <div className="relative">
                <CalendarDays aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#9CAF9B]" strokeWidth={1.7} />
                <select
                  id="competition-season"
                  value={season}
                  onChange={(e) => setSeason(Number(e.target.value))}
                  title="Saison"
                  disabled={!!q.trim()}
                  className="min-h-[56px] w-full appearance-none rounded-[15px] border border-[#34483A] bg-[#0C1510] py-3 pl-10 pr-9 text-[14px] font-semibold tabular-nums text-[#F4F7EF] outline-none transition-[border-color,background-color] hover:border-[#536C57] focus:border-[#C9F76B] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40"
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
                <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CAF9B]" strokeWidth={1.8} />
              </div>
            </div>
          </div>

          {q.trim() && (
            <p className="mt-3 text-xs leading-5 text-[#9BAE9D]">
              Recherche globale sur les compétitions disponibles. Le choix de saison est momentanément désactivé.
            </p>
          )}
        </section>

        <div className="mt-8 sm:mt-10">
          {loading && (
            <div role="status" className="flex items-center gap-4 rounded-[19px] border border-[#344B39] bg-[#142019] px-5 py-6 text-sm text-[#C0D1C0]">
              <span aria-hidden="true" className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-[#C9F76B]/20 border-t-[#C9F76B] motion-reduce:animate-none" />
              Chargement des compétitions…
            </div>
          )}

          {error && (
            <div role="alert" className="rounded-[19px] border border-red-400/30 bg-red-500/10 px-5 py-5 text-sm leading-6 text-red-100">
              Erreur : {error}
            </div>
          )}

          {!loading && !error && (
            <div className="space-y-10 sm:space-y-12">
              {(cups.length > 0 || champs.length > 0) && (
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#30483A] pb-4">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#C9F76B]">02 / Découvrir</p>
                    <h2 className="mt-1.5 text-[19px] font-extrabold tracking-[-0.035em] text-[#F6F8F2] sm:text-[22px]">Compétitions disponibles</h2>
                  </div>
                  <span className="rounded-full border border-[#3C5140] bg-[#17261B] px-3 py-1.5 text-xs font-semibold text-[#C2D8BE]">
                    {Math.min(cups.length, 30) + Math.min(champs.length, 60)} affichées
                  </span>
                </div>
              )}

              {cups.length > 0 && (
                <section aria-label="Coupes">
                  <SectionTitle kind="cup" title="Coupes" count={Math.min(cups.length, 30)} />
                  <div className="grid min-w-0 grid-cols-1 gap-3 lg:grid-cols-2">
                    {cups.slice(0, 30).map((item) => (
                      <LeagueRow key={item.id} item={item} season={season} />
                    ))}
                  </div>
                </section>
              )}

              {champs.length > 0 && (
                <section aria-label="Championnats">
                  <SectionTitle kind="league" title="Championnats" count={Math.min(champs.length, 60)} />
                  <div className="grid min-w-0 grid-cols-1 gap-3 lg:grid-cols-2">
                    {champs.slice(0, 60).map((item) => (
                      <LeagueRow key={item.id} item={item} season={season} />
                    ))}
                  </div>
                </section>
              )}

              {cups.length === 0 && champs.length === 0 && (
                <div className="rounded-[24px] border border-[#344B39] bg-[#142019] px-6 py-12 text-center sm:py-16">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] border border-[#4A604B] bg-[#203227] text-[#C9F76B]">
                    <Search aria-hidden="true" className="h-6 w-6" strokeWidth={1.7} />
                  </div>
                  <h2 className="mt-5 text-[18px] font-extrabold tracking-[-0.03em] text-[#F4F7F0]">Aucune compétition trouvée</h2>
                  <p className="mt-2 text-sm leading-6 text-[#A9BCAB]">Essaie une autre recherche.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
