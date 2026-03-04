import { NextResponse } from "next/server";

function fmt(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

async function apiFootballFetch(pathAndQuery: string, apiKey: string) {
  const url = `https://v3.football.api-sports.io${pathAndQuery}`;
  const res = await fetch(url, {
    headers: { "x-apisports-key": apiKey },
    cache: "no-store",
  });
  const data = await res.json().catch(() => null);
  return { res, data, url };
}

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const teamId = searchParams.get("teamId");
    const days = Number(searchParams.get("days") ?? "45");
    const fromParam = searchParams.get("from");
    const nextParam = searchParams.get("next"); // optionnel

    if (!teamId) {
      return NextResponse.json({ error: "teamId is required" }, { status: 400 });
    }

    const apiKey = process.env.API_FOOTBALL_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing API_FOOTBALL_KEY" }, { status: 500 });
    }

    const from = fromParam ? new Date(fromParam) : new Date();
    if (isNaN(from.getTime())) {
      return NextResponse.json(
        { error: "Invalid from date format (YYYY-MM-DD required)" },
        { status: 400 }
      );
    }

    const to = new Date(from);
    to.setDate(to.getDate() + clamp(days, 7, 120));

    // ✅ IMPORTANT : "Prochains matchs" => on utilise NEXT.
    // Si le frontend ne donne pas next, on le dérive depuis days.
    const derivedNext = clamp(Math.ceil(clamp(days, 7, 120) / 3), 5, 20); // ~1 match / 3 jours
    const effectiveNext = clamp(Number(nextParam ?? derivedNext), 1, 20);

    // ✅ 1) Toujours essayer NEXT sans season (le plus fiable)
    const first = await apiFootballFetch(
      `/fixtures?team=${encodeURIComponent(teamId)}&next=${encodeURIComponent(String(effectiveNext))}`,
      apiKey
    );

    if (!first.res.ok) {
      return NextResponse.json(
        { error: "API-FOOTBALL error", status: first.res.status, data: first.data, url: first.url },
        { status: 500 }
      );
    }

    const raw = Array.isArray(first.data?.response) ? first.data.response : [];
    const fixtures = raw
      .slice()
      .sort(
        (a: any, b: any) =>
          new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime()
      )
      .slice(0, effectiveNext);

    // ✅ Si l’API renvoie vide, on renvoie vide (mais on ne part plus sur season=2019)
    return NextResponse.json({
      ok: true,
      ...first.data,
      response: fixtures,
      fixtures,
      meta: {
        handlerVersion: "fixtures-next-v3-next-default",
        mode: nextParam ? "next_param" : "next_derived_from_days",
        from: fmt(from),
        to: fmt(to),
        next: effectiveNext,
        derivedNext,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Server error", message: e?.message || String(e) },
      { status: 500 }
    );
  }
}