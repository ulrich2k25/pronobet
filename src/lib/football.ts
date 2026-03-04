import "server-only";

const BASE = "https://v3.football.api-sports.io";

export async function footballGet(
  path: string,
  params: Record<string, string | number | boolean | undefined> = {}
) {
  const apiKey = process.env.API_FOOTBALL_KEY || process.env.FOOTBALL_API_KEY;


  
  if (!apiKey) {
    throw new Error("Missing API_FOOTBALL_KEY (or FOOTBALL_API_KEY) in .env.local");
  }

  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined) continue;
    url.searchParams.set(k, String(v));
  }

  const res = await fetch(url.toString(), {
    headers: {
      "x-apisports-key": apiKey,
    },
    cache: "no-store",
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const msg =
      data?.errors
        ? JSON.stringify(data.errors)
        : data?.message || `API-Football error ${res.status}`;
    throw new Error(msg);
  }

  // API-Sports parfois renvoie errors dans un 200
  if (data?.errors && Object.keys(data.errors).length > 0) {
    throw new Error(JSON.stringify(data.errors));
  }

  return data;
}