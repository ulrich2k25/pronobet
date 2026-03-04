"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Overview = {
  league: { id: number; name: string; type?: string; logo?: string; country?: string };
  season: number;
  counts: { teams: number; matches: number; players: number; standings: number };
};

type TabKey = "standings" | "matches" | "players" | "teams";

type StandingRow = {
  rank: number;
  points: number;
  goalsDiff?: number;
  team: { id: number; name: string; logo?: string };
  all: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } };
};

type Fixture = {
  id: number;
  date: string;
  status?: { short?: string; long?: string; elapsed?: number | null };
  league?: { round?: string | null };
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
};

type TopScorer = {
  id: number;
  name: string;
  photo?: string | null;
  team?: { id: number; name: string; logo?: string | null } | null;
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
        "flex items-center gap-2 rounded-xl border px-4 py-2 text-sm transition",
        active
          ? "bg-emerald-500/10 border-emerald-400/30 text-emerald-200"
          : "bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10",
      ].join(" ")}
    >
      <span className="font-medium">{label}</span>
      {typeof count === "number" && (
        <span className="text-xs rounded-full px-2 py-0.5 bg-black/20 border border-white/10 text-white/70">
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

export default function CompetitionDetailClient({ leagueId }: { leagueId: string }) {
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
      const res = await fetch(`/api/competitions/overview?leagueId=${leagueIdNum}&season=${season}`, {
        cache: "no-store",
      });
      const data = await res.json().catch(() => null);
      if (data?.ok) setOverview(data);
    })();
  }, [leagueIdNum, season]);

  const header = useMemo(() => {
    if (!overview) return null;
    const l = overview.league;
    const type = (l.type || "").toLowerCase() === "cup" ? "Cup" : "League";
    return {
      name: l.name,
      meta: `${l.country || "International"} • ${type} • ${seasonLabel(season)}`,
      logo: l.logo,
    };
  }, [overview, season]);

  // Load tab data (only once per tab)
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
          const res = await fetch(`/api/competitions/standings?leagueId=${leagueIdNum}&season=${season}`, {
            cache: "no-store",
          });
          const data = await res.json();
          if (!data?.ok) throw new Error(data?.error || "Erreur classement");
          setStandings(data.standings || []);
        }

        if (tab === "matches") {
          // ✅ Prochains matchs
          const res = await fetch(`/api/competitions/fixtures?leagueId=${leagueIdNum}&season=${season}&next=30`, {
            cache: "no-store",
          });
          const data = await res.json();
          if (!data?.ok) throw new Error(data?.error || "Erreur matchs");
          setFixtures(data.fixtures || []);
        }

        if (tab === "teams") {
          const res = await fetch(`/api/competitions/teams?leagueId=${leagueIdNum}&season=${season}`, {
            cache: "no-store",
          });
          const data = await res.json();
          if (!data?.ok) throw new Error(data?.error || "Erreur équipes");
          setTeams(data.teams || []);
        }

        if (tab === "players") {
          const res = await fetch(`/api/competitions/topscorers?leagueId=${leagueIdNum}&season=${season}&top=25`, {
            cache: "no-store",
          });
          const data = await res.json();
          if (!data?.ok) throw new Error(data?.error || "Erreur joueurs");
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
    <div className="p-8">
      <div className="mx-auto w-full max-w-3xl">
        <Link href="/competitions" className="text-sm text-white/60 hover:text-white/90">
          ← Retour aux competitions
        </Link>

        {header && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center gap-4">
              {header.logo && <img src={header.logo} alt={header.name} className="h-12 w-12 object-contain" />}
              <div>
                <div className="text-2xl font-bold text-white">{header.name}</div>
                <div className="text-sm text-white/60">{header.meta}</div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 flex gap-2 flex-wrap">
          <Tab active={tab === "standings"} label="Classement" count={overview?.counts?.standings} onClick={() => setTab("standings")} />
          <Tab active={tab === "matches"} label="Matchs" count={overview?.counts?.matches} onClick={() => setTab("matches")} />
          <Tab active={tab === "players"} label="Joueurs" count={overview?.counts?.players} onClick={() => setTab("players")} />
          <Tab active={tab === "teams"} label="Equipes" count={overview?.counts?.teams} onClick={() => setTab("teams")} />
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
          {loading && <div className="text-white/70">Chargement...</div>}
          {err && <div className="text-red-300">⚠ {err}</div>}

          {/* CLASSEMENT */}
          {!loading && !err && tab === "standings" && (
            <div className="overflow-x-auto">
              <div className="text-lg font-semibold text-white mb-3">Classement</div>

              {!standings?.length ? (
                <div className="text-white/60">Aucun classement disponible.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="text-white/50">
                    <tr className="border-b border-white/10">
                      <th className="py-2 text-left">#</th>
                      <th className="py-2 text-left">Équipe</th>
                      <th className="py-2 text-right">Pts</th>
                      <th className="py-2 text-right">J</th>
                      <th className="py-2 text-right">G</th>
                      <th className="py-2 text-right">N</th>
                      <th className="py-2 text-right">P</th>
                      <th className="py-2 text-right">BP</th>
                      <th className="py-2 text-right">BC</th>
                      <th className="py-2 text-right">Diff</th>
                    </tr>
                  </thead>

                  <tbody className="text-white/80">
                    {(standings || [])
                      .filter((r: any) => r && r.team && r.team.name)
                      .map((r: any) => (
                        <tr key={r.team.id ?? `${r.rank}-${r.team.name}`} className="border-b border-white/5">
                          <td className="py-2">{r.rank ?? "-"}</td>

                          <td className="py-2">
                            <div className="flex items-center gap-2">
                              {r.team?.logo ? (
                                <img src={r.team.logo} alt={r.team?.name || "team"} className="h-5 w-5 object-contain" />
                              ) : (
                                <div className="h-5 w-5 rounded bg-white/10" />
                              )}
                              <span className="text-white">{r.team?.name || "—"}</span>
                            </div>
                          </td>

                          <td className="py-2 text-right font-semibold text-white">{r.points ?? 0}</td>
                          <td className="py-2 text-right">{r.all?.played ?? 0}</td>
                          <td className="py-2 text-right">{r.all?.win ?? 0}</td>
                          <td className="py-2 text-right">{r.all?.draw ?? 0}</td>
                          <td className="py-2 text-right">{r.all?.lose ?? 0}</td>
                          <td className="py-2 text-right">{r.all?.goals?.for ?? 0}</td>
                          <td className="py-2 text-right">{r.all?.goals?.against ?? 0}</td>
                          <td className="py-2 text-right">
                            {r.goalsDiff ?? ((r.all?.goals?.for ?? 0) - (r.all?.goals?.against ?? 0))}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* MATCHS (style Visifoot + bouton Analyser →) */}
          {!loading && !err && tab === "matches" && (
            <div>
              <div className="flex items-center gap-2 text-white mb-4">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-400/20">
                  🕒
                </span>
                <div className="text-lg font-semibold">Prochains matchs</div>
              </div>

              {!fixtures?.length ? (
                <div className="text-white/60">Aucun match trouvé.</div>
              ) : (
                <div className="space-y-3">
                  {fixtures.map((f) => {
                    const home = f.teams.home;
                    const away = f.teams.away;

                    // ✅ params compatibles avec MatchAnalysis.tsx
                    const href =
                      `/matches?from=match` +
                      `&team1Id=${encodeURIComponent(String(home.id))}` +
                      `&team2Id=${encodeURIComponent(String(away.id))}` +
                      `&team1=${encodeURIComponent(home.name)}` +
                      `&team2=${encodeURIComponent(away.name)}` +
                      `&team1Logo=${encodeURIComponent(home.logo || "")}` +
                      `&team2Logo=${encodeURIComponent(away.logo || "")}`;

                    return (
                      <div key={f.id} className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
                        <div className="flex items-center justify-between gap-4">
                          {/* équipe gauche */}
                          <div className="flex items-center gap-3 min-w-0">
                            {home.logo ? (
                              <img src={home.logo} alt={home.name} className="h-8 w-8 object-contain" />
                            ) : (
                              <div className="h-8 w-8 rounded bg-white/10" />
                            )}
                            <div className="truncate text-white font-medium">{home.name}</div>
                          </div>

                          {/* centre */}
                          <div className="text-center shrink-0">
                            <div className="text-sm text-white/70">{fmtDate(f.date)}</div>
                            <Link
                              href={href}
                              className="mt-1 inline-flex items-center gap-1 text-emerald-300 hover:text-emerald-200 text-sm"
                            >
                              Analyser <span aria-hidden>→</span>
                            </Link>
                          </div>

                          {/* équipe droite */}
                          <div className="flex items-center gap-3 min-w-0 justify-end">
                            <div className="truncate text-white font-medium">{away.name}</div>
                            {away.logo ? (
                              <img src={away.logo} alt={away.name} className="h-8 w-8 object-contain" />
                            ) : (
                              <div className="h-8 w-8 rounded bg-white/10" />
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

          {/* JOUEURS */}
          {!loading && !err && tab === "players" && (
            <div>
              <div className="text-lg font-semibold text-white mb-3">Top buteurs</div>
              {!topscorers?.length ? (
                <div className="text-white/60">Aucun joueur trouvé.</div>
              ) : (
                <div className="space-y-2">
                  {topscorers.map((p, idx) => (
                    <div key={p.id ?? `${idx}-${p.name}`} className="rounded-xl border border-white/10 bg-black/20 p-3 flex items-center gap-3">
                      <div className="w-8 text-white/70 font-semibold">{idx + 1}</div>
                      {p.photo ? (
                        <img src={p.photo} alt={p.name} className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-white/10" />
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="text-white font-medium truncate">{p.name}</div>
                        <div className="text-xs text-white/50 flex items-center gap-2">
                          {p.team?.logo && <img src={p.team.logo} alt={p.team.name} className="h-4 w-4 object-contain" />}
                          <span className="truncate">{p.team?.name || "—"}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-white font-semibold">{p.goals ?? 0} buts</div>
                        <div className="text-xs text-white/50">{p.assists ?? 0} assists</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ÉQUIPES */}
          {!loading && !err && tab === "teams" && (
            <div>
              <div className="text-lg font-semibold text-white mb-3">Équipes</div>
              {!teams?.length ? (
                <div className="text-white/60">Aucune équipe trouvée.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {teams.map((t) => (
                    <div key={t.id} className="rounded-xl border border-white/10 bg-black/20 p-3 flex items-center gap-3">
                      {t.logo ? (
                        <img src={t.logo} alt={t.name} className="h-8 w-8 object-contain" />
                      ) : (
                        <div className="h-8 w-8 rounded bg-white/10" />
                      )}
                      <div className="min-w-0">
                        <div className="text-white font-medium truncate">{t.name}</div>
                        <div className="text-xs text-white/50 truncate">{t.country || ""}</div>
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