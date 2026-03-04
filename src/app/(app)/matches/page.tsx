"use client";

import MatchAnalysis from "@/components/MatchAnalysis";

export default function Page() {
  return (
    <div className="relative">
      {/* Glow arrière-plan */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 left-10 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="absolute top-10 right-10 h-72 w-72 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-72 w-[38rem] -translate-x-1/2 rounded-full bg-sky-400/10 blur-3xl" />
      </div>

      {/* Container responsive premium */}
      <div className="mx-auto w-full max-w-[980px] px-2 sm:px-4 md:px-6">
        <div className="rounded-[28px] border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_40px_120px_rgba(0,0,0,0.55)]">
          <div className="p-4 sm:p-6 md:p-8">
            <MatchAnalysis />
          </div>
        </div>

        {/* petit texte discret en bas */}
        <div className="mt-6 text-center text-xs text-white/45">
          Les analyses sont basées sur un modèle statistique.
        </div>
      </div>
    </div>
  );
}