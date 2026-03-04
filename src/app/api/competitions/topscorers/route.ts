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
    const data = await footballGet("/players/topscorers", { league: leagueId, season });

    const players = (data?.response || [])
      .map((item: any) => ({
        id: item?.player?.id,
        name: item?.player?.name,
        photo: item?.player?.photo,
        age: item?.player?.age,
        nationality: item?.player?.nationality,
        team: {
          id: item?.statistics?.[0]?.team?.id,
          name: item?.statistics?.[0]?.team?.name,
          logo: item?.statistics?.[0]?.team?.logo,
        },
        goals: item?.statistics?.[0]?.goals?.total ?? 0,
        assists: item?.statistics?.[0]?.goals?.assists ?? 0,
        matches: item?.statistics?.[0]?.games?.appearences ?? 0,
      }))
      .filter((p: any) => p.id && p.name);

    return NextResponse.json({ ok: true, players });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "API-Football error", details: e?.message || String(e) },
      { status: 500 }
    );
  }
}