"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Overview = {
  league: {
    id: number;
    name: string;
    type?: string;
    logo?: string;
    country?: string;
  };
  season: number;
  counts: {
    teams: number;
    matches: number;
    players: number;
    standings: number;
  };
};

type TabKey = "standings" | "matches" | "players" | "teams";

type StandingRow = {
  rank: number;
  points: number;
  goalsDiff?: number;
  team: {
    id: number;
    name: string;
    logo?: string;
  };
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: {
      for: number;
      against: number;
    };
  };
};

type Fixture = {
  id: number;
  date: string;
  status?: {
    short?: string;
    long?: string;
    elapsed?: number | null;
  };
  league?: {
    round?: string | null;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo?: string | null;
    };
    away: {
      id: number;
      name: string;
      logo?: string | null;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
};

type TeamItem = {
  id: number;
  name: string;
  logo?: string | null;
  country?: string | null;
};

type TopScorer = {
  id: number;
  name: string;
  photo?: string | null;
  team?: {
    id: number;
    name: string;
    logo?: string | null;
  } | null;
  goals?: number;
  assists?: number;
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

function Tab({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-medium transition sm:px-4 sm:text-sm",
        active
          ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-200"
          : "border-white/[0.08] bg-white/[0.035] text-white/50 hover:bg-white/[0.07] hover:text-white",
      ].join(" ")}
    >
      <span>{label}</span>

      {typeof count === "number" && (
        <span
          className={[
            "rounded-full px-1.5 py-0.5 text-[9px] sm:px-2 sm:text-[10px]",
            active
              ? "bg-emerald-400/10 text-emerald-200"
              : "bg-black/20 text-white/40",
          ].join(" ")}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function fmtDate(dateIso: string) {
  const d = new Date(dateIso);

  return d.toLocaleString("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CompetitionDetailClient({
  leagueId,
}: {
  leagueId: string;
}) {
  const searchParams = useSearchParams();

  const season = Number(searchParams.get("season") || currentSeasonGuess());

  const leagueIdNum = Number(leagueId);

  const [tab, setTab] = useState<TabKey>("standings");

  const [overview, setOverview] = useState<Overview | null>(null);

  const [standings, setStandings] = useState<StandingRow[] | null>(null);

  const [fixtures, setFixtures] = useState<Fixture[] | null>(null);

  const [teams, setTeams] = useState<TeamItem[] | null>(null);

  const [topscorers, setTopscorers] = useState<TopScorer[] | null>(null);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Header + counts
  useEffect(() => {
    (async () => {
      const res = await fetch(
        `/api/competitions/overview?leagueId=${leagueIdNum}&season=${season}`,
        {
          cache: "no-store",
        },
      );

      const data = await res.json().catch(() => null);

      if (data?.ok) {
        setOverview(data);
      }
    })();
  }, [leagueIdNum, season]);

  const header = useMemo(() => {
    if (!overview) return null;

    const league = overview.league;

    const type = (league.type || "").toLowerCase() === "cup" ? "Cup" : "League";

    return {
      name: league.name,
      meta: `${league.country || "International"} • ${type} • ${seasonLabel(
        season,
      )}`,
      logo: league.logo,
    };
  }, [overview, season]);

  // Chargement des données par onglet
  useEffect(() => {
    (async () => {
      setErr(null);

      if (tab === "standings" && standings) return;
      if (tab === "matches" && fixtures) return;
      if (tab === "teams" && teams) return;
      if (tab === "players" && topscorers) return;

      setLoading(true);

      try {
        if (tab === "standings") {
          const res = await fetch(
            `/api/competitions/standings?leagueId=${leagueIdNum}&season=${season}`,
            {
              cache: "no-store",
            },
          );

          const data = await res.json();

          if (!data?.ok) {
            throw new Error(data?.error || "Erreur classement");
          }

          setStandings(data.standings || []);
        }

        if (tab === "matches") {
          const res = await fetch(
            `/api/competitions/fixtures?leagueId=${leagueIdNum}&season=${season}&next=30`,
            {
              cache: "no-store",
            },
          );

          const data = await res.json();

          if (!data?.ok) {
            throw new Error(data?.error || "Erreur matchs");
          }

          setFixtures(data.fixtures || []);
        }

        if (tab === "teams") {
          const res = await fetch(
            `/api/competitions/teams?leagueId=${leagueIdNum}&season=${season}`,
            {
              cache: "no-store",
            },
          );

          const data = await res.json();

          if (!data?.ok) {
            throw new Error(data?.error || "Erreur équipes");
          }

          setTeams(data.teams || []);
        }

        if (tab === "players") {
          const res = await fetch(
            `/api/competitions/topscorers?leagueId=${leagueIdNum}&season=${season}&top=25`,
            {
              cache: "no-store",
            },
          );

          const data = await res.json();

          if (!data?.ok) {
            throw new Error(data?.error || "Erreur joueurs");
          }

          setTopscorers(data.players || data.topscorers || []);
        }
      } catch (e: any) {
        setErr(e?.message || "Erreur");
      } finally {
        setLoading(false);
      }
    })();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, leagueIdNum, season]);

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-3xl">
        {/* Retour */}
        <Link
          href="/competitions"
          className="inline-flex min-h-[40px] items-center gap-1.5 text-xs font-medium text-white/45 transition hover:text-white/80 sm:text-sm"
        >
          <span aria-hidden>←</span>
          Compétitions
        </Link>

        {/* Header compétition */}
        {header && (
          <section className="mt-2 rounded-[22px] border border-white/[0.08] bg-white/[0.035] p-4 sm:p-5 md:rounded-2xl md:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              {header.logo && (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/[0.08] bg-black/20 p-2 sm:h-16 sm:w-16">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={header.logo}
                    alt={header.name}
                    className="h-full w-full object-contain"
                  />
                </div>
              )}

              <div className="min-w-0">
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-300/60">
                  Compétition
                </div>

                <h1 className="mt-1 break-words text-xl font-extrabold leading-tight text-white sm:text-2xl">
                  {header.name}
                </h1>

                <p className="mt-1 text-[11px] leading-4 text-white/40 sm:text-sm">
                  {header.meta}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Onglets */}
        <div className="-mx-3 mt-4 overflow-x-auto px-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0">
          <div className="flex min-w-max gap-2">
            <Tab
              active={tab === "standings"}
              label="Classement"
              count={overview?.counts?.standings}
              onClick={() => setTab("standings")}
            />

            <Tab
              active={tab === "matches"}
              label="Matchs"
              count={overview?.counts?.matches}
              onClick={() => setTab("matches")}
            />

            <Tab
              active={tab === "players"}
              label="Joueurs"
              count={overview?.counts?.players}
              onClick={() => setTab("players")}
            />

            <Tab
              active={tab === "teams"}
              label="Équipes"
              count={overview?.counts?.teams}
              onClick={() => setTab("teams")}
            />
          </div>
        </div>

        {/* Contenu */}
        <section className="mt-4 md:mt-6">
          {loading && (
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] px-4 py-10 text-center text-sm text-white/45">
              Chargement…
            </div>
          )}

          {err && (
            <div className="rounded-xl border border-red-400/15 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {err}
            </div>
          )}

          {/* CLASSEMENT */}
          {!loading && !err && tab === "standings" && (
            <div>
              <div className="mb-3 flex items-center justify-between px-1">
                <h2 className="text-sm font-bold text-white sm:text-lg">
                  Classement
                </h2>

                <span className="text-[10px] text-white/35 sm:hidden">
                  Faire défiler →
                </span>
              </div>

              {!standings?.length ? (
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] px-4 py-8 text-center text-sm text-white/45">
                  Aucun classement disponible.
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025]">
                  <div className="overflow-x-auto">
                    <table className="min-w-[660px] w-full text-xs sm:text-sm">
                      <thead className="bg-black/15 text-white/35">
                        <tr>
                          <th className="w-10 px-3 py-3 text-left">#</th>

                          <th className="px-2 py-3 text-left">Équipe</th>

                          <th className="px-2 py-3 text-right">Pts</th>

                          <th className="px-2 py-3 text-right">J</th>

                          <th className="px-2 py-3 text-right">G</th>

                          <th className="px-2 py-3 text-right">N</th>

                          <th className="px-2 py-3 text-right">P</th>

                          <th className="px-2 py-3 text-right">BP</th>

                          <th className="px-2 py-3 text-right">BC</th>

                          <th className="px-3 py-3 text-right">Diff</th>
                        </tr>
                      </thead>

                      <tbody className="text-white/65">
                        {(standings || [])
                          .filter((r: any) => r && r.team && r.team.name)
                          .map((r: any) => (
                            <tr
                              key={r.team.id ?? `${r.rank}-${r.team.name}`}
                              className="border-t border-white/[0.05]"
                            >
                              <td className="px-3 py-3 text-white/40">
                                {r.rank ?? "-"}
                              </td>

                              <td className="px-2 py-3">
                                <div className="flex items-center gap-2">
                                  {r.team?.logo ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={r.team.logo}
                                      alt={r.team?.name || "team"}
                                      className="h-6 w-6 shrink-0 object-contain"
                                    />
                                  ) : (
                                    <div className="h-6 w-6 shrink-0 rounded bg-white/10" />
                                  )}

                                  <span className="max-w-[180px] truncate font-medium text-white">
                                    {r.team?.name || "—"}
                                  </span>
                                </div>
                              </td>

                              <td className="px-2 py-3 text-right font-bold text-white">
                                {r.points ?? 0}
                              </td>

                              <td className="px-2 py-3 text-right">
                                {r.all?.played ?? 0}
                              </td>

                              <td className="px-2 py-3 text-right">
                                {r.all?.win ?? 0}
                              </td>

                              <td className="px-2 py-3 text-right">
                                {r.all?.draw ?? 0}
                              </td>

                              <td className="px-2 py-3 text-right">
                                {r.all?.lose ?? 0}
                              </td>

                              <td className="px-2 py-3 text-right">
                                {r.all?.goals?.for ?? 0}
                              </td>

                              <td className="px-2 py-3 text-right">
                                {r.all?.goals?.against ?? 0}
                              </td>

                              <td className="px-3 py-3 text-right">
                                {r.goalsDiff ??
                                  (r.all?.goals?.for ?? 0) -
                                    (r.all?.goals?.against ?? 0)}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MATCHS */}
          {!loading && !err && tab === "matches" && (
            <div>
              <div className="mb-3 flex items-center gap-2 px-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-emerald-400/15 bg-emerald-500/10 text-sm">
                  🕒
                </div>

                <h2 className="text-sm font-bold text-white sm:text-lg">
                  Prochains matchs
                </h2>
              </div>

              {!fixtures?.length ? (
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] px-4 py-8 text-center text-sm text-white/45">
                  Aucun match trouvé.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {fixtures.map((fixture) => {
                    const home = fixture.teams.home;

                    const away = fixture.teams.away;

                    const href =
                      `/matches?from=match` +
                      `&team1Id=${encodeURIComponent(String(home.id))}` +
                      `&team2Id=${encodeURIComponent(String(away.id))}` +
                      `&team1=${encodeURIComponent(home.name)}` +
                      `&team2=${encodeURIComponent(away.name)}` +
                      `&team1Logo=${encodeURIComponent(home.logo || "")}` +
                      `&team2Logo=${encodeURIComponent(away.logo || "")}`;

                    return (
                      <article
                        key={fixture.id}
                        className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.035]"
                      >
                        {/* Date */}
                        <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2.5 sm:px-4">
                          <div className="text-[10px] font-medium text-white/40 sm:text-xs">
                            {fmtDate(fixture.date)}
                          </div>

                          {fixture.league?.round && (
                            <div className="max-w-[140px] truncate text-[9px] text-white/25 sm:text-[10px]">
                              {fixture.league.round}
                            </div>
                          )}
                        </div>

                        {/* Équipes */}
                        <div className="p-3 sm:p-4">
                          <div className="space-y-2.5">
                            <div className="flex items-center gap-3">
                              {home.logo ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={home.logo}
                                  alt={home.name}
                                  className="h-7 w-7 shrink-0 object-contain"
                                />
                              ) : (
                                <div className="h-7 w-7 shrink-0 rounded bg-white/10" />
                              )}

                              <div className="min-w-0 flex-1 truncate text-sm font-semibold text-white/85">
                                {home.name}
                              </div>

                              <span className="text-[9px] font-medium uppercase tracking-wide text-white/25">
                                DOM
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              {away.logo ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={away.logo}
                                  alt={away.name}
                                  className="h-7 w-7 shrink-0 object-contain"
                                />
                              ) : (
                                <div className="h-7 w-7 shrink-0 rounded bg-white/10" />
                              )}

                              <div className="min-w-0 flex-1 truncate text-sm font-semibold text-white/85">
                                {away.name}
                              </div>

                              <span className="text-[9px] font-medium uppercase tracking-wide text-white/25">
                                EXT
                              </span>
                            </div>
                          </div>

                          <Link
                            href={href}
                            className="mt-3 flex min-h-[42px] w-full items-center justify-center rounded-xl border border-emerald-400/15 bg-emerald-500/10 px-4 text-xs font-bold text-emerald-200 transition hover:bg-emerald-500/15 sm:text-sm"
                          >
                            Analyser ce match
                            <span className="ml-1.5" aria-hidden>
                              →
                            </span>
                          </Link>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* JOUEURS */}
          {!loading && !err && tab === "players" && (
            <div>
              <h2 className="mb-3 px-1 text-sm font-bold text-white sm:text-lg">
                Top buteurs
              </h2>

              {!topscorers?.length ? (
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] px-4 py-8 text-center text-sm text-white/45">
                  Aucun joueur trouvé.
                </div>
              ) : (
                <div className="space-y-2">
                  {topscorers.map((player, index) => (
                    <article
                      key={player.id ?? `${index}-${player.name}`}
                      className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-3 sm:p-4"
                    >
                      <div className="w-5 shrink-0 text-center text-xs font-bold text-white/35 sm:w-7">
                        {index + 1}
                      </div>

                      {player.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={player.photo}
                          alt={player.name}
                          className="h-10 w-10 shrink-0 rounded-full border border-white/10 object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 shrink-0 rounded-full bg-white/10" />
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-white">
                          {player.name}
                        </div>

                        <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-white/35 sm:text-xs">
                          {player.team?.logo && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={player.team.logo}
                              alt={player.team.name}
                              className="h-4 w-4 shrink-0 object-contain"
                            />
                          )}

                          <span className="truncate">
                            {player.team?.name || "—"}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <div className="text-sm font-bold text-emerald-200">
                          {player.goals ?? 0}
                        </div>

                        <div className="text-[9px] uppercase tracking-wide text-white/30">
                          buts
                        </div>

                        <div className="mt-1 text-[9px] text-white/35 sm:text-[10px]">
                          {player.assists ?? 0} assists
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ÉQUIPES */}
          {!loading && !err && tab === "teams" && (
            <div>
              <h2 className="mb-3 px-1 text-sm font-bold text-white sm:text-lg">
                Équipes
              </h2>

              {!teams?.length ? (
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] px-4 py-8 text-center text-sm text-white/45">
                  Aucune équipe trouvée.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {teams.map((team) => (
                    <article
                      key={team.id}
                      className="flex min-h-[64px] items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-3"
                    >
                      {team.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={team.logo}
                          alt={team.name}
                          className="h-10 w-10 shrink-0 object-contain"
                        />
                      ) : (
                        <div className="h-10 w-10 shrink-0 rounded-xl bg-white/10" />
                      )}

                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-white">
                          {team.name}
                        </div>

                        {team.country && (
                          <div className="mt-0.5 truncate text-[10px] text-white/35 sm:text-xs">
                            {team.country}
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
