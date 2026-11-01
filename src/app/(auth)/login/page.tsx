"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Lock, User } from "lucide-react";

// Logique de validation de la destination conservée à l'identique.
function safeReturnPath(value: string | null): string {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\u0000-\u001F\u007F]/.test(value)
  ) {
    return "/";
  }

  const url = new URL(value, window.location.origin);

  if (
    url.origin !== window.location.origin ||
    url.pathname === "/login" ||
    url.pathname === "/register"
  ) {
    return "/";
  }

  return url.pathname + url.search + url.hash;
}

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  // Authentification, priorité administrateur et paramètre next préservés.
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError(null);
    setOk(false);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Erreur de connexion.");
      return;
    }

    setOk(true);
    const data = await res.json();

    if (data.isAdmin === true) {
      router.replace("/admin");
      return;
    }

    const next = new URLSearchParams(window.location.search).get("next");
    router.replace(next ? safeReturnPath(next) : "/matches");
  }

  return (
    <div className="relative mx-auto flex min-h-[100svh] w-full max-w-[470px] flex-col py-6 sm:py-9 lg:py-11">
      <header className="flex items-center justify-between gap-3">
        <Link href="/" className="inline-flex min-w-0 items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d4ff77] lg:hidden" aria-label="PronoBet — Accueil">
          <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-white/15 bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/pronobet-logo.png" alt="" className="absolute left-1/2 top-[-12px] h-[77px] w-[77px] max-w-none -translate-x-1/2 object-contain" />
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="text-[16px] font-black leading-none tracking-[-0.045em]">PronoBet</span>
            <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#d4ff77]">Analyse IA</span>
          </span>
        </Link>
        <Link href="/" className="ml-auto inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-full border border-white/[0.12] bg-white/[0.035] px-3.5 text-xs font-semibold text-[#e7eee1]/75 transition hover:border-[#d4ff77]/30 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4ff77] sm:px-4">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Accueil
        </Link>
      </header>

      <div className="flex flex-1 items-center py-9 sm:py-12">
        <div className="w-full">
          <div className="mb-7 sm:mb-9">
            <div className="mb-5 inline-flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.22em] text-[#d4ff77]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#d4ff77] shadow-[0_0_14px_rgba(212,255,119,0.65)]" />
              Ton espace de jeu
            </div>
            <h1 className="text-[clamp(2.45rem,8vw,4.3rem)] font-black leading-[0.98] tracking-[-0.065em] text-[#f8faef]">
              Bon retour<span className="text-[#d4ff77]">.</span>
            </h1>
            <p className="mt-4 max-w-[380px] text-[14px] leading-[1.75] text-[#d5dfd0]/65 sm:text-[15px]">
              Connecte-toi pour lancer une analyse et retrouver ton espace PronoBet.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-[26px] border border-white/[0.10] bg-[#142018]/85 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.30)] sm:rounded-[30px] sm:p-8">
            <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d4ff77]/45 to-transparent" />
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#d4ff77]/80">Espace membre</p>
                <h2 className="mt-1.5 text-xl font-bold tracking-[-0.03em] text-white">Se connecter</h2>
              </div>
              <span className="rounded-full border border-[#d4ff77]/20 bg-[#d4ff77]/[0.08] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#d4ff77]">Accès</span>
            </div>

            <form onSubmit={onSubmit} className="space-y-5">
              <div>
                <label htmlFor="username" className="mb-2.5 block text-[13px] font-semibold text-[#edf5e7]/90">Nom d&apos;utilisateur</label>
                <div className="relative">
                  <User aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#d4ff77]/65" />
                  <input
                    id="username"
                    autoComplete="username"
                    className="min-h-[54px] w-full rounded-[14px] border border-white/[0.12] bg-[#090f0b]/75 py-3 pl-12 pr-4 text-[16px] text-white outline-none transition placeholder:text-[#c0ccbb]/35 hover:border-white/20 focus:border-[#d4ff77]/65 focus:bg-[#0a130d] focus:ring-[3px] focus:ring-[#d4ff77]/10"
                    placeholder="Ton nom d'utilisateur"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="mb-2.5 block text-[13px] font-semibold text-[#edf5e7]/90">Mot de passe</label>
                <div className="relative">
                  <Lock aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#d4ff77]/65" />
                  <input
                    id="password"
                    autoComplete="current-password"
                    className="min-h-[54px] w-full rounded-[14px] border border-white/[0.12] bg-[#090f0b]/75 py-3 pl-12 pr-14 text-[16px] text-white outline-none transition placeholder:text-[#c0ccbb]/35 hover:border-white/20 focus:border-[#d4ff77]/65 focus:bg-[#0a130d] focus:ring-[3px] focus:ring-[#d4ff77]/10"
                    placeholder="Ton mot de passe"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    aria-pressed={showPassword}
                    title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    className="absolute right-1.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-[12px] text-[#d6e5ce]/65 transition hover:bg-white/[0.07] hover:text-[#d4ff77] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4ff77]"
                  >
                    {showPassword ? (
                      <EyeOff aria-hidden="true" className="h-5 w-5" />
                    ) : (
                      <Eye aria-hidden="true" className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div role="alert" className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-[13px] leading-5 text-red-200">{error}</div>
              )}
              {ok && (
                <div role="status" className="rounded-xl border border-[#d4ff77]/20 bg-[#d4ff77]/10 px-4 py-3 text-[13px] text-[#e1ffa9]">Connexion réussie…</div>
              )}

              <button type="submit" className="group mt-1 flex min-h-[56px] w-full items-center justify-between gap-3 rounded-[14px] bg-[#d4ff77] px-5 text-[15px] font-extrabold text-[#111b0b] shadow-[0_12px_30px_rgba(165,218,82,0.15)] transition duration-200 hover:bg-[#e5ffad] hover:shadow-[0_14px_36px_rgba(165,218,82,0.24)] active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d4ff77]">
                <span>Se connecter</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#10200e]/[0.10] transition group-hover:translate-x-0.5" aria-hidden="true"><ArrowRight className="h-4 w-4" /></span>
              </button>
            </form>

            <div className="mt-7 border-t border-white/[0.10] pt-6 text-center">
              <p className="text-[13px] text-[#d8e3d1]/60">Tu n&apos;as pas encore de compte ?</p>
              <Link
                href="/register"
                onClick={(event) => {
                  const next = new URLSearchParams(window.location.search).get("next");
                  if (next) {
                    event.preventDefault();
                    router.push(`/register?next=${encodeURIComponent(safeReturnPath(next))}`);
                  }
                }}
                className="mt-3 inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#d4ff77]/25 bg-[#d4ff77]/[0.07] px-5 text-[13px] font-bold text-[#e6ffa8] transition hover:border-[#d4ff77]/45 hover:bg-[#d4ff77]/[0.12] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4ff77]"
              >
                Créer un compte <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <p className="mx-auto max-w-[370px] text-center text-[11px] leading-5 text-[#c6d6bf]/40">
        Les analyses reposent sur des estimations statistiques et ne garantissent aucun résultat.
      </p>
    </div>
  );
}
