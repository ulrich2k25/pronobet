import Link from "next/link";
import { notFound } from "next/navigation";

import { getAdminSession } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

type SearchParams = {
  usersPage?: string;
  paymentsPage?: string;
  user?: string;
  payment?: string;
  status?: string;
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

type UserRow = {
  id: string;
  username: string;
  created_at: string;
};

type SubscriptionRow = {
  user_id: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
};

type PaymentRow = {
  id: string;
  user_id: string;
  provider: string;
  external_reference: string;
  provider_transaction_id: string | null;
  amount_xaf: number;
  currency: string;
  status: string;
  created_at: string;
  confirmed_at: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("fr-FR", {
    timeZone: "Africa/Douala",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMoney(amount: number) {
  return `${new Intl.NumberFormat("fr-FR").format(amount)} FCFA`;
}

function getPage(value?: string) {
  const parsed = Number(value);

  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1;
}

function getSubscriptionStatus(subscription?: SubscriptionRow) {
  if (!subscription) {
    return "inactive";
  }

  if (
    subscription.status === "active" &&
    subscription.current_period_start &&
    subscription.current_period_end
  ) {
    const now = Date.now();

    const start = Date.parse(subscription.current_period_start);

    const end = Date.parse(subscription.current_period_end);

    if (
      Number.isFinite(start) &&
      Number.isFinite(end) &&
      start <= now &&
      end > now
    ) {
      return "active";
    }

    return "expired";
  }

  return subscription.status;
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    active: {
      label: "Premium actif",
      className: "border-emerald-400/20 bg-emerald-500/10 text-emerald-300",
    },
    successful: {
      label: "Réussi",
      className: "border-emerald-400/20 bg-emerald-500/10 text-emerald-300",
    },
    pending: {
      label: "En attente",
      className: "border-amber-400/20 bg-amber-500/10 text-amber-300",
    },
    expired: {
      label: "Expiré",
      className: "border-red-400/20 bg-red-500/10 text-red-300",
    },
    failed: {
      label: "Échoué",
      className: "border-red-400/20 bg-red-500/10 text-red-300",
    },
    canceled: {
      label: "Annulé",
      className: "border-white/10 bg-white/5 text-white/50",
    },
    refunded: {
      label: "Remboursé",
      className: "border-purple-400/20 bg-purple-500/10 text-purple-300",
    },
    inactive: {
      label: "Gratuit",
      className: "border-white/10 bg-white/5 text-white/50",
    },
  };

  const item = config[status] ?? {
    label: status,
    className: "border-white/10 bg-white/5 text-white/50",
  };

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold ${item.className}`}
    >
      {item.label}
    </span>
  );
}

function StatCard({
  label,
  value,
  description,
  highlight = false,
}: {
  label: string;
  value: string;
  description: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 sm:p-6 ${
        highlight
          ? "border-emerald-400/20 bg-emerald-500/[0.07]"
          : "border-white/10 bg-white/[0.035]"
      }`}
    >
      <p className="text-sm font-medium text-white/50">{label}</p>

      <p
        className={`mt-4 text-3xl font-extrabold tracking-tight ${
          highlight ? "text-emerald-300" : "text-white"
        }`}
      >
        {value}
      </p>

      <p className="mt-3 text-xs text-white/40">{description}</p>
    </div>
  );
}

function makePageUrl(
  params: SearchParams,
  field: "usersPage" | "paymentsPage",
  page: number,
) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value && key !== field) {
      search.set(key, value);
    }
  }

  search.set(field, String(page));

  return `/admin?${search.toString()}`;
}

function Pagination({
  page,
  total,
  field,
  params,
}: {
  page: number;
  total: number;
  field: "usersPage" | "paymentsPage";
  params: SearchParams;
}) {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 px-5 py-4">
      <p className="text-xs text-white/45">
        Page {page} sur {totalPages}
        {" · "}
        {total} résultat(s)
      </p>

      <div className="flex gap-2">
        {page > 1 ? (
          <Link
            href={makePageUrl(params, field, page - 1)}
            className="rounded-lg border border-white/15 px-4 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/10"
          >
            Précédent
          </Link>
        ) : (
          <span className="rounded-lg border border-white/5 px-4 py-2 text-xs text-white/25">
            Précédent
          </span>
        )}

        {page < totalPages ? (
          <Link
            href={makePageUrl(params, field, page + 1)}
            className="rounded-lg border border-white/15 px-4 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/10"
          >
            Suivant
          </Link>
        ) : (
          <span className="rounded-lg border border-white/5 px-4 py-2 text-xs text-white/25">
            Suivant
          </span>
        )}
      </div>
    </div>
  );
}

async function getTotalRevenue() {
  let total = 0;
  let offset = 0;

  const batchSize = 1000;

  while (true) {
    const { data, error } = await supabaseAdmin
      .from("payments")
      .select("amount_xaf")
      .eq("status", "successful")
      .eq("currency", "XAF")
      .order("created_at", {
        ascending: true,
      })
      .order("id", {
        ascending: true,
      })
      .range(offset, offset + batchSize - 1);

    if (error) {
      throw new Error("REVENUE_LOOKUP_FAILED");
    }

    const rows = data ?? [];

    for (const row of rows) {
      total += row.amount_xaf;
    }

    if (rows.length < batchSize) {
      break;
    }

    offset += batchSize;
  }

  return total;
}

export default async function AdminPage({ searchParams }: PageProps) {
  // 1. Vérifier les droits administrateur.
  const admin = await getAdminSession();

  if (!admin) {
    notFound();
  }

  const params = await searchParams;

  const usersPage = getPage(params.usersPage);
  const paymentsPage = getPage(params.paymentsPage);

  const userSearch = (params.user ?? "").trim().slice(0, 100);

  const paymentSearch = (params.payment ?? "").trim().slice(0, 100);

  const allowedStatuses = [
    "pending",
    "successful",
    "failed",
    "canceled",
    "refunded",
  ];

  const statusFilter =
    params.status && allowedStatuses.includes(params.status)
      ? params.status
      : "";

  const nowISO = new Date().toISOString();

  // 2. Construire les requêtes.
  let usersQuery = supabaseAdmin
    .from("users")
    .select("id,username,created_at", {
      count: "exact",
    })
    .order("created_at", {
      ascending: false,
    })
    .range((usersPage - 1) * PAGE_SIZE, usersPage * PAGE_SIZE - 1);

  if (userSearch) {
    usersQuery = usersQuery.ilike("username", `%${userSearch}%`);
  }

  let paymentsQuery = supabaseAdmin
    .from("payments")
    .select(
      "id,user_id,provider,external_reference,provider_transaction_id,amount_xaf,currency,status,created_at,confirmed_at",
      { count: "exact" },
    )
    .order("created_at", {
      ascending: false,
    })
    .range((paymentsPage - 1) * PAGE_SIZE, paymentsPage * PAGE_SIZE - 1);

  if (paymentSearch) {
    paymentsQuery = paymentsQuery.ilike(
      "external_reference",
      `%${paymentSearch}%`,
    );
  }

  if (statusFilter) {
    paymentsQuery = paymentsQuery.eq("status", statusFilter);
  }

  // 3. Récupérer les statistiques et tableaux.
  const [
    totalUsersResult,
    activeSubscriptionsResult,
    successfulPaymentsResult,
    pendingPaymentsResult,
    usersResult,
    paymentsResult,
    revenueResult,
  ] = await Promise.all([
    supabaseAdmin.from("users").select("id", {
      count: "exact",
      head: true,
    }),

    supabaseAdmin
      .from("subscriptions")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("status", "active")
      .lte("current_period_start", nowISO)
      .gt("current_period_end", nowISO),

    supabaseAdmin
      .from("payments")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("status", "successful"),

    supabaseAdmin
      .from("payments")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("status", "pending"),

    usersQuery,
    paymentsQuery,

    getTotalRevenue().then(
      (value) => ({
        value,
        error: null,
      }),
      () => ({
        value: 0,
        error: "REVENUE_LOOKUP_FAILED",
      }),
    ),
  ]);

  const hasError =
    totalUsersResult.error ||
    activeSubscriptionsResult.error ||
    successfulPaymentsResult.error ||
    pendingPaymentsResult.error ||
    usersResult.error ||
    paymentsResult.error ||
    revenueResult.error;

  if (hasError) {
    console.error("Admin dashboard data loading failed:", hasError);

    return (
      <main className="flex min-h-screen items-center justify-center bg-[#07110f] px-5 text-white">
        <div className="w-full max-w-lg rounded-2xl border border-red-400/20 bg-red-500/5 p-8 text-center">
          <h1 className="text-xl font-bold">Administration indisponible</h1>

          <p className="mt-4 text-sm leading-6 text-white/55">
            Impossible de récupérer les informations administratives pour le
            moment.
          </p>

          <Link
            href="/admin"
            className="mt-6 inline-flex rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-[#04150f]"
          >
            Réessayer
          </Link>
        </div>
      </main>
    );
  }

  const users = (usersResult.data ?? []) as UserRow[];

  const payments = (paymentsResult.data ?? []) as PaymentRow[];

  // 4. Associer les abonnements aux utilisateurs.
  const userIds = users.map((user) => user.id);

  const { data: subscriptions, error: subsError } =
    userIds.length > 0
      ? await supabaseAdmin
          .from("subscriptions")
          .select("user_id,status,current_period_start,current_period_end")
          .in("user_id", userIds)
      : { data: [], error: null };

  if (subsError) {
    console.error("Admin subscription lookup failed:", subsError.message);
  }

  const subscriptionMap = new Map(
    ((subscriptions ?? []) as SubscriptionRow[]).map((subscription) => [
      subscription.user_id,
      subscription,
    ]),
  );

  // 5. Récupérer les usernames des payeurs.
  const paymentUserIds = [
    ...new Set(payments.map((payment) => payment.user_id)),
  ];

  const { data: paymentUsers, error: paymentUsersError } =
    paymentUserIds.length > 0
      ? await supabaseAdmin
          .from("users")
          .select("id,username")
          .in("id", paymentUserIds)
      : { data: [], error: null };

  if (paymentUsersError) {
    console.error(
      "Admin payment users lookup failed:",
      paymentUsersError.message,
    );
  }

  const usernameMap = new Map(
    (paymentUsers ?? []).map((user) => [user.id, user.username]),
  );

  const totalUsers = totalUsersResult.count ?? 0;

  const activeSubscriptions = activeSubscriptionsResult.count ?? 0;

  const successfulPayments = successfulPaymentsResult.count ?? 0;

  const pendingPayments = pendingPaymentsResult.count ?? 0;

  const totalRevenue = revenueResult.value;

  return (
    <main className="min-h-screen bg-[#07110f] text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0b1714]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-5 px-5 py-6 sm:px-8">
          <div>
            <div className="text-xs font-extrabold uppercase tracking-[0.25em] text-emerald-400">
              PronoBet
            </div>

            <h1 className="mt-2 text-xl font-extrabold tracking-tight sm:text-2xl">
              Administration
            </h1>

            <p className="mt-1 text-xs text-white/40">
              Tableau de bord administrateur
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-300">
              Admin · {admin.username}
            </span>

            <Link
              href="/matches"
              className="rounded-xl border border-white/15 px-4 py-2.5 text-xs font-semibold text-white/75 transition hover:bg-white/10"
            >
              Retour au site
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-9 px-5 py-9 sm:px-8">
        {/* Introduction */}
        <section>
          <div className="inline-flex rounded-full border border-emerald-400/15 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-300">
            Vue d&apos;ensemble
          </div>

          <h2 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Tableau de bord
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">
            Suivez les inscriptions, les abonnements Premium et les transactions
            de PronoBet depuis un seul espace.
          </p>
        </section>

        {/* Statistiques */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Utilisateurs inscrits"
            value={totalUsers.toLocaleString("fr-FR")}
            description="Nombre total de comptes créés"
          />

          <StatCard
            label="Abonnements Premium actifs"
            value={activeSubscriptions.toLocaleString("fr-FR")}
            description="Accès Premium actuellement valides"
            highlight
          />

          <StatCard
            label="Revenus confirmés"
            value={formatMoney(totalRevenue)}
            description="Total brut des paiements réussis en XAF"
            highlight
          />

          <StatCard
            label="Paiements réussis"
            value={successfulPayments.toLocaleString("fr-FR")}
            description="Transactions enregistrées comme réussies"
          />

          <StatCard
            label="Paiements en attente"
            value={pendingPayments.toLocaleString("fr-FR")}
            description="Transactions non encore confirmées"
          />

          <StatCard
            label="Taux de conversion Premium"
            value={
              totalUsers > 0
                ? `${((activeSubscriptions / totalUsers) * 100).toFixed(1)} %`
                : "0 %"
            }
            description="Part des inscrits disposant de Premium"
          />
        </section>

        {/* Utilisateurs */}
        <section
          id="utilisateurs"
          className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]"
        >
          <div className="border-b border-white/10 p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold">Utilisateurs</h2>

                <p className="mt-2 text-sm text-white/45">
                  Comptes enregistrés sur PronoBet
                </p>
              </div>

              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/70">
                {usersResult.count ?? 0} résultat(s)
              </span>
            </div>

            <form
              action="/admin"
              method="GET"
              className="mt-5 flex flex-col gap-3 sm:flex-row"
            >
              <input
                type="search"
                name="user"
                defaultValue={userSearch}
                placeholder="Rechercher un username..."
                maxLength={100}
                className="min-h-11 flex-1 rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-emerald-400/40"
              />

              {paymentSearch && (
                <input type="hidden" name="payment" value={paymentSearch} />
              )}

              {statusFilter && (
                <input type="hidden" name="status" value={statusFilter} />
              )}

              <button
                type="submit"
                className="min-h-11 rounded-xl bg-emerald-500 px-6 text-sm font-bold text-[#04150f] transition hover:bg-emerald-400"
              >
                Rechercher
              </button>
            </form>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-left">
              <thead className="border-b border-white/10 bg-white/[0.025] text-xs uppercase tracking-wider text-white/40">
                <tr>
                  <th className="px-5 py-4 font-semibold">Utilisateur</th>

                  <th className="px-5 py-4 font-semibold">Inscription</th>

                  <th className="px-5 py-4 font-semibold">Abonnement</th>

                  <th className="px-5 py-4 font-semibold">Expiration</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/[0.06]">
                {users.map((user) => {
                  const subscription = subscriptionMap.get(user.id);

                  const status = subsError
                    ? null
                    : getSubscriptionStatus(subscription);

                  return (
                    <tr
                      key={user.id}
                      className="transition hover:bg-white/[0.035]"
                    >
                      <td className="px-5 py-4">
                        <p className="text-sm font-bold text-white">
                          {user.username}
                        </p>

                        <p className="mt-1 font-mono text-[11px] text-white/30">
                          {user.id.slice(0, 8)}...
                        </p>
                      </td>

                      <td className="px-5 py-4 text-sm text-white/60">
                        {formatDate(user.created_at)}
                      </td>

                      <td className="px-5 py-4">
                        {status ? (
                          <StatusBadge status={status} />
                        ) : (
                          <span className="text-xs text-white/40">
                            Indisponible
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm text-white/55">
                        {formatDate(subscription?.current_period_end ?? null)}
                      </td>
                    </tr>
                  );
                })}

                {users.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-12 text-center text-sm text-white/40"
                    >
                      Aucun utilisateur trouvé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            page={usersPage}
            total={usersResult.count ?? 0}
            field="usersPage"
            params={params}
          />
        </section>

        {/* Transactions */}
        <section
          id="transactions"
          className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]"
        >
          <div className="border-b border-white/10 p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold">Transactions</h2>

                <p className="mt-2 text-sm text-white/45">
                  Historique des paiements PronoBet
                </p>
              </div>

              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/70">
                {paymentsResult.count ?? 0} résultat(s)
              </span>
            </div>

            <form
              action="/admin"
              method="GET"
              className="mt-5 flex flex-col gap-3 sm:flex-row"
            >
              {userSearch && (
                <input type="hidden" name="user" value={userSearch} />
              )}

              <input
                type="search"
                name="payment"
                defaultValue={paymentSearch}
                placeholder="Référence de transaction..."
                maxLength={100}
                className="min-h-11 flex-1 rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-emerald-400/40"
              />

              <select
                name="status"
                defaultValue={statusFilter}
                className="min-h-11 rounded-xl border border-white/10 bg-[#101c18] px-4 text-sm text-white outline-none focus:border-emerald-400/40"
              >
                <option value="">Tous les statuts</option>
                <option value="successful">Réussi</option>
                <option value="pending">En attente</option>
                <option value="failed">Échoué</option>
                <option value="canceled">Annulé</option>
                <option value="refunded">Remboursé</option>
              </select>

              <button
                type="submit"
                className="min-h-11 rounded-xl bg-emerald-500 px-6 text-sm font-bold text-[#04150f] transition hover:bg-emerald-400"
              >
                Filtrer
              </button>
            </form>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-left">
              <thead className="border-b border-white/10 bg-white/[0.025] text-xs uppercase tracking-wider text-white/40">
                <tr>
                  <th className="px-5 py-4 font-semibold">Utilisateur</th>

                  <th className="px-5 py-4 font-semibold">Référence</th>

                  <th className="px-5 py-4 font-semibold">Montant</th>

                  <th className="px-5 py-4 font-semibold">Fournisseur</th>

                  <th className="px-5 py-4 font-semibold">Statut</th>

                  <th className="px-5 py-4 font-semibold">Date</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/[0.06]">
                {payments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="transition hover:bg-white/[0.035]"
                  >
                    <td className="px-5 py-4 text-sm font-semibold text-white">
                      {paymentUsersError
                        ? "Indisponible"
                        : (usernameMap.get(payment.user_id) ??
                          "Utilisateur inconnu")}
                    </td>

                    <td className="px-5 py-4">
                      <p
                        title={payment.external_reference}
                        className="max-w-[180px] truncate font-mono text-xs text-white/65"
                      >
                        {payment.external_reference}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-sm font-bold text-white">
                      {payment.amount_xaf.toLocaleString("fr-FR")}{" "}
                      {payment.currency}
                    </td>

                    <td className="px-5 py-4 text-sm capitalize text-white/60">
                      {payment.provider}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={payment.status} />
                    </td>

                    <td className="px-5 py-4 text-sm text-white/55">
                      {formatDate(payment.created_at)}
                    </td>
                  </tr>
                ))}

                {payments.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-12 text-center text-sm text-white/40"
                    >
                      Aucune transaction trouvée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            page={paymentsPage}
            total={paymentsResult.count ?? 0}
            field="paymentsPage"
            params={params}
          />
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 py-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs text-white/35">
              © PronoBet — Administration
            </p>

            <p className="text-xs text-white/35">
              Données actualisées à chaque chargement. Heures affichées :
              Cameroun.
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}
