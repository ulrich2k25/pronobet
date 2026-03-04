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
      {/* Bouton menu (mobile seulement) */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-4 left-4 z-[60] rounded-xl border border-white/10 bg-black/40 backdrop-blur px-3 py-2 text-white"
        aria-label="Ouvrir le menu"
      >
        ☰
      </button>

      {/* Overlay */}
      <div
        className={`md:hidden fixed inset-0 z-[55] bg-black/60 transition-opacity ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setOpen(false)}
      />

      {/* Drawer */}
      <aside
        className={`md:hidden fixed top-0 left-0 z-[56] h-dvh w-[86%] max-w-[320px] p-3 transition-transform ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar onNavigate={() => setOpen(false)} />
      </aside>
    </>
  );
}