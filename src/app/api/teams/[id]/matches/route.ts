import { NextResponse } from "next/server";
import { footballGet } from "@/lib/football";

function toMatchRow(m: any) {
  return {
    id: m?.fixture?.id,
    date: m?.fixture?.date,
    status: m?.fixture?.status?.short,
    league: m?.league?.name,
    country: m?.league?.country,
    home: {
      id: m?.teams?.home?.id,
      name: m?.teams?.home?.name,
      logo: m?.teams?.home?.logo,
    },
    away: {
      id: m?.teams?.away?.id,
      name: m?.teams?.away?.name,
      logo: m?.teams?.away?.logo,
    },
    goals: {
      home: m?.goals?.home,
      away: m?.goals?.away,
    },
  };
}

function extractCurrentSeasonYear(leaguesData: any): number | null {
  const resp = leaguesData?.response;
  if (!Array.isArray(resp) || resp.length === 0) return null;
  const seasons = resp[0]?.seasons;
  if (Array.isArray(seasons)) {
    const cur = seasons.find((s: any) => s?.current);
    if (cur?.year) return Number(cur.year) || null;
  }
  return null;
}

export async function GET(_req: Request, ctx: { params: { id: string } }) {
  const teamId = Number(ctx.params.id);
  if (!teamId) {
    return NextResponse.json({ ok: false, error: "BAD_TEAM_ID" }, { status: 400 });
  }

  try {
    // ✅ 1) Prochains matchs (indépendant de la saison)
    let nextData = await footballGet("/fixtures", { team: teamId, next: 8 });
    let next = (nextData?.response || []).map(toMatchRow).filter((m: any) => m?.date);

    // ✅ 2) Derniers matchs (API-Football supporte last)
    let lastData = await footballGet("/fixtures", { team: teamId, last: 8 });
    let last = (lastData?.response || []).map(toMatchRow).filter((m: any) => m?.date);

    // Si next ou last sont vides, on fallback avec saison "current"
    let seasonUsed: number | null = null;

    if (next.length === 0 || last.length === 0) {
      const leagues = await footballGet("/leagues", { team: teamId, current: "true" });
      seasonUsed = extractCurrentSeasonYear(leagues) ?? new Date().getFullYear();

      if (next.length === 0) {
        const d = await footballGet("/fixtures", { team: teamId, season: seasonUsed, next: 8 });
        next = (d?.response || []).map(toMatchRow).filter((m: any) => m?.date);
      }

      if (last.length === 0) {
        const d = await footballGet("/fixtures", { team: teamId, season: seasonUsed, last: 8 });
        last = (d?.response || []).map(toMatchRow).filter((m: any) => m?.date);
      }
    }

    // Trier proprement (next croissant, last décroissant)
    next.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
    last.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({
      ok: true,
      season: seasonUsed, // peut être null si pas nécessaire
      last,
      next,
      meta: {
        mode: seasonUsed ? "next_last_with_season_fallback" : "next_last_no_season",
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "MATCHES_FAILED" },
      { status: 500 }
    );
  }
}