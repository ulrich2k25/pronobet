import { NextResponse } from "next/server";
import { footballGet } from "@/lib/football";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();

  if (q.length < 3) {
    return NextResponse.json({ ok: true, teams: [] });
  }

  try {
    const data = await footballGet("/teams", { search: q });

    const teams = (data?.response || [])
      .map((item: any) => ({
        id: item?.team?.id,
        name: item?.team?.name,
        country: item?.team?.country,
        logo: item?.team?.logo,
      }))
      .filter((t: any) => t.id && t.name);

    return NextResponse.json({ ok: true, teams });
  } catch (e: any) {
    return NextResponse.json(
      {
        ok: false,
        q,
        error: e?.message || String(e),
      },
      { status: 500 }
    );
  }
}