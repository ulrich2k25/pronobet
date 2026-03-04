"use client";

import { useEffect, useMemo, useState, use as usePromise } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

type Overview = {
  league: {
    id: number;
    name: string;
    type?: string;
    logo?: string;
    country?: string;
  };
  season: number;
  counts: { teams: number; matches: number; players: number; standings: number };
};

type Fixture = {
  id: number;
  date: string;
  status: { short?: string; long?: string; elapsed?: number | null };
  league: { round?: string | null };
  teams: {
    home: { id: number; name: string; logo?: string | null };
    away: { id: number; name: string; logo?: string | null };
  };
  goals: { home: number | null; away: number | null };
};

type TeamItem = {
  id: number;
  name: string;
  logo?: string | null;
  country?: string | null;
  founded?: number | null;
};

type TopPlayer = {
  id: number;
  name: string;
  photo?: string | null;
  team?: { name?: string | null; logo?: string | null };
  goals: number;
  assists: number;
  matches: number;
};

type TabKey = "analyse" | "standings" | "matches" | "players" | "teams";

function analyzeHrefFromFixture(args: {
  fx: Fixture;
  leagueId: string;
  season: number;
}) {
  const sp = new URLSearchParams();
  sp.set("team1", args.fx.teams.home.name);
  sp.set("team2", args.fx.teams.away.name);
  sp.set("team1Id", String(args.fx.teams.home.id));
  sp.set("team2Id", String(args.fx.teams.away.id));
  sp.set("leagueId", String(args.leagueId));
  sp.set("season", String(args.season));
  sp.set("fixtureId", String(args.fx.id));
  sp.set("team1Logo", args.fx.teams.home.logo || "");
  sp.set("team2Logo", args.fx.teams.away.logo || "");
  sp.set("from", "match"); // ✅ pour déclencher scroll/auto-analyse sur la home
  return `/?${sp.toString()}`;
}

export default function CompetitionDetailPage({
  params,
}: {
  params: Promise<{ leagueId: string }>;
}) {
  const router = useRouter();
  const { leagueId } = usePromise(params);
  const searchParams = useSearchParams();
  const season = Number(searchParams.get("season") || new Date().getFullYear());

  const [tab, setTab] = useState<TabKey>("analyse");
  const [overview, setOverview] = useState<Overview | null>(null);

  const [standings, setStandings] = useState<any[][]>([]);
  const [loading, setLoading] = useState(false);

  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [fixturesLoading, setFixturesLoading] = useState(false);
  const [fixturesErr, setFixturesErr] = useState<string | null>(null);
  const [fixturesMode, setFixturesMode] = useState<"next" | "last">("next");

  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [teamsErr, setTeamsErr] = useState<string | null>(null);

  const [players, setPlayers] = useState<TopPlayer[]>([]);
  const [playersLoading, setPlayersLoading] = useState(false);
  const [playersErr, setPlayersErr] = useState<string | null>(null);

  // Load overview
  useEffect(() => {
    (async () => {
      const res = await fetch(
        `/api/competitions/overview?leagueId=${leagueId}&season=${season}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (data?.ok) setOverview(data);
    })();
  }, [leagueId, season]);

  // Load standings only when needed
  useEffect(() => {
    if (tab !== "standings") return;
    (async () => {
      setLoading(true);
      const res = await fetch(
        `/api/competitions/standings?leagueId=${leagueId}&season=${season}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (data?.ok) setStandings(data.standings || []);
      setLoading(false);
    })();
  }, [tab, leagueId, season]);

  // ✅ Load fixtures only when needed (extract + normalize robuste)
  useEffect(() => {
    if (tab !== "matches") return;
    let cancelled = false;

    const extractList = (data: any): any[] => {
      if (Array.isArray(data?.fixtures)) return data.fixtures;
      if (Array.isArray(data?.response)) return data.response;
      if (Array.isArray(data?.fixtures?.response)) return data.fixtures.response;
      if (Array.isArray(data?.data?.response)) return data.data.response;
      if (Array.isArray(data?.data?.fixtures)) return data.data.fixtures;
      return [];
    };

    const normalize = (raw: any[]): Fixture[] => {
      return raw
        .map((fx: any) => {
          // cas 1: déjà flat
          if (fx?.id && fx?.date && fx?.teams?.home?.name && fx?.teams?.away?.name) {
            const homeId = fx?.teams?.home?.id;
            const awayId = fx?.teams?.away?.id;
            if (!homeId || !awayId) return null;

            return {
              ...fx,
              teams: {
                home: { id: homeId, name: fx.teams.home.name, logo: fx.teams.home.logo ?? null },
                away: { id: awayId, name: fx.teams.away.name, logo: fx.teams.away.logo ?? null },
              },
            } as Fixture;
          }

          // cas 2: API-Football (fixture.id, fixture.date...)
          const id = fx?.fixture?.id;
          const date = fx?.fixture?.date;
          const status = fx?.fixture?.status || {};
          const league = { round: fx?.league?.round ?? null };
          const teams = fx?.teams;
          const goals = fx?.goals;

          const homeId = teams?.home?.id;
          const awayId = teams?.away?.id;

          if (!id || !date || !teams || !homeId || !awayId) return null;

          return {
            id,
            date,
            status,
            league,
            teams: {
              home: { id: homeId, name: teams?.home?.name, logo: teams?.home?.logo ?? null },
              away: { id: awayId, name: teams?.away?.name, logo: teams?.away?.logo ?? null },
            },
            goals: { home: goals?.home ?? null, away: goals?.away ?? null },
          } as Fixture;
        })
        .filter(Boolean) as Fixture[];
    };

    const assertOkOrThrow = (res: Response, data: any) => {
      const apiErrors = data?.errors;
      const hasApiErrors =
        apiErrors &&
        typeof apiErrors === "object" &&
        Object.keys(apiErrors).length > 0;

      if (!res.ok || !data?.ok || hasApiErrors) {
        throw new Error(
          data?.details ||
            data?.error ||
            (hasApiErrors ? "API-Football: erreur / rate limit" : "Erreur")
        );
      }
    };

    (async () => {
      setFixturesLoading(true);
      setFixturesErr(null);

      try {
        // 1) Prochains matchs
        setFixturesMode("next");
        const resNext = await fetch(
          `/api/competitions/fixtures?leagueId=${leagueId}&season=${season}&next=20`,
          { cache: "no-store" }
        );
        const dataNext = await resNext.json();
        assertOkOrThrow(resNext, dataNext);

        const rawNext = extractList(dataNext);
        const mappedNext = normalize(rawNext);

        // 2) Fallback -> derniers matchs si aucun prochain match
        if (mappedNext.length === 0) {
          setFixturesMode("last");

          const resLast = await fetch(
            `/api/competitions/fixtures?leagueId=${leagueId}&season=${season}&last=20`,
            { cache: "no-store" }
          );
          const dataLast = await resLast.json();
          assertOkOrThrow(resLast, dataLast);

          const rawLast = extractList(dataLast);
          const mappedLast = normalize(rawLast);

          if (!cancelled) setFixtures(mappedLast);
        } else {
          if (!cancelled) setFixtures(mappedNext);
        }
      } catch (e: any) {
        if (!cancelled) setFixturesErr(e?.message || "Erreur");
      } finally {
        if (!cancelled) setFixturesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tab, leagueId, season]);

  // Load teams only when needed
  useEffect(() => {
    if (tab !== "teams") return;
    let cancelled = false;

    (async () => {
      setTeamsLoading(true);
      setTeamsErr(null);
      try {
        const res = await fetch(
          `/api/competitions/teams?leagueId=${leagueId}&season=${season}`,
          { cache: "no-store" }
        );
        const data = await res.json();
        if (!res.ok || !data?.ok)
          throw new Error(data?.details || data?.error || "Erreur");
        if (!cancelled) setTeams(data.teams || []);
      } catch (e: any) {
        if (!cancelled) setTeamsErr(e?.message || "Erreur");
      } finally {
        if (!cancelled) setTeamsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tab, leagueId, season]);

  // Load players only when needed
  useEffect(() => {
    if (tab !== "players") return;
    let cancelled = false;

    (async () => {
      setPlayersLoading(true);
      setPlayersErr(null);
      try {
        const res = await fetch(
          `/api/competitions/topscorers?leagueId=${leagueId}&season=${season}`,
          { cache: "no-store" }
        );
        const data = await res.json();
        if (!res.ok || !data?.ok)
          throw new Error(data?.details || data?.error || "Erreur");
        if (!cancelled) setPlayers(data.players || []);
      } catch (e: any) {
        if (!cancelled) setPlayersErr(e?.message || "Erreur");
      } finally {
        if (!cancelled) setPlayersLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tab, leagueId, season]);

  const header = useMemo(() => {
    if (!overview) return null;
    const l = overview.league;
    return {
      name: l.name,
      meta: `${l.country || "International"} • ${season}`,
      logo: l.logo,
    };
  }, [overview, season]);

  return (
    <div className="p-8">
      <div className="mx-auto w-full max-w-3xl">
        <Link
          href="/competitions"
          className="text-sm text-white/60 hover:text-white/90"
        >
          ← Retour aux competitions
        </Link>

        {header && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-6 flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={header.logo}
              alt={header.name}
              className="h-12 w-12 object-contain"
            />
            <div>
              <div className="text-2xl font-bold text-white">{header.name}</div>
              <div className="text-sm text-white/60">{header.meta}</div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mt-4 flex gap-2 flex-wrap">
          {[ "standings", "matches", "players", "teams"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t as TabKey)}
              className={`px-4 py-2 rounded-xl border text-sm transition ${
                tab === t
                  ? "bg-emerald-500/10 border-emerald-400/30 text-emerald-200"
                  : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
              }`}
            >
              {t === "analyse" && "Analyse"}
              {t === "standings" &&
                `Classement (${overview?.counts?.standings ?? 0})`}
              {t === "matches" && `Matchs (${overview?.counts?.matches ?? 0})`}
              {t === "players" && `Joueurs (${overview?.counts?.players ?? 0})`}
              {t === "teams" && `Equipes (${overview?.counts?.teams ?? 0})`}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-6">

          {tab === "matches" && (
            <div>
              <div className="text-lg font-semibold text-white/90">
                {fixturesMode === "next" ? "Prochains matchs" : "Derniers matchs"}
              </div>

              {fixturesLoading && (
                <div className="mt-3 text-white/60">Chargement…</div>
              )}
              {fixturesErr && (
                <div className="mt-3 text-red-300">Erreur: {fixturesErr}</div>
              )}

              {!fixturesLoading && !fixturesErr && fixtures.length === 0 && (
                <div className="mt-3 text-white/60">
                  {fixturesMode === "next"
                    ? "Aucun match à venir."
                    : "Aucun match récent."}
                </div>
              )}

              {!fixturesLoading && !fixturesErr && fixtures.length > 0 && (
                <div className="mt-4 space-y-2">
                  {fixtures.map((fx) => {
                    const href = analyzeHrefFromFixture({ fx, leagueId, season });

                    return (
                      <div
                        key={fx.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => router.push(href)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") router.push(href);
                        }}
                        className="rounded-xl border border-white/10 bg-black/10 p-3 cursor-pointer hover:bg-black/20 transition"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-xs text-white/50">
                            {new Date(fx.date).toLocaleString("fr-FR")}
                            {" • "}
                            {fx.status?.short || "—"}
                            {fx.league?.round ? ` • ${fx.league.round}` : ""}
                          </div>

                          {/* ✅ Bouton Analyser */}
                          <Link
                            href={href}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs text-emerald-200 hover:text-emerald-100 underline underline-offset-4"
                          >
                            Analyser →
                          </Link>
                        </div>

                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {fx.teams.home.logo && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={fx.teams.home.logo}
                                alt=""
                                className="h-5 w-5 object-contain"
                              />
                            )}
                            <span className="text-white/90">
                              {fx.teams.home.name}
                            </span>
                          </div>

                          <div className="text-emerald-200 font-bold">
                            {fx.goals.home === null
                              ? "vs"
                              : `${fx.goals.home} - ${fx.goals.away}`}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-white/90">
                              {fx.teams.away.name}
                            </span>
                            {fx.teams.away.logo && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={fx.teams.away.logo}
                                alt=""
                                className="h-5 w-5 object-contain"
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {tab === "standings" && (
            <div>
              {loading && <div className="text-white/60">Chargement...</div>}
              {!loading &&
                standings.map((group, idx) => (
                  <div key={idx} className="mt-4 space-y-2">
                    {group.map((row: any) => (
                      <div
                        key={row.team.id}
                        className="flex items-center justify-between px-4 py-3 bg-black/20 rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 text-white/60">{row.rank}</span>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={row.team.logo}
                            alt=""
                            className="h-6 w-6 object-contain"
                          />
                          <span className="text-white">{row.team.name}</span>
                        </div>
                        <span className="text-emerald-300 font-semibold">
                          {row.points} pts
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
            </div>
          )}

          {tab === "teams" && (
            <div>
              <div className="text-lg font-semibold text-white/90">Equipes</div>

              {teamsLoading && (
                <div className="mt-3 text-white/60">Chargement…</div>
              )}
              {teamsErr && (
                <div className="mt-3 text-red-300">Erreur: {teamsErr}</div>
              )}

              {!teamsLoading && !teamsErr && teams.length === 0 && (
                <div className="mt-3 text-white/60">Aucune equipe.</div>
              )}

              {!teamsLoading && !teamsErr && teams.length > 0 && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {teams.map((t) => (
                    <div
                      key={t.id}
                      className="rounded-2xl border border-white/10 bg-black/10 p-4 flex items-center gap-3"
                    >
                      <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                        {t.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={t.logo}
                            alt={t.name}
                            className="h-7 w-7 object-contain"
                          />
                        ) : (
                          <span className="text-white/30 text-xs">—</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-white/90 font-medium truncate">
                          {t.name}
                        </div>
                        <div className="text-xs text-white/50 truncate">
                          {t.country || "—"}
                          {t.founded ? ` • ${t.founded}` : ""}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "players" && (
            <div>
              <div className="text-lg font-semibold text-white/90">Joueurs</div>
              <div className="mt-1 text-xs text-white/50">Meilleurs buteurs</div>

              {playersLoading && (
                <div className="mt-3 text-white/60">Chargement…</div>
              )}
              {playersErr && (
                <div className="mt-3 text-red-300">Erreur: {playersErr}</div>
              )}

              {!playersLoading && !playersErr && players.length === 0 && (
                <div className="mt-3 text-white/60">Aucun joueur.</div>
              )}

              {!playersLoading && !playersErr && players.length > 0 && (
                <div className="mt-4 space-y-2">
                  {players.map((p, idx) => (
                    <div
                      key={p.id}
                      className="rounded-2xl border border-white/10 bg-black/10 p-4 flex items-center gap-3"
                    >
                      <div className="w-7 text-white/60 font-semibold">
                        {idx + 1}
                      </div>

                      <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                        {p.photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.photo}
                            alt={p.name}
                            className="h-10 w-10 object-cover"
                          />
                        ) : (
                          <span className="text-white/30 text-xs">—</span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="text-white/90 font-medium truncate">
                          {p.name}
                        </div>
                        <div className="text-xs text-white/50 flex items-center gap-2">
                          {p.team?.logo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={p.team.logo}
                              alt=""
                              className="h-4 w-4 object-contain"
                            />
                          ) : null}
                          <span className="truncate">{p.team?.name || "—"}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-emerald-200 font-bold">
                          {p.goals} buts
                        </div>
                        <div className="text-xs text-white/50">
                          {p.assists} ast • {p.matches} m
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}