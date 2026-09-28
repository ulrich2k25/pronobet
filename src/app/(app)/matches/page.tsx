import { Suspense } from "react";
import MatchAnalysis from "@/components/MatchAnalysis";

export default function Page() {
  return (
    <div className="relative w-full">
      {/* Glow arrière-plan */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 left-0 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl md:left-10 md:h-72 md:w-72 md:bg-emerald-500/15" />
        <div className="absolute top-20 right-0 h-56 w-56 rounded-full bg-sky-400/[0.07] blur-3xl md:right-10 md:h-72 md:w-72" />
        <div className="absolute bottom-0 left-1/2 hidden h-72 w-[38rem] -translate-x-1/2 rounded-full bg-sky-400/10 blur-3xl md:block" />
      </div>

      <div className="mx-auto w-full max-w-[980px]">
        {/* Mobile : pas de grosse carte extérieure.
            Desktop : on conserve le container premium. */}
        <div className="md:rounded-[28px] md:border md:border-white/10 md:bg-white/5 md:p-8 md:backdrop-blur-xl md:shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_40px_120px_rgba(0,0,0,0.55)]">
          <Suspense
            fallback={
              <div className="py-10 text-center text-sm text-white/50">
                Chargement…
              </div>
            }
          >
            <MatchAnalysis />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
