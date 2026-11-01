"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowUpRight, CalendarDays, Medal, Shield, Trophy, Users, BarChart3 } from "lucide-react";

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
  icon: Icon,
}: {
  active: boolean;
  label: string;
  count?: number;
  onClick: () => void;
  icon: typeof Trophy;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={[
        "group flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-[13px] border px-3 py-3 text-[12px] font-bold transition-[color,background-color,border-color,box-shadow] duration-200 sm:gap-2.5 sm:px-5 sm:text-sm",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9F76B]",
        active
          ? "border-[#A0CB61]/50 bg-[#C9F76B] text-[#101A0C] shadow-[0_5px_22px_rgba(201,247,107,0.10)]"
          : "border-[#324A38] bg-[#17271C] text-[#B5C8B6] hover:border-[#779451] hover:bg-[#213427] hover:text-[#F3F8F0]",
      ].join(" ")}
    >
      <Icon aria-hidden="true" className="h-[17px] w-[17px] shrink-0" strokeWidth={1.8} />
      <span>{label}</span>
      {typeof count === "number" && (
        <span className={[
          "rounded-full px-1.5 py-0.5 text-[10px] font-extrabold tabular-nums",
          active ? "bg-[#152314]/15 text-[#182711]" : "bg-[#0C1A10] text-[#9CB6A0]",
        ].join(" ")}>{count}</span>
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
    <div className="relative isolate w-full min-w-0 overflow-hidden rounded-[24px] bg-[#09110E] text-[#F4F7F0] shadow-[0_25px_80px_rgba(0,0,0,0.15)] sm:rounded-[30px] lg:rounded-[36px]">
      {/* Texture purement décorative, sans interaction */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[390px] overflow-hidden">
        <div className="absolute -right-40 -top-48 h-[520px] w-[520px] rounded-full border border-[#C9F76B]/[0.13] sm:-right-16 sm:h-[620px] sm:w-[620px]" />
        <div className="absolute -right-20 -top-28 h-[350px] w-[350px] rounded-full border border-[#C9F76B]/[0.08] sm:right-12" />
        <div className="absolute right-0 top-0 h-[230px] w-[350px] bg-[#C9F76B]/[0.05] blur-[90px]" />
        <div className="absolute inset-0 opacity-15 [background-image:linear-gradient(rgba(181,213,177,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(181,213,177,0.08)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      </div>

      <div className="relative mx-auto w-full max-w-[1100px] min-w-0 px-4 pb-9 pt-5 sm:px-7 sm:pb-12 sm:pt-8 lg:px-10 lg:pt-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/competitions"
            className="group inline-flex min-h-11 items-center gap-2 rounded-full border border-[#365041] bg-[#17271D] px-4 text-[12px] font-semibold text-[#D3E3D3] transition hover:border-[#9AC96A]/60 hover:bg-[#243829] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9F76B]"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Compétitions
          </Link>
          <div className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.19em] text-[#C9F76B] sm:text-[11px]">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#C9F76B] shadow-[0_0_13px_rgba(201,247,107,0.35)]" />
            PronoBet <span className="font-normal text-[#719076]">/</span> PRONOBET
          </div>
        </div>

        <section className="relative mt-6 overflow-hidden rounded-[22px] border border-[#364A3A] bg-[#142119] p-4 shadow-[0_20px_45px_rgba(0,0,0,0.19)] sm:mt-8 sm:rounded-[26px] sm:p-7 lg:p-8" aria-label="Présentation de la compétition">
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#C9F76B]/55 to-transparent" />
          <div className="relative flex min-w-0 items-center gap-3 sm:gap-6">
            <div className="flex h-[74px] w-[74px] shrink-0 items-center justify-center rounded-[19px] border border-[#3B5341] bg-[#0C1710] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:h-[102px] sm:w-[102px] sm:rounded-[24px] sm:p-4">
              {header?.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={header.logo} alt={header.name} className="h-full w-full object-contain" />
              ) : (
                <Trophy aria-hidden="true" className="h-8 w-8 text-[#C9F76B] sm:h-10 sm:w-10" strokeWidth={1.4} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#C9F76B] sm:text-[11px]">Fiche compétition</p>
              <h1 className="break-words text-[clamp(1.55rem,4vw,2.85rem)] font-black leading-[1.08] tracking-[-0.05em] text-[#F6F8F2]">
                {header?.name || "Compétition"}
              </h1>
              <p className="mt-2 text-[12px] leading-5 text-[#ACC2AF] sm:text-[14px]">{header?.meta || seasonLabel(season)}</p>
            </div>
          </div>
          {overview?.counts && (
            <div className="relative mt-6 grid grid-cols-2 gap-2 border-t border-[#344739] pt-5 sm:grid-cols-4 sm:gap-3">
              {([
                { icon: Trophy, label: "Classement", value: overview.counts.standings },
                { icon: CalendarDays, label: "Matchs", value: overview.counts.matches },
                { icon: Users, label: "Joueurs", value: overview.counts.players },
                { icon: Shield, label: "Équipes", value: overview.counts.teams },
              ]).map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="min-w-0 rounded-[14px] border border-[#34493A] bg-[#0C1911]/70 px-3 py-3 sm:px-4 sm:py-3.5">
                    <div className="flex items-center gap-2 text-[#B0C4B1]"><Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-[#C9F76B]" strokeWidth={1.7} /><span className="truncate text-[11px] font-medium sm:text-[12px]">{stat.label}</span></div>
                    <div className="mt-1.5 text-[20px] font-extrabold tabular-nums tracking-tight text-[#F7FAF3] sm:text-[24px]">{stat.value}</div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <div className="mt-7 sm:mt-9">
          <p className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.19em] text-[#C9F76B]">01 / Explorer la compétition</p>
          <div role="tablist" aria-label="Informations sur la compétition" className="-mx-4 flex min-w-0 gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0">
            <Tab active={tab === "standings"} label="Classement" count={overview?.counts?.standings} onClick={() => setTab("standings")} icon={BarChart3} />
            <Tab active={tab === "matches"} label="Matchs" count={overview?.counts?.matches} onClick={() => setTab("matches")} icon={CalendarDays} />
            <Tab active={tab === "players"} label="Joueurs" count={overview?.counts?.players} onClick={() => setTab("players")} icon={Medal} />
            <Tab active={tab === "teams"} label="Équipes" count={overview?.counts?.teams} onClick={() => setTab("teams")} icon={Users} />
          </div>
        </div>

        <section className="mt-5 min-w-0 sm:mt-7" aria-live="polite">
          {loading && (
            <div className="flex min-h-[180px] items-center justify-center rounded-[22px] border border-[#314838] bg-[#142119] px-5 text-sm text-[#B5C7B5]">
              <span aria-hidden="true" className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-[#C9F76B]/20 border-t-[#C9F76B] motion-reduce:animate-none" />
              Chargement…
            </div>
          )}

          {err && (
            <div role="alert" className="rounded-[16px] border border-red-400/25 bg-red-500/10 px-4 py-4 text-sm text-red-200">{err}</div>
          )}

          {/* CLASSEMENT — cartes mobiles, tableau complet sur ordinateur. */}
          {!loading && !err && tab === "standings" && (
            <div className="min-w-0">
              <div className="mb-4 flex min-w-0 items-end justify-between gap-3">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#C9F76B]">02 / Classement</p>
                  <h2 className="mt-2 text-[23px] font-extrabold tracking-[-0.04em] text-white sm:text-[28px]">Classement des équipes</h2>
                </div>
                <span className="hidden shrink-0 rounded-full border border-[#36503D] bg-[#17281D] px-3 py-1.5 text-xs font-semibold text-[#B6D0B7] sm:inline-flex">Saison {seasonLabel(season)}</span>
              </div>
              {!standings?.length ? (
                <div className="rounded-[20px] border border-[#33483A] bg-[#142119] px-5 py-10 text-center text-sm text-[#AEC2AE]">Aucun classement disponible.</div>
              ) : (
                <>
                  <div className="space-y-2.5 md:hidden">
                    {standings.filter((r) => r && r.team && r.team.name).map((r) => (
                      <article key={r.team.id ?? `${r.rank}-${r.team.name}`} className="overflow-hidden rounded-[19px] border border-[#334A39] bg-[#142119]">
                        <div className="flex min-w-0 items-center gap-3 p-3.5">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#45603F] bg-[#263825] text-[15px] font-extrabold tabular-nums text-[#C9F76B]">{r.rank ?? "-"}</div>
                          {r.team?.logo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={r.team.logo} alt="" className="h-9 w-9 shrink-0 object-contain" />
                          ) : <span aria-hidden="true" className="h-9 w-9 shrink-0 rounded-lg bg-[#263829]" />}
                          <div className="min-w-0 flex-1 break-words text-sm font-bold leading-snug text-[#F6F8F2]">{r.team?.name || "—"}</div>
                          <div className="shrink-0 text-right"><div className="text-xl font-black tabular-nums text-[#C9F76B]">{r.points ?? 0}</div><div className="text-[10px] font-medium text-[#A7BCAA]">points</div></div>
                        </div>
                        <div className="grid grid-cols-4 gap-px border-t border-[#344A3A] bg-[#344A3A] text-center">
                          {[
                            { label: "J", value: r.all?.played ?? 0 },
                            { label: "G", value: r.all?.win ?? 0 },
                            { label: "N", value: r.all?.draw ?? 0 },
                            { label: "P", value: r.all?.lose ?? 0 },
                            { label: "BP", value: r.all?.goals?.for ?? 0 },
                            { label: "BC", value: r.all?.goals?.against ?? 0 },
                            { label: "Diff", value: r.goalsDiff ?? (r.all?.goals?.for ?? 0) - (r.all?.goals?.against ?? 0) },
                          ].map((stat) => (
                            <div key={stat.label} className="bg-[#101D14] py-2"><div className="text-[9px] font-bold uppercase text-[#90AA95]">{stat.label}</div><div className="mt-1 text-[12px] font-bold tabular-nums text-white">{stat.value}</div></div>
                          ))}
                        </div>
                      </article>
                    ))}
                    <p className="pt-1 text-[11px] leading-5 text-[#A4B7A5]">J = joués · G = gagnés · N = nuls · P = perdus · BP/BC = buts marqués/encaissés.</p>
                  </div>
                  <div className="hidden overflow-hidden rounded-[22px] border border-[#344939] bg-[#142119] md:block">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[640px] text-[13px]">
                        <thead className="bg-[#1B2B20] text-[#C5D6C4]">
                          <tr>
                            <th scope="col" className="w-12 px-4 py-4 text-left font-semibold">#</th>
                            <th scope="col" className="px-3 py-4 text-left font-semibold">Équipe</th>
                            <th scope="col" className="px-3 py-4 text-right font-semibold">Pts</th>
                            <th scope="col" className="px-2 py-4 text-right font-semibold">J</th>
                            <th scope="col" className="px-2 py-4 text-right font-semibold">G</th>
                            <th scope="col" className="px-2 py-4 text-right font-semibold">N</th>
                            <th scope="col" className="px-2 py-4 text-right font-semibold">P</th>
                            <th scope="col" className="px-2 py-4 text-right font-semibold">BP</th>
                            <th scope="col" className="px-2 py-4 text-right font-semibold">BC</th>
                            <th scope="col" className="px-4 py-4 text-right font-semibold">Diff</th>
                          </tr>
                        </thead>
                        <tbody>
                          {standings.filter((r) => r && r.team && r.team.name).map((r) => (
                            <tr key={r.team.id ?? `${r.rank}-${r.team.name}`} className="border-t border-[#334738] transition-colors hover:bg-[#213326]">
                              <td className="px-4 py-4 font-bold tabular-nums text-[#B6CEB5]">{r.rank ?? "-"}</td>
                              <td className="px-3 py-4"><div className="flex min-w-0 items-center gap-3">
                                {r.team?.logo ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={r.team.logo} alt="" className="h-8 w-8 shrink-0 object-contain" />
                                ) : <span aria-hidden="true" className="h-8 w-8 shrink-0 rounded-lg bg-[#263829]" />}
                                <span className="min-w-0 font-bold text-[#F3F8F0]">{r.team?.name || "—"}</span>
                              </div></td>
                              <td className="px-3 py-4 text-right font-black tabular-nums text-[#C9F76B]">{r.points ?? 0}</td>
                              <td className="px-2 py-4 text-right tabular-nums text-[#CBDBCA]">{r.all?.played ?? 0}</td>
                              <td className="px-2 py-4 text-right tabular-nums text-[#CBDBCA]">{r.all?.win ?? 0}</td>
                              <td className="px-2 py-4 text-right tabular-nums text-[#CBDBCA]">{r.all?.draw ?? 0}</td>
                              <td className="px-2 py-4 text-right tabular-nums text-[#CBDBCA]">{r.all?.lose ?? 0}</td>
                              <td className="px-2 py-4 text-right tabular-nums text-[#CBDBCA]">{r.all?.goals?.for ?? 0}</td>
                              <td className="px-2 py-4 text-right tabular-nums text-[#CBDBCA]">{r.all?.goals?.against ?? 0}</td>
                              <td className="px-4 py-4 text-right tabular-nums text-[#CBDBCA]">{r.goalsDiff ?? (r.all?.goals?.for ?? 0) - (r.all?.goals?.against ?? 0)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* MATCHS — chemin d'analyse d'origine conservé. */}
          {!loading && !err && tab === "matches" && (
            <div>
              <div className="mb-4"><p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#C9F76B]">02 / Calendrier</p><h2 className="mt-2 text-[23px] font-extrabold tracking-[-0.04em] sm:text-[28px]">Prochains matchs</h2></div>
              {!fixtures?.length ? (
                <div className="rounded-[20px] border border-[#33483A] bg-[#142119] px-5 py-10 text-center text-sm text-[#AEC2AE]">Aucun match trouvé.</div>
              ) : (
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
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
                      <article key={fixture.id} className="group overflow-hidden rounded-[20px] border border-[#344A3A] bg-[#142119] transition-[border-color,background-color] hover:border-[#719357] hover:bg-[#192A1F]">
                        <div className="flex min-w-0 items-center justify-between gap-3 border-b border-[#324638] px-4 py-3 sm:px-5">
                          <span className="inline-flex shrink-0 items-center gap-2 text-[11px] font-semibold text-[#C3D3C1]"><CalendarDays aria-hidden="true" className="h-4 w-4 text-[#C9F76B]" strokeWidth={1.7} />{fmtDate(fixture.date)}</span>
                          {fixture.league?.round && <span className="min-w-0 truncate text-right text-[10px] font-medium text-[#95AE99]" title={fixture.league.round}>{fixture.league.round}</span>}
                        </div>
                        <div className="px-4 pb-4 pt-4 sm:px-5 sm:pb-5">
                          <div className="space-y-3">
                            <div className="flex min-w-0 items-center gap-3">
                              {home.logo ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={home.logo} alt="" className="h-9 w-9 shrink-0 object-contain" />
                              ) : <span aria-hidden="true" className="h-9 w-9 shrink-0 rounded-lg bg-[#253729]" />}
                              <span className="min-w-0 flex-1 break-words text-sm font-bold leading-tight text-[#F5F8F2]">{home.name}</span>
                              <span className="shrink-0 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#A7BCA7]">Dom</span>
                            </div>
                            <div className="flex min-w-0 items-center gap-3">
                              {away.logo ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={away.logo} alt="" className="h-9 w-9 shrink-0 object-contain" />
                              ) : <span aria-hidden="true" className="h-9 w-9 shrink-0 rounded-lg bg-[#253729]" />}
                              <span className="min-w-0 flex-1 break-words text-sm font-bold leading-tight text-[#F5F8F2]">{away.name}</span>
                              <span className="shrink-0 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#A7BCA7]">Ext</span>
                            </div>
                          </div>
                          <Link href={href} className="mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-[13px] border border-[#9FCB66]/40 bg-[#C9F76B] px-4 text-[13px] font-extrabold text-[#172211] transition hover:bg-[#D9FF98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9F76B] active:scale-[0.99]">Analyser ce match <ArrowUpRight aria-hidden="true" className="h-4 w-4" /></Link>
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
              <div className="mb-4"><p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#C9F76B]">02 / Statistiques individuelles</p><h2 className="mt-2 text-[23px] font-extrabold tracking-[-0.04em] sm:text-[28px]">Top buteurs</h2></div>
              {!topscorers?.length ? (
                <div className="rounded-[20px] border border-[#33483A] bg-[#142119] px-5 py-10 text-center text-sm text-[#AEC2AE]">Aucun joueur trouvé.</div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
                  {topscorers.map((player, index) => (
                    <article key={player.id ?? `${index}-${player.name}`} className="flex min-w-0 items-center gap-3 rounded-[18px] border border-[#344A3A] bg-[#142119] p-3.5 transition-colors hover:border-[#739058] hover:bg-[#1B2D21] sm:gap-4 sm:p-4">
                      <div className="w-6 shrink-0 text-center text-[13px] font-black tabular-nums text-[#C9F76B] sm:w-8">{String(index+1).padStart(2, "0")}</div>
                      {player.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={player.photo} alt={player.name} className="h-12 w-12 shrink-0 rounded-[14px] border border-[#3F5543] object-cover" />
                      ) : <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] border border-[#3F5543] bg-[#223629]"><Users className="h-5 w-5 text-[#A2B8A5]" /></span>}
                      <div className="min-w-0 flex-1">
                        <div className="break-words text-[13px] font-bold leading-snug text-[#F6F8F2] sm:text-[14px]">{player.name}</div>
                        <div className="mt-1.5 flex min-w-0 items-center gap-2 text-[11px] text-[#A9BEA9]">
                          {player.team?.logo && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={player.team.logo} alt="" className="h-4 w-4 shrink-0 object-contain" />
                          )}
                          <span className="min-w-0 truncate">{player.team?.name || "—"}</span>
                        </div>
                      </div>
                      <div className="shrink-0 rounded-[12px] border border-[#3D6241] bg-[#213B27] px-3 py-2 text-center">
                        <div className="text-xl font-black tabular-nums text-[#C9F76B]">{player.goals ?? 0}</div>
                        <div className="text-[9px] font-extrabold uppercase tracking-[0.08em] text-[#BDD2B8]">Buts</div>
                        <div className="mt-1 text-[10px] tabular-nums text-[#A8BCAB]">{player.assists ?? 0} assists</div>
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
              <div className="mb-4"><p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#C9F76B]">02 / Participants</p><h2 className="mt-2 text-[23px] font-extrabold tracking-[-0.04em] sm:text-[28px]">Équipes</h2></div>
              {!teams?.length ? (
                <div className="rounded-[20px] border border-[#33483A] bg-[#142119] px-5 py-10 text-center text-sm text-[#AEC2AE]">Aucune équipe trouvée.</div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {teams.map((team) => (
                    <article key={team.id} className="flex min-w-0 items-center gap-3 rounded-[18px] border border-[#344A3A] bg-[#142119] p-3.5 transition-[border-color,background-color] hover:border-[#79945D] hover:bg-[#1B2D21] sm:p-4">
                      <span className="flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-[14px] border border-[#3D5142] bg-[#0B1710] p-2">
                        {team.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={team.logo} alt="" className="h-full w-full object-contain" />
                        ) : <Shield aria-hidden="true" className="h-6 w-6 text-[#8BA88E]" />}
                      </span>
                      <div className="min-w-0"><div className="break-words text-[14px] font-bold leading-snug text-[#F4F8F1]">{team.name}</div>{team.country && <div className="mt-1 text-[12px] text-[#A7BAA8]">{team.country}</div>}</div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        <div className="mt-10 flex items-center justify-between gap-3 border-t border-[#314636] pt-5 text-[11px] text-[#91AA94] sm:mt-14">
          <span>Football intelligence · PronoBet</span>
          <span className="inline-flex items-center gap-1 text-[#A3C67D]"><span className="h-1.5 w-1.5 rounded-full bg-[#C9F76B]" />PRONOBET</span>
        </div>
      </div>
    </div>
  );
}
