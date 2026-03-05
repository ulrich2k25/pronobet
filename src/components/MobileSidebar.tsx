"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";

export default function MobileSidebar() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      {/* ✅ Bouton menu premium (mobile only) */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ouvrir le menu"
        className="
          md:hidden fixed top-4 left-4 z-[60]
          h-11 w-11 rounded-2xl
          bg-black/60 backdrop-blur
          border border-white/15
          shadow-[0_10px_30px_rgba(0,0,0,0.45)]
          flex items-center justify-center
          active:scale-95 transition
        "
      >
        <span className="text-white text-xl leading-none">☰</span>
      </button>

      {/* ✅ Overlay (plus doux + blur) */}
      <div
        className={`md:hidden fixed inset-0 z-[55] bg-black/60 backdrop-blur-sm transition-opacity ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setOpen(false)}
      />

      {/* ✅ Drawer + header (fermer) */}
      <aside
        className={`md:hidden fixed top-0 left-0 z-[56] h-dvh w-[86%] max-w-[340px]
          border-r border-white/10 bg-[#0b1220]/95 backdrop-blur
          shadow-[20px_0_60px_rgba(0,0,0,0.6)]
          transition-transform ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Header du drawer */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
          <div className="text-white/90 font-semibold">Menu</div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Fermer le menu"
            className="h-9 w-9 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition flex items-center justify-center"
          >
            <span className="text-white/80 text-lg leading-none">✕</span>
          </button>
        </div>

        {/* Contenu sidebar */}
        <div className="p-3">
          <Sidebar onNavigate={() => setOpen(false)} />
        </div>
      </aside>
    </>
  );
}