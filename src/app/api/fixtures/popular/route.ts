import { NextResponse } from "next/server";
import { footballGet } from "@/lib/football";

// Route dédiée aux suggestions : aucune modification des routes d'analyse existantes.
export const dynamic = "force-dynamic";

const CACHE_SECONDS = 3 * 60 * 60; // 3 h : limiter les appels à API-Football.
const LEAGUES = [
  { id: 2, name: "Ligue des champions" },
  { id: 39, name: "Premier League" },
  { id: 140, name: "Liga" },
  { id: 78, name: "Bundesliga" },
  { id: 135, name: "Serie A" },
  { id: 61, name: "Ligue 1" },
] as const;

// Identifiants API-Football de clubs particulièrement suivis.
// Ce classement sert uniquement à choisir les suggestions, jamais aux prédictions.
const TOP_CLUBS = new Set([
  33, 34, 40, 42, 47, 49, 50, 66, // Angleterre
  529, 530, 541, // Espagne
  157, 165, 168, // Allemagne
  489, 492, 496, 497, 505, // Italie
  81, 85, 91, // France
]);

type ApiFixture = {
  fixture?: {
    id?: number;
    date?: string;
    status?: { short?: string };
  };
  league?: { id?: number; name?: string };
  teams?: {
    home?: { id?: number; name?: string; logo?: string };
    away?: { id?: number; name?: string; logo?: string };
  };
};

type PopularFixture = {
  id: number;
  leagueId: number;
  score: number;
  fixture: { date: string };
  teams: {
    home: { id: number; name: string; logo: string };
    away: { id: number; name: string; logo: string };
  };
};

type ResponseFixture = Pick<PopularFixture, "fixture" | "teams">;
type Payload = { ok: true; response: ResponseFixture[] };

let memo: { until: number; value: Payload } | null = null;
let pending: Promise<Payload> | null = null;

async function loadPopularFixtures(): Promise<Payload> {
  const now = Date.now();
  const year = new Date(now).getUTCFullYear();
  const month = new Date(now).getUTCMonth();
  // Saison européenne : juillet à juin.
  const season = month >= 6 ? year : year - 1;
  const latest = now + 45 * 24 * 60 * 60 * 1000;

  const responses = await Promise.allSettled(
    LEAGUES.map(async (league) => {
      const data = (await footballGet("/fixtures", {
        league: league.id,
        season,
        next: 12,
      })) as { response?: ApiFixture[] };

      return (Array.isArray(data?.response) ? data.response : []).flatMap(
        (item): PopularFixture[] => {
          const id = item?.fixture?.id;
          const date = item?.fixture?.date;
          const home = item?.teams?.home;
          const away = item?.teams?.away;
          const timestamp = date ? new Date(date).getTime() : Number.NaN;

          if (
            typeof id !== "number" ||
            typeof date !== "string" ||
            !Number.isFinite(timestamp) ||
            timestamp <= now ||
            timestamp > latest ||
            (item.fixture?.status?.short && !["NS", "TBD"].includes(item.fixture.status.short)) ||
            typeof home?.id !== "number" ||
            typeof away?.id !== "number" ||
            !home.name ||
            !away.name ||
            home.id === away.id
          ) {
            return [];
          }

          const homePopular = TOP_CLUBS.has(home.id) ? 1 : 0;
          const awayPopular = TOP_CLUBS.has(away.id) ? 1 : 0;
          const score = homePopular + awayPopular + (homePopular && awayPopular ? 2 : 0) + (league.id === 2 ? 1 : 0);

          return [{
            id,
            leagueId: league.id,
            score,
            fixture: { date },
            teams: {
              home: { id: home.id, name: home.name, logo: home.logo || "" },
              away: { id: away.id, name: away.name, logo: away.logo || "" },
            },
          }];
        },
      );
    }),
  );

  if (responses.every((res) => res.status === "rejected")) {
    throw new Error("Aucune compétition disponible auprès d'API-Football");
  }

  // Rencontres attrayantes en premier, puis les plus proches ; maximum 3 par championnat.
  const candidates = responses
    .filter((res): res is PromiseFulfilledResult<PopularFixture[]> => res.status === "fulfilled")
    .flatMap((res) => res.value)
    .sort((a, b) => b.score - a.score || new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime());

  const leagueCounts = new Map<number, number>();
  const seen = new Set<number>();
  const selected: ResponseFixture[] = [];

  for (const item of candidates) {
    if (selected.length >= 12) break;
    if (seen.has(item.id) || (leagueCounts.get(item.leagueId) || 0) >= 3) continue;
    seen.add(item.id);
    leagueCounts.set(item.leagueId, (leagueCounts.get(item.leagueId) || 0) + 1);
    selected.push({ fixture: item.fixture, teams: item.teams });
  }

  // Présentation chronologique des rencontres sélectionnées.
  selected.sort((a, b) => new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime());
  return { ok: true, response: selected };
}

export async function GET() {
  try {
    if (!memo || memo.until <= Date.now()) {
      if (!pending) {
        pending = loadPopularFixtures()
          .then((value) => {
            memo = { value, until: Date.now() + CACHE_SECONDS * 1000 };
            return value;
          })
          .finally(() => { pending = null; });
      }
      const value = await pending;
      return NextResponse.json(value, {
        headers: { "Cache-Control": `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=600` },
      });
    }

    return NextResponse.json(memo.value, {
      headers: { "Cache-Control": `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=600` },
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Impossible de récupérer les suggestions pour le moment." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
