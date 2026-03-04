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
    const data = await footballGet("/standings", { league: leagueId, season });
    const league = data?.response?.[0]?.league;

    // standings = array de groupes. On renvoie tout
    const standings = league?.standings || [];

    return NextResponse.json({
      ok: true,
      league: {
        id: league?.id,
        name: league?.name,
        logo: league?.logo,
        country: league?.country,
        season: league?.season,
      },
      standings,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "API-Football error", details: e?.message || String(e) },
      { status: 500 }
    );
  }
}
