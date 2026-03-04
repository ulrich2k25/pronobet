"use client";

import { useState } from "react";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [promoCode, setPromoCode] = useState("Bonnus");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(false);
    setLoading(true);

    // 1) Register (promo obligatoire)
    const regRes = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, promoCode }),
    });

    const regData = await regRes.json().catch(() => ({}));

    if (!regRes.ok) {
      setLoading(false);
      setError(regData.error || "Erreur lors de l'inscription.");
      return;
    }

    // 2) Auto-login (pose le cookie pb_token)
    const loginRes = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!loginRes.ok) {
      const loginData = await loginRes.json().catch(() => ({}));
      setLoading(false);
      setError(loginData.error || "Compte créé, mais connexion impossible. Essaie /login.");
      return;
    }

    setOk(true);
    setLoading(false);

    // 3) Retour au dashboard
    window.location.href = "/";
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#050816] text-white px-4">
      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-6">
        <h1 className="text-2xl font-bold mb-2">Créer un compte</h1>
        <p className="text-white/60 mb-6">
          Inscription gratuite, <span className="text-emerald-200">code promo obligatoire</span>.
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <input
            className="w-full h-12 rounded-xl bg-[#070d16] border border-white/10 px-4 outline-none"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            className="w-full h-12 rounded-xl bg-[#070d16] border border-white/10 px-4 outline-none"
            placeholder="Mot de passe"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <input
            className="w-full h-12 rounded-xl bg-[#070d16] border border-emerald-400/30 px-4 outline-none"
            placeholder="Code promo (obligatoire)"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
          />

          <button
            disabled={loading || !username || !password || !promoCode}
            className="w-full h-12 rounded-xl bg-emerald-500/80 hover:bg-emerald-500 transition font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Création..." : "S'inscrire"}
          </button>

          {error && <div className="text-red-300 text-sm">{error}</div>}
          {ok && <div className="text-emerald-300 text-sm">Compte créé et connecté !</div>}
        </form>

        <div className="mt-4 text-sm text-white/60">
          Déjà un compte ?{" "}
          <a className="text-emerald-200 hover:underline" href="/login">
            Se connecter
          </a>
        </div>
      </div>
    </main>
  );
}
