import { NextResponse } from "next/server";
import { footballGet } from "@/lib/football";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  // Filtres optionnels
  const season = (searchParams.get("season") || "").trim();      // ex: 2025
  const current = (searchParams.get("current") || "").trim();    // "true"
  const search = (searchParams.get("search") || "").trim();      // texte
  const country = (searchParams.get("country") || "").trim();    // ex: France
  const type = (searchParams.get("type") || "").trim();          // league/cup

  const params: Record<string, any> = {};
  if (season) params.season = season;
  if (current) params.current = current; // on laisse "true"/"false" tel quel
  if (search) params.search = search;
  if (country) params.country = country;
  if (type) params.type = type;

  try {
    const data = await footballGet("/leagues", params);

    const leagues = (data?.response || [])
      .map((item: any) => ({
        id: item?.league?.id,
        name: item?.league?.name,
        type: item?.league?.type,
        logo: item?.league?.logo,
        country: item?.country?.name,
        flag: item?.country?.flag,
        seasons: (item?.seasons || []).map((s: any) => ({
          year: s?.year,
          current: !!s?.current,
          start: s?.start,
          end: s?.end,
        })),
      }))
      .filter((l: any) => l.id && l.name);

    return NextResponse.json({ ok: true, leagues });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "API-Football error", details: e?.message || String(e) },
      { status: 500 }
    );
  }
}
