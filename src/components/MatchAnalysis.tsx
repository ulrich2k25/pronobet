"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Team = { id: number; name: string; country?: string; logo?: string };

type FixtureItem = {
  fixture: { date: string };
  teams: {
    home: { id: number; name: string; logo: string };
    away: { id: number; name: string; logo: string };
  };
};

function useDebounced(value: string, ms: number) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function TeamInput({
  label,
  placeholder,
  value,
  onPick,
}: {
  label: string;
  placeholder: string;
  value: Team | null;
  onPick: (t: Team) => void;
}) {
  const [q, setQ] = useState(value?.name || "");
  const debounced = useDebounced(q, 250);
  const [items, setItems] = useState<Team[]>([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setQ(value?.name || "");
  }, [value?.id]);

  useEffect(() => {
    let alive = true;

    (async () => {
      const s = debounced.trim();
      if (s.length < 2) {
        if (alive) setItems([]);
        return;
      }

      const res = await fetch(`/api/teams/search?q=${encodeURIComponent(s)}`, {
        cache: "no-store",
      });
      const data = await res.json().catch(() => null);

      if (!alive) return;
      setItems(data?.teams || []);
    })();

    return () => {
      alive = false;
    };
  }, [debounced]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target as any)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div ref={boxRef} className="relative">
      <div className="text-xs tracking-widest text-white/50 mb-3">{label}</div>

      <div className="flex items-center gap-3 w-full rounded-2xl border border-emerald-400/25 bg-black/20 px-5 py-4">
        {value?.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value.logo} alt="" className="h-7 w-7 rounded" />
        ) : (
          <div className="h-7 w-7 rounded bg-white/10" />
        )}

        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full bg-transparent text-white placeholder:text-white/35 outline-none"
        />
      </div>

      {open && items.length > 0 && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-white/10 bg-[#070a18] shadow-2xl">
          <div className="max-h-[280px] overflow-auto">
            {items.slice(0, 12).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  onPick(t);
                  setOpen(false);
                }}
                className="w-full px-4 py-3 hover:bg-white/5 flex items-center gap-3 text-left"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={t.logo || ""} alt="" className="h-7 w-7 rounded" />
                <div className="min-w-0">
                  <div className="font-medium text-white/90 truncate">{t.name}</div>
                  <div className="text-xs text-white/50 truncate">{t.country || ""}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [teamA, setTeamA] = useState<Team | null>(null);
  const [teamB, setTeamB] = useState<Team | null>(null);

  const [loading, setLoading] = useState(false);
  const [authed, setAuthed] = useState<boolean | null>(null);

  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // ✅ Prochains matchs comme Visifoot (basé sur Team A)
  const [fixturesA, setFixturesA] = useState<FixtureItem[]>([]);
  const [loadingFixturesA, setLoadingFixturesA] = useState(false);

  // ✅ scroll direct sur la section analyse (image 2)
  const analyzeRef = useRef<HTMLDivElement | null>(null);

  // ✅ scroll sur le résultat après analyse (mobile)
  const resultRef = useRef<HTMLDivElement | null>(null);

  // ✅ éviter auto analyse 2 fois
  const autoRanRef = useRef(false);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/auth/me", { cache: "no-store", credentials: "include" });
      const data = await res.json().catch(() => null);
      setAuthed(!!data?.authenticated);
    })();
  }, []);

  // ✅ Pré-remplir depuis URL venant d’un match
  useEffect(() => {
    const team1 = (searchParams.get("team1") || "").trim();
    const team2 = (searchParams.get("team2") || "").trim();
    const team1Id = Number(searchParams.get("team1Id") || "0");
    const team2Id = Number(searchParams.get("team2Id") || "0");
    const team1Logo = (searchParams.get("team1Logo") || "").trim();
    const team2Logo = (searchParams.get("team2Logo") || "").trim();

    if (team1 && team2 && team1Id > 0 && team2Id > 0) {
      setTeamA({ id: team1Id, name: team1, logo: team1Logo || undefined });
      setTeamB({ id: team2Id, name: team2, logo: team2Logo || undefined });

      setTimeout(() => {
        analyzeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount only

  // 🔥 Dès que teamA change -> fetch des prochains matchs
  useEffect(() => {
    if (!teamA?.id) {
      setFixturesA([]);
      return;
    }

    let alive = true;

    (async () => {
      setLoadingFixturesA(true);
      try {
        const res = await fetch(`/api/fixtures/next?teamId=${teamA.id}&days=60`, {
          cache: "no-store",
        });

        const data = await res.json().catch(() => null);
        if (!alive) return;

        setFixturesA(data?.response ?? []);
      } finally {
        if (alive) setLoadingFixturesA(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [teamA?.id]);

  const canAnalyze = useMemo(() => {
    return !!teamA?.id && !!teamB?.id && teamA.id !== teamB.id;
  }, [teamA?.id, teamB?.id]);

  async function onAnalyze() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // ✅ si pas connecté -> garder l’URL complète comme next
      if (!authed) {
        const next =
          typeof window !== "undefined"
            ? window.location.pathname + window.location.search
            : "/";
        router.push(`/login?next=${encodeURIComponent(next)}`);
        return;
      }

      if (!canAnalyze) {
        setError("Choisis 2 équipes différentes.");
        return;
      }

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          teamA: teamA!.name,
          teamB: teamB!.name,
          teamAId: teamA!.id,
          teamBId: teamB!.id,
        }),
      });

      const out = await res.json().catch(() => null);

      if (res.status === 401 || out?.error === "AUTH_REQUIRED") {
        const next =
          typeof window !== "undefined"
            ? window.location.pathname + window.location.search
            : "/";
        router.push(`/login?next=${encodeURIComponent(next)}`);
        return;
      }

      if (!res.ok) {
        setError(out?.error || "Erreur analyse");
        return;
      }

      setResult(out.prediction);

      // ✅ scroll direct vers le résultat (visible sur mobile)
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);

      // Save history (localStorage)
      const item = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        teamA,
        teamB,
        prediction: out.prediction,
      };
      const prev = JSON.parse(localStorage.getItem("pb_history") || "[]");
      localStorage.setItem("pb_history", JSON.stringify([item, ...prev].slice(0, 200)));
    } catch (e: any) {
      setError(e?.message || "Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  // ✅ Auto-analyse seulement quand on vient d’un match
  useEffect(() => {
    const from = (searchParams.get("from") || "").toLowerCase();
    if (from !== "match") return;
    if (autoRanRef.current) return;
    if (authed === null) return;
    if (!canAnalyze) return;

    autoRanRef.current = true;
    onAnalyze();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, canAnalyze]);

  return (
    <div className="flex min-h-[86vh] items-center justify-center">
      <div className="w-full max-w-[900px] rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl">
        <div className="text-center">
          <h1 className="text-5xl font-extrabold tracking-tight">Analyse de match</h1>
          <p className="mt-2 text-white/70">Entre les équipes que tu veux analyser</p>
          <p className="mt-4 text-sm text-emerald-200/80">
            Notre IA croise des données statistiques pour générer des probabilités.
          </p>
        </div>

        {/* ✅ REF pour scroll direct */}
        <div ref={analyzeRef} className="mt-10 rounded-3xl border border-white/10 bg-black/10 p-8">
          <div className="text-xs tracking-widest text-white/50 mb-5">MATCH À ANALYSER</div>

          <TeamInput
            label=""
            placeholder="Cherche une équipe (ex: Barcelona, PSG...)"
            value={teamA}
            onPick={(t) => {
              setTeamA(t);
              if (teamB?.id === t.id) setTeamB(null);
            }}
          />

          <div className="my-6 text-center text-white/50 font-semibold">VS</div>

          <TeamInput
            label=""
            placeholder="Cherche une équipe (ex: Real Madrid, Bayern...)"
            value={teamB}
            onPick={setTeamB}
          />

          {error && <div className="mt-4 text-sm text-red-300/90">{error}</div>}

          <button
            onClick={onAnalyze}
            disabled={loading || !canAnalyze}
            className="mt-8 w-full rounded-full bg-emerald-600/80 hover:bg-emerald-600 transition py-5 text-lg font-semibold disabled:opacity-50"
          >
            {loading ? "Chargement..." : 'Analyser le match avec "IA"'}
          </button>

          {/* ✅ Résultat + Prochains matchs avec ordre dynamique */}
          <div className="mt-8 flex flex-col gap-6">
            {/* ✅ Résultat d'abord après analyse */}
            {result && (
              <div
                ref={resultRef}
                className="order-1 rounded-2xl border border-white/10 bg-white/5 p-5"
              >
                <div className="text-sm text-white/60 mb-2">Résultat</div>
                <div className="font-semibold">{result.match}</div>
                <div className="mt-2 text-sm text-white/70">
                  Probas: Home {Math.round(result.probs.home * 100)}% • Draw{" "}
                  {Math.round(result.probs.draw * 100)}% • Away{" "}
                  {Math.round(result.probs.away * 100)}%
                </div>
                <div className="mt-1 text-sm text-emerald-200">
                  Tip: {result.tip} (conf {Math.round(result.confidence * 100)}%)
                </div>
              </div>
            )}

            {/* ✅ Prochains matchs : avant analyse -> 1er ; après analyse -> 2e */}
            {teamA?.id && (
              <div className={result ? "order-2" : "order-1"}>
                <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                  <div className="px-6 py-4 text-sm font-semibold text-white/80">
                    Prochains matchs
                  </div>

                  {loadingFixturesA && (
                    <div className="px-6 pb-6 text-sm text-white/50">Chargement...</div>
                  )}

                  {!loadingFixturesA && fixturesA.length === 0 && (
                    <div className="px-6 pb-6 text-sm text-white/50">
                      Aucun match à venir.
                    </div>
                  )}

                  <div className="px-4 pb-5 space-y-3">
                    {fixturesA.map((fx, idx) => {
                      const d = new Date(fx.fixture.date);
                      const dd = d.toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "2-digit",
                      });
                      const tt = d.toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      });

                      const isHomeA = fx.teams.home.id === teamA.id;
                      const opp = isHomeA ? fx.teams.away : fx.teams.home;

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setTeamB({ id: opp.id, name: opp.name, logo: opp.logo });
                          }}
                          className="w-full rounded-xl border border-white/10 bg-black/20 px-5 py-4 hover:bg-white/5 transition"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="w-20 text-left text-xs text-white/55 leading-5">
                              <div>{dd}</div>
                              <div>{tt}</div>
                            </div>

                            <div className="flex-1 flex items-center justify-center gap-3 min-w-0">
                              <span className="text-sm font-semibold text-emerald-200 truncate">
                                {fx.teams.home.name}
                              </span>

                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={fx.teams.home.logo} alt="" className="h-6 w-6 rounded" />

                              <span className="text-xs text-white/40">vs</span>

                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={fx.teams.away.logo} alt="" className="h-6 w-6 rounded" />

                              <span className="text-sm font-semibold text-white/90 truncate">
                                {fx.teams.away.name}
                              </span>
                            </div>

                            <div className="w-6" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-white/45">
          Les analyses sont basées sur un modèle statistique.
        </div>
      </div>
    </div>
  );
}