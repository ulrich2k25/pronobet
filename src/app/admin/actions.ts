"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/adminAuth";
import { getDb } from "@/lib/db";

function result(message: string, ok = false): never {
  redirect(`/admin?${ok ? "success" : "error"}=${encodeURIComponent(message)}`);
}

export async function createPromoCode(formData: FormData) {
  if (!(await getAdminSession())) result("Accès refusé.");
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const rawLimit = String(formData.get("max_uses") ?? "").trim();
  if (!/^[A-Z0-9_-]{3,30}$/.test(code)) result("Code : 3 à 30 caractères (A-Z, 0-9, _ ou -).");
  let maxUses: number | null = null;
  if (rawLimit !== "") {
    const parsed = Number(rawLimit);
    if (!Number.isSafeInteger(parsed) || parsed < 1) result("La limite doit être un entier positif.");
    maxUses = parsed;
  }
  try {
    const sql = getDb();
    await sql`
      INSERT INTO public.promo_codes (code, is_active, max_uses, uses_count)
      VALUES (${code}, true, ${maxUses}, 0)
    `;
  } catch (error) {
    const dbError = error as { code?: string };
    result(dbError.code === "23505" ? "Ce code existe déjà." : "Création impossible.");
  }
  revalidatePath("/admin");
  result("Code créé.", true);
}

export async function togglePromoCode(formData: FormData) {
  if (!(await getAdminSession())) result("Accès refusé.");
  const code = String(formData.get("code") ?? "");
  const next = String(formData.get("next") ?? "");
  if (!/^[A-Z0-9_-]{3,30}$/.test(code) || !["true", "false"].includes(next)) {
    result("Modification invalide.");
  }
  try {
    const sql = getDb();
    await sql`
      UPDATE public.promo_codes
      SET is_active = ${next === "true"}
      WHERE code = ${code}
    `;
  } catch {
    result("Modification impossible.");
  }
  revalidatePath("/admin");
  result("Statut mis à jour.", true);
}

