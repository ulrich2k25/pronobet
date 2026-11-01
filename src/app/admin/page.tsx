import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminSession } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createPromoCode, togglePromoCode } from "./actions";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 20;

type SearchParams = { page?: string; user?: string; success?: string; error?: string };
type Props = { searchParams: Promise<SearchParams> };
type User = { id: string; username: string; created_at: string };
type Promo = { code: string; is_active: boolean; max_uses: number | null; uses_count: number; created_at: string };

function date(value: string) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("fr-FR", { timeZone: "Africa/Douala", dateStyle: "medium" });
}
function url(page: number, user: string) {
  const params = new URLSearchParams({ page: String(page) });
  if (user) params.set("user", user);
  return `/admin?${params}`;
}

export default async function AdminPage({ searchParams }: Props) {
  const admin = await getAdminSession();
  if (!admin) notFound();
  const params = await searchParams;
  const requestedPage = Number(params.page);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const search = (params.user ?? "").trim().slice(0, 100);
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
  const week = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  let usersQuery = supabaseAdmin.from("users")
    .select("id,username,created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (search) usersQuery = usersQuery.ilike("username", `%${search.replace(/[%_]/g, "\\$&")}%`);

  const [total, todayCount, weekCount, usersResult, promosResult] = await Promise.all([
    supabaseAdmin.from("users").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("users").select("id", { count: "exact", head: true }).gte("created_at", today),
    supabaseAdmin.from("users").select("id", { count: "exact", head: true }).gte("created_at", week),
    usersQuery,
    supabaseAdmin.from("promo_codes").select("code,is_active,max_uses,uses_count,created_at").order("created_at", { ascending: false }),
  ]);
  const hasError = [total, todayCount, weekCount, usersResult, promosResult].some((r) => r.error);
  if (hasError) {
    console.error("PronoBet admin: erreur de chargement des données");
    return <main className="min-h-screen bg-[#07110f] p-8 text-white">Impossible de charger l'administration. <Link href="/admin" className="text-lime-300 underline">Réessayer</Link></main>;
  }
  const users = (usersResult.data ?? []) as User[];
  const promos = (promosResult.data ?? []) as Promo[];
  const totalPages = Math.max(1, Math.ceil((usersResult.count ?? 0) / PAGE_SIZE));
  const stats = [
    ["Utilisateurs inscrits", total.count ?? 0],
    ["Inscriptions aujourd'hui (UTC)", todayCount.count ?? 0],
    ["Inscriptions sur 7 jours", weekCount.count ?? 0],
  ] as const;

  return <main className="min-h-screen bg-[#07110f] px-4 py-8 text-white sm:px-8">
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div><p className="text-xs font-bold uppercase tracking-[.25em] text-lime-300">PronoBet</p><h1 className="mt-2 text-3xl font-extrabold">Administration</h1><p className="mt-2 text-sm text-white/50">Connecté : {admin.username}</p></div>
        <Link href="/matches" className="rounded-xl border border-white/20 px-4 py-2 text-sm hover:bg-white/10">Retour au site</Link>
      </header>
      {(params.success || params.error) && <p role="status" className={`rounded-xl border p-4 text-sm ${params.error ? "border-red-400/30 bg-red-500/10 text-red-200" : "border-lime-400/30 bg-lime-500/10 text-lime-200"}`}>{params.error || params.success}</p>}
      <section aria-label="Statistiques" className="grid gap-4 sm:grid-cols-3">{stats.map(([label, value]) => <div key={label} className="rounded-2xl border border-white/10 bg-white/[.035] p-6"><p className="text-sm text-white/55">{label}</p><p className="mt-3 text-3xl font-extrabold text-lime-300">{value.toLocaleString("fr-FR")}</p></div>)}</section>
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[.025]">
        <div className="border-b border-white/10 p-5"><h2 className="text-xl font-bold">Utilisateurs</h2><form action="/admin" method="get" className="mt-4 flex flex-wrap gap-3"><input name="user" type="search" defaultValue={search} maxLength={100} placeholder="Rechercher un utilisateur" className="min-w-0 flex-1 rounded-xl border border-white/15 bg-black/20 px-4 py-3 text-sm text-white"/><button className="rounded-xl bg-lime-300 px-5 py-3 text-sm font-bold text-[#07110f]">Rechercher</button></form></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[450px] text-left text-sm"><thead className="bg-white/5 text-white/50"><tr><th className="p-4">Utilisateur</th><th className="p-4">Inscription</th></tr></thead><tbody className="divide-y divide-white/10">{users.map(u => <tr key={u.id}><td className="p-4 font-medium">{u.username}</td><td className="p-4 text-white/60">{date(u.created_at)}</td></tr>)}{users.length === 0 && <tr><td colSpan={2} className="p-6 text-center text-white/50">Aucun utilisateur trouvé.</td></tr>}</tbody></table></div>
        <div className="flex items-center justify-between gap-3 border-t border-white/10 p-4 text-sm"><span>Page {page} / {totalPages}</span><div className="flex gap-2">{page > 1 && <Link className="rounded-lg border border-white/20 px-3 py-2" href={url(page-1,search)}>Précédent</Link>}{page < totalPages && <Link className="rounded-lg border border-white/20 px-3 py-2" href={url(page+1,search)}>Suivant</Link>}</div></div>
      </section>
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[.025]">
        <div className="p-5"><h2 className="text-xl font-bold">Codes promo</h2><p className="mt-2 text-sm text-white/50">Un code actif peut être utilisé dans la limite définie. Attention : l'API d'inscription doit encore être adaptée pour accepter les codes autres que BONNUS.</p>
          <form action={createPromoCode} className="mt-5 flex flex-wrap items-end gap-3"><label className="flex min-w-[170px] flex-1 flex-col gap-2 text-xs text-white/65">Nouveau code<input required name="code" minLength={3} maxLength={30} pattern="[A-Za-z0-9_-]{3,30}" placeholder="EXEMPLE2026" className="rounded-xl border border-white/15 bg-black/20 px-4 py-3 text-sm uppercase text-white"/></label><label className="flex min-w-[150px] flex-1 flex-col gap-2 text-xs text-white/65">Utilisations maximales (vide = illimité)<input name="max_uses" type="number" min={1} step={1} placeholder="Illimité" className="rounded-xl border border-white/15 bg-black/20 px-4 py-3 text-sm text-white"/></label><button className="rounded-xl bg-lime-300 px-5 py-3 text-sm font-bold text-[#07110f]">Créer le code</button></form>
        </div>
        <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-white/5 text-white/50"><tr><th className="p-4">Code</th><th className="p-4">Utilisations</th><th className="p-4">Statut</th><th className="p-4">Action</th></tr></thead><tbody className="divide-y divide-white/10">{promos.map(p => <tr key={p.code}><td className="p-4 font-bold">{p.code}</td><td className="p-4 text-white/70">{p.uses_count} / {p.max_uses ?? "∞"}</td><td className="p-4">{p.is_active ? <span className="text-lime-300">Actif</span> : <span className="text-white/50">Inactif</span>}</td><td className="p-4"><form action={togglePromoCode}><input type="hidden" name="code" value={p.code}/><input type="hidden" name="next" value={String(!p.is_active)}/><button className="rounded-lg border border-white/20 px-3 py-2 hover:bg-white/10">{p.is_active ? "Désactiver" : "Activer"}</button></form></td></tr>)}{promos.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-white/50">Aucun code promo.</td></tr>}</tbody></table></div>
      </section>
    </div>
  </main>;
}
