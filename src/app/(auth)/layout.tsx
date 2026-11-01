import Link from "next/link";
import { ArrowUpRight, BarChart3, ShieldCheck, Target } from "lucide-react";

/**
 * PronoBet — PRONOBET
 * Présentation partagée par Connexion et Inscription.
 * Aucun état, appel API ou comportement d'authentification n'est modifié ici.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative isolate min-h-[100svh] w-full overflow-x-hidden bg-[#070d09] text-[#f6f8f2]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_50%_at_96%_0%,rgba(178,246,101,0.055),transparent_70%),linear-gradient(135deg,#0c1710_0%,#070d09_65%,#050907_100%)]"
      />

      <div className="relative mx-auto grid min-h-[100svh] w-full max-w-[1720px] lg:grid-cols-[minmax(0,1.08fr)_minmax(430px,0.92fr)]">
        {/* Univers de marque : uniquement décoratif, sans dépendance métier. */}
        <aside className="relative hidden min-h-[100svh] flex-col justify-between overflow-hidden border-r border-[#d4ff77]/[0.10] bg-[#0d1b11] px-12 py-11 lg:flex xl:px-16 xl:py-14">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -left-52 -top-64 h-[570px] w-[570px] rounded-full border-[90px] border-[#caff68]/[0.035]" />
            <div className="absolute -bottom-[330px] -right-[270px] h-[830px] w-[830px] rounded-full border-[120px] border-[#caff68]/[0.035]" />
            <div className="absolute bottom-[-70px] right-[-70px] h-[520px] w-[520px] rotate-[-14deg] opacity-[0.16]">
              <svg viewBox="0 0 520 520" className="h-full w-full" fill="none" aria-hidden="true">
                <rect x="37" y="37" width="446" height="446" rx="16" stroke="#B9EB80" strokeWidth="1.5" />
                <line x1="37" y1="260" x2="483" y2="260" stroke="#B9EB80" strokeWidth="1.5" />
                <circle cx="260" cy="260" r="70" stroke="#B9EB80" strokeWidth="1.5" />
                <circle cx="260" cy="260" r="4" fill="#B9EB80" />
                <rect x="157" y="37" width="206" height="79" stroke="#B9EB80" strokeWidth="1.5" />
                <rect x="157" y="404" width="206" height="79" stroke="#B9EB80" strokeWidth="1.5" />
              </svg>
            </div>
            <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_45%,#0d1b11_98%)]" />
          </div>

          <Link href="/" className="relative z-10 inline-flex w-fit items-center gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#cbf876]" aria-label="PronoBet — Accueil">
            <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[14px] border border-white/[0.12] bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/pronobet-logo.png" alt="" className="absolute left-1/2 top-[-13px] h-[83px] w-[83px] max-w-none -translate-x-1/2 object-contain" />
            </span>
            <span className="flex flex-col">
              <span className="text-[18px] font-black leading-none tracking-[-0.045em]">PronoBet</span>
              <span className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.21em] text-[#d0fc82]">Analyse IA</span>
            </span>
          </Link>

          <div className="relative z-10 mt-16 max-w-[660px] pb-10">
            <div className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-[#d4ff77]/20 bg-[#d4ff77]/[0.07] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#d4ff77]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#d4ff77] shadow-[0_0_14px_rgba(212,255,119,0.8)]" />
              Football intelligence
            </div>
            <h2 className="max-w-[650px] text-[clamp(3.6rem,5.9vw,7.5rem)] font-black uppercase leading-[0.93] tracking-[-0.075em] text-[#f5f7ed]">
              Le match<br />
              a ses <span className="text-[#d4ff77]">codes.</span>
              <br />
              <span className="text-[#f5f7ed]/50">Décrypte-</span>
              <br />
              <span className="text-[#f5f7ed]/50">les.</span>
            </h2>
            <p className="mt-8 max-w-[420px] text-[15px] leading-7 text-[#e6eee0]/65 xl:text-base">
              Explore les rencontres, compare les tendances et comprends les probabilités derrière chaque analyse.
            </p>
            <div className="mt-9 h-px max-w-[410px] bg-gradient-to-r from-[#d4ff77]/50 via-[#d4ff77]/[0.13] to-transparent" />
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#c9d8c3]/65">
              <span className="inline-flex items-center gap-2"><Target className="h-4 w-4 text-[#d4ff77]" /> Analyser</span>
              <span className="inline-flex items-center gap-2"><BarChart3 className="h-4 w-4 text-[#d4ff77]" /> Comprendre</span>
              <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#d4ff77]" /> Estimations claires</span>
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between gap-4 border-t border-white/[0.09] pt-6 text-[11px] text-[#d6e4d0]/45">
            <span className="font-bold uppercase tracking-[0.2em]">PronoBet / PRONOBET</span>
            <Link href="/matches" className="inline-flex items-center gap-1.5 font-semibold text-[#d4ff77] transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#cbf876]">
              Explorer les matchs <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </aside>

        <main className="relative min-w-0 px-4 sm:px-8 lg:px-9 xl:px-14">
          <div aria-hidden="true" className="pointer-events-none absolute right-0 top-0 h-64 w-64 bg-[radial-gradient(circle,rgba(191,255,115,0.055),transparent_70%)]" />
          {children}
        </main>
      </div>
    </div>
  );
}
