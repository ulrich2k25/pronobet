import { NextResponse } from "next/server";
import { footballGet } from "@/lib/football";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const leagueId = Number(searchParams.get("leagueId") || 0);
  const season = Number(searchParams.get("season") || 0);

  if (!leagueId || !season) {
    return NextResponse.json({ ok: false, error: "Missing leagueId/season" }, { status: 400 });
  }

  try {
    // 1) League info (name/logo/country/type + seasons)
    const leaguesData = await footballGet("/leagues", { id: leagueId });
    const item = (leaguesData?.response || [])[0];

    const league = {
      id: item?.league?.id,
      name: item?.league?.name,
      type: item?.league?.type, // "League" or "Cup" (API-Football)
      logo: item?.league?.logo,
      country: item?.country?.name,
      flag: item?.country?.flag,
    };

    // 2) Counts (lazy but simple)
    const [teamsData, fixturesData, scorersData, standingsData] = await Promise.all([
      footballGet("/teams", { league: leagueId, season }),
      footballGet("/fixtures", { league: leagueId, season }),
      footballGet("/players/topscorers", { league: leagueId, season }),
      footballGet("/standings", { league: leagueId, season }),
    ]);

    const teamsCount = (teamsData?.response || []).length;
    const matchesCount = (fixturesData?.response || []).length;
    const playersCount = (scorersData?.response || []).length;

    // standings: response[0].league.standings = array de groupes (souvent 1 groupe)
    const standingsGroups = standingsData?.response?.[0]?.league?.standings || [];
    // teams in standings: somme des lignes
    const standingsTeamsCount = standingsGroups.reduce((acc: number, g: any[]) => acc + (g?.length || 0), 0);

    return NextResponse.json({
      ok: true,
      league,
      season,
      counts: {
        teams: teamsCount || standingsTeamsCount || 0,
        matches: matchesCount || 0,
        players: playersCount || 0,
        standings: standingsTeamsCount || 0,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "API-Football error", details: e?.message || String(e) },
      { status: 500 }
    );
  }
}
