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

function norm(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function pickRotatingPrediction(teamA: string, teamB: string, step: number) {
  // step: 0 => équipe A gagne, 1 => nul, 2 => équipe B gagne
  if (step === 0) {
    return {
      match: `${teamA} vs ${teamB}`,
      probs: { home: 0.55, draw: 0.25, away: 0.2 },
      tip: `Victoire ${teamA}`,
      confidence: 0.72,
    };
  }
  if (step === 1) {
    return {
      match: `${teamA} vs ${teamB}`,
      probs: { home: 0.33, draw: 0.4, away: 0.27 },
      tip: "Match nul",
      confidence: 0.62,
    };
  }
  return {
    match: `${teamA} vs ${teamB}`,
    probs: { home: 0.22, draw: 0.28, away: 0.5 },
    tip: `Victoire ${teamB}`,
    confidence: 0.7,
  };
}

// userKey -> { counter, cache(matchKey -> prediction) }
const store = new Map<
  string,
  { counter: number; cache: Map<string, any> }
>();

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

  const userKey = token.slice(0, 32);

  let entry = store.get(userKey);
  if (!entry) {
    entry = { counter: 0, cache: new Map() };
    store.set(userKey, entry);
  }

  // ✅ même match même si inversé (teamA/teamB)
  const a = norm(teamA);
  const b = norm(teamB);
  const matchKey = [a, b].sort().join("|");

  // ✅ Si déjà analysé → même résultat
  const cached = entry.cache.get(matchKey);
  if (cached) {
    return NextResponse.json(
      { ok: true, mode: "mock-rotating", cached: true, prediction: cached },
      { status: 200 }
    );
  }

  // ✅ Nouveau match → rotation + cache
  const step = entry.counter % 3;
  entry.counter += 1;

  const prediction = pickRotatingPrediction(teamA, teamB, step);
  entry.cache.set(matchKey, prediction);

  return NextResponse.json(
    {
      ok: true,
      mode: "mock-rotating",
      cached: false,
      index: entry.counter,
      prediction,
    },
    { status: 200 }
  );
}