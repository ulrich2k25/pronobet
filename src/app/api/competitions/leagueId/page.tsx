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
  counts: { teams: number; matches: number; players: number; standings: number };
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

type TabKey = "analyse" | "standings" | "matches" | "players" | "teams";

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
      onClick={onClick}
      className={[
        "flex items-center gap-2 rounded-xl border px-4 py-2 text-sm transition",
        active
          ? "bg-emerald-500/10 border-emerald-400/30 text-emerald-200"
          : "bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10",
      ].join(" ")}
      type="button"
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

export default function CompetitionDetailPage({
  params,
}: {
  params: { leagueId: string };
}) {
  const searchParams = useSearchParams();
  const season = Number(searchParams.get("season") || currentSeasonGuess());
  const leagueId = Number(params.leagueId);

  const [tab, setTab] = useState<TabKey>("analyse");
  const [overview, setOverview] = useState<Overview | null>(null);

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

  const header = useMemo(() => {
    if (!overview) return null;
    const l = overview.league;
    const type = (l.type || "").toLowerCase() === "cup" ? "Cup" : "League";
    return {
      name: l.name,
      meta: `${l.country || "International"} • ${type} • ${seasonLabel(
        season
      )}`,
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
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center gap-4">
              <img
                src={header.logo}
                alt={header.name}
                className="h-12 w-12 object-contain"
              />
              <div>
                <div className="text-2xl font-bold text-white">
                  {header.name}
                </div>
                <div className="text-sm text-white/60">{header.meta}</div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 flex gap-2 flex-wrap">
          <Tab active={tab === "analyse"} label="Analyse" onClick={() => setTab("analyse")} />
          <Tab active={tab === "standings"} label="Classement" count={overview?.counts?.standings} onClick={() => setTab("standings")} />
          <Tab active={tab === "matches"} label="Matchs" count={overview?.counts?.matches} onClick={() => setTab("matches")} />
          <Tab active={tab === "players"} label="Joueurs" count={overview?.counts?.players} onClick={() => setTab("players")} />
          <Tab active={tab === "teams"} label="Equipes" count={overview?.counts?.teams} onClick={() => setTab("teams")} />
        </div>
      </div>
    </div>
  );
}