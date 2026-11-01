import { Suspense } from "react";
import MatchAnalysis from "@/components/MatchAnalysis";

export default function Page() {
  return (
    <div className="relative min-w-0 w-full">
      <Suspense
        fallback={
          <div
            role="status"
            className="mx-auto w-full max-w-[900px] rounded-3xl border border-white/10 bg-white/[0.025] px-5 py-12 text-center text-sm text-white/60"
          >
            Chargement…
          </div>
        }
      >
        <MatchAnalysis />
      </Suspense>
    </div>
  );
}
