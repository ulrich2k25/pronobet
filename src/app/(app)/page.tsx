import { Suspense } from "react";
import MatchAnalysis from "@/components/MatchAnalysis";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-white/60">Chargement…</div>}>
      <MatchAnalysis />
    </Suspense>
  );
}