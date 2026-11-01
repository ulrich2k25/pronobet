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
    <div ref={boxRef} className="relative min-w-0">
      <label className="mb-3 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#B5C2B5] sm:text-[11px]">
        {label}
      </label>

      <div className="group flex min-h-[66px] w-full min-w-0 items-center gap-3 rounded-[18px] border border-[#34433C] bg-[#0C1411] px-3.5 transition-colors duration-200 focus-within:border-[#C9F76B] focus-within:bg-[#111C15] hover:border-[#58695C] sm:px-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] border border-white/[0.08] bg-[#1D2921]">
          {value?.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value.logo} alt="" className="h-8 w-8 object-contain" />
          ) : (
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 text-[#8A9D8E]" fill="none" stroke="currentColor" strokeWidth="1.4">
              <path d="m12 2 8.5 5v10L12 22l-8.5-5V7L12 2Z" />
              <path d="m12 6 5 3v6l-5 3-5-3V9l5-3Z" />
            </svg>
          )}
        </div>

        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          aria-label={placeholder}
          placeholder={placeholder}
          className="w-full min-w-0 flex-1 bg-transparent py-4 text-[15px] font-semibold text-[#F4F7EF] outline-none placeholder:font-medium placeholder:text-[#839387] sm:text-base"
        />

        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-[#94A495] transition-colors group-focus-within:text-[#C9F76B]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="m15.5 15.5 5 5" />
        </svg>
      </div>

      {open && items.length > 0 && (
        <div className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-[18px] border border-[#3E5144] bg-[#121F18] shadow-[0_24px_60px_rgba(0,0,0,0.65)]">
          <div className="max-h-[280px] overflow-y-auto overscroll-contain p-1.5">
            {items.slice(0, 12).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  onPick(t);
                  setOpen(false);
                }}
                className="flex w-full min-w-0 items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-[#27382B] focus-visible:bg-[#27382B] focus-visible:outline-none"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={t.logo || ""} alt="" className="h-9 w-9 shrink-0 object-contain" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-[#F5F8F2]">{t.name}</div>
                  <div className="mt-0.5 truncate text-xs text-[#A7BAA9]">{t.country || ""}</div>
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
  const [fixtureSourceId, setFixtureSourceId] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [authed, setAuthed] = useState<boolean | null>(null);

  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // ✅ Prochains matchs comme Visifoot (basé sur Team A)
  const [fixturesA, setFixturesA] = useState<FixtureItem[]>([]);
  const [loadingFixturesA, setLoadingFixturesA] = useState(false);

  // Suggestions visibles dès l'ouverture, avant toute recherche d'équipe.
  const [popularFixtures, setPopularFixtures] = useState<FixtureItem[]>([]);
  const [loadingPopularFixtures, setLoadingPopularFixtures] = useState(true);
  const [popularFixturesError, setPopularFixturesError] = useState(false);

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
      setFixtureSourceId(team1Id);

      setTimeout(() => {
        analyzeRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 50);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount only

  // Une seule requête vers notre API interne ; les requêtes football sont mises en cache côté serveur.
  useEffect(() => {
    // Un match transmis par l'URL ouvre directement son parcours existant.
    if (Number(searchParams.get("team1Id")) > 0 && Number(searchParams.get("team2Id")) > 0) {
      setLoadingPopularFixtures(false);
      return;
    }

    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/fixtures/popular");
        if (!res.ok) throw new Error("Chargement indisponible");
        const data = await res.json();
        if (!alive) return;
        setPopularFixtures(Array.isArray(data?.response)
          ? data.response.filter((fx: FixtureItem) => new Date(fx.fixture.date).getTime() > Date.now())
          : []);
      } catch {
        if (alive) setPopularFixturesError(true);
      } finally {
        if (alive) setLoadingPopularFixtures(false);
      }
    })();

    return () => { alive = false; };
    // Lecture des paramètres initiaux uniquement : même logique que le préremplissage existant.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 🔥 Dès que teamA change -> fetch des prochains matchs
  useEffect(() => {
    if (!fixtureSourceId) {
      setFixturesA([]);
      return;
    }

    let alive = true;

    (async () => {
      setLoadingFixturesA(true);
      try {
        const res = await fetch(
          `/api/fixtures/next?teamId=${fixtureSourceId}&days=60`,
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
  }, [fixtureSourceId]);

  const canAnalyze = useMemo(() => {
    return !!teamA?.id && !!teamB?.id && teamA.id !== teamB.id;
  }, [teamA?.id, teamB?.id]);

  function redirectToLogin() {
    const params = new URLSearchParams(window.location.search);

    if (teamA && teamB) {
      params.set("team1", teamA.name);
      params.set("team2", teamB.name);
      params.set("team1Id", String(teamA.id));
      params.set("team2Id", String(teamB.id));
      params.set("team1Logo", teamA.logo ?? "");
      params.set("team2Logo", teamB.logo ?? "");
      params.set("from", "match");
    }

    const query = params.toString();

    const next =
      window.location.pathname + (query ? `?${query}` : "");

    router.push(`/login?next=${encodeURIComponent(next)}`);
  }

  async function onAnalyze() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // ✅ si pas connecté -> garder l’URL complète comme next
      if (!authed) {
        redirectToLogin();
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
        redirectToLogin();
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

  // Les mêmes cartes et actions sont réutilisées pour les suggestions et pour la recherche actuelle.
  const showingTeamFixtures = !!fixtureSourceId;
  const visibleFixtures = showingTeamFixtures
    ? fixturesA
    : popularFixtures;
  const loadingVisibleFixtures = showingTeamFixtures ? loadingFixturesA : loadingPopularFixtures;

  return (
    <div className="relative isolate w-full min-w-0 overflow-hidden rounded-[24px] bg-[#09110E] text-[#F2F5EE] shadow-[0_24px_90px_rgba(0,0,0,0.18)] sm:rounded-[30px] lg:rounded-[36px]">
      {/* Décor purement visuel, sans interaction avec les données. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[430px] overflow-hidden">
        <div className="absolute -right-20 -top-32 h-[410px] w-[410px] rounded-full border border-[#C9F76B]/[0.13] sm:right-6 sm:h-[530px] sm:w-[530px]" />
        <div className="absolute -right-6 -top-16 h-[310px] w-[310px] rounded-full border border-[#C9F76B]/[0.09] sm:right-20 sm:h-[430px] sm:w-[430px]" />
        <div className="absolute -right-20 top-16 h-[300px] w-[300px] rounded-full bg-[#C9F76B]/[0.045] blur-3xl" />
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(181,213,177,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(181,213,177,0.07)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      </div>

      <div className="relative mx-auto w-full max-w-[1100px] px-4 pb-6 pt-6 sm:px-7 sm:pb-9 sm:pt-9 lg:px-10 lg:pt-11">
        {/* En-tête éditorial */}
        <div className="mb-8 sm:mb-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2.5 text-[10px] font-extrabold uppercase tracking-[0.24em] text-[#C9F76B] sm:text-[11px]">
              <span className="relative flex h-2.5 w-2.5 items-center justify-center">
                <span className="absolute h-full w-full rounded-full bg-[#C9F76B]/30" />
                <span className="relative h-1.5 w-1.5 rounded-full bg-[#C9F76B]" />
              </span>
              PronoBet <span className="font-medium text-[#819888]">/</span> PRONOBET
            </div>
            <span className="rounded-full border border-[#425746] bg-[#15241A]/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.13em] text-[#D7E3D6]">
              Analyse statistique
            </span>
          </div>

          <div className="mt-8 max-w-[760px] sm:mt-11">
            <span className="mb-3 block text-xs font-semibold uppercase tracking-[0.19em] text-[#A6B9A8]">
              Le football, décodé
            </span>
            <h1 className="max-w-[760px] text-[clamp(2.3rem,6.8vw,5rem)] font-black leading-[0.99] tracking-[-0.065em] text-[#F6F8F2]">
              Chaque match.<br />
              <span className="text-[#C9F76B]">Une nouvelle lecture.</span>
            </h1>
            <p className="mt-5 max-w-[550px] text-[14px] leading-7 text-[#B1C0B3] sm:mt-6 sm:text-[16px]">
              Sélectionne deux équipes. Explore les probabilités et les statistiques qui éclairent leur confrontation.
            </p>
            {/* Accès compact au canal Telegram sur téléphone et tablette. */}
            <a
              href="https://t.me/fixed1xbetpro"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Rejoindre notre canal Telegram (nouvel onglet)"
              className="mt-5 inline-flex min-h-[44px] max-w-full items-center gap-2.5 rounded-full border border-[#287A9F] bg-[#122831] px-4 py-2.5 text-[12px] font-bold text-[#B8ECFF] transition-colors hover:border-[#47B8E5] hover:bg-[#193842] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#47B8E5] lg:hidden sm:text-[13px]"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0 text-[#42B9EC]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="m22 2-7 20-4-9-9-4Z" />
                <path d="M22 2 11 13" />
              </svg>
              <span className="min-w-0">Rejoindre notre canal Telegram</span>
              <span aria-hidden="true" className="shrink-0 text-[#82D8FF]">↗</span>
            </a>
          </div>
        </div>

        {/* Configuration du match */}
        <section ref={analyzeRef} aria-labelledby="match-lab-title" className="relative scroll-mt-20 overflow-visible rounded-[24px] border border-[#35453A] bg-[#142019] p-4 shadow-[0_30px_55px_rgba(0,0,0,0.15)] sm:rounded-[28px] sm:p-7 lg:p-9">
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[#C9F76B]/60 to-transparent" />
          <div className="mb-7 flex flex-wrap items-start justify-between gap-3 sm:mb-8">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#C9F76B]">01 / Sélection</div>
              <h2 id="match-lab-title" className="mt-2 text-[22px] font-extrabold tracking-[-0.045em] text-[#F6F8F2] sm:text-[27px]">
                Préparer l&apos;analyse
              </h2>
              <p className="mt-1.5 text-[13px] leading-5 text-[#A8BAAA]">Choisis les équipes de la rencontre.</p>
            </div>
            <div className="hidden h-10 w-10 items-center justify-center rounded-full border border-[#475C49] bg-[#1E3024] text-[#C9F76B] sm:flex">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M12 4v16M4 12h16" /><circle cx="12" cy="12" r="3" /></svg>
            </div>
          </div>

          <div className="grid min-w-0 grid-cols-1 items-end gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1fr)_52px_minmax(0,1fr)] lg:gap-3">
            <TeamInput
              label="Équipe à domicile"
              placeholder="Rechercher une équipe"
              value={teamA}
              onPick={(t) => {
                setTeamA(t);
                setFixtureSourceId(t.id);
                if (teamB?.id === t.id) setTeamB(null);
              }}
            />

            <div aria-hidden="true" className="relative flex items-center justify-center py-1 lg:h-[66px] lg:py-0">
              <div className="absolute inset-x-0 top-1/2 h-px bg-[#35453A] lg:inset-y-0 lg:left-1/2 lg:top-0 lg:h-auto lg:w-px" />
              <span className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[#4B5B4E] bg-[#1E3024] text-[10px] font-black tracking-widest text-[#D6E6D6] lg:h-10 lg:w-10">VS</span>
            </div>

            <TeamInput label="Équipe à l&apos;extérieur" placeholder="Rechercher une équipe" value={teamB} onPick={setTeamB} />
          </div>

          {error && (
            <div role="alert" className="mt-5 rounded-[14px] border border-[#F58E8E]/30 bg-[#F58E8E]/10 px-4 py-3 text-sm leading-6 text-[#FFD0D0]">
              {error}
            </div>
          )}

          <div className="mt-6 border-t border-[#34453A] pt-6 sm:mt-8 sm:pt-7">
            <button
              type="button"
              onClick={onAnalyze}
              disabled={loading || !canAnalyze}
              className="group flex min-h-[58px] w-full items-center justify-center gap-3 rounded-[16px] bg-[#C9F76B] px-5 text-[15px] font-extrabold tracking-[-0.015em] text-[#101A0F] shadow-[0_12px_30px_rgba(201,247,107,0.13)] transition-[background-color,transform,box-shadow] duration-200 hover:bg-[#D9FF90] hover:shadow-[0_14px_36px_rgba(201,247,107,0.24)] active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C9F76B] disabled:cursor-not-allowed disabled:bg-[#34433A] disabled:text-[#8DA18F] disabled:shadow-none disabled:hover:scale-100 sm:min-h-[64px] sm:text-base"
            >
              <span>{loading ? "Analyse en cours..." : "Analyser le match"}</span>
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1 group-disabled:translate-x-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
            </button>
            <p className="mt-3 text-center text-[11px] leading-5 text-[#9AAE9D]">
              Analyse fondée sur des données statistiques, sans garantie de résultat.
            </p>
          </div>
        </section>

        <div className="mt-6 flex min-w-0 flex-col gap-6 sm:mt-8 sm:gap-8">
          {/* Rapport d'analyse — affichage prioritaire du pronostic et des probabilités. */}
          {result && (
            <section
              ref={resultRef}
              aria-labelledby="report-title"
              aria-live="polite"
              className="order-1 scroll-mt-20 overflow-hidden rounded-[24px] border border-[#526D4E] bg-[#142019] shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:rounded-[28px]"
            >
              {/* En-tête condensé : les résultats utiles arrivent immédiatement. */}
              <div className="relative overflow-hidden border-b border-[#364A39] bg-[#1B2B20] px-4 py-5 sm:px-7 sm:py-6">
                <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-32 h-72 w-72 rounded-full border border-[#C9F76B]/10" />
                <div className="relative flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#C9F76B]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#C9F76B]" />
                    02 / Résultat de l&apos;analyse
                  </span>
                  <span className="rounded-full border border-[#C9F76B]/25 bg-[#C9F76B]/10 px-2.5 py-1 text-[10px] font-bold text-[#D8F6AC]">
                    Analyse terminée
                  </span>
                </div>
                <h2 id="report-title" className="relative mt-3 break-words text-[clamp(1.2rem,3.4vw,1.85rem)] font-black leading-tight tracking-[-0.035em] text-[#F5F9F1]">
                  {result.match}
                </h2>
              </div>

              <div className="space-y-5 p-3 sm:space-y-6 sm:p-7">
                {/* Synthèse mise en premier : aucun défilement supplémentaire nécessaire pour lire le pronostic. */}
                <div className="relative isolate overflow-hidden rounded-[21px] border border-[#E3FFB1]/50 bg-[#C9F76B] px-4 py-5 text-[#14200E] shadow-[0_16px_40px_rgba(160,221,91,0.13)] sm:rounded-[24px] sm:p-7">
                  <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-14 h-48 w-48 rounded-full border-[22px] border-[#28401A]/[0.055]" />
                  <div className="relative inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#334720]">
                    <span className="h-2 w-2 rounded-full bg-[#28401A]" />
                    Le pronostic en un regard
                  </div>

                  <div className="relative mt-4 flex min-w-0 flex-col gap-5 min-[540px]:flex-row min-[540px]:items-center min-[540px]:justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[#344821]">Projection statistique principale</p>
                      <p className="mt-1.5 break-words text-[clamp(1.6rem,4.8vw,2.65rem)] font-black leading-[1.09] tracking-[-0.05em] text-[#111B0E]">
                        {result.tip}
                      </p>
                    </div>

                    <div className="flex w-full min-w-0 items-center gap-4 rounded-[17px] bg-[#172415] px-4 py-3 text-[#F3FFE2] min-[540px]:w-auto min-[540px]:shrink-0 min-[540px]:flex-col min-[540px]:items-start min-[540px]:gap-1 min-[540px]:px-5 min-[540px]:py-4">
                      <span className="shrink-0 text-[32px] font-black leading-none tracking-[-0.05em] text-[#D5FF88] sm:text-[38px]">
                        {Math.round(result.confidence * 100)}%
                      </span>
                      <span className="text-[11px] font-semibold leading-4 text-[#D2DFC9]">
                        Probabilité estimée<br className="hidden min-[540px]:block" /> du pronostic
                      </span>
                    </div>
                  </div>
                  <p className="relative mt-4 border-t border-[#203A14]/20 pt-3 text-[11px] font-medium leading-5 text-[#3C512C] sm:text-xs">
                    C&apos;est une estimation du modèle, pas une garantie sur l&apos;issue du match.
                  </p>
                </div>

                {/* Les trois issues conservent exactement les probabilités retournées par l'API. */}
                <div aria-label="Probabilités estimées du match" className="rounded-[20px] border border-[#3B5140] bg-[#101B14] p-3 sm:rounded-[24px] sm:p-5">
                  <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
                    <h3 className="text-[15px] font-extrabold tracking-[-0.025em] text-[#F5F9F1] sm:text-lg">Chances de chaque résultat</h3>
                    <p className="text-[11px] leading-4 text-[#AAC0AD] sm:text-xs">Victoire domicile · Nul · Victoire extérieur</p>
                  </div>
                  <div className="grid min-w-0 grid-cols-3 gap-1.5 sm:gap-3">
                    {[
                      {
                        key: "1",
                        label: "Domicile",
                        probability: Math.round(result.probs.home * 100),
                        barClass: "bg-[#C9F76B]",
                      },
                      {
                        key: "N",
                        label: "Match nul",
                        probability: Math.round(result.probs.draw * 100),
                        barClass: "bg-[#9DB7A0]",
                      },
                      {
                        key: "2",
                        label: "Extérieur",
                        probability: Math.round(result.probs.away * 100),
                        barClass: "bg-[#82D9B2]",
                      },
                    ].map((outcome) => (
                      <div key={outcome.key} className="min-w-0 rounded-[15px] border border-[#354A3A] bg-[#1C2A20] p-2.5 sm:rounded-[19px] sm:p-4">
                        <div className="flex items-center gap-1.5">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] bg-[#314536] text-[10px] font-black text-[#EAF5E8] sm:h-7 sm:w-7 sm:text-xs">
                            {outcome.key}
                          </span>
                          <span className="min-w-0 text-[10px] font-semibold leading-3 text-[#C5D5C6] sm:text-xs">{outcome.label}</span>
                        </div>
                        <div className="mt-4 text-[clamp(1.45rem,5.7vw,2.65rem)] font-black leading-none tracking-[-0.065em] text-[#F9FFF5]">
                          {outcome.probability}%
                        </div>
                        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#374B3D] sm:h-2">
                          <div className={`h-full rounded-full ${outcome.barClass}`} style={{ width: `${outcome.probability}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-[11px] leading-5 text-[#9FB5A4] sm:text-xs">
                    Chaque pourcentage représente la chance estimée de cette issue. Ce ne sont pas des certitudes.
                  </p>
                </div>

                {result.expectedGoals && result.sample && (
                  <section aria-labelledby="model-stats-title" className="rounded-[20px] border border-[#3D5140] bg-[#101B14] p-4 sm:rounded-[24px] sm:p-6">
                    <div className="max-w-[720px]">
                      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#C9F76B]">Pour aller plus loin</span>
                      <h3 id="model-stats-title" className="mt-2 text-[20px] font-black tracking-[-0.035em] text-[#F4F7F1] sm:text-[24px]">Comprendre les chiffres</h3>
                      <p className="mt-2 text-[13px] leading-6 text-[#B5C9B9] sm:text-sm">
                        Les <strong className="font-bold text-[#E4EFE1]">buts estimés</strong> sont une moyenne calculée, pas un score prédit.
                        La <strong className="font-bold text-[#E4EFE1]">chance de marquer</strong> indique la probabilité estimée d&apos;inscrire au moins un but.
                      </p>
                    </div>

                    <div className="mt-5 grid min-w-0 grid-cols-1 gap-3 min-[480px]:grid-cols-2 sm:gap-4">
                      <div className="min-w-0 rounded-[18px] border border-[#405746] bg-[#1A2B20] p-4 sm:p-5">
                        <div className="text-xs font-extrabold uppercase tracking-[0.1em] text-[#C9F76B]">Équipe à domicile</div>
                        <p className="mt-1 break-words text-sm font-semibold text-[#E9F1E8]">{teamA?.name || "Domicile"}</p>
                        <div className="mt-4 flex flex-wrap items-end gap-x-3 gap-y-1">
                          <span className="text-[36px] font-black leading-none tracking-[-0.06em] text-[#F5F8F2]">{result.expectedGoals.home.toFixed(2).replace(".", ",")}</span>
                          <span className="max-w-[110px] text-xs leading-4 text-[#AEC4B1]">Buts moyens estimés</span>
                        </div>
                        <div className="mt-5 rounded-[14px] border border-[#557447]/50 bg-[#2A4029] p-3.5">
                          <p className="text-xs leading-5 text-[#D5E5D4]">Chance de marquer au moins 1 but</p>
                          <div className="mt-1.5 text-[28px] font-black leading-none text-[#D7FF93]">{Math.round((1 - Math.exp(-result.expectedGoals.home)) * 100)}%</div>
                        </div>
                        <p className="mt-3 text-xs text-[#AFC1B0]">{result.sample.homeMatches} matchs étudiés</p>
                      </div>
                      <div className="min-w-0 rounded-[18px] border border-[#405746] bg-[#1A2B20] p-4 sm:p-5">
                        <div className="text-xs font-extrabold uppercase tracking-[0.1em] text-[#C9F76B]">Équipe à l&apos;extérieur</div>
                        <p className="mt-1 break-words text-sm font-semibold text-[#E9F1E8]">{teamB?.name || "Extérieur"}</p>
                        <div className="mt-4 flex flex-wrap items-end gap-x-3 gap-y-1">
                          <span className="text-[36px] font-black leading-none tracking-[-0.06em] text-[#F5F8F2]">{result.expectedGoals.away.toFixed(2).replace(".", ",")}</span>
                          <span className="max-w-[110px] text-xs leading-4 text-[#AEC4B1]">Buts moyens estimés</span>
                        </div>
                        <div className="mt-5 rounded-[14px] border border-[#557447]/50 bg-[#2A4029] p-3.5">
                          <p className="text-xs leading-5 text-[#D5E5D4]">Chance de marquer au moins 1 but</p>
                          <div className="mt-1.5 text-[28px] font-black leading-none text-[#D7FF93]">{Math.round((1 - Math.exp(-result.expectedGoals.away)) * 100)}%</div>
                        </div>
                        <p className="mt-3 text-xs text-[#AFC1B0]">{result.sample.awayMatches} matchs étudiés</p>
                      </div>
                    </div>
                    <p className="mt-5 border-t border-[#304637] pt-4 text-[11px] leading-5 text-[#A6BBAA] sm:text-xs">
                      Calculs statistiques fondés sur les résultats historiques et un modèle de Poisson. Aucune issue n&apos;est garantie.
                    </p>
                  </section>
                )}
              </div>
            </section>
          )}

          {/* Liste de matchs : ordre domicile / extérieur et clic inchangés. */}
          {(showingTeamFixtures || loadingPopularFixtures || visibleFixtures.length > 0 || popularFixturesError) && (
            <section className={result ? "order-2" : "order-1"} aria-labelledby="fixtures-title">
              <div className="overflow-hidden rounded-[24px] border border-[#354A3B] bg-[#142019] sm:rounded-[28px]">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#334638] px-4 py-5 sm:px-7 sm:py-6">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C9F76B]">03 / Calendrier</div>
                    <h2 id="fixtures-title" className="mt-2 text-[20px] font-extrabold tracking-[-0.03em] text-[#F6F8F2] sm:text-2xl">{showingTeamFixtures ? "Prochains matchs" : "Matchs populaires à venir"}</h2>
                    <p className="mt-1.5 text-xs leading-5 text-[#AABDAB]">Sélectionne un match pour remplir automatiquement les équipes.</p>
                  </div>
                  {visibleFixtures.length > 0 && (
                    <span className="rounded-full border border-[#4B6250] bg-[#24352A] px-3 py-1.5 text-xs font-bold text-[#E0ECDE]">{visibleFixtures.length} matchs</span>
                  )}
                </div>

                {loadingVisibleFixtures && <div className="px-4 py-7 text-sm text-[#BCCDBD] sm:px-7">Chargement des matchs...</div>}
                {!loadingVisibleFixtures && visibleFixtures.length === 0 && (
                  <div className="px-4 py-7 text-sm text-[#BCCDBD] sm:px-7">
                    {!showingTeamFixtures && popularFixturesError
                      ? "Suggestions momentanément indisponibles. Tu peux toujours rechercher une équipe."
                      : "Aucun match à venir."}
                  </div>
                )}

                {!loadingVisibleFixtures && visibleFixtures.length > 0 && (
                  <div className="space-y-2 p-2.5 sm:space-y-3 sm:p-4">
                    {visibleFixtures.map((fx, idx) => {
                      const d = new Date(fx.fixture.date);
                      const dd = d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
                      const tt = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
                      const isHomeA = showingTeamFixtures && fx.teams.home.id === fixtureSourceId;
                      /* Ordre domicile/exterieur conserve lors de la selection. */

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setTeamA({
                              id: fx.teams.home.id,
                              name: fx.teams.home.name,
                              logo: fx.teams.home.logo,
                            });
                            setTeamB({
                              id: fx.teams.away.id,
                              name: fx.teams.away.name,
                              logo: fx.teams.away.logo,
                            });
                            // Après sélection, retrouver le calendrier normal de l'équipe domicile.
                            if (!showingTeamFixtures) setFixtureSourceId(fx.teams.home.id);

                            setTimeout(() => {
                              analyzeRef.current?.scrollIntoView({
                                behavior: "smooth",
                                block: "start",
                              });
                            }, 50);
                          }}
                          className="group flex w-full min-w-0 items-center gap-2.5 rounded-[16px] border border-[#34483A] bg-[#101A14] p-3 text-left transition-[background-color,border-color,transform] duration-200 hover:border-[#9DBA79] hover:bg-[#1C2D20] active:scale-[0.995] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9F76B] sm:gap-4 sm:p-4"
                        >
                          <div className="w-[43px] shrink-0 border-r border-[#324337] pr-2.5 text-center sm:w-[66px] sm:pr-4">
                            <div className="text-xs font-extrabold text-[#EAF1E8] sm:text-sm">{dd}</div>
                            <div className="mt-1 text-[10px] text-[#9EB4A1] sm:text-xs">{tt}</div>
                          </div>

                          <div className="min-w-0 flex-1 space-y-2">
                            <div className="flex min-w-0 items-center gap-2">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={fx.teams.home.logo} alt="" className="h-6 w-6 shrink-0 object-contain sm:h-7 sm:w-7" />
                              <span className={["min-w-0 truncate text-[12px] font-bold sm:text-sm", isHomeA ? "text-[#D5FB9D]" : "text-[#E8F0E7]"].join(" ")}>{fx.teams.home.name}</span>
                            </div>
                            <div className="flex min-w-0 items-center gap-2">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={fx.teams.away.logo} alt="" className="h-6 w-6 shrink-0 object-contain sm:h-7 sm:w-7" />
                              <span className={["min-w-0 truncate text-[12px] font-bold sm:text-sm", showingTeamFixtures && !isHomeA ? "text-[#D5FB9D]" : "text-[#E8F0E7]"].join(" ")}>{fx.teams.away.name}</span>
                            </div>
                          </div>

                          <span className="hidden shrink-0 items-center gap-2 rounded-full border border-[#C9F76B]/30 bg-[#C9F76B]/10 px-3 py-2 text-[11px] font-bold text-[#D5FB9D] transition-colors group-hover:bg-[#C9F76B]/20 min-[370px]:inline-flex">
                            Choisir
                            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        <div className="mt-7 border-t border-[#2E4034] pt-5 text-center text-xs leading-6 text-[#8DA490]">
          Les analyses sont fondées sur un modèle statistique et ne garantissent aucun résultat.
        </div>
      </div>
    </div>
  );
}
