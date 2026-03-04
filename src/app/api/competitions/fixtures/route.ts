import { NextResponse } from "next/server";
import { footballGet } from "@/lib/football";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const leagueId = Number(searchParams.get("leagueId") || 0);
  const season = Number(searchParams.get("season") || 0);

  // options (IMPORTANT: pas de next par défaut)
  const nextParam = searchParams.get("next");
  const lastParam = searchParams.get("last");

  const next = nextParam !== null ? Number(nextParam) : null; // null = pas fourni
  const last = lastParam !== null ? Number(lastParam) : null;

  const status = (searchParams.get("status") || "").trim(); // ex: "NS", "FT"
  const from = (searchParams.get("from") || "").trim(); // YYYY-MM-DD
  const to = (searchParams.get("to") || "").trim(); // YYYY-MM-DD

  if (!leagueId || !season) {
    return NextResponse.json({ ok: false, error: "Missing leagueId/season" }, { status: 400 });
  }

  try {
    const params: Record<string, any> = { league: leagueId, season };

    // ✅ si next/last sont fournis, on respecte
    if (typeof next === "number" && !Number.isNaN(next) && next > 0) params.next = next;
    if (typeof last === "number" && !Number.isNaN(last) && last > 0) params.last = last;

    // ✅ si ni next ni last ne sont fournis, on met un défaut (dernier matchs)
    if (!params.next && !params.last) {
      params.last = 20;
    }

    if (status) params.status = status;
    if (from) params.from = from;
    if (to) params.to = to;

    const data = await footballGet("/fixtures", params);

    const fixtures = (data?.response || [])
      .map((fx: any) => ({
        id: fx?.fixture?.id,
        date: fx?.fixture?.date,
        timestamp: fx?.fixture?.timestamp,
        status: {
          short: fx?.fixture?.status?.short,
          long: fx?.fixture?.status?.long,
          elapsed: fx?.fixture?.status?.elapsed,
        },
        league: {
          id: fx?.league?.id,
          name: fx?.league?.name,
          round: fx?.league?.round,
          logo: fx?.league?.logo,
        },
        teams: {
          home: {
            id: fx?.teams?.home?.id,
            name: fx?.teams?.home?.name,
            logo: fx?.teams?.home?.logo,
            winner: fx?.teams?.home?.winner,
          },
          away: {
            id: fx?.teams?.away?.id,
            name: fx?.teams?.away?.name,
            logo: fx?.teams?.away?.logo,
            winner: fx?.teams?.away?.winner,
          },
        },
        goals: {
          home: fx?.goals?.home,
          away: fx?.goals?.away,
        },
        score: fx?.score || null,
      }))
      .filter((f: any) => f.id && f.date && f.teams?.home?.name && f.teams?.away?.name);

    return NextResponse.json({
      ok: true,
      fixtures,
      meta: { usedParams: params, count: fixtures.length }, // utile pour debug
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "API-Football error", details: e?.message || String(e) },
      { status: 500 }
    );
  }
}