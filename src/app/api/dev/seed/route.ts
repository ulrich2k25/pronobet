import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST() {
  // 1) Tables attendues: teams(id,name,country,logo_url) & fixtures(id,home_team_id,away_team_id,starts_at)
  // 2) On seed seulement si teams est vide

  const { count, error: countErr } = await supabaseAdmin
    .from("teams")
    .select("*", { count: "exact", head: true });

  if (countErr) {
    return NextResponse.json(
      { ok: false, error: "DB error", details: countErr.message },
      { status: 500 }
    );
  }

  if ((count ?? 0) > 0) {
    return NextResponse.json({ ok: true, seeded: false, message: "Already seeded" });
  }

  const teams = [
    { id: 1, name: "Liverpool", country: "England", logo_url: "https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg" },
    { id: 2, name: "Manchester City", country: "England", logo_url: "https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg" },
    { id: 3, name: "Real Madrid", country: "Spain", logo_url: "https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg" },
    { id: 4, name: "Barcelona", country: "Spain", logo_url: "https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg" },
    { id: 5, name: "PSG", country: "France", logo_url: "https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg" },
    { id: 6, name: "Lille", country: "France", logo_url: "https://upload.wikimedia.org/wikipedia/en/4/44/LOSC_Lille_logo.svg" }
  ];

  const now = new Date();
  const plusHours = (h: number) => new Date(now.getTime() + h * 3600 * 1000).toISOString();

  const fixtures = [
    { id: 101, home_team_id: 1, away_team_id: 2, starts_at: plusHours(24) },
    { id: 102, home_team_id: 3, away_team_id: 4, starts_at: plusHours(30) },
    { id: 103, home_team_id: 5, away_team_id: 6, starts_at: plusHours(40) },
    { id: 104, home_team_id: 1, away_team_id: 5, starts_at: plusHours(50) }
  ];

  const { error: tErr } = await supabaseAdmin.from("teams").insert(teams);
  if (tErr) return NextResponse.json({ ok: false, error: tErr.message }, { status: 500 });

  const { error: fErr } = await supabaseAdmin.from("fixtures").insert(fixtures);
  if (fErr) return NextResponse.json({ ok: false, error: fErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, seeded: true });
}
