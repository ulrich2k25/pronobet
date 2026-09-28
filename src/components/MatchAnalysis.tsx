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
                  <div className="font-medium text-white/90 truncate">
                    {t.name}
                  </div>
                  <div className="text-xs text-white/50 truncate">
                    {t.country || ""}
                  </div>
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
      const res = await fetch("/api/auth/me", {
        cache: "no-store",
        credentials: "include",
      });
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
        analyzeRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
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
        const res = await fetch(
          `/api/fixtures/next?teamId=${teamA.id}&days=60`,
          {
            cache: "no-store",
          },
        );

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
        resultRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
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
      localStorage.setItem(
        "pb_history",
        JSON.stringify([item, ...prev].slice(0, 200)),
      );
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
    <div className="w-full">
      <div className="mx-auto w-full max-w-[900px]">
        {/* Hero */}
        <div className="mb-5 pt-1 text-left sm:mb-7 sm:pt-2 md:text-center">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-200 md:hidden">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Analyse football par IA
          </div>

          <h1 className="text-[30px] font-extrabold leading-[1.05] tracking-tight text-white sm:text-4xl md:text-5xl">
            Analyse de match
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-white/55 sm:text-base md:mx-auto">
            Choisis deux équipes et obtiens une analyse statistique du match.
          </p>

          <p className="mt-3 hidden text-sm text-emerald-200/70 md:block">
            Notre IA croise des données statistiques pour générer des
            probabilités.
          </p>
        </div>

        {/* Analyse */}
        <div
          ref={analyzeRef}
          className="
            rounded-[24px]
            border border-white/10
            bg-white/[0.035]
            p-4
            shadow-[0_20px_60px_rgba(0,0,0,0.18)]
            sm:p-6
            md:rounded-3xl
            md:p-8
          "
        >
          <div className="mb-4 flex items-center justify-between md:mb-5">
            <div className="text-[11px] font-semibold tracking-[0.16em] text-white/45">
              MATCH À ANALYSER
            </div>

            <div className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] text-white/40 md:hidden">
              2 équipes
            </div>
          </div>

          <TeamInput
            label=""
            placeholder="Équipe domicile"
            value={teamA}
            onPick={(t) => {
              setTeamA(t);
              if (teamB?.id === t.id) setTeamB(null);
            }}
          />

          <div className="relative my-3 flex items-center justify-center sm:my-4 md:my-6">
            <div className="absolute inset-x-0 h-px bg-white/[0.07]" />
            <span className="relative rounded-full border border-white/10 bg-[#0b1322] px-3 py-1 text-[10px] font-bold text-white/40">
              VS
            </span>
          </div>

          <TeamInput
            label=""
            placeholder="Équipe extérieure"
            value={teamB}
            onPick={setTeamB}
          />

          {error && (
            <div className="mt-4 rounded-xl border border-red-400/15 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={onAnalyze}
            disabled={loading || !canAnalyze}
            className="
              mt-5
              flex
              min-h-[52px]
              w-full
              items-center
              justify-center
              rounded-2xl
              bg-emerald-500
              px-5
              text-[15px]
              font-bold
              text-[#04150f]
              shadow-[0_12px_35px_rgba(16,185,129,0.18)]
              transition
              hover:bg-emerald-400
              active:scale-[0.99]
              disabled:cursor-not-allowed
              disabled:bg-white/10
              disabled:text-white/30
              disabled:shadow-none
              md:mt-8
              md:min-h-[60px]
              md:rounded-full
              md:text-lg
            "
          >
            {loading ? "Analyse en cours..." : "Analyser le match"}
          </button>

          <div className="mt-6 flex flex-col gap-5 md:mt-8 md:gap-6">
            {/* Résultat */}
            {result && (
              <div
                ref={resultRef}
                className="order-1 scroll-mt-20 overflow-hidden rounded-2xl border border-emerald-400/15 bg-emerald-500/[0.045]"
              >
                <div className="border-b border-white/10 px-4 py-4 sm:px-5">
                  <div className="text-[10px] font-semibold tracking-[0.16em] text-emerald-300/70">
                    ANALYSE TERMINÉE
                  </div>

                  <div className="mt-1.5 text-base font-bold text-white sm:text-lg">
                    {result.match}
                  </div>
                </div>

                <div className="p-4 sm:p-5">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-xl border border-white/10 bg-black/15 p-3 text-center">
                      <div className="text-[10px] uppercase tracking-wide text-white/40">
                        Domicile
                      </div>
                      <div className="mt-1 text-xl font-extrabold text-white">
                        {Math.round(result.probs.home * 100)}%
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-black/15 p-3 text-center">
                      <div className="text-[10px] uppercase tracking-wide text-white/40">
                        Nul
                      </div>
                      <div className="mt-1 text-xl font-extrabold text-white">
                        {Math.round(result.probs.draw * 100)}%
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-black/15 p-3 text-center">
                      <div className="text-[10px] uppercase tracking-wide text-white/40">
                        Extérieur
                      </div>
                      <div className="mt-1 text-xl font-extrabold text-white">
                        {Math.round(result.probs.away * 100)}%
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 rounded-xl border border-emerald-400/15 bg-emerald-500/10 p-4">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-300/60">
                      Pronostic
                    </div>

                    <div className="mt-1 text-sm font-bold text-emerald-100 sm:text-base">
                      {result.tip}
                    </div>

                    <div className="mt-1.5 text-xs text-white/50">
                      Confiance : {Math.round(result.confidence * 100)}%
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Prochains matchs */}
            {teamA?.id && (
              <div className={result ? "order-2" : "order-1"}>
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">
                  <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-4 sm:px-5">
                    <div>
                      <div className="text-sm font-bold text-white">
                        Prochains matchs
                      </div>
                      <div className="mt-0.5 text-[11px] text-white/40">
                        Sélectionne un match pour remplir l’adversaire
                      </div>
                    </div>

                    {fixturesA.length > 0 && (
                      <div className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] text-white/40">
                        {fixturesA.length}
                      </div>
                    )}
                  </div>

                  {loadingFixturesA && (
                    <div className="px-4 py-5 text-sm text-white/45 sm:px-5">
                      Chargement des matchs...
                    </div>
                  )}

                  {!loadingFixturesA && fixturesA.length === 0 && (
                    <div className="px-4 py-5 text-sm text-white/45 sm:px-5">
                      Aucun match à venir.
                    </div>
                  )}

                  {!loadingFixturesA && fixturesA.length > 0 && (
                    <div className="space-y-2 p-2 sm:p-3">
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
                              setTeamB({
                                id: opp.id,
                                name: opp.name,
                                logo: opp.logo,
                              });

                              setTimeout(() => {
                                analyzeRef.current?.scrollIntoView({
                                  behavior: "smooth",
                                  block: "start",
                                });
                              }, 50);
                            }}
                            className="
                              group
                              w-full
                              rounded-xl
                              border border-white/[0.07]
                              bg-black/15
                              p-3
                              text-left
                              transition
                              hover:border-emerald-400/20
                              hover:bg-white/[0.045]
                              active:scale-[0.995]
                              sm:p-4
                            "
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-[44px] shrink-0 text-center">
                                <div className="text-[11px] font-semibold text-white/65">
                                  {dd}
                                </div>
                                <div className="mt-0.5 text-[10px] text-white/35">
                                  {tt}
                                </div>
                              </div>

                              <div className="h-9 w-px shrink-0 bg-white/[0.07]" />

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={fx.teams.home.logo}
                                    alt=""
                                    className="h-6 w-6 shrink-0 object-contain"
                                  />

                                  <span
                                    className={[
                                      "min-w-0 truncate text-[13px] font-semibold",
                                      isHomeA
                                        ? "text-emerald-200"
                                        : "text-white/85",
                                    ].join(" ")}
                                  >
                                    {fx.teams.home.name}
                                  </span>
                                </div>

                                <div className="mt-2 flex items-center gap-2">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={fx.teams.away.logo}
                                    alt=""
                                    className="h-6 w-6 shrink-0 object-contain"
                                  />

                                  <span
                                    className={[
                                      "min-w-0 truncate text-[13px] font-semibold",
                                      !isHomeA
                                        ? "text-emerald-200"
                                        : "text-white/85",
                                    ].join(" ")}
                                  >
                                    {fx.teams.away.name}
                                  </span>
                                </div>
                              </div>

                              <div className="shrink-0 rounded-lg border border-emerald-400/15 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-200 transition group-hover:bg-emerald-500/15">
                                Choisir
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-3 pb-2 pt-4 text-center text-[10px] leading-4 text-white/30 sm:text-xs md:pt-6">
          Les analyses sont basées sur un modèle statistique et ne garantissent
          aucun résultat.
        </div>
      </div>
    </div>
  );
}
