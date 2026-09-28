"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("user1");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

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
    window.location.href = "/";
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050816] px-4 py-6 text-white sm:px-6">
      {/* Glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -right-32 top-1/3 h-72 w-72 rounded-full bg-sky-500/[0.07] blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-48px)] w-full max-w-md flex-col">
        {/* Logo */}
        <div className="flex justify-center pt-2 sm:pt-5">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-500/10">
              <Sparkles className="h-4 w-4 text-emerald-300" />
            </div>

            <div>
              <div className="text-lg font-extrabold leading-none tracking-tight">
                PronoBet
              </div>

              <div className="mt-1 text-[10px] font-medium text-white/35">
                Analyse IA de matchs
              </div>
            </div>
          </Link>
        </div>

        {/* Formulaire */}
        <div className="flex flex-1 items-center py-8">
          <div className="w-full">
            {/* Intro */}
            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-semibold text-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Ton espace PronoBet
              </div>

              <h1 className="text-[30px] font-extrabold tracking-tight text-white sm:text-3xl">
                Connexion
              </h1>

              <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-white/45">
                Connecte-toi pour accéder aux analyses et à toutes les
                fonctionnalités.
              </p>
            </div>

            {/* Card */}
            <div className="rounded-[24px] border border-white/10 bg-white/[0.045] p-4 shadow-[0_25px_70px_rgba(0,0,0,0.25)] backdrop-blur-xl sm:p-6">
              <form onSubmit={onSubmit} className="space-y-4">
                {/* Username */}
                <div>
                  <label
                    htmlFor="username"
                    className="mb-2 block text-[11px] font-semibold text-white/50"
                  >
                    Nom d&apos;utilisateur
                  </label>

                  <input
                    id="username"
                    className="
                      min-h-[52px]
                      w-full
                      rounded-xl
                      border border-white/10
                      bg-black/20
                      px-4
                      text-sm
                      text-white
                      outline-none
                      transition
                      placeholder:text-white/25
                      focus:border-emerald-400/30
                      focus:bg-black/25
                    "
                    placeholder="Ton nom d'utilisateur"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-[11px] font-semibold text-white/50"
                  >
                    Mot de passe
                  </label>

                  <input
                    id="password"
                    className="
                      min-h-[52px]
                      w-full
                      rounded-xl
                      border border-white/10
                      bg-black/20
                      px-4
                      text-sm
                      text-white
                      outline-none
                      transition
                      placeholder:text-white/25
                      focus:border-emerald-400/30
                      focus:bg-black/25
                    "
                    placeholder="Ton mot de passe"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                {/* Erreur */}
                {error && (
                  <div className="rounded-xl border border-red-400/15 bg-red-500/10 px-4 py-3 text-xs leading-5 text-red-200">
                    {error}
                  </div>
                )}

                {/* Succès */}
                {ok && (
                  <div className="rounded-xl border border-emerald-400/15 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-200">
                    Connexion réussie…
                  </div>
                )}

                {/* CTA */}
                <button
                  type="submit"
                  className="
                    flex
                    min-h-[52px]
                    w-full
                    items-center
                    justify-center
                    rounded-xl
                    bg-emerald-500
                    px-5
                    text-sm
                    font-bold
                    text-[#04150f]
                    shadow-[0_12px_30px_rgba(16,185,129,0.15)]
                    transition
                    hover:bg-emerald-400
                    active:scale-[0.99]
                  "
                >
                  Se connecter
                </button>
              </form>

              {/* Register */}
              <div className="mt-5 border-t border-white/[0.07] pt-5 text-center">
                <p className="text-xs text-white/40">Pas encore de compte ?</p>

                <Link
                  href="/register"
                  className="mt-2 inline-flex min-h-[42px] items-center justify-center rounded-xl border border-white/10 bg-white/[0.035] px-4 text-xs font-semibold text-white/70 transition hover:bg-white/[0.07] hover:text-white"
                >
                  Créer un compte
                </Link>

                <div className="mt-2 text-[10px] text-white/25">
                  Code promo requis
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pb-2 text-center text-[10px] leading-4 text-white/25">
          Les analyses sont basées sur un modèle statistique et ne garantissent
          aucun résultat.
        </div>
      </div>
    </main>
  );
}
