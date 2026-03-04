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
    const data = await footballGet("/teams", { league: leagueId, season });

    const teams = (data?.response || [])
      .map((item: any) => ({
        id: item?.team?.id,
        name: item?.team?.name,
        logo: item?.team?.logo,
        country: item?.team?.country,
        founded: item?.team?.founded,
      }))
      .filter((t: any) => t.id && t.name);

    return NextResponse.json({ ok: true, teams });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "API-Football error", details: e?.message || String(e) },
      { status: 500 }
    );
  }
}