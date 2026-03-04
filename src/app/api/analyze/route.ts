import { NextResponse } from "next/server";
import { z } from "zod";
import jwt from "jsonwebtoken";

const schema = z.object({
  teamA: z.string().min(2),
  teamB: z.string().min(2),
});

function getTokenFromCookie(cookie: string) {
  const m = cookie.match(/pb_token=([^;]+)/);
  return m?.[1];
}

export async function POST(req: Request) {
  const cookie = req.headers.get("cookie") || "";
  const token = getTokenFromCookie(cookie);

  if (!token) {
    return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET!);
  } catch {
    return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
  }

  const body = await req.json();
  const { teamA, teamB } = schema.parse(body);

  // ✅ Pour l’instant un résultat “mock” (on branchera l’IA après)
  const prediction = {
    match: `${teamA} vs ${teamB}`,
    probs: { home: 0.46, draw: 0.27, away: 0.27 },
    tip: "Victoire équipe 1",
    confidence: 0.72,
  };

  return NextResponse.json({ ok: true, prediction }, { status: 200 });
}
