"use client";

import { useState } from "react";

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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
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
    <main className="min-h-screen flex items-center justify-center bg-[#050816] text-white px-4">
      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-6">
        <h1 className="text-2xl font-bold mb-2">Connexion</h1>
        <p className="text-white/60 mb-6">Connecte-toi pour accéder à Pronobet.</p>

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

          <button className="w-full h-12 rounded-xl bg-emerald-500/80 hover:bg-emerald-500 transition font-semibold">
            Se connecter
          </button>

          {error && <div className="text-red-300 text-sm">{error}</div>}
          {ok && <div className="text-emerald-300 text-sm">Connecté !</div>}
        </form>

        <div className="mt-4 text-sm text-white/60">
          Pas de compte ?{" "}
          <a className="text-emerald-200 hover:underline" href="/register">
            Créer un compte (code promo requis)
          </a>
        </div>
      </div>
    </main>
  );
}
